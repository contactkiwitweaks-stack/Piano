import React, { useState } from 'react'
import type { MasterclassAnnotation, Piece } from '../types/music'
import type { MasterEditionId } from '../types/edition'
import { translations, type LanguageCode } from '../i18n/translations'
import { masterclassTranslations } from '../i18n/masterclassTranslations'
import {
  GraduationCap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Hand,
  Clock,
  Mic,
  AlertTriangle,
} from 'lucide-react'

interface MasterclassOverlayProps {
  piece: Piece
  currentTime: number
  damperPedal: number
  edition: MasterEditionId
  language: LanguageCode
  isMicActive: boolean
  wrongNoteMidi: number | null
}

export const MasterclassOverlay: React.FC<MasterclassOverlayProps> = ({
  piece,
  currentTime,
  damperPedal,
  edition,
  language,
  isMicActive,
  wrongNoteMidi,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true)
  const t = translations[language]

  const activeAnnotation: MasterclassAnnotation | undefined = React.useMemo(() => {
    const ann = piece.annotations.find(
      (a) => Math.abs(currentTime - a.referenceTimestampSeconds) < 6.0
    )
    return ann || piece.annotations[0]
  }, [piece.annotations, currentTime])

  const currentSection = React.useMemo(() => {
    return (
      piece.sections.find((s) => currentTime >= s.startTime && currentTime <= s.endTime) ||
      piece.sections[0]
    )
  }, [piece.sections, currentTime])

  if (!activeAnnotation) return null

  // Lookup localized content
  const localizedContent = masterclassTranslations[language]?.[activeAnnotation.id]
  const displayTitle = localizedContent?.title || activeAnnotation.title
  const displayInstruction = localizedContent?.instruction || activeAnnotation.instruction
  const displayWrist = localizedContent?.wristGuidance || activeAnnotation.wristGuidance
  const displayHand = localizedContent?.handTechnique || activeAnnotation.handTechnique
  const displayPedalRule = localizedContent?.pedalRule || activeAnnotation.pedalGuidance?.explanation

  const pedalDepthPercent = Math.round((damperPedal / 127) * 100)
  const isPedalEngaged = damperPedal >= 35
  const isHalfPedal = damperPedal >= 25 && damperPedal <= 70

  let pedalFeedback = t.pedalDamped
  let pedalColor = 'text-zinc-400'
  if (isHalfPedal) {
    pedalFeedback = t.halfPedal
    pedalColor = 'text-cyan-400'
  } else if (isPedalEngaged) {
    pedalFeedback = t.fullSustain
    pedalColor = 'text-amber-400'
  }

  return (
    <div className="absolute top-14 left-2 right-2 sm:left-4 sm:right-auto sm:w-96 z-30 pointer-events-auto">
      <div
        className={`bg-zinc-900/95 backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          wrongNoteMidi ? 'border-red-500 shadow-red-500/30' : 'border-amber-500/30'
        }`}
      >
        {/* Wrong Note Strobe Alert */}
        {wrongNoteMidi && (
          <div className="bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>{t.wrongNoteDetected}</span>
            </div>
            <span className="font-mono text-xs">MIDI {wrongNoteMidi}</span>
          </div>
        )}

        {/* Header Bar */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border-b border-zinc-800/80 cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-wider uppercase text-amber-400/90 flex items-center gap-1.5">
                {t.masterclass}
                <span className="text-zinc-400 font-normal lowercase italic">
                  • {edition.toUpperCase()}
                </span>
                {isMicActive && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1 rounded flex items-center gap-0.5 border border-emerald-500/30">
                    <Mic className="w-2.5 h-2.5 animate-pulse" />
                    Mic
                  </span>
                )}
              </div>
              <h4 className="text-xs font-semibold text-zinc-100 truncate max-w-[200px]">
                {displayTitle}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="text-[10px] font-mono bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700">
              {t.ui.measure} {activeAnnotation.measureRange[0]}–{activeAnnotation.measureRange[1]}
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="p-3.5 space-y-3 text-xs">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/60">
              <span className="font-medium text-amber-300/90">{currentSection.title}</span>
              <span className="text-zinc-400 italic text-[10px] truncate max-w-[170px]">
                {currentSection.tempoSuggestion}
              </span>
            </div>

            <p className="text-zinc-200 leading-relaxed font-sans text-xs">
              {displayInstruction}
            </p>

            {(displayWrist || displayHand) && (
              <div className="bg-zinc-800/40 p-2.5 rounded-lg border border-zinc-700/50 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
                  <Hand className="w-3.5 h-3.5" />
                  <span>{t.categories.fingering}</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-snug">
                  {displayWrist || displayHand}
                </p>
              </div>
            )}

            <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.categories.pedal}</span>
                </div>
                <span className={`text-[10px] font-mono font-bold ${pedalColor}`}>
                  {pedalDepthPercent}% ({pedalFeedback})
                </span>
              </div>

              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-75"
                  style={{ width: `${pedalDepthPercent}%` }}
                />
              </div>

              {displayPedalRule && (
                <p className="text-zinc-400 text-[10px] leading-tight">
                  <strong className="text-amber-200">{t.rule}: </strong>
                  {displayPedalRule}
                </p>
              )}
            </div>

            <div className="pt-1 flex items-center justify-between border-t border-zinc-800/80 text-[11px]">
              <span className="text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                {t.holdTimesSynced}
              </span>
              <a
                href="https://www.youtube.com/watch?v=gYUa-2L7ryY"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors font-medium text-[11px]"
              >
                <span>{t.videoTutorial}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
