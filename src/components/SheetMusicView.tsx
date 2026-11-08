import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import type { NoteEvent, Piece, PedalEvent } from '../types/music'
import type { LanguageCode } from '../i18n/translations'
import { Moon, Sun, RotateCcw } from 'lucide-react'

interface SheetMusicViewProps {
  piece: Piece
  currentTime: number
  activeNotes?: Map<number, { velocity: number; timestamp: number }>
  expectedNotes?: number[]
  isWaitMode?: boolean
  playMode?: 'flow' | 'practice' | 'competition'
  handMode?: 'both' | 'right' | 'left'
  isPlaying?: boolean
  onSeek: (time: number) => void
  isLooping?: boolean
  loopRange?: [number, number]
  onLoopRangeChange?: (range: [number, number]) => void
  onToggleLoop?: () => void
  language?: LanguageCode
  showFingering?: boolean
}

// Diatonic step calculation relative to C4 (Middle C = 0)
const PITCH_STEP_MAP: { [key: string]: number } = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
}

function getDiatonicStep(noteName: string, midi: number): number {
  const match = noteName?.match(/^([A-Ga-g])([#b]?)(-?\d+)$/)
  if (match) {
    const letter = match[1].toUpperCase()
    const oct = parseInt(match[3], 10)
    return (oct - 4) * 7 + (PITCH_STEP_MAP[letter] ?? 0)
  }
  const oct = Math.floor(midi / 12) - 1
  const pc = midi % 12
  const fallback = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]
  return (oct - 4) * 7 + fallback[pc]
}

// Canonical SMuFL vector paths for Treble (G) and Bass (F) clefs
const G_CLEF_PATH =
  'M12.4,56.7 C11.5,57.8 9.9,58.5 8.4,58.3 C6.1,58.0 4.3,56.0 4.3,53.7 C4.3,51.3 6.0,49.4 8.4,49.4 C9.7,49.4 11.0,50.1 11.7,51.1 L11.9,46.8 C10.1,44.9 8.2,42.5 6.7,39.7 C4.8,36.1 3.8,32.3 3.8,28.4 C3.8,21.5 6.6,15.1 11.5,9.8 C14.3,6.8 17.5,4.3 20.8,2.5 L21.6,2.1 L21.7,3.0 C21.4,7.8 20.5,14.6 19.3,21.5 C21.5,19.3 24.1,18.0 27.0,18.0 C31.6,18.0 35.5,21.8 35.5,27.1 C35.5,33.0 30.8,38.0 24.5,38.0 C20.6,38.0 17.2,36.0 15.3,32.8 L14.7,40.1 C16.0,42.3 17.7,44.9 19.5,47.2 C21.5,49.7 23.3,52.8 23.3,56.4 C23.3,62.2 18.5,66.8 12.5,66.8 C7.0,66.8 2.5,62.8 2.0,57.3 L4.6,57.1 C5.0,61.1 8.3,64.2 12.5,64.2 C16.9,64.2 20.6,60.8 20.6,56.4 C20.6,53.4 19.2,50.8 17.5,48.6 C16.1,46.8 14.6,44.7 13.4,42.6 L12.4,56.7 Z M15.1,28.3 C16.5,32.2 19.8,35.4 24.0,35.4 C28.8,35.4 32.7,31.4 32.7,27.0 C32.7,22.9 29.5,19.9 25.8,19.9 C23.1,19.9 20.7,21.2 18.9,23.3 C17.8,24.6 16.9,26.2 15.1,28.3 Z'

const F_CLEF_PATH =
  'M4.2,8.5 C4.2,4.8 7.3,1.8 11.2,1.8 C15.0,1.8 18.1,4.7 18.3,8.4 C18.3,8.7 18.3,9.0 18.3,9.3 C18.3,15.6 13.9,22.8 5.6,30.0 L4.2,28.5 C10.9,22.6 14.8,16.5 15.1,11.5 C14.0,12.7 12.5,13.4 10.8,13.4 C7.1,13.4 4.2,10.6 4.2,8.5 Z M22.5,5.8 C22.5,4.3 23.7,3.1 25.2,3.1 C26.7,3.1 27.9,4.3 27.9,5.8 C27.9,7.3 26.7,8.5 25.2,8.5 C23.7,8.5 22.5,7.3 22.5,5.8 Z M22.5,15.2 C22.5,13.7 23.7,12.5 25.2,12.5 C26.7,12.5 27.9,13.7 27.9,15.2 C27.9,16.7 26.7,17.9 25.2,17.9 C23.7,17.9 22.5,16.7 22.5,15.2 Z'

// Constants for authentic grand staff proportions (in SVG virtual units)
const SYSTEM_WIDTH = 960
const LINE_SPACING = 9
const STAFF_HEIGHT = LINE_SPACING * 4 // 36px
const TREBLE_TOP_Y = 54
const TREBLE_BOTTOM_Y = TREBLE_TOP_Y + STAFF_HEIGHT // 90px
const MIDDLE_C_Y = TREBLE_BOTTOM_Y + LINE_SPACING // 99px
const BASS_TOP_Y = MIDDLE_C_Y + LINE_SPACING // 108px
const BASS_BOTTOM_Y = BASS_TOP_Y + STAFF_HEIGHT // 144px
const PEDAL_Y = BASS_BOTTOM_Y + 22 // 166px
const SYSTEM_HEIGHT = PEDAL_Y + 16 // 182px

export const SheetMusicView: React.FC<SheetMusicViewProps> = ({
  piece,
  currentTime,
  activeNotes,
  expectedNotes = [],
  isWaitMode = false,
  onSeek,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>(800)

  // Urtext ivory paper vs OLED dark theme
  const [scoreTheme, setScoreTheme] = useState<'ivory' | 'dark'>(() => {
    return (localStorage.getItem('virtuoso_score_theme') as 'ivory' | 'dark') || 'ivory'
  })

  const toggleTheme = useCallback(() => {
    setScoreTheme((prev) => {
      const next = prev === 'ivory' ? 'dark' : 'ivory'
      localStorage.setItem('virtuoso_score_theme', next)
      return next
    })
  }, [])

  const isDark = scoreTheme === 'dark'
  const pageBgColor = isDark ? '#09090b' : '#fdfbf7'
  const staveLineColor = isDark ? '#3f3f46' : '#27272a'
  const inkColor = isDark ? '#f4f4f5' : '#18181b'
  const barlineColor = isDark ? '#52525b' : '#18181b'
  const dimInkColor = isDark ? '#71717a' : '#78716c'

  // Track viewport width for responsive measures per system
  useEffect(() => {
    const updateSize = () => {
      if (scrollContainerRef.current) {
        setContainerWidth(scrollContainerRef.current.clientWidth)
      } else if (typeof window !== 'undefined') {
        setContainerWidth(window.innerWidth)
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const measuresPerSystem = useMemo(() => {
    if (containerWidth >= 1150) return 4
    if (containerWidth >= 700) return 3
    return 2 // 2 measures per line on iPhone portrait for maximum note legibility
  }, [containerWidth])

  // Key signature analysis: sharps vs flats
  const { sharpsCount, flatsCount, keySignaturePitches } = useMemo(() => {
    const k = (piece.key || '').toLowerCase()
    let s = 0
    let f = 0

    if (k.includes('c# min') || k.includes('e maj') || k.includes('4 sharp')) {
      s = 4
    } else if (k.includes('b maj') || k.includes('g# min') || k.includes('5 sharp')) {
      s = 5
    } else if (k.includes('f# min') || k.includes('a maj') || k.includes('3 sharp')) {
      s = 3
    } else if (k.includes('b min') || k.includes('d maj') || k.includes('2 sharp')) {
      s = 2
    } else if (k.includes('e min') || k.includes('g maj') || k.includes('1 sharp')) {
      s = 1
    } else if (k.includes('ab maj') || k.includes('f min') || k.includes('4 flat')) {
      f = 4
    } else if (k.includes('db maj') || k.includes('bb min') || k.includes('5 flat')) {
      f = 5
    } else if (k.includes('eb maj') || k.includes('c min') || k.includes('3 flat')) {
      f = 3
    } else if (k.includes('bb maj') || k.includes('g min') || k.includes('2 flat')) {
      f = 2
    } else if (k.includes('d min') || k.includes('f maj') || k.includes('1 flat')) {
      f = 1
    }

    // Standard accidental coverage arrays
    const sharpPitches = ['F', 'C', 'G', 'D', 'A', 'E', 'B'].slice(0, s)
    const flatPitches = ['B', 'E', 'A', 'D', 'G', 'C', 'F'].slice(0, f)

    return {
      sharpsCount: s,
      flatsCount: f,
      keySignaturePitches: s > 0 ? sharpPitches : flatPitches,
    }
  }, [piece.key])

  // Check if a note's sharp or flat is already present in the key signature
  const isAccidentalCovered = useCallback(
    (noteName: string): boolean => {
      const root = noteName.charAt(0).toUpperCase()
      if (noteName.includes('#') && sharpsCount > 0) {
        return keySignaturePitches.includes(root)
      }
      if (noteName.includes('b') && flatsCount > 0) {
        return keySignaturePitches.includes(root)
      }
      return false
    },
    [sharpsCount, flatsCount, keySignaturePitches]
  )

  // Group notes & pedal events by measure
  const { measuresMap, maxMeasure, measureNumbers } = useMemo(() => {
    const mMap = new Map<number, NoteEvent[]>()
    let maxM = 1

    piece.notes.forEach((note) => {
      const m = Math.max(1, note.measure)
      if (m > maxM) maxM = m
      if (!mMap.has(m)) mMap.set(m, [])
      mMap.get(m)!.push(note)
    })

    const nums: number[] = []
    for (let i = 1; i <= maxM; i++) {
      nums.push(i)
    }

    return { measuresMap: mMap, maxMeasure: maxM, measureNumbers: nums }
  }, [piece.notes])

  // Group pedals by measure
  const pedalsMap = useMemo(() => {
    const pMap = new Map<number, PedalEvent[]>()
    piece.pedalEvents?.forEach((pedal) => {
      const m = Math.max(1, pedal.measure || 1)
      if (!pMap.has(m)) pMap.set(m, [])
      pMap.get(m)!.push(pedal)
    })
    return pMap
  }, [piece.pedalEvents])

  // Systems division (multi-measure lines)
  const systems = useMemo(() => {
    const list: { systemIndex: number; measures: number[] }[] = []
    for (let i = 0; i < measureNumbers.length; i += measuresPerSystem) {
      list.push({
        systemIndex: Math.floor(i / measuresPerSystem),
        measures: measureNumbers.slice(i, i + measuresPerSystem),
      })
    }
    return list
  }, [measureNumbers, measuresPerSystem])

  // Current active measure
  const currentMeasure = useMemo(() => {
    for (let i = piece.notes.length - 1; i >= 0; i--) {
      if (currentTime >= piece.notes[i].startTime) {
        return Math.max(1, piece.notes[i].measure)
      }
    }
    return measureNumbers[0] || 1
  }, [currentTime, piece.notes, measureNumbers])

  // Active system index
  const currentSystemIndex = useMemo(() => {
    return Math.max(0, Math.floor((currentMeasure - 1) / measuresPerSystem))
  }, [currentMeasure, measuresPerSystem])

  // Smooth vertical scrolling to keep current system in view
  useEffect(() => {
    if (!scrollContainerRef.current) return
    const activeEl = scrollContainerRef.current.querySelector<HTMLElement>(
      `[data-system="${currentSystemIndex}"]`
    )
    if (activeEl) {
      const container = scrollContainerRef.current
      const targetTop = activeEl.offsetTop - container.clientHeight * 0.28
      container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
    }
  }, [currentSystemIndex])

  // Map note pitch to Y coordinate on the grand staff
  const getNoteY = useCallback((note: NoteEvent): number => {
    const step = getDiatonicStep(note.noteName, note.midi)
    if (note.hand === 'right') {
      // Treble staff: Line 5 (F5) is step 10 -> y = TREBLE_TOP_Y (54)
      return TREBLE_TOP_Y + (10 - step) * (LINE_SPACING / 2)
    } else {
      // Bass staff: Line 5 (A3) is step -2 -> y = BASS_TOP_Y (108)
      return BASS_TOP_Y + (-2 - step) * (LINE_SPACING / 2)
    }
  }, [])

  // Calculate ledger lines for notes outside the 5 staff lines
  const getLedgerLines = useCallback((y: number, hand: 'right' | 'left'): number[] => {
    const lines: number[] = []
    if (hand === 'right') {
      // Below treble staff (Line 1 E4 is 90)
      if (y >= 96) {
        // C4 is 99, A3 is 108
        for (let ly = MIDDLE_C_Y; ly <= y + 2; ly += LINE_SPACING) {
          lines.push(ly)
        }
      }
      // Above treble staff (Line 5 F5 is 54)
      if (y <= 48) {
        // A5 is 45, C6 is 36, E6 is 27
        for (let ly = TREBLE_TOP_Y - LINE_SPACING; ly >= y - 2; ly -= LINE_SPACING) {
          lines.push(ly)
        }
      }
    } else {
      // Above bass staff (Line 5 A3 is 108)
      if (y <= 102) {
        // C4 is 99, E4 is 90
        for (let ly = MIDDLE_C_Y; ly >= y - 2; ly -= LINE_SPACING) {
          lines.push(ly)
        }
      }
      // Below bass staff (Line 1 G2 is 144)
      if (y >= 150) {
        // E2 is 153, C2 is 162
        for (let ly = BASS_BOTTOM_Y + LINE_SPACING; ly <= y + 2; ly += LINE_SPACING) {
          lines.push(ly)
        }
      }
    }
    return lines
  }, [])

  return (
    <div
      ref={scrollContainerRef}
      className="w-full h-full overflow-y-auto overflow-x-hidden transition-colors duration-200 select-none pb-24"
      style={{ backgroundColor: pageBgColor }}
    >
      {/* 1. Classical Score Sheet Header */}
      <div className="max-w-4xl mx-auto pt-6 pb-4 px-4 sm:px-8 border-b border-stone-200/40 dark:border-zinc-800/60 mb-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Henle Urtext
            </span>
            <span className="text-xs font-mono font-medium text-stone-500 dark:text-zinc-500">
              Takt {currentMeasure} / {maxMeasure}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle (Ivory vs OLED Dark) */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-stone-300 dark:border-zinc-700 bg-stone-100/70 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-300 hover:text-amber-500 transition-colors"
              title={isDark ? 'Switch to Ivory Parchment' : 'Switch to OLED Dark'}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Jump to Beginning */}
            <button
              onClick={() => onSeek(0)}
              className="p-1.5 rounded-lg border border-stone-300 dark:border-zinc-700 bg-stone-100/70 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-300 hover:text-amber-500 transition-colors"
              title="Seek to measure 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Piece Title & Subtitle (Classical Typography) */}
        <div className="text-center mt-3 mb-1">
          <h1
            className="text-2xl sm:text-3xl font-serif font-extrabold tracking-tight"
            style={{ color: inkColor }}
          >
            {piece.title}
          </h1>
          <p className="text-xs sm:text-sm font-serif italic text-stone-600 dark:text-zinc-400 mt-0.5">
            {piece.composer}
            {piece.opus ? ` • ${piece.opus}` : ''}
          </p>
        </div>

        {/* Initial Tempo & Key Info */}
        <div className="flex items-center justify-between text-[11px] font-serif font-semibold mt-2 text-stone-500 dark:text-zinc-400 px-1">
          <div className="flex items-center gap-1.5">
            <span className="font-sans font-bold">♩</span>
            <span>= {piece.tempoBpm || 80}</span>
          </div>
          <div>
            <span>{piece.key || 'C Major'}</span>
            <span className="mx-1.5">•</span>
            <span>{piece.timeSignature ? `${piece.timeSignature[0]}/${piece.timeSignature[1]}` : '4/4'}</span>
          </div>
        </div>
      </div>

      {/* 2. Grand Staff Multi-System Score Page */}
      <div className="max-w-4xl mx-auto px-2 sm:px-6 space-y-4">
        {systems.map((system) => {
          const isFirstSystem = system.systemIndex === 0
          const systemMeasures = system.measures
          const accoladeWidth = isFirstSystem ? 88 : 72
          const availableMeasureWidth = SYSTEM_WIDTH - accoladeWidth
          const measureWidth = availableMeasureWidth / systemMeasures.length

          return (
            <div
              key={`system-${system.systemIndex}`}
              data-system={system.systemIndex}
              className={`relative rounded-xl transition-all duration-200 overflow-hidden ${
                systemMeasures.includes(currentMeasure)
                  ? isDark
                    ? 'ring-1 ring-amber-500/40 bg-zinc-900/30'
                    : 'ring-1 ring-amber-500/30 bg-amber-500/[0.02]'
                  : ''
              }`}
            >
              <svg
                viewBox={`0 0 ${SYSTEM_WIDTH} ${SYSTEM_HEIGHT}`}
                className="w-full h-auto block select-none"
                style={{ filter: isDark ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' : 'none' }}
              >
                {/* --- A. ACCORDEON & CLEFS (Left Accolade) --- */}
                {/* Curly Accolade Brace */}
                <path
                  d={`M 14 ${TREBLE_TOP_Y} C 4 ${TREBLE_TOP_Y + 16}, 4 ${MIDDLE_C_Y - 10}, 0 ${MIDDLE_C_Y} C 4 ${MIDDLE_C_Y + 10}, 4 ${BASS_BOTTOM_Y - 16}, 14 ${BASS_BOTTOM_Y}`}
                  fill="none"
                  stroke={inkColor}
                  strokeWidth="2.2"
                />
                <line
                  x1="16"
                  y1={TREBLE_TOP_Y}
                  x2="16"
                  y2={BASS_BOTTOM_Y}
                  stroke={inkColor}
                  strokeWidth="1.6"
                />

                {/* Treble Clef Vector (Placed exactly on G4 Line) */}
                <g transform="translate(19, 24) scale(0.95)" fill={inkColor}>
                  <path d={G_CLEF_PATH} />
                </g>

                {/* Bass Clef Vector (Placed exactly straddling F3 Line) */}
                <g transform="translate(20, 114) scale(1.0)" fill={inkColor}>
                  <path d={F_CLEF_PATH} />
                </g>

                {/* Key Signature: Canonical Sharps on Treble & Bass */}
                {sharpsCount > 0 && (
                  <g fill={inkColor} fontSize="14" fontFamily="serif" fontWeight="bold">
                    {/* Treble Sharps */}
                    {sharpsCount >= 1 && <text x="50" y="58">♯</text>} {/* F#5 */}
                    {sharpsCount >= 2 && <text x="57" y="72">♯</text>} {/* C#5 */}
                    {sharpsCount >= 3 && <text x="64" y="54">♯</text>} {/* G#5 */}
                    {sharpsCount >= 4 && <text x="71" y="67">♯</text>} {/* D#5 */}
                    {/* Bass Sharps */}
                    {sharpsCount >= 1 && <text x="50" y="122">♯</text>} {/* F#3 */}
                    {sharpsCount >= 2 && <text x="57" y="136">♯</text>} {/* C#3 */}
                    {sharpsCount >= 3 && <text x="64" y="118">♯</text>} {/* G#3 */}
                    {sharpsCount >= 4 && <text x="71" y="131">♯</text>} {/* D#3 */}
                  </g>
                )}

                {/* Key Signature: Canonical Flats on Treble & Bass */}
                {flatsCount > 0 && (
                  <g fill={inkColor} fontSize="15" fontFamily="serif" fontWeight="bold">
                    {/* Treble Flats */}
                    {flatsCount >= 1 && <text x="50" y="77">♭</text>} {/* Bb4 */}
                    {flatsCount >= 2 && <text x="57" y="64">♭</text>} {/* Eb5 */}
                    {flatsCount >= 3 && <text x="64" y="82">♭</text>} {/* Ab4 */}
                    {flatsCount >= 4 && <text x="71" y="69">♭</text>} {/* Db5 */}
                    {/* Bass Flats */}
                    {flatsCount >= 1 && <text x="50" y="140">♭</text>} {/* Bb2 */}
                    {flatsCount >= 2 && <text x="57" y="127">♭</text>} {/* Eb3 */}
                    {flatsCount >= 3 && <text x="64" y="145">♭</text>} {/* Ab2 */}
                    {flatsCount >= 4 && <text x="71" y="132">♭</text>} {/* Db3 */}
                  </g>
                )}

                {/* Time Signature (Shown on First System) */}
                {isFirstSystem && (
                  <g fill={inkColor} fontFamily="serif" fontWeight="900" fontSize="16" textAnchor="middle">
                    <text x={accoladeWidth - 10} y={TREBLE_TOP_Y + LINE_SPACING * 1.7}>
                      {piece.timeSignature ? piece.timeSignature[0] : 4}
                    </text>
                    <text x={accoladeWidth - 10} y={TREBLE_TOP_Y + LINE_SPACING * 3.7}>
                      {piece.timeSignature ? piece.timeSignature[1] : 4}
                    </text>
                    <text x={accoladeWidth - 10} y={BASS_TOP_Y + LINE_SPACING * 1.7}>
                      {piece.timeSignature ? piece.timeSignature[0] : 4}
                    </text>
                    <text x={accoladeWidth - 10} y={BASS_TOP_Y + LINE_SPACING * 3.7}>
                      {piece.timeSignature ? piece.timeSignature[1] : 4}
                    </text>
                  </g>
                )}

                {/* Continuous Grand Staff Lines (5 Treble + 5 Bass across entire system) */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <React.Fragment key={`staff-lines-${i}`}>
                    {/* Treble line */}
                    <line
                      x1="16"
                      y1={TREBLE_TOP_Y + i * LINE_SPACING}
                      x2={SYSTEM_WIDTH}
                      y2={TREBLE_TOP_Y + i * LINE_SPACING}
                      stroke={staveLineColor}
                      strokeWidth="1.2"
                    />
                    {/* Bass line */}
                    <line
                      x1="16"
                      y1={BASS_TOP_Y + i * LINE_SPACING}
                      x2={SYSTEM_WIDTH}
                      y2={BASS_TOP_Y + i * LINE_SPACING}
                      stroke={staveLineColor}
                      strokeWidth="1.2"
                    />
                  </React.Fragment>
                ))}

                {/* --- B. MEASURES & NOTES RENDERING --- */}
                {systemMeasures.map((mNum, mIdx) => {
                  const mStartX = accoladeWidth + mIdx * measureWidth
                  const mEndX = mStartX + measureWidth
                  const isCurrent = mNum === currentMeasure
                  const notesInMeasure = measuresMap.get(mNum) || []
                  const pedalsInMeasure = pedalsMap.get(mNum) || []
                  const isLastOfPiece = mNum === maxMeasure

                  const sortedNotes = [...notesInMeasure].sort((a, b) => a.startTime - b.startTime || a.midi - b.midi)
                  const mStartTime = sortedNotes[0]?.startTime ?? (mNum - 1) * 2.0
                  const mEndTime = sortedNotes[sortedNotes.length - 1]
                    ? sortedNotes[sortedNotes.length - 1].startTime + (sortedNotes[sortedNotes.length - 1].duration || 0.4)
                    : mStartTime + 2.0
                  const mDuration = Math.max(0.6, mEndTime - mStartTime)
                  const measureBeats = piece.timeSignature ? piece.timeSignature[0] : 4

                  // Calculate active playhead X for current measure in Flow Mode
                  const playheadRatio = Math.max(0, Math.min(1, (currentTime - mStartTime) / mDuration))
                  const playheadX = mStartX + 14 + playheadRatio * (measureWidth - 28)

                  // Group notes into time-aligned chords for clean stem sharing
                  const rightHandChords = new Map<number, NoteEvent[]>()
                  const leftHandChords = new Map<number, NoteEvent[]>()

                  sortedNotes.forEach((n) => {
                    const tKey = Math.round(n.startTime * 100) / 100
                    if (n.hand === 'left') {
                      if (!leftHandChords.has(tKey)) leftHandChords.set(tKey, [])
                      leftHandChords.get(tKey)!.push(n)
                    } else {
                      if (!rightHandChords.has(tKey)) rightHandChords.set(tKey, [])
                      rightHandChords.get(tKey)!.push(n)
                    }
                  })

                  return (
                    <g
                      key={`meas-${mNum}`}
                      className="cursor-pointer"
                      onClick={() => {
                        if (sortedNotes[0]) onSeek(sortedNotes[0].startTime)
                      }}
                    >
                      {/* Active Measure Background Wash */}
                      {isCurrent && (
                        <rect
                          x={mStartX}
                          y={TREBLE_TOP_Y - 8}
                          width={measureWidth}
                          height={BASS_BOTTOM_Y - TREBLE_TOP_Y + 16}
                          fill={isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)'}
                          rx="4"
                        />
                      )}

                      {/* Measure Number at top-left */}
                      <text
                        x={mStartX + 4}
                        y={TREBLE_TOP_Y - 6}
                        fill={dimInkColor}
                        fontFamily="monospace"
                        fontSize="9.5"
                        fontWeight="bold"
                      >
                        {mNum}
                      </text>

                      {/* Measure Barline at right edge */}
                      {isLastOfPiece ? (
                        /* Urtext Final Double Barline */
                        <g>
                          <line
                            x1={mEndX - 4}
                            y1={TREBLE_TOP_Y}
                            x2={mEndX - 4}
                            y2={BASS_BOTTOM_Y}
                            stroke={barlineColor}
                            strokeWidth="1.2"
                          />
                          <line
                            x1={mEndX - 1}
                            y1={TREBLE_TOP_Y}
                            x2={mEndX - 1}
                            y2={BASS_BOTTOM_Y}
                            stroke={barlineColor}
                            strokeWidth="3.2"
                          />
                        </g>
                      ) : (
                        <line
                          x1={mEndX}
                          y1={TREBLE_TOP_Y}
                          x2={mEndX}
                          y2={BASS_BOTTOM_Y}
                          stroke={barlineColor}
                          strokeWidth="1.3"
                        />
                      )}

                      {/* Dynamic Expression Mark (e.g. p, mf, f) */}
                      {(() => {
                        if (sortedNotes.length === 0) return null
                        const avgVel =
                          sortedNotes.reduce((sum, n) => sum + (n.velocity || 75), 0) / sortedNotes.length
                        const dyn =
                          avgVel >= 105 ? 'ff' : avgVel >= 92 ? 'f' : avgVel >= 78 ? 'mf' : avgVel >= 64 ? 'mp' : avgVel >= 48 ? 'p' : null
                        if (!dyn) return null
                        return (
                          <text
                            x={mStartX + 8}
                            y={MIDDLE_C_Y + 3.5}
                            fontSize="11"
                            fontFamily="serif"
                            fontStyle="italic"
                            fontWeight="bold"
                            fill={isDark ? '#fbbf24' : '#854d0e'}
                          >
                            {dyn}
                          </text>
                        )
                      })()}

                      {/* --- NOTES & CHORDS: RIGHT HAND (Treble Staff) --- */}
                      {Array.from(rightHandChords.entries()).map(([tKey, chordNotes]) => {
                        const firstNote = chordNotes[0]
                        let noteX: number
                        if (firstNote.beat !== undefined && firstNote.beat >= 1) {
                          const beatRatio = (firstNote.beat - 1) / measureBeats
                          noteX = mStartX + 16 + beatRatio * (measureWidth - 32)
                        } else {
                          const timeRatio = (firstNote.startTime - mStartTime) / mDuration
                          noteX = mStartX + 16 + timeRatio * (measureWidth - 32)
                        }

                        // Status checks
                        const isExpected =
                          isWaitMode &&
                          expectedNotes.length > 0 &&
                          chordNotes.some((n) => expectedNotes.includes(n.midi)) &&
                          Math.abs(firstNote.startTime - currentTime) < 0.35

                        const isSounding = chordNotes.some(
                          (n) =>
                            (activeNotes && activeNotes.has(n.midi)) ||
                            (currentTime >= n.startTime && currentTime <= n.startTime + n.duration)
                        )

                        const chordColor = isExpected ? '#ea580c' : isSounding ? '#10b981' : inkColor

                        const yPositions = chordNotes.map((n) => getNoteY(n)).sort((a, b) => a - b)
                        const highestY = yPositions[0]
                        const lowestY = yPositions[yPositions.length - 1]

                        // Stem up if notes are low in treble; stem down if notes are high
                        const isStemUp = highestY > TREBLE_TOP_Y + LINE_SPACING * 2
                        const stemX = isStemUp ? noteX + 4.8 : noteX - 4.8
                        const stemStartY = isStemUp ? lowestY : highestY
                        const stemEndY = isStemUp ? highestY - 26 : lowestY + 26

                        return (
                          <g key={`rh-chord-${mNum}-${tKey}`}>
                            {/* Awaited Target Pointer in Wait Mode */}
                            {isExpected && (
                              <g>
                                <polygon
                                  points={`${noteX},${TREBLE_TOP_Y - 9} ${noteX - 4.5},${TREBLE_TOP_Y - 17} ${noteX + 4.5},${TREBLE_TOP_Y - 17}`}
                                  fill="#f59e0b"
                                />
                                <text
                                  x={noteX}
                                  y={TREBLE_TOP_Y - 19}
                                  fontSize="8.5"
                                  fontWeight="900"
                                  fontFamily="sans-serif"
                                  fill="#f59e0b"
                                  textAnchor="middle"
                                >
                                  WAIT
                                </text>
                              </g>
                            )}

                            {/* Consolidated Musical Stem */}
                            <line
                              x1={stemX}
                              y1={stemStartY}
                              x2={stemX}
                              y2={stemEndY}
                              stroke={chordColor}
                              strokeWidth="1.4"
                            />

                            {/* Single Note Curved Flag (for 8th notes) */}
                            {firstNote.duration <= 0.32 && (
                              <path
                                d={
                                  isStemUp
                                    ? `M ${stemX} ${stemEndY} C ${stemX + 5} ${stemEndY + 6}, ${stemX + 7} ${stemEndY + 12}, ${stemX + 1} ${stemEndY + 18}`
                                    : `M ${stemX} ${stemEndY} C ${stemX - 5} ${stemEndY - 6}, ${stemX - 7} ${stemEndY - 12}, ${stemX - 1} ${stemEndY - 18}`
                                }
                                fill="none"
                                stroke={chordColor}
                                strokeWidth="1.5"
                              />
                            )}

                            {/* Noteheads & Ledger Lines */}
                            {chordNotes.map((note) => {
                              const y = getNoteY(note)
                              const ledgers = getLedgerLines(y, 'right')
                              const hasSharp = note.noteName.includes('#')
                              const hasFlat = note.noteName.includes('b')
                              const showAccidental = (hasSharp || hasFlat) && !isAccidentalCovered(note.noteName)

                              return (
                                <g key={`rh-note-${note.id}`}>
                                  {/* Ledger Lines */}
                                  {ledgers.map((ly, lIdx) => (
                                    <line
                                      key={`rh-leg-${note.id}-${lIdx}`}
                                      x1={noteX - 8.5}
                                      y1={ly}
                                      x2={noteX + 8.5}
                                      y2={ly}
                                      stroke={staveLineColor}
                                      strokeWidth="1.3"
                                    />
                                  ))}

                                  {/* Accidental sharp / flat */}
                                  {showAccidental && (
                                    <text
                                      x={noteX - 10.5}
                                      y={y + 4.5}
                                      fontSize="13"
                                      fontWeight="bold"
                                      fill={chordColor}
                                      fontFamily="serif"
                                      textAnchor="end"
                                    >
                                      {hasSharp ? '♯' : '♭'}
                                    </text>
                                  )}

                                  {/* Pulsing halo around awaited notehead */}
                                  {isExpected && (
                                    <ellipse
                                      cx={noteX}
                                      cy={y}
                                      rx="8"
                                      ry="6"
                                      fill="none"
                                      stroke="#f59e0b"
                                      strokeWidth="2"
                                      opacity="0.8"
                                    />
                                  )}

                                  {/* Tilted Elliptical Notehead (Rotated exactly around cx, cy) */}
                                  <ellipse
                                    cx={noteX}
                                    cy={y}
                                    rx="5.3"
                                    ry="3.8"
                                    transform={`rotate(-20 ${noteX} ${y})`}
                                    fill={chordColor}
                                  />
                                </g>
                              )
                            })}
                          </g>
                        )
                      })}

                      {/* --- NOTES & CHORDS: LEFT HAND (Bass Staff) --- */}
                      {Array.from(leftHandChords.entries()).map(([tKey, chordNotes]) => {
                        const firstNote = chordNotes[0]
                        let noteX: number
                        if (firstNote.beat !== undefined && firstNote.beat >= 1) {
                          const beatRatio = (firstNote.beat - 1) / measureBeats
                          noteX = mStartX + 16 + beatRatio * (measureWidth - 32)
                        } else {
                          const timeRatio = (firstNote.startTime - mStartTime) / mDuration
                          noteX = mStartX + 16 + timeRatio * (measureWidth - 32)
                        }

                        const isExpected =
                          isWaitMode &&
                          expectedNotes.length > 0 &&
                          chordNotes.some((n) => expectedNotes.includes(n.midi)) &&
                          Math.abs(firstNote.startTime - currentTime) < 0.35

                        const isSounding = chordNotes.some(
                          (n) =>
                            (activeNotes && activeNotes.has(n.midi)) ||
                            (currentTime >= n.startTime && currentTime <= n.startTime + n.duration)
                        )

                        const chordColor = isExpected ? '#ea580c' : isSounding ? '#10b981' : inkColor

                        const yPositions = chordNotes.map((n) => getNoteY(n)).sort((a, b) => a - b)
                        const highestY = yPositions[0]
                        const lowestY = yPositions[yPositions.length - 1]

                        const isStemUp = highestY > BASS_TOP_Y + LINE_SPACING * 2
                        const stemX = isStemUp ? noteX + 4.8 : noteX - 4.8
                        const stemStartY = isStemUp ? lowestY : highestY
                        const stemEndY = isStemUp ? highestY - 26 : lowestY + 26

                        return (
                          <g key={`lh-chord-${mNum}-${tKey}`}>
                            {/* Awaited Target Pointer in Wait Mode */}
                            {isExpected && (
                              <g>
                                <polygon
                                  points={`${noteX},${BASS_TOP_Y - 9} ${noteX - 4.5},${BASS_TOP_Y - 17} ${noteX + 4.5},${BASS_TOP_Y - 17}`}
                                  fill="#f59e0b"
                                />
                                <text
                                  x={noteX}
                                  y={BASS_TOP_Y - 19}
                                  fontSize="8.5"
                                  fontWeight="900"
                                  fontFamily="sans-serif"
                                  fill="#f59e0b"
                                  textAnchor="middle"
                                >
                                  WAIT
                                </text>
                              </g>
                            )}

                            {/* Consolidated Musical Stem */}
                            <line
                              x1={stemX}
                              y1={stemStartY}
                              x2={stemX}
                              y2={stemEndY}
                              stroke={chordColor}
                              strokeWidth="1.4"
                            />

                            {/* Noteheads & Ledger Lines */}
                            {chordNotes.map((note) => {
                              const y = getNoteY(note)
                              const ledgers = getLedgerLines(y, 'left')
                              const hasSharp = note.noteName.includes('#')
                              const hasFlat = note.noteName.includes('b')
                              const showAccidental = (hasSharp || hasFlat) && !isAccidentalCovered(note.noteName)

                              return (
                                <g key={`lh-note-${note.id}`}>
                                  {/* Ledger Lines */}
                                  {ledgers.map((ly, lIdx) => (
                                    <line
                                      key={`lh-leg-${note.id}-${lIdx}`}
                                      x1={noteX - 8.5}
                                      y1={ly}
                                      x2={noteX + 8.5}
                                      y2={ly}
                                      stroke={staveLineColor}
                                      strokeWidth="1.3"
                                    />
                                  ))}

                                  {/* Accidental sharp / flat */}
                                  {showAccidental && (
                                    <text
                                      x={noteX - 10.5}
                                      y={y + 4.5}
                                      fontSize="13"
                                      fontWeight="bold"
                                      fill={chordColor}
                                      fontFamily="serif"
                                      textAnchor="end"
                                    >
                                      {hasSharp ? '♯' : '♭'}
                                    </text>
                                  )}

                                  {/* Pulsing halo around awaited notehead */}
                                  {isExpected && (
                                    <ellipse
                                      cx={noteX}
                                      cy={y}
                                      rx="8"
                                      ry="6"
                                      fill="none"
                                      stroke="#f59e0b"
                                      strokeWidth="2"
                                      opacity="0.8"
                                    />
                                  )}

                                  {/* Tilted Elliptical Notehead */}
                                  <ellipse
                                    cx={noteX}
                                    cy={y}
                                    rx="5.3"
                                    ry="3.8"
                                    transform={`rotate(-20 ${noteX} ${y})`}
                                    fill={chordColor}
                                  />
                                </g>
                              )
                            })}
                          </g>
                        )
                      })}

                      {/* --- C. DAMPER PEDAL MARKINGS --- */}
                      {pedalsInMeasure.length > 0 && (
                        <g>
                          <text
                            x={mStartX + 12}
                            y={PEDAL_Y + 11}
                            fontFamily="serif"
                            fontStyle="italic"
                            fontWeight="bold"
                            fontSize="13"
                            fill={dimInkColor}
                          >
                            Ped.
                          </text>
                          <line
                            x1={mStartX + 42}
                            y1={PEDAL_Y + 7}
                            x2={mEndX - 8}
                            y2={PEDAL_Y + 7}
                            stroke={dimInkColor}
                            strokeWidth="1.1"
                          />
                        </g>
                      )}

                      {/* --- D. FLOW MODE REAL-TIME PLAYHEAD SWEEP --- */}
                      {isCurrent && !isWaitMode && sortedNotes.length > 0 && (
                        <g>
                          <line
                            x1={playheadX}
                            y1={TREBLE_TOP_Y - 8}
                            x2={playheadX}
                            y2={BASS_BOTTOM_Y + 12}
                            stroke="#f59e0b"
                            strokeWidth="2.2"
                          />
                          <circle cx={playheadX} cy={TREBLE_TOP_Y - 8} r="3.5" fill="#f59e0b" />
                        </g>
                      )}
                    </g>
                  )
                })}
              </svg>
            </div>
          )
        })}
      </div>
    </div>
  )
}
