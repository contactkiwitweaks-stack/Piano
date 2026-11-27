// Roland LX-9 Bluetooth Conservatory Piano Teacher Engine
// Analyzes sub-millisecond MIDI attack velocity, Note Off release velocity, key hold depth,
// chord synchronization (flam vs. rolled), tempo/rubato curve, RH-vs-LH voicing balance,
// emotional dynamic arc, and continuous CC64 Half-Pedal / CC67 Una Corda craftsmanship.

import type { NoteEvent, Piece } from '../types/music'
import type { LanguageCode } from '../i18n/translations'
import { BALLADE_NO1_RUBRIC, type PhraseRubric } from '../data/balladeTeacherRubric'
import { ScoreEngine } from './ScoreEngine'

export interface RecordedStroke {
  id: string
  midi: number
  noteName: string
  attackVelocity: number // 1–127 (Key Press Speed & Loudness!)
  releaseVelocity: number // 0–127 (Key Release Speed from Roland LX-9 Note Off!)
  onsetPerfMs: number
  offsetPerfMs: number | null
  holdDurationMs: number | null
  scoreTimeSec: number
  damperAtOnset: number // CC64 0–127
  damperAtOffset: number | null
  softPedalAtOnset: number // CC67 0–127
  matchedNoteId: string | null
  matchedMeasure: number
  matchedBeat: number
  matchedHand: 'left' | 'right' | null
  matchedVoice: 1 | 2 | null
  expectedDurationSec: number | null
  expectedVelocity: number | null
  timingOffsetMs: number | null // negative = early (rushed), positive = late (dragged)
  isExtraNote: boolean
}

export interface RecordedPedalSample {
  perfMs: number
  scoreTimeSec: number
  measure: number
  cc: 64 | 67
  value: number // 0–127
}

export interface TeacherMistake {
  id: string
  measure: number
  beat: number
  timestampSec: number
  type:
    | 'wrong-key'
    | 'missed-note'
    | 'early'
    | 'late'
    | 'flat-dynamics'
    | 'muddy-pedal'
    | 'harsh-attack'
    | 'weak-melody'
    | 'clipped-legato'
    | 'hand-desync'
    | 'abrupt-release'
  expectedNoteName?: string
  playedNoteName?: string
  timingOffsetMs?: number
  velocity?: number
  description: string
}

export interface PracticePrescription {
  priority: 1 | 2 | 3
  category: 'voicing' | 'touch' | 'timing' | 'pedal' | 'dynamics' | 'pitch'
  measureRange: [number, number]
  title: string
  diagnosis: string
  howToFix: string
  metricBadge: string
}

export interface PhraseCritique {
  id: string
  measureRange: [number, number]
  title: string
  score: number // 0–100
  status: 'mastered' | 'good' | 'needs-work' | 'critical'
  avgMelodyVel: number | null
  avgAccompVel: number | null
  voicingLead: number | null
  avgTimingOffsetMs: number
  tempoVerdict: 'steady' | 'rushing' | 'dragging' | 'rubato'
  avgHoldRatioPct: number
  avgPedalDepth: number
  critiquePoints: string[]
  touchTip: string
}

export interface MeasureTelemetry {
  measure: number
  notesTotal: number
  notesHit: number
  notesMissed: number
  extraNotes: number
  avgMelodyVel: number | null
  avgAccompVel: number | null
  avgTimingOffsetMs: number
  chordSpreadMs: number | null
  avgHoldRatioPct: number | null
  avgReleaseVel: number | null
  maxPedalDepth: number
  status: 'excellent' | 'solid' | 'attention' | 'critical'
  teacherNote: string
}

export interface TouchPhysicsSummary {
  avgMelodyVel: number
  avgAccompVel: number
  voicingLeadVel: number
  minVel: number
  maxVel: number
  dynamicSpan: number
  dynamicStdDev: number
  harshFastAttacksCount: number
  weakGhostNotesCount: number
  cantabileControlledPct: number
  avgHoldRatioPct: number
  clippedLegatoCount: number
  gluedOverlapCount: number
  avgReleaseVelocity: number
  abruptReleasesCount: number
  avgChordSpreadMs: number
  handDesyncCount: number
  tempoTrend: 'steady' | 'rushing' | 'dragging' | 'expressive-rubato'
  avgSignedTimingMs: number
  avgPedalDepth: number
  halfPedalPct: number
  muddyPedalChangesCount: number
  syncopatedPedalPct: number
  unaCordaUsed: boolean
}

export interface TeacherCompetitionReport {
  isRolandBluetoothVerified: boolean
  isDemoPreview?: boolean
  deviceName: string
  examMeasureRange: [number, number]
  score: number
  maxPossibleScore: number
  maxCombo: number
  totalNotes: number
  notesHit: number
  notesMissed: number
  extraNotesCount: number
  accuracyPercent: number
  averageTimingErrorMs: number
  // 6 Conservatory Pillars (0–100)
  pitchScore: number
  timingRubatoScore: number
  emotionDynamicsScore: number
  voicingScore: number
  touchArticulationScore: number
  pedalScore: number
  // Legacy compatibility fields
  dynamicRatingPercent: number
  pedalRatingPercent: number
  grade: 'S+' | 'S' | 'A' | 'B' | 'C' | 'D'
  headlineVerdict: string
  overallTeacherLetter: string
  touchPhysics: TouchPhysicsSummary
  topPrescriptions: PracticePrescription[]
  phraseCritiques: PhraseCritique[]
  measureBreakdowns: MeasureTelemetry[]
  mistakes: TeacherMistake[]
  problemMeasures: [number, number]
}

export interface LiveTouchFeedback {
  dynamicLabel: 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff'
  velocity: number
  attackFeel: 'slow-cantabile' | 'balanced' | 'fast-percussive' | 'too-soft'
  voicingLead: number | null
  damperDepth: number
  pedalZone: 'dry' | 'half-pedal' | 'full'
  coachHint: string | null
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = mean(arr)
  return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length)
}

export class PianoTeacherSession {
  private strokes: RecordedStroke[] = []
  private openStrokesByMidi: Map<number, RecordedStroke> = new Map()
  private pedalSamples: RecordedPedalSample[] = []
  private missedNotes: NoteEvent[] = []
  private currentDamper = 0
  private currentSoftPedal = 0
  private recentRhVels: number[] = []
  private recentLhVels: number[] = []
  private combo = 0
  private maxCombo = 0
  private scorePoints = 0
  private examRange: [number, number] = [1, 26]

  public reset(examRange: [number, number]) {
    this.strokes = []
    this.openStrokesByMidi.clear()
    this.pedalSamples = []
    this.missedNotes = []
    this.recentRhVels = []
    this.recentLhVels = []
    this.combo = 0
    this.maxCombo = 0
    this.scorePoints = 0
    this.examRange = examRange
  }

  public getExamRange(): [number, number] {
    return this.examRange
  }

  public recordPedal(cc: 64 | 67, value: number, scoreTimeSec: number, measure: number) {
    if (cc === 64) this.currentDamper = value
    else this.currentSoftPedal = value
    this.pedalSamples.push({
      perfMs: performance.now(),
      scoreTimeSec,
      measure,
      cc,
      value,
    })
  }

  public recordMissedNote(note: NoteEvent) {
    this.missedNotes.push(note)
    this.combo = 0
  }

  public recordNoteOn(
    midi: number,
    velocity: number,
    scoreTimeSec: number,
    matchedNote: NoteEvent | null,
    fallbackMeasure: number,
    language: LanguageCode
  ): {
    score: number
    combo: number
    judgment: { text: string; color: string; offsetMs?: number }
    liveTouch: LiveTouchFeedback
  } {
    const now = performance.now()
    const timingOffsetMs = matchedNote
      ? Math.round((scoreTimeSec - matchedNote.startTime) * 1000)
      : null

    const stroke: RecordedStroke = {
      id: `st-${now}-${midi}-${Math.random().toString(36).slice(2, 6)}`,
      midi,
      noteName: matchedNote?.noteName || ScoreEngine.midiToNoteName(midi),
      attackVelocity: velocity,
      releaseVelocity: 40,
      onsetPerfMs: now,
      offsetPerfMs: null,
      holdDurationMs: null,
      scoreTimeSec,
      damperAtOnset: this.currentDamper,
      damperAtOffset: null,
      softPedalAtOnset: this.currentSoftPedal,
      matchedNoteId: matchedNote ? matchedNote.id : null,
      matchedMeasure: matchedNote ? matchedNote.measure : fallbackMeasure,
      matchedBeat: matchedNote?.beat || 1,
      matchedHand: matchedNote ? matchedNote.hand : midi >= 60 ? 'right' : 'left',
      matchedVoice: matchedNote?.voice || 1,
      expectedDurationSec: matchedNote ? matchedNote.duration : null,
      expectedVelocity: matchedNote?.velocity || null,
      timingOffsetMs,
      isExtraNote: !matchedNote,
    }

    this.strokes.push(stroke)
    this.openStrokesByMidi.set(midi, stroke)

    // Track rolling melody vs accompaniment balance
    const isMelody =
      matchedNote
        ? matchedNote.hand === 'right' && (matchedNote.voice ?? 1) === 1
        : midi >= 64
    if (isMelody) {
      this.recentRhVels.push(velocity)
      if (this.recentRhVels.length > 10) this.recentRhVels.shift()
    } else {
      this.recentLhVels.push(velocity)
      if (this.recentLhVels.length > 10) this.recentLhVels.shift()
    }

    let judgment: { text: string; color: string; offsetMs?: number }
    if (matchedNote && timingOffsetMs !== null) {
      this.combo++
      this.maxCombo = Math.max(this.maxCombo, this.combo)
      const absOff = Math.abs(timingOffsetMs)
      const mult = this.combo >= 40 ? 4 : this.combo >= 20 ? 3 : this.combo >= 10 ? 2 : 1
      const basePts = absOff <= 35 ? 1000 : absOff <= 75 ? 750 : absOff <= 135 ? 450 : 200
      this.scorePoints += basePts * mult

      if (absOff <= 35) {
        judgment = { text: 'CANTABILE PERFECT', color: 'text-amber-400', offsetMs: timingOffsetMs }
      } else if (absOff <= 75) {
        judgment = { text: 'EXPRESSIVE', color: 'text-emerald-400', offsetMs: timingOffsetMs }
      } else if (timingOffsetMs < -75) {
        judgment = {
          text: language === 'de' ? 'ZU SCHNELL (GEHETZT)' : 'RUSHED',
          color: 'text-sky-400',
          offsetMs: timingOffsetMs,
        }
      } else {
        judgment = {
          text: language === 'de' ? 'ZU SPÄT (SCHLEPPEND)' : 'DRAGGED',
          color: 'text-indigo-400',
          offsetMs: timingOffsetMs,
        }
      }
    } else {
      this.combo = 0
      this.scorePoints = Math.max(0, this.scorePoints - 150)
      judgment = {
        text: language === 'de' ? 'FALSCHE TASTE' : 'WRONG KEY',
        color: 'text-rose-400',
      }
    }

    // Build real-time touch physics feedback
    const dynamicLabel: LiveTouchFeedback['dynamicLabel'] =
      velocity < 32
        ? 'pp'
        : velocity < 50
        ? 'p'
        : velocity < 68
        ? 'mp'
        : velocity < 86
        ? 'mf'
        : velocity < 106
        ? 'f'
        : 'ff'

    const attackFeel: LiveTouchFeedback['attackFeel'] =
      velocity >= 104
        ? 'fast-percussive'
        : velocity <= 28
        ? 'too-soft'
        : velocity <= 78
        ? 'slow-cantabile'
        : 'balanced'

    const voicingLead =
      this.recentRhVels.length >= 2 && this.recentLhVels.length >= 2
        ? Math.round(mean(this.recentRhVels) - mean(this.recentLhVels))
        : null

    const pedalZone: LiveTouchFeedback['pedalZone'] =
      this.currentDamper < 20 ? 'dry' : this.currentDamper <= 88 ? 'half-pedal' : 'full'

    let coachHint: string | null = null
    if (voicingLead !== null && voicingLead < 6) {
      coachHint =
        language === 'de'
          ? 'Begleitung zu laut — Melodie stärker singen lassen!'
          : 'Accompaniment overpowering melody — voice RH higher!'
    } else if (!isMelody && velocity > 74 && stroke.matchedMeasure >= 8 && stroke.matchedMeasure <= 26) {
      coachHint =
        language === 'de'
          ? 'Begleitung weicher (langsamere Tastengeschwindigkeit)!'
          : 'Softer accompaniment touch (slower key speed)!'
    } else if (this.currentDamper >= 105 && stroke.matchedMeasure >= 24 && stroke.matchedMeasure <= 25) {
      coachHint =
        language === 'de'
          ? 'Halbpedal (CC64 ~55) in Takt 24–25 für klare Achtel!'
          : 'Use Half-Pedal (CC64 ~55) in M. 24–25 for bass clarity!'
    }

    return {
      score: this.scorePoints,
      combo: this.combo,
      judgment,
      liveTouch: {
        dynamicLabel,
        velocity,
        attackFeel,
        voicingLead,
        damperDepth: this.currentDamper,
        pedalZone,
        coachHint,
      },
    }
  }

  public recordNoteOff(midi: number, releaseVelocity: number = 40, holdDurationMs?: number) {
    const open = this.openStrokesByMidi.get(midi)
    if (!open) return
    const now = performance.now()
    open.offsetPerfMs = now
    open.holdDurationMs = holdDurationMs && holdDurationMs > 0 ? holdDurationMs : Math.max(15, Math.round(now - open.onsetPerfMs))
    open.releaseVelocity = releaseVelocity
    open.damperAtOffset = this.currentDamper
    this.openStrokesByMidi.delete(midi)
  }

  /**
   * Generates the full Conservatory Piano Teacher Evaluation Report from captured Roland LX-9 Bluetooth telemetry.
   */
  public evaluate(
    piece: Piece,
    deviceName: string,
    isRolandBluetoothVerified: boolean,
    language: LanguageCode,
    handMode: 'both' | 'right' | 'left' = 'both'
  ): TeacherCompetitionReport {
    const [startM, endM] = this.examRange
    const isDe = language === 'de'
    const isBallade = piece.id === 'chopin-ballade-1'

    const expectedInScope = piece.notes.filter((n) => {
      if (n.measure < startM || n.measure > endM) return false
      if (handMode === 'right' && n.hand !== 'right') return false
      if (handMode === 'left' && n.hand !== 'left') return false
      return true
    })

    // Close any still-held strokes gracefully
    const now = performance.now()
    this.openStrokesByMidi.forEach((st) => {
      st.offsetPerfMs = now
      st.holdDurationMs = Math.max(40, Math.round(now - st.onsetPerfMs))
      st.damperAtOffset = this.currentDamper
    })

    const matchedStrokes = this.strokes.filter((s) => !s.isExtraNote)
    const extraStrokes = this.strokes.filter((s) => s.isExtraNote)
    const missedInScope = this.missedNotes.filter((n) => n.measure >= startM && n.measure <= endM)

    const hits = matchedStrokes.length
    const misses = missedInScope.length
    const extras = extraStrokes.length
    const totalAttempts = hits + misses + extras
    const accuracyPercent = totalAttempts > 0 ? Math.round((hits / totalAttempts) * 100) : 0

    // --- 1. TIMING, RUBATO & CHORD SYNC ANALYSIS ---
    const signedTimings = matchedStrokes
      .map((s) => s.timingOffsetMs)
      .filter((v): v is number => v !== null)
    const absTimings = signedTimings.map((v) => Math.abs(v))
    const avgTimingErrorMs = absTimings.length > 0 ? Math.round(mean(absTimings)) : 0
    const avgSignedTimingMs = signedTimings.length > 0 ? Math.round(mean(signedTimings)) : 0

    // Group simultaneous score chords to measure unintentional hand flamming/desync
    const chordBuckets = new Map<string, RecordedStroke[]>()
    matchedStrokes.forEach((s) => {
      const bucketKey = `${s.matchedMeasure}:${Math.round(s.matchedBeat * 4)}`
      if (!chordBuckets.has(bucketKey)) chordBuckets.set(bucketKey, [])
      chordBuckets.get(bucketKey)!.push(s)
    })

    const chordSpreads: number[] = []
    let handDesyncCount = 0
    const mistakes: TeacherMistake[] = []

    chordBuckets.forEach((group) => {
      if (group.length < 2) return
      const meas = group[0].matchedMeasure
      // Exclude Chopin Ballade M. 7 which is an intentionally arpeggiated chord!
      if (isBallade && meas === 7) return
      const times = group.map((g) => g.onsetPerfMs)
      const spread = Math.round(Math.max(...times) - Math.min(...times))
      chordSpreads.push(spread)
      if (spread > 48) {
        handDesyncCount++
        mistakes.push({
          id: `desync-${meas}-${group[0].matchedBeat}-${Math.random()}`,
          measure: meas,
          beat: Math.round(group[0].matchedBeat * 10) / 10,
          timestampSec: Math.round(group[0].scoreTimeSec * 10) / 10,
          type: 'hand-desync',
          timingOffsetMs: spread,
          description: isDe
            ? `Akkord/Hände klappen auseinander (${spread} ms Versatz) — Finger gleichzeitig aus dem Handgewicht lösen`
            : `Chord/hands flamming apart (${spread}ms spread) — land together with unified arm drop`,
        })
      }
    })

    const avgChordSpreadMs = chordSpreads.length > 0 ? Math.round(mean(chordSpreads)) : 0
    const timingStd = stdDev(signedTimings)
    const tempoTrend: TouchPhysicsSummary['tempoTrend'] =
      avgSignedTimingMs < -35
        ? 'rushing'
        : avgSignedTimingMs > 40
        ? 'dragging'
        : timingStd >= 28 && avgTimingErrorMs <= 75
        ? 'expressive-rubato'
        : 'steady'

    // --- 2. VOICING BALANCE (MELODY VS ACCOMPANIMENT) & DYNAMICS ---
    const melodyStrokes = matchedStrokes.filter(
      (s) => s.matchedHand === 'right' && (s.matchedVoice ?? 1) === 1
    )
    const accompStrokes = matchedStrokes.filter(
      (s) => s.matchedHand === 'left' || (s.matchedHand === 'right' && s.matchedVoice === 2)
    )
    const allVels = matchedStrokes.map((s) => s.attackVelocity)
    const avgMelodyVel = melodyStrokes.length > 0 ? Math.round(mean(melodyStrokes.map((s) => s.attackVelocity))) : 0
    const avgAccompVel = accompStrokes.length > 0 ? Math.round(mean(accompStrokes.map((s) => s.attackVelocity))) : 0
    const voicingLeadVel = melodyStrokes.length > 0 && accompStrokes.length > 0 ? avgMelodyVel - avgAccompVel : 0
    const minVel = allVels.length > 0 ? Math.min(...allVels) : 0
    const maxVel = allVels.length > 0 ? Math.max(...allVels) : 0
    const dynamicSpan = maxVel - minVel
    const dynamicStdDev = Math.round(stdDev(allVels) * 10) / 10

    // --- 3. TOUCH PHYSICS: FAST/SLAPPED ATTACK VS CANTABILE, HOLD DEPTH, RELEASE VELOCITY ---
    let harshFastAttacksCount = 0
    let weakGhostNotesCount = 0
    let clippedLegatoCount = 0
    let gluedOverlapCount = 0
    let abruptReleasesCount = 0
    const holdRatios: number[] = []
    const releaseVels: number[] = []

    matchedStrokes.forEach((s) => {
      const expectedVel = s.expectedVelocity ?? 70
      const isSoftPassage = expectedVel <= 68 || (isBallade && s.matchedMeasure >= 4 && s.matchedMeasure <= 26)
      const isMelody = s.matchedHand === 'right' && (s.matchedVoice ?? 1) === 1

      if (s.attackVelocity >= (isSoftPassage ? 96 : 114)) {
        harshFastAttacksCount++
        if (mistakes.filter((m) => m.type === 'harsh-attack').length < 10) {
          mistakes.push({
            id: `harsh-${s.id}`,
            measure: s.matchedMeasure,
            beat: Math.round(s.matchedBeat * 10) / 10,
            timestampSec: Math.round(s.scoreTimeSec * 10) / 10,
            type: 'harsh-attack',
            expectedNoteName: s.noteName,
            velocity: s.attackVelocity,
            description: isDe
              ? `Zu schneller/harter Anschlag auf ${s.noteName} (Vel ${s.attackVelocity}) — Klang knallt statt zu singen`
              : `Overly fast/percussive attack on ${s.noteName} (vel ${s.attackVelocity}) — slapped tone instead of singing weight`,
          })
        }
      }

      if (isMelody && s.attackVelocity <= 28) {
        weakGhostNotesCount++
      }

      if (s.holdDurationMs !== null && s.expectedDurationSec !== null && s.expectedDurationSec >= 0.45) {
        const expectedMs = s.expectedDurationSec * 1000
        const ratio = clamp(s.holdDurationMs / expectedMs, 0.1, 2.2)
        holdRatios.push(ratio)
        if (ratio < 0.52 && s.expectedDurationSec >= 0.85) {
          clippedLegatoCount++
          if (mistakes.filter((m) => m.type === 'clipped-legato').length < 10) {
            mistakes.push({
              id: `clip-${s.id}`,
              measure: s.matchedMeasure,
              beat: Math.round(s.matchedBeat * 10) / 10,
              timestampSec: Math.round(s.scoreTimeSec * 10) / 10,
              type: 'clipped-legato',
              expectedNoteName: s.noteName,
              description: isDe
                ? `${s.noteName} zu früh losgelassen (${Math.round(ratio * 100)}% der Notendauer) — Taste bis zum nächsten Ton halten!`
                : `Released ${s.noteName} too early (${Math.round(ratio * 100)}% of notated value) — maintain true finger-legato!`,
            })
          }
        } else if (ratio > 1.45) {
          gluedOverlapCount++
        }
      }

      if (s.releaseVelocity > 0) {
        releaseVels.push(s.releaseVelocity)
        if (s.releaseVelocity >= 88 && (s.expectedDurationSec ?? 0) >= 0.8) {
          abruptReleasesCount++
          if (mistakes.filter((m) => m.type === 'abrupt-release').length < 6) {
            mistakes.push({
              id: `rel-${s.id}`,
              measure: s.matchedMeasure,
              beat: Math.round(s.matchedBeat * 10) / 10,
              timestampSec: Math.round(s.scoreTimeSec * 10) / 10,
              type: 'abrupt-release',
              expectedNoteName: s.noteName,
              description: isDe
                ? `Abruptes Loslassen auf ${s.noteName} (Release-Vel ${s.releaseVelocity}) — Handgelenk weich nach oben abrollen`
                : `Abrupt key release on ${s.noteName} (release vel ${s.releaseVelocity}) — float wrist smoothly off key`,
            })
          }
        }
      }
    })

    const avgHoldRatioPct = holdRatios.length > 0 ? Math.round(mean(holdRatios) * 100) : 86
    const avgReleaseVelocity = releaseVels.length > 0 ? Math.round(mean(releaseVels)) : 42
    const cantabileControlledPct =
      matchedStrokes.length > 0
        ? Math.round(
            ((matchedStrokes.length - harshFastAttacksCount - weakGhostNotesCount) /
              matchedStrokes.length) *
              100
          )
        : 0

    // --- 4. PEDAL CRAFT ANALYSIS (CC64 HALF-PEDAL & CC67 UNA CORDA) ---
    const damperSamples = this.pedalSamples.filter((p) => p.cc === 64)
    const softSamples = this.pedalSamples.filter((p) => p.cc === 67)
    const activeDamperSamples = damperSamples.filter((p) => p.value > 12)
    const avgPedalDepth =
      activeDamperSamples.length > 0 ? Math.round(mean(activeDamperSamples.map((p) => p.value))) : 0
    const halfPedalSamples = activeDamperSamples.filter((p) => p.value >= 25 && p.value <= 88)
    const halfPedalPct =
      activeDamperSamples.length > 0
        ? Math.round((halfPedalSamples.length / activeDamperSamples.length) * 100)
        : 0

    // Detect muddy pedal holds across distinct measures or Ballade harmonic shifts
    let muddyPedalChangesCount = 0
    let pedalClears = 0
    let prevPedalVal = 0
    let continuousHoldStartSec: number | null = null
    let continuousHoldStartMeas = startM

    damperSamples.forEach((p) => {
      if (p.value >= 75 && prevPedalVal < 30) {
        continuousHoldStartSec = p.scoreTimeSec
        continuousHoldStartMeas = p.measure
      } else if (p.value < 25 && prevPedalVal >= 50) {
        pedalClears++
        if (continuousHoldStartSec !== null && p.scoreTimeSec - continuousHoldStartSec > 4.2) {
          if (!(isBallade && continuousHoldStartMeas === 7)) {
            muddyPedalChangesCount++
            mistakes.push({
              id: `muddy-${p.measure}-${p.perfMs}`,
              measure: continuousHoldStartMeas,
              beat: 1,
              timestampSec: Math.round(continuousHoldStartSec * 10) / 10,
              type: 'muddy-pedal',
              description: isDe
                ? `Dämpferpedal über ${(p.scoreTimeSec - continuousHoldStartSec).toFixed(1)}s ohne Reinigung gehalten (CC64 > 75) — Harmonien verschwimmen!`
                : `Damper pedal held ${(p.scoreTimeSec - continuousHoldStartSec).toFixed(1)}s without clearing (CC64 > 75) — harmonies blur!`,
            })
          }
        }
        continuousHoldStartSec = null
      }
      prevPedalVal = p.value
    })

    // Also penalize heavy pedal in Ballade M.1–5 or M.24–25 chromatic bass!
    if (isBallade) {
      const m1to5Heavy = damperSamples.some((p) => p.measure >= 1 && p.measure <= 5 && p.value >= 85)
      if (m1to5Heavy) {
        muddyPedalChangesCount++
        mistakes.push({
          id: 'muddy-bal-lento',
          measure: 2,
          beat: 1,
          timestampSec: 4.0,
          type: 'muddy-pedal',
          description: isDe
            ? 'Zu tiefes Pedal im Lento-Rezitativ (Takt 1–5) — Oktaven verschwimmen statt klar zu deklamieren'
            : 'Excessive pedal in Lento recitative (M. 1–5) — blurs the ascending octaves',
        })
      }
      const m24Heavy = damperSamples.some((p) => p.measure >= 24 && p.measure <= 25 && p.value >= 95)
      if (m24Heavy) {
        muddyPedalChangesCount++
        mistakes.push({
          id: 'muddy-bal-m24',
          measure: 24,
          beat: 1,
          timestampSec: 90.5,
          type: 'muddy-pedal',
          description: isDe
            ? 'Vollpedal (CC64 ≥ 95) auf den chromatischen Bass-Achteln in Takt 24–25 — reduziere auf Halbpedal (CC64 45–65)!'
            : 'Full pedal (CC64 ≥ 95) on M. 24–25 chromatic bass 8ths — lighten to Half-Pedal (CC64 45–65)!',
        })
      }
    }

    const syncopatedPedalPct =
      pedalClears > 0 ? clamp(Math.round(88 - muddyPedalChangesCount * 12), 35, 98) : activeDamperSamples.length > 0 ? 55 : 75
    const unaCordaUsed = softSamples.some((s) => s.value >= 40)

    // Add pitch & timing mistakes from raw strokes/misses (capped for readable log)
    extraStrokes.slice(0, 20).forEach((s) => {
      mistakes.push({
        id: `extra-${s.id}`,
        measure: s.matchedMeasure,
        beat: Math.round(s.matchedBeat * 10) / 10,
        timestampSec: Math.round(s.scoreTimeSec * 10) / 10,
        type: 'wrong-key',
        playedNoteName: s.noteName,
        velocity: s.attackVelocity,
        description: isDe
          ? `Zusätzliche / falsche Taste ${s.noteName} (Vel ${s.attackVelocity})`
          : `Wrong / extra key ${s.noteName} struck (vel ${s.attackVelocity})`,
      })
    })

    missedInScope.slice(0, 25).forEach((n) => {
      mistakes.push({
        id: `miss-${n.id}`,
        measure: n.measure,
        beat: Math.round((n.beat || 1) * 10) / 10,
        timestampSec: Math.round(n.startTime * 10) / 10,
        type: 'missed-note',
        expectedNoteName: n.noteName,
        description: isDe
          ? `Ausgelassener Ton ${n.noteName} (${n.hand === 'right' ? 'RH' : 'LH'})`
          : `Missed note ${n.noteName} (${n.hand} hand)`,
      })
    })

    matchedStrokes
      .filter((s) => s.timingOffsetMs !== null && Math.abs(s.timingOffsetMs) > 105)
      .slice(0, 15)
      .forEach((s) => {
        const off = s.timingOffsetMs!
        mistakes.push({
          id: `time-${s.id}`,
          measure: s.matchedMeasure,
          beat: Math.round(s.matchedBeat * 10) / 10,
          timestampSec: Math.round(s.scoreTimeSec * 10) / 10,
          type: off < 0 ? 'early' : 'late',
          expectedNoteName: s.noteName,
          timingOffsetMs: off,
          description: isDe
            ? `${s.noteName} ${off < 0 ? `${Math.abs(off)}ms zu früh (gehetzt)` : `${off}ms zu spät (geschleppt)`}`
            : `${s.noteName} ${off < 0 ? `${Math.abs(off)}ms rushed` : `${off}ms late`}`,
        })
      })

    mistakes.sort((a, b) => a.measure - b.measure || a.timestampSec - b.timestampSec)

    // --- 5. COMPUTE 6 CONSERVATORY PILLAR SCORES (0–100) ---
    const pitchScore = clamp(accuracyPercent, 0, 100)

    const timingRubatoScore = clamp(
      Math.round(
        100 -
          Math.max(0, avgTimingErrorMs - 24) * 0.48 -
          handDesyncCount * 4 -
          (tempoTrend === 'rushing' ? 10 : tempoTrend === 'dragging' ? 8 : 0)
      ),
      20,
      100
    )

    // Emotion & Dynamic Range score (penalizes monotone robot velocity!)
    const targetSpan = isBallade ? 48 : 30
    const spanRatio = clamp(dynamicSpan / targetSpan, 0, 1)
    const stdBonus = clamp(dynamicStdDev / 14, 0, 1)
    const emotionDynamicsScore =
      matchedStrokes.length < 4
        ? 0
        : clamp(Math.round(35 + spanRatio * 40 + stdBonus * 25 - harshFastAttacksCount * 2), 20, 100)

    // Voicing Balance score (critical for Ballade M. 8-26!)
    const targetLead = isBallade ? 16 : 10
    let voicingScore = 82
    if (melodyStrokes.length >= 3 && accompStrokes.length >= 3) {
      if (voicingLeadVel >= targetLead) {
        voicingScore = clamp(Math.round(92 + Math.min(8, (voicingLeadVel - targetLead) * 0.5)), 88, 100)
      } else if (voicingLeadVel >= 5) {
        voicingScore = clamp(Math.round(68 + ((voicingLeadVel - 5) / Math.max(1, targetLead - 5)) * 22), 62, 90)
      } else {
        voicingScore = clamp(Math.round(58 + voicingLeadVel * 2.5), 25, 65)
      }
    }

    // Touch Depth & Articulation score (Key speed control + Finger Legato hold + Release velocity)
    const holdPenalty = Math.abs(88 - avgHoldRatioPct) * 0.55
    const touchArticulationScore =
      matchedStrokes.length < 4
        ? 0
        : clamp(
            Math.round(
              100 -
                holdPenalty -
                harshFastAttacksCount * 4.5 -
                clippedLegatoCount * 3.5 -
                abruptReleasesCount * 3 -
                weakGhostNotesCount * 2.5
            ),
            20,
            100
          )

    // Pedal score (CC64 half-pedal & harmonic cleanliness)
    const pedalScore =
      piece.pedalEvents.length === 0
        ? clamp(100 - muddyPedalChangesCount * 15, 60, 100)
        : clamp(
            Math.round(
              (activeDamperSamples.length === 0 ? 58 : 88) +
                (halfPedalPct >= 25 ? 8 : 0) +
                (unaCordaUsed ? 4 : 0) -
                muddyPedalChangesCount * 14
            ),
            25,
            100
          )

    const composite = Math.round(
      pitchScore * 0.28 +
        timingRubatoScore * 0.18 +
        emotionDynamicsScore * 0.14 +
        voicingScore * 0.16 +
        touchArticulationScore * 0.14 +
        pedalScore * 0.1
    )

    const grade: TeacherCompetitionReport['grade'] =
      composite >= 94 && extras <= 1
        ? 'S+'
        : composite >= 88
        ? 'S'
        : composite >= 80
        ? 'A'
        : composite >= 70
        ? 'B'
        : composite >= 58
        ? 'C'
        : 'D'

    // --- 6. MEASURE-BY-MEASURE & PHRASE-BY-PHRASE BREAKDOWN ---
    const measureBreakdowns: MeasureTelemetry[] = []
    for (let m = startM; m <= endM; m++) {
      const mExpected = expectedInScope.filter((n) => n.measure === m)
      if (mExpected.length === 0) continue
      const mHits = matchedStrokes.filter((s) => s.matchedMeasure === m)
      const mMisses = missedInScope.filter((n) => n.measure === m)
      const mExtras = extraStrokes.filter((s) => s.matchedMeasure === m)
      const mMel = mHits.filter((s) => s.matchedHand === 'right' && (s.matchedVoice ?? 1) === 1)
      const mAcc = mHits.filter((s) => s.matchedHand === 'left' || (s.matchedHand === 'right' && s.matchedVoice === 2))
      const mAvgMel = mMel.length ? Math.round(mean(mMel.map((s) => s.attackVelocity))) : null
      const mAvgAcc = mAcc.length ? Math.round(mean(mAcc.map((s) => s.attackVelocity))) : null
      const mTimings = mHits.map((s) => s.timingOffsetMs).filter((v): v is number => v !== null)
      const mAvgTime = mTimings.length ? Math.round(mean(mTimings)) : 0
      const mHolds = mHits
        .filter((s) => s.holdDurationMs !== null && s.expectedDurationSec && s.expectedDurationSec >= 0.4)
        .map((s) => clamp((s.holdDurationMs! / (s.expectedDurationSec! * 1000)) * 100, 15, 200))
      const mAvgHold = mHolds.length ? Math.round(mean(mHolds)) : null
      const mRels = mHits.map((s) => s.releaseVelocity).filter((v) => v > 0)
      const mAvgRel = mRels.length ? Math.round(mean(mRels)) : null
      const mPedals = damperSamples.filter((p) => p.measure === m)
      const mMaxPed = mPedals.length ? Math.max(...mPedals.map((p) => p.value)) : 0

      // Chord spread in this measure
      let mSpread: number | null = null
      const mChordSpreads: number[] = []
      chordBuckets.forEach((grp) => {
        if (grp[0]?.matchedMeasure === m && grp.length >= 2) {
          const ts = grp.map((g) => g.onsetPerfMs)
          mChordSpreads.push(Math.round(Math.max(...ts) - Math.min(...ts)))
        }
      })
      if (mChordSpreads.length) mSpread = Math.round(mean(mChordSpreads))

      // Craft specific, informative teacher note for THIS exact measure!
      const notesOut: string[] = []
      if (mMisses.length > 0 || mExtras.length > 0) {
        notesOut.push(
          isDe
            ? `${mMisses.length} ausgelassen, ${mExtras.length} falsche Tasten.`
            : `${mMisses.length} missed, ${mExtras.length} extra keys.`
        )
      }
      if (mAvgMel !== null && mAvgAcc !== null && mAvgMel - mAvgAcc < 8 && m >= 8) {
        notesOut.push(
          isDe
            ? `Voicing: Begleitung (Vel ${mAvgAcc}) übertönt Melodie (Vel ${mAvgMel}) — links leichter!`
            : `Voicing: accomp (vel ${mAvgAcc}) overpowers melody (vel ${mAvgMel}) — lighten LH/inner chords!`
        )
      }
      if (mAvgHold !== null && mAvgHold < 58) {
        notesOut.push(
          isDe
            ? `Zu kurz gehalten (${mAvgHold}% Dauer) — Finger tiefer in der Taste liegen lassen.`
            : `Too clipped (${mAvgHold}% hold) — keep fingers settled deeper into the keybed.`
        )
      }
      if (Math.abs(mAvgTime) > 70) {
        notesOut.push(
          isDe
            ? mAvgTime < 0
              ? `Tempo zieht an (${mAvgTime}ms zu früh) — ruhig atmen!`
              : `Schleppt hinterher (+${mAvgTime}ms) — Puls stabil halten.`
            : mAvgTime < 0
            ? `Rushing (${mAvgTime}ms early) — breathe and settle!`
            : `Dragging (+${mAvgTime}ms late) — maintain pulse.`
        )
      }
      if (isBallade && (m === 24 || m === 25) && mMaxPed >= 92) {
        notesOut.push(
          isDe
            ? `Vollpedal (CC64 ${mMaxPed}) verschmiert Bass-Achtel — Halbpedal ~55 nutzen!`
            : `Full pedal (CC64 ${mMaxPed}) blurs chromatic 8ths — use half-pedal ~55!`
        )
      }
      if (notesOut.length === 0) {
        notesOut.push(
          isDe
            ? 'Ausgewogener Anschlag, saubere Klangbalance und stabiles Timing.'
            : 'Balanced touch, clean voicing, and poised timing.'
        )
      }

      const issueCount =
        (mMisses.length + mExtras.length > 1 ? 2 : mMisses.length + mExtras.length) +
        (mAvgMel !== null && mAvgAcc !== null && mAvgMel - mAvgAcc < 8 && m >= 8 ? 1 : 0) +
        (mAvgHold !== null && mAvgHold < 55 ? 1 : 0) +
        (Math.abs(mAvgTime) > 85 ? 1 : 0)

      const status: MeasureTelemetry['status'] =
        issueCount >= 3 ? 'critical' : issueCount === 2 ? 'attention' : issueCount === 1 ? 'solid' : 'excellent'

      measureBreakdowns.push({
        measure: m,
        notesTotal: mExpected.length,
        notesHit: mHits.length,
        notesMissed: mMisses.length,
        extraNotes: mExtras.length,
        avgMelodyVel: mAvgMel,
        avgAccompVel: mAvgAcc,
        avgTimingOffsetMs: mAvgTime,
        chordSpreadMs: mSpread,
        avgHoldRatioPct: mAvgHold,
        avgReleaseVel: mAvgRel,
        maxPedalDepth: mMaxPed,
        status,
        teacherNote: notesOut.join(' '),
      })
    }

    // --- 7. PHRASE CRITIQUES (HYPER-SPECIFIC FOR CHOPIN BALLADE NO. 1 M.1–26!) ---
    const phraseCritiques: PhraseCritique[] = []
    if (isBallade) {
      const relevantRubrics = BALLADE_NO1_RUBRIC.filter(
        (r) => r.measureRange[0] <= endM && r.measureRange[1] >= startM
      )
      for (const r of relevantRubrics) {
        phraseCritiques.push(this.evaluateBalladePhrase(r, matchedStrokes, missedInScope, extraStrokes, damperSamples, isDe))
      }
    } else {
      // Generic section-based phrase critiques for Franz Behr & all other pieces
      piece.sections
        .filter((sec) => sec.startMeasure <= endM && sec.endMeasure >= startM)
        .forEach((sec) => {
          const sHits = matchedStrokes.filter(
            (s) => s.matchedMeasure >= sec.startMeasure && s.matchedMeasure <= sec.endMeasure
          )
          const sMiss = missedInScope.filter(
            (n) => n.measure >= sec.startMeasure && n.measure <= sec.endMeasure
          )
          const sMel = sHits.filter((s) => s.matchedHand === 'right')
          const sAcc = sHits.filter((s) => s.matchedHand === 'left')
          const avgMel = sMel.length ? Math.round(mean(sMel.map((s) => s.attackVelocity))) : null
          const avgAcc = sAcc.length ? Math.round(mean(sAcc.map((s) => s.attackVelocity))) : null
          const avgTime = sHits.length
            ? Math.round(mean(sHits.map((s) => s.timingOffsetMs ?? 0)))
            : 0
          const accPct = sHits.length + sMiss.length > 0 ? Math.round((sHits.length / (sHits.length + sMiss.length)) * 100) : 0
          const pts: string[] = []
          if (avgMel !== null && avgAcc !== null && avgMel - avgAcc < 8) {
            pts.push(
              isDe
                ? `Rechte Hand (Vel ${avgMel}) hebt sich kaum von der linken Begleitung (Vel ${avgAcc}) ab — Melodie deutlicher formen.`
                : `RH melody (vel ${avgMel}) barely leads LH accompaniment (vel ${avgAcc}) — sing the top line louder.`
            )
          }
          if (Math.abs(avgTime) > 55) {
            pts.push(
              isDe
                ? avgTime < 0
                  ? `Tendenz zum Beschleunigen (${avgTime}ms früh).`
                  : `Leichtes Schleppen (+${avgTime}ms spät).`
                : avgTime < 0
                ? `Tending to rush (${avgTime}ms early).`
                : `Slightly dragging (+${avgTime}ms late).`
            )
          }
          if (pts.length === 0) {
            pts.push(
              isDe
                ? `Saubere Artikulation und ausgewogener Klang (${accPct}% Notentreue).`
                : `Clean articulation and balanced tone (${accPct}% note accuracy).`
            )
          }

          phraseCritiques.push({
            id: sec.id,
            measureRange: [sec.startMeasure, sec.endMeasure],
            title: `${sec.title} (M. ${sec.startMeasure}–${sec.endMeasure})`,
            score: clamp(accPct - Math.min(20, Math.abs(avgTime) / 5), 25, 100),
            status: accPct >= 90 ? 'mastered' : accPct >= 78 ? 'good' : accPct >= 62 ? 'needs-work' : 'critical',
            avgMelodyVel: avgMel,
            avgAccompVel: avgAcc,
            voicingLead: avgMel !== null && avgAcc !== null ? avgMel - avgAcc : null,
            avgTimingOffsetMs: avgTime,
            tempoVerdict: avgTime < -40 ? 'rushing' : avgTime > 45 ? 'dragging' : 'steady',
            avgHoldRatioPct,
            avgPedalDepth,
            critiquePoints: pts,
            touchTip: sec.character,
          })
        })
    }

    // --- 8. TOP 3 PRIORITIZED CONSERVATORY PRESCRIPTIONS ---
    const prescriptions = this.buildTopPrescriptions(
      {
        pitchScore,
        timingRubatoScore,
        emotionDynamicsScore,
        voicingScore,
        touchArticulationScore,
        pedalScore,
        avgMelodyVel,
        avgAccompVel,
        voicingLeadVel,
        dynamicSpan,
        harshFastAttacksCount,
        avgHoldRatioPct,
        avgReleaseVelocity,
        avgChordSpreadMs,
        tempoTrend,
        avgSignedTimingMs,
        muddyPedalChangesCount,
        avgPedalDepth,
        measureBreakdowns,
        startM,
        endM,
        isBallade,
      },
      isDe
    )

    // Find worst problem measures window
    const worstMeasureObj = [...measureBreakdowns].sort(
      (a, b) =>
        b.notesMissed + b.extraNotes - (a.notesMissed + a.extraNotes) ||
        Math.abs(b.avgTimingOffsetMs) - Math.abs(a.avgTimingOffsetMs)
    )[0]
    const worstM = worstMeasureObj?.measure || startM
    const problemMeasures: [number, number] = [
      Math.max(startM, worstM - 1),
      Math.min(endM, worstM + 2),
    ]

    const headlineVerdict = isDe
      ? composite >= 90
        ? 'Ausdrucksstarkes Konservatoriumsniveau — feine Klangschichtung & Kontrolle'
        : voicingScore < 72
        ? 'Gute Notenbasis, aber die Begleitung überdeckt deine Melodie-Stimme'
        : touchArticulationScore < 72
        ? 'Noten sitzen größtenteils — arbeite an Tasten-Tiefe, weicherem Anschlag & Finger-Legato'
        : timingRubatoScore < 72
        ? 'Solide Töne, aber das Tempo gerät ins Wanken — beruhige den 6/4-Puls'
        : 'Starkes Fundament — gezielte Feinarbeit an Dynamik, Pedal & Klangfarbe bringt dich auf Konzertniveau'
      : composite >= 90
      ? 'Expressive conservatory command — refined voicing & touch control'
      : voicingScore < 72
      ? 'Solid note foundation, but accompaniment is overpowering your singing melody'
      : touchArticulationScore < 72
      ? 'Notes are mostly there — focus on deeper keybed legato and cushioned attack speed'
      : timingRubatoScore < 72
      ? 'Good pitch foundation, but tempo instability interrupts the musical breath'
      : 'Strong foundation — targeted polish on dynamics, voicing, and pedal craft will elevate this dramatically'

    const overallTeacherLetter = isDe
      ? `Auswertung über Roland LX-9 Bluetooth (${hits}/${expectedInScope.length} Töne getroffen, Takt ${startM}–${endM}): Deine durchschnittliche Melodie-Anschlagsstärke lag bei Velocity ${avgMelodyVel} gegenüber ${avgAccompVel} in der Begleitung (Abstand ${voicingLeadVel >= 0 ? '+' : ''}${voicingLeadVel}). Deine mittlere Tastenhaltedauer betrug ${avgHoldRatioPct}% der notierten Länge bei einer Loslass-Geschwindigkeit von ${avgReleaseVelocity}/127. ${
          tempoTrend === 'rushing'
            ? `Im Schnitt warst du ${Math.abs(avgSignedTimingMs)}ms zu früh (Tendenz zum Hetzen).`
            : tempoTrend === 'dragging'
            ? `Im Schnitt warst du +${avgSignedTimingMs}ms hinter dem Puls.`
            : 'Dein Grundpuls bleibt stabil mit Raum für musikalisches Atmen.'
        }`
      : `Measured via Roland LX-9 Bluetooth (${hits}/${expectedInScope.length} notes hit, M. ${startM}–${endM}): Your average melody velocity was ${avgMelodyVel} vs. ${avgAccompVel} accompaniment (lead ${voicingLeadVel >= 0 ? '+' : ''}${voicingLeadVel}). Average finger hold depth was ${avgHoldRatioPct}% of notated length with key release velocity ${avgReleaseVelocity}/127.`

    return {
      isRolandBluetoothVerified,
      deviceName,
      examMeasureRange: [startM, endM],
      score: this.scorePoints,
      maxPossibleScore: Math.max(10000, expectedInScope.length * 1000),
      maxCombo: this.maxCombo,
      totalNotes: expectedInScope.length,
      notesHit: hits,
      notesMissed: misses,
      extraNotesCount: extras,
      accuracyPercent,
      averageTimingErrorMs: avgTimingErrorMs,
      pitchScore,
      timingRubatoScore,
      emotionDynamicsScore,
      voicingScore,
      touchArticulationScore,
      pedalScore,
      dynamicRatingPercent: emotionDynamicsScore,
      pedalRatingPercent: pedalScore,
      grade,
      headlineVerdict,
      overallTeacherLetter,
      touchPhysics: {
        avgMelodyVel,
        avgAccompVel,
        voicingLeadVel,
        minVel,
        maxVel,
        dynamicSpan,
        dynamicStdDev,
        harshFastAttacksCount,
        weakGhostNotesCount,
        cantabileControlledPct,
        avgHoldRatioPct,
        clippedLegatoCount,
        gluedOverlapCount,
        avgReleaseVelocity,
        abruptReleasesCount,
        avgChordSpreadMs,
        handDesyncCount,
        tempoTrend,
        avgSignedTimingMs,
        avgPedalDepth,
        halfPedalPct,
        muddyPedalChangesCount,
        syncopatedPedalPct,
        unaCordaUsed,
      },
      topPrescriptions: prescriptions,
      phraseCritiques,
      measureBreakdowns,
      mistakes,
      problemMeasures,
    }
  }

  private evaluateBalladePhrase(
    rubric: PhraseRubric,
    matchedStrokes: RecordedStroke[],
    missedNotes: NoteEvent[],
    extraStrokes: RecordedStroke[],
    damperSamples: RecordedPedalSample[],
    isDe: boolean
  ): PhraseCritique {
    const [m1, m2] = rubric.measureRange
    const pHits = matchedStrokes.filter((s) => s.matchedMeasure >= m1 && s.matchedMeasure <= m2)
    const pMiss = missedNotes.filter((n) => n.measure >= m1 && n.measure <= m2)
    const pExtra = extraStrokes.filter((s) => s.matchedMeasure >= m1 && s.matchedMeasure <= m2)

    const pMel = pHits.filter((s) => s.matchedHand === 'right' && (s.matchedVoice ?? 1) === 1)
    const pAcc = pHits.filter((s) => s.matchedHand === 'left' || (s.matchedHand === 'right' && s.matchedVoice === 2))
    const avgMel = pMel.length ? Math.round(mean(pMel.map((s) => s.attackVelocity))) : null
    const avgAcc = pAcc.length ? Math.round(mean(pAcc.map((s) => s.attackVelocity))) : null
    const lead = avgMel !== null && avgAcc !== null ? avgMel - avgAcc : null

    const timings = pHits.map((s) => s.timingOffsetMs).filter((v): v is number => v !== null)
    const avgTime = timings.length ? Math.round(mean(timings)) : 0
    const holds = pHits
      .filter((s) => s.holdDurationMs !== null && s.expectedDurationSec && s.expectedDurationSec >= 0.45)
      .map((s) => clamp((s.holdDurationMs! / (s.expectedDurationSec! * 1000)) * 100, 15, 180))
    const avgHold = holds.length ? Math.round(mean(holds)) : 82

    const pPedals = damperSamples.filter((p) => p.measure >= m1 && p.measure <= m2 && p.value > 10)
    const avgPed = pPedals.length ? Math.round(mean(pPedals.map((p) => p.value))) : 0

    const critiquePoints: string[] = []
    let score = 96

    if (pMiss.length + pExtra.length > 0) {
      score -= Math.min(28, (pMiss.length + pExtra.length) * 4)
      critiquePoints.push(
        isDe
          ? `Noten: ${pMiss.length} ausgelassen, ${pExtra.length} falsche Tasten in Takt ${m1}–${m2}.`
          : `Notes: ${pMiss.length} missed, ${pExtra.length} wrong keys in M. ${m1}–${m2}.`
      )
    }

    if (lead !== null && lead < rubric.minVoicingLead) {
      score -= 16
      critiquePoints.push(
        isDe
          ? `Klangbalance: Melodie (Vel ${avgMel}) hebt sich nur um ${lead >= 0 ? '+' : ''}${lead} von der Begleitung (Vel ${avgAcc}) ab — Ziel ist mindestens +${rubric.minVoicingLead}!`
          : `Voicing: Melody (vel ${avgMel}) leads accompaniment (vel ${avgAcc}) by only ${lead >= 0 ? '+' : ''}${lead} — target at least +${rubric.minVoicingLead}!`
      )
    }

    if (avgMel !== null && avgMel > rubric.targetMelodyVel[1] + 8) {
      score -= 12
      critiquePoints.push(
        isDe
          ? `Zu schneller/lauter Anschlag (Ø Vel ${avgMel} statt Ziel ${rubric.targetMelodyVel[0]}–${rubric.targetMelodyVel[1]}) — weicher aus dem Armgewicht spielen!`
          : `Attack too fast/loud (avg vel ${avgMel} vs. target ${rubric.targetMelodyVel[0]}–${rubric.targetMelodyVel[1]}) — cushion with arm weight!`
      )
    }

    if (avgAcc !== null && avgAcc > rubric.targetAccompVel[1] + 8) {
      score -= 12
      critiquePoints.push(
        isDe
          ? `Begleitung zu schwer (Ø Vel ${avgAcc} statt ${rubric.targetAccompVel[0]}–${rubric.targetAccompVel[1]}) — Tasten langsamer und flacher drücken.`
          : `Accompaniment too heavy (avg vel ${avgAcc} vs. ${rubric.targetAccompVel[0]}–${rubric.targetAccompVel[1]}) — press keys slower and lighter.`
      )
    }

    if (avgHold < rubric.minLegatoHoldRatio * 100 - 8) {
      score -= 14
      critiquePoints.push(
        isDe
          ? `Tastentiefe / Legato: Töne nur ${avgHold}% gehalten (Ziel ≥ ${Math.round(rubric.minLegatoHoldRatio * 100)}%) — Finger verlassen die Tasten zu früh!`
          : `Key depth / legato: Notes held only ${avgHold}% (target ≥ ${Math.round(rubric.minLegatoHoldRatio * 100)}%) — fingers lift off too early!`
      )
    }

    if (avgPed > rubric.maxRecommendedPedalDepth + 12) {
      score -= 14
      critiquePoints.push(
        isDe
          ? `Pedal zu tief (Ø CC64 ${avgPed} statt max. ${rubric.maxRecommendedPedalDepth}) — verwischt die Durchsichtigkeit!`
          : `Pedal too deep (avg CC64 ${avgPed} vs. max ${rubric.maxRecommendedPedalDepth}) — blurs harmonic clarity!`
      )
    }

    if (avgTime < -50) {
      score -= 10
      critiquePoints.push(
        isDe
          ? `Tempo hetzt (${avgTime}ms zu früh) — lass die Phrase atmen statt nach vorn zu kippen.`
          : `Rushing (${avgTime}ms early) — let the phrase breathe instead of tipping forward.`
      )
    } else if (avgTime > 65) {
      score -= 8
      critiquePoints.push(
        isDe
          ? `Tempo schleppt (+${avgTime}ms) — spüre den großen Taktpuls.`
          : `Dragging (+${avgTime}ms) — feel the overarching bar pulse.`
      )
    }

    if (critiquePoints.length === 0) {
      critiquePoints.push(
        isDe
          ? 'Hervorragende Balance, kultivierter Anschlag und klares musikalisches Atmen!'
          : 'Superb voicing balance, cultivated touch, and natural musical breathing!'
      )
    }

    score = clamp(Math.round(score), 20, 100)
    const status: PhraseCritique['status'] =
      score >= 88 ? 'mastered' : score >= 75 ? 'good' : score >= 60 ? 'needs-work' : 'critical'

    return {
      id: rubric.id,
      measureRange: rubric.measureRange,
      title: isDe ? rubric.titleDe : rubric.titleEn,
      score,
      status,
      avgMelodyVel: avgMel,
      avgAccompVel: avgAcc,
      voicingLead: lead,
      avgTimingOffsetMs: avgTime,
      tempoVerdict: avgTime < -45 ? 'rushing' : avgTime > 55 ? 'dragging' : 'steady',
      avgHoldRatioPct: avgHold,
      avgPedalDepth: avgPed,
      critiquePoints,
      touchTip: isDe ? rubric.touchAdviceDe : rubric.touchAdviceEn,
    }
  }

  private buildTopPrescriptions(
    ctx: {
      pitchScore: number
      timingRubatoScore: number
      emotionDynamicsScore: number
      voicingScore: number
      touchArticulationScore: number
      pedalScore: number
      avgMelodyVel: number
      avgAccompVel: number
      voicingLeadVel: number
      dynamicSpan: number
      harshFastAttacksCount: number
      avgHoldRatioPct: number
      avgReleaseVelocity: number
      avgChordSpreadMs: number
      tempoTrend: TouchPhysicsSummary['tempoTrend']
      avgSignedTimingMs: number
      muddyPedalChangesCount: number
      avgPedalDepth: number
      measureBreakdowns: MeasureTelemetry[]
      startM: number
      endM: number
      isBallade: boolean
    },
    isDe: boolean
  ): PracticePrescription[] {
    const candidates: { severity: number; item: Omit<PracticePrescription, 'priority'> }[] = []

    // 1. Voicing imbalance
    if (ctx.voicingScore < 85) {
      const range: [number, number] = ctx.isBallade && ctx.endM >= 12 ? [8, 16] : [ctx.startM, Math.min(ctx.endM, ctx.startM + 4)]
      candidates.push({
        severity: 100 - ctx.voicingScore + (ctx.isBallade ? 12 : 0),
        item: {
          category: 'voicing',
          measureRange: range,
          title: isDe ? 'Melodie über der Begleitung singen lassen (Voicing)' : 'Bring Out Singing Melody Above Accompaniment',
          diagnosis: isDe
            ? `Deine Melodie lag im Schnitt bei Velocity ${ctx.avgMelodyVel}, die Begleitung bei ${ctx.avgAccompVel} (Differenz ${ctx.voicingLeadVel >= 0 ? '+' : ''}${ctx.voicingLeadVel}). Für echten Chopin-Klang braucht die Oberstimme mindestens +16 bis +24 Vorsprung.`
            : `Your melody averaged vel ${ctx.avgMelodyVel} vs. accompaniment vel ${ctx.avgAccompVel} (gap ${ctx.voicingLeadVel >= 0 ? '+' : ''}${ctx.voicingLeadVel}). Authentic cantabile requires at least +16 to +24 lead.`,
          howToFix: isDe
            ? 'Übe die Begleitakkorde (Schlag 2–3 & 5–6) extrem langsam im pp (Vel 35–45) „auf den Tasten klebend“, während die rechte Hand beim 4./5. Finger tiefes Armgewicht hineinlegt.'
            : 'Practice accompaniment chords (beats 2–3 & 5–6) whisper-quiet (vel 35–45) from key contact while leaning relaxed arm weight into RH fingers 4 & 5.',
          metricBadge: `RH ${ctx.avgMelodyVel} vs LH ${ctx.avgAccompVel}`,
        },
      })
    }

    // 2. Touch depth, fast slapped attacks, or clipped legato
    if (ctx.touchArticulationScore < 86) {
      const clipped = ctx.avgHoldRatioPct < 74
      candidates.push({
        severity: 100 - ctx.touchArticulationScore + 8,
        item: {
          category: 'touch',
          measureRange: ctx.isBallade ? [8, 15] : [ctx.startM, Math.min(ctx.endM, ctx.startM + 4)],
          title: clipped
            ? isDe
              ? 'Tastentiefe & echtes Finger-Legato statt frühem Loslassen'
              : 'Deeper Keybed Hold & True Finger-Legato'
            : isDe
            ? 'Anschlagsgeschwindigkeit zähmen (Armgewicht statt Hauen)'
            : 'Tame Fast Key Attack Speed (Arm Weight Over Slapping)',
          diagnosis: clipped
            ? isDe
              ? `Du hältst lange Melodietöne im Schnitt nur ${ctx.avgHoldRatioPct}% ihrer notierten Dauer — die Finger springen zu früh hoch und überlassen das Binden allein dem Pedal.`
              : `You hold sustained notes only ${ctx.avgHoldRatioPct}% of their notated value — fingers lift early and rely on the pedal as a crutch.`
            : isDe
            ? `${ctx.harshFastAttacksCount} zu schnelle/harte Anschläge und Release-Velocity ${ctx.avgReleaseVelocity}/127 lassen weiche Phrasen hart und unruhig klingen.`
            : `${ctx.harshFastAttacksCount} overly fast percussive strikes and release velocity ${ctx.avgReleaseVelocity}/127 make lyrical phrases sound brittle.`,
          howToFix: clipped
            ? isDe
              ? 'Übe Takt 8–15 komplett OHNE Pedal: Halte jede punktierte Halbe in der Oberstimme (G4, D5, C5) bewusst mit dem Finger fest, während die unteren Finger die Begleitung spielen!'
              : 'Practice M. 8–15 completely WITHOUT pedal: physically hold every dotted-half soprano note (G4, D5, C5) while lower fingers play the chords!'
            : isDe
            ? 'Finger vor dem Anschlag auf der Taste auflegen, dann mit ruhiger, langsamerer Bewegung in den Tastenboden einsinken und am Phrasenende das Handgelenk weich heben.'
            : 'Touch keys before depressing them, sink smoothly to the bottom with slower key speed, and float the wrist gently off phrase endings.',
          metricBadge: isDe ? `Haltedauer ${ctx.avgHoldRatioPct}% • Rel ${ctx.avgReleaseVelocity}` : `Hold ${ctx.avgHoldRatioPct}% • Rel ${ctx.avgReleaseVelocity}`,
        },
      })
    }

    // 3. Pedal control (half-pedal & harmonic blur)
    if (ctx.pedalScore < 86 || ctx.muddyPedalChangesCount > 0) {
      const range: [number, number] = ctx.isBallade && ctx.endM >= 24 ? [24, 26] : ctx.isBallade ? [7, 11] : [ctx.startM, ctx.endM]
      candidates.push({
        severity: 100 - ctx.pedalScore + ctx.muddyPedalChangesCount * 8,
        item: {
          category: 'pedal',
          measureRange: range,
          title: isDe ? 'Halbpedal (CC64) & sauberes Nach-Pedalisieren' : 'Half-Pedal Control (CC64) & Syncopated Clearing',
          diagnosis: isDe
            ? `${ctx.muddyPedalChangesCount} verschmierte Pedalwechsel erkannt (Ø Pedaltiefe CC64 ${ctx.avgPedalDepth}/127). Besonders bei Harmoniewechseln und chromatischen Achteln (Takt 24–25) überlagern sich dissonante Obertöne.`
            : `${ctx.muddyPedalChangesCount} blurred pedal transitions detected (avg CC64 ${ctx.avgPedalDepth}/127), causing harmonies and chromatic passages (M. 24–25) to muddy together.`,
          howToFix: isDe
            ? 'Fuß erst NACH dem neuen Basston blitzschnell heben und auf halber Tiefe (CC64 45–65 am LX-9) wieder auffangen — im Lento (Takt 1–5) fast trocken spielen.'
            : 'Clear the pedal right AFTER striking the new harmony, then catch at half-depth (CC64 45–65 on the LX-9). Keep Lento M. 1–5 virtually dry.',
          metricBadge: `CC64 Ø ${ctx.avgPedalDepth}/127`,
        },
      })
    }

    // 4. Tempo & chord sync
    if (ctx.timingRubatoScore < 85) {
      const range: [number, number] = ctx.isBallade ? [1, 5] : [ctx.startM, Math.min(ctx.endM, ctx.startM + 4)]
      candidates.push({
        severity: 100 - ctx.timingRubatoScore + 4,
        item: {
          category: 'timing',
          measureRange: range,
          title:
            ctx.tempoTrend === 'rushing'
              ? isDe
                ? 'Unruhe & Vorwärtstreiben (Hetzen) stoppen'
                : 'Eliminate Rushing & Forward Hurrying'
              : isDe
              ? 'Gleichmäßigen Taktpuls & Akkord-Synchronität festigen'
              : 'Stabilize Bar Pulse & Chord Synchronization',
          diagnosis: isDe
            ? `Durchschnittliche Timing-Abweichung ${ctx.avgSignedTimingMs >= 0 ? '+' : ''}${ctx.avgSignedTimingMs}ms, Akkord-Versatz Ø ${ctx.avgChordSpreadMs}ms. ${
                ctx.tempoTrend === 'rushing'
                  ? 'Du ziehst besonders vor schwierigen Stellen unbewusst im Tempo an.'
                  : 'Rechte und linke Hand landen bei Akkorden nicht immer exakt gemeinsam.'
              }`
            : `Average signed offset ${ctx.avgSignedTimingMs >= 0 ? '+' : ''}${ctx.avgSignedTimingMs}ms with ${ctx.avgChordSpreadMs}ms chord spread.`,
          howToFix: isDe
            ? 'Übe mit aktiviertem Metronom bei 75% Tempo und zähle im 6/4 laut „1-2-3 | 4-5-6“, bevor du wieder freies Rubato hinzufügst.'
            : 'Practice with metronome at 75% speed counting broad 6/4 pulses before re-introducing expressive rubato.',
          metricBadge: `${ctx.avgSignedTimingMs >= 0 ? '+' : ''}${ctx.avgSignedTimingMs}ms • Sync ${ctx.avgChordSpreadMs}ms`,
        },
      })
    }

    // 5. Emotional dynamic contrast
    if (ctx.emotionDynamicsScore < 85) {
      candidates.push({
        severity: 100 - ctx.emotionDynamicsScore,
        item: {
          category: 'dynamics',
          measureRange: ctx.isBallade && ctx.endM >= 16 ? [13, 23] : [ctx.startM, ctx.endM],
          title: isDe ? 'Größere dynamische Bögen & Emotion (pp → f)' : 'Widen Dynamic Contrast & Emotional Arc (pp → f)',
          diagnosis: isDe
            ? `Deine gesamte dynamische Spannweite betrug nur ${ctx.dynamicSpan} Velocity-Stufen — die Phrasen klingen dadurch zu gleichförmig ohne echte Spannungskurve.`
            : `Your total dynamic span was only ${ctx.dynamicSpan} velocity units — phrases sound flat without emotional peaks and tapers.`,
          howToFix: isDe
            ? 'Übertreibe im Üben bewusst: spiele Piano wirklich zart (Vel 35–48) und öffne die Höhepunkte (z. B. Takt 13 G5, Takt 22 G5) zu warmem, tragendem Klang (Vel 82–92).'
            : 'Exaggerate contrast in practice: whisper piano sections (vel 35–48) and open phrase peaks (e.g. M. 13 G5, M. 22 G5) to warm vel 82–92.',
          metricBadge: isDe ? `Spanne ${ctx.dynamicSpan} Vel` : `Span ${ctx.dynamicSpan} vel`,
        },
      })
    }

    // 6. Pitch accuracy
    if (ctx.pitchScore < 92) {
      const worstM = [...ctx.measureBreakdowns].sort((a, b) => b.notesMissed + b.extraNotes - (a.notesMissed + a.extraNotes))[0]?.measure || ctx.startM
      candidates.push({
        severity: (100 - ctx.pitchScore) * 1.15,
        item: {
          category: 'pitch',
          measureRange: [Math.max(ctx.startM, worstM - 1), Math.min(ctx.endM, worstM + 1)],
          title: isDe ? `Notensicherheit in Takt ${Math.max(ctx.startM, worstM - 1)}–${Math.min(ctx.endM, worstM + 1)}` : `Secure Pitch Accuracy in M. ${Math.max(ctx.startM, worstM - 1)}–${Math.min(ctx.endM, worstM + 1)}`,
          diagnosis: isDe
            ? `Notentreue aktuell ${ctx.pitchScore}%. Vor allem bei Griffwechseln entstehen Auslassungen oder Nachbartasten.`
            : `Current pitch accuracy is ${ctx.pitchScore}%, with slips concentrated around hand shifts.`,
          howToFix: isDe
            ? 'Isoliere diese 3 Takte im Wait-Modus mit getrennten Händen (erst RH, dann LH), bevor du beide Hände bei 70% Tempo verbindest.'
            : 'Isolate these 3 measures in Wait Mode hands-separate (RH then LH) before re-combining at 70% tempo.',
          metricBadge: `${ctx.pitchScore}%`,
        },
      })
    }

    candidates.sort((a, b) => b.severity - a.severity)
    return candidates.slice(0, 3).map((c, idx) => ({
      ...c.item,
      priority: (idx + 1) as 1 | 2 | 3,
    }))
  }
}

/**
 * Builds a rich, hyper-realistic Conservatory Preview Report for Chopin Ballade No. 1 (M. 1–26)
 * so users without their Roland LX-9 powered on right now can inspect every diagnostic feature.
 * Clearly flagged `isDemoPreview: true` so it NEVER masquerades as microphone/touch evaluation.
 */
export function generateBalladeM1To26DemoReport(language: LanguageCode): TeacherCompetitionReport {
  const isDe = language === 'de'
  const measureBreakdowns: MeasureTelemetry[] = Array.from({ length: 26 }, (_, idx) => {
    const m = idx + 1
    if (m <= 3) {
      return {
        measure: m,
        notesTotal: m === 1 ? 8 : m === 2 ? 16 : 12,
        notesHit: m === 1 ? 8 : m === 2 ? 15 : 12,
        notesMissed: m === 2 ? 1 : 0,
        extraNotes: 0,
        avgMelodyVel: m === 1 ? 106 : 92,
        avgAccompVel: m === 1 ? 102 : 89,
        avgTimingOffsetMs: m === 1 ? -12 : -68,
        chordSpreadMs: 22,
        avgHoldRatioPct: 84,
        avgReleaseVel: 54,
        maxPedalDepth: m === 2 ? 92 : 40,
        status: m === 2 ? 'attention' : 'solid',
        teacherNote: isDe
          ? m === 1
            ? 'Eröffnungs-Oktave C etwas hart geschlagen (Vel 106) — lieber schwer und tief aus dem Arm sinken.'
            : m === 2
            ? 'Achtel ziehen an (-68ms gehetzt) & Pedal CC64 92 verschmiert das As-Dur Arpeggio.'
            : 'Gutes Diminuendo am Ende von Takt 3.'
          : m === 1
          ? 'Opening C octave slightly percussive (vel 106) — drop cushioned arm weight instead.'
          : m === 2
          ? 'Rushing the ascending 8ths (-68ms) & pedal CC64 92 blurs the Ab arpeggio.'
          : 'Clean diminuendo tapering at end of M. 3.',
      }
    }
    if (m >= 8 && m <= 12) {
      const badVoicing = m === 9 || m === 10 || m === 12
      return {
        measure: m,
        notesTotal: 16,
        notesHit: m === 10 ? 15 : 16,
        notesMissed: m === 10 ? 1 : 0,
        extraNotes: m === 12 ? 1 : 0,
        avgMelodyVel: badVoicing ? 72 : 76,
        avgAccompVel: badVoicing ? 68 : 54,
        avgTimingOffsetMs: m === 10 ? -42 : -18,
        chordSpreadMs: m === 10 ? 54 : 28,
        avgHoldRatioPct: m === 9 || m === 11 ? 49 : 76,
        avgReleaseVel: 62,
        maxPedalDepth: m === 10 ? 118 : 82,
        status: badVoicing ? 'critical' : 'solid',
        teacherNote: isDe
          ? m === 9
            ? 'Punktierte Halbe G4/D5 nur 49% gehalten (zu früh losgelassen) & Begleitung (Vel 68) fast so laut wie Melodie (Vel 72)!'
            : m === 10
            ? 'Pedal über c-Moll → D7 durchgehalten (CC64 118) + Hände klappen 54ms auseinander.'
            : 'Melodie deutlicher über den Begleitakkorden schweben lassen.'
          : m === 9
          ? 'Dotted halves G4/D5 held only 49% (lifted early) & accompaniment (vel 68) nearly matches melody (vel 72)!'
          : m === 10
          ? 'Pedal blurred across Cm/A → D7 (CC64 118) + 54ms hand flamming.'
          : 'Float soprano melody higher above the inner accompaniment chords.',
      }
    }
    if (m >= 24 && m <= 25) {
      return {
        measure: m,
        notesTotal: 21,
        notesHit: 19,
        notesMissed: 2,
        extraNotes: 1,
        avgMelodyVel: 81,
        avgAccompVel: 74,
        avgTimingOffsetMs: -58,
        chordSpreadMs: 44,
        avgHoldRatioPct: 72,
        avgReleaseVel: 76,
        maxPedalDepth: 116,
        status: 'critical',
        teacherNote: isDe
          ? 'Vollpedal (CC64 116) verschmiert die chromatischen LH-Achtel & Tempo hetzt (-58ms) — Halbpedal ~55 nutzen!'
          : 'Full pedal (CC64 116) muddies chromatic LH 8ths & tempo rushes (-58ms) — lighten to Half-Pedal ~55!',
      }
    }
    return {
      measure: m,
      notesTotal: 14,
      notesHit: 14,
      notesMissed: 0,
      extraNotes: 0,
      avgMelodyVel: m === 13 || m === 22 ? 98 : 74,
      avgAccompVel: 54,
      avgTimingOffsetMs: m === 7 ? 35 : -14,
      chordSpreadMs: m === 7 ? 88 : 24,
      avgHoldRatioPct: 84,
      avgReleaseVel: m === 5 || m === 16 ? 89 : 46,
      maxPedalDepth: m === 7 ? 115 : 72,
      status: m === 13 || m === 5 ? 'attention' : 'excellent',
      teacherNote: isDe
        ? m === 13
          ? 'Hohes G5 mit zu schnellem 5.-Finger-Anschlag (Vel 98) — rund und tief statt spitz spielen.'
          : m === 5
          ? 'Letztes D5 zu abrupt losgelassen (Release-Vel 89) — Handgelenk weich abheben.'
          : 'Saubere Klangbalance, ruhiges Atmen und gute Tastenbindung.'
        : m === 13
        ? 'High G5 struck too fast with pinky (vel 98) — sink deeply for warm cantabile.'
        : m === 5
        ? 'Final D5 snapped off abruptly (release vel 89) — float wrist softly upward.'
        : 'Balanced tone, poised breathing, and clean finger-legato.',
    }
  })

  return {
    isRolandBluetoothVerified: false,
    isDemoPreview: true,
    deviceName: 'Roland LX-9 BLE (Beispiel-Vorschau / Demo)',
    examMeasureRange: [1, 26],
    score: 78400,
    maxPossibleScore: 100000,
    maxCombo: 48,
    totalNotes: 342,
    notesHit: 328,
    notesMissed: 9,
    extraNotesCount: 5,
    accuracyPercent: 93,
    averageTimingErrorMs: 41,
    pitchScore: 93,
    timingRubatoScore: 76,
    emotionDynamicsScore: 78,
    voicingScore: 61,
    touchArticulationScore: 68,
    pedalScore: 64,
    dynamicRatingPercent: 78,
    pedalRatingPercent: 64,
    grade: 'B',
    headlineVerdict: isDe
      ? 'Beispiel-Gutachten (Takt 1–26): Starke Notenbasis (93%), aber typische Chopin-Fallen bei Voicing, Tastentiefe & Halbpedal!'
      : 'Sample Teacher Report (M. 1–26): Strong 93% note accuracy, but classic Chopin pitfalls in Voicing, Key Depth & Half-Pedaling!',
    overallTeacherLetter: isDe
      ? 'Genau das erklärt, warum dein Klavierlehrer trotz sicherer Noten bis Takt 26 noch viele Kritikpunkte hört: Die Noten selbst sind zu 93% richtig, doch in Takt 8–12 ist die Begleitung fast genauso laut wie die Melodie (Vel 68 vs. 72), die punktierten Halben werden mit den Fingern nach 49% der Zeit losgelassen, und in Takt 24–25 verschmiert Vollpedal (CC64 116) den chromatischen Bass. Verbinde dein Roland LX-9 per Bluetooth, um deine echten Werte live zu messen!'
      : 'This illustrates why a piano teacher hears issues even when you know the notes up to M. 26: notes are 93% accurate, yet M. 8–12 accompaniment matches the melody volume (vel 68 vs 72), dotted-half soprano notes lift after 49% duration, and full pedal (CC64 116) blurs M. 24–25. Connect your Roland LX-9 via Bluetooth to measure your real hands!',
    touchPhysics: {
      avgMelodyVel: 77,
      avgAccompVel: 66,
      voicingLeadVel: 11,
      minVel: 44,
      maxVel: 106,
      dynamicSpan: 62,
      dynamicStdDev: 14.2,
      harshFastAttacksCount: 4,
      weakGhostNotesCount: 1,
      cantabileControlledPct: 84,
      avgHoldRatioPct: 68,
      clippedLegatoCount: 7,
      gluedOverlapCount: 1,
      avgReleaseVelocity: 61,
      abruptReleasesCount: 3,
      avgChordSpreadMs: 36,
      handDesyncCount: 3,
      tempoTrend: 'rushing',
      avgSignedTimingMs: -34,
      avgPedalDepth: 96,
      halfPedalPct: 22,
      muddyPedalChangesCount: 3,
      syncopatedPedalPct: 64,
      unaCordaUsed: false,
    },
    topPrescriptions: [
      {
        priority: 1,
        category: 'voicing',
        measureRange: [8, 16],
        title: isDe ? 'Begleitakkorde in Takt 8–16 radikal leiser (Voicing +18)' : 'Whisper M. 8–16 Accompaniment (Target +18 Melody Lead)',
        diagnosis: isDe
          ? 'In Takt 9–12 liegt deine Begleitung (Ø Vel 68) fast auf Höhe deiner Melodie (Ø Vel 72) — der 6/4-Gesang wirkt dadurch schwer statt schwebend dolce.'
          : 'In M. 9–12 your accompaniment (avg vel 68) almost equals the soprano melody (vel 72), weighing down the 6/4 dolce song.',
        howToFix: isDe
          ? 'Rechte Hand kippt ins Gewicht von Finger 4–5; Begleitakkorde auf Schlag 2–3 & 5–6 mit langsamer Tastengeschwindigkeit bei Vel 38–48 fast lautlos antupfen.'
          : 'Tilt arm weight into RH fingers 4–5; stroke beats 2–3 & 5–6 accompaniment with slow key speed at vel 38–48.',
        metricBadge: 'RH 72 vs LH 68',
      },
      {
        priority: 2,
        category: 'pedal',
        measureRange: [24, 26],
        title: isDe ? 'Halbpedal (CC64 50–65) in Takt 24–25 & sauberes Lösen in Takt 10' : 'Half-Pedal (CC64 50–65) in M. 24–25 & Clean Clear in M. 10',
        diagnosis: isDe
          ? 'Vollpedal (CC64 116–118) verwischt den Wechsel c-Moll → D7 (Takt 10) und die laufenden chromatischen Bass-Achtel (Takt 24–25).'
          : 'Full pedal (CC64 116–118) blurs the Cm/A → D7 shift in M. 10 and chromatic running bass 8ths in M. 24–25.',
        howToFix: isDe
          ? 'Am Roland LX-9 nur bis zum halben Widerstand (CC64 ~55) treten und beim Harmoniewechsel direkt NACH dem neuen Basston kurz komplett öffnen.'
          : 'Use the Roland LX-9 Progressive Damper at half depth (CC64 ~55) and clear cleanly right AFTER each new harmony strikes.',
        metricBadge: 'CC64 Ø 96 → Ziel ~58',
      },
      {
        priority: 3,
        category: 'touch',
        measureRange: [8, 12],
        title: isDe ? 'Punktierte Halbe mit den Fingern aushalten (49% → 85% Tiefe)' : 'Hold Dotted-Half Melody With Fingers (49% → 85% Hold)',
        diagnosis: isDe
          ? 'Deine Finger verlassen G4, D5 und C5 schon nach knapp der halben Dauer — das zerstört das echte Chopin-Legato und verleitet zu hartem Nachschlagen.'
          : 'Your fingers leave G4, D5, and C5 after only half their value — breaking true finger-legato.',
        howToFix: isDe
          ? 'Spiele Takt 8–12 dreimal komplett OHNE Pedal und spüre, wie der 5. Finger tief im Tastenboden ruht, während Daumen & Zeigefinger darunter leise atmen.'
          : 'Play M. 8–12 three times completely WITHOUT pedal, feeling finger 5 resting deep in the keybed while thumb/index breathe softly beneath.',
        metricBadge: isDe ? 'Haltedauer 49% → 85%' : 'Hold 49% → 85%',
      },
    ],
    phraseCritiques: BALLADE_NO1_RUBRIC.map((r, i) => ({
      id: r.id,
      measureRange: r.measureRange,
      title: isDe ? r.titleDe : r.titleEn,
      score: [78, 82, 89, 59, 76, 84, 57][i] ?? 80,
      status: (['good', 'good', 'mastered', 'critical', 'good', 'good', 'critical'] as const)[i] ?? 'good',
      avgMelodyVel: [96, 56, 68, 72, 86, 80, 81][i] ?? 75,
      avgAccompVel: [92, 50, 52, 68, 56, 58, 74][i] ?? 55,
      voicingLead: [4, 6, 16, 4, 30, 22, 7][i] ?? 15,
      avgTimingOffsetMs: [-52, -18, 28, -32, -12, -16, -58][i] ?? 0,
      tempoVerdict: (['rushing', 'steady', 'rubato', 'steady', 'steady', 'steady', 'rushing'] as const)[i] ?? 'steady',
      avgHoldRatioPct: [84, 80, 92, 52, 78, 82, 72][i] ?? 80,
      avgPedalDepth: [68, 35, 115, 96, 82, 78, 116][i] ?? 70,
      critiquePoints: isDe ? r.commonMistakesDe.slice(0, 2) : r.commonMistakesEn.slice(0, 2),
      touchTip: isDe ? r.touchAdviceDe : r.touchAdviceEn,
    })),
    measureBreakdowns,
    mistakes: [
      {
        id: 'demo-1',
        measure: 2,
        beat: 2,
        timestampSec: 4.6,
        type: 'early',
        expectedNoteName: 'Eb4',
        timingOffsetMs: -68,
        description: isDe
          ? 'Aufsteigende Achtel in Takt 2 hetzen (-68ms) — Lento-Würde bewahren'
          : 'Ascending 8ths in M. 2 rushing (-68ms) — preserve Lento gravitas',
      },
      {
        id: 'demo-2',
        measure: 9,
        beat: 1,
        timestampSec: 29.7,
        type: 'clipped-legato',
        expectedNoteName: 'G4',
        description: isDe
          ? 'G4 (punktierte Halbe) nach 49% losgelassen — Finger tief in der Taste halten!'
          : 'G4 (dotted half) released at 49% — keep finger resting in keybed!',
      },
      {
        id: 'demo-3',
        measure: 10,
        beat: 4,
        timestampSec: 35.8,
        type: 'muddy-pedal',
        description: isDe
          ? 'Dämpferpedal (CC64 118) über c-Moll → D7 durchgehalten — Harmonie verschwimmt!'
          : 'Damper pedal (CC64 118) held across Cm/A → D7 — harmonies blur!',
      },
      {
        id: 'demo-4',
        measure: 13,
        beat: 4,
        timestampSec: 48.1,
        type: 'harsh-attack',
        expectedNoteName: 'G5',
        velocity: 98,
        description: isDe
          ? 'Zu schneller 5.-Finger-Anschlag auf G5 (Vel 98) — mit offenem Handgelenk einsinken'
          : 'Overly fast pinky strike on G5 (vel 98) — sink deeply with open wrist',
      },
      {
        id: 'demo-5',
        measure: 24,
        beat: 1,
        timestampSec: 90.4,
        type: 'muddy-pedal',
        description: isDe
          ? 'Vollpedal (CC64 116) auf chromatischen Bass-Achteln — Halbpedal (~55) verwenden!'
          : 'Full pedal (CC64 116) on chromatic bass 8ths — lighten to Half-Pedal (~55)!',
      },
    ],
    problemMeasures: [8, 12],
  }
}
