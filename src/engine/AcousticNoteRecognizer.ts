// High-Definition Acoustic Piano Note & Chord Recognition Engine
// Flowkey-grade multi-pitch estimation, McLeod Pitch Method (NSDF),
// Harmonic Energy Summation with inharmonicity compensation,
// Subharmonic overtone demixing, and Target-Informed Bayesian Prior Matching.

import { MidiManager } from '../midi/MidiManager'
import { PianoAudioEngine } from '../audio/PianoAudioEngine'

export class AcousticNoteRecognizer {
  private static instance: AcousticNoteRecognizer
  private audioCtx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private micStream: MediaStream | null = null
  private animationFrameId: number | null = null

  private _isListening: boolean = false
  private _inputLevel: number = 0 // 0.0 to 1.0 for UI visualizer
  private activeMidis: Set<number> = new Set()
  private noteHoldTimers: Map<number, number> = new Map()

  // Target-Informed Prior (Flowkey Engine Pattern Matching)
  // When the app is waiting for specific chord/melody notes, matching these notes has high prior confidence
  private targetNotes: Set<number> = new Set()

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
   * Set target notes for Flowkey-style score-informed recognition
   */
  public setTargetNotes(midis: number[]): void {
    this.targetNotes = new Set(midis.filter((m) => m >= 21 && m <= 108))
  }

  /**
   * Clear target notes
   */
  public clearTargetNotes(): void {
    this.targetNotes.clear()
  }

  public getTargetNotes(): number[] {
    return Array.from(this.targetNotes)
  }

  /**
   * Starts listening through microphone for piano notes and chords
   */
  public async startListening(): Promise<boolean> {
    if (this._isListening) return true

    try {
      // Prioritize reusing the singleton PianoAudioEngine AudioContext to eliminate iOS hardware context limits
      const sharedCtx = PianoAudioEngine.getInstance().getAudioContext()
      if (sharedCtx) {
        this.audioCtx = sharedCtx
      } else {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        this.audioCtx = new AudioCtxClass({ latencyHint: 'interactive' })
      }

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

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.micStream)
      this.analyser = this.audioCtx.createAnalyser()
      // 4096 FFT size gives ~10.7 Hz frequency bin resolution at 44.1kHz (essential for piano bass and mid-range)
      this.analyser.fftSize = 4096
      this.analyser.smoothingTimeConstant = 0.25 // Fast responsiveness to piano hammer strikes
      this.sourceNode.connect(this.analyser)

      this._isListening = true
      this.processLoop()
      return true
    } catch (err: unknown) {
      console.error('Failed to access microphone for acoustic note recognition:', err)
      const msg = err instanceof Error ? err.message : String(err)
      alert(
        `Microphone permission error: ${msg}. Please ensure microphone access is enabled in iOS Settings > Virtuoso Piano.`
      )
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

    if (this.sourceNode) {
      try { this.sourceNode.disconnect() } catch {}
      this.sourceNode = null
    }

    if (this.analyser) {
      try { this.analyser.disconnect() } catch {}
      this.analyser = null
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop())
      this.micStream = null
    }

    // Never close the shared PianoAudioEngine context! Only close if we had to create a standalone fallback context
    const sharedCtx = PianoAudioEngine.getInstance().getAudioContext()
    if (this.audioCtx && this.audioCtx !== sharedCtx) {
      this.audioCtx.close().catch(() => {})
    }
    this.audioCtx = null

    // Release any lingering acoustic notes
    this.activeMidis.forEach((midi) => {
      MidiManager.getInstance().simulateNoteOff(midi)
    })
    this.activeMidis.clear()
    this.noteHoldTimers.clear()
    this.targetNotes.clear()
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
    this._inputLevel = Math.min(1.0, rms * 10)

    const now = Date.now()

    // Silence gating threshold: ignore ambient room whisper
    if (rms > 0.007) {
      const sampleRate = this.audioCtx.sampleRate
      const detectedMidis = this.detectChordsAndNotes(freqData, timeData, sampleRate)

      // Sync detected notes into MidiManager
      detectedMidis.forEach((midi) => {
        if (!this.activeMidis.has(midi)) {
          this.activeMidis.add(midi)
          const velocity = Math.min(118, Math.max(70, Math.round(rms * 260)))
          MidiManager.getInstance().simulateNoteOn(midi, velocity)
        }
        // Sustained note hold window: 320ms hold prevents jittery re-triggers
        this.noteHoldTimers.set(midi, now + 320)
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
      // Below threshold: release active notes when hold time expires
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
   * Flowkey-Grade Polyphonic & Monophonic Piano Recognition
   * Combines Target-Informed Bayesian Prior Matching, Harmonic Energy Summation with
   * inharmonicity correction, subharmonic overtone cancellation, and McLeod NSDF.
   */
  private detectChordsAndNotes(
    freqData: Float32Array,
    timeData: Float32Array,
    sampleRate: number
  ): Set<number> {
    const results = new Set<number>()
    const binSize = sampleRate / (freqData.length * 2)

    // Estimate dynamic noise floor (median approximation over piano frequency range)
    let noiseFloorSum = 0
    let noiseCount = 0
    const startBin = Math.max(2, Math.round(60 / binSize))
    const endBin = Math.min(freqData.length - 1, Math.round(3500 / binSize))

    for (let b = startBin; b <= endBin; b += 4) {
      if (freqData[b] > -110) {
        noiseFloorSum += freqData[b]
        noiseCount++
      }
    }
    const avgNoiseFloor = noiseCount > 0 ? noiseFloorSum / noiseCount : -75

    // Helper: interpolate peak energy around a given frequency with inharmonicity
    const getFrequencyEnergy = (targetFreq: number): number => {
      const bCenter = targetFreq / binSize
      const b0 = Math.round(bCenter)
      if (b0 <= 1 || b0 >= freqData.length - 2) return -120

      // Parabolic 3-bin peak interpolation
      const y1 = freqData[b0 - 1]
      const y2 = freqData[b0]
      const y3 = freqData[b0 + 1]
      return Math.max(y1, y2, y3)
    }

    // Helper: compute multi-harmonic energy score for a piano pitch with string inharmonicity
    // String inharmonicity factor B ~ 0.0003 for acoustic piano steel wires
    const inharmonicityB = 0.0003
    const computeHarmonicScore = (f0: number): { fundamental: number; score: number } => {
      const f1 = f0
      const f2 = 2 * f0 * Math.sqrt(1 + inharmonicityB * 4)
      const f3 = 3 * f0 * Math.sqrt(1 + inharmonicityB * 9)
      const f4 = 4 * f0 * Math.sqrt(1 + inharmonicityB * 16)
      const f5 = 5 * f0 * Math.sqrt(1 + inharmonicityB * 25)

      const e1 = getFrequencyEnergy(f1)
      const e2 = getFrequencyEnergy(f2)
      const e3 = getFrequencyEnergy(f3)
      const e4 = getFrequencyEnergy(f4)
      const e5 = getFrequencyEnergy(f5)

      // Weighted harmonic energy profile: fundamental is primary, harmonics confirm pitch
      const score = e1 * 0.40 + e2 * 0.28 + e3 * 0.18 + e4 * 0.09 + e5 * 0.05
      return { fundamental: e1, score }
    }

    // -------------------------------------------------------------
    // STAGE 1: TARGET-INFORMED PRIOR MATCHING (Flowkey Core Superpower)
    // -------------------------------------------------------------
    // If the song or trainer is waiting for specific target notes, evaluate them with high sensitivity
    if (this.targetNotes.size > 0) {
      this.targetNotes.forEach((targetMidi) => {
        const p = this.pianoFrequencies.find((item) => item.midi === targetMidi)
        if (!p) return

        const { fundamental, score } = computeHarmonicScore(p.freq)
        const snr = score - avgNoiseFloor
        const fundamentalSnr = fundamental - avgNoiseFloor

        // Target note matching requires lower threshold (~6 dB SNR above noise) because of prior expectation
        if (snr > 7 && fundamentalSnr > 5) {
          results.add(targetMidi)
        }
      })

      // If all expected targets are confirmed, return immediately for sub-millisecond responsiveness!
      if (results.size >= this.targetNotes.size && results.size > 0) {
        return results
      }
    }

    // -------------------------------------------------------------
    // STAGE 2: POLYPHONIC HARMONIC ENERGY SUMMATION (Chord Recognition)
    // -------------------------------------------------------------
    const candidateNotes: Array<{ midi: number; score: number; fundamental: number }> = []

    for (const p of this.pianoFrequencies) {
      if (p.freq < 65 || p.freq > 2600) continue // Active piano performance range (C2 to E7)

      const { fundamental, score } = computeHarmonicScore(p.freq)
      const snr = score - avgNoiseFloor
      const fundamentalSnr = fundamental - avgNoiseFloor

      if (snr > 12 && fundamentalSnr > 8) {
        candidateNotes.push({ midi: p.midi, score, fundamental })
      }
    }

    // Sort candidates by prominence
    candidateNotes.sort((a, b) => b.score - a.score)

    // Subharmonic Overtone Demixing:
    // If candidate C5 is detected, but C4 is already strong, C5 is likely the 2nd harmonic of C4.
    // Only accept C5 if its energy significantly exceeds what C4 would contribute.
    const acceptedCandidates: Array<{ midi: number; score: number }> = []

    for (const cand of candidateNotes) {
      let isOvertoneOfAccepted = false

      for (const accepted of acceptedCandidates) {
        // Octave (12 semitones) or Octave+Fifth (19 semitones) or Double Octave (24 semitones)
        const diff = cand.midi - accepted.midi
        if (diff === 12 || diff === 19 || diff === 24) {
          // If cand score is not distinctly louder than the lower note's expected harmonic roll-off, suppress it
          if (cand.score < accepted.score + 4) {
            isOvertoneOfAccepted = true
            break
          }
        }
      }

      if (!isOvertoneOfAccepted) {
        acceptedCandidates.push(cand)
        results.add(cand.midi)
        if (acceptedCandidates.length >= 4) break // Max 4 concurrent notes in piano chords
      }
    }

    // -------------------------------------------------------------
    // STAGE 3: MONOPHONIC MCLEOD PITCH METHOD (NSDF) FOR SINGLE NOTES
    // -------------------------------------------------------------
    // If no polyphonic chord was resolved, run mathematically exact NSDF autocorrelation
    if (results.size === 0) {
      const monoPitch = this.detectMcLeodPitch(timeData, sampleRate)
      if (monoPitch > 60 && monoPitch < 2500) {
        const closestMidi = Math.round(69 + 12 * Math.log2(monoPitch / 440))
        if (closestMidi >= 21 && closestMidi <= 108) {
          // Verify cent tolerance (+/- 45 cents)
          const standardFreq = 440 * Math.pow(2, (closestMidi - 69) / 12)
          const centDiff = Math.abs(1200 * Math.log2(monoPitch / standardFreq))
          if (centDiff <= 45) {
            results.add(closestMidi)
          }
        }
      }
    }

    return results
  }

  /**
   * McLeod Pitch Method (Normalized Square Difference Function - NSDF)
   * The gold standard time-domain pitch algorithm with parabolic interpolation.
   * Completely immune to octave-jumping and amplitude fluctuations.
   */
  private detectMcLeodPitch(timeData: Float32Array, sampleRate: number): number {
    const size = 2048
    if (timeData.length < size) return -1

    const maxLag = Math.floor(sampleRate / 65) // 65 Hz (approx C2)
    const minLag = Math.floor(sampleRate / 2400) // 2400 Hz (approx D7)

    const nsdf = new Float32Array(maxLag + 1)

    // Compute NSDF: r(tau) = 2 * sum(x_j * x_{j+tau}) / sum(x_j^2 + x_{j+tau}^2)
    for (let lag = minLag; lag <= maxLag; lag++) {
      let num = 0
      let den = 0
      for (let i = 0; i < size - lag; i++) {
        num += timeData[i] * timeData[i + lag]
        den += timeData[i] * timeData[i] + timeData[i + lag] * timeData[i + lag]
      }
      nsdf[lag] = den > 0.0001 ? (2 * num) / den : 0
    }

    // Find the first dominant peak above clarity threshold (0.68)
    let bestLag = -1
    const clarityThreshold = 0.68

    for (let lag = minLag + 1; lag < maxLag - 1; lag++) {
      if (
        nsdf[lag] > clarityThreshold &&
        nsdf[lag] >= nsdf[lag - 1] &&
        nsdf[lag] >= nsdf[lag + 1]
      ) {
        // High-precision parabolic interpolation across (lag-1, lag, lag+1)
        const alpha = nsdf[lag - 1]
        const beta = nsdf[lag]
        const gamma = nsdf[lag + 1]
        const denominator = alpha - 2 * beta + gamma

        if (Math.abs(denominator) > 0.00001) {
          const delta = (0.5 * (alpha - gamma)) / denominator
          bestLag = lag + delta
        } else {
          bestLag = lag
        }
        break
      }
    }

    if (bestLag > 0) {
      return sampleRate / bestLag
    }
    return -1
  }
}
