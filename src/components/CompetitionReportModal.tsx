import React, { useState } from 'react'
import type { Piece } from '../types/music'
import type { LanguageCode } from '../i18n/translations'
import type {
  TeacherCompetitionReport,
  TeacherMistake,
  MeasureTelemetry,
} from '../engine/PianoTeacherEngine'
import {
  Trophy,
  X,
  RotateCcw,
  Sparkles,
  Flame,
  AlertTriangle,
  Target,
  Clock,
  Volume2,
  Repeat,
  CheckCircle2,
  Bluetooth,
  Gauge,
  Hand,
  Music,
  Sliders,
  GraduationCap,
  Activity,
} from 'lucide-react'

// Backwards-compatible exports
export type CompetitionMistake = TeacherMistake
export type CompetitionResults = TeacherCompetitionReport

interface CompetitionReportModalProps {
  isOpen: boolean
  onClose: () => void
  onRetry: () => void
  onPracticeProblemMeasures: (loopRange: [number, number]) => void
  onOpenBluetoothModal?: () => void
  results: TeacherCompetitionReport | null
  activePiece: Piece
  language: LanguageCode
}

type ReportTab = 'overview' | 'touch' | 'measures' | 'log'

export const CompetitionReportModal: React.FC<CompetitionReportModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  onPracticeProblemMeasures,
  onOpenBluetoothModal,
  results,
  activePiece,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview')
  const [logFilter, setLogFilter] = useState<'all' | 'notes' | 'timing' | 'touch' | 'pedal'>('all')
  const [selectedMeasure, setSelectedMeasure] = useState<number | null>(null)

  if (!isOpen || !results) return null

  const isDe = language === 'de'
  const tp = results.touchPhysics

  const gradeColors: Record<string, { bg: string; text: string; glow: string; label: string }> = {
    'S+': {
      bg: 'from-amber-400 via-orange-500 to-yellow-500',
      text: 'text-amber-300',
      glow: 'shadow-[0_0_36px_rgba(245,158,11,0.5)]',
      label: isDe ? 'Virtuoser Großmeister' : 'Virtuoso Maestro',
    },
    S: {
      bg: 'from-amber-500 to-yellow-600',
      text: 'text-yellow-400',
      glow: 'shadow-[0_0_28px_rgba(234,179,8,0.4)]',
      label: isDe ? 'Konzertreife' : 'Concert Standard',
    },
    A: {
      bg: 'from-emerald-500 to-teal-600',
      text: 'text-emerald-400',
      glow: 'shadow-[0_0_24px_rgba(16,185,129,0.3)]',
      label: isDe ? 'Sehr starkes Niveau' : 'High Distinction',
    },
    B: {
      bg: 'from-sky-500 to-blue-600',
      text: 'text-sky-400',
      glow: 'shadow-[0_0_20px_rgba(14,165,233,0.3)]',
      label: isDe ? 'Gute Basis — Feinarbeit nötig' : 'Solid Foundation — Polish Needed',
    },
    C: {
      bg: 'from-purple-500 to-indigo-600',
      text: 'text-purple-400',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]',
      label: isDe ? 'In Entwicklung' : 'Developing',
    },
    D: {
      bg: 'from-rose-600 to-red-700',
      text: 'text-rose-400',
      glow: 'shadow-[0_0_20px_rgba(225,29,72,0.3)]',
      label: isDe ? 'Gezieltes Üben erforderlich' : 'Targeted Practice Needed',
    },
  }

  const currentGradeStyle = gradeColors[results.grade] || gradeColors['C']

  const pillars = [
    {
      label: isDe ? 'Notentreue' : 'Note Accuracy',
      score: results.pitchScore,
      color: 'from-emerald-500 to-teal-400',
      textColor: 'text-emerald-300',
      sub: `${results.notesHit}/${results.totalNotes}`,
    },
    {
      label: isDe ? 'Tempo, Puls & Sync' : 'Tempo & Sync',
      score: results.timingRubatoScore,
      color: 'from-sky-500 to-blue-400',
      textColor: 'text-sky-300',
      sub: `±${results.averageTimingErrorMs}ms`,
    },
    {
      label: isDe ? 'Klangschichtung (Voicing)' : 'Voicing (RH vs LH)',
      score: results.voicingScore,
      color: 'from-amber-500 to-yellow-400',
      textColor: 'text-amber-300',
      sub: `${tp.voicingLeadVel >= 0 ? '+' : ''}${tp.voicingLeadVel} Vel`,
    },
    {
      label: isDe ? 'Anschlag & Spieltiefe' : 'Touch & Hold Depth',
      score: results.touchArticulationScore,
      color: 'from-orange-500 to-rose-400',
      textColor: 'text-orange-300',
      sub: `${tp.avgHoldRatioPct}% Hold`,
    },
    {
      label: isDe ? 'Emotion & Dynamik' : 'Dynamics (pp–ff)',
      score: results.emotionDynamicsScore,
      color: 'from-purple-500 to-fuchsia-400',
      textColor: 'text-purple-300',
      sub: `${tp.minVel}–${tp.maxVel}`,
    },
    {
      label: isDe ? 'Pedalkunst (CC64)' : 'Pedal Craft (CC64)',
      score: results.pedalScore,
      color: 'from-cyan-500 to-teal-400',
      textColor: 'text-cyan-300',
      sub: `Ø ${tp.avgPedalDepth}/127`,
    },
  ]

  const filteredMistakes = results.mistakes.filter((m) => {
    if (logFilter === 'notes') return m.type === 'wrong-key' || m.type === 'missed-note'
    if (logFilter === 'timing') return m.type === 'early' || m.type === 'late' || m.type === 'hand-desync'
    if (logFilter === 'touch')
      return m.type === 'harsh-attack' || m.type === 'clipped-legato' || m.type === 'abrupt-release' || m.type === 'weak-melody'
    if (logFilter === 'pedal') return m.type === 'muddy-pedal'
    return true
  })

  const activeMeasureObj: MeasureTelemetry | null =
    results.measureBreakdowns.find((m) => m.measure === selectedMeasure) ||
    results.measureBreakdowns.find((m) => m.status === 'critical') ||
    results.measureBreakdowns[0] ||
    null

  const statusColorClass = (status: MeasureTelemetry['status']) => {
    if (status === 'excellent') return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
    if (status === 'solid') return 'bg-sky-500/15 border-sky-500/35 text-sky-300'
    if (status === 'attention') return 'bg-amber-500/20 border-amber-500/45 text-amber-300'
    return 'bg-rose-500/25 border-rose-500/50 text-rose-300'
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[92dvh] bg-[#0c0d12] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 select-none"
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-zinc-950/95 border-b border-white/10 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] flex-shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-2 flex-wrap">
                <span>{isDe ? 'Klavierlehrer-Gutachten' : 'Conservatory Teacher Report'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 truncate max-w-[180px]">
                  {activePiece.title} • M.{results.examMeasureRange[0]}–{results.examMeasureRange[1]}
                </span>
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                <Bluetooth className={`w-3 h-3 ${results.isRolandBluetoothVerified ? 'text-blue-400' : 'text-amber-400'}`} />
                <span className="truncate">{results.deviceName}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-900 border border-white/10 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors flex-shrink-0"
            aria-label="Close report"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Demo Preview Disclaimer Banner (when opened without Roland LX-9 Bluetooth) */}
        {results.isDemoPreview && (
          <div className="px-4 py-2.5 bg-blue-950/60 border-b border-blue-500/30 flex flex-wrap items-center justify-between gap-2 text-xs flex-shrink-0">
            <div className="flex items-center gap-2 text-blue-200 min-w-0">
              <Bluetooth className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="text-[11px] leading-snug">
                {isDe
                  ? 'Beispiel-Vorschau für Ballade Nr. 1 (Takt 1–26). Verbinde dein Roland LX-9 per Bluetooth, um deine echten Tasten-, Anschlag- & Pedalwerte zu messen!'
                  : 'Sample preview for Ballade No. 1 (M. 1–26). Pair your Roland LX-9 via Bluetooth to analyze your real keystrokes, depth & half-pedal!'}
              </span>
            </div>
            {onOpenBluetoothModal && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenBluetoothModal()
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-zinc-950 font-black text-[11px] flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all"
              >
                <Bluetooth className="w-3.5 h-3.5" />
                <span>{isDe ? 'LX-9 verbinden' : 'Pair LX-9'}</span>
              </button>
            )}
          </div>
        )}

        {/* Navigation Tabs (All 4 tabs visible with zero clipping on iPhone 375px+ & full labels on desktop) */}
        <div className="px-3 sm:px-4 pt-2.5 pb-2 bg-zinc-950/70 border-b border-white/[0.06] grid grid-cols-4 sm:flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {(
            [
              { id: 'overview', short: isDe ? 'Plan' : 'Plan', label: isDe ? 'Übersicht & Plan' : 'Overview & Plan', icon: Trophy },
              { id: 'touch', short: isDe ? 'Anschlag' : 'Touch', label: isDe ? 'Anschlag & Physik' : 'Touch & Physics', icon: Gauge },
              { id: 'measures', short: isDe ? 'Takte' : 'Bars', label: isDe ? 'Phrasen & Takte' : 'Phrases & Bars', icon: Music },
              { id: 'log', short: isDe ? `Log (${results.mistakes.length})` : `Log (${results.mistakes.length})`, label: isDe ? `Fehler (${results.mistakes.length})` : `Log (${results.mistakes.length})`, icon: AlertTriangle },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-1.5 sm:px-3 py-1.5 rounded-xl text-[10.5px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap transition-all border ${
                  active
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-sm'
                    : 'bg-zinc-900/70 text-zinc-400 border-white/5 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span className="sm:hidden truncate">{tab.short}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-sm flex-1 min-h-0 touch-pan-y">
          {/* ================= TAB 1: OVERVIEW & TOP-3 LESSON PLAN ================= */}
          {activeTab === 'overview' && (
            <>
              {/* Hero Grade & Teacher Verdict */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br ${currentGradeStyle.bg} flex flex-col items-center justify-center font-black ${currentGradeStyle.glow} flex-shrink-0 border-2 border-white/30 px-4 py-3`}
                  >
                    <span className="text-3xl text-zinc-950 font-black tracking-tighter leading-none">
                      {results.grade}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-zinc-950/90 font-bold mt-0.5">
                      NOTE
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className={`text-[11px] font-bold uppercase tracking-wider ${currentGradeStyle.text}`}>
                      {currentGradeStyle.label}
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-white mt-0.5 leading-snug">
                      {results.headlineVerdict}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-zinc-300">
                      <span className="flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-emerald-400" />
                        <strong className="font-mono text-emerald-300">{results.accuracyPercent}%</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                        <strong className="font-mono text-sky-300">±{results.averageTimingErrorMs}ms</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        <strong className="font-mono text-white">{results.maxCombo}x</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onPracticeProblemMeasures(results.problemMeasures)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(245,158,11,0.35)] active:scale-95 transition-all flex-shrink-0"
                >
                  <Repeat className="w-4 h-4" />
                  <span>
                    {isDe
                      ? `Takt ${results.problemMeasures[0]}–${results.problemMeasures[1]} üben`
                      : `Practice M. ${results.problemMeasures[0]}–${results.problemMeasures[1]}`}
                  </span>
                </button>
              </div>

              {/* 6-Pillar Conservatory Meter Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {pillars.map((p) => (
                  <div
                    key={p.label}
                    className="p-3 rounded-2xl bg-zinc-900/70 border border-white/[0.06] space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-200">{p.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-zinc-400">{p.sub}</span>
                        <span className={`font-mono font-black ${p.textColor}`}>{p.score}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-white/5">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${p.color} transition-all duration-500`}
                        style={{ width: `${p.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Conservatory Teacher Summary Letter */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs leading-relaxed space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <Sparkles className="w-4 h-4" />
                  <span>{isDe ? 'Gesamtdiagnose deines Klavierlehrers' : "Your Piano Teacher's Diagnosis"}</span>
                </div>
                <p className="text-zinc-200">{results.overallTeacherLetter}</p>
              </div>

              {/* Top 3 Prioritized Lesson Fixes */}
              <div className="space-y-2.5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-amber-400" />
                  <span>
                    {isDe
                      ? 'Deine Top-3 Korrekturen (nach Wichtigkeit sortiert)'
                      : 'Top 3 Highest-Impact Fixes (Prioritized)'}
                  </span>
                </div>

                {results.topPrescriptions.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isDe
                        ? 'Alle 6 Konservatoriums-Kriterien auf Top-Niveau — bereit für die nächste Passage!'
                        : 'All 6 conservatory pillars at top level — ready for the next passage!'}
                    </span>
                  </div>
                ) : (
                  results.topPrescriptions.map((rx) => (
                    <div
                      key={`${rx.priority}-${rx.category}`}
                      className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center flex-shrink-0">
                            #{rx.priority}
                          </span>
                          <span className="font-extrabold text-xs sm:text-sm text-white">{rx.title}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-zinc-800 text-amber-300 border border-amber-500/30">
                          {rx.metricBadge}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed">
                        <strong className="text-rose-300">{isDe ? 'Befund: ' : 'Measured: '}</strong>
                        {rx.diagnosis}
                      </p>
                      <p className="text-xs text-emerald-200/90 leading-relaxed bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-2.5">
                        <strong className="text-emerald-300">{isDe ? 'So korrigierst du es: ' : 'How to fix: '}</strong>
                        {rx.howToFix}
                      </p>

                      <div className="flex justify-end pt-0.5">
                        <button
                          type="button"
                          onClick={() => onPracticeProblemMeasures(rx.measureRange)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 text-amber-300 font-bold text-[11px] flex items-center gap-1.5 active:scale-95 transition-all"
                        >
                          <Repeat className="w-3.5 h-3.5" />
                          <span>
                            {isDe
                              ? `Takt ${rx.measureRange[0]}–${rx.measureRange[1]} jetzt im Loop üben`
                              : `Loop M. ${rx.measureRange[0]}–${rx.measureRange[1]} now`}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* ================= TAB 2: TOUCH PHYSICS & BIOMECHANICS ================= */}
          {activeTab === 'touch' && (
            <div className="space-y-4">
              {/* 1. Melody vs Accompaniment Voicing */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                    <Volume2 className="w-4 h-4" />
                    <span>{isDe ? 'Klangschichtung: Melodie vs. Begleitung' : 'Voicing Balance: Melody vs. Accompaniment'}</span>
                  </div>
                  <span
                    className={`font-mono text-xs font-black px-2 py-0.5 rounded-lg ${
                      tp.voicingLeadVel >= 15
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {tp.voicingLeadVel >= 0 ? `+${tp.voicingLeadVel}` : tp.voicingLeadVel} Vel Lead
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sky-300 font-bold">{isDe ? 'RH Melodie (Oberstimme)' : 'RH Soprano Melody'}</span>
                      <span className="font-mono font-bold text-white">Vel {tp.avgMelodyVel} / 127</span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-cyan-300 rounded-full"
                        style={{ width: `${Math.round((tp.avgMelodyVel / 127) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-pink-300 font-bold">{isDe ? 'Begleitung (LH & Innenstimmen)' : 'Accompaniment (LH & Inner)'}</span>
                      <span className="font-mono font-bold text-white">Vel {tp.avgAccompVel} / 127</span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full"
                        style={{ width: `${Math.round((tp.avgAccompVel / 127) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {isDe
                    ? 'Richtwert für Chopin Ballade Nr. 1 (Takt 8–26): Melodie ca. Vel 65–85, Begleitung ca. Vel 38–55 (mindestens +16 Unterschied).'
                    : 'Chopin Ballade No. 1 (M. 8–26) benchmark: Melody ~vel 65–85, accompaniment ~vel 38–55 (at least +16 lead).'}
                </p>
              </div>

              {/* 2. Key Attack Speed (Fast vs Slow) & Hold Depth + Release Velocity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-orange-300 uppercase tracking-wider">
                    <Hand className="w-4 h-4" />
                    <span>{isDe ? 'Tastengeschwindigkeit (Schnell vs. Langsam)' : 'Key Press Speed (Fast vs. Slow)'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="p-2 rounded-xl bg-zinc-950 border border-white/5">
                      <div className="text-base font-black text-emerald-300">{tp.cantabileControlledPct}%</div>
                      <div className="text-[9.5px] text-zinc-400">{isDe ? 'Cantabile' : 'Controlled'}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-950 border border-white/5">
                      <div className={`text-base font-black ${tp.harshFastAttacksCount > 2 ? 'text-rose-400' : 'text-zinc-200'}`}>
                        {tp.harshFastAttacksCount}
                      </div>
                      <div className="text-[9.5px] text-zinc-400">{isDe ? 'Zu hart/schnell' : 'Harsh/Fast'}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-950 border border-white/5">
                      <div className="text-base font-black text-sky-300">{tp.dynamicSpan}</div>
                      <div className="text-[9.5px] text-zinc-400">{isDe ? 'pp–ff Spanne' : 'pp–ff Span'}</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {isDe
                      ? `Velocity-Bereich: ${tp.minVel} (leiseste Taste) bis ${tp.maxVel} (lauteste Taste), Streuung σ=${tp.dynamicStdDev}.`
                      : `Velocity range: ${tp.minVel} (softest key) to ${tp.maxVel} (loudest key), std dev σ=${tp.dynamicStdDev}.`}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-300 uppercase tracking-wider">
                    <Activity className="w-4 h-4" />
                    <span>{isDe ? 'Tastentiefe, Legato & Release' : 'Key Hold Depth & Release Speed'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="p-2 rounded-xl bg-zinc-950 border border-white/5">
                      <div className={`text-base font-black ${tp.avgHoldRatioPct < 70 ? 'text-rose-400' : 'text-emerald-300'}`}>
                        {tp.avgHoldRatioPct}%
                      </div>
                      <div className="text-[9.5px] text-zinc-400">{isDe ? 'Haltedauer' : 'Hold Depth'}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-950 border border-white/5">
                      <div className={`text-base font-black ${tp.avgReleaseVelocity > 72 ? 'text-amber-300' : 'text-emerald-300'}`}>
                        {tp.avgReleaseVelocity}
                      </div>
                      <div className="text-[9.5px] text-zinc-400">Release Vel</div>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-950 border border-white/5">
                      <div className={`text-base font-black ${tp.clippedLegatoCount > 3 ? 'text-rose-400' : 'text-zinc-200'}`}>
                        {tp.clippedLegatoCount}
                      </div>
                      <div className="text-[9.5px] text-zinc-400">{isDe ? 'Zu kurz' : 'Clipped'}</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {isDe
                      ? 'Optimales Finger-Legato: 82–100% Haltedauer & weiches Loslassen (Release-Velocity < 65 am Roland LX-9).'
                      : 'Optimal finger-legato: 82–100% hold duration & gentle wrist lift (Release Velocity < 65 on Roland LX-9).'}
                  </p>
                </div>
              </div>

              {/* 3. Tempo Trend, Hand Sync & CC64/CC67 Pedal Craft */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-sky-300 uppercase tracking-wider">
                    <Clock className="w-4 h-4" />
                    <span>{isDe ? 'Tempo-Tendenz & Hände-Synchronität' : 'Tempo Drift & Chord Sync'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                    <span className="text-zinc-400">{isDe ? 'Puls-Verhalten' : 'Pulse Trend'}</span>
                    <span className="font-mono font-bold text-white uppercase">
                      {tp.tempoTrend === 'rushing'
                        ? isDe
                          ? `Hetzt (${tp.avgSignedTimingMs}ms)`
                          : `Rushing (${tp.avgSignedTimingMs}ms)`
                        : tp.tempoTrend === 'dragging'
                        ? isDe
                          ? `Schleppt (+${tp.avgSignedTimingMs}ms)`
                          : `Dragging (+${tp.avgSignedTimingMs}ms)`
                        : tp.tempoTrend === 'expressive-rubato'
                        ? 'Expressive Rubato'
                        : isDe
                        ? 'Stabiler Puls'
                        : 'Steady Pulse'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-zinc-400">{isDe ? 'Akkord-Versatz (Flamming)' : 'Avg Chord Spread'}</span>
                    <span className={`font-mono font-bold ${tp.avgChordSpreadMs > 38 ? 'text-amber-300' : 'text-emerald-300'}`}>
                      {tp.avgChordSpreadMs} ms ({tp.handDesyncCount}x {isDe ? 'versetzt' : 'flammed'})
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-cyan-300 uppercase tracking-wider">
                    <Sliders className="w-4 h-4" />
                    <span>{isDe ? 'Roland LX-9 Pedal-Telemetrie' : 'Roland LX-9 Pedal Telemetry'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                    <span className="text-zinc-400">{isDe ? 'Ø Dämpfer-Tiefe (CC64)' : 'Avg Damper Depth (CC64)'}</span>
                    <span className="font-mono font-bold text-cyan-300">{tp.avgPedalDepth} / 127</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                    <span className="text-zinc-400">{isDe ? 'Halbpedal-Anteil (25–88)' : 'Half-Pedal Usage (25–88)'}</span>
                    <span className="font-mono font-bold text-white">{tp.halfPedalPct}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-zinc-400">{isDe ? 'Verschmierte Wechsel / Una Corda' : 'Blurred Changes / Una Corda'}</span>
                    <span className="font-mono font-bold text-amber-300">
                      {tp.muddyPedalChangesCount} {isDe ? 'trüb' : 'muddy'} • CC67 {tp.unaCordaUsed ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: PHRASES & MEASURE-BY-MEASURE HEATMAP ================= */}
          {activeTab === 'measures' && (
            <div className="space-y-5">
              {/* Interactive Measure Heatmap */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                    {isDe
                      ? `Takt-für-Takt Karte (Takt ${results.examMeasureRange[0]}–${results.examMeasureRange[1]} antippen)`
                      : `Measure-by-Measure Map (Tap M. ${results.examMeasureRange[0]}–${results.examMeasureRange[1]})`}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />Top</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400" />Gut</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Achtung</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" />Kritisch</span>
                  </div>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5">
                  {results.measureBreakdowns.map((mb) => {
                    const isSel = activeMeasureObj?.measure === mb.measure
                    return (
                      <button
                        key={mb.measure}
                        type="button"
                        onClick={() => setSelectedMeasure(mb.measure)}
                        className={`py-2 rounded-xl border font-mono text-xs font-black transition-all active:scale-95 ${statusColorClass(
                          mb.status
                        )} ${isSel ? 'ring-2 ring-white scale-105' : 'opacity-85 hover:opacity-100'}`}
                      >
                        {mb.measure}
                      </button>
                    )
                  })}
                </div>

                {/* Selected Measure Deep Telemetry Card */}
                {activeMeasureObj && (
                  <div className="p-3.5 rounded-2xl bg-zinc-950/90 border border-white/10 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-black text-white font-mono">
                        {isDe ? `Takt ${activeMeasureObj.measure} — Detail-Analyse` : `Measure ${activeMeasureObj.measure} — Detail`}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onPracticeProblemMeasures([
                            Math.max(1, activeMeasureObj.measure),
                            Math.min(results.examMeasureRange[1], activeMeasureObj.measure + 1),
                          ])
                        }
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[10px] flex items-center gap-1"
                      >
                        <Repeat className="w-3 h-3" />
                        <span>{isDe ? `Takt ${activeMeasureObj.measure} im Loop üben` : `Loop M.${activeMeasureObj.measure}`}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                      <div className="p-2 rounded-xl bg-zinc-900/80 border border-white/5">
                        <div className="text-[9.5px] text-zinc-400">RH / LH Vel</div>
                        <div className="font-bold text-white">
                          {activeMeasureObj.avgMelodyVel ?? '—'} / {activeMeasureObj.avgAccompVel ?? '—'}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-900/80 border border-white/5">
                        <div className="text-[9.5px] text-zinc-400">Timing</div>
                        <div className="font-bold text-sky-300">
                          {activeMeasureObj.avgTimingOffsetMs >= 0 ? '+' : ''}
                          {activeMeasureObj.avgTimingOffsetMs}ms
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-900/80 border border-white/5">
                        <div className="text-[9.5px] text-zinc-400">{isDe ? 'Haltedauer' : 'Hold Depth'}</div>
                        <div className="font-bold text-purple-300">
                          {activeMeasureObj.avgHoldRatioPct !== null ? `${activeMeasureObj.avgHoldRatioPct}%` : '—'}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-900/80 border border-white/5">
                        <div className="text-[9.5px] text-zinc-400">CC64 Max</div>
                        <div className="font-bold text-cyan-300">{activeMeasureObj.maxPedalDepth}/127</div>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-200 leading-relaxed">{activeMeasureObj.teacherNote}</p>
                  </div>
                )}
              </div>

              {/* Phrase-by-Phrase Conservatory Critique Cards */}
              <div className="space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-zinc-300">
                  {isDe ? 'Phrasen-Kritik (Musikalische Gestaltung)' : 'Phrase-by-Phrase Conservatory Critique'}
                </div>
                {results.phraseCritiques.map((pc) => (
                  <div
                    key={pc.id}
                    className="p-4 rounded-2xl bg-zinc-900/75 border border-white/10 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-extrabold text-xs sm:text-sm text-white">{pc.title}</div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-lg font-mono text-[11px] font-black border ${
                            pc.score >= 85
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : pc.score >= 70
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {pc.score}/100
                        </span>
                        <button
                          type="button"
                          onClick={() => onPracticeProblemMeasures(pc.measureRange)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-[10px] font-bold"
                        >
                          {isDe ? 'Üben' : 'Loop'}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                      {pc.avgMelodyVel !== null && (
                        <span className="px-2 py-0.5 rounded bg-zinc-950 border border-white/10 text-sky-300">
                          RH Vel {pc.avgMelodyVel}
                        </span>
                      )}
                      {pc.avgAccompVel !== null && (
                        <span className="px-2 py-0.5 rounded bg-zinc-950 border border-white/10 text-pink-300">
                          LH/Begl. Vel {pc.avgAccompVel}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-zinc-950 border border-white/10 text-purple-300">
                        Hold {pc.avgHoldRatioPct}%
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-950 border border-white/10 text-cyan-300">
                        Pedal Ø {pc.avgPedalDepth}
                      </span>
                    </div>

                    <ul className="list-disc list-inside space-y-1 text-xs text-zinc-300">
                      {pc.critiquePoints.map((pt, idx) => (
                        <li key={idx}>{pt}</li>
                      ))}
                    </ul>

                    <div className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
                      <strong className="text-amber-300">{isDe ? 'Anschlags-Tipp: ' : 'Touch Tip: '}</strong>
                      {pc.touchTip}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 4: CHRONOLOGICAL EVENT LOG ================= */}
          {activeTab === 'log' && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto pb-1">
                {(
                  [
                    { id: 'all', label: isDe ? `Alle (${results.mistakes.length})` : `All (${results.mistakes.length})` },
                    { id: 'notes', label: isDe ? 'Noten' : 'Notes' },
                    { id: 'timing', label: isDe ? 'Timing / Sync' : 'Timing / Sync' },
                    { id: 'touch', label: isDe ? 'Anschlag / Legato' : 'Touch / Legato' },
                    { id: 'pedal', label: 'Pedal (CC64)' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setLogFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap border transition-colors ${
                      logFilter === f.id
                        ? 'bg-zinc-800 text-white border-white/20'
                        : 'bg-zinc-900/50 text-zinc-400 border-white/5 hover:text-zinc-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {filteredMistakes.length === 0 ? (
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 text-center text-xs text-emerald-400 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isDe ? 'Keine Auffälligkeiten in dieser Kategorie!' : 'Zero flaws in this category!'}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMistakes.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-zinc-900/75 border border-white/5 flex items-center justify-between text-xs gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-white/10 flex-shrink-0">
                          M.{m.measure} (b.{m.beat})
                        </span>
                        <span
                          className={`font-semibold leading-snug ${
                            m.type === 'wrong-key' || m.type === 'harsh-attack'
                              ? 'text-rose-300'
                              : m.type === 'missed-note' || m.type === 'clipped-legato'
                              ? 'text-amber-300'
                              : m.type === 'muddy-pedal'
                              ? 'text-cyan-300'
                              : 'text-sky-300'
                          }`}
                        >
                          {m.description}
                        </span>
                      </div>

                      {m.timingOffsetMs !== undefined && (
                        <span className="text-[11px] font-mono text-zinc-400 flex-shrink-0">
                          {m.timingOffsetMs > 0 ? `+${m.timingOffsetMs}ms` : `${m.timingOffsetMs}ms`}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-zinc-950/95 border-t border-white/10 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>
              {isDe
                ? `M.${results.examMeasureRange[0]}–${results.examMeasureRange[1]} wiederholen`
                : `Retry M.${results.examMeasureRange[0]}–${results.examMeasureRange[1]}`}
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black transition-colors active:scale-95"
          >
            {isDe ? 'Fertig' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  )
}
