// Passive Real-Time Practice Coach (Wait Mode, Flow Mode & Competition Mode)
// Silently observes every practice session across ALL input modes (MIDI, Roland LX-9 BLE, Mic, Touch)
// and builds persistent, actionable insights:
//  - Where you make the most mistakes (measure & section error/hesitation heatmap)
//  - Which mistakes happen most frequently (recurring wrong-key substitutions, RH vs LH split)
//  - Which sections to improve next vs. what already works well (mastered fluent passages!)

import type { Piece } from '../types/music'
import type { LanguageCode } from '../i18n/translations'
import { ScoreEngine } from './ScoreEngine'

const STORAGE_PREFIX = 'virtuoso_practice_coach_v1_'

export interface MeasurePracticeStat {
  measure: number
  hits: number
  wrongKeys: number
  hesitations: number // Wait-mode pauses > 1400ms on a chord
  totalWaitMs: number
  waitSamples: number
  rhWrong: number
  lhWrong: number
  lastPracticedAt: number
}

export interface RecurringMistakePattern {
  key: string // `${playedMidi}->${expectedMidi}`
  playedName: string
  expectedName: string
  count: number
  measures: number[]
  hand: 'right' | 'left' | 'both'
}

export interface PiecePracticeHistory {
  pieceId: string
  totalNotesHit: number
  totalWrongKeys: number
  totalPracticeSeconds: number
  sessionsCount: number
  lastPracticedAt: number
  measures: Record<number, MeasurePracticeStat>
  mistakePatterns: Record<string, RecurringMistakePattern>
}

export interface PracticeCoachInsight {
  pieceId: string
  totalNotesHit: number
  totalWrongKeys: number
  accuracyPercent: number
  avgHesitationMs: number
  practicedMeasuresCount: number
  hasData: boolean
  // Sections needing improvement
  weakSections: {
    title: string
    measureRange: [number, number]
    accuracyPercent: number
    wrongKeys: number
    avgWaitMs: number
    reason: string
  }[]
  // Passages working well!
  strongSections: {
    title: string
    measureRange: [number, number]
    accuracyPercent: number
    avgWaitMs: number
    praise: string
  }[]
  // Most frequent exact mistakes
  topMistakePatterns: {
    playedName: string
    expectedName: string
    count: number
    measures: number[]
    tip: string
  }[]
  // Worst individual measures for heatmap & 1-tap loop
  measureHeatmap: {
    measure: number
    hits: number
    wrongKeys: number
    avgWaitMs: number
    accuracyPercent: number
    level: 'mastered' | 'good' | 'shaky' | 'problem'
  }[]
  handBalance: {
    rhWrong: number
    lhWrong: number
    verdict: string
  }
  nextRecommendedLoop: [number, number]
  coachSummary: string
}

export class PassivePracticeCoach {
  private static instance: PassivePracticeCoach
  private cache: Map<string, PiecePracticeHistory> = new Map()
  private currentWaitChordStartMs: number | null = null
  private currentWaitChordKey: string | null = null
  private lastFlushTime = 0

  private constructor() {}

  public static getInstance(): PassivePracticeCoach {
    if (!PassivePracticeCoach.instance) {
      PassivePracticeCoach.instance = new PassivePracticeCoach()
    }
    return PassivePracticeCoach.instance
  }

  private getOrCreateHistory(pieceId: string): PiecePracticeHistory {
    const cached = this.cache.get(pieceId)
    if (cached) return cached

    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${pieceId}`)
      if (raw) {
        const parsed = JSON.parse(raw) as PiecePracticeHistory
        if (parsed && parsed.pieceId === pieceId) {
          this.cache.set(pieceId, parsed)
          return parsed
        }
      }
    } catch {}

    const fresh: PiecePracticeHistory = {
      pieceId,
      totalNotesHit: 0,
      totalWrongKeys: 0,
      totalPracticeSeconds: 0,
      sessionsCount: 1,
      lastPracticedAt: Date.now(),
      measures: {},
      mistakePatterns: {},
    }
    this.cache.set(pieceId, fresh)
    return fresh
  }

  private persist(history: PiecePracticeHistory, force = false) {
    const now = Date.now()
    if (!force && now - this.lastFlushTime < 2000) return
    this.lastFlushTime = now
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${history.pieceId}`, JSON.stringify(history))
    } catch {}
  }

  private ensureMeasure(history: PiecePracticeHistory, measure: number): MeasurePracticeStat {
    const m = Math.max(1, measure)
    if (!history.measures[m]) {
      history.measures[m] = {
        measure: m,
        hits: 0,
        wrongKeys: 0,
        hesitations: 0,
        totalWaitMs: 0,
        waitSamples: 0,
        rhWrong: 0,
        lhWrong: 0,
        lastPracticedAt: Date.now(),
      }
    }
    return history.measures[m]
  }

  /**
   * Called in Wait Mode whenever the playhead arrives at a new chord to wait for the player.
   * Silently starts timing hesitation on that chord.
   */
  public markWaitingForChord(pieceId: string, measure: number, chordKey: string) {
    const key = `${pieceId}:${measure}:${chordKey}`
    if (this.currentWaitChordKey !== key) {
      this.currentWaitChordKey = key
      this.currentWaitChordStartMs = performance.now()
    }
  }

  /**
   * Called when a chord/note is satisfied in Wait Mode (or hit in Flow/Competition Mode).
   */
  public recordCorrectChord(pieceId: string, measure: number, noteCount: number) {
    const h = this.getOrCreateHistory(pieceId)
    const stat = this.ensureMeasure(h, measure)
    const now = Date.now()

    h.totalNotesHit += Math.max(1, noteCount)
    h.lastPracticedAt = now
    stat.hits += Math.max(1, noteCount)
    stat.lastPracticedAt = now

    if (this.currentWaitChordStartMs !== null) {
      const waitMs = Math.min(8000, Math.round(performance.now() - this.currentWaitChordStartMs))
      if (waitMs > 60) {
        stat.totalWaitMs += waitMs
        stat.waitSamples += 1
        if (waitMs >= 1400) {
          stat.hesitations += 1
        }
      }
      this.currentWaitChordStartMs = null
      this.currentWaitChordKey = null
    }

    this.persist(h)
  }

  /**
   * Called passively whenever the user strikes an unexpected / wrong key during practice!
   */
  public recordWrongKey(
    pieceId: string,
    measure: number,
    playedMidi: number,
    expectedMidis: number[],
    handHint: 'right' | 'left' | 'both' = 'both'
  ) {
    const h = this.getOrCreateHistory(pieceId)
    const stat = this.ensureMeasure(h, measure)
    const now = Date.now()

    h.totalWrongKeys += 1
    h.lastPracticedAt = now
    stat.wrongKeys += 1
    stat.lastPracticedAt = now

    // Infer closest expected note so we know WHAT mistake the pianist keeps making!
    let closestExpected = expectedMidis[0] ?? playedMidi
    let bestDist = Infinity
    for (const em of expectedMidis) {
      const d = Math.abs(em - playedMidi)
      if (d < bestDist) {
        bestDist = d
        closestExpected = em
      }
    }

    const inferredHand: 'right' | 'left' =
      handHint === 'right' ? 'right' : handHint === 'left' ? 'left' : closestExpected >= 60 ? 'right' : 'left'
    if (inferredHand === 'right') stat.rhWrong += 1
    else stat.lhWrong += 1

    if (expectedMidis.length > 0 && closestExpected !== playedMidi) {
      const pKey = `${playedMidi}->${closestExpected}`
      const existing = h.mistakePatterns[pKey]
      if (existing) {
        existing.count += 1
        if (!existing.measures.includes(measure)) {
          existing.measures.push(measure)
          existing.measures.sort((a, b) => a - b)
        }
      } else {
        h.mistakePatterns[pKey] = {
          key: pKey,
          playedName: ScoreEngine.midiToNoteName(playedMidi),
          expectedName: ScoreEngine.midiToNoteName(closestExpected),
          count: 1,
          measures: [measure],
          hand: inferredHand,
        }
      }
    }

    this.persist(h)
  }

  public clearPieceHistory(pieceId: string) {
    this.cache.delete(pieceId)
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${pieceId}`)
    } catch {}
  }

  /**
   * Lightweight summary badge for My Songs cards ("88% sicher • Fokus M.10–12")
   */
  public getQuickProgressBadge(pieceId: string): {
    practiced: boolean
    accuracyPercent: number
    totalHits: number
    worstMeasure: number | null
  } {
    const h = this.getOrCreateHistory(pieceId)
    const total = h.totalNotesHit + h.totalWrongKeys
    if (total < 3) {
      return { practiced: false, accuracyPercent: 100, totalHits: h.totalNotesHit, worstMeasure: null }
    }
    const accuracyPercent = Math.round((h.totalNotesHit / total) * 100)
    const ms = Object.values(h.measures).sort(
      (a, b) => b.wrongKeys * 2 + b.hesitations - (a.wrongKeys * 2 + a.hesitations)
    )
    const worst = ms[0] && (ms[0].wrongKeys > 0 || ms[0].hesitations > 0) ? ms[0].measure : null
    return {
      practiced: true,
      accuracyPercent,
      totalHits: h.totalNotesHit,
      worstMeasure: worst,
    }
  }

  /**
   * Produces the rich, human-friendly Passive Practice Coach Diagnosis for Wait/Flow/Comp playing!
   */
  public analyzePiece(piece: Piece, language: LanguageCode): PracticeCoachInsight {
    const h = this.getOrCreateHistory(piece.id)
    const isDe = language === 'de'
    const allMeas = Object.values(h.measures).sort((a, b) => a.measure - b.measure)
    const totalAttempts = h.totalNotesHit + h.totalWrongKeys
    const hasData = totalAttempts >= 3

    const accuracyPercent = totalAttempts > 0 ? Math.round((h.totalNotesHit / totalAttempts) * 100) : 100
    const totalWaitMs = allMeas.reduce((s, m) => s + m.totalWaitMs, 0)
    const totalWaitSamples = allMeas.reduce((s, m) => s + m.waitSamples, 0)
    const avgHesitationMs = totalWaitSamples > 0 ? Math.round(totalWaitMs / totalWaitSamples) : 0

    // Measure-level heatmap
    const measureHeatmap = allMeas.map((m) => {
      const mTot = m.hits + m.wrongKeys
      const mAcc = mTot > 0 ? Math.round((m.hits / mTot) * 100) : 100
      const mWait = m.waitSamples > 0 ? Math.round(m.totalWaitMs / m.waitSamples) : 0
      const level: 'mastered' | 'good' | 'shaky' | 'problem' =
        mAcc >= 94 && mWait < 1100
          ? 'mastered'
          : mAcc >= 84 && mWait < 1700
          ? 'good'
          : mAcc >= 70
          ? 'shaky'
          : 'problem'
      return {
        measure: m.measure,
        hits: m.hits,
        wrongKeys: m.wrongKeys,
        avgWaitMs: mWait,
        accuracyPercent: mAcc,
        level,
      }
    })

    // Group into 4-measure windows or piece sections to find Weak Sections vs. Strong Sections
    const bucketCandidates: {
      title: string
      measureRange: [number, number]
      hits: number
      wrongKeys: number
      waitSum: number
      waitCount: number
      hesitations: number
    }[] = []

    const maxPracticed = allMeas.length > 0 ? Math.max(...allMeas.map((m) => m.measure)) : 4
    const windowSize = 4
    for (let start = 1; start <= maxPracticed; start += windowSize) {
      const end = start + windowSize - 1
      const inWin = allMeas.filter((m) => m.measure >= start && m.measure <= end)
      if (inWin.length === 0) continue
      const secMatch = piece.sections.find((s) => start >= s.startMeasure && start <= s.endMeasure)
      bucketCandidates.push({
        title: secMatch
          ? `${secMatch.title.split('–')[0].trim()} (M.${start}–${end})`
          : isDe
          ? `Abschnitt Takt ${start}–${end}`
          : `Passage M.${start}–${end}`,
        measureRange: [start, end],
        hits: inWin.reduce((s, m) => s + m.hits, 0),
        wrongKeys: inWin.reduce((s, m) => s + m.wrongKeys, 0),
        waitSum: inWin.reduce((s, m) => s + m.totalWaitMs, 0),
        waitCount: inWin.reduce((s, m) => s + m.waitSamples, 0),
        hesitations: inWin.reduce((s, m) => s + m.hesitations, 0),
      })
    }

    const weakSections = bucketCandidates
      .map((b) => {
        const tot = b.hits + b.wrongKeys
        const acc = tot > 0 ? Math.round((b.hits / tot) * 100) : 100
        const avgWait = b.waitCount > 0 ? Math.round(b.waitSum / b.waitCount) : 0
        const score = (100 - acc) * 2 + b.wrongKeys * 3 + b.hesitations * 4 + (avgWait > 1300 ? 10 : 0)
        const reason =
          b.wrongKeys >= 3 && avgWait >= 1300
            ? isDe
              ? `${b.wrongKeys} Patzer & Ø ${(avgWait / 1000).toFixed(1)}s Stocken im Wait-Modus — Griffwechsel isoliert üben.`
              : `${b.wrongKeys} wrong notes & avg ${(avgWait / 1000).toFixed(1)}s hesitation — isolate hand shifts.`
            : b.wrongKeys > 0
            ? isDe
              ? `${b.wrongKeys} falsche Tasten (${acc}% Trefferquote) — Hände getrennt bei 70% Tempo festigen.`
              : `${b.wrongKeys} wrong keys (${acc}% accuracy) — solidify hands-separate at 70% speed.`
            : isDe
            ? `Langes Zögern (Ø ${(avgWait / 1000).toFixed(1)}s pro Akkord) — Notenbild & Fingersatz einprägen.`
            : `Slow hesitation (avg ${(avgWait / 1000).toFixed(1)}s per chord) — reinforce sight-reading & fingering.`
        return {
          title: b.title,
          measureRange: b.measureRange,
          accuracyPercent: acc,
          wrongKeys: b.wrongKeys,
          avgWaitMs: avgWait,
          reason,
          severity: score,
        }
      })
      .filter((w) => w.wrongKeys > 0 || w.avgWaitMs >= 1300)
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 3)

    const strongSections = bucketCandidates
      .map((b) => {
        const tot = b.hits + b.wrongKeys
        const acc = tot > 0 ? Math.round((b.hits / tot) * 100) : 100
        const avgWait = b.waitCount > 0 ? Math.round(b.waitSum / b.waitCount) : 0
        return {
          title: b.title,
          measureRange: b.measureRange,
          accuracyPercent: acc,
          avgWaitMs: avgWait,
          hits: b.hits,
          praise:
            avgWait > 0 && avgWait < 900
              ? isDe
                ? `${acc}% sicher & flüssiger Fluss (Ø ${avgWait}ms Reaktion) — läuft schon richtig gut!`
                : `${acc}% accurate & fluent flow (avg ${avgWait}ms reaction) — already solid!`
              : isDe
              ? `${acc}% Trefferquote über ${b.hits} gespielte Töne — sicheres Fundament!`
              : `${acc}% accuracy across ${b.hits} played notes — rock-solid foundation!`,
        }
      })
      .filter((s) => s.hits >= 4 && s.accuracyPercent >= 88 && s.avgWaitMs < 1500)
      .sort((a, b) => b.accuracyPercent - a.accuracyPercent || a.avgWaitMs - b.avgWaitMs)
      .slice(0, 3)

    // Most frequent recurring wrong-key patterns
    const topMistakePatterns = Object.values(h.mistakePatterns)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((p) => {
        const diff = Math.abs(
          ScoreEngine.noteToMidi(p.playedName) - ScoreEngine.noteToMidi(p.expectedName)
        )
        const tip =
          diff === 1
            ? isDe
              ? `Halbton-Verwechslung (Vorzeichen/schwarze Taste): Prüfe Tonart (${piece.key}) in Takt ${p.measures.slice(0, 3).join(', ')}.`
              : `Semitone slip (sharp/flat accidental): Check key signature (${piece.key}) in M. ${p.measures.slice(0, 3).join(', ')}.`
            : diff === 2
            ? isDe
              ? `Nachbartasten-Abrutscher (${p.hand === 'right' ? 'RH' : 'LH'}): Handposition & Fingersatz in Takt ${p.measures.slice(0, 3).join(', ')} fixieren.`
              : `Adjacent-key slip (${p.hand === 'right' ? 'RH' : 'LH'}): Lock hand anchor & fingering in M. ${p.measures.slice(0, 3).join(', ')}.`
            : isDe
            ? `Sprung-Fehltreffer (${p.hand === 'right' ? 'RH' : 'LH'}): Blick 1 Schlag vor dem Sprung auf ${p.expectedName} richten!`
            : `Leap miss (${p.hand === 'right' ? 'RH' : 'LH'}): Spot ${p.expectedName} with your eyes one beat ahead!`

        return {
          playedName: p.playedName,
          expectedName: p.expectedName,
          count: p.count,
          measures: p.measures,
          tip,
        }
      })

    const rhWrong = allMeas.reduce((s, m) => s + m.rhWrong, 0)
    const lhWrong = allMeas.reduce((s, m) => s + m.lhWrong, 0)
    const handVerdict =
      rhWrong + lhWrong === 0
        ? isDe
          ? 'Beide Hände sehr sauber — keine einseitige Schwäche erkannt.'
          : 'Both hands clean — no lopsided weakness detected.'
        : lhWrong > rhWrong * 1.4
        ? isDe
          ? `Linke Hand macht ${Math.round((lhWrong / (rhWrong + lhWrong)) * 100)}% deiner Fehler — übe gezielt im LH-Modus!`
          : `Left hand accounts for ${Math.round((lhWrong / (rhWrong + lhWrong)) * 100)}% of mistakes — drill LH-only mode!`
        : rhWrong > lhWrong * 1.4
        ? isDe
          ? `Rechte Hand macht ${Math.round((rhWrong / (rhWrong + lhWrong)) * 100)}% deiner Fehler — isoliere Melodie/Akkorde im RH-Modus!`
          : `Right hand accounts for ${Math.round((rhWrong / (rhWrong + lhWrong)) * 100)}% of mistakes — isolate RH-only mode!`
        : isDe
        ? `Fehler gleichmäßig verteilt (RH: ${rhWrong}, LH: ${lhWrong}) — langsame Koordination beider Hände bringt den größten Sprung.`
        : `Mistakes balanced (RH: ${rhWrong}, LH: ${lhWrong}) — slow two-hand synchronization will yield fastest gains.`

    const nextRecommendedLoop: [number, number] = weakSections[0]
      ? weakSections[0].measureRange
      : [1, Math.min(4, Math.max(1, piece.notes[piece.notes.length - 1]?.measure || 4))]

    const coachSummary = !hasData
      ? isDe
        ? `Spiele einfach im Wait- oder Flow-Modus los — dein Übe-Coach analysiert passiv im Hintergrund jeden Takt, erkennt wo du stockst oder falsche Tasten triffst und merkt sich dauerhaft, was schon super läuft!`
        : `Just start playing in Wait or Flow mode — your Practice Coach passively tracks every measure, hesitation, and recurring slip across sessions!`
      : weakSections.length > 0
      ? isDe
        ? `Über ${h.totalNotesHit} gespielte Töne (${accuracyPercent}% Trefferquote): ${
            strongSections[0] ? `${strongSections[0].title} sitzt bereits sehr gut. ` : ''
          }Den größten Fortschritt machst du jetzt mit 5 Minuten Loop-Training auf Takt ${nextRecommendedLoop[0]}–${nextRecommendedLoop[1]}!`
        : `Across ${h.totalNotesHit} notes (${accuracyPercent}% accuracy): ${
            strongSections[0] ? `${strongSections[0].title} is already solid. ` : ''
          }Your highest-leverage next step is a 5-minute loop on M. ${nextRecommendedLoop[0]}–${nextRecommendedLoop[1]}!`
      : isDe
      ? `Hervorragende Übe-Session (${accuracyPercent}% über ${h.totalNotesHit} Töne, kaum Stocken)! Du kannst das Tempo um +5% anheben oder den nächsten Abschnitt dranhängen.`
      : `Superb practice accuracy (${accuracyPercent}% across ${h.totalNotesHit} notes)! Ready to bump tempo +5% or add the next section.`

    return {
      pieceId: piece.id,
      totalNotesHit: h.totalNotesHit,
      totalWrongKeys: h.totalWrongKeys,
      accuracyPercent,
      avgHesitationMs,
      practicedMeasuresCount: allMeas.length,
      hasData,
      weakSections,
      strongSections,
      topMistakePatterns,
      measureHeatmap,
      handBalance: {
        rhWrong,
        lhWrong,
        verdict: handVerdict,
      },
      nextRecommendedLoop,
      coachSummary,
    }
  }
}
