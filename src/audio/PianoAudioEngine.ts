// High-Definition Salamander Concert Grand Piano Engine
// Features real acoustic multi-sampled Yamaha C5 Concert Grand audio buffers,
// true continuous CC64 damper pedal modeling with acoustic felt damping,
// sub-millisecond Web Audio timeline scheduling, and multi-harmonic synth fallback.

export interface SampleMapEntry {
  midi: number
  file: string
  buffer: AudioBuffer | null
}

const SAMPLE_FILES: { midi: number; name: string }[] = [
  { midi: 21, name: 'A0' },
  { midi: 24, name: 'C1' },
  { midi: 27, name: 'Ds1' },
  { midi: 30, name: 'Fs1' },
  { midi: 33, name: 'A1' },
  { midi: 36, name: 'C2' },
  { midi: 39, name: 'Ds2' },
  { midi: 42, name: 'Fs2' },
  { midi: 45, name: 'A2' },
  { midi: 48, name: 'C3' },
  { midi: 51, name: 'Ds3' },
  { midi: 54, name: 'Fs3' },
  { midi: 57, name: 'A3' },
  { midi: 60, name: 'C4' }, // Middle C
  { midi: 63, name: 'Ds4' },
  { midi: 66, name: 'Fs4' },
  { midi: 69, name: 'A4' }, // Concert A (440Hz)
  { midi: 72, name: 'C5' },
  { midi: 75, name: 'Ds5' },
  { midi: 78, name: 'Fs5' },
  { midi: 81, name: 'A5' },
  { midi: 84, name: 'C6' },
  { midi: 87, name: 'Ds6' },
  { midi: 90, name: 'Fs6' },
  { midi: 93, name: 'A6' },
  { midi: 96, name: 'C7' },
  { midi: 99, name: 'Ds7' },
  { midi: 102, name: 'Fs7' },
  { midi: 105, name: 'A7' },
  { midi: 108, name: 'C8' },
]

interface ActiveVoice {
  id: number
  midi: number
  sourceNode?: AudioBufferSourceNode
  gainNode: GainNode
  oscillators?: OscillatorNode[]
  startTime: number
  released: boolean
  pedaled: boolean
}

export type ReverbMode = 'off' | 'studio' | 'hall' | 'cathedral'
export type VelocityCurveType = 'light' | 'normal' | 'heavy'

export class PianoAudioEngine {
  private static instance: PianoAudioEngine
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private dryGain: GainNode | null = null
  private wetGain: GainNode | null = null
  private convolver: ConvolverNode | null = null
  private soundboardFilter: BiquadFilterNode | null = null
  private unaCordaFilter: BiquadFilterNode | null = null
  private unaCordaGain: GainNode | null = null
  private isUnaCorda: boolean = false
  private mechanicalNoiseEnabled: boolean = true
  private masterTuningHz: number = 440
  private samples: Map<number, AudioBuffer> = new Map()
  private isLoadingSamples: boolean = false
  private samplesLoaded: boolean = false
  private isMuted: boolean = false
  private isPedalDown: boolean = false
  private currentPedalDepth: number = 0

  private reverbMode: ReverbMode = 'hall'
  private metronomeVolume: number = 0.8
  private velocityCurve: VelocityCurveType = 'normal'

  private voiceIdCounter: number = 1
  private activeVoices: Map<number, ActiveVoice> = new Map()

  private constructor() {}

  public static getInstance(): PianoAudioEngine {
    if (!PianoAudioEngine.instance) {
      PianoAudioEngine.instance = new PianoAudioEngine()
    }
    return PianoAudioEngine.instance
  }

  public init() {
    if (this.ctx) return
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.ctx = new AudioCtx({ latencyHint: 'interactive' })

    // Acoustic soundboard body warmth filter (warm spruce wood resonance)
    this.soundboardFilter = this.ctx.createBiquadFilter()
    this.soundboardFilter.type = 'lowpass'
    this.soundboardFilter.frequency.setValueAtTime(14000, this.ctx.currentTime)
    this.soundboardFilter.Q.setValueAtTime(0.7, this.ctx.currentTime)

    // Una Corda (Soft Pedal CC67) acoustic filter & intimate attenuation
    this.unaCordaFilter = this.ctx.createBiquadFilter()
    this.unaCordaFilter.type = 'lowpass'
    this.unaCordaFilter.frequency.setValueAtTime(14000, this.ctx.currentTime)

    this.unaCordaGain = this.ctx.createGain()
    this.unaCordaGain.gain.setValueAtTime(1.0, this.ctx.currentTime)

    // Master, Dry, and Wet Reverb Gains
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime)

    this.dryGain = this.ctx.createGain()
    this.dryGain.gain.setValueAtTime(1.0, this.ctx.currentTime)

    this.wetGain = this.ctx.createGain()
    this.wetGain.gain.setValueAtTime(0.22, this.ctx.currentTime) // default 22% concert hall acoustic bloom

    this.convolver = this.ctx.createConvolver()
    this.convolver.buffer = this.generateImpulseResponse(2.2, 2.4)

    // Routing: soundboardFilter -> unaCordaFilter -> unaCordaGain -> dryGain -> masterGain
    //                                                             -> convolver -> wetGain -> masterGain
    //          masterGain -> destination
    this.soundboardFilter.connect(this.unaCordaFilter)
    this.unaCordaFilter.connect(this.unaCordaGain)

    this.unaCordaGain.connect(this.dryGain)
    this.unaCordaGain.connect(this.convolver)
    this.convolver.connect(this.wetGain)

    this.dryGain.connect(this.masterGain)
    this.wetGain.connect(this.masterGain)
    this.masterGain.connect(this.ctx.destination)

    this.loadSamples()
  }

  /**
   * Procedural acoustic concert hall impulse response generator
   */
  private generateImpulseResponse(durationSec: number = 2.0, decayRate: number = 2.5): AudioBuffer | null {
    if (!this.ctx) return null
    const sampleRate = this.ctx.sampleRate
    const length = Math.floor(sampleRate * durationSec)
    const impulse = this.ctx.createBuffer(2, length, sampleRate)
    const left = impulse.getChannelData(0)
    const right = impulse.getChannelData(1)

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate
      const envelope = Math.exp(-decayRate * t)
      const damping = Math.exp(-t * 1.5)
      const noiseL = (Math.random() * 2 - 1) * damping
      const noiseR = (Math.random() * 2 - 1) * damping
      left[i] = noiseL * envelope
      right[i] = noiseR * envelope
    }
    return impulse
  }

  public setReverbMode(mode: ReverbMode) {
    this.reverbMode = mode
    if (!this.wetGain || !this.ctx || !this.convolver) return
    const now = this.ctx.currentTime

    switch (mode) {
      case 'off':
        this.wetGain.gain.setValueAtTime(0.0, now)
        break
      case 'studio':
        this.convolver.buffer = this.generateImpulseResponse(0.9, 4.5)
        this.wetGain.gain.setValueAtTime(0.12, now)
        break
      case 'hall':
        this.convolver.buffer = this.generateImpulseResponse(2.2, 2.4)
        this.wetGain.gain.setValueAtTime(0.24, now)
        break
      case 'cathedral':
        this.convolver.buffer = this.generateImpulseResponse(3.8, 1.6)
        this.wetGain.gain.setValueAtTime(0.38, now)
        break
    }
  }

  public getReverbMode(): ReverbMode {
    return this.reverbMode
  }

  public setVelocityCurve(curve: VelocityCurveType) {
    this.velocityCurve = curve
  }

  public getVelocityCurve(): VelocityCurveType {
    return this.velocityCurve
  }

  public applyVelocityCurve(vel: number): number {
    const norm = Math.max(0, Math.min(1, vel / 127))
    let mapped = norm
    if (this.velocityCurve === 'light') {
      mapped = Math.pow(norm, 0.72)
    } else if (this.velocityCurve === 'heavy') {
      mapped = Math.pow(norm, 1.45)
    }
    return Math.round(mapped * 127)
  }

  public setMetronomeVolume(vol: number) {
    this.metronomeVolume = Math.max(0, Math.min(1, vol))
  }

  public getMetronomeVolume(): number {
    return this.metronomeVolume
  }

  /**
   * Synthesize crisp, authentic metronome woodblock click
   */
  public playMetronomeClick(isDownbeat: boolean = false) {
    if (this.isMuted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const clickGain = this.ctx.createGain()

    // Downbeat: higher woodblock pitch (1700 Hz), offbeats: 1100 Hz
    osc.frequency.setValueAtTime(isDownbeat ? 1700 : 1100, now)
    osc.type = 'sine'

    const peakVolume = (isDownbeat ? 0.38 : 0.22) * this.metronomeVolume
    clickGain.gain.setValueAtTime(peakVolume, now)
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + (isDownbeat ? 0.038 : 0.024))

    osc.connect(clickGain)
    clickGain.connect(this.masterGain || this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.045)
  }

  public async unlockAudio(): Promise<boolean> {
    this.init()
    if (!this.ctx) return false
    try {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume()
      }
      // Mandatory iOS WebKit audio graph unlock: play 1-sample silent buffer synchronously
      const silentBuf = this.ctx.createBuffer(1, 1, 22050)
      const src = this.ctx.createBufferSource()
      src.buffer = silentBuf
      src.connect(this.ctx.destination)
      src.start(0)
    } catch {}
    return this.ctx.state === 'running'
  }

  /**
   * Load and decode all 30 concert grand piano samples
   */
  public async loadSamples() {
    if (this.isLoadingSamples || this.samplesLoaded || !this.ctx) return
    this.isLoadingSamples = true

    try {
      const loadPromises = SAMPLE_FILES.map(async ({ midi, name }) => {
        try {
          let resp = await fetch(`/samples/piano/${name}.mp3`)
          if (!resp.ok) {
            resp = await fetch(`./samples/piano/${name}.mp3`)
          }
          if (!resp.ok) return
          const arrayBuf = await resp.arrayBuffer()
          if (!this.ctx) return
          const audioBuf = await this.ctx.decodeAudioData(arrayBuf)
          this.samples.set(midi, audioBuf)
        } catch {}
      })

      await Promise.all(loadPromises)
      this.samplesLoaded = this.samples.size > 0
    } catch {
      // Gracefully fall back to multi-harmonic synth
    } finally {
      this.isLoadingSamples = false
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.9, this.ctx.currentTime)
    }
  }

  public isMechanicalNoiseEnabled(): boolean {
    return this.mechanicalNoiseEnabled
  }

  public toggleMechanicalNoise(enable?: boolean) {
    this.mechanicalNoiseEnabled = enable !== undefined ? enable : !this.mechanicalNoiseEnabled
  }

  public setMasterTuning(hz: number) {
    this.masterTuningHz = Math.max(430, Math.min(450, hz))
  }

  public getMasterTuning(): number {
    return this.masterTuningHz
  }

  /**
   * Procedural Damper Lift Soundboard "Whoosh" (Authentic Grand Piano Damper Action)
   */
  public playDamperLiftNoise(depth: number) {
    if (!this.mechanicalNoiseEnabled || !this.ctx || this.isMuted) return
    if (depth < 25) return

    const now = this.ctx.currentTime
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.18) // 180ms subtle wooden acoustic breath
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }

    const whiteNoise = this.ctx.createBufferSource()
    whiteNoise.buffer = noiseBuffer

    // Bandpass filter centered at 280 Hz simulating the spruce soundboard displacement
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(280, now)
    filter.Q.setValueAtTime(1.8, now)

    const noiseGain = this.ctx.createGain()
    const intensity = (depth / 127) * 0.08
    noiseGain.gain.setValueAtTime(0.001, now)
    noiseGain.gain.exponentialRampToValueAtTime(intensity, now + 0.035)
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)

    whiteNoise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.soundboardFilter || this.ctx.destination)

    whiteNoise.start(now)
  }

  /**
   * Key Release Felt Damping Acoustic Transient (Damper dropping back onto string)
   */
  public playKeyReleaseAcoustic(midi: number) {
    if (!this.mechanicalNoiseEnabled || !this.ctx || this.isMuted) return
    const now = this.ctx.currentTime

    // Damper thump frequency correlates inversely with string register
    const centerFreq = Math.min(750, Math.max(120, 850 - (midi - 21) * 7.5))
    const osc = this.ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(centerFreq, now)
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.035)

    const releaseGain = this.ctx.createGain()
    releaseGain.gain.setValueAtTime(0.022, now)
    releaseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035)

    osc.connect(releaseGain)
    releaseGain.connect(this.soundboardFilter || this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.04)
  }

  /**
   * Continuous Soft Pedal (Una Corda CC67: 0 - 127)
   */
  public setSoftPedal(depth: number) {
    if (!this.ctx || !this.unaCordaFilter || !this.unaCordaGain) return
    const now = this.ctx.currentTime
    this.isUnaCorda = depth >= 32

    const targetFreq = this.isUnaCorda ? 6800 : 14000 // Veiled romantic coloration
    const targetGain = this.isUnaCorda ? 0.78 : 1.0   // 2.2dB delicate attenuation

    this.unaCordaFilter.frequency.setTargetAtTime(targetFreq, now, 0.04)
    this.unaCordaGain.gain.setTargetAtTime(targetGain, now, 0.04)
  }

  public isPedalActive(): boolean {
    return this.isPedalDown
  }

  public getPedalDepth(): number {
    return this.currentPedalDepth
  }

  /**
   * Continuous CC64 Damper Pedal (0 to 127)
   * Real-time acoustic string sustain and felt damper dissipation.
   */
  public setDamperPedal(depth: number) {
    if (this.currentPedalDepth === depth) return
    const wasPedalDown = this.isPedalDown
    this.currentPedalDepth = depth
    this.isPedalDown = depth >= 30

    // Trigger acoustic damper lift whoosh when pedal is depressed
    if (!wasPedalDown && this.isPedalDown) {
      this.playDamperLiftNoise(depth)
    }

    // When pedal is released (felt dampers drop onto released strings)
    if (wasPedalDown && !this.isPedalDown && this.ctx) {
      const now = this.ctx.currentTime
      this.activeVoices.forEach((voice, id) => {
        // ONLY damp notes that have actually been released by the pianist's fingers!
        // If a key is still physically held down (!voice.released), the damper remains raised.
        if (voice.released) {
          try {
            voice.gainNode.gain.cancelScheduledValues(now)
            // Use setTargetAtTime for natural, click-free 60ms acoustic felt damping
            voice.gainNode.gain.setTargetAtTime(0.0001, now, 0.06)

            setTimeout(() => {
              if (voice.sourceNode) {
                try { voice.sourceNode.stop() } catch {}
              }
              if (voice.oscillators) {
                voice.oscillators.forEach((osc) => {
                  try { osc.stop() } catch {}
                })
              }
              this.activeVoices.delete(id)
            }, 320)
          } catch {
            this.activeVoices.delete(id)
          }
        } else {
          // Key is still physically held down by hand, so clear the pedaled flag
          voice.pedaled = false
        }
      })
    }
  }

  private findClosestSample(targetMidi: number): { midi: number; buffer: AudioBuffer } | null {
    if (this.samples.size === 0) return null

    let closestMidi = -1
    let minDistance = 999

    for (const [sMidi] of this.samples.entries()) {
      const dist = Math.abs(targetMidi - sMidi)
      if (dist < minDistance) {
        minDistance = dist
        closestMidi = sMidi
      }
    }

    if (closestMidi !== -1 && this.samples.has(closestMidi)) {
      return { midi: closestMidi, buffer: this.samples.get(closestMidi)! }
    }
    return null
  }

  /**
   * Play Acoustic Grand Piano Note immediately (keyboard / MIDI touch)
   */
  public noteOn(midi: number, velocity: number = 80): number {
    if (this.isMuted) return 0
    this.init()
    if (!this.ctx || !this.soundboardFilter) return 0
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }

    const now = this.ctx.currentTime
    const normVel = Math.max(0.1, Math.min(1.0, velocity / 127))
    const dynamicVolume = Math.pow(normVel, 1.35) * 0.95

    // Damp previous voice of the exact same pitch to prevent muddy phase buildup and distortion
    this.activeVoices.forEach((v, vId) => {
      if (v.midi === midi && !v.released) {
        v.released = true
        try {
          v.gainNode.gain.cancelScheduledValues(now)
          v.gainNode.gain.setValueAtTime(Math.max(0.0001, v.gainNode.gain.value), now)
          v.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.035)
          setTimeout(() => {
            if (v.sourceNode) {
              try { v.sourceNode.stop() } catch {}
            }
            this.activeVoices.delete(vId)
          }, 45)
        } catch {
          this.activeVoices.delete(vId)
        }
      }
    })

    const voiceGain = this.ctx.createGain()
    voiceGain.gain.setValueAtTime(dynamicVolume, now)
    voiceGain.connect(this.soundboardFilter)

    const voiceId = this.voiceIdCounter++
    const sample = this.findClosestSample(midi)

    if (sample) {
      const source = this.ctx.createBufferSource()
      source.buffer = sample.buffer
      const semitoneShift = midi - sample.midi
      source.playbackRate.setValueAtTime(Math.pow(2, semitoneShift / 12), now)
      source.connect(voiceGain)
      source.start(now)

      this.activeVoices.set(voiceId, {
        id: voiceId,
        midi,
        sourceNode: source,
        gainNode: voiceGain,
        startTime: now,
        released: false,
        pedaled: this.isPedalDown,
      })
    } else {
      // Fallback: Multi-harmonic synthesis with master concert tuning
      const f0 = this.masterTuningHz * Math.pow(2, (midi - 69) / 12)
      const oscillators: OscillatorNode[] = []
      const partials = [
        { n: 1, type: 'sine' as OscillatorType, amp: 1.0, decay: 4.5 },
        { n: 2, type: 'sine' as OscillatorType, amp: 0.5, decay: 3.0 },
        { n: 3, type: 'triangle' as OscillatorType, amp: 0.25, decay: 2.0 },
        { n: 4, type: 'sine' as OscillatorType, amp: 0.12, decay: 1.2 },
      ]

      partials.forEach((p) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        osc.type = p.type
        osc.frequency.setValueAtTime(p.n * f0, now)

        const pGain = this.ctx.createGain()
        pGain.gain.setValueAtTime(0.0001, now)
        pGain.gain.linearRampToValueAtTime(p.amp * 0.7, now + 0.004)
        pGain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay)

        osc.connect(pGain)
        pGain.connect(voiceGain)
        osc.start(now)
        oscillators.push(osc)
      })

      this.activeVoices.set(voiceId, {
        id: voiceId,
        midi,
        oscillators,
        gainNode: voiceGain,
        startTime: now,
        released: false,
        pedaled: this.isPedalDown,
      })
    }

    return voiceId
  }

  /**
   * Note Off: If damper pedal is active, voice continues singing!
   * Otherwise, felt damper drops onto string with 220ms acoustic dissipation.
   */
  public noteOff(midi: number) {
    if (!this.ctx) return
    const now = this.ctx.currentTime

    // Find active voice for this MIDI key
    this.activeVoices.forEach((voice, id) => {
      if (voice.midi === midi && !voice.released) {
        voice.released = true

        // If damper pedal is currently down, string continues singing!
        if (this.isPedalDown) {
          voice.pedaled = true
          return
        }

        // Play subtle acoustic felt damper drop transient
        this.playKeyReleaseAcoustic(midi)

        try {
          voice.gainNode.gain.cancelScheduledValues(now)
          voice.gainNode.gain.setTargetAtTime(0.0001, now, 0.05)

          setTimeout(() => {
            if (voice.sourceNode) {
              try { voice.sourceNode.stop() } catch {}
            }
            if (voice.oscillators) {
              voice.oscillators.forEach((osc) => {
                try { osc.stop() } catch {}
              })
            }
            this.activeVoices.delete(id)
          }, 280)
        } catch {
          this.activeVoices.delete(id)
        }
      }
    })
  }

  /**
   * Schedule note for piece playback with true continuous damper pedal sustain
   */
  public scheduleNote(midi: number, velocity: number, durationSec: number, delaySec: number = 0) {
    if (this.isMuted) return
    this.init()
    if (!this.ctx || !this.soundboardFilter) return

    const now = this.ctx.currentTime
    const startTime = now + Math.max(0, delaySec)
    const normVel = Math.max(0.1, Math.min(1.0, velocity / 127))
    const dynamicVolume = Math.pow(normVel, 1.35) * 0.95

    const voiceGain = this.ctx.createGain()
    voiceGain.gain.setValueAtTime(dynamicVolume, startTime)
    voiceGain.connect(this.soundboardFilter)

    const voiceId = this.voiceIdCounter++
    const sample = this.findClosestSample(midi)

    if (sample) {
      const source = this.ctx.createBufferSource()
      source.buffer = sample.buffer
      const semitoneShift = midi - sample.midi
      source.playbackRate.setValueAtTime(Math.pow(2, semitoneShift / 12), startTime)
      source.connect(voiceGain)
      source.start(startTime)

      const voice: ActiveVoice = {
        id: voiceId,
        midi,
        sourceNode: source,
        gainNode: voiceGain,
        startTime,
        released: false,
        pedaled: this.isPedalDown,
      }
      this.activeVoices.set(voiceId, voice)

      // Schedule natural key release at (startTime + durationSec)
      const releaseTimeMs = Math.max(50, (delaySec + durationSec) * 1000)
      setTimeout(() => {
        voice.released = true
        // If pedal is currently held, voice keeps singing!
        if (this.isPedalDown) {
          voice.pedaled = true
          return
        }

        if (this.ctx) {
          const tNow = this.ctx.currentTime
          try {
            voiceGain.gain.cancelScheduledValues(tNow)
            voiceGain.gain.setTargetAtTime(0.0001, tNow, 0.05)
            setTimeout(() => {
              try { source.stop() } catch {}
              this.activeVoices.delete(voiceId)
            }, 280)
          } catch {
            this.activeVoices.delete(voiceId)
          }
        }
      }, releaseTimeMs)
    } else {
      // Fallback
      this.noteOn(midi, velocity)
      setTimeout(() => {
        this.noteOff(midi)
      }, durationSec * 1000)
    }
  }

  /**
   * Stop all active sounds immediately
   */
  public stopAllVoices() {
    if (!this.ctx) return
    const now = this.ctx.currentTime
    this.activeVoices.forEach((voice) => {
      try {
        voice.gainNode.gain.cancelScheduledValues(now)
        voice.gainNode.gain.setValueAtTime(0.0001, now)
        if (voice.sourceNode) {
          try { voice.sourceNode.stop() } catch {}
        }
        if (voice.oscillators) {
          voice.oscillators.forEach((o) => {
            try { o.stop() } catch {}
          })
        }
      } catch {}
    })
    this.activeVoices.clear()
  }
}
