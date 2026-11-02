import React, { useState } from 'react'
import type { Piece } from '../types/music'
import type { LanguageCode } from '../i18n/translations'
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
} from 'lucide-react'

export interface CompetitionMistake {
  id: string
  measure: number
  beat: number
  timestampSec: number
  type: 'wrong-key' | 'missed-note' | 'early' | 'late' | 'flat-dynamics' | 'muddy-pedal'
  expectedNoteName?: string
  playedNoteName?: string
  timingOffsetMs?: number
  description: string
}

export interface CompetitionResults {
  score: number
  maxPossibleScore: number
  maxCombo: number
  totalNotes: number
  notesHit: number
  notesMissed: number
  extraNotesCount: number
  accuracyPercent: number
  averageTimingErrorMs: number
  dynamicRatingPercent: number
  pedalRatingPercent: number
  grade: 'S+' | 'S' | 'A' | 'B' | 'C' | 'D'
  mistakes: CompetitionMistake[]
  problemMeasures: [number, number]
}

interface CompetitionReportModalProps {
  isOpen: boolean
  onClose: () => void
  onRetry: () => void
  onPracticeProblemMeasures: (loopRange: [number, number]) => void
  results: CompetitionResults | null
  activePiece: Piece
  language: LanguageCode
}

export const CompetitionReportModal: React.FC<CompetitionReportModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  onPracticeProblemMeasures,
  results,
  activePiece,
  language,
}) => {
  const [filter, setFilter] = useState<'all' | 'wrong' | 'missed' | 'timing'>('all')

  if (!isOpen || !results) return null

  // Grade color scheme
  const gradeColors: Record<string, { bg: string; text: string; glow: string; label: string }> = {
    'S+': {
      bg: 'from-amber-400 via-orange-500 to-yellow-500',
      text: 'text-amber-300',
      glow: 'shadow-[0_0_40px_rgba(245,158,11,0.5)]',
      label: language === 'de' ? 'Virtuoser Großmeister' : 'Virtuoso Maestro',
    },
    'S': {
      bg: 'from-amber-500 to-yellow-600',
      text: 'text-yellow-400',
      glow: 'shadow-[0_0_30px_rgba(234,179,8,0.4)]',
      label: language === 'de' ? 'Konzertreife' : 'Concert Standard',
    },
    'A': {
      bg: 'from-emerald-500 to-teal-600',
      text: 'text-emerald-400',
      glow: 'shadow-[0_0_25px_rgba(16,185,129,0.3)]',
      label: language === 'de' ? 'Auszeichnung' : 'High Distinction',
    },
    'B': {
      bg: 'from-sky-500 to-blue-600',
      text: 'text-sky-400',
      glow: 'shadow-[0_0_20px_rgba(14,165,233,0.3)]',
      label: language === 'de' ? 'Gutes Niveau' : 'Solid Performance',
    },
    'C': {
      bg: 'from-purple-500 to-indigo-600',
      text: 'text-purple-400',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]',
      label: language === 'de' ? 'In Entwicklung' : 'Developing',
    },
    'D': {
      bg: 'from-rose-600 to-red-700',
      text: 'text-rose-400',
      glow: 'shadow-[0_0_20px_rgba(225,29,72,0.3)]',
      label: language === 'de' ? 'Übung erforderlich' : 'Needs Practice',
    },
  }

  const currentGradeStyle = gradeColors[results.grade] || gradeColors['C']

  const filteredMistakes = results.mistakes.filter((m) => {
    if (filter === 'wrong') return m.type === 'wrong-key'
    if (filter === 'missed') return m.type === 'missed-note'
    if (filter === 'timing') return m.type === 'early' || m.type === 'late'
    return true
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[92vh] bg-[#0c0d12] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 select-none">
        {/* Header */}
        <div className="px-5 py-4 bg-zinc-950/90 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>{language === 'de' ? 'Wettbewerbs-Auswertung' : 'Competition Jury Report'}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {activePiece.title}
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                {language === 'de'
                  ? 'Exakte Urtext-Jurierung nach Genauigkeit, Tempo, Notenfehlern & Ausdruck'
                  : 'Acoustic adjudication on note accuracy, extra keys, latency & dynamics'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-900 border border-white/10 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm">
          {/* Main Hero: Grade Badge & Points */}
          <div className="p-5 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950/80 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden">
            <div className="flex items-center gap-5">
              {/* Radial Grade Circle */}
              <div
                className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${currentGradeStyle.bg} flex flex-col items-center justify-center font-black ${currentGradeStyle.glow} flex-shrink-0 border-2 border-white/30`}
              >
                <span className="text-3xl text-zinc-950 font-black tracking-tighter leading-none">
                  {results.grade}
                </span>
                <span className="text-[9px] uppercase tracking-widest text-zinc-950/90 font-bold mt-0.5">
                  GRADE
                </span>
              </div>

              <div>
                <div className={`text-xs font-bold uppercase tracking-wider ${currentGradeStyle.text}`}>
                  {currentGradeStyle.label}
                </div>
                <div className="text-3xl font-black text-white font-mono mt-0.5 tracking-tight">
                  {results.score.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-zinc-400">/ 100,000 PTS</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-300">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span>Max Combo: <strong className="font-mono text-white">{results.maxCombo}x</strong></span>
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Accuracy: <strong className="font-mono text-emerald-300">{results.accuracyPercent}%</strong></span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action: Practice Problem Measures */}
            <div className="w-full sm:w-auto flex flex-col gap-2">
              <button
                onClick={() => onPracticeProblemMeasures(results.problemMeasures)}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(245,158,11,0.35)] transition-all active:scale-95"
              >
                <Repeat className="w-4 h-4" />
                <span>
                  {language === 'de'
                    ? `Problem-Takte ${results.problemMeasures[0]}–${results.problemMeasures[1]} gezielt üben`
                    : `Practice Problem M. ${results.problemMeasures[0]}–${results.problemMeasures[1]}`}
                </span>
              </button>
            </div>
          </div>

          {/* 5-Pillar Scorecard Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col">
              <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
                <span>{language === 'de' ? 'Richtige Töne' : 'Correct Notes'}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-lg font-black text-white font-mono">
                {results.notesHit}{' '}
                <span className="text-xs text-zinc-500 font-normal">/ {results.totalNotes}</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {results.notesMissed > 0 ? `${results.notesMissed} missed` : 'Zero missed notes'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col">
              <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
                <span>{language === 'de' ? 'Überflüssige Tasten' : 'Extra / Wrong Notes'}</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className={`text-lg font-black font-mono ${results.extraNotesCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {results.extraNotesCount}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {results.extraNotesCount > 0 ? 'Penalized key hits' : 'Clean touch control'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col">
              <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
                <span>{language === 'de' ? 'Timing-Genauigkeit' : 'Timing Offset'}</span>
                <Clock className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-lg font-black text-sky-300 font-mono">
                ±{results.averageTimingErrorMs} ms
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {results.averageTimingErrorMs < 35 ? 'Concert precision' : 'Rushed/dragged rubato'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col">
              <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
                <span>{language === 'de' ? 'Dynamischer Kontrast' : 'Dynamics (pp–ff)'}</span>
                <Volume2 className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-lg font-black text-purple-300 font-mono">
                {results.dynamicRatingPercent}%
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {results.dynamicRatingPercent > 80 ? 'Rich cantabile voicing' : 'Flat velocity output'}
              </div>
            </div>
          </div>

          {/* Masterclass AI Juror Critique */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>{language === 'de' ? 'Jury-Gutachten & Diagnose' : 'Jury Performance Critique'}</span>
            </div>
            <p className="text-zinc-300">
              {results.accuracyPercent >= 95
                ? language === 'de'
                  ? 'Hervorragende technische Beherrschung. Die Artikulation und Notentreue entsprechen dem Standard großer Konservatorien. Konzentriere dich auf noch feinere dynamische Abstufungen zwischen Melodie und Bass.'
                  : 'Exceptional concert-level command. Your pitch accuracy and rhythmic pulse match high conservatory standards. Keep polishing subtle micro-rubato.'
                : results.extraNotesCount > 5
                ? language === 'de'
                  ? `Du hast ${results.extraNotesCount} falsche oder zusätzliche Tasten gedrückt. Dies deutet auf Spannungen in den äußeren Fingern (Finger 4 & 5) hin. Übe die Takte ${results.problemMeasures[0]}–${results.problemMeasures[1]} langsam im Übe-Modus.`
                  : `You struck ${results.extraNotesCount} extra/unintended keys. This usually indicates finger 4 & 5 independence strain. Isolate measures ${results.problemMeasures[0]}–${results.problemMeasures[1]} at slow tempo in Practice Mode.`
                : language === 'de'
                ? `Solider Durchgang mit leichten Unsicherheiten im Timing (durchschnittlich ±${results.averageTimingErrorMs}ms). Nutze das Metronom, um rhythmische Beschleunigungen vor komplexen Akkorden abzufangen.`
                : `Solid foundation with slight timing fluctuations (average offset ±${results.averageTimingErrorMs}ms). Maintain steady breath before entering thick chord clusters.`}
            </p>
          </div>

          {/* Detailed Note-by-Note Mistake Log */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span>
                  {language === 'de' ? 'Exakte Fehler-Chronologie' : 'Exact Mistake Breakdown'} (
                  {results.mistakes.length})
                </span>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filter === 'all'
                      ? 'bg-zinc-800 text-white border border-white/20'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All ({results.mistakes.length})
                </button>
                <button
                  onClick={() => setFilter('wrong')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filter === 'wrong'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Wrong / Extra Keys
                </button>
                <button
                  onClick={() => setFilter('missed')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filter === 'missed'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Missed Notes
                </button>
                <button
                  onClick={() => setFilter('timing')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filter === 'timing'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Timing Flaws
                </button>
              </div>
            </div>

            {/* Mistake Items */}
            {filteredMistakes.length === 0 ? (
              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 text-center text-xs text-emerald-400 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero mistakes in this category. Flawless execution!</span>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {filteredMistakes.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-zinc-900/70 border border-white/5 flex items-center justify-between text-xs gap-3 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/10 flex-shrink-0">
                        M. {m.measure} (b. {m.beat})
                      </span>
                      <span
                        className={`font-semibold ${
                          m.type === 'wrong-key'
                            ? 'text-rose-400'
                            : m.type === 'missed-note'
                            ? 'text-amber-400'
                            : 'text-sky-400'
                        }`}
                      >
                        {m.description}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-zinc-400 flex-shrink-0">
                      {m.timingOffsetMs !== undefined && (
                        <span className={m.timingOffsetMs > 0 ? 'text-amber-300' : 'text-sky-300'}>
                          {m.timingOffsetMs > 0 ? `+${m.timingOffsetMs}ms early` : `${m.timingOffsetMs}ms late`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-zinc-950/90 border-t border-white/10 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            onClick={onRetry}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{language === 'de' ? 'Wiederholen' : 'Retry Piece'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black transition-colors"
          >
            {language === 'de' ? 'Fertig' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  )
}
