import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { Piece } from '../types/music'
import type { MasterEditionId } from '../types/edition'
import type { LanguageCode } from '../i18n/translations'
import { FallingKeysCanvas, type VisualTheme } from './FallingKeysCanvas'
import { SheetMusicView } from './SheetMusicView'
import { AcousticNoteRecognizer } from '../engine/AcousticNoteRecognizer'
import { PianoAudioEngine, type EngineTelemetry } from '../audio/PianoAudioEngine'
import type { LiveTouchFeedback } from '../engine/PianoTeacherEngine'
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  ChevronLeft,
  Bluetooth,
  Mic,
  Hand,
  Layers,
  GraduationCap,
  Sparkles,
  X,
  Gauge,
  FileText,
  Box,
  Timer,
  TrendingUp,
  Award,
  Sliders,
  ChevronDown,
  Settings,
  Trophy,
  Target,
  Flame,
  BookOpen,
} from 'lucide-react'

interface FlowkeyPlayerViewProps {
  piece: Piece
  currentTime: number
  isPlaying: boolean
  playbackRate: number
  handMode: 'both' | 'right' | 'left'
  isWaitMode: boolean
  playMode?: 'flow' | 'practice' | 'competition'
  showHands: boolean
  isLooping: boolean
  loopRange: [number, number]
  startMeasure?: number
  onStartMeasureChange?: (measure: number) => void
  activeNotes: Map<number, { velocity: number; timestamp: number }>
  damperPedal: number
  edition: MasterEditionId
  language: LanguageCode
  isConnectedLX9: boolean
  isRolandBluetooth?: boolean
  midiDeviceName?: string
  wrongNoteMidi: number | null
  expectedNotes?: number[]
  isMetronomeOn?: boolean
  isSpeedRamp?: boolean
  accuracyPercent?: number
  competitionScore?: number
  competitionCombo?: number
  competitionLastJudgment?: { text: string; color: string; offsetMs?: number } | null
  competitionExamRange?: [number, number]
  onChangeCompetitionExamRange?: (range: [number, number]) => void
  liveTouchFeedback?: LiveTouchFeedback | null
  onOpenDemoTeacherReport?: () => void
  onChangePlayMode?: (mode: 'flow' | 'practice' | 'competition') => void
  onOpenCompetitionReport?: () => void
  onTogglePlay: () => void
  onRewind: () => void
  onSeek: (time: number) => void
  onRateChange: (rate: number) => void
  onHandModeChange: (mode: 'both' | 'right' | 'left') => void
  onToggleWaitMode: () => void
  onToggleHands: () => void
  onToggleLoop: () => void
  onLoopRangeChange: (range: [number, number]) => void
  onToggleMetronome?: () => void
  onToggleSpeedRamp?: () => void
  onOpenAudioSettings?: () => void
  onEditionChange?: (edition: MasterEditionId) => void
  onOpenBluetoothModal: () => void
  onOpenTutorials?: () => void
  onOpenPracticeCoach?: () => void
  onBackToDiscovery: () => void
  onScreenKeyPress?: (midi: number) => void
  onScreenKeyRelease?: (midi: number) => void
  onTogglePedal?: () => void
  countInBeat?: number | null
  isCountInEnabled?: boolean
  onToggleCountIn?: () => void
}

const formatTimeShort = (sec: number) => {
  const safe = Math.max(0, Math.floor(sec || 0))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const FlowkeyPlayerView: React.FC<FlowkeyPlayerViewProps> = ({
  piece,
  currentTime,
  isPlaying,
  playbackRate,
  handMode,
  isWaitMode: _isWaitMode,
  playMode = 'practice',
  showHands: _showHands,
  isLooping,
  loopRange,
  startMeasure = 1,
  onStartMeasureChange,
  activeNotes,
  damperPedal,
  edition,
  language,
  isConnectedLX9,
  isRolandBluetooth = false,
  midiDeviceName,
  wrongNoteMidi,
  expectedNotes = [],
  isMetronomeOn = false,
  isSpeedRamp = false,
  accuracyPercent = 100,
  competitionScore = 0,
  competitionCombo = 0,
  competitionLastJudgment = null,
  competitionExamRange,
  onChangeCompetitionExamRange,
  liveTouchFeedback = null,
  onOpenDemoTeacherReport,
  onChangePlayMode,
  onOpenCompetitionReport,
  onTogglePlay,
  onRewind,
  onSeek,
  onRateChange,
  onHandModeChange,
  onToggleWaitMode,
  onToggleHands: _onToggleHands,
  onToggleLoop,
  onLoopRangeChange,
  onToggleMetronome,
  onToggleSpeedRamp,
  onOpenAudioSettings,
  onEditionChange,
  onOpenBluetoothModal,
  onOpenTutorials,
  onOpenPracticeCoach,
  onBackToDiscovery,
  onScreenKeyPress,
  onScreenKeyRelease,
  onTogglePedal,
  countInBeat = null,
  isCountInEnabled = true,
  onToggleCountIn,
}) => {
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false)
  const [sectionsMenuOpen, setSectionsMenuOpen] = useState(false)
  const [editionMenuOpen, setEditionMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [isMasterclassOpen, setIsMasterclassOpen] = useState(false)
  const [viewLayout, setViewLayoutState] = useState<'keyboard' | 'sheet'>(() => {
    const saved = localStorage.getItem('virtuoso_view_layout')
    if (saved === 'keyboard') return 'keyboard'
    return 'sheet'
  })
  const setViewLayout = useCallback((layout: 'keyboard' | 'sheet') => {
    setViewLayoutState(layout)
    localStorage.setItem('virtuoso_view_layout', layout)
  }, [])
  const [viewPerspective, setViewPerspective] = useState<'2d' | '3d'>('2d')
  const [theme, setTheme] = useState<VisualTheme>(() => {
    return (localStorage.getItem('virtuoso_theme') as VisualTheme) || 'ylia'
  })
  const [yliaWallpaper, setYliaWallpaper] = useState<string>(() => {
    return localStorage.getItem('virtuoso_ylia_wallpaper') || '/images/ylia_bg.png'
  })
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false)
  const [isMicActive, setIsMicActive] = useState<boolean>(() => AcousticNoteRecognizer.getInstance().isListening)
  const [micLevel, setMicLevel] = useState<number>(0)
  const isScrubbingRef = useRef(false)
  const scrubberRef = useRef<HTMLDivElement>(null)
  const speedMenuRef = useRef<HTMLDivElement>(null)
  const editionMenuRef = useRef<HTMLDivElement>(null)
  const themeMenuRef = useRef<HTMLDivElement>(null)
  const masterclassRef = useRef<HTMLDivElement>(null)

  // Close player popovers & drawers on Escape or clicking outside (immune to backdrop-filter containing blocks)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setSpeedMenuOpen(false)
      setSectionsMenuOpen(false)
      setEditionMenuOpen(false)
      setThemeMenuOpen(false)
      setIsMasterclassOpen(false)
      setMobileSettingsOpen(false)
    }
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (speedMenuRef.current && !speedMenuRef.current.contains(target)) {
        setSpeedMenuOpen(false)
      }
      if (editionMenuRef.current && !editionMenuRef.current.contains(target)) {
        setEditionMenuOpen(false)
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(target)) {
        setThemeMenuOpen(false)
      }
      if (masterclassRef.current && !masterclassRef.current.contains(target)) {
        setIsMasterclassOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [])

  // Real-Time Steinway Model B Audio Engine Telemetry
  const [engineTelemetry, setEngineTelemetry] = useState<EngineTelemetry>(() =>
    PianoAudioEngine.getInstance().getTelemetry()
  )

  useEffect(() => {
    return PianoAudioEngine.getInstance().subscribeTelemetry((t) => setEngineTelemetry(t))
  }, [])

  // Custom Measure Range Practice State
  const maxMeasure = useMemo(() => {
    if (!piece || !piece.notes || piece.notes.length === 0) return 1
    return Math.max(1, ...piece.notes.map((n) => n.measure))
  }, [piece])

  // Current active measure based on currentTime
  const currentMeasure = useMemo(() => {
    if (!piece || !piece.notes || piece.notes.length === 0) return 1
    for (let i = piece.notes.length - 1; i >= 0; i--) {
      if (currentTime >= piece.notes[i].startTime) {
        return Math.max(1, piece.notes[i].measure)
      }
    }
    return 1
  }, [piece, currentTime])

  const [customStartMeasure, setCustomStartMeasure] = useState<number>(loopRange[0] || 1)
  const [customEndMeasure, setCustomEndMeasure] = useState<number>(loopRange[1] || 4)

  useEffect(() => {
    setCustomStartMeasure(Math.min(loopRange[0], maxMeasure))
    setCustomEndMeasure(Math.min(Math.max(loopRange[0], loopRange[1]), maxMeasure))
  }, [loopRange, maxMeasure])

  const clampMeasure = useCallback((m: number) => Math.max(1, Math.min(maxMeasure, Math.round(m) || 1)), [maxMeasure])

  const handleListenInLoop = useCallback(
    (start: number, end: number) => {
      const clampedStart = Math.max(1, Math.min(start, maxMeasure))
      const clampedEnd = Math.max(clampedStart, Math.min(end, maxMeasure))
      onLoopRangeChange([clampedStart, clampedEnd])
      if (!isLooping) onToggleLoop()
      if (onChangePlayMode) {
        onChangePlayMode('flow')
      }

      const startNote = piece.notes.find((n) => n.measure >= clampedStart)
      const startTime = startNote ? startNote.startTime : 0
      onSeek(startTime)
      if (!isPlaying) onTogglePlay()
      setSectionsMenuOpen(false)
    },
    [maxMeasure, onLoopRangeChange, isLooping, onToggleLoop, onChangePlayMode, piece.notes, onSeek, isPlaying, onTogglePlay]
  )

  const handlePracticePart = useCallback(
    (start: number, end: number) => {
      const clampedStart = Math.max(1, Math.min(start, maxMeasure))
      const clampedEnd = Math.max(clampedStart, Math.min(end, maxMeasure))
      onLoopRangeChange([clampedStart, clampedEnd])
      if (!isLooping) onToggleLoop()
      if (onChangePlayMode) {
        onChangePlayMode('practice')
      } else if (!_isWaitMode) {
        onToggleWaitMode()
      }

      const startNote = piece.notes.find((n) => n.measure >= clampedStart)
      const startTime = startNote ? startNote.startTime : 0
      onSeek(startTime)
      setSectionsMenuOpen(false)
    },
    [maxMeasure, onLoopRangeChange, isLooping, onToggleLoop, onChangePlayMode, _isWaitMode, onToggleWaitMode, piece.notes, onSeek]
  )

  const handleDisplaySheet = useCallback(
    (start: number, end: number) => {
      const clampedStart = Math.max(1, Math.min(start, maxMeasure))
      const clampedEnd = Math.max(clampedStart, Math.min(end, maxMeasure))
      onLoopRangeChange([clampedStart, clampedEnd])
      if (!isLooping) onToggleLoop()
      setViewLayout('sheet')

      const startNote = piece.notes.find((n) => n.measure >= clampedStart)
      const startTime = startNote ? startNote.startTime : 0
      onSeek(startTime)
      setSectionsMenuOpen(false)
    },
    [maxMeasure, onLoopRangeChange, isLooping, onToggleLoop, setViewLayout, piece.notes, onSeek]
  )

  const handlePracticeFromStartMeasure = useCallback(
    (meas: number) => {
      const clamped = clampMeasure(meas)
      if (onStartMeasureChange) onStartMeasureChange(clamped)
      if (isLooping) onToggleLoop()
      if (onChangePlayMode) {
        onChangePlayMode('practice')
      }
      setSectionsMenuOpen(false)
    },
    [clampMeasure, onStartMeasureChange, isLooping, onToggleLoop, onChangePlayMode]
  )

  useEffect(() => {
    let animId: number
    const pollLevel = () => {
      const listening = AcousticNoteRecognizer.getInstance().isListening
      setIsMicActive((prev) => (prev !== listening ? listening : prev))
      if (listening) {
        setMicLevel(AcousticNoteRecognizer.getInstance().inputLevel)
      } else {
        setMicLevel(0)
      }
      animId = requestAnimationFrame(pollLevel)
    }
    animId = requestAnimationFrame(pollLevel)
    return () => cancelAnimationFrame(animId)
  }, [])

  const handleToggleMic = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const recognizer = AcousticNoteRecognizer.getInstance()
    if (recognizer.isListening) {
      recognizer.stopListening()
      setIsMicActive(false)
    } else {
      const ok = await recognizer.startListening()
      setIsMicActive(ok)
    }
  }

  // Interactive scrub handler (supports both tap and finger drag)
  const seekAtClientX = useCallback(
    (clientX: number) => {
      if (!scrubberRef.current) return
      const rect = scrubberRef.current.getBoundingClientRect()
      if (!rect.width) return
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      onSeek(ratio * (piece.duration || 1))
    },
    [onSeek, piece.duration]
  )

  // Active section based on currentTime
  const currentSection =
    piece.sections.find((s) => currentTime >= s.startTime && currentTime <= s.endTime) ||
    piece.sections[0]

  const progressPercent = Math.min(100, Math.max(0, (currentTime / (piece.duration || 1)) * 100))

  const editionOptions = [
    { id: 'urtext' as MasterEditionId, name: 'Henle Urtext', subtitle: 'Canonical Notation (Pure)', year: 'Urtext' },
    { id: 'zimerman' as MasterEditionId, name: 'Krystian Zimerman', subtitle: 'Aristocratic Cantabile & Half-Pedal', year: '1987' },
    { id: 'horowitz' as MasterEditionId, name: 'Vladimir Horowitz', subtitle: 'Fiery Bravura & Electric Coda (+10%)', year: '1968' },
    { id: 'lang-lang' as MasterEditionId, name: 'Lang Lang', subtitle: 'Passionate Rubato & Bold Contrasts', year: '2001' },
  ]

  return (
    <div className="w-full h-full flex flex-col bg-[#07070b] text-zinc-100 select-none overflow-hidden relative font-sans">
      {/* IMMERSIVE COUNT-IN / PRE-ROLL OVERLAY */}
      {countInBeat !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] pointer-events-none select-none animate-in fade-in duration-100">
          <div className="flex flex-col items-center justify-center">
            <div className="text-8xl sm:text-9xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-200 drop-shadow-[0_0_40px_rgba(245,158,11,0.9)] animate-pulse">
              {countInBeat}
            </div>
            <div className="text-xs sm:text-sm uppercase font-black tracking-widest text-amber-200 mt-2 bg-amber-950/80 px-4 py-1.5 rounded-full border border-amber-500/50 shadow-lg">
              {language === 'de' ? 'Bereit machen...' : 'Get Ready...'}
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP PREMIUM PLAYER HEADER BAR (Zero-overflow on iPhone 375px+ & Desktop) */}
      <header className="min-h-[calc(3.15rem+var(--sat))] landscape:min-h-[2.75rem] pt-[var(--sat)] landscape:pt-0 bg-zinc-950/95 backdrop-blur-xl border-b border-white/[0.08] px-2.5 sm:px-5 pl-[max(0.65rem,env(safe-area-inset-left))] pr-[max(0.65rem,env(safe-area-inset-right))] flex items-center justify-between gap-2 z-30 flex-shrink-0 shadow-md">
        {/* Left: Back Button & Readable Piece Info */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={onBackToDiscovery}
            className="flex items-center justify-center gap-1 h-9 px-2 sm:px-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all shadow-sm active:scale-95 flex-shrink-0"
            aria-label="Back to songs"
          >
            <ChevronLeft className="w-4 h-4 text-orange-500" />
            <span className="hidden sm:inline">
              {language === 'de' ? 'Zurück' : language === 'fr' ? 'Retour' : language === 'ja' ? '戻る' : language === 'zh' ? '返回' : 'Back'}
            </span>
          </button>

          <div className="min-w-0 flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={() => setSectionsMenuOpen(true)}
              className="text-left min-w-0 truncate group"
              title={piece.title}
            >
              <div className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-amber-300 truncate transition-colors">
                {piece.title}
              </div>
              <div className="text-[10px] text-zinc-400 truncate hidden md:block">
                {piece.composer}
              </div>
            </button>

            {/* Interactive Master Edition Selector (Desktop / Tablet) */}
            <div ref={editionMenuRef} className="relative hidden md:block flex-shrink-0">
              <button
                type="button"
                onClick={() => setEditionMenuOpen(!editionMenuOpen)}
                className="flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/40 transition-all cursor-pointer shadow-sm active:scale-95"
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
                    <button type="button" onClick={() => setEditionMenuOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {editionOptions.map((ed) => {
                    const isSelected = edition === ed.id
                    return (
                      <button
                        key={ed.id}
                        type="button"
                        onClick={() => {
                          if (onEditionChange) onEditionChange(ed.id)
                          setEditionMenuOpen(false)
                        }}
                        className={`p-2 rounded-xl text-left cursor-pointer transition-all border ${
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
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: View Layout Switcher (Keys vs Sheet) */}
        <div className="flex items-center bg-zinc-900/90 border border-white/10 rounded-xl p-0.5 shadow-inner flex-shrink-0">
          <button
            type="button"
            onClick={() => setViewLayout('keyboard')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
              viewLayout === 'keyboard'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Falling Keys Highway"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Keys</span>
          </button>
          <button
            type="button"
            onClick={() => setViewLayout('sheet')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
              viewLayout === 'sheet'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Full Sheet Music Notation"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Sheet</span>
          </button>
        </div>

        {/* Right: Clean Responsive Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Section & Part Selector (Desktop) */}
          <button
            type="button"
            onClick={() => setSectionsMenuOpen(true)}
            className="hidden lg:flex items-center gap-1.5 h-9 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-zinc-200 transition-colors shadow-sm active:scale-95"
            title="Choose Part to Practice, Loop or View on Sheet"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate max-w-[140px]">
              {currentSection?.title ? currentSection.title.split('–')[0].trim() : 'Part Practice'}
            </span>
          </button>

          {/* Real-Time Performance Accuracy Badge (Desktop) */}
          {accuracyPercent !== undefined && (
            <div
              className="hidden xl:flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono font-bold text-amber-400"
              title="Real-Time Note Strike Accuracy"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>{accuracyPercent}%</span>
            </div>
          )}

          {/* 2D Overhead vs 3D Perspective Waterfall Toggle (Only shown in Keys view on md+) */}
          {viewLayout === 'keyboard' && (
            <button
              type="button"
              onClick={() => setViewPerspective(viewPerspective === '2d' ? '3d' : '2d')}
              className={`hidden md:flex items-center gap-1 h-9 px-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-sm ${
                viewPerspective === '3d'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-300'
              }`}
              title="Toggle 2D Overhead vs 3D Synthesia Perspective"
            >
              <Box className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] font-black">{viewPerspective.toUpperCase()}</span>
            </button>
          )}

          {/* Visual Theme Selector (Desktop) */}
          <div ref={themeMenuRef} className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-sky-400 hover:text-sky-300 transition-all shadow-sm active:scale-95"
              title="Visual Theme (Your Lie in April / Dark / Light)"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-mono text-[11px]">
                {theme === 'ylia' ? 'YLIA' : theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </button>

            {themeMenuOpen && (
              <div className="absolute top-full mt-2 right-0 w-64 bg-zinc-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1.5 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between border-b border-white/10 pb-1">
                    <span>Visual Themes</span>
                    <button type="button" onClick={() => setThemeMenuOpen(false)} className="text-zinc-500 hover:text-zinc-300">
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
                        type="button"
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
                            type="button"
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

          {/* Steinway Model B Audio Engine Live Telemetry Badge (Compact dot on mobile, full on sm+) */}
          {onOpenAudioSettings && (
            <button
              type="button"
              onClick={onOpenAudioSettings}
              className={`hidden sm:flex items-center gap-1.5 h-9 px-2.5 rounded-xl border text-[11px] font-mono transition-all active:scale-95 shadow-sm ${
                engineTelemetry.isMainEngineActive
                  ? 'bg-zinc-900/90 border-emerald-500/40 text-emerald-300 hover:border-emerald-500/70'
                  : 'bg-zinc-900/90 border-amber-500/40 text-amber-300 animate-pulse hover:border-amber-500/70'
              }`}
              title="Steinway Model B Engine Telemetry (Tap for Acoustics & Soundboard Settings)"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  engineTelemetry.isMainEngineActive
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                    : 'bg-amber-400'
                }`}
              />
              <span className="font-semibold hidden md:inline">
                {engineTelemetry.isMainEngineActive ? 'Steinway' : 'Loading'}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {engineTelemetry.isMainEngineActive
                  ? `${engineTelemetry.loadedSamples}L`
                  : `${engineTelemetry.loadedSamples}/${engineTelemetry.totalSamples}`}
              </span>
            </button>
          )}

          {/* Passive Practice Coach Button (Wait & Flow Analytics — works without Comp mode!) */}
          {onOpenPracticeCoach && (
            <button
              type="button"
              onClick={onOpenPracticeCoach}
              className="flex items-center gap-1 h-9 px-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold transition-all active:scale-95 flex-shrink-0"
              title={language === 'de' ? 'Passiver Übe-Coach (Fehler, Stocken & Stärken)' : 'Passive Practice Coach (Mistakes & Strengths)'}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Coach</span>
            </button>
          )}

          {/* Masterclass Tips Toggle (Desktop) */}
          <button
            type="button"
            onClick={() => setIsMasterclassOpen(!isMasterclassOpen)}
            className={`hidden lg:flex items-center gap-1 h-9 px-2.5 rounded-xl border text-xs font-semibold transition-all ${
              isMasterclassOpen
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-300'
            }`}
            title="Masterclass Guidance"
          >
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span>Tips</span>
          </button>

          {/* Roland LX-9 Bluetooth (md+ in header, mobile in Settings Drawer) */}
          <button
            type="button"
            onClick={onOpenBluetoothModal}
            className={`hidden md:flex items-center gap-1.5 h-9 px-2.5 rounded-xl border text-[11px] transition-all active:scale-95 ${
              isConnectedLX9
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Bluetooth & USB MIDI"
          >
            <Bluetooth className={`w-3.5 h-3.5 ${isConnectedLX9 ? 'text-blue-400 animate-pulse' : ''}`} />
            <span className="font-mono text-[10px] hidden lg:inline">
              {isConnectedLX9 ? 'LX-9' : 'MIDI'}
            </span>
          </button>

          {/* Acoustic Microphone Piano Recognition */}
          <button
            type="button"
            onClick={(e) => handleToggleMic(e)}
            className={`flex items-center justify-center gap-1 h-9 px-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 touch-manipulation cursor-pointer shadow-md flex-shrink-0 ${
              isMicActive
                ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.6)] font-extrabold'
                : 'bg-zinc-900 hover:bg-zinc-800 border-emerald-500/40 text-emerald-400 hover:text-emerald-300'
            }`}
            title="Acoustic Piano Microphone Recognition"
            aria-label="Toggle Microphone Note Recognition"
          >
            <Mic className={`w-4 h-4 ${isMicActive ? 'text-zinc-950 animate-pulse' : 'text-emerald-400'}`} />
            <span className="font-mono text-[11px] font-black hidden xs:inline sm:inline">
              {isMicActive ? 'ON' : 'MIC'}
            </span>
            {isMicActive && micLevel > 0.05 && (
              <div className="w-1.5 h-2 bg-zinc-950 rounded-full animate-bounce" />
            )}
          </button>

          {/* Mobile / Tablet Quick Settings Trigger */}
          <button
            type="button"
            onClick={() => setMobileSettingsOpen(true)}
            className="relative flex lg:hidden items-center justify-center w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-amber-400 hover:text-amber-300 active:scale-95 transition-all shadow-sm flex-shrink-0"
            title="Settings & Controls"
            aria-label="Player Settings"
          >
            <Settings className="w-4 h-4" />
            {isConnectedLX9 && (
              <span className="w-2 h-2 rounded-full bg-blue-400 absolute top-1.5 right-1.5 shadow-[0_0_6px_#60a5fa]" />
            )}
          </button>
        </div>
      </header>

      {/* Wrong Note Floating Toast (Non-disruptive, never pushes header buttons off-screen) */}
      {wrongNoteMidi !== null && (
        <div className="absolute top-[calc(3.6rem+var(--sat))] right-3 z-40 px-3 py-1.5 rounded-xl bg-red-950/90 backdrop-blur-md border border-red-500/60 text-red-200 font-mono text-xs font-bold shadow-lg pointer-events-none animate-pulse">
          {language === 'de' ? 'Falsche Taste' : 'Wrong Key'}
        </div>
      )}

      {/* Mobile Controls & Settings Modal Drawer */}
      {mobileSettingsOpen && (
        <div
          onClick={() => setMobileSettingsOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-zinc-900 border border-white/15 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[86dvh] animate-in slide-in-from-bottom-6 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-zinc-950 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm tracking-wide">
                  {language === 'de' ? 'Player-Einstellungen & Steuerung' : 'Player Controls & Settings'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileSettingsOpen(false)}
                className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white active:scale-95"
                aria-label="Close settings"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-5 overflow-y-auto flex-1 min-h-0">
              {/* 1. Quick Part & Start Measure Practice Launch */}
              <button
                type="button"
                onClick={() => {
                  setMobileSettingsOpen(false)
                  setSectionsMenuOpen(true)
                }}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/15 border border-amber-500/40 flex items-center justify-between text-left active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-amber-200">
                      {language === 'de' ? 'Abschnitt & Start-Takt wählen' : 'Part Practice & Start Measure'}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      Start: M.{startMeasure} • {isLooping ? `Loop M.${loopRange[0]}–${loopRange[1]}` : (language === 'de' ? 'Loop aus' : 'Loop off')}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/15">
                  {language === 'de' ? 'Öffnen' : 'Open'}
                </span>
              </button>

              {/* 2. Practice & Tempo Tools */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  {language === 'de' ? 'Übungs- & Tempo-Werkzeuge' : 'Practice & Tempo Tools'}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {onToggleMetronome && (
                    <button
                      type="button"
                      onClick={onToggleMetronome}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                        isMetronomeOn
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                          : 'bg-zinc-800/60 border-white/10 text-zinc-300'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5" />
                        <span>{language === 'de' ? 'Metronom' : 'Metronome'}</span>
                      </span>
                      <span className="font-mono text-[10px]">{isMetronomeOn ? 'ON' : 'OFF'}</span>
                    </button>
                  )}

                  {onToggleCountIn && (
                    <button
                      type="button"
                      onClick={onToggleCountIn}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                        isCountInEnabled
                          ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                          : 'bg-zinc-800/60 border-white/10 text-zinc-300'
                      }`}
                    >
                      <span>{language === 'de' ? 'Vorzähler (1-4)' : 'Count-In (1-4)'}</span>
                      <span className="font-mono text-[10px]">{isCountInEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                  )}

                  {onToggleSpeedRamp && (
                    <button
                      type="button"
                      onClick={onToggleSpeedRamp}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                        isSpeedRamp
                          ? 'bg-gradient-to-r from-orange-500/30 to-amber-500/30 border-amber-400 text-amber-200'
                          : 'bg-zinc-800/60 border-white/10 text-zinc-300'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Speed Ramp</span>
                      </span>
                      <span className="font-mono text-[10px]">{isSpeedRamp ? '+5%' : 'OFF'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onToggleLoop}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                      isLooping
                        ? 'bg-blue-500/25 border-blue-400 text-blue-200'
                        : 'bg-zinc-800/60 border-white/10 text-zinc-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5" />
                      <span>Loop</span>
                    </span>
                    <span className="font-mono text-[10px]">M.{loopRange[0]}–{loopRange[1]}</span>
                  </button>
                </div>
              </div>

              {/* 3. Perspective & Visual Theme */}
              <div className="space-y-2.5 pt-2 border-t border-white/10">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  {language === 'de' ? 'Ansicht & Perspektive' : 'View & Perspective'}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setViewPerspective('2d')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                      viewPerspective === '2d'
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black'
                        : 'bg-zinc-800/60 border-white/10 text-zinc-300'
                    }`}
                  >
                    {language === 'de' ? '2D Draufsicht' : '2D Overhead'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewPerspective('3d')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                      viewPerspective === '3d'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 border-amber-400 font-black'
                        : 'bg-zinc-800/60 border-white/10 text-zinc-300'
                    }`}
                  >
                    {language === 'de' ? '3D Synthesia' : '3D Perspective'}
                  </button>
                </div>

                <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider pt-1">
                  {language === 'de' ? 'Farbschema (Theme)' : 'Visual Theme'}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ylia' as VisualTheme, label: 'YLIA Anime' },
                    { id: 'dark' as VisualTheme, label: 'Concert Dark' },
                    { id: 'light' as VisualTheme, label: 'Ivory Light' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTheme(t.id)
                        localStorage.setItem('virtuoso_theme', t.id)
                      }}
                      className={`py-2.5 px-1 rounded-xl text-xs font-bold transition-all border ${
                        theme === t.id
                          ? 'bg-sky-500/25 border-sky-400 text-sky-200'
                          : 'bg-zinc-800/60 border-white/5 text-zinc-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {theme === 'ylia' && (
                  <div className="pt-1 space-y-1.5">
                    <div className="text-[10px] text-zinc-400 uppercase font-semibold">YLIA Artwork</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { url: '/images/ylia_bg.png', label: 'Starry Duet' },
                        { url: '/images/598673.jpg', label: 'Mirrored Horizon' },
                        { url: '/images/your-lie-in-april-3840x3070-21018.jpg', label: 'Pastel Aurora' },
                        { url: '/images/your-lie-in-april-3840x2160-21020.jpg', label: 'Sunset Blossom' },
                      ].map((art) => (
                        <button
                          key={art.url}
                          type="button"
                          onClick={() => {
                            setYliaWallpaper(art.url)
                            localStorage.setItem('virtuoso_ylia_wallpaper', art.url)
                          }}
                          className={`p-2 rounded-xl text-left text-xs font-semibold border transition-all ${
                            yliaWallpaper === art.url
                              ? 'bg-sky-500/25 border-sky-400 text-white'
                              : 'bg-zinc-800/40 border-white/5 text-zinc-400'
                          }`}
                        >
                          {art.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Master Edition Selector (Now accessible on iPhone!) */}
              {onEditionChange && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    {language === 'de' ? 'Meister-Edition / Interpretation' : 'Master Edition / Interpretation'}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {editionOptions.map((ed) => (
                      <button
                        key={ed.id}
                        type="button"
                        onClick={() => {
                          onEditionChange(ed.id)
                          setMobileSettingsOpen(false)
                        }}
                        className={`p-2.5 rounded-xl text-left border transition-all ${
                          edition === ed.id
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                            : 'bg-zinc-800/50 border-white/5 text-zinc-300'
                        }`}
                      >
                        <div className="text-xs font-bold truncate">{ed.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{ed.year}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Practice Coach, Masterclass Guidance & Pedagogy */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                {onOpenPracticeCoach && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSettingsOpen(false)
                      onOpenPracticeCoach()
                    }}
                    className="w-full p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/45 text-emerald-300 font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95"
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'de' ? 'Passiver Übe-Coach (Wait-Analyse)' : 'Passive Practice Coach'}</span>
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSettingsOpen(false)
                      setIsMasterclassOpen(true)
                    }}
                    className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-95"
                  >
                    <GraduationCap className="w-4 h-4 text-amber-400" />
                    <span>{language === 'de' ? 'Spiel-Tipps' : 'Masterclass Tips'}</span>
                  </button>
                  {onOpenTutorials && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileSettingsOpen(false)
                        onOpenTutorials()
                      }}
                      className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-95"
                    >
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      <span>{language === 'de' ? 'Tutorials' : 'Tutorials'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 6. Connectivity & Audio Engine */}
              <div className="pt-2 border-t border-white/10 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileSettingsOpen(false)
                    onOpenBluetoothModal()
                  }}
                  className="flex-1 p-3 rounded-xl bg-blue-950/40 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-95"
                >
                  <Bluetooth className="w-4 h-4 text-blue-400" />
                  <span>{isConnectedLX9 ? 'MIDI Active' : 'Bluetooth / MIDI'}</span>
                </button>
                {onOpenAudioSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSettingsOpen(false)
                      onOpenAudioSettings()
                    }}
                    className="flex-1 p-3 rounded-xl bg-orange-950/40 border border-orange-500/40 text-orange-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Sliders className="w-4 h-4 text-orange-400" />
                    <span>
                      {engineTelemetry.isMainEngineActive
                        ? `Steinway (${engineTelemetry.loadedSamples}L)`
                        : 'Acoustics'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Masterclass Guidance Drawer */}
      {isMasterclassOpen && (
        <div
          ref={masterclassRef}
          className="absolute top-[calc(3.6rem+var(--sat))] left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-40 bg-zinc-900/95 backdrop-blur-2xl border border-amber-500/40 rounded-2xl shadow-2xl p-4 text-zinc-100 flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-200 max-h-[70dvh] overflow-y-auto"
        >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {language === 'de' ? 'Meisterkurs: Anleitung' : 'Masterclass Guidance'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsMasterclassOpen(false)}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-100"
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

      {/* 2. MAIN PERFORMANCE STAGE (Keys Highway OR Full Sheet Music — consistent position!) */}
      <div className="relative overflow-hidden w-full flex-1 min-h-0">
        {/* Live Competition & Roland LX-9 Bluetooth Piano Teacher HUD */}
        {playMode === 'competition' && !isRolandBluetooth && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[94vw] max-w-xl p-3.5 sm:p-4 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-blue-500/45 shadow-[0_8px_32px_rgba(0,0,0,0.75)] animate-in fade-in select-none space-y-2.5">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <Bluetooth className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5 flex-wrap">
                    <span>
                      {language === 'de'
                        ? 'Klavierlehrer-Modus — Exklusiv für Roland LX-9 Bluetooth'
                        : 'Piano Teacher Mode — Exclusive to Roland LX-9 Bluetooth'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-snug mt-0.5">
                    {language === 'de'
                      ? 'Exakte Messung von Anschlagsgeschwindigkeit (schnell vs. langsam), Lautstärke-Voicing (RH vs. LH), Tastentiefe, Loslass-Dynamik & 128-stufigem Halbpedal (CC64) ist nur über die Roland LX-9 Bluetooth-MIDI-Verbindung präzise möglich — nicht über Mikrofon oder Touch-Tasten.'
                      : 'Accurate measurement of key press speed (fast vs. slow), melody voicing, key hold depth, release velocity & 128-step half-pedaling (CC64) is exclusively available via Roland LX-9 Bluetooth MIDI — not microphone or touch screen.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={onOpenBluetoothModal}
                className="flex-1 min-w-[175px] px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(59,130,246,0.4)] active:scale-95 transition-all"
              >
                <Bluetooth className="w-4 h-4" />
                <span>
                  {language === 'de' ? 'Roland LX-9 per Bluetooth verbinden' : 'Connect Roland LX-9 Bluetooth'}
                </span>
              </button>
              {onOpenDemoTeacherReport && (
                <button
                  type="button"
                  onClick={onOpenDemoTeacherReport}
                  className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 text-amber-300 font-bold text-[11px] flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>
                    {language === 'de' ? 'Beispiel-Gutachten (M. 1–26)' : 'Preview Report (M. 1–26)'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {playMode === 'competition' && isRolandBluetooth && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 max-w-[96vw] select-none animate-in fade-in">
            <div className="flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-2xl bg-zinc-950/92 backdrop-blur-xl border border-amber-500/45 shadow-[0_4px_24px_rgba(0,0,0,0.65)] flex-wrap justify-center">
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded-lg border border-blue-500/30">
                <Bluetooth className="w-3 h-3 text-blue-400" />
                <span>{midiDeviceName?.includes('LX-9') ? 'LX-9 BLE' : 'BLE MIDI'}</span>
              </span>

              <div className="flex items-center gap-1 text-amber-400 font-black text-xs">
                <Trophy className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                <span className="font-mono text-white text-xs sm:text-sm font-extrabold">
                  {(competitionScore || 0).toLocaleString()}
                </span>
              </div>
              <div className="h-3.5 w-px bg-white/10" />
              <div className="flex items-center gap-1 text-xs font-bold text-orange-400">
                <Flame className="w-3 h-3 flex-shrink-0" />
                <span className="font-mono text-white font-extrabold">{competitionCombo || 0}x</span>
              </div>

              {/* Exam Scope Quick Toggle (e.g. Ballade M. 1–26!) */}
              {competitionExamRange && onChangeCompetitionExamRange && (
                <>
                  <div className="h-3.5 w-px bg-white/10" />
                  <button
                    type="button"
                    onClick={() => {
                      if (piece.id === 'chopin-ballade-1') {
                        const isM26 = competitionExamRange[0] === 1 && competitionExamRange[1] === 26
                        onChangeCompetitionExamRange(isM26 ? [1, maxMeasure] : [1, 26])
                      } else {
                        setSectionsMenuOpen(true)
                      }
                    }}
                    className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-amber-500/35 font-mono text-[10px] font-bold text-amber-300 transition-colors"
                    title={language === 'de' ? 'Prüfungsbereich wechseln' : 'Switch exam measure scope'}
                  >
                    {language === 'de' ? 'Prüfung' : 'Exam'} M.{competitionExamRange[0]}–{competitionExamRange[1]}
                  </button>
                </>
              )}

              {/* Live Touch Physics Micro-Meters */}
              {liveTouchFeedback && (
                <>
                  <div className="h-3.5 w-px bg-white/10 hidden sm:block" />
                  <span
                    className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      liveTouchFeedback.attackFeel === 'fast-percussive'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    <span className="italic font-serif">{liveTouchFeedback.dynamicLabel}</span>
                    <span>v{liveTouchFeedback.velocity}</span>
                  </span>
                  {liveTouchFeedback.voicingLead !== null && (
                    <span
                      className={`hidden md:inline-flex text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        liveTouchFeedback.voicingLead >= 12
                          ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      Voicing {liveTouchFeedback.voicingLead >= 0 ? `+${liveTouchFeedback.voicingLead}` : liveTouchFeedback.voicingLead}
                    </span>
                  )}
                  <span className="hidden md:inline-flex text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/15 px-1.5 py-0.5 rounded border border-cyan-500/30">
                    CC64 {liveTouchFeedback.damperDepth}
                  </span>
                </>
              )}

              {competitionLastJudgment && (
                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider truncate ${competitionLastJudgment.color}`}>
                  {competitionLastJudgment.text}
                </span>
              )}

              {onOpenCompetitionReport && (
                <button
                  type="button"
                  onClick={onOpenCompetitionReport}
                  className="ml-0.5 px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[10px] font-black transition-colors flex-shrink-0"
                >
                  {language === 'de' ? 'Gutachten' : 'Report'}
                </button>
              )}
            </div>

            {liveTouchFeedback?.coachHint && (
              <div className="px-3 py-1 rounded-full bg-amber-950/90 border border-amber-500/50 text-amber-200 text-[10.5px] font-bold shadow-lg">
                {liveTouchFeedback.coachHint}
              </div>
            )}
          </div>
        )}

        {viewLayout === 'keyboard' ? (
          <div className={`w-full h-full ${theme === 'light' ? 'bg-[#f8fafc]' : 'bg-[#080c1e]'}`}>
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
              onScreenKeyRelease={onScreenKeyRelease}
              onTogglePedal={onTogglePedal}
              showFingers={false}
              wallpaperUrl={yliaWallpaper}
            />
          </div>
        ) : (
          <div className="w-full h-full">
            <SheetMusicView
              piece={piece}
              currentTime={currentTime}
              activeNotes={activeNotes}
              expectedNotes={expectedNotes}
              isWaitMode={playMode === 'practice'}
              playMode={playMode}
              handMode={handMode}
              isPlaying={isPlaying}
              onSeek={onSeek}
              isLooping={isLooping}
              loopRange={loopRange}
              startMeasure={startMeasure}
              onStartMeasureChange={onStartMeasureChange}
              onLoopRangeChange={onLoopRangeChange}
              onToggleLoop={onToggleLoop}
              onOpenSections={() => setSectionsMenuOpen(true)}
              language={language}
            />
          </div>
        )}
      </div>

      {/* 3. BOTTOM PRACTICE COCKPIT (Consistent Thumb-Friendly Position in Both Keys & Sheet Mode!) */}
      <div className="bg-zinc-950/95 backdrop-blur-2xl border-t border-white/[0.08] px-2.5 sm:px-5 py-1.5 sm:py-0 sm:min-h-[3.5rem] landscape:min-h-[2.75rem] landscape:py-0.5 flex flex-col sm:flex-row landscape:flex-row items-center justify-between gap-1.5 sm:gap-2 z-20 flex-shrink-0 shadow-[0_-6px_25px_rgba(0,0,0,0.45)] pl-[max(0.65rem,env(safe-area-inset-left))] pr-[max(0.65rem,env(safe-area-inset-right))]">
        {/* Tier 1 on Mobile Portrait: Hand Selector + Start Measure Pill + Loop */}
        <div className="flex items-center justify-between w-full sm:w-auto landscape:w-auto gap-1.5">
          {/* Hand Practice Segmented Control */}
          <div className="flex items-center gap-0.5 bg-zinc-900 border border-white/10 rounded-xl p-0.5 shadow-inner flex-shrink-0">
            <button
              type="button"
              onClick={() => onHandModeChange('both')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                handMode === 'both'
                  ? 'bg-gradient-to-r from-pink-400 to-sky-400 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Practice Both Hands"
            >
              <Hand className="w-3 h-3" />
              <span>Both</span>
            </button>
            <button
              type="button"
              onClick={() => onHandModeChange('right')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                handMode === 'right'
                  ? 'bg-sky-400 text-zinc-950 shadow-sm'
                  : 'text-sky-400 hover:text-sky-300'
              }`}
              title="Practice Right Hand"
            >
              <span className="font-mono font-bold">RH</span>
            </button>
            <button
              type="button"
              onClick={() => onHandModeChange('left')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                handMode === 'left'
                  ? 'bg-pink-400 text-zinc-950 shadow-sm'
                  : 'text-pink-400 hover:text-pink-300'
              }`}
              title="Practice Left Hand"
            >
              <span className="font-mono font-bold">LH</span>
            </button>
          </div>

          {/* Mobile Portrait Quick Controls: Compact Start Takt Stepper + Loop Toggle */}
          <div className="flex sm:hidden landscape:hidden items-center gap-1.5">
            {onStartMeasureChange && (
              <div className="flex items-center rounded-xl bg-zinc-900 border border-amber-500/35 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => onStartMeasureChange(Math.max(1, startMeasure - 1))}
                  className="px-2 py-1 text-zinc-300 hover:text-white text-xs font-bold active:bg-zinc-800"
                  aria-label="Previous Start Measure"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setSectionsMenuOpen(true)}
                  className="px-2 py-1 font-mono text-[11px] font-bold text-amber-400 border-x border-white/10 active:bg-zinc-800"
                  title="Configure Start Measure & Section Practice"
                >
                  M.{startMeasure}
                </button>
                <button
                  type="button"
                  onClick={() => onStartMeasureChange(Math.min(maxMeasure, startMeasure + 1))}
                  className="px-2 py-1 text-zinc-300 hover:text-white text-xs font-bold active:bg-zinc-800"
                  aria-label="Next Start Measure"
                >
                  +
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onToggleLoop}
              className={`px-2 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 ${
                isLooping
                  ? 'bg-blue-500/25 border-blue-500/60 text-blue-300'
                  : 'bg-zinc-900 border-white/10 text-zinc-400'
              }`}
              title="Toggle Section Loop"
            >
              <Repeat className="w-3 h-3" />
              <span>{isLooping ? `${loopRange[0]}–${loopRange[1]}` : 'Loop'}</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Main Transport (Zero-overflow on 375px iPhone!) */}
        <div className="flex items-center justify-between sm:justify-center gap-1.5 sm:gap-2.5 w-full sm:w-auto landscape:w-auto flex-nowrap">
          {/* Rewind to Start Measure / Loop Start */}
          <button
            type="button"
            onClick={onRewind}
            className="w-9 h-9 sm:w-9 sm:h-9 landscape:w-8 landscape:h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95 shadow-md flex-shrink-0"
            title={
              language === 'de'
                ? `Zurück zu Takt ${isLooping ? loopRange[0] : startMeasure}`
                : `Rewind to measure ${isLooping ? loopRange[0] : startMeasure}`
            }
            aria-label="Rewind"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Desktop / Landscape Start Measure Pill */}
          {onStartMeasureChange && (
            <div className="hidden sm:flex landscape:flex items-center rounded-xl bg-zinc-900 border border-amber-500/35 overflow-hidden shadow-sm flex-shrink-0">
              <button
                type="button"
                onClick={() => onStartMeasureChange(Math.max(1, startMeasure - 1))}
                className="px-2 py-1.5 text-zinc-400 hover:text-white text-xs font-bold transition-colors active:scale-95"
                title={language === 'de' ? 'Vorheriger Start-Takt (-)' : 'Previous Start Measure (-)'}
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setSectionsMenuOpen(true)}
                className="px-2 py-1.5 font-mono text-[11px] font-bold text-amber-400 hover:text-amber-300 border-x border-white/10 transition-colors"
                title={language === 'de' ? 'Start-Takt & Abschnitte konfigurieren' : 'Configure Start Measure & Sections'}
              >
                Start M.{startMeasure}
              </button>
              <button
                type="button"
                onClick={() => onStartMeasureChange(Math.min(maxMeasure, startMeasure + 1))}
                className="px-2 py-1.5 text-zinc-400 hover:text-white text-xs font-bold transition-colors active:scale-95"
                title={language === 'de' ? 'Nächster Start-Takt (+)' : 'Next Start Measure (+)'}
              >
                +
              </button>
            </div>
          )}

          {/* Central Glowing Play/Pause Button */}
          <button
            type="button"
            onClick={onTogglePlay}
            className="w-10 h-10 sm:w-11 sm:h-11 landscape:w-9 landscape:h-9 rounded-full bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.55)] active:scale-95 transition-all flex-shrink-0"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            ) : (
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* 3-Way Mode Segmented Switcher (Flow / Wait / Comp) */}
          <div className="flex items-center p-0.5 bg-zinc-900 border border-white/10 rounded-xl shadow-sm flex-shrink-0">
            <button
              type="button"
              onClick={() => (onChangePlayMode ? onChangePlayMode('flow') : onToggleWaitMode())}
              className={`px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
                playMode === 'flow'
                  ? 'bg-zinc-800 text-white shadow-sm font-extrabold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Flow Mode: standard continuous playback"
            >
              <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Flow</span>
            </button>
            <button
              type="button"
              onClick={() => (onChangePlayMode ? onChangePlayMode('practice') : onToggleWaitMode())}
              className={`px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
                playMode === 'practice'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Adaptive Practice: waits for notes & speeds up dynamically if you play ahead!"
            >
              <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Wait</span>
            </button>
            <button
              type="button"
              onClick={() => (onChangePlayMode ? onChangePlayMode('competition') : onToggleWaitMode())}
              className={`px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
                playMode === 'competition'
                  ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-600 text-zinc-950 font-extrabold shadow-[0_0_15px_rgba(250,204,21,0.6)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Competition Mode: real-time examination, scoring, mistake log & jury critiques!"
            >
              <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Comp</span>
            </button>
          </div>

          {/* Speed / Tempo Popover Controller (Right-aligned, upward, document-level click-outside dismiss) */}
          <div ref={speedMenuRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
              className="flex items-center gap-1 h-9 px-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 font-mono text-[11px] sm:text-xs font-bold text-zinc-200 transition-all shadow-sm active:scale-95"
              title="Change Playback Speed"
            >
              <Gauge className="w-3.5 h-3.5 text-orange-400" />
              <span>{Math.round(playbackRate * 100)}%</span>
            </button>

            {speedMenuOpen && (
              <div className="absolute bottom-full mb-2.5 right-0 bg-zinc-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-3.5 shadow-2xl flex flex-col gap-3 z-50 w-56 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase">
                  <span>{language === 'de' ? 'Tempo' : 'Playback Speed'}</span>
                  <span className="font-mono text-amber-400 text-xs">{Math.round(playbackRate * 100)}%</span>
                </div>

                {/* Quick preset buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[0.25, 0.5, 0.75, 1.0].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => {
                        onRateChange(rate)
                        setSpeedMenuOpen(false)
                      }}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                        playbackRate === rate
                          ? 'bg-amber-500 text-zinc-950 shadow-md'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
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
                  className="w-full accent-amber-500 cursor-pointer h-2"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right on Desktop / Landscape: Auxiliary Toggles (Loop, Speed Ramp, Metro, Count-In) */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          {/* Loop Mode & Part Practice Selector */}
          <div className="flex items-center rounded-xl border border-white/10 bg-zinc-900 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={onToggleLoop}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                isLooping
                  ? 'bg-blue-500/25 text-blue-300 font-extrabold shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Toggle Loop On/Off"
            >
              <Repeat className={`w-3.5 h-3.5 ${isLooping ? 'text-blue-400' : ''}`} />
              <span className="hidden md:inline">Loop</span>
            </button>
            <button
              type="button"
              onClick={() => setSectionsMenuOpen(true)}
              className="px-2 py-1.5 font-mono text-[11px] text-amber-400 hover:text-amber-300 border-l border-white/10 hover:bg-zinc-800 transition-colors"
              title="Select Part to Practice, Loop or View on Sheet"
            >
              M.{loopRange[0]}–{loopRange[1]}
            </button>
          </div>

          {/* Speed Ramp */}
          {isLooping && onToggleSpeedRamp && (
            <button
              type="button"
              onClick={onToggleSpeedRamp}
              className={`hidden md:flex items-center gap-1 px-2 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95 ${
                isSpeedRamp
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-amber-400 text-zinc-950 font-extrabold shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Auto-Speed: increases tempo by +5% after each successful loop"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+5%</span>
            </button>
          )}

          {/* Metronome Click Toggle */}
          {onToggleMetronome && (
            <button
              type="button"
              onClick={onToggleMetronome}
              className={`hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95 ${
                isMetronomeOn
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Metronome Click"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Metro</span>
            </button>
          )}

          {/* Count-In Pre-Roll Toggle */}
          {onToggleCountIn && (
            <button
              type="button"
              onClick={onToggleCountIn}
              className={`hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95 ${
                isCountInEnabled
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-500 hover:text-zinc-300'
              }`}
              title="1-Measure Count-in Countdown"
            >
              <span className="font-mono text-[11px] font-black tracking-tighter">1 2 3 4</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. TOUCH-FRIENDLY INTERACTIVE PROGRESS SCRUBBER & MEASURE BAR */}
      <div className="bg-zinc-950 border-t border-white/[0.06] px-3 sm:px-5 pt-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] flex items-center gap-2.5 flex-shrink-0">
        <span className="text-[10px] font-mono font-bold text-amber-400 flex-shrink-0 w-12">
          M.{currentMeasure}/{maxMeasure}
        </span>

        {/* Generous 24px-tall interactive drag & tap scrubber */}
        <div
          ref={scrubberRef}
          onPointerDown={(e) => {
            isScrubbingRef.current = true
            e.currentTarget.setPointerCapture(e.pointerId)
            seekAtClientX(e.clientX)
          }}
          onPointerMove={(e) => {
            if (!isScrubbingRef.current) return
            seekAtClientX(e.clientX)
          }}
          onPointerUp={() => {
            isScrubbingRef.current = false
          }}
          onPointerCancel={() => {
            isScrubbingRef.current = false
          }}
          className="flex-1 h-6 flex items-center cursor-pointer touch-none group"
        >
          <div className="w-full h-1.5 group-hover:h-2 bg-zinc-800 rounded-full relative transition-all overflow-visible">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-zinc-950 absolute -right-1.5 top-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            </div>
          </div>
        </div>

        <span className="text-[10px] font-mono text-zinc-400 flex-shrink-0 tabular-nums">
          {formatTimeShort(currentTime)} / {formatTimeShort(piece.duration || 0)}
        </span>
      </div>

      {/* Universal Section & Part Practice Modal (Mobile & Desktop, Backdrop Click Close, Fast Measure Jump!) */}
      {sectionsMenuOpen && (
        <div
          onClick={() => setSectionsMenuOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 border border-white/15 rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[88dvh]"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-950/90 flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex-shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">
                    {language === 'de' ? 'Abschnitt & Start-Takt wählen' : 'Part & Start Measure Practice'}
                  </h3>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {language === 'de'
                      ? `1–${maxMeasure} Takte • Start-Takt, Loop & Notenblatt`
                      : `Measures 1–${maxMeasure} • Start Takt, Loop & Sheet`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSectionsMenuOpen(false)}
                className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] overflow-y-auto space-y-5 flex-1 min-h-0">
              {/* Start-Takt Chooser (Start every time from here — with direct input & ±10 fast jump!) */}
              {onStartMeasureChange && (
                <div className="p-4 bg-gradient-to-br from-amber-500/10 via-zinc-950/80 to-zinc-950/90 rounded-2xl border border-amber-500/30 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>{language === 'de' ? 'Start-Takt (Jedes Mal ab hier)' : 'Default Start Measure'}</span>
                    </span>
                    <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-500/40 flex-shrink-0">
                      M. {startMeasure} / {maxMeasure}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-snug">
                    {language === 'de'
                      ? 'Wähle den Takt, an dem das Üben jedes Mal automatisch beginnt (Start, Zurückspulen, Neustart).'
                      : 'Choose the exact measure where practice begins every time (play, rewind, restart).'}
                  </p>

                  {/* Fast Stepper with -10, -1, Direct Input, +1, +10 */}
                  <div className="flex items-center bg-zinc-900 border border-white/10 rounded-xl p-1 gap-1">
                    {maxMeasure > 15 && (
                      <button
                        type="button"
                        onClick={() => onStartMeasureChange(clampMeasure(startMeasure - 10))}
                        className="px-2 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono font-bold text-xs active:scale-95 transition-all"
                      >
                        -10
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onStartMeasureChange(clampMeasure(startMeasure - 1))}
                      className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center text-sm active:scale-95 transition-all"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={maxMeasure}
                      value={startMeasure}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10)
                        if (!isNaN(val)) onStartMeasureChange(clampMeasure(val))
                      }}
                      className="flex-1 min-w-0 bg-transparent text-center font-mono text-base font-extrabold text-amber-300 focus:outline-none"
                      aria-label="Start measure number"
                    />
                    <button
                      type="button"
                      onClick={() => onStartMeasureChange(clampMeasure(startMeasure + 1))}
                      className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center text-sm active:scale-95 transition-all"
                    >
                      +
                    </button>
                    {maxMeasure > 15 && (
                      <button
                        type="button"
                        onClick={() => onStartMeasureChange(clampMeasure(startMeasure + 10))}
                        className="px-2 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono font-bold text-xs active:scale-95 transition-all"
                      >
                        +10
                      </button>
                    )}
                  </div>

                  {/* Quick Jump Chips + Primary Launch */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onStartMeasureChange(1)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border active:scale-95 ${
                        startMeasure === 1
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-white/5'
                      }`}
                    >
                      M. 1
                    </button>
                    <button
                      type="button"
                      onClick={() => onStartMeasureChange(currentMeasure)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border active:scale-95 ${
                        startMeasure === currentMeasure
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-white/5'
                      }`}
                    >
                      {language === 'de' ? `Aktuell (M.${currentMeasure})` : `Current (M.${currentMeasure})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePracticeFromStartMeasure(startMeasure)}
                      className="flex-1 min-w-[140px] px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{language === 'de' ? `Ab Takt ${startMeasure} üben` : `Practice from M.${startMeasure}`}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 1. Custom Measure Range Chooser */}
              <div className="p-4 bg-zinc-950/80 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{language === 'de' ? 'Taktbereich wählen (Loop)' : 'Choose Range (From – To)'}</span>
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2.5 py-0.5 rounded-lg border border-white/5">
                    {customEndMeasure - customStartMeasure + 1} {language === 'de' ? 'Takte' : 'Measures'}
                  </span>
                </div>

                {/* Range Steppers with Direct Numeric Input */}
                <div className="grid grid-cols-2 gap-3">
                  {/* From Measure */}
                  <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-2.5 flex flex-col gap-2">
                    <label className="text-[10px] uppercase font-bold text-zinc-400">
                      {language === 'de' ? 'Von Takt (Start)' : 'From Measure'}
                    </label>
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => setCustomStartMeasure((m) => Math.max(1, m - 1))}
                        className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center text-sm active:scale-95 transition-all flex-shrink-0"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={customEndMeasure}
                        value={customStartMeasure}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10)
                          if (!isNaN(val)) {
                            const clamped = clampMeasure(val)
                            setCustomStartMeasure(clamped)
                            if (clamped > customEndMeasure) setCustomEndMeasure(clamped)
                          }
                        }}
                        className="w-full min-w-0 bg-transparent text-center font-mono text-base font-extrabold text-amber-300 focus:outline-none"
                        aria-label="Loop start measure"
                      />
                      <button
                        type="button"
                        onClick={() => setCustomStartMeasure((m) => Math.min(customEndMeasure, m + 1))}
                        className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center text-sm active:scale-95 transition-all flex-shrink-0"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* To Measure */}
                  <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-2.5 flex flex-col gap-2">
                    <label className="text-[10px] uppercase font-bold text-zinc-400">
                      {language === 'de' ? 'Bis Takt (Ende)' : 'To Measure'}
                    </label>
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => setCustomEndMeasure((m) => Math.max(customStartMeasure, m - 1))}
                        className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center text-sm active:scale-95 transition-all flex-shrink-0"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={customStartMeasure}
                        max={maxMeasure}
                        value={customEndMeasure}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10)
                          if (!isNaN(val)) {
                            const clamped = clampMeasure(val)
                            setCustomEndMeasure(Math.max(customStartMeasure, clamped))
                          }
                        }}
                        className="w-full min-w-0 bg-transparent text-center font-mono text-base font-extrabold text-amber-300 focus:outline-none"
                        aria-label="Loop end measure"
                      />
                      <button
                        type="button"
                        onClick={() => setCustomEndMeasure((m) => Math.min(maxMeasure, m + 1))}
                        className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center text-sm active:scale-95 transition-all flex-shrink-0"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress bar visualizer */}
                <div className="space-y-1">
                  <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden relative border border-white/5">
                    <div
                      className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-500 via-orange-500 to-blue-500 rounded-full transition-all"
                      style={{
                        left: `${((customStartMeasure - 1) / maxMeasure) * 100}%`,
                        width: `${Math.max(4, ((customEndMeasure - customStartMeasure + 1) / maxMeasure) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 px-0.5">
                    <span>M. 1</span>
                    <span className="text-amber-400/90 font-bold">M. {customStartMeasure} – {customEndMeasure}</span>
                    <span>M. {maxMeasure}</span>
                  </div>
                </div>

                {/* 4 Main Action Buttons (Loop Listen, Wait Practice, Sheet, Roland LX-9 Teacher Exam) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleListenInLoop(customStartMeasure, customEndMeasure)}
                    className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 active:scale-95 transition-all"
                  >
                    <Repeat className="w-4 h-4" />
                    <span>{language === 'de' ? 'Im Loop anhören' : 'Listen in Loop'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePracticePart(customStartMeasure, customEndMeasure)}
                    className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/25 active:scale-95 transition-all"
                  >
                    <Target className="w-4 h-4" />
                    <span>{language === 'de' ? 'Abschnitt üben' : 'Practice Part'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDisplaySheet(customStartMeasure, customEndMeasure)}
                    className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/25 active:scale-95 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{language === 'de' ? 'Noten anzeigen' : 'Display Sheet'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const s = clampMeasure(customStartMeasure)
                      const e = Math.max(s, clampMeasure(customEndMeasure))
                      if (onChangeCompetitionExamRange) onChangeCompetitionExamRange([s, e])
                      if (isLooping) onToggleLoop()
                      if (onChangePlayMode) onChangePlayMode('competition')
                      const startNote = piece.notes.find((n) => n.measure >= s)
                      onSeek(startNote ? startNote.startTime : 0)
                      setSectionsMenuOpen(false)
                    }}
                    className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/25 active:scale-95 transition-all"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>{language === 'de' ? 'Lehrer-Prüfung (LX-9)' : 'Teacher Exam (LX-9)'}</span>
                  </button>
                </div>
              </div>

              {/* 2. Song Section Presets */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
                  {language === 'de' ? 'Abschnitts-Voreinstellungen' : 'Song Section Presets'}
                </div>
                <div className="space-y-2">
                  {piece.sections.map((sec) => {
                    const isSelected =
                      customStartMeasure === sec.startMeasure && customEndMeasure === sec.endMeasure
                    return (
                      <div
                        key={sec.id}
                        onClick={() => {
                          setCustomStartMeasure(sec.startMeasure)
                          setCustomEndMeasure(sec.endMeasure)
                        }}
                        className={`p-3.5 rounded-2xl cursor-pointer transition-all border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/60 text-white'
                            : 'bg-zinc-800/60 hover:bg-zinc-800 border-white/5 text-zinc-200'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                            <span>{sec.title}</span>
                            <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                              M. {sec.startMeasure}–{sec.endMeasure}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">{sec.character}</div>
                          {sec.tempoSuggestion && (
                            <div className="text-[10px] text-amber-400/90 font-mono mt-0.5">
                              {sec.tempoSuggestion}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {onStartMeasureChange && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onStartMeasureChange(sec.startMeasure)
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                                startMeasure === sec.startMeasure
                                  ? 'bg-amber-500 text-zinc-950 font-black shadow-sm'
                                  : 'bg-zinc-700/70 hover:bg-zinc-700 text-zinc-200'
                              }`}
                            >
                              {startMeasure === sec.startMeasure ? '★ Start' : 'Start'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePracticePart(sec.startMeasure, sec.endMeasure)
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 text-[10px] font-bold transition-colors"
                          >
                            {language === 'de' ? 'Üben' : 'Practice'}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleListenInLoop(sec.startMeasure, sec.endMeasure)
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 text-[10px] font-bold transition-colors"
                          >
                            Loop
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDisplaySheet(sec.startMeasure, sec.endMeasure)
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 text-[10px] font-bold transition-colors"
                          >
                            Sheet
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
