import React from 'react'
import type { Piece } from '../types/music'
import type { LanguageCode } from '../i18n/translations'
import { PassivePracticeCoach, type PracticeCoachInsight } from '../engine/PassivePracticeCoach'
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Repeat,
  Clock,
  Target,
  Hand,
  TrendingUp,
  RotateCcw,
  GraduationCap,
} from 'lucide-react'

interface PracticeCoachModalProps {
  isOpen: boolean
  onClose: () => void
  piece: Piece
  language: LanguageCode
  onPracticeLoop: (range: [number, number], handMode?: 'both' | 'right' | 'left') => void
  onResetStats: () => void
  refreshKey?: number
}

export const PracticeCoachModal: React.FC<PracticeCoachModalProps> = ({
  isOpen,
  onClose,
  piece,
  language,
  onPracticeLoop,
  onResetStats,
}) => {
  if (!isOpen) return null

  const isDe = language === 'de'
  const insight: PracticeCoachInsight = PassivePracticeCoach.getInstance().analyzePiece(piece, language)

  const tileColor = (lvl: 'mastered' | 'good' | 'shaky' | 'problem') => {
    if (lvl === 'mastered') return 'bg-emerald-500/20 border-emerald-500/45 text-emerald-300'
    if (lvl === 'good') return 'bg-sky-500/15 border-sky-500/35 text-sky-300'
    if (lvl === 'shaky') return 'bg-amber-500/20 border-amber-500/45 text-amber-300'
    return 'bg-rose-500/25 border-rose-500/50 text-rose-300'
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90dvh] bg-[#0c0d12] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 select-none"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-zinc-950/95 border-b border-white/10 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 flex-wrap">
                <span>{isDe ? 'Passiver Übe-Coach (Wait & Flow)' : 'Passive Practice Coach (Wait & Flow)'}</span>
              </h2>
              <p className="text-[11px] text-zinc-400 truncate">
                {piece.title} • {isDe ? 'Analysiert automatisch beim Üben — auch ohne Wettbewerbsmodus' : 'Silently tracks your mistakes, hesitations & strengths during normal practice'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white flex-shrink-0"
            aria-label="Close Practice Coach"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs flex-1 min-h-0 touch-pan-y">
          {/* Coach Verdict Summary */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-zinc-900/90 to-zinc-950 border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-extrabold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>{isDe ? 'Live-Einschätzung deines Übens' : 'Your Live Practice Diagnosis'}</span>
              </span>
              {insight.hasData && (
                <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {insight.accuracyPercent}% {isDe ? 'sicher' : 'accurate'}
                </span>
              )}
            </div>
            <p className="text-zinc-200 leading-relaxed">{insight.coachSummary}</p>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
              <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/5 text-center">
                <div className="text-base font-black text-emerald-300">{insight.totalNotesHit}</div>
                <div className="text-[10px] text-zinc-400">{isDe ? 'Töne geübt' : 'Notes Hit'}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/5 text-center">
                <div className={`text-base font-black ${insight.totalWrongKeys > 0 ? 'text-rose-400' : 'text-emerald-300'}`}>
                  {insight.totalWrongKeys}
                </div>
                <div className="text-[10px] text-zinc-400">{isDe ? 'Patzer gesamt' : 'Wrong Keys'}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/5 text-center">
                <div className="text-base font-black text-sky-300">
                  {insight.avgHesitationMs > 0 ? `${(insight.avgHesitationMs / 1000).toFixed(1)}s` : '—'}
                </div>
                <div className="text-[10px] text-zinc-400">{isDe ? 'Ø Wait-Zögern' : 'Avg Hesitation'}</div>
              </div>
            </div>
          </div>

          {insight.hasData && (
            <>
              {/* 1. WHERE TO IMPROVE (Weak Sections) */}
              <div className="space-y-2.5">
                <div className="font-extrabold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{isDe ? 'Abschnitte mit den meisten Fehlern / Stocken' : 'Sections Needing Most Improvement'}</span>
                </div>

                {insight.weakSections.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/25 text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isDe ? 'Keine Problemstellen erkannt — sehr flüssiges Üben!' : 'No problem sections detected — fluent practice!'}</span>
                  </div>
                ) : (
                  insight.weakSections.map((ws) => (
                    <div
                      key={`${ws.measureRange[0]}-${ws.measureRange[1]}`}
                      className="p-3.5 rounded-2xl bg-zinc-900/80 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="font-bold text-white flex items-center gap-2 flex-wrap">
                          <span>{ws.title}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                            {ws.accuracyPercent}% • {ws.wrongKeys} {isDe ? 'Fehler' : 'misses'}
                          </span>
                        </div>
                        <p className="text-zinc-300 leading-snug">{ws.reason}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose()
                          onPracticeLoop(ws.measureRange, 'both')
                        }}
                        className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[11px] flex items-center justify-center gap-1.5 flex-shrink-0 active:scale-95 transition-all"
                      >
                        <Repeat className="w-3.5 h-3.5" />
                        <span>{isDe ? `M.${ws.measureRange[0]}–${ws.measureRange[1]} loopen` : `Loop M.${ws.measureRange[0]}–${ws.measureRange[1]}`}</span>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* 2. WHAT MISTAKES YOU MAKE MOST (Recurring Note Slips + Hand Split) */}
              <div className="space-y-2.5">
                <div className="font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  <span>{isDe ? 'Welche Fehler dir am häufigsten passieren' : 'Your Most Frequent Mistake Patterns'}</span>
                </div>

                {/* RH vs LH Diagnostic */}
                <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-zinc-200">
                    <Hand className="w-4 h-4 text-sky-400 flex-shrink-0" />
                    <span>{insight.handBalance.verdict}</span>
                  </div>
                  {(insight.handBalance.lhWrong > insight.handBalance.rhWrong || insight.handBalance.rhWrong > insight.handBalance.lhWrong) && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        onPracticeLoop(
                          insight.nextRecommendedLoop,
                          insight.handBalance.lhWrong > insight.handBalance.rhWrong ? 'left' : 'right'
                        )
                      }}
                      className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/35 border border-sky-500/40 text-sky-300 font-bold text-[10px]"
                    >
                      {insight.handBalance.lhWrong > insight.handBalance.rhWrong
                        ? isDe
                          ? 'LH isoliert üben'
                          : 'Drill LH Only'
                        : isDe
                        ? 'RH isoliert üben'
                        : 'Drill RH Only'}
                    </button>
                  )}
                </div>

                {insight.topMistakePatterns.length > 0 && (
                  <div className="space-y-1.5">
                    {insight.topMistakePatterns.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-zinc-900/70 border border-white/5 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-white">
                            <span className="text-rose-400">{p.playedName}</span>
                            <span className="text-zinc-500 mx-1.5">→</span>
                            <span className="text-emerald-400">{p.expectedName}</span>
                          </span>
                          <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                            {p.count}x {isDe ? 'verwechselt' : 'slips'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">{p.tip}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. WHAT ALREADY WORKS WELL (Strengths!) */}
              {insight.strongSections.length > 0 && (
                <div className="space-y-2.5">
                  <div className="font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>{isDe ? 'Was bei dir schon super funktioniert' : 'What Already Works Well'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {insight.strongSections.map((st) => (
                      <div
                        key={`${st.measureRange[0]}-${st.measureRange[1]}`}
                        className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/25 space-y-1"
                      >
                        <div className="font-bold text-emerald-200 flex items-center justify-between">
                          <span>{st.title}</span>
                          <span className="font-mono text-[10px] text-emerald-400">{st.accuracyPercent}%</span>
                        </div>
                        <p className="text-[11px] text-zinc-300">{st.praise}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. PRACTICED MEASURE HEATMAP */}
              {insight.measureHeatmap.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      <span>{isDe ? 'Geübte Takte (antippen zum Loopen)' : 'Practiced Measures (Tap to Loop)'}</span>
                    </span>
                    <span className="text-[10px] text-zinc-500">{insight.practicedMeasuresCount} Takte</span>
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5">
                    {insight.measureHeatmap.map((m) => (
                      <button
                        key={m.measure}
                        type="button"
                        onClick={() => {
                          onClose()
                          onPracticeLoop([m.measure, m.measure + 1], 'both')
                        }}
                        className={`py-2 px-1 rounded-xl border font-mono text-center transition-all active:scale-95 ${tileColor(m.level)}`}
                        title={`M.${m.measure}: ${m.accuracyPercent}% (${m.wrongKeys} wrong, ${m.avgWaitMs}ms wait)`}
                      >
                        <div className="text-xs font-black">{m.measure}</div>
                        <div className="text-[9px] opacity-80">{m.accuracyPercent}%</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-zinc-950/95 border-t border-white/10 flex items-center justify-between gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              PassivePracticeCoach.getInstance().clearPieceHistory(piece.id)
              onResetStats()
            }}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-rose-300 text-xs font-bold flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isDe ? 'Verlauf zurücksetzen' : 'Reset History'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black"
          >
            {isDe ? 'Schließen' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
