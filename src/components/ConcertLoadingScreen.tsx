import React, { useEffect, useState } from 'react'
import type { LibraryPieceSummary } from '../types/edition'
import { Sparkles, Clock, ArrowRight } from 'lucide-react'

interface ConcertLoadingScreenProps {
  pieceSummary: LibraryPieceSummary
  onReady: () => void
}

export const ConcertLoadingScreen: React.FC<ConcertLoadingScreenProps> = ({
  pieceSummary,
  onReady,
}) => {
  const [progress, setProgress] = useState(15)
  const [statusMessage, setStatusMessage] = useState('Initializing Concert Grand Bösendorfer Acoustics...')

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(45)
      setStatusMessage('Analyzing measure voicings & sheet layout...')
    }, 250)

    const timer2 = setTimeout(() => {
      setProgress(80)
      setStatusMessage('Calibrating Flowkey microphone note recognition...')
    }, 550)

    const timer3 = setTimeout(() => {
      setProgress(100)
      setStatusMessage('Stage ready. Let the music flow!')
    }, 850)

    const timer4 = setTimeout(() => {
      onReady()
    }, 1100)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [onReady])

  const coverSrc = pieceSummary.coverImage || '/images/covers/carol-of-the-bells.svg'

  return (
    <div className="fixed inset-0 z-50 bg-[#07070b] text-white flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-hidden animate-in fade-in duration-300">
      {/* Blurred Ambient Background Artwork */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={coverSrc}
          alt=""
          className="w-full h-full object-cover scale-125 blur-3xl opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070b] via-[#07070b]/80 to-[#07070b]/60" />
      </div>

      {/* Main Glass Card */}
      <div className="relative z-10 w-full max-w-lg bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
        {/* Floating Album Art Picture with Glow */}
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-tr from-amber-500/30 via-orange-500/20 to-purple-500/30 rounded-3xl blur-xl opacity-75 animate-pulse" />
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-zinc-950">
            <img
              src={coverSrc}
              alt={pieceSummary.title}
              className="w-full h-full object-cover"
            />
            {pieceSummary.badge && (
              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-bold text-amber-300 shadow-md">
                {pieceSummary.badge}
              </div>
            )}
          </div>
        </div>

        {/* Piece Details */}
        <div className="space-y-1.5 w-full">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-amber-200 tracking-tight leading-tight line-clamp-2">
            {pieceSummary.title}
          </h2>
          <p className="text-sm sm:text-base font-semibold text-orange-400">
            {pieceSummary.composer}
          </p>
          <div className="flex items-center justify-center gap-3 pt-1 text-xs text-zinc-400 font-mono">
            <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">
              {pieceSummary.key}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              {Math.floor(pieceSummary.durationSeconds / 60)}:{(pieceSummary.durationSeconds % 60).toString().padStart(2, '0')}
            </span>
            <span>•</span>
            <span className="text-amber-400 font-bold">
              Level {pieceSummary.difficulty}/10
            </span>
          </div>
        </div>

        {/* Quote / Performance Tip */}
        {pieceSummary.quote && (
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-zinc-300 italic max-w-md leading-relaxed">
            "{pieceSummary.quote}"
          </div>
        )}

        {/* Animated Loading Bar & Status */}
        <div className="w-full space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="truncate max-w-[80%] text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              {statusMessage}
            </span>
            <span className="font-bold text-amber-400">{progress}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden relative border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-amber-300 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(245,158,11,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Instant Skip / Start Button */}
        <button
          onClick={onReady}
          className="mt-2 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-orange-500 text-white hover:text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 border border-white/10 hover:border-orange-400 shadow-md"
        >
          <span>Start Playing Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
