import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import type { NoteEvent, Piece, PedalEvent } from '../types/music'
import type { LanguageCode } from '../i18n/translations'
import { Moon, Sun, RotateCcw, Layers, Hash } from 'lucide-react'

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
  startMeasure?: number
  onStartMeasureChange?: (measure: number) => void
  onLoopRangeChange?: (range: [number, number]) => void
  onToggleLoop?: () => void
  onOpenSections?: () => void
  language?: LanguageCode
  showFingering?: boolean
}

type ClefType = 'treble' | 'bass'

interface RhythmShape {
  kind: 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | 'thirty-second'
  hollow: boolean
  hasStem: boolean
  dots: number
  beams: number // 0 = quarter/half/whole, 1 = 8th, 2 = 16th, 3 = 32nd
  beats: number
}

interface PositionedNote {
  note: NoteEvent
  step: number
  y: number
  xOffset: number
  accidental: '♯' | '♭' | '♮' | null
  accidentalXOffset: number
  rhythm: RhythmShape
}

interface VoiceCluster {
  colIndex: number
  tKey: number
  startTime: number
  beat: number
  x: number
  voice: 1 | 2
  hand: 'right' | 'left'
  clef: ClefType
  notes: PositionedNote[]
  rhythm: RhythmShape
  isStemUp: boolean
  stemX: number
  stemStartY: number
  stemEndY: number
  highestY: number
  lowestY: number
  isTriplet: boolean
  isExpected: boolean
  isSounding: boolean
  color: string
}

interface BeamGroup {
  clusters: VoiceCluster[]
  isStemUp: boolean
  maxBeams: number
  isTriplet: boolean
  yStart: number
  yEnd: number
  color: string
}

interface MeasureRest {
  beat: number
  durationBeats: number
  kind: 'whole' | 'half' | 'quarter' | 'eighth'
  x: number
  hand: 'right' | 'left'
}

// Diatonic step calculation relative to C4 (Middle C = 0)
const PITCH_STEP_MAP: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
}

function parseNotePitch(noteName: string, midi: number): {
  letter: string
  accidental: '#' | 'b' | ''
  octave: number
  step: number
} {
  const match = noteName?.match(/^([A-Ga-g])([#b]?)(-?\d+)$/)
  if (match) {
    const letter = match[1].toUpperCase()
    const accidental = (match[2] || '') as '#' | 'b' | ''
    const octave = parseInt(match[3], 10)
    const step = (octave - 4) * 7 + (PITCH_STEP_MAP[letter] ?? 0)
    return { letter, accidental, octave, step }
  }
  const octave = Math.floor(midi / 12) - 1
  const pc = ((midi % 12) + 12) % 12
  const fallbackLetters = ['C', 'C', 'D', 'E', 'E', 'F', 'F', 'G', 'A', 'A', 'B', 'B']
  const fallbackAcc: ('#' | 'b' | '')[] = ['', '#', '', 'b', '', '', '#', '', 'b', '', 'b', '']
  const letter = fallbackLetters[pc]
  const step = (octave - 4) * 7 + (PITCH_STEP_MAP[letter] ?? 0)
  return { letter, accidental: fallbackAcc[pc], octave, step }
}

/**
 * Classify a rhythmic duration in quarter-note beats into textbook musical notation.
 * Supports whole, dotted half, half, dotted quarter, quarter, dotted 8th, 8th, 16th, 32nd.
 */
function classifyRhythm(beatsRaw: number): RhythmShape {
  const b = Math.max(0.08, beatsRaw)
  if (b >= 5.25) {
    return { kind: 'whole', hollow: true, hasStem: false, dots: 1, beams: 0, beats: 6 }
  }
  if (b >= 3.55) {
    return { kind: 'whole', hollow: true, hasStem: false, dots: 0, beams: 0, beats: 4 }
  }
  if (b >= 2.65) {
    return { kind: 'half', hollow: true, hasStem: true, dots: 1, beams: 0, beats: 3 }
  }
  if (b >= 1.72) {
    return { kind: 'half', hollow: true, hasStem: true, dots: 0, beams: 0, beats: 2 }
  }
  if (b >= 1.28) {
    return { kind: 'quarter', hollow: false, hasStem: true, dots: 1, beams: 0, beats: 1.5 }
  }
  if (b >= 0.84) {
    return { kind: 'quarter', hollow: false, hasStem: true, dots: 0, beams: 0, beats: 1 }
  }
  if (b >= 0.64) {
    return { kind: 'eighth', hollow: false, hasStem: true, dots: 1, beams: 1, beats: 0.75 }
  }
  if (b >= 0.31) {
    return { kind: 'eighth', hollow: false, hasStem: true, dots: 0, beams: 1, beats: 0.5 }
  }
  if (b >= 0.17) {
    return { kind: 'sixteenth', hollow: false, hasStem: true, dots: 0, beams: 2, beats: 0.25 }
  }
  return { kind: 'thirty-second', hollow: false, hasStem: true, dots: 0, beams: 3, beats: 0.125 }
}

// Canonical SMuFL vector paths for Treble (G) and Bass (F) clefs
const G_CLEF_PATH =
  'M12.4,56.7 C11.5,57.8 9.9,58.5 8.4,58.3 C6.1,58.0 4.3,56.0 4.3,53.7 C4.3,51.3 6.0,49.4 8.4,49.4 C9.7,49.4 11.0,50.1 11.7,51.1 L11.9,46.8 C10.1,44.9 8.2,42.5 6.7,39.7 C4.8,36.1 3.8,32.3 3.8,28.4 C3.8,21.5 6.6,15.1 11.5,9.8 C14.3,6.8 17.5,4.3 20.8,2.5 L21.6,2.1 L21.7,3.0 C21.4,7.8 20.5,14.6 19.3,21.5 C21.5,19.3 24.1,18.0 27.0,18.0 C31.6,18.0 35.5,21.8 35.5,27.1 C35.5,33.0 30.8,38.0 24.5,38.0 C20.6,38.0 17.2,36.0 15.3,32.8 L14.7,40.1 C16.0,42.3 17.7,44.9 19.5,47.2 C21.5,49.7 23.3,52.8 23.3,56.4 C23.3,62.2 18.5,66.8 12.5,66.8 C7.0,66.8 2.5,62.8 2.0,57.3 L4.6,57.1 C5.0,61.1 8.3,64.2 12.5,64.2 C16.9,64.2 20.6,60.8 20.6,56.4 C20.6,53.4 19.2,50.8 17.5,48.6 C16.1,46.8 14.6,44.7 13.4,42.6 L12.4,56.7 Z M15.1,28.3 C16.5,32.2 19.8,35.4 24.0,35.4 C28.8,35.4 32.7,31.4 32.7,27.0 C32.7,22.9 29.5,19.9 25.8,19.9 C23.1,19.9 20.7,21.2 18.9,23.3 C17.8,24.6 16.9,26.2 15.1,28.3 Z'

const F_CLEF_PATH =
  'M4.2,8.5 C4.2,4.8 7.3,1.8 11.2,1.8 C15.0,1.8 18.1,4.7 18.3,8.4 C18.3,8.7 18.3,9.0 18.3,9.3 C18.3,15.6 13.9,22.8 5.6,30.0 L4.2,28.5 C10.9,22.6 14.8,16.5 15.1,11.5 C14.0,12.7 12.5,13.4 10.8,13.4 C7.1,13.4 4.2,10.6 4.2,8.5 Z M22.5,5.8 C22.5,4.3 23.7,3.1 25.2,3.1 C26.7,3.1 27.9,4.3 27.9,5.8 C27.9,7.3 26.7,8.5 25.2,8.5 C23.7,8.5 22.5,7.3 22.5,5.8 Z M22.5,15.2 C22.5,13.7 23.7,12.5 25.2,12.5 C26.7,12.5 27.9,13.7 27.9,15.2 C27.9,16.7 26.7,17.9 25.2,17.9 C23.7,17.9 22.5,16.7 22.5,15.2 Z'

// Engraved Quarter Rest SVG path (centered at 0,0)
const QUARTER_REST_PATH =
  'M -2.2 -10.5 L 2.8 -4.5 C 0.4 -1.6 -2.5 0.6 -2.5 2.7 C -2.5 4.8 0.6 6.2 2.4 7.7 C 0.2 6.8 -2.8 7.6 -2.8 9.8 C -2.8 11.6 -1.2 13.0 0.8 13.8 L 0.2 14.7 C -3.0 13.6 -5.0 11.3 -5.0 8.8 C -5.0 6.2 -2.6 4.7 -0.4 5.0 L -4.2 0.2 C -1.4 -2.2 0.8 -4.5 0.8 -6.6 C 0.8 -8.0 -0.4 -9.4 -2.8 -10.0 Z'

// Authentic grand staff proportions (in SVG virtual units)
const SYSTEM_WIDTH = 960
const LINE_SPACING = 9
const STAFF_HEIGHT = LINE_SPACING * 4 // 36px
const TREBLE_TOP_Y = 68
const TREBLE_BOTTOM_Y = TREBLE_TOP_Y + STAFF_HEIGHT // 104px
const INTER_STAFF_MID_Y = TREBLE_BOTTOM_Y + 21 // 125px (spacious gap for dynamics, stems & treble-LH notes)
const BASS_TOP_Y = TREBLE_BOTTOM_Y + 42 // 146px
const BASS_BOTTOM_Y = BASS_TOP_Y + STAFF_HEIGHT // 182px
const PEDAL_Y = BASS_BOTTOM_Y + 30 // 212px (generous clearance below LH fingerings & deep bass ledgers)
const SYSTEM_HEIGHT = PEDAL_Y + 18 // 230px

export const SheetMusicView: React.FC<SheetMusicViewProps> = ({
  piece,
  currentTime,
  activeNotes,
  expectedNotes = [],
  isWaitMode = false,
  onSeek,
  isLooping = false,
  loopRange,
  startMeasure = 1,
  onStartMeasureChange,
  onOpenSections,
  language = 'en',
  showFingering: showFingeringProp,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>(800)

  const hasFingeringsInPiece = useMemo(
    () => piece.notes.some((n) => typeof n.finger === 'number' && n.finger >= 1 && n.finger <= 5),
    [piece.notes]
  )

  const [showFingering, setShowFingering] = useState<boolean>(() => {
    const saved = localStorage.getItem('virtuoso_show_fingering')
    if (saved !== null) return saved === 'true'
    return showFingeringProp ?? true
  })

  const toggleFingering = useCallback(() => {
    setShowFingering((prev) => {
      const next = !prev
      localStorage.setItem('virtuoso_show_fingering', String(next))
      return next
    })
  }, [])

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
    // 6/4 dense scores (like Ballade No. 1) breathe better with fewer measures per line
    const hasWideMeters =
      (piece.timeSignature && piece.timeSignature[0] >= 6) ||
      Boolean(piece.timeSignatureChanges?.some((c) => c.timeSignature[0] >= 6))
    if (containerWidth >= 1150) return hasWideMeters ? 3 : 4
    if (containerWidth >= 700) return hasWideMeters ? 2 : 3
    return 2
  }, [containerWidth, piece.timeSignature, piece.timeSignatureChanges])

  // Key signature analysis: sharps vs flats
  const { sharpsCount, flatsCount, keySignatureMap } = useMemo(() => {
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
    } else if (k.includes('gb maj') || k.includes('eb min') || k.includes('6 flat')) {
      f = 6
    } else if (k.includes('db maj') || k.includes('bb min') || k.includes('5 flat')) {
      f = 5
    } else if (k.includes('ab maj') || k.includes('f min') || k.includes('4 flat')) {
      f = 4
    } else if (k.includes('eb maj') || k.includes('c min') || k.includes('3 flat')) {
      f = 3
    } else if (k.includes('bb maj') || k.includes('g min') || k.includes('2 flat')) {
      f = 2
    } else if (k.includes('d min') || k.includes('f maj') || k.includes('1 flat')) {
      f = 1
    }

    const sharpOrder = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
    const flatOrder = ['B', 'E', 'A', 'D', 'G', 'C', 'F']
    const map: Record<string, '#' | 'b' | ''> = { C: '', D: '', E: '', F: '', G: '', A: '', B: '' }
    if (s > 0) {
      sharpOrder.slice(0, s).forEach((p) => {
        map[p] = '#'
      })
    } else if (f > 0) {
      flatOrder.slice(0, f).forEach((p) => {
        map[p] = 'b'
      })
    }

    return { sharpsCount: s, flatsCount: f, keySignatureMap: map }
  }, [piece.key])

  // Time signature resolver for any measure
  const getTimeSignatureForMeasure = useCallback(
    (mNum: number): [number, number] => {
      let ts: [number, number] = piece.timeSignature || [4, 4]
      if (piece.timeSignatureChanges && piece.timeSignatureChanges.length > 0) {
        for (const chg of piece.timeSignatureChanges) {
          if (chg.measure <= mNum) {
            ts = chg.timeSignature
          }
        }
      }
      return ts
    },
    [piece.timeSignature, piece.timeSignatureChanges]
  )

  const getQuarterBeatsPerMeasure = useCallback(
    (mNum: number): number => {
      const [num, den] = getTimeSignatureForMeasure(mNum)
      // In 4/4 -> 4 quarter beats; 6/4 -> 6 quarter beats; 3/8 -> 1.5 quarter beats; 2/2 -> 4 quarter beats
      return num * (4 / (den || 4))
    },
    [getTimeSignatureForMeasure]
  )

  // Clef resolver per measure & hand (supports both-treble pieces like Franz Behr and mid-piece clefs like Ballade No. 1!)
  const getClefForMeasure = useCallback(
    (mNum: number, hand: 'right' | 'left'): ClefType => {
      const override = piece.measureClefs?.[mNum]
      if (hand === 'right') {
        return override?.right || 'treble'
      }
      return override?.left || piece.leftHandClef || 'bass'
    },
    [piece.measureClefs, piece.leftHandClef]
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

  const pedalsMap = useMemo(() => {
    const pMap = new Map<number, PedalEvent[]>()
    piece.pedalEvents?.forEach((pedal) => {
      const m = Math.max(1, pedal.measure || 1)
      if (!pMap.has(m)) pMap.set(m, [])
      pMap.get(m)!.push(pedal)
    })
    return pMap
  }, [piece.pedalEvents])

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

  const currentMeasure = useMemo(() => {
    for (let i = piece.notes.length - 1; i >= 0; i--) {
      if (currentTime >= piece.notes[i].startTime) {
        return Math.max(1, piece.notes[i].measure)
      }
    }
    return measureNumbers[0] || 1
  }, [currentTime, piece.notes, measureNumbers])

  const currentSystemIndex = useMemo(() => {
    return Math.max(0, Math.floor((currentMeasure - 1) / measuresPerSystem))
  }, [currentMeasure, measuresPerSystem])

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

  // Map diatonic step to Y coordinate on either upper (right) or lower (left) staff with arbitrary clef!
  const getStepY = useCallback((step: number, hand: 'right' | 'left', clef: ClefType): number => {
    const topY = hand === 'right' ? TREBLE_TOP_Y : BASS_TOP_Y
    if (clef === 'treble') {
      // Top line (Line 5) = F5 (step 10)
      return topY + (10 - step) * (LINE_SPACING / 2)
    } else {
      // Top line (Line 5) = A3 (step -2)
      return topY + (-2 - step) * (LINE_SPACING / 2)
    }
  }, [])

  // Calculate ledger lines outside the 5 lines of a given staff
  const getLedgerLines = useCallback((y: number, hand: 'right' | 'left'): number[] => {
    const topY = hand === 'right' ? TREBLE_TOP_Y : BASS_TOP_Y
    const bottomY = topY + STAFF_HEIGHT
    const lines: number[] = []
    if (y >= bottomY + LINE_SPACING - 1) {
      for (let ly = bottomY + LINE_SPACING; ly <= y + 1.5; ly += LINE_SPACING) {
        lines.push(ly)
      }
    }
    if (y <= topY - LINE_SPACING + 1) {
      for (let ly = topY - LINE_SPACING; ly >= y - 1.5; ly -= LINE_SPACING) {
        lines.push(ly)
      }
    }
    return lines
  }, [])

  // Helper to render key signature glyphs on a staff given its clef
  const renderKeySignature = useCallback(
    (topY: number, clef: ClefType, startX: number) => {
      const sharpTrebleOffsets = [4, 18, 0, 13.5, 27, 9, 22.5]
      const sharpBassOffsets = [13, 27, 9, 22.5, 36, 18, 31.5]
      const flatTrebleOffsets = [22.5, 9, 27, 13.5, 31.5, 18, 36]
      const flatBassOffsets = [31.5, 18, 36, 22.5, 40.5, 27, 45]

      if (sharpsCount > 0) {
        const offsets = clef === 'treble' ? sharpTrebleOffsets : sharpBassOffsets
        return (
          <g fill={inkColor} fontSize="14" fontFamily="serif" fontWeight="bold">
            {offsets.slice(0, sharpsCount).map((dy, idx) => (
              <text key={`ks-s-${idx}`} x={startX + idx * 7} y={topY + dy}>
                ♯
              </text>
            ))}
          </g>
        )
      }
      if (flatsCount > 0) {
        const offsets = clef === 'treble' ? flatTrebleOffsets : flatBassOffsets
        return (
          <g fill={inkColor} fontSize="15" fontFamily="serif" fontWeight="bold">
            {offsets.slice(0, flatsCount).map((dy, idx) => (
              <text key={`ks-f-${idx}`} x={startX + idx * 7} y={topY + dy}>
                ♭
              </text>
            ))}
          </g>
        )
      }
      return null
    },
    [sharpsCount, flatsCount, inkColor]
  )

  return (
    <div
      ref={scrollContainerRef}
      className="w-full h-full overflow-y-auto overflow-x-hidden transition-colors duration-200 select-none pb-24 touch-pan-y"
      style={{ backgroundColor: pageBgColor }}
    >
      {/* 1. Classical Score Sheet Header */}
      <div
        className={`max-w-4xl mx-auto pt-4 pb-3 px-4 sm:px-8 border-b mb-2 ${
          isDark ? 'border-zinc-800/70' : 'border-stone-300/70'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase border ${
                isDark
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                  : 'bg-amber-500/15 text-amber-700 border-amber-500/30'
              }`}
            >
              Henle Urtext
            </span>
            <span
              className={`text-xs font-mono font-semibold ${
                isDark ? 'text-zinc-400' : 'text-stone-600'
              }`}
            >
              {language === 'de' ? 'Takt' : 'M.'} {currentMeasure} / {maxMeasure}
            </span>
            {startMeasure > 1 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 shadow-sm ${
                  isDark
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-amber-500/15 text-amber-700 border-amber-500/40'
                }`}
              >
                <span>★</span>
                <span>Start M.{startMeasure}</span>
              </span>
            )}
            {isLooping && loopRange && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 shadow-sm ${
                  isDark
                    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                    : 'bg-blue-500/15 text-blue-700 border-blue-500/40'
                }`}
              >
                <span>⟲</span>
                <span>Loop M.{loopRange[0]}–{loopRange[1]}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenSections && (
              <button
                type="button"
                onClick={onOpenSections}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-colors active:scale-95 ${
                  isDark
                    ? 'border-amber-500/40 bg-zinc-800/90 text-amber-300 hover:bg-zinc-700'
                    : 'border-amber-500/40 bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{language === 'de' ? 'Takte / Loop' : 'Parts / Start'}</span>
              </button>
            )}

            {/* Fingering Toggle (1–5) */}
            {hasFingeringsInPiece && (
              <button
                type="button"
                onClick={toggleFingering}
                className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-colors active:scale-95 ${
                  showFingering
                    ? isDark
                      ? 'border-sky-500/50 bg-sky-500/20 text-sky-300'
                      : 'border-sky-500/50 bg-sky-100 text-sky-800'
                    : isDark
                    ? 'border-zinc-700 bg-zinc-800/80 text-zinc-400'
                    : 'border-stone-300 bg-stone-100 text-stone-600'
                }`}
                title={language === 'de' ? 'Fingersatz anzeigen/ausblenden' : 'Toggle fingerings (1–5)'}
              >
                <Hash className="w-3 h-3" />
                <span>1–5</span>
              </button>
            )}

            {/* Theme Toggle (Ivory vs OLED Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-lg border transition-colors active:scale-95 ${
                isDark
                  ? 'border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:text-amber-400'
                  : 'border-stone-300 bg-stone-100 text-stone-700 hover:text-amber-600'
              }`}
              title={isDark ? 'Switch to Ivory Parchment' : 'Switch to OLED Dark'}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Jump to Start Measure */}
            <button
              type="button"
              onClick={() => {
                const targetMeas = isLooping && loopRange ? loopRange[0] : startMeasure
                const note = piece.notes.find((n) => n.measure >= targetMeas)
                onSeek(note ? note.startTime : 0)
              }}
              className={`p-2 rounded-lg border transition-colors active:scale-95 ${
                isDark
                  ? 'border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:text-amber-400'
                  : 'border-stone-300 bg-stone-100 text-stone-700 hover:text-amber-600'
              }`}
              title={`Seek to start measure (M. ${isLooping && loopRange ? loopRange[0] : startMeasure})`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Piece Title & Subtitle (Classical Typography) */}
        <div className="text-center mt-2.5 mb-1">
          <h1
            className="text-xl sm:text-3xl font-serif font-extrabold tracking-tight"
            style={{ color: inkColor }}
          >
            {piece.title}
          </h1>
          <p
            className={`text-xs sm:text-sm font-serif italic mt-0.5 ${
              isDark ? 'text-zinc-400' : 'text-stone-600'
            }`}
          >
            {piece.composer}
            {piece.opus ? ` • ${piece.opus}` : ''}
          </p>
        </div>

        {/* Initial Tempo, Key & Quick Tap Tip */}
        <div
          className={`flex flex-wrap items-center justify-between gap-2 text-[11px] font-serif font-semibold mt-2 px-1 ${
            isDark ? 'text-zinc-400' : 'text-stone-600'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="font-sans font-bold">♩</span>
            <span>= {piece.tempoBpm || 80}</span>
            {piece.leftHandClef === 'treble' && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-bold ${
                  isDark ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-800'
                }`}
              >
                {language === 'de' ? 'RH & LH: Violinschlüssel' : 'Both Staves: Treble Clef'}
              </span>
            )}
          </div>
          {onStartMeasureChange && (
            <span className={`text-[10px] font-sans ${isDark ? 'text-zinc-500' : 'text-stone-500'}`}>
              {language === 'de'
                ? 'Tipp: Auf Taktnummer tippen = ★ Start-Takt setzen'
                : 'Tip: Tap any measure # to set ★ Start Measure'}
            </span>
          )}
          <div>
            <span>{piece.key || 'C Major'}</span>
            <span className="mx-1.5">•</span>
            <span>
              {(() => {
                const ts = getTimeSignatureForMeasure(currentMeasure)
                return `${ts[0]}/${ts[1]}`
              })()}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Grand Staff Multi-System Score Page */}
      <div className="max-w-4xl mx-auto px-2 sm:px-6 space-y-4">
        {systems.map((system) => {
          const isFirstSystem = system.systemIndex === 0
          const systemMeasures = system.measures
          const firstMeasInSystem = systemMeasures[0]
          const sysRightClef = getClefForMeasure(firstMeasInSystem, 'right')
          const sysLeftClef = getClefForMeasure(firstMeasInSystem, 'left')
          const ksWidth = Math.max(sharpsCount, flatsCount) * 7.5
          const accoladeWidth = Math.max(isFirstSystem ? 92 : 76, 54 + ksWidth + (isFirstSystem ? 26 : 8))
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
                {/* --- A. ACCOLADE BRACE & CLEFS --- */}
                <path
                  d={`M 14 ${TREBLE_TOP_Y} C 4 ${TREBLE_TOP_Y + 20}, 4 ${INTER_STAFF_MID_Y - 12}, 0 ${INTER_STAFF_MID_Y} C 4 ${INTER_STAFF_MID_Y + 12}, 4 ${BASS_BOTTOM_Y - 20}, 14 ${BASS_BOTTOM_Y}`}
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

                {/* Upper Staff Clef (Treble default, or Bass e.g. Ballade M.1) */}
                {sysRightClef === 'treble' ? (
                  <g transform={`translate(19, ${TREBLE_TOP_Y - 30}) scale(0.95)`} fill={inkColor}>
                    <path d={G_CLEF_PATH} />
                  </g>
                ) : (
                  <g transform={`translate(20, ${TREBLE_TOP_Y + 6}) scale(1.0)`} fill={inkColor}>
                    <path d={F_CLEF_PATH} />
                  </g>
                )}

                {/* Lower Staff Clef (Bass default, OR Treble e.g. Franz Behr!) */}
                {sysLeftClef === 'treble' ? (
                  <g transform={`translate(19, ${BASS_TOP_Y - 30}) scale(0.95)`} fill={inkColor}>
                    <path d={G_CLEF_PATH} />
                  </g>
                ) : (
                  <g transform={`translate(20, ${BASS_TOP_Y + 6}) scale(1.0)`} fill={inkColor}>
                    <path d={F_CLEF_PATH} />
                  </g>
                )}

                {/* Key Signatures matched to each staff's actual clef */}
                {renderKeySignature(TREBLE_TOP_Y, sysRightClef, 50)}
                {renderKeySignature(BASS_TOP_Y, sysLeftClef, 50)}

                {/* Initial Time Signature on First System */}
                {isFirstSystem && (() => {
                  const ts = getTimeSignatureForMeasure(1)
                  return (
                    <g fill={inkColor} fontFamily="serif" fontWeight="900" fontSize="16" textAnchor="middle">
                      <text x={accoladeWidth - 11} y={TREBLE_TOP_Y + LINE_SPACING * 1.7}>
                        {ts[0]}
                      </text>
                      <text x={accoladeWidth - 11} y={TREBLE_TOP_Y + LINE_SPACING * 3.7}>
                        {ts[1]}
                      </text>
                      <text x={accoladeWidth - 11} y={BASS_TOP_Y + LINE_SPACING * 1.7}>
                        {ts[0]}
                      </text>
                      <text x={accoladeWidth - 11} y={BASS_TOP_Y + LINE_SPACING * 3.7}>
                        {ts[1]}
                      </text>
                    </g>
                  )
                })()}

                {/* Continuous Grand Staff Lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <React.Fragment key={`staff-lines-${i}`}>
                    <line
                      x1="16"
                      y1={TREBLE_TOP_Y + i * LINE_SPACING}
                      x2={SYSTEM_WIDTH}
                      y2={TREBLE_TOP_Y + i * LINE_SPACING}
                      stroke={staveLineColor}
                      strokeWidth="1.2"
                    />
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

                {/* --- B. MEASURES & ENGRAVED NOTATION --- */}
                {systemMeasures.map((mNum, mIdx) => {
                  const mStartX = accoladeWidth + mIdx * measureWidth
                  const mEndX = mStartX + measureWidth
                  const isCurrent = mNum === currentMeasure
                  const notesInMeasure = measuresMap.get(mNum) || []
                  const pedalsInMeasure = pedalsMap.get(mNum) || []
                  const isLastOfPiece = mNum === maxMeasure

                  const rightClef = getClefForMeasure(mNum, 'right')
                  const leftClef = getClefForMeasure(mNum, 'left')
                  const prevRightClef = mNum > 1 ? getClefForMeasure(mNum - 1, 'right') : rightClef
                  const prevLeftClef = mNum > 1 ? getClefForMeasure(mNum - 1, 'left') : leftClef
                  const showRightClefChange = mIdx > 0 && rightClef !== prevRightClef
                  const showLeftClefChange = mIdx > 0 && leftClef !== prevLeftClef

                  const curTs = getTimeSignatureForMeasure(mNum)
                  const prevTs = mNum > 1 ? getTimeSignatureForMeasure(mNum - 1) : curTs
                  const showMeterChange =
                    mNum > 1 && (curTs[0] !== prevTs[0] || curTs[1] !== prevTs[1])

                  const sortedNotes = [...notesInMeasure].sort(
                    (a, b) => a.startTime - b.startTime || a.midi - b.midi
                  )
                  const nextMeasureNotes = measuresMap.get(mNum + 1)
                  const mStartTime = sortedNotes[0]?.startTime ?? (mNum - 1) * 2.0
                  const naturalEnd = sortedNotes.length
                    ? Math.max(...sortedNotes.map((n) => n.startTime + (n.duration || 0.4)))
                    : mStartTime + 2.0
                  const mEndTime = nextMeasureNotes?.[0]
                    ? Math.max(naturalEnd, nextMeasureNotes[0].startTime)
                    : naturalEnd
                  const mDuration = Math.max(0.5, mEndTime - mStartTime)

                  // True measure beats (in beat units of the denominator, e.g. 4 in 4/4, 6 in 6/4, 3 in 3/8)
                  const nominalBeats = curTs[0] || 4
                  const maxObservedBeat = sortedNotes.reduce((mx, n) => Math.max(mx, n.beat || 1), 1)
                  const measureBeatSpan = Math.max(nominalBeats, Math.ceil(maxObservedBeat))
                  const quarterBeatsInBar = getQuarterBeatsPerMeasure(mNum)
                  // Local seconds-per-quarter-note fallback when durationBeats isn't precomputed
                  const inferredSecPerQuarter =
                    piece.tempoBpm > 0
                      ? 60 / piece.tempoBpm
                      : mDuration / Math.max(1, quarterBeatsInBar)
                  const beatScaleFactor = 4 / (curTs[1] || 4) // 1 for x/4, 0.5 for x/8, 2 for x/2

                  // Reserve left padding inside measure if a mid-piece time-sig or clef change appears
                  const extraLeftPad =
                    (showMeterChange ? 22 : 0) + (showRightClefChange || showLeftClefChange ? 22 : 0)
                  const innerPaddingLeft = 20 + extraLeftPad
                  const innerPaddingRight = 18
                  const usableMeasureWidth = Math.max(
                    36,
                    measureWidth - innerPaddingLeft - innerPaddingRight
                  )

                  // 1. Unified Time-Aligned Columns (40ms cluster window)
                  const colMap = new Map<
                    number,
                    { tKey: number; startTime: number; beat: number; right: NoteEvent[]; left: NoteEvent[]; x: number }
                  >()
                  sortedNotes.forEach((n) => {
                    const clusterKey = Math.round(n.startTime * 25) / 25
                    if (!colMap.has(clusterKey)) {
                      const beatEst =
                        n.beat !== undefined && n.beat >= 1
                          ? n.beat
                          : 1 + ((n.startTime - mStartTime) / mDuration) * measureBeatSpan
                      colMap.set(clusterKey, {
                        tKey: clusterKey,
                        startTime: n.startTime,
                        beat: beatEst,
                        right: [],
                        left: [],
                        x: 0,
                      })
                    }
                    const col = colMap.get(clusterKey)!
                    if (n.hand === 'left') col.left.push(n)
                    else col.right.push(n)
                  })

                  const columns = Array.from(colMap.values()).sort((a, b) => a.startTime - b.startTime)

                  // Proportional horizontal beat positioning (handles 4/4, 6/4, 3/8, pickup beats accurately)
                  columns.forEach((col) => {
                    const beatOffset = Math.max(0, col.beat - 1)
                    const ratio = Math.min(0.93, beatOffset / measureBeatSpan)
                    col.x = mStartX + innerPaddingLeft + ratio * usableMeasureWidth
                  })

                  // Enforce minimum column spacing to eliminate collisions
                  if (columns.length > 1) {
                    const minSpacing = Math.min(24, usableMeasureWidth / Math.max(columns.length, 1))
                    for (let i = 1; i < columns.length; i++) {
                      if (columns[i].x < columns[i - 1].x + minSpacing) {
                        columns[i].x = columns[i - 1].x + minSpacing
                      }
                    }
                    const lastCol = columns[columns.length - 1]
                    const maxAllowedX = mEndX - innerPaddingRight
                    if (lastCol.x > maxAllowedX) {
                      const firstX = columns[0].x
                      const span = lastCol.x - firstX
                      const targetSpan = maxAllowedX - firstX
                      if (span > 0 && targetSpan > 0) {
                        const factor = targetSpan / span
                        for (let i = 1; i < columns.length; i++) {
                          columns[i].x = firstX + (columns[i].x - firstX) * factor
                        }
                      }
                    }
                  }

                  // Helper to resolve a note's engraved rhythm shape
                  const resolveNoteRhythm = (n: NoteEvent): RhythmShape => {
                    if (typeof n.durationBeats === 'number' && n.durationBeats > 0) {
                      return classifyRhythm(n.durationBeats)
                    }
                    const approxQuarterBeats = n.duration / inferredSecPerQuarter
                    return classifyRhythm(approxQuarterBeats)
                  }

                  // 2. Build Voice Clusters per Staff with Per-Measure Accidental Memory,
                  //    Natural Signs (♮), Second-Interval Displacement & Staggered Accidentals!
                  const buildStaffClusters = (hand: 'right' | 'left', clef: ClefType) => {
                    const topY = hand === 'right' ? TREBLE_TOP_Y : BASS_TOP_Y
                    const middleLineY = topY + LINE_SPACING * 2
                    // Measure accidental state keyed by `${letter}:${octave}` -> '#' | 'b' | ''
                    const measureAccState = new Map<string, '#' | 'b' | ''>()

                    // Detect if this staff uses multi-voice polyphony in this measure
                    const staffNotesAll = sortedNotes.filter((n) => n.hand === hand)
                    const explicitMultiVoice = staffNotesAll.some((n) => n.voice === 2)

                    const clusters: VoiceCluster[] = []

                    columns.forEach((col, colIndex) => {
                      const handNotes = hand === 'right' ? col.right : col.left
                      if (handNotes.length === 0) return

                      // Partition simultaneous notes into voices (Voice 1 & Voice 2)
                      const voiceGroups = new Map<1 | 2, NoteEvent[]>()
                      if (explicitMultiVoice) {
                        handNotes.forEach((n) => {
                          const v: 1 | 2 = n.voice === 2 ? 2 : 1
                          if (!voiceGroups.has(v)) voiceGroups.set(v, [])
                          voiceGroups.get(v)!.push(n)
                        })
                      } else {
                        // Auto-detect polyphonic split if simultaneous chord has sharply diverging durations (>=2.2x)
                        const rhythms = handNotes.map((n) => resolveNoteRhythm(n))
                        const maxB = Math.max(...rhythms.map((r) => r.beats))
                        const minB = Math.min(...rhythms.map((r) => r.beats))
                        if (handNotes.length >= 2 && maxB >= 2.0 && minB <= 1.0 && maxB / minB >= 2.0) {
                          handNotes.forEach((n, idx) => {
                            const v: 1 | 2 = rhythms[idx].beats >= 1.75 ? 1 : 2
                            if (!voiceGroups.has(v)) voiceGroups.set(v, [])
                            voiceGroups.get(v)!.push(n)
                          })
                        } else {
                          voiceGroups.set(1, handNotes)
                        }
                      }

                      const hasTwoVoicesHere = explicitMultiVoice || voiceGroups.size > 1

                      voiceGroups.forEach((vNotes, voice) => {
                        // Sort low-to-high pitch (descending Y)
                        const parsed = vNotes
                          .map((n) => {
                            const p = parseNotePitch(n.noteName, n.midi)
                            const y = getStepY(p.step, hand, clef)
                            const rhythm = resolveNoteRhythm(n)
                            return { note: n, parsed: p, y, rhythm }
                          })
                          .sort((a, b) => a.parsed.step - b.parsed.step)

                        // Choose dominant cluster rhythm (longest for sustained voice, shortest for moving chords)
                        const sortedRhythms = [...parsed].sort((a, b) =>
                          voice === 1 ? b.rhythm.beats - a.rhythm.beats : a.rhythm.beats - b.rhythm.beats
                        )
                        const clusterRhythm = sortedRhythms[0].rhythm

                        const highestY = Math.min(...parsed.map((p) => p.y))
                        const lowestY = Math.max(...parsed.map((p) => p.y))

                        // Standard *Behind Bars* stem direction rule:
                        // Multi-voice: Voice 1 = UP, Voice 2 = DOWN.
                        // Single voice: compare furthest note from middle staff line!
                        let isStemUp: boolean
                        if (hasTwoVoicesHere) {
                          isStemUp = voice === 1
                        } else {
                          const distAbove = middleLineY - highestY
                          const distBelow = lowestY - middleLineY
                          isStemUp = distBelow >= distAbove
                        }

                        // Resolve accidentals (♯, ♭, ♮) & second-interval notehead displacement!
                        const positioned: PositionedNote[] = []
                        let prevDisplaced = false
                        const orderedForSeconds = isStemUp ? parsed : [...parsed].reverse()
                        const displacementMap = new Map<string, number>()

                        for (let i = 0; i < orderedForSeconds.length; i++) {
                          const cur = orderedForSeconds[i]
                          let xOff = 0
                          if (i > 0) {
                            const prev = orderedForSeconds[i - 1]
                            if (Math.abs(cur.parsed.step - prev.parsed.step) <= 1 && !prevDisplaced) {
                              // Shift colliding second to opposite side of the stem
                              xOff = isStemUp ? 9.4 : -9.4
                              prevDisplaced = true
                            } else {
                              prevDisplaced = false
                            }
                          }
                          displacementMap.set(cur.note.id, xOff)
                        }

                        // Stagger accidentals horizontally if vertical Y distance < 13px
                        const placedAccY: { y: number; slot: number }[] = []
                        // Process top-to-bottom for clean engraving order
                        const topToBottom = [...parsed].sort((a, b) => a.y - b.y)
                        const accInfoMap = new Map<string, { sym: '♯' | '♭' | '♮' | null; xOff: number }>()

                        for (const item of topToBottom) {
                          const stateKey = `${item.parsed.letter}:${item.parsed.octave}`
                          const activeAcc = measureAccState.has(stateKey)
                            ? measureAccState.get(stateKey)!
                            : keySignatureMap[item.parsed.letter] ?? ''
                          let sym: '♯' | '♭' | '♮' | null = null
                          if (item.parsed.accidental !== activeAcc) {
                            if (item.parsed.accidental === '#') sym = '♯'
                            else if (item.parsed.accidental === 'b') sym = '♭'
                            else sym = '♮' // Explicitly cancels key signature or earlier bar accidental!
                            measureAccState.set(stateKey, item.parsed.accidental)
                          }
                          let accXOff = 0
                          if (sym) {
                            let slot = 0
                            while (
                              placedAccY.some((p) => p.slot === slot && Math.abs(p.y - item.y) < 13)
                            ) {
                              slot++
                            }
                            placedAccY.push({ y: item.y, slot })
                            accXOff = -10.5 - slot * 8.8
                          }
                          accInfoMap.set(item.note.id, { sym, xOff: accXOff })
                        }

                        for (const item of parsed) {
                          const acc = accInfoMap.get(item.note.id) || { sym: null, xOff: 0 }
                          positioned.push({
                            note: item.note,
                            step: item.parsed.step,
                            y: item.y,
                            xOffset: displacementMap.get(item.note.id) || 0,
                            accidental: acc.sym,
                            accidentalXOffset: acc.xOff,
                            rhythm: item.rhythm,
                          })
                        }

                        const isExpected =
                          isWaitMode &&
                          expectedNotes.length > 0 &&
                          vNotes.some((n) => expectedNotes.includes(n.midi)) &&
                          Math.abs(col.startTime - currentTime) < 0.45

                        const isSounding = vNotes.some(
                          (n) =>
                            (activeNotes && activeNotes.has(n.midi)) ||
                            (currentTime >= n.startTime && currentTime <= n.startTime + n.duration)
                        )

                        const color = isExpected ? '#f59e0b' : isSounding ? '#10b981' : inkColor
                        const stemX = isStemUp ? col.x + 4.9 : col.x - 4.9
                        const stemStartY = isStemUp ? lowestY : highestY
                        const stemLen = hasTwoVoicesHere ? 23 : 27
                        const stemEndY = isStemUp ? highestY - stemLen : lowestY + stemLen

                        clusters.push({
                          colIndex,
                          tKey: col.tKey,
                          startTime: col.startTime,
                          beat: col.beat,
                          x: col.x,
                          voice,
                          hand,
                          clef,
                          notes: positioned,
                          rhythm: clusterRhythm,
                          isStemUp,
                          stemX,
                          stemStartY,
                          stemEndY,
                          highestY,
                          lowestY,
                          isTriplet: vNotes.some((n) => Boolean(n.isTriplet)),
                          isExpected,
                          isSounding,
                          color,
                        })
                      })
                    })

                    // 3. Build Horizontal Beam Groups for consecutive 8th / 16th / Triplet notes!
                    const beamGroups: BeamGroup[] = []
                    const beamedClusterIds = new Set<string>()
                    const cKey = (c: VoiceCluster) => `${c.hand}-${c.voice}-${c.tKey}`

                    const voicesToBeam: (1 | 2)[] = [1, 2]
                    for (const v of voicesToBeam) {
                      const vClusters = clusters.filter((c) => c.voice === v)
                      let currentRun: VoiceCluster[] = []

                      const flushRun = () => {
                        if (currentRun.length >= 2) {
                          // Determine shared stem direction across the whole beam group
                          const groupHigh = Math.min(...currentRun.map((c) => c.highestY))
                          const groupLow = Math.max(...currentRun.map((c) => c.lowestY))
                          const sharedStemUp = explicitMultiVoice
                            ? v === 1
                            : groupLow - middleLineY >= middleLineY - groupHigh

                          const maxBeams = Math.max(...currentRun.map((c) => c.rhythm.beams))
                          const stemLen = maxBeams >= 2 ? 28 : 25

                          // Update every cluster in run to align its stem to the beam line
                          currentRun.forEach((c) => {
                            c.isStemUp = sharedStemUp
                            c.stemX = sharedStemUp ? c.x + 4.9 : c.x - 4.9
                            c.stemStartY = sharedStemUp ? c.lowestY : c.highestY
                          })

                          const first = currentRun[0]
                          const last = currentRun[currentRun.length - 1]
                          const rawYStart = sharedStemUp ? first.highestY - stemLen : first.lowestY + stemLen
                          const rawYEnd = sharedStemUp ? last.highestY - stemLen : last.lowestY + stemLen
                          // Cap beam slope so it stays elegant & readable
                          const slope = Math.max(-10, Math.min(10, rawYEnd - rawYStart))
                          let yStart = rawYStart
                          let yEnd = rawYStart + slope

                          // Ensure every interior note clears the beam by at least 16px
                          const dxTotal = Math.max(1, last.stemX - first.stemX)
                          for (const c of currentRun) {
                            const frac = (c.stemX - first.stemX) / dxTotal
                            const beamAtX = yStart + frac * (yEnd - yStart)
                            if (sharedStemUp) {
                              const needed = c.highestY - 17
                              if (beamAtX > needed) {
                                const shift = beamAtX - needed
                                yStart -= shift
                                yEnd -= shift
                              }
                            } else {
                              const needed = c.lowestY + 17
                              if (beamAtX < needed) {
                                const shift = needed - beamAtX
                                yStart += shift
                                yEnd += shift
                              }
                            }
                          }

                          currentRun.forEach((c) => {
                            const frac = (c.stemX - first.stemX) / dxTotal
                            c.stemEndY = yStart + frac * (yEnd - yStart)
                            beamedClusterIds.add(cKey(c))
                          })

                          const anyExpected = currentRun.some((c) => c.isExpected)
                          const anySounding = currentRun.some((c) => c.isSounding)
                          const beamColor = anyExpected ? '#f59e0b' : anySounding ? '#10b981' : inkColor

                          beamGroups.push({
                            clusters: [...currentRun],
                            isStemUp: sharedStemUp,
                            maxBeams,
                            isTriplet: currentRun.length === 3 && currentRun.some((c) => c.isTriplet),
                            yStart,
                            yEnd,
                            color: beamColor,
                          })
                        }
                        currentRun = []
                      }

                      // Beat-group boundaries: 2-beat half-bar groups in 4/4, 3-beat groups in 6/4 & 3/8
                      const groupSizeBeats = curTs[0] === 6 || curTs[0] === 3 ? 3 : 2

                      for (const c of vClusters) {
                        if (c.rhythm.beams === 0) {
                          flushRun()
                          continue
                        }
                        if (currentRun.length > 0) {
                          const prev = currentRun[currentRun.length - 1]
                          const prevGroup = Math.floor((prev.beat - 0.99) / groupSizeBeats)
                          const curGroup = Math.floor((c.beat - 0.99) / groupSizeBeats)
                          const beatGap = c.beat - prev.beat
                          // Break beam across bar halves, large gaps, or triplet boundaries
                          if (
                            curGroup !== prevGroup ||
                            beatGap > 1.15 ||
                            prev.isTriplet !== c.isTriplet ||
                            (c.isTriplet && currentRun.length >= 3)
                          ) {
                            flushRun()
                          }
                        }
                        currentRun.push(c)
                      }
                      flushRun()
                    }

                    // 4. Compute Engraved Rests for empty full beats in this hand (e.g., Behr M.24 beat 4 quarter rest, Ballade M.6 half rest, M.9 LH rests!)
                    const rests: MeasureRest[] = []
                    if (notesInMeasure.length > 0 && curTs[1] === 4) {
                      // Build occupied beat coverage [startBeat, endBeat) for this hand
                      const intervals = staffNotesAll.map((n) => {
                        const bStart = Math.max(1, n.beat || 1)
                        const bDur = resolveNoteRhythm(n).beats / beatScaleFactor
                        return [bStart, bStart + bDur] as [number, number]
                      })

                      let b = 1
                      while (b <= nominalBeats) {
                        const covered = intervals.some(([s, e]) => b >= s - 0.15 && b < e - 0.12)
                        if (!covered) {
                          // Count consecutive uncovered whole beats
                          let span = 1
                          while (
                            b + span <= nominalBeats &&
                            !intervals.some(([s, e]) => b + span >= s - 0.15 && b + span < e - 0.12)
                          ) {
                            span++
                          }
                          // Emit clean rests respecting half-bar boundary (beat 3 in 4/4, beat 4 in 6/4)
                          const halfBar = nominalBeats === 6 ? 4 : 3
                          let rem = span
                          let cursor = b
                          while (rem > 0) {
                            if (rem >= nominalBeats && cursor === 1) {
                              const rx = mStartX + innerPaddingLeft + usableMeasureWidth * 0.45
                              rests.push({ beat: cursor, durationBeats: nominalBeats, kind: 'whole', x: rx, hand })
                              cursor += nominalBeats
                              rem -= nominalBeats
                            } else if (rem >= 2 && (cursor === 1 || cursor === halfBar)) {
                              const ratio = (cursor - 1) / measureBeatSpan
                              const rx = mStartX + innerPaddingLeft + ratio * usableMeasureWidth
                              rests.push({ beat: cursor, durationBeats: 2, kind: 'half', x: rx, hand })
                              cursor += 2
                              rem -= 2
                            } else {
                              const ratio = Math.min(0.93, (cursor - 1) / measureBeatSpan)
                              const rx = mStartX + innerPaddingLeft + ratio * usableMeasureWidth
                              // Avoid overlapping an existing column on the exact same X
                              const nearbyCol = columns.find((col) => Math.abs(col.beat - cursor) < 0.15)
                              rests.push({
                                beat: cursor,
                                durationBeats: 1,
                                kind: 'quarter',
                                x: nearbyCol ? nearbyCol.x : rx,
                                hand,
                              })
                              cursor += 1
                              rem -= 1
                            }
                          }
                          b += span
                        } else {
                          b += 1
                        }
                      }
                    }

                    return { clusters, beamGroups, beamedClusterIds, rests }
                  }

                  const rhData = buildStaffClusters('right', rightClef)
                  const lhData = buildStaffClusters('left', leftClef)

                  // Flow Mode Playhead X calculation
                  const playheadRatio = Math.max(0, Math.min(1, (currentTime - mStartTime) / mDuration))
                  const playheadX = mStartX + innerPaddingLeft + playheadRatio * usableMeasureWidth

                  const marking = piece.measureMarkings?.[mNum]

                  // Render helper for a complete staff's rests, beams, stems, flags, noteheads, dots, accidentals & fingerings
                  const renderStaffLayer = (
                    data: ReturnType<typeof buildStaffClusters>,
                    hand: 'right' | 'left'
                  ) => {
                    const topY = hand === 'right' ? TREBLE_TOP_Y : BASS_TOP_Y
                    const midLineY = topY + LINE_SPACING * 2
                    const cKey = (c: VoiceCluster) => `${c.hand}-${c.voice}-${c.tKey}`

                    return (
                      <g>
                        {/* Rests */}
                        {data.rests.map((rest, rIdx) => (
                          <g key={`rest-${hand}-${mNum}-${rIdx}`} transform={`translate(${rest.x}, ${midLineY})`}>
                            {rest.kind === 'whole' && (
                              <rect x="-5.5" y={-LINE_SPACING} width="11" height="4.5" fill={inkColor} />
                            )}
                            {rest.kind === 'half' && (
                              <rect x="-5.5" y="-4.5" width="11" height="4.5" fill={inkColor} />
                            )}
                            {rest.kind === 'quarter' && (
                              <path d={QUARTER_REST_PATH} fill={inkColor} />
                            )}
                            {rest.kind === 'eighth' && (
                              <g fill={inkColor} stroke={inkColor} strokeWidth="1.4">
                                <circle cx="-2" cy="-3" r="2.2" />
                                <path d="M 0 -2 Q 3 -1 3.5 -4 L -1 9" fill="none" />
                              </g>
                            )}
                          </g>
                        ))}

                        {/* Horizontal Beams (Primary + Secondary 16th/32nd Beams + Triplet '3') */}
                        {data.beamGroups.map((bg, bgIdx) => {
                          const first = bg.clusters[0]
                          const last = bg.clusters[bg.clusters.length - 1]
                          const dir = bg.isStemUp ? 1 : -1 // inward offset for 2nd/3rd beam
                          const dxTotal = Math.max(1, last.stemX - first.stemX)
                          const beamYAt = (xPos: number) =>
                            bg.yStart + ((xPos - first.stemX) / dxTotal) * (bg.yEnd - bg.yStart)

                          // Build secondary beam segments (for 16th & 32nd notes)
                          const secondaryBeams: { x1: number; y1: number; x2: number; y2: number; level: number }[] = []
                          for (let level = 2; level <= bg.maxBeams; level++) {
                            let segStart = -1
                            for (let i = 0; i < bg.clusters.length; i++) {
                              const hasLvl = bg.clusters[i].rhythm.beams >= level
                              if (hasLvl && segStart === -1) segStart = i
                              if ((!hasLvl || i === bg.clusters.length - 1) && segStart !== -1) {
                                const segEnd = hasLvl ? i : i - 1
                                const offset = dir * (level - 1) * 5.2
                                if (segStart === segEnd) {
                                  // Single 16th attached to an 8th (e.g. dotted-8th + 16th): draw crisp 8px beamlet
                                  const c = bg.clusters[segStart]
                                  const stubDir = segStart === bg.clusters.length - 1 ? -1 : 1
                                  const x1 = c.stemX
                                  const x2 = c.stemX + stubDir * 8.5
                                  secondaryBeams.push({
                                    x1,
                                    y1: beamYAt(x1) + offset,
                                    x2,
                                    y2: beamYAt(x2) + offset,
                                    level,
                                  })
                                } else {
                                  const c1 = bg.clusters[segStart]
                                  const c2 = bg.clusters[segEnd]
                                  secondaryBeams.push({
                                    x1: c1.stemX,
                                    y1: beamYAt(c1.stemX) + offset,
                                    x2: c2.stemX,
                                    y2: beamYAt(c2.stemX) + offset,
                                    level,
                                  })
                                }
                                segStart = -1
                              }
                            }
                          }

                          const midX = (first.stemX + last.stemX) / 2
                          const midBeamY = (bg.yStart + bg.yEnd) / 2

                          return (
                            <g key={`beam-${hand}-${mNum}-${bgIdx}`}>
                              {/* Primary 8th-note beam */}
                              <line
                                x1={first.stemX - 0.6}
                                y1={bg.yStart}
                                x2={last.stemX + 0.6}
                                y2={bg.yEnd}
                                stroke={bg.color}
                                strokeWidth="3.5"
                                strokeLinecap="butt"
                              />
                              {/* Secondary 16th / 32nd beams */}
                              {secondaryBeams.map((sb, sIdx) => (
                                <line
                                  key={`sbeam-${sIdx}`}
                                  x1={sb.x1}
                                  y1={sb.y1}
                                  x2={sb.x2}
                                  y2={sb.y2}
                                  stroke={bg.color}
                                  strokeWidth="2.8"
                                  strokeLinecap="butt"
                                />
                              ))}
                              {/* Triplet numeral '3' */}
                              {bg.isTriplet && (
                                <text
                                  x={midX}
                                  y={bg.isStemUp ? midBeamY - 5 : midBeamY + 12}
                                  fontSize="9.5"
                                  fontFamily="serif"
                                  fontStyle="italic"
                                  fontWeight="bold"
                                  fill={bg.color}
                                  textAnchor="middle"
                                >
                                  3
                                </text>
                              )}
                            </g>
                          )
                        })}

                        {/* Individual Voice Clusters: Stems, Unbeamed Flags, Noteheads, Dots, Accidentals & Fingerings */}
                        {data.clusters.map((cluster) => {
                          const isBeamed = data.beamedClusterIds.has(cKey(cluster))
                          const hasDisplacedRight = cluster.notes.some((n) => n.xOffset > 0)
                          const dotBaseX = cluster.x + (hasDisplacedRight ? 18 : 9.2)

                          return (
                            <g key={`vc-${hand}-${mNum}-${cluster.voice}-${cluster.tKey}`}>
                              {/* Awaited target pointer (positioned cleanly above measure # and fingerings) */}
                              {cluster.isExpected &&
                                (hand === 'right' || !columns[cluster.colIndex]?.right.length) && (
                                  <g>
                                    <polygon
                                      points={`${cluster.x},${TREBLE_TOP_Y - 22} ${cluster.x - 4},${TREBLE_TOP_Y - 29} ${cluster.x + 4},${TREBLE_TOP_Y - 29}`}
                                      fill="#f59e0b"
                                    />
                                    <text
                                      x={cluster.x}
                                      y={TREBLE_TOP_Y - 31.5}
                                      fontSize="8"
                                      fontWeight="900"
                                      fontFamily="sans-serif"
                                      fill="#f59e0b"
                                      textAnchor="middle"
                                    >
                                      WAIT
                                    </text>
                                  </g>
                                )}

                              {/* Stem (omitted for whole notes) */}
                              {cluster.rhythm.hasStem && (
                                <line
                                  x1={cluster.stemX}
                                  y1={cluster.stemStartY}
                                  x2={cluster.stemX}
                                  y2={cluster.stemEndY}
                                  stroke={cluster.color}
                                  strokeWidth="1.35"
                                />
                              )}

                              {/* Unbeamed Flags (Single 8th, Double 16th, Triple 32nd!) */}
                              {!isBeamed && cluster.rhythm.beams > 0 && (
                                <g>
                                  {Array.from({ length: cluster.rhythm.beams }).map((_, fIdx) => {
                                    const fOff = (cluster.isStemUp ? 1 : -1) * fIdx * 5.8
                                    const sy = cluster.stemEndY + fOff
                                    return (
                                      <path
                                        key={`flag-${fIdx}`}
                                        d={
                                          cluster.isStemUp
                                            ? `M ${cluster.stemX} ${sy} C ${cluster.stemX + 5.5} ${sy + 4}, ${cluster.stemX + 8.5} ${sy + 9.5}, ${cluster.stemX + 2.5} ${sy + 15}`
                                            : `M ${cluster.stemX} ${sy} C ${cluster.stemX + 5.5} ${sy - 4}, ${cluster.stemX + 8.5} ${sy - 9.5}, ${cluster.stemX + 2.5} ${sy - 15}`
                                        }
                                        fill="none"
                                        stroke={cluster.color}
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                      />
                                    )
                                  })}
                                </g>
                              )}

                              {/* Noteheads, Ledger Lines, Accidentals, Augmentation Dots & Fingerings */}
                              {cluster.notes.map((pn, nIdx) => {
                                const nx = cluster.x + pn.xOffset
                                const ny = pn.y
                                const ledgers = getLedgerLines(ny, hand)
                                const isWholeNote = pn.rhythm.kind === 'whole'
                                const isHollow = pn.rhythm.hollow
                                // Augmentation dot shifts into adjacent space when note sits directly on a staff line
                                const distFromTop = ny - topY
                                const isOnLine = Math.abs(Math.round(distFromTop / LINE_SPACING) * LINE_SPACING - distFromTop) < 1.2
                                const dotY = isOnLine ? ny - 3.2 : ny

                                return (
                                  <g key={`note-${pn.note.id}`}>
                                    {/* Ledger Lines */}
                                    {ledgers.map((ly, lIdx) => (
                                      <line
                                        key={`leg-${pn.note.id}-${lIdx}`}
                                        x1={nx - 8.5}
                                        y1={ly}
                                        x2={nx + 8.5}
                                        y2={ly}
                                        stroke={staveLineColor}
                                        strokeWidth="1.25"
                                      />
                                    ))}

                                    {/* Accidental (♯, ♭, ♮) — staggered automatically to prevent chord overlaps */}
                                    {pn.accidental && (
                                      <text
                                        x={cluster.x + pn.accidentalXOffset}
                                        y={ny + 4.3}
                                        fontSize="13.5"
                                        fontWeight="bold"
                                        fill={cluster.color}
                                        fontFamily="serif"
                                        textAnchor="end"
                                      >
                                        {pn.accidental}
                                      </text>
                                    )}

                                    {/* Pulsing halo around awaited notehead */}
                                    {cluster.isExpected && expectedNotes.includes(pn.note.midi) && (
                                      <ellipse
                                        cx={nx}
                                        cy={ny}
                                        rx="8.5"
                                        ry="6.5"
                                        fill="none"
                                        stroke="#f59e0b"
                                        strokeWidth="2.2"
                                        opacity="0.9"
                                      />
                                    )}

                                    {/* Authentic Whole vs Half vs Quarter/8th/16th Notehead */}
                                    {isWholeNote ? (
                                      <g>
                                        <ellipse
                                          cx={nx}
                                          cy={ny}
                                          rx="6.2"
                                          ry="4.2"
                                          fill={pageBgColor}
                                          stroke={cluster.color}
                                          strokeWidth="1.8"
                                        />
                                        <ellipse
                                          cx={nx}
                                          cy={ny}
                                          rx="2.6"
                                          ry="3.1"
                                          transform={`rotate(24 ${nx} ${ny})`}
                                          fill={pageBgColor}
                                          stroke={cluster.color}
                                          strokeWidth="1.1"
                                        />
                                      </g>
                                    ) : (
                                      <ellipse
                                        cx={nx}
                                        cy={ny}
                                        rx="5.2"
                                        ry="3.6"
                                        transform={`rotate(-22 ${nx} ${ny})`}
                                        fill={isHollow ? pageBgColor : cluster.color}
                                        stroke={cluster.color}
                                        strokeWidth={isHollow ? '1.7' : '0'}
                                      />
                                    )}

                                    {/* Augmentation Dot (.) for dotted half, dotted quarter, dotted eighth */}
                                    {pn.rhythm.dots > 0 && (
                                      <circle cx={dotBaseX} cy={dotY} r="1.95" fill={cluster.color} />
                                    )}

                                    {/* Staccato Dot */}
                                    {pn.note.isStaccato && nIdx === (cluster.isStemUp ? 0 : cluster.notes.length - 1) && (
                                      <circle
                                        cx={nx}
                                        cy={cluster.isStemUp ? ny + 8.5 : ny - 8.5}
                                        r="1.7"
                                        fill={cluster.color}
                                      />
                                    )}

                                    {/* Fingering Number (1–5) on outer note of chord, cleanly separated from stems & Ped. line */}
                                    {showFingering &&
                                      pn.note.finger &&
                                      ((hand === 'right' && nIdx === cluster.notes.length - 1 && cluster.voice === 1) ||
                                        (hand === 'left' && nIdx === 0)) && (
                                        <text
                                          x={nx}
                                          y={
                                            hand === 'right'
                                              ? Math.min(TREBLE_TOP_Y - 6, ny - 10)
                                              : Math.min(PEDAL_Y - 5, Math.max(BASS_BOTTOM_Y + 13, ny + 14))
                                          }
                                          fontSize="8.5"
                                          fontFamily="sans-serif"
                                          fontWeight="700"
                                          fill={isDark ? '#38bdf8' : '#0369a1'}
                                          textAnchor="middle"
                                        >
                                          {pn.note.finger}
                                        </text>
                                      )}
                                  </g>
                                )
                              })}
                            </g>
                          )
                        })}
                      </g>
                    )
                  }

                  return (
                    <g
                      key={`meas-${mNum}`}
                      className="cursor-pointer"
                      onClick={() => {
                        if (sortedNotes[0]) onSeek(sortedNotes[0].startTime)
                      }}
                    >
                      {/* Loop Range Highlight & Bracket */}
                      {isLooping && loopRange && mNum >= loopRange[0] && mNum <= loopRange[1] && (
                        <g>
                          <rect
                            x={mStartX}
                            y={TREBLE_TOP_Y - 12}
                            width={measureWidth}
                            height={BASS_BOTTOM_Y - TREBLE_TOP_Y + 20}
                            fill={isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)'}
                            stroke={isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)'}
                            strokeWidth="1"
                            strokeDasharray="4 2"
                            rx="4"
                          />
                          {mNum === loopRange[0] && (
                            <text
                              x={mStartX + 4}
                              y={TREBLE_TOP_Y - 14}
                              fill="#3b82f6"
                              fontFamily="monospace"
                              fontSize="8"
                              fontWeight="bold"
                            >
                              ⟲ LOOP START
                            </text>
                          )}
                          {mNum === loopRange[1] && (
                            <text
                              x={mEndX - 4}
                              y={TREBLE_TOP_Y - 14}
                              fill="#3b82f6"
                              fontFamily="monospace"
                              fontSize="8"
                              fontWeight="bold"
                              textAnchor="end"
                            >
                              LOOP END ⟲
                            </text>
                          )}
                        </g>
                      )}

                      {/* Designated Start Measure Badge */}
                      {mNum === startMeasure && (
                        <g>
                          <rect
                            x={mStartX + 2}
                            y={TREBLE_TOP_Y - 52}
                            width={68}
                            height={15}
                            rx={4}
                            fill="#f59e0b"
                          />
                          <text
                            x={mStartX + 36}
                            y={TREBLE_TOP_Y - 41.5}
                            fill="#09090b"
                            fontFamily="monospace"
                            fontSize="8.5"
                            fontWeight="900"
                            textAnchor="middle"
                          >
                            ★ START M.{mNum}
                          </text>
                        </g>
                      )}

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

                      {/* Measure Number Touch Target */}
                      <g
                        onClick={(e) => {
                          e.stopPropagation()
                          onStartMeasureChange?.(mNum)
                          if (sortedNotes[0]) onSeek(sortedNotes[0].startTime)
                        }}
                        className="cursor-pointer"
                      >
                        <rect
                          x={mStartX}
                          y={TREBLE_TOP_Y - 24}
                          width={34}
                          height={20}
                          rx={4}
                          fill={mNum === startMeasure ? 'rgba(245, 158, 11, 0.18)' : 'transparent'}
                        />
                        <text
                          x={mStartX + 5}
                          y={TREBLE_TOP_Y - 10}
                          fill={mNum === startMeasure ? '#f59e0b' : dimInkColor}
                          fontFamily="monospace"
                          fontSize="10"
                          fontWeight={mNum === startMeasure ? '900' : 'bold'}
                        >
                          {mNum}
                        </text>
                      </g>

                      {/* Tempo Heading Above Staff (e.g. Andantino, Lento, Moderato) */}
                      {marking?.tempo && (
                        <text
                          x={mStartX + (mNum === startMeasure ? 76 : 26)}
                          y={TREBLE_TOP_Y - 26}
                          fontSize="12"
                          fontFamily="serif"
                          fontWeight="800"
                          fill={inkColor}
                        >
                          {marking.tempo}
                        </text>
                      )}

                      {/* Mid-Piece Time Signature Change (e.g. 6/4 at Ballade M. 8!) */}
                      {showMeterChange && (
                        <g fill={inkColor} fontFamily="serif" fontWeight="900" fontSize="15" textAnchor="middle">
                          <text x={mStartX + 12} y={TREBLE_TOP_Y + LINE_SPACING * 1.7}>
                            {curTs[0]}
                          </text>
                          <text x={mStartX + 12} y={TREBLE_TOP_Y + LINE_SPACING * 3.7}>
                            {curTs[1]}
                          </text>
                          <text x={mStartX + 12} y={BASS_TOP_Y + LINE_SPACING * 1.7}>
                            {curTs[0]}
                          </text>
                          <text x={mStartX + 12} y={BASS_TOP_Y + LINE_SPACING * 3.7}>
                            {curTs[1]}
                          </text>
                        </g>
                      )}

                      {/* Mid-System Clef Change Glyphs */}
                      {showRightClefChange && (
                        rightClef === 'treble' ? (
                          <g transform={`translate(${mStartX + 4}, ${TREBLE_TOP_Y - 22}) scale(0.72)`} fill={inkColor}>
                            <path d={G_CLEF_PATH} />
                          </g>
                        ) : (
                          <g transform={`translate(${mStartX + 5}, ${TREBLE_TOP_Y + 7}) scale(0.78)`} fill={inkColor}>
                            <path d={F_CLEF_PATH} />
                          </g>
                        )
                      )}
                      {showLeftClefChange && (
                        leftClef === 'treble' ? (
                          <g transform={`translate(${mStartX + 4}, ${BASS_TOP_Y - 22}) scale(0.72)`} fill={inkColor}>
                            <path d={G_CLEF_PATH} />
                          </g>
                        ) : (
                          <g transform={`translate(${mStartX + 5}, ${BASS_TOP_Y + 7}) scale(0.78)`} fill={inkColor}>
                            <path d={F_CLEF_PATH} />
                          </g>
                        )
                      )}

                      {/* Barlines */}
                      {isLastOfPiece ? (
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

                      {/* Authentic Dynamic & Expression Markings (between the two staves) */}
                      {(marking?.dynamic || marking?.expression) && (
                        <text
                          x={mStartX + (showMeterChange ? 26 : 10)}
                          y={INTER_STAFF_MID_Y + 4}
                          fontSize="11.5"
                          fontFamily="serif"
                          fontStyle="italic"
                          fontWeight="800"
                          fill={isDark ? '#fbbf24' : '#854d0e'}
                        >
                          {marking.dynamic || ''}
                          {marking.dynamic && marking.expression ? ' ' : ''}
                          {marking.expression ? (
                            <tspan fontWeight="600" fontSize="10.5">
                              {marking.expression}
                            </tspan>
                          ) : null}
                        </text>
                      )}

                      {/* Decrescendo / Crescendo Hairpins */}
                      {marking?.hairpin === 'decresc' && (
                        <path
                          d={`M ${mStartX + 18} ${INTER_STAFF_MID_Y - 4} L ${mEndX - 14} ${INTER_STAFF_MID_Y + 1} L ${mStartX + 18} ${INTER_STAFF_MID_Y + 6}`}
                          fill="none"
                          stroke={isDark ? '#fbbf24' : '#854d0e'}
                          strokeWidth="1.2"
                        />
                      )}
                      {marking?.hairpin === 'cresc' && (
                        <path
                          d={`M ${mEndX - 14} ${INTER_STAFF_MID_Y - 4} L ${mStartX + 18} ${INTER_STAFF_MID_Y + 1} L ${mEndX - 14} ${INTER_STAFF_MID_Y + 6}`}
                          fill="none"
                          stroke={isDark ? '#fbbf24' : '#854d0e'}
                          strokeWidth="1.2"
                        />
                      )}

                      {/* Engraved Right Hand & Left Hand Notation Layers */}
                      {renderStaffLayer(rhData, 'right')}
                      {renderStaffLayer(lhData, 'left')}

                      {/* Damper Pedal Markings */}
                      {pedalsInMeasure.length > 0 && (
                        <g>
                          <text
                            x={mStartX + 10}
                            y={PEDAL_Y + 10}
                            fontFamily="serif"
                            fontStyle="italic"
                            fontWeight="bold"
                            fontSize="12"
                            fill={dimInkColor}
                          >
                            Ped.
                          </text>
                          <line
                            x1={mStartX + 38}
                            y1={PEDAL_Y + 6}
                            x2={mEndX - 14}
                            y2={PEDAL_Y + 6}
                            stroke={dimInkColor}
                            strokeWidth="1.1"
                          />
                          <text
                            x={mEndX - 8}
                            y={PEDAL_Y + 10}
                            fontFamily="serif"
                            fontSize="11"
                            fill={dimInkColor}
                            textAnchor="middle"
                          >
                            *
                          </text>
                        </g>
                      )}

                      {/* Flow Mode Real-Time Playhead Sweep */}
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
                          <circle cx={playheadX} cy={BASS_BOTTOM_Y + 12} r="3.5" fill="#f59e0b" />
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
