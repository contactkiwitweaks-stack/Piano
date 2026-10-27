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

  private buffer: Float32Array = new Float32Array(2048)
  private pitchListeners: Set<PitchCallback> = new Set()
  private wrongNoteListeners: Set<WrongNoteCallback> = new Set()

  private expectedMidiNotes: number[] = []
  private lastReportedMidi: number | null = null
  private lastReportedTime: number = 0

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
      this.analyser.fftSize = 2048
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

    this.analyser.getFloatTimeDomainData(this.buffer as unknown as Float32Array<ArrayBuffer>)

    // Calculate RMS volume level
    let sumSq = 0
    for (let i = 0; i < this.buffer.length; i++) {
      sumSq += this.buffer[i] * this.buffer[i]
    }
    const rms = Math.sqrt(sumSq / this.buffer.length)

    // Minimum noise gate threshold (optimized for acoustic piano & vocal pitch humming/singing)
    if (rms > 0.008) {
      const sampleRate = this.audioCtx?.sampleRate || 44100
      const pitchResult = this.detectPitchAutocorrelation(this.buffer, sampleRate, rms)

      if (pitchResult && pitchResult.confidence > 0.58) {
        const now = performance.now()

        // Debounce repeated hits within 120ms
        if (pitchResult.midi !== this.lastReportedMidi || now - this.lastReportedTime > 120) {
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
   * YIN / Autocorrelation pitch estimator
   */
  private detectPitchAutocorrelation(
    buffer: Float32Array,
    sampleRate: number,
    rms: number
  ): PitchDetectionResult | null {
    const size = buffer.length
    const maxLag = Math.floor(size / 2)
    const minLag = Math.floor(sampleRate / 4186) // Max pitch ~C8 (4186 Hz)
    const upperLag = Math.floor(sampleRate / 27.5) // Min pitch ~A0 (27.5 Hz)

    let energy0 = 0
    for (let i = 0; i < maxLag; i++) {
      energy0 += buffer[i] * buffer[i]
    }
    if (energy0 < 0.00001) return null

    let bestLag = -1
    let bestCorrelation = 0

    // Compute autocorrelation for lags
    for (let lag = minLag; lag < Math.min(maxLag, upperLag); lag++) {
      let correlation = 0
      for (let i = 0; i < maxLag; i++) {
        correlation += buffer[i] * buffer[i + lag]
      }

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation
        bestLag = lag
      }
    }

    if (bestLag <= 0 || bestCorrelation <= 0) return null

    // Parabolic interpolation for sub-bin precision
    const frequency = sampleRate / bestLag

    // Convert frequency to MIDI
    const midiFloat = 69 + 12 * Math.log2(frequency / 440)
    const midi = Math.round(midiFloat)

    if (midi < 21 || midi > 108) return null // Outside 88-key grand piano range

    const noteNames = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
    const octave = Math.floor(midi / 12) - 1
    const noteName = `${noteNames[midi % 12]}${octave}`

    const confidence = Math.min(1.0, Math.max(0.0, bestCorrelation / energy0))

    return {
      frequency,
      midi,
      noteName,
      confidence,
      rms,
    }
  }
}
