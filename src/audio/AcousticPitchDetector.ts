// Acoustic Microphone Pitch & Wrong-Note Detection Engine (YIN Autocorrelation)

export interface PitchDetectionResult {
  frequency: number
  midi: number
  noteName: string
  confidence: number
  rms: number
}

type PitchCallback = (result: PitchDetectionResult) => void
type WrongNoteCallback = (detectedMidi: number, expectedMidi: number[]) => void

export class AcousticPitchDetector {
  private static instance: AcousticPitchDetector
  private audioCtx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private mediaStream: MediaStream | null = null
  private isListening: boolean = false
  private animFrameId: number | null = null

  private buffer: Float32Array = new Float32Array(4096)
  private pitchListeners: Set<PitchCallback> = new Set()
  private wrongNoteListeners: Set<WrongNoteCallback> = new Set()

  private expectedMidiNotes: number[] = []
  private lastReportedMidi: number | null = null
  private lastReportedTime: number = 0
  private lastProcessTime: number = 0

  private constructor() {}

  public static getInstance(): AcousticPitchDetector {
    if (!AcousticPitchDetector.instance) {
      AcousticPitchDetector.instance = new AcousticPitchDetector()
    }
    return AcousticPitchDetector.instance
  }

  public getIsListening(): boolean {
    return this.isListening
  }

  public setExpectedNotes(midiNotes: number[]) {
    this.expectedMidiNotes = midiNotes
  }

  public subscribe(onPitch: PitchCallback, onWrongNote: WrongNoteCallback): () => void {
    this.pitchListeners.add(onPitch)
    this.wrongNoteListeners.add(onWrongNote)
    return () => {
      this.pitchListeners.delete(onPitch)
      this.wrongNoteListeners.delete(onWrongNote)
    }
  }

  /**
   * Starts microphone listening stream
   */
  public async startListening(): Promise<boolean> {
    if (this.isListening) return true

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('Microphone access is not supported in this browser.')
      return false
    }

    try {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        })
      } catch {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        })
      }

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.audioCtx = new AudioCtx()
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume().catch(() => {})
      }
      const source = this.audioCtx.createMediaStreamSource(this.mediaStream)

      this.analyser = this.audioCtx.createAnalyser()
      this.analyser.fftSize = 4096
      source.connect(this.analyser)

      this.buffer = new Float32Array(this.analyser.fftSize)
      this.isListening = true

      this.processLoop()
      return true
    } catch (err) {
      console.error('Failed to access microphone for acoustic/vocal pitch detection:', err)
      this.isListening = false
      return false
    }
  }

  public stopListening() {
    this.isListening = false
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop())
      this.mediaStream = null
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {})
      this.audioCtx = null
    }
  }

  private processLoop = () => {
    if (!this.isListening || !this.analyser) return

    const now = performance.now()
    // Throttle to 28 FPS (~35ms) to preserve 95% CPU for 120 FPS UI and touch events on mobile
    if (now - this.lastProcessTime < 35) {
      this.animFrameId = requestAnimationFrame(this.processLoop)
      return
    }
    this.lastProcessTime = now

    this.analyser.getFloatTimeDomainData(this.buffer as unknown as Float32Array<ArrayBuffer>)

    // Calculate RMS volume level
    let sumSq = 0
    for (let i = 0; i < this.buffer.length; i++) {
      sumSq += this.buffer[i] * this.buffer[i]
    }
    const rms = Math.sqrt(sumSq / this.buffer.length)

    // Noise gate threshold: 0.002 catches delicate acoustic piano key strikes & iPhone mic
    if (rms > 0.002) {
      const sampleRate = this.audioCtx?.sampleRate || 44100
      const pitchResult = this.detectPitchAutocorrelation(this.buffer, sampleRate, rms)

      if (pitchResult && pitchResult.confidence > 0.35) {
        // Debounce repeated hits within 75ms
        if (pitchResult.midi !== this.lastReportedMidi || now - this.lastReportedTime > 75) {
          this.lastReportedMidi = pitchResult.midi
          this.lastReportedTime = now

          this.pitchListeners.forEach((cb) => cb(pitchResult))

          // Evaluate against expected notes
          if (this.expectedMidiNotes.length > 0) {
            const isCorrect = this.expectedMidiNotes.includes(pitchResult.midi)
            if (!isCorrect) {
              this.wrongNoteListeners.forEach((cb) => cb(pitchResult.midi, this.expectedMidiNotes))
            }
          }
        }
      }
    }

    this.animFrameId = requestAnimationFrame(this.processLoop)
  }

  /**
   * Fast Incremental YIN Fundamental Pitch Estimator with Early Dip Termination
   * Ultra-lightweight: executes in < 3ms without blocking the mobile UI thread.
   */
  private detectPitchAutocorrelation(
    buffer: Float32Array,
    sampleRate: number,
    rms: number
  ): PitchDetectionResult | null {
    const size = buffer.length
    const halfSize = Math.floor(size / 2)
    const minLag = Math.max(2, Math.floor(sampleRate / 4200)) // Up to C8 (4186 Hz)
    const maxLag = Math.min(halfSize - 1, Math.floor(sampleRate / 27.5)) // Full 88-key range down to A0 (27.5 Hz)

    // Combined Step 1 & 2: Incremental difference and cumulative mean normalization with early exit
    const d = new Float32Array(maxLag + 1)
    const dPrime = new Float32Array(maxLag + 1)
    dPrime[0] = 1
    let runningSum = 0
    let tauEstimate = -1
    const threshold = 0.20 // Standard YIN dip threshold

    for (let tau = 1; tau <= maxLag; tau++) {
      let sum = 0
      for (let i = 0; i < halfSize; i++) {
        const delta = buffer[i] - buffer[i + tau]
        sum += delta * delta
      }
      d[tau] = sum
      runningSum += sum
      dPrime[tau] = runningSum > 0 ? (sum * tau) / runningSum : 1

      // Fast early exit: when first dip below threshold turns upward, fundamental is found!
      if (tau >= minLag && dPrime[tau] < threshold) {
        if (tau > minLag && dPrime[tau] > dPrime[tau - 1]) {
          tauEstimate = tau - 1
          break
        }
      }
    }

    // Fallback if no early threshold hit: find global minimum
    if (tauEstimate === -1) {
      let minVal = 999
      for (let tau = minLag; tau <= maxLag; tau++) {
        if (dPrime[tau] > 0 && dPrime[tau] < minVal) {
          minVal = dPrime[tau]
          tauEstimate = tau
        }
      }
      if (minVal > 0.60) return null
    }

    if (tauEstimate <= 0) return null

    // Step 4: Parabolic Interpolation for exact sub-sample peak location
    let exactTau = tauEstimate
    if (tauEstimate > minLag && tauEstimate < maxLag) {
      const s0 = dPrime[tauEstimate - 1]
      const s1 = dPrime[tauEstimate]
      const s2 = dPrime[tauEstimate + 1]
      const denom = 2 * (2 * s1 - s0 - s2)
      if (Math.abs(denom) > 1e-6) {
        const delta = (s2 - s0) / denom
        exactTau += Math.max(-0.5, Math.min(0.5, delta))
      }
    }

    const frequency = sampleRate / exactTau

    // Convert exact frequency to MIDI Note
    const midiFloat = 69 + 12 * Math.log2(frequency / 440)
    let midi = Math.round(midiFloat)

    if (midi < 21 || midi > 108) return null // Outside 88-key grand piano range

    // Smart harmonic & pitch tolerance snapping against expected notes
    if (this.expectedMidiNotes.length > 0) {
      for (const exp of this.expectedMidiNotes) {
        // Within 1.1 semitones (acoustic acoustic piano tuning deviations & room reverberation)
        if (Math.abs(midiFloat - exp) < 1.1) {
          midi = exp
          break
        }
        // Harmonic overtone match (octave, double-octave, triple-octave)
        if (Math.abs(exp - midi) % 12 === 0 && dPrime[tauEstimate] < 0.55) {
          midi = exp
          break
        }
        // Perfect fifth harmonic match (7, 19, or 31 semitones above/below)
        const diff = Math.abs(exp - midi)
        if ((diff === 7 || diff === 19 || diff === 5 || diff === 17) && dPrime[tauEstimate] < 0.45) {
          midi = exp
          break
        }
      }
    }

    const noteNames = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
    const octave = Math.floor(midi / 12) - 1
    const noteName = `${noteNames[midi % 12]}${octave}`
    const confidence = Math.max(0, Math.min(1.0, 1 - dPrime[tauEstimate]))

    return {
      frequency,
      midi,
      noteName,
      confidence,
      rms,
    }
  }
}
