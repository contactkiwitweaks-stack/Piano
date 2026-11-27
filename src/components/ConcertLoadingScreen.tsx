import React, { useEffect, useState } from 'react'
import type { LibraryPieceSummary } from '../types/edition'
import { PianoAudioEngine } from '../audio/PianoAudioEngine'
import { Sparkles, Clock, ArrowRight, Music, CheckCircle2, Music2 } from 'lucide-react'

interface ConcertLoadingScreenProps {
  pieceSummary?: LibraryPieceSummary | null
  mode?: 'app-boot' | 'song-load'
  onReady: () => void
}

export const ConcertLoadingScreen: React.FC<ConcertLoadingScreenProps> = ({
  pieceSummary = null,
  mode = 'song-load',
  onReady,
}) => {
  const [progress, setProgress] = useState(15)
  const [statusMessage, setStatusMessage] = useState('Initializing Steinway Model B Acoustic Engine...')
  const [sampleCounts, setSampleCounts] = useState<{ loaded: number; total: number }>({ loaded: 0, total: 26 })
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isCancelled = false
    const engine = PianoAudioEngine.getInstance()

    // Unlock audio context eagerly on user entry
    engine.unlockAudio().catch(() => {})

    // Fast path: if main acoustic engine is already warm when switching songs, close almost immediately!
    if (mode === 'song-load' && engine.getTelemetry().isMainEngineActive) {
      setProgress(100)
      setStatusMessage('Steinway Model B Concert Ready!')
      setIsReady(true)
      const quickTimer = setTimeout(() => {
        if (!isCancelled) onReady()
      }, 280)
      return () => {
        isCancelled = true
        clearTimeout(quickTimer)
      }
    }

    engine
      .preloadCoreSamples((pct, msg, loaded, total) => {
        if (isCancelled) return
        setProgress(pct)
        setStatusMessage(msg)
        setSampleCounts({ loaded, total })
      })
      .then(() => {
        if (isCancelled) return
        setProgress(100)
        setStatusMessage('Steinway Model B Concert Ready!')
        setIsReady(true)

        const timer = setTimeout(() => {
          if (!isCancelled) {
            onReady()
          }
        }, 550)
        return () => clearTimeout(timer)
      })
      .catch(() => {
        if (isCancelled) return
        setProgress(100)
        setStatusMessage('Stage Ready')
        setIsReady(true)
        const timer = setTimeout(() => {
          if (!isCancelled) {
            onReady()
          }
        }, 350)
        return () => clearTimeout(timer)
      })

    return () => {
      isCancelled = true
    }
  }, [onReady, mode])

  const isAppBoot = mode === 'app-boot' || !pieceSummary
  const coverSrc = pieceSummary?.coverImage || '/images/covers/chopin-ballade-1.svg'

  return (
    <div className="fixed inset-0 z-50 bg-[#07070b] text-white flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-hidden animate-in fade-in duration-300">
      {/* Blurred Ambient Background Artwork */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {!isAppBoot && (
          <img
            src={coverSrc}
            alt=""
            className="w-full h-full object-cover scale-125 blur-3xl opacity-25"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: isAppBoot
              ? 'radial-gradient(circle at 50% 30%, rgba(249,115,22,0.18), rgba(7,7,11,0.96) 70%)'
              : 'linear-gradient(to top, #07070b, rgba(7,7,11,0.8), rgba(7,7,11,0.6))',
          }}
        />
      </div>

      {/* Main Glass Card */}
      <div className="relative z-10 w-full max-w-lg bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
        {isAppBoot ? (
          /* Clean Branded Virtuoso Studio Startup Splash (never falsely displays Für Elise!) */
          <>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-orange-500/35 via-amber-400/20 to-sky-500/25 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.5)] border-2 border-white/25">
                <Music2 className="w-12 h-12 text-zinc-950" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-widest">
                Virtuoso Concert Studio
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-orange-300 tracking-tight">
                Virtuoso Piano
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-sm">
                Steinway Model B Concert Grand • Roland LX-9 Bluetooth Conservatory Coach • Henle Urtext Engraving
              </p>
            </div>
          </>
        ) : (
          /* Specific Song Loading Card (only shown when actually opening a song!) */
          <>
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
                  {Math.floor(pieceSummary.durationSeconds / 60)}:
                  {(pieceSummary.durationSeconds % 60).toString().padStart(2, '0')}
                </span>
                <span>•</span>
                <span className="text-amber-400 font-bold">Level {pieceSummary.difficulty}/10</span>
              </div>
            </div>

            {pieceSummary.quote && (
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-zinc-300 italic max-w-md leading-relaxed">
                "{pieceSummary.quote}"
              </div>
            )}
          </>
        )}

        {/* Real Audio Engine Loading Bar & Live Status */}
        <div className="w-full space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="truncate max-w-[80%] text-zinc-300 flex items-center gap-1.5">
              {isReady ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin flex-shrink-0" />
              )}
              <span className="truncate">{statusMessage}</span>
            </span>
            <span className="font-bold text-amber-400 flex-shrink-0">{progress}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden relative border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-amber-300 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(245,158,11,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 px-1 pt-0.5">
            <span className="flex items-center gap-1">
              <Music className="w-3 h-3 text-orange-400" />
              <span>Steinway Model B (Vienna Musikverein IR)</span>
            </span>
            <span className="text-amber-300 font-semibold">
              {sampleCounts.loaded > 0
                ? `${sampleCounts.loaded}/${sampleCounts.total} samples`
                : 'Acoustic FLAC'}
            </span>
          </div>
        </div>

        {/* Instant Skip / Start Button */}
        <button
          type="button"
          onClick={onReady}
          className="mt-1 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-orange-500 text-white hover:text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 border border-white/10 hover:border-orange-400 shadow-md"
        >
          <span>{isReady ? (isAppBoot ? 'Open Studio' : 'Start Concert') : 'Skip & Continue'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
