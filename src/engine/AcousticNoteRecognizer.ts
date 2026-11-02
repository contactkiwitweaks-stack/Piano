// Acoustic Piano Note & Chord Recognition Engine
// Inspired by Stepkar2004/piano-note-recognition & Aubio DSP
// Real-time polyphonic microphone analysis for acoustic pianos without Bluetooth or USB.

import { MidiManager } from '../midi/MidiManager'

export class AcousticNoteRecognizer {
  private static instance: AcousticNoteRecognizer
  private audioCtx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private micStream: MediaStream | null = null
  private animationFrameId: number | null = null

  private _isListening: boolean = false
  private _inputLevel: number = 0 // 0.0 to 1.0 for UI visualizer
  private activeMidis: Set<number> = new Set()
  private noteHoldTimers: Map<number, number> = new Map()

  // Piano key frequency tables (A0 = 21, C8 = 108)
  private pianoFrequencies: Array<{ midi: number; freq: number; name: string }> = []

  private constructor() {
    const PITCH_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
    for (let midi = 21; midi <= 108; midi++) {
      const freq = 440 * Math.pow(2, (midi - 69) / 12)
      const pitch = PITCH_NAMES[midi % 12]
      const octave = Math.floor(midi / 12) - 1
      this.pianoFrequencies.push({ midi, freq, name: `${pitch}${octave}` })
    }
  }

  public static getInstance(): AcousticNoteRecognizer {
    if (!AcousticNoteRecognizer.instance) {
      AcousticNoteRecognizer.instance = new AcousticNoteRecognizer()
    }
    return AcousticNoteRecognizer.instance
  }

  public get isListening(): boolean {
    return this._isListening
  }

  public get inputLevel(): number {
    return this._inputLevel
  }

  /**
   * Starts listening through microphone for piano notes and chords
   */
  public async startListening(): Promise<boolean> {
    if (this._isListening) return true

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.audioCtx = new AudioCtxClass({ latencyHint: 'interactive' })
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume()
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone access is not supported in this environment.')
        return false
      }

      // Try with low-latency acoustic piano constraints, fallback to { audio: true } if iOS rejects constraints
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        })
      } catch {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      }

      const source = this.audioCtx.createMediaStreamSource(this.micStream)
      this.analyser = this.audioCtx.createAnalyser()
      this.analyser.fftSize = 4096 // 4096 gives ~10.7 Hz frequency bin resolution at 44.1kHz
      this.analyser.smoothingTimeConstant = 0.4
      source.connect(this.analyser)

      this._isListening = true
      this.processLoop()
      return true
    } catch (err: unknown) {
      console.error('Failed to access microphone for acoustic note recognition:', err)
      const msg = err instanceof Error ? err.message : String(err)
      alert(`Microphone permission error: ${msg}. Please ensure microphone access is enabled in iOS Settings > Virtuoso Piano.`)
      this.stopListening()
      return false
    }
  }

  /**
   * Stops listening
   */
  public stopListening(): void {
    this._isListening = false
    this._inputLevel = 0

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop())
      this.micStream = null
    }

    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {})
      this.audioCtx = null
    }

    // Release any lingering acoustic notes
    this.activeMidis.forEach((midi) => {
      MidiManager.getInstance().simulateNoteOff(midi)
    })
    this.activeMidis.clear()
    this.noteHoldTimers.clear()
  }

  private processLoop = () => {
    if (!this._isListening || !this.analyser || !this.audioCtx) return

    const bufferLength = this.analyser.frequencyBinCount
    const freqData = new Float32Array(bufferLength)
    const timeData = new Float32Array(this.analyser.fftSize)

    this.analyser.getFloatFrequencyData(freqData)
    this.analyser.getFloatTimeDomainData(timeData)

    // 1. Calculate RMS Audio Input Level
    let sumSquares = 0
    for (let i = 0; i < timeData.length; i++) {
      sumSquares += timeData[i] * timeData[i]
    }
    const rms = Math.sqrt(sumSquares / timeData.length)
    this._inputLevel = Math.min(1.0, rms * 8)

    // Noise threshold: ignore background silence
    if (rms > 0.012) {
      const sampleRate = this.audioCtx.sampleRate
      const detectedMidis = this.detectChordsAndNotes(freqData, timeData, sampleRate)

      // Sync detected notes into MidiManager
      const now = Date.now()
      detectedMidis.forEach((midi) => {
        if (!this.activeMidis.has(midi)) {
          this.activeMidis.add(midi)
          const velocity = Math.min(115, Math.max(65, Math.round(rms * 240)))
          MidiManager.getInstance().simulateNoteOn(midi, velocity)
        }
        this.noteHoldTimers.set(midi, now + 380) // Hold note for 380ms sustain window
      })

      // Expire released notes
      this.activeMidis.forEach((midi) => {
        const expireTime = this.noteHoldTimers.get(midi) || 0
        if (now > expireTime && !detectedMidis.has(midi)) {
          this.activeMidis.delete(midi)
          this.noteHoldTimers.delete(midi)
          MidiManager.getInstance().simulateNoteOff(midi)
        }
      })
    } else {
      // Below threshold: release active notes
      const now = Date.now()
      this.activeMidis.forEach((midi) => {
        const expireTime = this.noteHoldTimers.get(midi) || 0
        if (now > expireTime) {
          this.activeMidis.delete(midi)
          this.noteHoldTimers.delete(midi)
          MidiManager.getInstance().simulateNoteOff(midi)
        }
      })
    }

    this.animationFrameId = requestAnimationFrame(this.processLoop)
  }

  /**
   * Polyphonic & Monophonic Piano Recognition Algorithm
   * Identifies prominent fundamental piano frequencies using Harmonic Product Spectrum & peak picking
   */
  private detectChordsAndNotes(freqData: Float32Array, timeData: Float32Array, sampleRate: number): Set<number> {
    const results = new Set<number>()
    const binSize = sampleRate / (freqData.length * 2)

    // Calculate average noise floor
    let noiseFloorSum = 0
    let count = 0
    for (let i = 10; i < Math.min(freqData.length, 600); i++) {
      if (freqData[i] > -100) {
        noiseFloorSum += freqData[i]
        count++
      }
    }
    const avgNoiseFloor = count > 0 ? noiseFloorSum / count : -75
    const peakThreshold = Math.max(-58, avgNoiseFloor + 12)

    // 1. Polyphonic Peak Extraction across Piano Fundamentals
    const candidateNotes: Array<{ midi: number; power: number }> = []

    for (const p of this.pianoFrequencies) {
      if (p.freq < 55 || p.freq > 2100) continue // Core piano practice range (A1 to C7)

      const targetBin = Math.round(p.freq / binSize)
      if (targetBin <= 1 || targetBin >= freqData.length - 2) continue

      // Look at immediate neighborhood of the expected fundamental bin
      let localMax = -120
      for (let b = targetBin - 1; b <= targetBin + 1; b++) {
        if (freqData[b] > localMax) localMax = freqData[b]
      }

      if (localMax > peakThreshold) {
        // Harmonic verification: Check 2nd harmonic (octave) to suppress overtone confusion
        const harmonic2Bin = Math.round((p.freq * 2) / binSize)
        let harmonic2Power = -120
        if (harmonic2Bin < freqData.length) {
          harmonic2Power = Math.max(freqData[harmonic2Bin - 1], freqData[harmonic2Bin], freqData[harmonic2Bin + 1])
        }

        // Salience score: fundamental prominence + harmonic reinforcement
        const salience = localMax + (harmonic2Power > peakThreshold ? 6 : 0)
        candidateNotes.push({ midi: p.midi, power: salience })
      }
    }

    // Sort candidate notes by prominence
    candidateNotes.sort((a, b) => b.power - a.power)

    // 2. Filter out harmonic duplicates (e.g. if C4 is played, suppress C5 unless C5 has independent strong energy)
    for (let i = 0; i < Math.min(candidateNotes.length, 4); i++) {
      const cand = candidateNotes[i]
      let isHarmonicOfLowerNote = false

      for (const acceptedMidi of results) {
        // If an octave higher (12 semitones) or 12th higher (19 semitones) with lower power, it's likely an overtone
        if ((cand.midi === acceptedMidi + 12 || cand.midi === acceptedMidi + 19) && cand.power < 0) {
          isHarmonicOfLowerNote = true
          break
        }
      }

      if (!isHarmonicOfLowerNote) {
        results.add(cand.midi)
      }
    }

    // 3. Fallback Monophonic YIN / Autocorrelation for ultra-clean single notes
    if (results.size === 0) {
      const monoPitch = this.detectMonophonicYin(timeData, sampleRate)
      if (monoPitch > 60 && monoPitch < 2500) {
        const closestMidi = Math.round(69 + 12 * Math.log2(monoPitch / 440))
        if (closestMidi >= 21 && closestMidi <= 108) {
          results.add(closestMidi)
        }
      }
    }

    return results
  }

  /**
   * Fast time-domain autocorrelation for accurate monophonic pitch detection
   */
  private detectMonophonicYin(timeData: Float32Array, sampleRate: number): number {
    const size = timeData.length
    const maxLag = Math.floor(sampleRate / 60) // Min 60Hz
    const minLag = Math.floor(sampleRate / 2200) // Max 2200Hz

    let bestR = 0
    let bestLag = -1

    for (let lag = minLag; lag <= maxLag; lag++) {
      let r = 0
      for (let i = 0; i < size - lag; i++) {
        r += timeData[i] * timeData[i + lag]
      }
      if (r > bestR && r > 0.35) {
        bestR = r
        bestLag = lag
      }
    }

    if (bestLag > 0) {
      return sampleRate / bestLag
    }
    return -1
  }
}
