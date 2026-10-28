import React, { useState } from 'react'
import type { Piece } from '../types/music'
import type { MasterEditionId } from '../types/edition'
import type { LanguageCode } from '../i18n/translations'
import { FallingKeysCanvas, type VisualTheme } from './FallingKeysCanvas'
import { SheetMusicView } from './SheetMusicView'
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  ChevronLeft,
  Mic,
  MicOff,
  Bluetooth,
  Hand,
  Layers,
  GraduationCap,
  Sparkles,
  X,
  Gauge,
  Columns,
  FileText,
  Clock,
  Box,
  Timer,
  TrendingUp,
  Award,
  Sliders,
  ChevronDown,
} from 'lucide-react'

interface FlowkeyPlayerViewProps {
  piece: Piece
  currentTime: number
  isPlaying: boolean
  playbackRate: number
  handMode: 'both' | 'right' | 'left'
  isWaitMode: boolean
  showHands: boolean
  isLooping: boolean
  loopRange: [number, number]
  activeNotes: Map<number, { velocity: number; timestamp: number }>
  damperPedal: number
  edition: MasterEditionId
  language: LanguageCode
  isConnectedLX9: boolean
  isMicActive: boolean
  wrongNoteMidi: number | null
  expectedNotes?: number[]
  isMetronomeOn?: boolean
  isSpeedRamp?: boolean
  accuracyPercent?: number
  onTogglePlay: () => void
  onRewind: () => void
  onSeek: (time: number) => void
  onRateChange: (rate: number) => void
  onHandModeChange: (mode: 'both' | 'right' | 'left') => void
  onToggleWaitMode: () => void
  onToggleHands: () => void
  onToggleLoop: () => void
  onLoopRangeChange: (range: [number, number]) => void
  onToggleMic: () => void
  onToggleMetronome?: () => void
  onToggleSpeedRamp?: () => void
  onOpenAudioSettings?: () => void
  onEditionChange?: (edition: MasterEditionId) => void
  onOpenBluetoothModal: () => void
  onBackToDiscovery: () => void
  onScreenKeyPress?: (midi: number) => void
  onTogglePedal?: () => void
}

export const FlowkeyPlayerView: React.FC<FlowkeyPlayerViewProps> = ({
  piece,
  currentTime,
  isPlaying,
  playbackRate,
  handMode,
  isWaitMode,
  showHands,
  isLooping,
  loopRange,
  activeNotes,
  damperPedal,
  edition,
  language,
  isConnectedLX9,
  isMicActive,
  wrongNoteMidi,
  expectedNotes = [],
  isMetronomeOn = false,
  isSpeedRamp = false,
  accuracyPercent = 100,
  onTogglePlay,
  onRewind,
  onSeek,
  onRateChange,
  onHandModeChange,
  onToggleWaitMode,
  onToggleHands,
  onToggleLoop,
  onLoopRangeChange,
  onToggleMic,
  onToggleMetronome,
  onToggleSpeedRamp,
  onOpenAudioSettings,
  onEditionChange,
  onOpenBluetoothModal,
  onBackToDiscovery,
  onScreenKeyPress,
  onTogglePedal,
}) => {
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false)
  const [sectionsMenuOpen, setSectionsMenuOpen] = useState(false)
  const [editionMenuOpen, setEditionMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [isMasterclassOpen, setIsMasterclassOpen] = useState(false)
  const [viewLayout, setViewLayout] = useState<'split' | 'keyboard' | 'sheet'>('keyboard')
  const [viewPerspective, setViewPerspective] = useState<'2d' | '3d'>('2d')
  const [theme, setTheme] = useState<VisualTheme>(() => {
    return (localStorage.getItem('virtuoso_theme') as VisualTheme) || 'ylia'
  })
  const [yliaWallpaper, setYliaWallpaper] = useState<string>(() => {
    return localStorage.getItem('virtuoso_ylia_wallpaper') || '/images/ylia_bg.png'
  })

  // Active section based on currentTime
  const currentSection =
    piece.sections.find((s) => currentTime >= s.startTime && currentTime <= s.endTime) ||
    piece.sections[0]

  const progressPercent = Math.min(100, (currentTime / (piece.duration || 1)) * 100)

  return (
    <div className="w-full h-full flex flex-col bg-[#07070b] text-zinc-100 select-none overflow-hidden relative font-sans">
      {/* 1. TOP PREMIUM PLAYER HEADER BAR */}
      <header className="min-h-12 pt-[var(--sat)] bg-zinc-950/90 backdrop-blur-xl border-b border-white/[0.08] px-3 sm:px-6 flex items-center justify-between z-30 flex-shrink-0 shadow-md">
        {/* Left: Back Button & Piece Info */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToDiscovery}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all shadow-sm active:scale-95 flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4 text-orange-500" />
            <span className="hidden sm:inline">
              {language === 'de' ? 'Zurück' : language === 'fr' ? 'Retour' : language === 'ja' ? '戻る' : language === 'zh' ? '返回' : 'Back'}
            </span>
          </button>

          <div className="truncate min-w-0 flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
              {piece.composer} • {piece.title}
            </span>

            {/* Interactive Master Edition Selector */}
            <div className="relative">
              <button
                onClick={() => setEditionMenuOpen(!editionMenuOpen)}
                className="hidden sm:flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/40 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Switch Master Edition / Pianist Interpretation"
              >
                <span>{edition}</span>
                <ChevronDown className="w-3 h-3 text-amber-400" />
              </button>

              {editionMenuOpen && (
                <div className="absolute top-full mt-2 left-0 w-72 bg-zinc-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between border-b border-white/10 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Master Edition
                    </span>
                    <button onClick={() => setEditionMenuOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {[
                    { id: 'urtext' as MasterEditionId, name: 'Henle Urtext', subtitle: 'Canonical Chopin Notation (Pure)', year: '1836' },
                    { id: 'zimerman' as MasterEditionId, name: 'Krystian Zimerman', subtitle: 'Aristocratic Cantabile & Subtle Half-Pedal', year: '1987 DG' },
                    { id: 'horowitz' as MasterEditionId, name: 'Vladimir Horowitz', subtitle: 'Fiery Bravura & Electric Coda (+10%)', year: '1968' },
                    { id: 'lang-lang' as MasterEditionId, name: 'Lang Lang', subtitle: 'Passionate Rubato & Volcanic Contrasts', year: '2001' },
                  ].map((ed) => {
                    const isSelected = edition === ed.id
                    return (
                      <div
                        key={ed.id}
                        onClick={() => {
                          if (onEditionChange) onEditionChange(ed.id)
                          setEditionMenuOpen(false)
                        }}
                        className={`p-2 rounded-xl cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/50 text-white'
                            : 'bg-zinc-800/40 hover:bg-zinc-800 border-transparent text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className={isSelected ? 'text-amber-300' : 'text-zinc-200'}>{ed.name}</span>
                          <span className="text-[10px] font-mono text-zinc-500">{ed.year}</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">{ed.subtitle}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: View Layout Switcher (Keyboard vs Split vs Sheet) */}
        <div className="hidden sm:flex items-center bg-zinc-900 border border-white/10 rounded-xl p-0.5 shadow-inner">
          <button
            onClick={() => setViewLayout('keyboard')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewLayout === 'keyboard'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Keyboard</span>
          </button>
          <button
            onClick={() => setViewLayout('split')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewLayout === 'split'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split</span>
          </button>
          <button
            onClick={() => setViewLayout('sheet')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewLayout === 'sheet'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Sheet</span>
          </button>
        </div>

        {/* Right: Section Selector & Status Tools */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Section Selector */}
          <div className="relative">
            <button
              onClick={() => setSectionsMenuOpen(!sectionsMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-zinc-200 transition-colors shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate max-w-[120px] sm:max-w-[160px]">
                {currentSection?.title || 'Section'}
              </span>
            </button>

            {sectionsMenuOpen && (
              <div className="absolute top-full mt-2 right-0 w-72 sm:w-80 bg-zinc-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1.5">
                <div className="px-3 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{language === 'de' ? 'Abschnitt wählen' : 'Select Section'}</span>
                  <span className="text-amber-400 font-mono">{piece.sections.length}</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                  {piece.sections.map((sec) => {
                    const isActive = currentSection?.id === sec.id
                    return (
                      <div
                        key={sec.id}
                        onClick={() => {
                          onSeek(sec.startTime)
                          onLoopRangeChange([sec.startMeasure, sec.endMeasure])
                          setSectionsMenuOpen(false)
                          setIsMasterclassOpen(true)
                        }}
                        className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
                          isActive
                            ? 'bg-amber-500/20 border-amber-500/50 text-white'
                            : 'bg-zinc-800/50 hover:bg-zinc-800 border-white/5 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{sec.title}</span>
                          <span className="font-mono text-[10px] text-amber-400">
                            M. {sec.startMeasure}–{sec.endMeasure}
                          </span>
                        </div>
                        {sec.tempoSuggestion && (
                          <div className="text-[10px] text-zinc-400 mt-0.5">{sec.tempoSuggestion}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Real-Time Performance Accuracy Badge */}
          {accuracyPercent !== undefined && (
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono font-bold text-amber-400"
              title="Real-Time Note Strike Accuracy"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>{accuracyPercent}%</span>
            </div>
          )}

          {/* 2D Overhead vs 3D Perspective Waterfall Toggle */}
          <button
            onClick={() => setViewPerspective(viewPerspective === '2d' ? '3d' : '2d')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              viewPerspective === '3d'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title="Toggle 2D Overhead vs 3D Perspective Waterfall"
          >
            <Box className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px]">{viewPerspective.toUpperCase()}</span>
          </button>

          {/* Visual Theme Selector (Your Lie in April, Concert Dark, Ivory Light) */}
          <div className="relative">
            <button
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-sky-400 hover:text-sky-300 transition-all shadow-sm active:scale-95"
              title="Visual Theme (Your Lie in April / Dark / Light)"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline font-mono text-[11px]">
                {theme === 'ylia' ? 'YLIA' : theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </button>

            {themeMenuOpen && (
              <div className="absolute top-full mt-2 right-0 w-64 bg-zinc-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1.5 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between border-b border-white/10 pb-1">
                  <span>Visual Themes</span>
                  <button onClick={() => setThemeMenuOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {[
                  { id: 'ylia' as VisualTheme, name: 'Your Lie in April (YLIA)', desc: 'Starry anime artwork, pastel pink (LH) & cyan (RH)' },
                  { id: 'dark' as VisualTheme, name: 'Concert Dark', desc: 'Midnight obsidian, pastel rose & sky blue' },
                  { id: 'light' as VisualTheme, name: 'Ivory Studio', desc: 'Frosted light studio, pastel coral & teal' },
                ].map((t) => {
                  const isSel = theme === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id)
                        localStorage.setItem('virtuoso_theme', t.id)
                        setThemeMenuOpen(false)
                      }}
                      className={`p-2 rounded-xl text-left transition-all border ${
                        isSel
                          ? 'bg-sky-500/20 border-sky-500/50 text-white'
                          : 'bg-zinc-800/40 hover:bg-zinc-800 border-transparent text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className={isSel ? 'text-sky-300' : 'text-zinc-200'}>{t.name}</span>
                        {isSel && <Sparkles className="w-3 h-3 text-sky-400" />}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">{t.desc}</div>
                    </button>
                  )
                })}

                {/* YLIA Multiple Artworks Sub-selector */}
                {theme === 'ylia' && (
                  <div className="pt-2 border-t border-white/10 flex flex-col gap-1">
                    <div className="px-2 text-[9px] font-bold text-sky-400 uppercase tracking-wider">
                      YLIA Artworks
                    </div>
                    {[
                      { url: '/images/ylia_bg.png', name: 'Starry Duet (Kaori & Kousei)' },
                      { url: '/images/598673.jpg', name: 'Mirrored Horizon (Silhouette)' },
                      { url: '/images/your-lie-in-april-3840x3070-21018.jpg', name: 'Pastel Aurora (Ocean Piano)' },
                      { url: '/images/your-lie-in-april-3840x2160-21020.jpg', name: 'Sunset Blossom (Anime Quote)' },
                    ].map((art) => {
                      const isArtSel = yliaWallpaper === art.url
                      return (
                        <button
                          key={art.url}
                          onClick={() => {
                            setYliaWallpaper(art.url)
                            localStorage.setItem('virtuoso_ylia_wallpaper', art.url)
                          }}
                          className={`px-2 py-1.5 rounded-lg text-left text-[11px] font-semibold transition-all flex items-center justify-between ${
                            isArtSel
                              ? 'bg-sky-500/25 text-sky-200 border border-sky-400/30'
                              : 'bg-zinc-800/30 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
                          }`}
                        >
                          <span className="truncate">{art.name}</span>
                          {isArtSel && <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Audio & Acoustics Settings */}
          {onOpenAudioSettings && (
            <button
              onClick={onOpenAudioSettings}
              className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              title="Acoustic Reverb & Touch Velocity"
            >
              <Sliders className="w-3.5 h-3.5 text-orange-400" />
            </button>
          )}

          {/* Masterclass Tips Toggle */}
          <button
            onClick={() => setIsMasterclassOpen(!isMasterclassOpen)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isMasterclassOpen
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-300'
            }`}
            title="Masterclass Guidance"
          >
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Tips</span>
          </button>

          {/* Wrong note toast */}
          {wrongNoteMidi !== null && (
            <div className="px-2 py-1 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 font-mono text-[11px] font-bold animate-pulse">
              Wrong Key
            </div>
          )}

          {/* Roland LX-9 Bluetooth */}
          <button
            onClick={onOpenBluetoothModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] transition-all ${
              isConnectedLX9
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bluetooth className={`w-3.5 h-3.5 ${isConnectedLX9 ? 'text-blue-400 animate-pulse' : ''}`} />
            <span className="font-mono text-[10px] hidden sm:inline">
              {isConnectedLX9 ? `LX-9` : 'Roland'}
            </span>
          </button>

          {/* Acoustic Mic */}
          <button
            onClick={onToggleMic}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
              isMicActive
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Acoustic Microphone"
          >
            {isMicActive ? <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Masterclass Guidance Drawer */}
      {isMasterclassOpen && (
        <div className="absolute top-14 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-zinc-900/95 backdrop-blur-2xl border border-amber-500/40 rounded-2xl shadow-2xl p-4 text-zinc-100 flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {language === 'de' ? 'Meisterkurs: Anleitung' : 'Masterclass Guidance'}
              </h4>
            </div>
            <button
              onClick={() => setIsMasterclassOpen(false)}
              className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white">{currentSection?.title}</h3>
            <p className="text-[11px] text-amber-200/90 font-mono mt-0.5">
              Measures {currentSection?.startMeasure}–{currentSection?.endMeasure} • {currentSection?.tempoSuggestion}
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-zinc-800/60 border border-white/5">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                {language === 'de' ? 'Klangfarbe & Ausdruck' : 'Character & Phrasing'}
              </div>
              <div className="text-zinc-200 mt-1">{currentSection?.character || 'Concert interpretation'}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-800/60 border border-white/5">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                {language === 'de' ? 'Handbewegung & Übergänge' : 'Hand Movement & Transitions'}
              </div>
              <div className="text-zinc-200 mt-1">
                {language === 'de'
                  ? 'Weiche Handgelenk-Rotation und tiefes Einsinken des Armgewichts in die Tasten.'
                  : 'Supple lateral wrist rotation. Drop relaxed arm weight into keybeds without finger tension.'}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-800/60 border border-white/5">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center justify-between">
                <span>{language === 'de' ? 'Damper Pedal (CC64)' : 'Damper Pedal Timing'}</span>
                <span className="font-mono text-amber-400">{damperPedal > 30 ? 'HOLD' : 'RELEASE'}</span>
              </div>
              <div className="text-zinc-200 mt-1">
                {language === 'de'
                  ? 'Folge der goldenen Pedal-Spur: Drücken nach dem Tastenanschlag, blitzschnell lösen bei Harmoniewechseln.'
                  : 'Follow the falling gold pedal ribbon: Catch damper right after note strike, clear completely on harmonic changes.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. UPPER: 2D OVERHEAD KEYBOARD & FALLING NOTES HIGHWAY */}
      {viewLayout !== 'sheet' && (
        <div
          className={`relative overflow-hidden transition-all duration-300 ${
            viewLayout === 'keyboard' ? 'flex-1 min-h-0' : 'flex-1 min-h-0 basis-3/5'
          } bg-[#08080c]`}
        >
          <FallingKeysCanvas
            piece={piece}
            currentTime={currentTime}
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            activeNotes={activeNotes}
            damperPedal={damperPedal}
            viewMode={viewPerspective}
            theme={theme}
            handMode={handMode}
            expectedNotes={expectedNotes}
            onScreenKeyPress={onScreenKeyPress}
            onTogglePedal={onTogglePedal}
            showFingers={showHands}
            wallpaperUrl={yliaWallpaper}
          />
        </div>
      )}

      {/* 3. CENTER REDESIGNED PRACTICE COCKPIT (CLEAN, PASTEL PALETTE, NO CLUTTER) */}
      <div className="h-14 bg-zinc-950/95 backdrop-blur-2xl border-y border-white/[0.08] px-3 sm:px-6 flex items-center justify-between z-20 flex-shrink-0 shadow-lg">
        {/* Left: Hand Practice Segmented Control (Both, RH Cyan, LH Pink) */}
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-white/10 rounded-2xl p-1 shadow-inner">
          <button
            onClick={() => onHandModeChange('both')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              handMode === 'both'
                ? 'bg-gradient-to-r from-pink-400 to-sky-400 text-zinc-950 shadow-md scale-105'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Practice Both Hands"
          >
            <Hand className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Both</span>
          </button>
          <button
            onClick={() => onHandModeChange('right')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              handMode === 'right'
                ? 'bg-sky-400 text-zinc-950 shadow-md scale-105'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Practice Right Hand (Pastel Cyan Notes)"
          >
            <span className="text-sky-400 font-mono font-bold">RH</span>
            <span className="hidden sm:inline">Right</span>
          </button>
          <button
            onClick={() => onHandModeChange('left')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              handMode === 'left'
                ? 'bg-pink-400 text-zinc-950 shadow-md scale-105'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Practice Left Hand (Pastel Pink Notes)"
          >
            <span className="text-pink-400 font-mono font-bold">LH</span>
            <span className="hidden sm:inline">Left</span>
          </button>
        </div>

        {/* Center: Main Transport (Rewind, Play, Wait Mode, Speed) */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Rewind */}
          <button
            onClick={onRewind}
            className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-95 shadow-md"
            title="Rewind to Beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Central Vibrantly Glowing Play/Pause Button */}
          <button
            onClick={onTogglePlay}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white flex items-center justify-center shadow-[0_0_24px_rgba(249,115,22,0.65)] active:scale-95 transition-all p-3.5"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          {/* Wait-for-Note Mode Segmented Button */}
          <button
            onClick={onToggleWaitMode}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 ${
              isWaitMode
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400 text-zinc-950 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse'
                : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-300'
            }`}
            title="Wait for Note: waits until you press the exact key!"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isWaitMode ? 'Waiting for Key' : 'Wait Mode'}</span>
          </button>

          {/* Speed / Tempo Popover Controller */}
          <div className="relative">
            <button
              onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 font-mono text-xs font-bold text-zinc-200 transition-all shadow-sm"
              title="Change Speed"
            >
              <Gauge className="w-3.5 h-3.5 text-orange-400" />
              <span>{Math.round(playbackRate * 100)}%</span>
            </button>

            {speedMenuOpen && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-zinc-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-3 shadow-2xl flex flex-col gap-2.5 z-50 min-w-[190px]">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase">
                  <span>Playback Speed</span>
                  <span className="font-mono text-amber-400">{Math.round(playbackRate * 100)}%</span>
                </div>

                {/* Quick preset buttons */}
                <div className="grid grid-cols-4 gap-1">
                  {[0.25, 0.5, 0.75, 1.0].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        onRateChange(rate)
                        setSpeedMenuOpen(false)
                      }}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        playbackRate === rate
                          ? 'bg-amber-500 text-zinc-950 shadow-md'
                          : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-300'
                      }`}
                    >
                      {Math.round(rate * 100)}%
                    </button>
                  ))}
                </div>

                {/* Precision Slider */}
                <input
                  type="range"
                  min="0.25"
                  max="1.25"
                  step="0.05"
                  value={playbackRate}
                  onChange={(e) => onRateChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Loop & Fingering Toggles */}
        <div className="flex items-center gap-2">
          {/* Fingering Guide Toggle */}
          <button
            onClick={onToggleHands}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition-all shadow-sm active:scale-95 ${
              showHands
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-500'
            }`}
            title="Toggle Fingering Numbers & Guides"
          >
            <Hand className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fingers {showHands ? 'ON' : 'OFF'}</span>
          </button>

          {/* Loop Mode Toggle */}
          <button
            onClick={onToggleLoop}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition-all shadow-sm active:scale-95 ${
              isLooping
                ? 'bg-blue-500/20 border-blue-500/60 text-blue-300 shadow-[0_0_14px_rgba(59,130,246,0.4)]'
                : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Loop Active Measures"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono text-[11px]">
              M.{loopRange[0]}–{loopRange[1]}
            </span>
          </button>

          {/* Speed Ramp (+5% on loop finish) */}
          {isLooping && onToggleSpeedRamp && (
            <button
              onClick={onToggleSpeedRamp}
              className={`flex items-center gap-1 px-2.5 py-2 rounded-2xl border text-xs font-bold transition-all shadow-sm active:scale-95 ${
                isSpeedRamp
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-amber-400 text-zinc-950 font-extrabold shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Auto-Speed: increases tempo by +5% after each successful loop"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+5%</span>
            </button>
          )}

          {/* Metronome Click Toggle */}
          {onToggleMetronome && (
            <button
              onClick={onToggleMetronome}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition-all shadow-sm active:scale-95 ${
                isMetronomeOn
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Metronome Click"
            >
              <Timer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Metro</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. LOWER: AUTHENTIC FLOWKEY PARCHMENT SHEET MUSIC */}
      {viewLayout !== 'keyboard' && (
        <div
          className={`relative overflow-hidden transition-all duration-300 ${
            viewLayout === 'sheet' ? 'flex-1 min-h-0' : 'flex-1 min-h-0 basis-1/2'
          } bg-[#fdfbf7]`}
        >
          <SheetMusicView
            piece={piece}
            currentTime={currentTime}
            activeNotes={activeNotes}
            onSeek={onSeek}
            isLooping={isLooping}
            loopRange={loopRange}
            onLoopRangeChange={onLoopRangeChange}
            onToggleLoop={onToggleLoop}
            language={language}
          />
        </div>
      )}

      {/* 5. BOTTOM ORANGE PROGRESS SCRUBBER LINE */}
      <div
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const clickX = e.clientX - rect.left
          const ratio = Math.max(0, Math.min(1, clickX / rect.width))
          onSeek(ratio * (piece.duration || 1))
        }}
        className="h-2 bg-stone-300 hover:h-3 cursor-pointer relative transition-all group flex-shrink-0"
      >
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-amber-500 group-hover:from-orange-400 group-hover:to-amber-400 relative"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="w-3 h-3 rounded-full bg-orange-600 absolute right-0 top-1/2 -translate-y-1/2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  )
}
