import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import type { NoteEvent, Piece, PedalEvent } from '../types/music'
import type { LanguageCode } from '../i18n/translations'
import { X, ChevronLeft, ChevronRight, BookOpen, StretchHorizontal, Sparkles, Moon, Sun } from 'lucide-react'

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

const LETTER_TO_STEP: { [letter: string]: number } = {
  'C': 0,
  'D': 1,
  'E': 2,
  'F': 3,
  'G': 4,
  'A': 5,
  'B': 6,
}

/**
 * Diatonic staff offset mapping:
 * C4 (Middle C) = 0 (on Middle C ledger line)
 * E4 (Line 1 of Treble) = 2
 * G4 (Line 2 of Treble) = 4
 * B4 (Line 3 of Treble) = 6
 * D5 (Line 4 of Treble) = 8
 * F5 (Line 5 of Treble) = 10
 * A3 (Line 5 of Bass) = -2
 * F3 (Line 4 of Bass) = -4
 * D3 (Line 3 of Bass) = -6
 * B2 (Line 2 of Bass) = -8
 * G2 (Line 1 of Bass) = -10
 */
function noteToDiatonicOffset(noteName: string, midi: number): number {
  const match = noteName.match(/^([A-Ga-g])([#b]?)(-?\d+)$/)
  if (match) {
    const letter = match[1].toUpperCase()
    const octave = parseInt(match[3], 10)
    const stepInOctave = LETTER_TO_STEP[letter] ?? 0
    return (octave - 4) * 7 + stepInOctave
  }
  const octave = Math.floor(midi / 12) - 1
  const pitchClass = midi % 12
  const fallbackSteps = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 6, 6]
  return (octave - 4) * 7 + fallbackSteps[pitchClass]
}

export const SheetMusicView: React.FC<SheetMusicViewProps> = ({
  piece,
  currentTime,
  activeNotes,
  expectedNotes = [],
  isWaitMode = false,
  playMode: _playMode = 'practice',
  handMode: _handMode = 'both',
  isPlaying: _isPlaying = false,
  onSeek,
  isLooping = false,
  loopRange = [1, 4],
  onLoopRangeChange,
  onToggleLoop,
  language: _language = 'de',
  showFingering: _showFingering = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pageContainerRef = useRef<HTMLDivElement>(null)

  // Layout mode: 'page' (Vollständiges Notenblatt) vs 'strip' (Horizontaler Notenwurm)
  // Default is 'page' as requested by the user
  const [layoutMode, setLayoutMode] = useState<'page' | 'strip'>('page')
  const [containerWidth, setContainerWidth] = useState<number>(800)

  // Score theme: 'ivory' (Henle Urtext) vs 'dark' (OLED Night Score)
  const [scoreTheme, setScoreTheme] = useState<'ivory' | 'dark'>(() => {
    return (localStorage.getItem('virtuoso_score_theme') as 'ivory' | 'dark') || 'ivory'
  })

  const toggleScoreTheme = useCallback(() => {
    setScoreTheme((prev) => {
      const next = prev === 'ivory' ? 'dark' : 'ivory'
      localStorage.setItem('virtuoso_score_theme', next)
      return next
    })
  }, [])

  const isDark = scoreTheme === 'dark'
  const inkColor = isDark ? '#f4f4f5' : '#1a1a1a'
  const staveLineColor = isDark ? '#4b4b58' : '#2a2a2a'
  const barlineColor = isDark ? '#52525b' : '#1a1a1a'
  const pedalColor = isDark ? '#a1a1aa' : '#57534e'

  // Track container width to dynamically optimize measures per system
  useEffect(() => {
    const updateWidth = () => {
      if (pageContainerRef.current) {
        setContainerWidth(pageContainerRef.current.clientWidth)
      } else if (scrollContainerRef.current) {
        setContainerWidth(scrollContainerRef.current.clientWidth)
      } else if (typeof window !== 'undefined') {
        setContainerWidth(window.innerWidth)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Calculate optimal measures per system based on screen width
  const measuresPerSystem = useMemo(() => {
    if (containerWidth >= 1100) return 4
    if (containerWidth >= 680) return 3
    return 2 // Mobile portrait: 2 measures per system for maximum readability
  }, [containerWidth])

  // Group notes by measure
  const measuresMap = useMemo(() => {
    const map = new Map<number, NoteEvent[]>()
    piece.notes.forEach((note) => {
      const m = Math.max(1, note.measure)
      if (!map.has(m)) {
        map.set(m, [])
      }
      map.get(m)!.push(note)
    })
    return map
  }, [piece.notes])

  // Group pedals by measure
  const pedalsMap = useMemo(() => {
    const map = new Map<number, PedalEvent[]>()
    piece.pedalEvents.forEach((pedal) => {
      const m = Math.max(1, pedal.measure || 1)
      if (!map.has(m)) {
        map.set(m, [])
      }
      map.get(m)!.push(pedal)
    })
    return map
  }, [piece.pedalEvents])

  const measureNumbers = useMemo(() => {
    const nums = Array.from(measuresMap.keys()).sort((a, b) => a - b)
    if (nums.length === 0) return [1]
    const maxMeasure = Math.max(...nums)
    const all: number[] = []
    for (let i = 1; i <= maxMeasure; i++) {
      all.push(i)
    }
    return all
  }, [measuresMap])

  // Precomputed measure data cache
  const measureDataMap = useMemo(() => {
    const map = new Map<
      number,
      {
        sortedNotes: NoteEvent[]
        pedalsInMeasure: PedalEvent[]
        mStartTime: number
        mDuration: number
        measureBeats: number
        dynamicMeasureWidth: number
      }
    >()
    const defaultBeatsInMeasure = piece.timeSignature ? piece.timeSignature[0] : 4

    measureNumbers.forEach((mNum) => {
      const notesInMeasure = measuresMap.get(mNum) || []
      const pedalsInMeasure = pedalsMap.get(mNum) || []
      const sortedNotes = [...notesInMeasure].sort((a, b) => a.startTime - b.startTime || a.midi - b.midi)
      const mStartTime = sortedNotes[0]?.startTime ?? (mNum - 1) * 2.0
      const mEndTime = sortedNotes[sortedNotes.length - 1]?.startTime
        ? sortedNotes[sortedNotes.length - 1].startTime + (sortedNotes[sortedNotes.length - 1].duration || 0.4)
        : mStartTime + 2.0
      const mDuration = Math.max(0.6, mEndTime - mStartTime)
      const measureBeats = piece.id === 'chopin-ballade-1' && mNum >= 8 && mNum <= 207 ? 6 : defaultBeatsInMeasure
      const dynamicMeasureWidth = Math.max(220, Math.min(380, 70 + sortedNotes.length * 16))

      map.set(mNum, {
        sortedNotes,
        pedalsInMeasure,
        mStartTime,
        mDuration,
        measureBeats,
        dynamicMeasureWidth,
      })
    })
    return map
  }, [measureNumbers, measuresMap, pedalsMap, piece.id, piece.timeSignature])

  // Current active measure
  const currentMeasure = useMemo(() => {
    for (let i = piece.notes.length - 1; i >= 0; i--) {
      if (currentTime >= piece.notes[i].startTime) {
        return Math.max(1, piece.notes[i].measure)
      }
    }
    return measureNumbers[0] || 1
  }, [currentTime, piece.notes, measureNumbers])

  // Systems division for Page Mode ("Vollständiges Notenblatt")
  const systems = useMemo(() => {
    const sysList: { systemIndex: number; measures: number[] }[] = []
    for (let i = 0; i < measureNumbers.length; i += measuresPerSystem) {
      sysList.push({
        systemIndex: Math.floor(i / measuresPerSystem),
        measures: measureNumbers.slice(i, i + measuresPerSystem),
      })
    }
    return sysList
  }, [measureNumbers, measuresPerSystem])

  // Current active system
  const currentSystemIndex = useMemo(() => {
    return Math.max(0, Math.floor((currentMeasure - 1) / measuresPerSystem))
  }, [currentMeasure, measuresPerSystem])

  // Smooth auto-scroll in Page Mode (vertical scroll to active system)
  useEffect(() => {
    if (layoutMode !== 'page' || !pageContainerRef.current) return
    const activeSystemEl = pageContainerRef.current.querySelector<HTMLElement>(
      `[data-system="${currentSystemIndex}"]`
    )
    if (activeSystemEl) {
      const container = pageContainerRef.current
      const targetTop = activeSystemEl.offsetTop - container.clientHeight * 0.25
      container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
    }
  }, [currentSystemIndex, layoutMode])

  // Smooth auto-scroll in Strip Mode (horizontal scroll to active measure)
  useEffect(() => {
    if (layoutMode !== 'strip' || !scrollContainerRef.current) return
    const activeEl = scrollContainerRef.current.querySelector<HTMLElement>(`[data-measure="${currentMeasure}"]`)
    if (activeEl) {
      const container = scrollContainerRef.current
      const targetLeft = activeEl.offsetLeft - container.clientWidth / 2 + activeEl.clientWidth / 2
      container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })
    }
  }, [currentMeasure, layoutMode])

  // Precise Standard Notation Dimensions
  const lineSpacing = 8.5
  const staffHeight = lineSpacing * 4 // 34px
  const trebleTopY = 48 // Line 5 (F5) - ample headroom for ledger lines
  const trebleBottomY = trebleTopY + staffHeight // 82px: Line 1 (E4)
  const middleCY = trebleBottomY + lineSpacing // 90.5px: Middle C4 Ledger line
  const bassTopY = middleCY + lineSpacing // 99px: Line 5 (A3) of Bass
  const bassBottomY = bassTopY + staffHeight // 133px: Line 1 (G2) of Bass
  const pedalLineY = bassBottomY + 24
  const totalSvgHeight = pedalLineY + 22 // 179px per grand staff system

  const getYForNote = (note: NoteEvent): number => {
    const stepFromC4 = noteToDiatonicOffset(note.noteName, note.midi)
    return middleCY - stepFromC4 * (lineSpacing / 2)
  }

  // Key signature determination
  const keyFlatsCount = useMemo(() => {
    const k = (piece.key || '').toLowerCase()
    if (k.includes('db maj') || k.includes('bb min')) return 5
    if (k.includes('ab maj') || k.includes('f min')) return 4
    if (k.includes('eb maj') || k.includes('c min')) return 3
    if (k.includes('bb maj') || k.includes('g min')) return 2
    if (k.includes('f maj') || k.includes('d min')) return 1
    return 0
  }, [piece.key])

  const keySharpsCount = useMemo(() => {
    const k = (piece.key || '').toLowerCase()
    if (k.includes('b maj') || k.includes('g# min')) return 5
    if (k.includes('e maj') || k.includes('c# min')) return 4
    if (k.includes('a maj') || k.includes('f# min')) return 3
    if (k.includes('d maj') || k.includes('b min')) return 2
    if (k.includes('g maj') || k.includes('e min')) return 1
    return 0
  }, [piece.key])

  const isNoteCoveredByKeySignature = useCallback(
    (noteName: string): boolean => {
      const root = noteName.charAt(0).toUpperCase()
      if (noteName.includes('#')) {
        const sharpsInKey = ['F', 'C', 'G', 'D', 'A', 'E', 'B'].slice(0, keySharpsCount)
        return sharpsInKey.includes(root)
      }
      if (noteName.includes('b')) {
        const flatsInKey = ['B', 'E', 'A', 'D', 'G', 'C', 'F'].slice(0, keyFlatsCount)
        return flatsInKey.includes(root)
      }
      return false
    },
    [keySharpsCount, keyFlatsCount]
  )

  const calculateLedgerLines = (y: number): number[] => {
    const lines: number[] = []
    if (Math.abs(y - middleCY) < 3.5) {
      lines.push(middleCY)
      return lines
    }
    if (y < trebleTopY - 2) {
      for (let ly = trebleTopY - lineSpacing; ly >= y - 3; ly -= lineSpacing) {
        lines.push(ly)
      }
    }
    if (y > bassBottomY + 2) {
      for (let ly = bassBottomY + lineSpacing; ly <= y + 3; ly += lineSpacing) {
        lines.push(ly)
      }
    }
    return lines
  }

  // Render authentic Grand Staff Accolade / Clef / Key Block (Left of each system)
  const renderClefBlock = (isFirstSystem: boolean = false) => {
    const width = isFirstSystem ? 86 : 74
    return (
      <div className="flex-shrink-0 relative select-none" style={{ width, height: totalSvgHeight }}>
        <svg className="w-full h-full pointer-events-none">
          {/* Grand Staff Curly Brace */}
          <path
            d={`M 14 ${trebleTopY} C 4 ${trebleTopY + 16}, 4 ${middleCY - 10}, 0 ${middleCY} C 4 ${middleCY + 10}, 4 ${bassBottomY - 16}, 14 ${bassBottomY}`}
            fill="none"
            stroke={inkColor}
            strokeWidth="2.4"
          />
          <line x1="16" y1={trebleTopY} x2="16" y2={bassBottomY} stroke={inkColor} strokeWidth="1.5" />

          {/* Treble Stave Lines (5 lines) */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`cb-t-${i}`}
              x1="16"
              y1={trebleTopY + i * lineSpacing}
              x2={width}
              y2={trebleTopY + i * lineSpacing}
              stroke={staveLineColor}
              strokeWidth="1.2"
            />
          ))}

          {/* Bass Stave Lines (5 lines) */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`cb-b-${i}`}
              x1="16"
              y1={bassTopY + i * lineSpacing}
              x2={width}
              y2={bassTopY + i * lineSpacing}
              stroke={staveLineColor}
              strokeWidth="1.2"
            />
          ))}

          {/* Treble Clef (𝄞) */}
          <text
            x="20"
            y={trebleBottomY - lineSpacing * 0.3}
            fontSize="36"
            fill={inkColor}
            fontFamily="serif"
            textAnchor="start"
          >
            𝄞
          </text>

          {/* Bass Clef (𝄢) */}
          <text
            x="22"
            y={bassTopY + lineSpacing * 2.8}
            fontSize="30"
            fill={inkColor}
            fontFamily="serif"
            textAnchor="start"
          >
            𝄢
          </text>

          {/* Key Signature (Flats) */}
          {keyFlatsCount > 0 && (
            <g>
              {keyFlatsCount >= 1 && (
                <>
                  <text x="46" y={trebleTopY + lineSpacing * 2 + 4.5} fontSize="13" fill={inkColor} fontFamily="serif">♭</text>
                  <text x="46" y={bassTopY + lineSpacing * 3 + 4.5} fontSize="13" fill={inkColor} fontFamily="serif">♭</text>
                </>
              )}
              {keyFlatsCount >= 2 && (
                <>
                  <text x="53" y={trebleTopY + lineSpacing * 0.5 + 4.5} fontSize="13" fill={inkColor} fontFamily="serif">♭</text>
                  <text x="53" y={bassTopY + lineSpacing * 1.5 + 4.5} fontSize="13" fill={inkColor} fontFamily="serif">♭</text>
                </>
              )}
              {keyFlatsCount >= 3 && (
                <>
                  <text x="60" y={trebleTopY + lineSpacing * 2.5 + 4.5} fontSize="13" fill={inkColor} fontFamily="serif">♭</text>
                  <text x="60" y={bassTopY + lineSpacing * 3.5 + 4.5} fontSize="13" fill={inkColor} fontFamily="serif">♭</text>
                </>
              )}
            </g>
          )}

          {/* Key Signature (Sharps) */}
          {keySharpsCount > 0 && (
            <g>
              {keySharpsCount >= 1 && (
                <>
                  <text x="46" y={trebleTopY + 4} fontSize="12" fill={inkColor} fontFamily="serif">♯</text>
                  <text x="46" y={bassTopY + lineSpacing * 1 + 4} fontSize="12" fill={inkColor} fontFamily="serif">♯</text>
                </>
              )}
              {keySharpsCount >= 2 && (
                <>
                  <text x="53" y={trebleTopY + lineSpacing * 1.5 + 4} fontSize="12" fill={inkColor} fontFamily="serif">♯</text>
                  <text x="53" y={bassTopY + lineSpacing * 2.5 + 4} fontSize="12" fill={inkColor} fontFamily="serif">♯</text>
                </>
              )}
            </g>
          )}

          {/* Time Signature (on first system only) */}
          {isFirstSystem && (
            <g>
              <text
                x="72"
                y={trebleTopY + lineSpacing * 1.7}
                fontSize="15"
                fontWeight="bold"
                fill={inkColor}
                fontFamily="serif"
                textAnchor="middle"
              >
                {piece.timeSignature ? piece.timeSignature[0] : 4}
              </text>
              <text
                x="72"
                y={trebleTopY + lineSpacing * 3.7}
                fontSize="15"
                fontWeight="bold"
                fill={inkColor}
                fontFamily="serif"
                textAnchor="middle"
              >
                {piece.timeSignature ? piece.timeSignature[1] : 4}
              </text>
              <text
                x="72"
                y={bassTopY + lineSpacing * 1.7}
                fontSize="15"
                fontWeight="bold"
                fill={inkColor}
                fontFamily="serif"
                textAnchor="middle"
              >
                {piece.timeSignature ? piece.timeSignature[0] : 4}
              </text>
              <text
                x="72"
                y={bassTopY + lineSpacing * 3.7}
                fontSize="15"
                fontWeight="bold"
                fill={inkColor}
                fontFamily="serif"
                textAnchor="middle"
              >
                {piece.timeSignature ? piece.timeSignature[1] : 4}
              </text>
            </g>
          )}
        </svg>
      </div>
    )
  }

  // Render individual Measure Cell
  const renderMeasure = (mNum: number, measureWidthStyle?: string | number, isFixedPx: boolean = false) => {
    const mData = measureDataMap.get(mNum)
    if (!mData) return null

    const { sortedNotes, pedalsInMeasure, mStartTime, mDuration, measureBeats, dynamicMeasureWidth } = mData
    const isCurrent = mNum === currentMeasure
    const isInLoop = isLooping && mNum >= loopRange[0] && mNum <= loopRange[1]
    const isLoopStart = isLooping && mNum === loopRange[0]
    const isLoopEnd = isLooping && mNum === loopRange[1]
    const isLastMeasure = mNum === measureNumbers[measureNumbers.length - 1]

    // Calculate playhead position ratio inside this measure (0.0 to 1.0)
    const playheadRatio = Math.max(0, Math.min(1, (currentTime - mStartTime) / mDuration))

    return (
      <div
        key={`measure-${mNum}`}
        data-measure={mNum}
        onClick={() => {
          if (sortedNotes[0]) {
            onSeek(sortedNotes[0].startTime)
          }
        }}
        className={`relative cursor-pointer transition-colors duration-150 ${
          isCurrent
            ? isWaitMode
              ? isDark
                ? 'bg-amber-500/25 ring-2 ring-amber-400/80 shadow-md'
                : 'bg-amber-100/60 ring-2 ring-amber-400/70 shadow-sm'
              : isDark
              ? 'bg-amber-500/15 ring-1 ring-amber-400/50'
              : 'bg-amber-50/70 ring-1 ring-amber-400/50'
            : isInLoop
            ? isDark
              ? 'bg-blue-500/20 ring-1 ring-blue-400/60'
              : 'bg-blue-50/60 ring-1 ring-blue-300/60'
            : isDark
            ? 'hover:bg-zinc-800/40'
            : 'hover:bg-stone-100/50'
        } ${isFixedPx ? 'flex-shrink-0' : 'flex-1 min-w-0'}`}
        style={{
          width: isFixedPx ? dynamicMeasureWidth : measureWidthStyle || '100%',
          height: totalSvgHeight,
        }}
      >
        {/* Measure Number Badge */}
        <div className="absolute top-1 left-2 font-mono text-[10px] font-bold text-stone-500 pointer-events-none select-none z-10">
          {mNum}
        </div>

        {/* Loop Region Box & Handles */}
        {isInLoop && (
          <div className="absolute inset-0 border-y-2 border-blue-400/60 bg-blue-500/10 pointer-events-none z-10">
            {isLoopStart && (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  if (onLoopRangeChange && loopRange[0] > 1) {
                    onLoopRangeChange([loopRange[0] - 1, loopRange[1]])
                  }
                }}
                className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-8 rounded bg-stone-800 text-white flex items-center justify-center font-bold text-xs shadow-md pointer-events-auto cursor-pointer"
                title="Adjust loop start"
              >
                <ChevronLeft className="w-3 h-3" />
              </div>
            )}
            {isLoopStart && onToggleLoop && (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleLoop()
                }}
                className="absolute left-2 -top-2 w-4 h-4 rounded-full bg-stone-800 text-white flex items-center justify-center font-bold text-[9px] shadow pointer-events-auto cursor-pointer"
                title="Clear loop"
              >
                <X className="w-2.5 h-2.5" />
              </div>
            )}
            {isLoopEnd && (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  if (onLoopRangeChange) {
                    onLoopRangeChange([loopRange[0], loopRange[1] + 1])
                  }
                }}
                className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-8 rounded bg-stone-800 text-white flex items-center justify-center font-bold text-xs shadow-md pointer-events-auto cursor-pointer"
                title="Adjust loop end"
              >
                <ChevronRight className="w-3 h-3" />
              </div>
            )}
          </div>
        )}

        {/* FLOW PLAYHEAD CURSOR (Flow Mode active sweep) */}
        {isCurrent && sortedNotes.length > 0 && !isWaitMode && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500 via-amber-400 to-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.9)] z-20 pointer-events-none transition-all duration-75"
            style={{
              left: `${Math.max(6, Math.min(94, playheadRatio * 100))}%`,
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 -ml-1 -top-1 absolute shadow-sm" />
          </div>
        )}

        {/* WAIT MODE GLOWING TARGET POINTER (Pointee above awaited notes) */}
        {isCurrent && isWaitMode && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,1)] z-20 pointer-events-none animate-pulse"
            style={{
              left: `${Math.max(6, Math.min(94, playheadRatio * 100))}%`,
            }}
          >
            <div className="absolute -top-3 -ml-2 w-4 h-4 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-[9px] shadow-lg animate-bounce">
              ▼
            </div>
          </div>
        )}

        <svg className="w-full h-full pointer-events-none" preserveAspectRatio="none">
          <defs>
            <filter id={`glow-amber-${mNum}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Measure Bar Line (Right edge) */}
          {isLastMeasure ? (
            /* Urtext Final Double Bar Line (thin + thick) */
            <g>
              <line x1="96%" y1={trebleTopY} x2="96%" y2={bassBottomY} stroke={barlineColor} strokeWidth="1.2" />
              <line x1="99%" y1={trebleTopY} x2="99%" y2={bassBottomY} stroke={barlineColor} strokeWidth="3.2" />
            </g>
          ) : (
            <line x1="100%" y1={trebleTopY} x2="100%" y2={bassBottomY} stroke={barlineColor} strokeWidth="1.3" />
          )}

          {/* Treble Stave Lines (5 lines) */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`m${mNum}-t-${i}`}
              x1="0%"
              y1={trebleTopY + i * lineSpacing}
              x2="100%"
              y2={trebleTopY + i * lineSpacing}
              stroke={staveLineColor}
              strokeWidth="1.2"
            />
          ))}

          {/* Bass Stave Lines (5 lines) */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`m${mNum}-b-${i}`}
              x1="0%"
              y1={bassTopY + i * lineSpacing}
              x2="100%"
              y2={bassTopY + i * lineSpacing}
              stroke={staveLineColor}
              strokeWidth="1.2"
            />
          ))}

          {/* Dynamic Marking (Urtext expression between Treble and Bass staves) */}
          {(() => {
            const avgVel =
              sortedNotes.length > 0
                ? sortedNotes.reduce((sum, n) => sum + (n.velocity || 75), 0) / sortedNotes.length
                : 0
            const dyn =
              avgVel >= 105 ? 'ff' : avgVel >= 92 ? 'f' : avgVel >= 78 ? 'mf' : avgVel >= 64 ? 'mp' : avgVel >= 48 ? 'p' : avgVel > 0 ? 'pp' : null
            if (!dyn) return null
            return (
              <text
                x="8%"
                y={middleCY + 3.5}
                fontSize="12"
                fontFamily="serif"
                fontStyle="italic"
                fontWeight="bold"
                fill={isDark ? '#fbbf24' : '#854d0e'}
                textAnchor="start"
                className="select-none pointer-events-none"
              >
                {dyn}
              </text>
            )
          })()}

          {/* Notes in Measure */}
          {sortedNotes.map((note) => {
            // Compute percentage X coordinate within measure width
            let xPercent: number
            if (note.beat !== undefined && note.beat >= 1) {
              const beatRatio = (note.beat - 1) / measureBeats
              xPercent = 12 + beatRatio * 76
            } else {
              const noteOffsetInMeasure = (note.startTime - mStartTime) / mDuration
              xPercent = 14 + noteOffsetInMeasure * 72
            }

            const y = getYForNote(note)

            // Status: Is note actively awaited in Wait Mode?
            const isExpectedInWait =
              isWaitMode &&
              expectedNotes.length > 0 &&
              expectedNotes.includes(note.midi) &&
              Math.abs(note.startTime - currentTime) < 0.25

            // Status: Is note currently sounding / pressed?
            const isSounding =
              (activeNotes && activeNotes.has(note.midi)) ||
              (currentTime >= note.startTime && currentTime <= note.startTime + note.duration)

            const isTreble = y < middleCY + 4
            const staffCenterY = isTreble ? trebleTopY + lineSpacing * 2 : bassTopY + lineSpacing * 2
            const isStemUp = y > staffCenterY
            const stemHeight = 25
            const stemEndY = isStemUp ? y - stemHeight : y + stemHeight

            const ledgerYList = calculateLedgerLines(y)

            // Note Coloration:
            // Awaited note in Wait Mode: Radiant Amber (#ea580c)
            // Actively sounding note: Emerald Green (#16a34a)
            // Regular Urtext score note: inkColor
            const noteColor = isExpectedInWait ? '#ea580c' : isSounding ? '#16a34a' : inkColor

            const hasSharp = note.noteName.includes('#')
            const hasFlat = note.noteName.includes('b')
            const isCovered = isNoteCoveredByKeySignature(note.noteName)
            const showSharpSymbol = hasSharp && !isCovered
            const showFlatSymbol = hasFlat && !isCovered

            return (
              <g key={note.id}>
                {/* Ledger Lines */}
                {ledgerYList.map((ly, lIdx) => (
                  <line
                    key={`leg-${note.id}-${lIdx}`}
                    x1={`${xPercent - 3}%`}
                    y1={ly}
                    x2={`${xPercent + 3}%`}
                    y2={ly}
                    stroke={inkColor}
                    strokeWidth="1.4"
                  />
                ))}

                {/* Accidental sharp / flat */}
                {showSharpSymbol && (
                  <text
                    x={`${xPercent - 3.8}%`}
                    y={y + 4.5}
                    fontSize="13"
                    fontWeight="bold"
                    fill={noteColor}
                    fontFamily="serif"
                    textAnchor="end"
                  >
                    ♯
                  </text>
                )}
                {showFlatSymbol && (
                  <text
                    x={`${xPercent - 3.5}%`}
                    y={y + 3.5}
                    fontSize="13"
                    fontWeight="bold"
                    fill={noteColor}
                    fontFamily="serif"
                    textAnchor="end"
                  >
                    ♭
                  </text>
                )}

                {/* Pulsing halo ring around awaited note in Wait Mode */}
                {isExpectedInWait && (
                  <ellipse
                    cx={`${xPercent}%`}
                    cy={y}
                    rx="8"
                    ry="6"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    className="animate-ping opacity-75"
                  />
                )}

                {/* Note Head */}
                <ellipse
                  cx={`${xPercent}%`}
                  cy={y}
                  rx={isExpectedInWait ? '6.4' : '5.4'}
                  ry={isExpectedInWait ? '4.8' : '3.8'}
                  transform={`rotate(-20)`}
                  fill={noteColor}
                  filter={isExpectedInWait ? `url(#glow-amber-${mNum})` : undefined}
                />

                {/* Musical Stem */}
                <line
                  x1={`${xPercent + (isStemUp ? 1.5 : -1.5)}%`}
                  y1={y}
                  x2={`${xPercent + (isStemUp ? 1.5 : -1.5)}%`}
                  y2={stemEndY}
                  stroke={noteColor}
                  strokeWidth="1.4"
                />

                {/* Eighth/Sixteenth note flag */}
                {note.duration <= 0.35 && (
                  <path
                    d={
                      isStemUp
                        ? `M ${stemEndY} Q ${stemEndY + 8}, ${stemEndY + 14}`
                        : `M ${stemEndY} Q ${stemEndY - 8}, ${stemEndY - 14}`
                    }
                    fill="none"
                    stroke={noteColor}
                    strokeWidth="1.6"
                  />
                )}
              </g>
            )
          })}

          {/* Damper Pedal Marking */}
          {pedalsInMeasure.map((_, pIdx) => (
            <g key={`ped-${mNum}-${pIdx}`}>
              <text
                x="8%"
                y={pedalLineY + 2}
                fontSize="11"
                fontFamily="serif"
                fontStyle="italic"
                fontWeight="bold"
                fill={pedalColor}
              >
                Ped.
              </text>
              <line x1="28%" y1={pedalLineY} x2="92%" y2={pedalLineY} stroke={pedalColor} strokeWidth="1.3" />
              <line x1="92%" y1={pedalLineY} x2="92%" y2={pedalLineY - 5} stroke={pedalColor} strokeWidth="1.3" />
            </g>
          ))}
        </svg>
      </div>
    )
  }

  return (
    <div className={`w-full h-full ${isDark ? 'bg-[#0e0e12]' : 'bg-[#fcfaf6]'} flex flex-col select-none overflow-hidden relative border-t ${isDark ? 'border-zinc-800' : 'border-stone-200'}`}>
      {/* SCORE MASTHEAD HEADER */}
      <div className={`px-4 py-2 border-b ${isDark ? 'bg-[#141419] border-zinc-800' : 'bg-[#f9f6f0] border-stone-200/80'} flex items-center justify-between flex-shrink-0 z-10 shadow-xs`}>
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h2 className={`${isDark ? 'text-zinc-100' : 'text-stone-900'} font-serif font-bold text-sm sm:text-base leading-tight tracking-wide flex items-center gap-2`}>
              <span>{piece.title}</span>
              {isWaitMode && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-sans font-bold px-2 py-0.5 rounded-full border ${isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-500/15 text-amber-800 border-amber-300'}`}>
                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                  Wartemodus
                </span>
              )}
            </h2>
            <p className={`${isDark ? 'text-zinc-400' : 'text-stone-600'} text-xs font-serif italic`}>
              {piece.composer} • {piece.key || 'Original Tonart'} •{' '}
              {piece.timeSignature ? `${piece.timeSignature[0]}/${piece.timeSignature[1]}` : '4/4'}
            </p>
          </div>
        </div>

        {/* CONTROLS (Theme Switcher + View Mode Toggle) */}
        <div className="flex items-center gap-2">
          {/* OLED Dark / Ivory Urtext Toggle */}
          <button
            onClick={toggleScoreTheme}
            className={`p-1.5 rounded-lg border transition-all ${
              isDark
                ? 'bg-zinc-800 text-amber-400 border-zinc-700 hover:bg-zinc-750'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50 shadow-sm'
            }`}
            title={isDark ? 'Helles Notenblatt (Henle Urtext)' : 'Dunkles Notenblatt (OLED Nachtmodus)'}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* VIEW MODE TOGGLE (Vollständiges Notenblatt vs Horizontaler Notenband) */}
          <div className={`flex items-center gap-1 p-0.5 rounded-lg border shadow-inner ${isDark ? 'bg-zinc-800/90 border-zinc-700' : 'bg-stone-200/80 border-stone-300/60'}`}>
            <button
              onClick={() => setLayoutMode('page')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                layoutMode === 'page'
                  ? isDark ? 'bg-zinc-700 text-white shadow-sm' : 'bg-white text-stone-900 shadow-sm'
                  : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Vollständiges Notenblatt (Henle Urtext Seitenansicht)"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Notenblatt</span>
            </button>
            <button
              onClick={() => setLayoutMode('strip')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                layoutMode === 'strip'
                  ? isDark ? 'bg-zinc-700 text-white shadow-sm' : 'bg-white text-stone-900 shadow-sm'
                  : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Horizontaler Notenfluss (Fortlaufendes Band)"
            >
              <StretchHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Notenband</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. VOLLSTÄNDIGES NOTENBLATT: MULTI-SYSTEM ENGRAVED SCORE PAGE VIEW */}
      {layoutMode === 'page' && (
        <div
          ref={pageContainerRef}
          className={`flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 space-y-6 scroll-smooth ${isDark ? 'bg-[#0e0e12]' : 'bg-[#fcfaf6]'}`}
        >
          {systems.map((sys) => {
            const isFirstSystem = sys.systemIndex === 0
            const isSystemActive = sys.systemIndex === currentSystemIndex

            return (
              <div
                key={`system-${sys.systemIndex}`}
                data-system={sys.systemIndex}
                className={`w-full flex items-center transition-all duration-200 rounded-xl p-1 ${
                  isSystemActive
                    ? isDark ? 'ring-2 ring-amber-400/80 bg-amber-500/[0.08] shadow-lg' : 'ring-2 ring-amber-400/80 bg-amber-500/[0.04] shadow-md'
                    : isDark ? 'hover:bg-zinc-800/20' : 'hover:bg-stone-100/30'
                }`}
                style={{ height: totalSvgHeight + 8 }}
              >
                {/* Grand Staff Clef Block for each system */}
                {renderClefBlock(isFirstSystem)}

                {/* Measures in this system row (spanning full width) */}
                <div className="flex-1 flex items-center h-full">
                  {sys.measures.map((mNum) => renderMeasure(mNum))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 2. HORIZONTALER NOTENWURM: CONTINUOUS HORIZONTAL SCROLL STRIP */}
      {layoutMode === 'strip' && (
        <div
          ref={scrollContainerRef}
          className={`flex-1 flex overflow-x-auto overflow-y-hidden px-4 py-2 scroll-smooth items-center scrollbar-none ${isDark ? 'bg-[#0e0e12]' : 'bg-[#fcfaf6]'}`}
        >
          {/* Clefs, Key Signature (Fixed on Left) */}
          {renderClefBlock(true)}

          {/* Continuous Measures */}
          {measureNumbers.map((mNum) => renderMeasure(mNum, undefined, true))}
        </div>
      )}
    </div>
  )
}
