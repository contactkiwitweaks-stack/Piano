import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import type { NoteEvent, Piece, PedalEvent } from '../types/music'
import type { LanguageCode } from '../i18n/translations'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface SheetMusicViewProps {
  piece: Piece
  currentTime: number
  activeNotes?: Map<number, { velocity: number; timestamp: number }>
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
 * Acoustically exact diatonic staff offset mapping.
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
  onSeek,
  isLooping = false,
  loopRange = [1, 4],
  onLoopRangeChange,
  onToggleLoop,
  showFingering = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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

  // Precomputed measure data cache to eliminate 15,000+ array sorts per second during playback
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

  // Smooth auto-scroll to keep active measure centered
  useEffect(() => {
    if (!scrollContainerRef.current) return
    const activeEl = scrollContainerRef.current.querySelector<HTMLElement>(`[data-measure="${currentMeasure}"]`)
    if (activeEl) {
      const container = scrollContainerRef.current
      const targetLeft = activeEl.offsetLeft - container.clientWidth / 2 + activeEl.clientWidth / 2
      container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })
    }
  }, [currentMeasure])

  // Precise Standard Notation Dimensions with ample headroom for high/low ledger lines
  const lineSpacing = 8.5
  const staffHeight = lineSpacing * 4 // 34px
  const trebleTopY = 56 // Line 5 (F5) - provides 56px headroom for high ledger lines up to C7 without clipping
  const trebleBottomY = trebleTopY + staffHeight // 90px: Line 1 (E4)
  const middleCY = trebleBottomY + lineSpacing // 98.5px: Middle C4 Ledger line
  const bassTopY = middleCY + lineSpacing // 107px: Line 5 (A3) of Bass
  const bassBottomY = bassTopY + staffHeight // 141px: Line 1 (G2) of Bass
  const pedalLineY = bassBottomY + 26
  const totalSvgHeight = pedalLineY + 28 // 195px total - ensures low notes down to C1 are fully visible

  const getYForNote = (note: NoteEvent): number => {
    const stepFromC4 = noteToDiatonicOffset(note.noteName, note.midi)
    return middleCY - stepFromC4 * (lineSpacing / 2)
  }

  // Scroll range virtualization: dynamically tracks user scrolling
  const [scrollRange, setScrollRange] = useState<{ minM: number; maxM: number }>({ minM: 1, maxM: 20 })

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return
    const el = scrollContainerRef.current
    const scrollLeft = el.scrollLeft
    const clientWidth = el.clientWidth
    // Average measure width is ~260px
    const startM = Math.max(1, Math.floor(scrollLeft / 260) - 2)
    const endM = Math.min(measureNumbers.length, Math.ceil((scrollLeft + clientWidth) / 260) + 4)
    setScrollRange({ minM: startM, maxM: endM })
  }, [measureNumbers.length])

  // Virtualization: render measures around current playback measure AND scroll position
  const visibleMeasures = useMemo(() => {
    const playMin = Math.max(1, currentMeasure - 4)
    const playMax = Math.min(measureNumbers.length, currentMeasure + 12)
    const minM = Math.min(playMin, scrollRange.minM)
    const maxM = Math.max(playMax, scrollRange.maxM)
    return { minM, maxM }
  }, [currentMeasure, measureNumbers.length, scrollRange])

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

  const isNoteCoveredByKeySignature = useCallback((noteName: string): boolean => {
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
  }, [keySharpsCount, keyFlatsCount])

  // Ledger line positions for any note y coordinate
  const calculateLedgerLines = (y: number): number[] => {
    const lines: number[] = []
    // Middle C
    if (Math.abs(y - middleCY) < 3.5) {
      lines.push(middleCY)
      return lines
    }
    // High treble (above Line 5 F5 at trebleTopY = 24)
    if (y < trebleTopY - 2) {
      for (let ly = trebleTopY - lineSpacing; ly >= y - 3; ly -= lineSpacing) {
        lines.push(ly)
      }
    }
    // Low bass (below Line 1 G2 at bassBottomY = 109)
    if (y > bassBottomY + 2) {
      for (let ly = bassBottomY + lineSpacing; ly <= y + 3; ly += lineSpacing) {
        lines.push(ly)
      }
    }
    return lines
  }

  return (
    <div className="w-full h-full bg-[#fdfbf7] flex flex-col select-none overflow-hidden relative border-t border-stone-200">
      {/* Scrollable Flowkey Score Canvas */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto overflow-y-hidden px-4 py-2 scroll-smooth items-center scrollbar-none"
      >
        {/* Clefs, Key Signature & Grand Staff Brace (Fixed on Left) */}
        <div className="flex-shrink-0 w-24 relative mr-1" style={{ height: totalSvgHeight }}>
          <svg className="w-full h-full pointer-events-none">
            {/* Grand Staff Curly Brace */}
            <path
              d={`M 14 ${trebleTopY} C 4 ${trebleTopY + 18}, 4 ${middleCY - 12}, 0 ${middleCY} C 4 ${middleCY + 12}, 4 ${bassBottomY - 18}, 14 ${bassBottomY}`}
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="2.5"
            />
            <line x1="16" y1={trebleTopY} x2="16" y2={bassBottomY} stroke="#1a1a1a" strokeWidth="1.5" />

            {/* Treble Stave Lines (5 lines) */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={`t-line-${i}`}
                x1="16"
                y1={trebleTopY + i * lineSpacing}
                x2="94"
                y2={trebleTopY + i * lineSpacing}
                stroke="#2a2a2a"
                strokeWidth="1.2"
              />
            ))}

            {/* Bass Stave Lines (5 lines) */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={`b-line-${i}`}
                x1="16"
                y1={bassTopY + i * lineSpacing}
                x2="94"
                y2={bassTopY + i * lineSpacing}
                stroke="#2a2a2a"
                strokeWidth="1.2"
              />
            ))}

            {/* Treble Clef (𝄞) */}
            <text
              x="20"
              y={trebleBottomY - lineSpacing * 0.3}
              fontSize="38"
              fill="#1a1a1a"
              fontFamily="serif"
              textAnchor="start"
            >
              𝄞
            </text>

            {/* Bass Clef (𝄢) */}
            <text
              x="22"
              y={bassTopY + lineSpacing * 2.8}
              fontSize="32"
              fill="#1a1a1a"
              fontFamily="serif"
              textAnchor="start"
            >
              𝄢
            </text>

            {/* Authentic Key Signature (Flats / Sharps) */}
            {keyFlatsCount > 0 && (
              <g>
                {/* Bb */}
                {keyFlatsCount >= 1 && (
                  <>
                    <text x="48" y={trebleTopY + lineSpacing * 2 + 4.5} fontSize="14" fill="#1a1a1a" fontFamily="serif">♭</text>
                    <text x="48" y={bassTopY + lineSpacing * 3 + 4.5} fontSize="14" fill="#1a1a1a" fontFamily="serif">♭</text>
                  </>
                )}
                {/* Eb */}
                {keyFlatsCount >= 2 && (
                  <>
                    <text x="55" y={trebleTopY + lineSpacing * 0.5 + 4.5} fontSize="14" fill="#1a1a1a" fontFamily="serif">♭</text>
                    <text x="55" y={bassTopY + lineSpacing * 1.5 + 4.5} fontSize="14" fill="#1a1a1a" fontFamily="serif">♭</text>
                  </>
                )}
                {/* Ab */}
                {keyFlatsCount >= 3 && (
                  <>
                    <text x="62" y={trebleTopY + lineSpacing * 2.5 + 4.5} fontSize="14" fill="#1a1a1a" fontFamily="serif">♭</text>
                    <text x="62" y={bassTopY + lineSpacing * 3.5 + 4.5} fontSize="14" fill="#1a1a1a" fontFamily="serif">♭</text>
                  </>
                )}
                {/* Db */}
                {keyFlatsCount >= 4 && (
                  <>
                    <text x="69" y={trebleTopY + lineSpacing * 1 + 4.5} fontSize="14" fill="#1a1a1a" fontFamily="serif">♭</text>
                    <text x="69" y={bassTopY + lineSpacing * 2 + 4.5} fontSize="14" fill="#1a1a1a" fontFamily="serif">♭</text>
                  </>
                )}
                {/* Gb */}
                {keyFlatsCount >= 5 && (
                  <>
                    <text x="76" y={trebleTopY + lineSpacing * 3 + 4.5} fontSize="14" fill="#1a1a1a" fontFamily="serif">♭</text>
                    <text x="76" y={bassTopY + lineSpacing * 4 + 4.5} fontSize="14" fill="#1a1a1a" fontFamily="serif">♭</text>
                  </>
                )}
              </g>
            )}

            {keySharpsCount > 0 && (
              <g>
                {/* F# */}
                {keySharpsCount >= 1 && (
                  <>
                    <text x="48" y={trebleTopY + 4} fontSize="13" fill="#1a1a1a" fontFamily="serif">♯</text>
                    <text x="48" y={bassTopY + lineSpacing * 1 + 4} fontSize="13" fill="#1a1a1a" fontFamily="serif">♯</text>
                  </>
                )}
                {/* C# */}
                {keySharpsCount >= 2 && (
                  <>
                    <text x="55" y={trebleTopY + lineSpacing * 1.5 + 4} fontSize="13" fill="#1a1a1a" fontFamily="serif">♯</text>
                    <text x="55" y={bassTopY + lineSpacing * 2.5 + 4} fontSize="13" fill="#1a1a1a" fontFamily="serif">♯</text>
                  </>
                )}
                {/* G# */}
                {keySharpsCount >= 3 && (
                  <>
                    <text x="62" y={trebleTopY - lineSpacing * 0.5 + 4} fontSize="13" fill="#1a1a1a" fontFamily="serif">♯</text>
                    <text x="62" y={bassTopY + lineSpacing * 1.5 + 4} fontSize="13" fill="#1a1a1a" fontFamily="serif">♯</text>
                  </>
                )}
                {/* D# */}
                {keySharpsCount >= 4 && (
                  <>
                    <text x="69" y={trebleTopY + lineSpacing * 1 + 4} fontSize="13" fill="#1a1a1a" fontFamily="serif">♯</text>
                    <text x="69" y={bassTopY + lineSpacing * 2 + 4} fontSize="13" fill="#1a1a1a" fontFamily="serif">♯</text>
                  </>
                )}
                {/* A# */}
                {keySharpsCount >= 5 && (
                  <>
                    <text x="76" y={trebleTopY + lineSpacing * 2.5 + 4} fontSize="13" fill="#1a1a1a" fontFamily="serif">♯</text>
                    <text x="76" y={bassTopY + lineSpacing * 3 + 4} fontSize="13" fill="#1a1a1a" fontFamily="serif">♯</text>
                  </>
                )}
              </g>
            )}

            {/* Time Signature */}
            <text
              x="82"
              y={trebleTopY + lineSpacing * 1.7}
              fontSize="16"
              fontWeight="bold"
              fill="#1a1a1a"
              fontFamily="serif"
              textAnchor="middle"
            >
              {piece.timeSignature ? piece.timeSignature[0] : 4}
            </text>
            <text
              x="82"
              y={trebleTopY + lineSpacing * 3.7}
              fontSize="16"
              fontWeight="bold"
              fill="#1a1a1a"
              fontFamily="serif"
              textAnchor="middle"
            >
              {piece.timeSignature ? piece.timeSignature[1] : 4}
            </text>

            <text
              x="82"
              y={bassTopY + lineSpacing * 1.7}
              fontSize="16"
              fontWeight="bold"
              fill="#1a1a1a"
              fontFamily="serif"
              textAnchor="middle"
            >
              {piece.timeSignature ? piece.timeSignature[0] : 4}
            </text>
            <text
              x="82"
              y={bassTopY + lineSpacing * 3.7}
              fontSize="16"
              fontWeight="bold"
              fill="#1a1a1a"
              fontFamily="serif"
              textAnchor="middle"
            >
              {piece.timeSignature ? piece.timeSignature[1] : 4}
            </text>
          </svg>
        </div>

        {/* Continuous Flowkey Measures */}
        {measureNumbers.map((mNum) => {
          const mData = measureDataMap.get(mNum)
          if (!mData) return null

          const { sortedNotes, pedalsInMeasure, mStartTime, mDuration, measureBeats, dynamicMeasureWidth } = mData
          const isCurrent = mNum === currentMeasure
          const isInLoop = isLooping && mNum >= loopRange[0] && mNum <= loopRange[1]
          const isLoopStart = isLooping && mNum === loopRange[0]
          const isLoopEnd = isLooping && mNum === loopRange[1]
          const isVisible = mNum >= visibleMeasures.minM && mNum <= visibleMeasures.maxM

          return (
            <div
              key={`measure-${mNum}`}
              data-measure={mNum}
              onClick={() => {
                if (sortedNotes[0]) {
                  onSeek(sortedNotes[0].startTime)
                }
              }}
              className={`flex-shrink-0 relative cursor-pointer transition-colors duration-150 ${
                isCurrent ? 'bg-amber-100/40' : isInLoop ? 'bg-blue-50/50' : 'hover:bg-stone-100/40'
              }`}
              style={{ width: dynamicMeasureWidth, height: totalSvgHeight }}
            >
              {/* Measure Number */}
              <div className="absolute top-1 left-2 font-mono text-[11px] font-bold text-stone-500 pointer-events-none">
                {mNum}
              </div>

              {/* FLOWKEY LOOP SELECTOR BOX & HANDLES */}
              {isInLoop && (
                <div className="absolute inset-0 border-y-2 border-stone-400/50 bg-stone-300/15 pointer-events-none z-10">
                  {isLoopStart && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onLoopRangeChange && loopRange[0] > 1) {
                          onLoopRangeChange([loopRange[0] - 1, loopRange[1]])
                        }
                      }}
                      className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-10 rounded-lg bg-stone-700/90 hover:bg-stone-900 text-white flex items-center justify-center font-bold text-xs shadow-md pointer-events-auto cursor-pointer"
                      title="Adjust loop start"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {isLoopStart && onToggleLoop && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleLoop()
                      }}
                      className="absolute left-2 -top-3 w-5 h-5 rounded-full bg-stone-800 text-stone-200 hover:text-white flex items-center justify-center font-bold text-[10px] shadow pointer-events-auto cursor-pointer"
                      title="Clear loop"
                    >
                      <X className="w-3 h-3" />
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
                      className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-10 rounded-lg bg-stone-700/90 hover:bg-stone-900 text-white flex items-center justify-center font-bold text-xs shadow-md pointer-events-auto cursor-pointer"
                      title="Adjust loop end"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              )}

              {/* ACTIVE FLOWKEY ORANGE PLAYBACK CURSOR */}
              {isCurrent && sortedNotes.length > 0 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500 via-amber-400 to-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.8)] z-20 pointer-events-none transition-all duration-75"
                  style={{
                    left: `${Math.max(
                      14,
                      Math.min(
                        dynamicMeasureWidth - 14,
                        ((currentTime - mStartTime) / mDuration) * (dynamicMeasureWidth - 40) + 20
                      )
                    )}px`,
                  }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 -ml-1 -top-1 absolute shadow-sm" />
                </div>
              )}

              <svg className="w-full h-full pointer-events-none">
                {/* Measure Bar Line */}
                <line
                  x1={dynamicMeasureWidth - 1}
                  y1={trebleTopY}
                  x2={dynamicMeasureWidth - 1}
                  y2={bassBottomY}
                  stroke="#1a1a1a"
                  strokeWidth="1.5"
                />

                {/* Treble Stave Lines (5 lines) */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={`m${mNum}-t-${i}`}
                    x1="0"
                    y1={trebleTopY + i * lineSpacing}
                    x2={dynamicMeasureWidth}
                    y2={trebleTopY + i * lineSpacing}
                    stroke="#2a2a2a"
                    strokeWidth="1.2"
                  />
                ))}

                {/* Bass Stave Lines (5 lines) */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={`m${mNum}-b-${i}`}
                    x1="0"
                    y1={bassTopY + i * lineSpacing}
                    x2={dynamicMeasureWidth}
                    y2={bassTopY + i * lineSpacing}
                    stroke="#2a2a2a"
                    strokeWidth="1.2"
                  />
                ))}

                {/* Dynamic Marking (Urtext expression between Treble and Bass staves) */}
                {(() => {
                  const avgVel = sortedNotes.length > 0 
                    ? sortedNotes.reduce((sum, n) => sum + (n.velocity || 75), 0) / sortedNotes.length 
                    : 0
                  const dyn = avgVel >= 105 ? 'ff' : avgVel >= 92 ? 'f' : avgVel >= 78 ? 'mf' : avgVel >= 64 ? 'mp' : avgVel >= 48 ? 'p' : avgVel > 0 ? 'pp' : null
                  if (!dyn) return null
                  return (
                    <text
                      x="10"
                      y={middleCY + 3.5}
                      fontSize="12"
                      fontFamily="serif"
                      fontStyle="italic"
                      fontWeight="bold"
                      fill="#854d0e"
                      textAnchor="start"
                      className="select-none pointer-events-none"
                    >
                      {dyn}
                    </text>
                  )
                })()}

                {/* Only render note SVG nodes for visible measures to maintain 120 FPS */}
                {isVisible &&
                  sortedNotes.map((note) => {
                    // Beat-based horizontal note positioning
                    let x: number
                    if (note.beat !== undefined && note.beat >= 1) {
                      const beatRatio = (note.beat - 1) / measureBeats
                      x = 24 + beatRatio * (dynamicMeasureWidth - 48)
                    } else {
                      const noteOffsetInMeasure = (note.startTime - mStartTime) / mDuration
                      x = 28 + noteOffsetInMeasure * (dynamicMeasureWidth - 56)
                    }

                    const y = getYForNote(note)

                    const isActive =
                      (activeNotes && activeNotes.has(note.midi)) ||
                      (currentTime >= note.startTime && currentTime <= note.startTime + note.duration)

                    // Standard engraving rule: notes below staff midline stem UP, notes on/above stem DOWN
                    const isTreble = y < middleCY + 4
                    const staffCenterY = isTreble ? trebleTopY + lineSpacing * 2 : bassTopY + lineSpacing * 2
                    const isStemUp = y > staffCenterY
                    const stemHeight = 26
                    const stemEndY = isStemUp ? y - stemHeight : y + stemHeight
                    const stemX = isStemUp ? x + 5.2 : x - 5.2

                    // Exact multi-ledger line calculation
                    const ledgerYList = calculateLedgerLines(y)

                    const noteColor = isActive ? '#ea580c' : '#1a1a1a'

                    // Determine if accidental is required (suppress if already defined in key signature)
                    const hasSharp = note.noteName.includes('#')
                    const hasFlat = note.noteName.includes('b')
                    const isCovered = isNoteCoveredByKeySignature(note.noteName)
                    const showSharpSymbol = hasSharp && !isCovered
                    const showFlatSymbol = hasFlat && !isCovered

                    return (
                      <g key={note.id}>
                        {/* Dynamic Ledger Lines */}
                        {ledgerYList.map((ly, lIdx) => (
                          <line
                            key={`leg-${note.id}-${lIdx}`}
                            x1={x - 8}
                            y1={ly}
                            x2={x + 8}
                            y2={ly}
                            stroke="#1a1a1a"
                            strokeWidth="1.4"
                          />
                        ))}

                        {/* Accidental sharp / flat */}
                        {showSharpSymbol && (
                          <text
                            x={x - 12}
                            y={y + 4.5}
                            fontSize="13"
                            fontWeight="bold"
                            fill={noteColor}
                            fontFamily="serif"
                          >
                            ♯
                          </text>
                        )}
                        {showFlatSymbol && (
                          <text
                            x={x - 11}
                            y={y + 3.5}
                            fontSize="13"
                            fontWeight="bold"
                            fill={noteColor}
                            fontFamily="serif"
                          >
                            ♭
                          </text>
                        )}

                        {/* Note Head */}
                        <ellipse
                          cx={x}
                          cy={y}
                          rx="5.6"
                          ry="4"
                          transform={`rotate(-20 ${x} ${y})`}
                          fill={noteColor}
                        />

                        {/* Musical Stem */}
                        <line
                          x1={stemX}
                          y1={y}
                          x2={stemX}
                          y2={stemEndY}
                          stroke={noteColor}
                          strokeWidth="1.4"
                        />

                        {/* Eighth/Sixteenth note flag */}
                        {note.duration <= 0.35 && (
                          <path
                            d={
                              isStemUp
                                ? `M ${stemX} ${stemEndY} Q ${stemX + 6} ${stemEndY + 8}, ${stemX + 8} ${stemEndY + 14}`
                                : `M ${stemX} ${stemEndY} Q ${stemX + 6} ${stemEndY - 8}, ${stemX + 8} ${stemEndY - 14}`
                            }
                            fill="none"
                            stroke={noteColor}
                            strokeWidth="1.6"
                          />
                        )}

                        {/* Fingering (Clean by default, shown only when showFingering option is enabled) */}
                        {showFingering && note.finger && (
                          <text
                            x={x}
                            y={isStemUp ? y + 13 : y - 9}
                            fontSize="9.5"
                            fontWeight="bold"
                            fill={isActive ? '#ea580c' : '#78716c'}
                            fontFamily="sans-serif"
                            textAnchor="middle"
                          >
                            {note.finger}
                          </text>
                        )}
                      </g>
                    )
                  })}

                {/* Damper Pedal Marking */}
                {pedalsInMeasure.map((_, pIdx) => {
                  return (
                    <g key={`ped-${mNum}-${pIdx}`}>
                      <text
                        x="10"
                        y={pedalLineY + 2}
                        fontSize="11"
                        fontFamily="serif"
                        fontStyle="italic"
                        fontWeight="bold"
                        fill="#57534e"
                      >
                        Ped.
                      </text>
                      <line
                        x1="36"
                        y1={pedalLineY}
                        x2={dynamicMeasureWidth - 12}
                        y2={pedalLineY}
                        stroke="#57534e"
                        strokeWidth="1.4"
                      />
                      <line
                        x1={dynamicMeasureWidth - 12}
                        y1={pedalLineY}
                        x2={dynamicMeasureWidth - 12}
                        y2={pedalLineY - 6}
                        stroke="#57534e"
                        strokeWidth="1.4"
                      />
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
