// High-Definition Acoustic Piano Note & Chord Recognition Engine
// Flowkey-grade multi-pitch estimation, Global Peak McLeod Pitch Method (NSDF),
// Local Spectral Peak Verification, Dynamic Headroom Gating,
// Harmonic Energy Summation with Inharmonicity Compensation,
// Multi-Frame Temporal Debouncing, and Target-Informed Bayesian Prior Matching.

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

  // Multi-frame temporal debounce map to eliminate random 1-frame acoustic spikes
  private candidateDetectionFrames: Map<number, number> = new Map()

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
      this.analyser.smoothingTimeConstant = 0.20 // Fast responsiveness to piano hammer strikes
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

    // Never close shared AudioContext
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
    this.candidateDetectionFrames.clear()
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

    // Silence gating threshold: ignore ambient room whisper and background noise
    if (rms > 0.008) {
      const sampleRate = this.audioCtx.sampleRate
      const rawDetectedMidis = this.detectChordsAndNotes(freqData, timeData, sampleRate)
      const confirmedMidis = new Set<number>()

      // Multi-Frame Temporal Debounce & Confirmation
      // Eliminates erratic single-frame acoustic spikes & hammer click transients
      for (const midi of rawDetectedMidis) {
        const count = (this.candidateDetectionFrames.get(midi) || 0) + 1
        this.candidateDetectionFrames.set(midi, count)

        // Confirmed if persisted across >= 2 consecutive frames (~30-40ms),
        // OR immediately confirmed if matching an active target note in wait mode!
        if (count >= 2 || (this.targetNotes.has(midi) && count >= 1)) {
          confirmedMidis.add(midi)
        }
      }

      // Decay counts for notes no longer detected
      for (const [midi, count] of this.candidateDetectionFrames.entries()) {
        if (!rawDetectedMidis.has(midi)) {
          if (count <= 1) {
            this.candidateDetectionFrames.delete(midi)
          } else {
            this.candidateDetectionFrames.set(midi, count - 1)
          }
        }
      }

      // Sync confirmed notes into MidiManager
      confirmedMidis.forEach((midi) => {
        if (!this.activeMidis.has(midi)) {
          this.activeMidis.add(midi)
          const velocity = Math.min(118, Math.max(70, Math.round(rms * 260)))
          MidiManager.getInstance().simulateNoteOn(midi, velocity)
        }
        // Sustained note hold window: 280ms hold prevents jittery note cut-offs
        this.noteHoldTimers.set(midi, now + 280)
      })

      // Expire released notes
      this.activeMidis.forEach((midi) => {
        const expireTime = this.noteHoldTimers.get(midi) || 0
        if (now > expireTime && !confirmedMidis.has(midi)) {
          this.activeMidis.delete(midi)
          this.noteHoldTimers.delete(midi)
          MidiManager.getInstance().simulateNoteOff(midi)
        }
      })
    } else {
      // Below audio threshold: decay candidate detection counts and expire active notes
      this.candidateDetectionFrames.clear()
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
   * Flowkey-Grade Multi-Pitch Estimation & Noise Rejection:
   * 1. Monophonic Global-Peak McLeod Pitch Method (NSDF) with Subharmonic & Octave Resolution
   * 2. Target-Informed Bayesian Prior Matching
   * 3. Local Spectral Peak Verification + Dynamic Headroom Gating + Systematic Overtone Cancellation
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

    // Helper: Verify that target frequency corresponds to an authentic local spectral peak (not a flat slope or noise)
    const isLocalSpectralPeak = (targetFreq: number): boolean => {
      const b0 = Math.round(targetFreq / binSize)
      if (b0 <= 2 || b0 >= freqData.length - 3) return false
      const c = freqData[b0]
      const l1 = freqData[b0 - 1]
      const r1 = freqData[b0 + 1]
      const l2 = freqData[b0 - 2]
      const r2 = freqData[b0 + 2]
      // Must be local maximum and at least 2.5 dB above surrounding background
      return c >= l1 && c >= r1 && c > Math.min(l2, r2) + 2.5
    }

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
      const score = e1 * 0.48 + e2 * 0.24 + e3 * 0.14 + e4 * 0.09 + e5 * 0.05
      return { fundamental: e1, score }
    }

    // -------------------------------------------------------------
    // STAGE 1: GLOBAL-PEAK MCLEOD PITCH METHOD (NSDF) FOR SINGLE KEYS
    // -------------------------------------------------------------
    // Evaluates all peaks in time-domain NSDF to find true fundamental without octave traps
    const monoResult = this.detectMcLeodPitch(timeData, sampleRate)
    if (monoResult.clarity > 0.72 && monoResult.freq > 55 && monoResult.freq < 2500) {
      const closestMidi = Math.round(69 + 12 * Math.log2(monoResult.freq / 440))
      if (closestMidi >= 21 && closestMidi <= 108) {
        const standardFreq = 440 * Math.pow(2, (closestMidi - 69) / 12)
        const centDiff = Math.abs(1200 * Math.log2(monoResult.freq / standardFreq))
        if (centDiff <= 40) {
          // Verify fundamental is physically active in spectrum
          if (isLocalSpectralPeak(standardFreq)) {
            results.add(closestMidi)
            // Clean, unambiguous single key strike: return immediately without triggering overtone accumulation!
            return results
          }
        }
      }
    }

    // -------------------------------------------------------------
    // STAGE 2: TARGET-INFORMED BAYESIAN PRIOR MATCHING (Flowkey Core Feature)
    // -------------------------------------------------------------
    // If practicing a piece and waiting for specific notes, verify target notes first
    if (this.targetNotes.size > 0) {
      let matchedTargets = 0
      this.targetNotes.forEach((targetMidi) => {
        const p = this.pianoFrequencies.find((item) => item.midi === targetMidi)
        if (!p) return

        if (isLocalSpectralPeak(p.freq)) {
          const { fundamental, score } = computeHarmonicScore(p.freq)
          const snr = score - avgNoiseFloor
          const fundamentalSnr = fundamental - avgNoiseFloor

          // Robust threshold for target note confirmation
          if (snr > 14 && fundamentalSnr > 11) {
            results.add(targetMidi)
            matchedTargets++
          }
        }
      })

      // If all expected target notes are matched, return directly
      if (matchedTargets > 0 && matchedTargets >= this.targetNotes.size) {
        return results
      }
    }

    // -------------------------------------------------------------
    // STAGE 3: POLYPHONIC SPECTRAL PEELING & HARMONIC CANCELLATION
    // -------------------------------------------------------------
    // Evaluates local peaks only, sorts by descending energy, gates within 15 dB dynamic range,
    // and suppresses all integer harmonic multiples to prevent random false notes across octaves.
    const candidateNotes: Array<{ midi: number; score: number; fundamental: number; freq: number }> = []
    let maxCandidateFundamental = -120

    for (const p of this.pianoFrequencies) {
      if (p.freq < 65 || p.freq > 2600) continue
      // Note must be a physical local spectral peak
      if (!isLocalSpectralPeak(p.freq)) continue

      const { fundamental, score } = computeHarmonicScore(p.freq)
      const snr = score - avgNoiseFloor
      const fundamentalSnr = fundamental - avgNoiseFloor

      // Strict SNR threshold (prevents distant random room noise notes)
      if (snr > 16 && fundamentalSnr > 13) {
        candidateNotes.push({ midi: p.midi, score, fundamental, freq: p.freq })
        if (fundamental > maxCandidateFundamental) {
          maxCandidateFundamental = fundamental
        }
      }
    }

    // GATING: Keep only candidates within 15 dB of the loudest note
    // In genuine piano chords, hands strike keys at comparable dynamic levels.
    // Anything 16+ dB weaker is resonance, bleed, or room noise!
    const viableCandidates = candidateNotes.filter(
      (c) => c.fundamental >= maxCandidateFundamental - 15
    )

    // Sort descending by fundamental loudness (loudest acoustic note first for spectral peeling)
    viableCandidates.sort((a, b) => b.fundamental - a.fundamental)

    const acceptedCandidates: Array<{ midi: number; score: number; fundamental: number; freq: number }> = []

    for (const cand of viableCandidates) {
      let isHarmonicOfAccepted = false

      for (const accepted of acceptedCandidates) {
        // Frequency ratio test: check if candidate is near any integer harmonic multiple (2x, 3x, 4x, 5x, 6x)
        const ratio = cand.freq / accepted.freq
        const nearestHarmonic = Math.round(ratio)

        if (nearestHarmonic >= 2 && nearestHarmonic <= 6) {
          const expectedFreq = accepted.freq * nearestHarmonic
          const centDiff = Math.abs(1200 * Math.log2(cand.freq / expectedFreq))

          // Within harmonic tolerance window (45 cents)
          if (centDiff <= 45) {
            // Only accept if candidate fundamental is significantly louder than expected from harmonic decay
            if (cand.fundamental < accepted.fundamental - 4) {
              isHarmonicOfAccepted = true
              break
            }
          }
        }

        // Sub-harmonic check (e.g. phantom lower octave / third)
        const subRatio = accepted.freq / cand.freq
        const nearestSub = Math.round(subRatio)
        if (nearestSub >= 2 && nearestSub <= 4) {
          const expectedSub = cand.freq * nearestSub
          const centDiff = Math.abs(1200 * Math.log2(accepted.freq / expectedSub))
          if (centDiff <= 45) {
            if (cand.fundamental < accepted.fundamental - 8) {
              isHarmonicOfAccepted = true
              break
            }
          }
        }
      }

      if (!isHarmonicOfAccepted) {
        acceptedCandidates.push(cand)
        results.add(cand.midi)
        // Acoustic piano chord polyphony cap per hand strike (max 4 concurrent notes)
        if (acceptedCandidates.length >= 4) break
      }
    }

    return results
  }

  /**
   * Complete McLeod Pitch Method (NSDF) with Global Peak Search & Subharmonic Protection:
   * Prevents octave-jumping and high-harmonic false positive locks.
   */
  private detectMcLeodPitch(
    timeData: Float32Array,
    sampleRate: number
  ): { freq: number; clarity: number } {
    const size = 2048
    if (timeData.length < size) return { freq: -1, clarity: 0 }

    const maxLag = Math.floor(sampleRate / 60) // 60 Hz (~B1)
    const minLag = Math.floor(sampleRate / 2400) // 2400 Hz (~D7)

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

    // Find all positive local maxima (peaks)
    interface NsdfPeak {
      lag: number
      clarity: number
    }
    const peaks: NsdfPeak[] = []
    let maxClarity = 0

    for (let lag = minLag + 1; lag < maxLag - 1; lag++) {
      if (
        nsdf[lag] > 0.35 &&
        nsdf[lag] >= nsdf[lag - 1] &&
        nsdf[lag] >= nsdf[lag + 1]
      ) {
        // Parabolic 3-point interpolation around the peak
        const alpha = nsdf[lag - 1]
        const beta = nsdf[lag]
        const gamma = nsdf[lag + 1]
        const denominator = alpha - 2 * beta + gamma
        let refinedLag = lag
        if (Math.abs(denominator) > 0.00001) {
          refinedLag = lag + (0.5 * (alpha - gamma)) / denominator
        }

        peaks.push({ lag: refinedLag, clarity: beta })
        if (beta > maxClarity) maxClarity = beta
      }
    }

    if (peaks.length === 0 || maxClarity < 0.65) {
      return { freq: -1, clarity: 0 }
    }

    // Select the fundamental period: find the largest lag (lowest pitch)
    // whose clarity is within 85% of the absolute maximum peak (McLeod rule)
    const cutoff = Math.max(0.65, maxClarity * 0.85)
    let chosenPeak: NsdfPeak | null = null

    // Iterate backwards from lowest frequency (largest lag)
    for (let i = peaks.length - 1; i >= 0; i--) {
      if (peaks[i].clarity >= cutoff) {
        chosenPeak = peaks[i]
        break
      }
    }

    if (!chosenPeak) {
      chosenPeak = peaks.reduce((best, p) => (p.clarity > best.clarity ? p : best), peaks[0])
    }

    const freq = sampleRate / chosenPeak.lag
    return { freq, clarity: chosenPeak.clarity }
  }
}
