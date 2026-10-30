import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { PianoAudioEngine } from '../audio/PianoAudioEngine'
import { MidiManager } from '../midi/MidiManager'
import { translations, type LanguageCode } from '../i18n/translations'
import {
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Flame,
  Award,
  Music,
  X,
  Target,
  Trophy,
} from 'lucide-react'

interface NoteReadingTrainerProps {
  language: LanguageCode
}

interface NoteTarget {
  midi: number
  noteName: string
  clef: 'treble' | 'bass'
  stepOffset: number // Diatonic step offset from Middle C (C4 = 0)
  accidental?: 'sharp' | 'flat'
  description?: string
}

// -------------------------------------------------------------
// 5 PROGRESSIVE NOTE LEARNING LEVELS: FROM SCRATCH TO VIRTUOSO
// -------------------------------------------------------------

// Level 1: Absolute Beginner Landmarks (Scratch / Von Grund auf)
const LEVEL_1_NOTES: NoteTarget[] = [
  // Middle C Anchor
  { midi: 60, noteName: 'C4', clef: 'treble', stepOffset: 0, description: 'Middle C (Treble anchor)' },
  { midi: 60, noteName: 'C4', clef: 'bass', stepOffset: 0, description: 'Middle C (Bass anchor)' },
  // Treble C-Position (C4 – G4)
  { midi: 62, noteName: 'D4', clef: 'treble', stepOffset: 1, description: 'Space below staff' },
  { midi: 64, noteName: 'E4', clef: 'treble', stepOffset: 2, description: 'Line 1 (Every Good Boy)' },
  { midi: 65, noteName: 'F4', clef: 'treble', stepOffset: 3, description: 'Space 1 (FACE)' },
  { midi: 67, noteName: 'G4', clef: 'treble', stepOffset: 4, description: 'Line 2 (Treble Clef curl)' },
  // Bass C-Position (C3 – G3)
  { midi: 48, noteName: 'C3', clef: 'bass', stepOffset: -7, description: 'Space 2 (All Cows Eat Grass)' },
  { midi: 50, noteName: 'D3', clef: 'bass', stepOffset: -6, description: 'Line 3' },
  { midi: 52, noteName: 'E3', clef: 'bass', stepOffset: -5, description: 'Space 3' },
  { midi: 53, noteName: 'F3', clef: 'bass', stepOffset: -4, description: 'Line 4 (Bass Clef two dots)' },
  { midi: 55, noteName: 'G3', clef: 'bass', stepOffset: -3, description: 'Space 4' },
]

// Level 2: Grand Staff Diatonic Fluency (Complete 2+ Octaves Natural Notes)
const LEVEL_2_NOTES: NoteTarget[] = [
  ...LEVEL_1_NOTES,
  // Upper Treble staff
  { midi: 69, noteName: 'A4', clef: 'treble', stepOffset: 5, description: 'Space 2' },
  { midi: 71, noteName: 'B4', clef: 'treble', stepOffset: 6, description: 'Line 3' },
  { midi: 72, noteName: 'C5', clef: 'treble', stepOffset: 7, description: 'Space 3 (Tenor C)' },
  { midi: 74, noteName: 'D5', clef: 'treble', stepOffset: 8, description: 'Line 4' },
  { midi: 76, noteName: 'E5', clef: 'treble', stepOffset: 9, description: 'Space 4' },
  { midi: 77, noteName: 'F5', clef: 'treble', stepOffset: 10, description: 'Line 5 (Top line)' },
  // Lower Bass staff
  { midi: 57, noteName: 'A3', clef: 'bass', stepOffset: -2, description: 'Line 5 (Top line)' },
  { midi: 59, noteName: 'B3', clef: 'bass', stepOffset: -1, description: 'Space above Bass' },
  { midi: 47, noteName: 'B2', clef: 'bass', stepOffset: -8, description: 'Line 2' },
  { midi: 45, noteName: 'A2', clef: 'bass', stepOffset: -9, description: 'Space 1' },
  { midi: 43, noteName: 'G2', clef: 'bass', stepOffset: -10, description: 'Line 1 (Bottom line)' },
  { midi: 41, noteName: 'F2', clef: 'bass', stepOffset: -11, description: 'Space below Bass' },
]

// Level 3: Accidentals & Key Signatures (Vorzeichen: Sharps & Flats)
const LEVEL_3_NOTES: NoteTarget[] = [
  ...LEVEL_2_NOTES,
  // Sharps (F#, C#, G#)
  { midi: 66, noteName: 'F#4', clef: 'treble', stepOffset: 3, accidental: 'sharp', description: 'G Major leading key' },
  { midi: 73, noteName: 'C#5', clef: 'treble', stepOffset: 7, accidental: 'sharp', description: 'D Major 7th tone' },
  { midi: 68, noteName: 'G#4', clef: 'treble', stepOffset: 4, accidental: 'sharp', description: 'A Minor harmonic leading tone' },
  { midi: 78, noteName: 'F#5', clef: 'treble', stepOffset: 10, accidental: 'sharp', description: 'Upper F sharp' },
  { midi: 54, noteName: 'F#3', clef: 'bass', stepOffset: -4, accidental: 'sharp', description: 'Bass F sharp' },
  { midi: 56, noteName: 'G#3', clef: 'bass', stepOffset: -3, accidental: 'sharp', description: 'Für Elise LH harmony' },
  // Flats (Bb, Eb, Ab - Tony Ann ICARUS & Chopin Ballade)
  { midi: 70, noteName: 'Bb4', clef: 'treble', stepOffset: 6, accidental: 'flat', description: 'Chopin Ballade key signature' },
  { midi: 63, noteName: 'Eb4', clef: 'treble', stepOffset: 2, accidental: 'flat', description: 'Tony Ann ICARUS wave root' },
  { midi: 75, noteName: 'Eb5', clef: 'treble', stepOffset: 9, accidental: 'flat', description: 'ICARUS climax melody' },
  { midi: 68, noteName: 'Ab4', clef: 'treble', stepOffset: 5, accidental: 'flat', description: 'Abmaj7 chord tone' },
  { midi: 46, noteName: 'Bb2', clef: 'bass', stepOffset: -8, accidental: 'flat', description: 'Bass Bb foundation' },
  { midi: 51, noteName: 'Eb3', clef: 'bass', stepOffset: -5, accidental: 'flat', description: 'Bass Eb foundation' },
  { midi: 44, noteName: 'Ab2', clef: 'bass', stepOffset: -9, accidental: 'flat', description: 'Tony Ann ICARUS low bass' },
]

// Level 4: Outer Octaves & Extended Ledger Lines (Hilfslinien)
const LEVEL_4_NOTES: NoteTarget[] = [
  ...LEVEL_3_NOTES,
  // High Treble Ledger Lines (G5 to C6)
  { midi: 79, noteName: 'G5', clef: 'treble', stepOffset: 11, description: 'Space above line 5' },
  { midi: 81, noteName: 'A5', clef: 'treble', stepOffset: 12, description: '1st Ledger Line above' },
  { midi: 83, noteName: 'B5', clef: 'treble', stepOffset: 13, description: 'Space above 1st Ledger Line' },
  { midi: 84, noteName: 'C6', clef: 'treble', stepOffset: 14, description: '2nd Ledger Line (High C)' },
  { midi: 86, noteName: 'D6', clef: 'treble', stepOffset: 15, description: 'Space above 2nd Ledger' },
  { midi: 88, noteName: 'E6', clef: 'treble', stepOffset: 16, description: '3rd Ledger Line (High E)' },
  // Deep Bass Ledger Lines (E2 to C2)
  { midi: 40, noteName: 'E2', clef: 'bass', stepOffset: -12, description: '1st Ledger Line below Bass' },
  { midi: 38, noteName: 'D2', clef: 'bass', stepOffset: -13, description: 'Space below 1st Ledger' },
  { midi: 36, noteName: 'C2', clef: 'bass', stepOffset: -14, description: '2nd Ledger Line (Deep C)' },
  { midi: 35, noteName: 'B1', clef: 'bass', stepOffset: -15, description: 'Space below 2nd Ledger' },
  { midi: 33, noteName: 'A1', clef: 'bass', stepOffset: -16, description: '3rd Ledger Line (Sub-contra A)' },
]

// Level 5: Virtuoso Masterclass (Concert Repertoire Range & Rapid Sight-Reading)
const LEVEL_5_NOTES: NoteTarget[] = [
  ...LEVEL_4_NOTES,
  // Chopin Ballade No. 1 Opening & Climax notes
  { midi: 31, noteName: 'G1', clef: 'bass', stepOffset: -17, description: 'Chopin Ballade 1 Opening Note' },
  { midi: 39, noteName: 'Eb2', clef: 'bass', stepOffset: -12, accidental: 'flat', description: 'Ballade 1 opening theme sigh' },
  { midi: 28, noteName: 'E1', clef: 'bass', stepOffset: -19, description: 'Low Orchestral Bass' },
  // Tony Ann ICARUS Soaring Heights
  { midi: 87, noteName: 'Eb6', clef: 'treble', stepOffset: 15, accidental: 'flat', description: 'ICARUS apex soaring tone' },
  { midi: 91, noteName: 'G6', clef: 'treble', stepOffset: 18, description: 'Virtuoso 4th Ledger Line' },
  { midi: 96, noteName: 'C7', clef: 'treble', stepOffset: 21, description: 'Concert Grand Register C7' },
]

export const NoteReadingTrainer: React.FC<NoteReadingTrainerProps> = ({
  language,
}) => {
  const [level, setLevel] = useState<1 | 2 | 3 | 4 | 5>(2)
  const [clefFilter, setClefFilter] = useState<'all' | 'treble' | 'bass'>('all')
  const [currentTarget, setCurrentTarget] = useState<NoteTarget>(LEVEL_2_NOTES[0])
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [lastReactionMs, setLastReactionMs] = useState<number | null>(null)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [correctAttempts, setCorrectAttempts] = useState(0)
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [showMnemonicModal, setShowMnemonicModal] = useState(false)

  const t = translations[language].sightReading
  const cardStartTimeRef = useRef<number>(performance.now())

  // Filter pool based on difficulty level and selected clef
  const pool = useMemo(() => {
    let raw: NoteTarget[]
    switch (level) {
      case 1:
        raw = LEVEL_1_NOTES
        break
      case 2:
        raw = LEVEL_2_NOTES
        break
      case 3:
        raw = LEVEL_3_NOTES
        break
      case 4:
        raw = LEVEL_4_NOTES
        break
      case 5:
      default:
        raw = LEVEL_5_NOTES
        break
    }
    if (clefFilter === 'all') return raw
    return raw.filter((n) => n.clef === clefFilter)
  }, [level, clefFilter])

  const nextCard = useCallback(() => {
    if (pool.length === 0) return
    let next: NoteTarget
    do {
      next = pool[Math.floor(Math.random() * pool.length)]
    } while (next.midi === currentTarget.midi && pool.length > 1)

    setCurrentTarget(next)
    setFeedbackState('idle')
    cardStartTimeRef.current = performance.now()
  }, [pool, currentTarget])

  const evaluateNote = useCallback(
    (midi: number) => {
      const now = performance.now()
      const reactionMs = Math.round(now - cardStartTimeRef.current)
      setTotalAttempts((prev) => prev + 1)

      if (midi === currentTarget.midi) {
        // Correct Hit
        PianoAudioEngine.getInstance().noteOn(midi, 95)
        setCorrectAttempts((prev) => prev + 1)
        setStreak((prev) => {
          const nextStreak = prev + 1
          if (nextStreak > bestStreak) setBestStreak(nextStreak)
          return nextStreak
        })
        setLastReactionMs(reactionMs)
        setFeedbackState('correct')

        setTimeout(() => {
          PianoAudioEngine.getInstance().noteOff(midi)
          nextCard()
        }, 450)
      } else {
        // Wrong Hit
        PianoAudioEngine.getInstance().noteOn(midi, 60)
        setStreak(0)
        setFeedbackState('wrong')
        setTimeout(() => {
          PianoAudioEngine.getInstance().noteOff(midi)
        }, 250)
      }
    },
    [currentTarget, bestStreak, nextCard]
  )

  // Listen to MIDI Manager (Bluetooth / USB)
  useEffect(() => {
    const unsub = MidiManager.getInstance().subscribe(
      (midi) => evaluateNote(midi),
      () => {},
      () => {},
      () => {}
    )
    return () => unsub()
  }, [evaluateNote])

  // Staff Geometry Constants
  const lineSpacing = 13
  const staffHeight = lineSpacing * 4
  const trebleBottomY = 96
  const bassTopY = trebleBottomY + staffHeight + 46
  const middleCY = trebleBottomY + lineSpacing + 4

  const getYForMidiOffset = (stepOffset: number): number => {
    return middleCY - stepOffset * (lineSpacing / 2)
  }

  const noteY = getYForMidiOffset(currentTarget.stepOffset)
  const accuracyPct = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 100

  // Calculate dynamic ledger lines needed
  const ledgerLines = useMemo(() => {
    const lines: number[] = []
    const step = currentTarget.stepOffset

    // Middle C
    if (step === 0) {
      lines.push(middleCY)
    }

    // Upper Treble Ledger Lines (Step >= 12, i.e., A5 and higher)
    // Treble line 5 (F5) is step 10.
    if (step >= 12) {
      for (let s = 12; s <= step; s += 2) {
        lines.push(middleCY - s * (lineSpacing / 2))
      }
    }

    // Lower Bass Ledger Lines (Step <= -12, i.e., E2 and lower)
    // Bass line 1 (G2) is step -10.
    if (step <= -12) {
      for (let s = -12; s >= step; s -= 2) {
        lines.push(middleCY - s * (lineSpacing / 2))
      }
    }

    return lines
  }, [currentTarget.stepOffset, lineSpacing, middleCY])

  // Speed rank badge
  const speedRank = useMemo(() => {
    if (!lastReactionMs) return null
    if (lastReactionMs < 500) return { label: 'Virtuoso', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' }
    if (lastReactionMs < 850) return { label: 'Concert Artist', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' }
    if (lastReactionMs < 1300) return { label: 'Scholar', color: 'text-blue-400 border-blue-500/40 bg-blue-500/10' }
    return { label: 'Developing', color: 'text-zinc-400 border-zinc-700 bg-zinc-800' }
  }, [lastReactionMs])

  const levelDescriptions = [
    'Stage 1: Middle C & Five-Finger Landmarks (C4–G4 / C3–G3)',
    'Stage 2: Full Diatonic Grand Staff (2+ Octaves Natural Notes)',
    'Stage 3: Accidentals & Key Signatures (Sharps ♯ and Flats ♭)',
    'Stage 4: Outer Octaves & Extended Ledger Lines (C2 to C6)',
    'Stage 5: Virtuoso Masterclass (Concert Repertoire Sight-Reading)',
  ]

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-zinc-100 p-3 sm:p-5 select-none overflow-y-auto">
      {/* Top Header & Level Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif-title font-bold text-sm sm:text-base text-amber-400 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-400" />
              <span>{t.title}</span>
            </span>
            <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
              LEVEL {level} / 5
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">{levelDescriptions[level - 1]}</p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Clef Filter */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => {
                setClefFilter('all')
                setStreak(0)
              }}
              className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-colors ${
                clefFilter === 'all' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t.clefAll}
            </button>
            <button
              onClick={() => {
                setClefFilter('treble')
                setStreak(0)
              }}
              className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-colors ${
                clefFilter === 'treble' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t.clefTreble} (RH)
            </button>
            <button
              onClick={() => {
                setClefFilter('bass')
                setStreak(0)
              }}
              className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-colors ${
                clefFilter === 'bass' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t.clefBass} (LH)
            </button>
          </div>

          {/* 5-Level Progressive Selector */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 text-xs">
            {([1, 2, 3, 4, 5] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setLevel(lvl)
                  setStreak(0)
                }}
                className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-colors ${
                  level === lvl ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title={levelDescriptions[lvl - 1]}
              >
                L{lvl}
              </button>
            ))}
          </div>

          {/* Help Mnemonic Guide */}
          <button
            onClick={() => setShowMnemonicModal(true)}
            className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-xl bg-zinc-900 border border-zinc-800"
            title={t.mnemonicGuide}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Gamified Stat Badges & Speed Rank */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 my-3">
        <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 sm:p-3 rounded-2xl flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-sm">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-medium">{t.streak}</div>
            <div className="text-sm sm:text-base font-bold text-zinc-100 font-mono flex items-center gap-1">
              {streak} <span className="text-[10px] text-zinc-500">/ Best: {bestStreak}</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 sm:p-3 rounded-2xl flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
              <span>{t.reactionSpeed}</span>
              {speedRank && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${speedRank.color}`}>
                  {speedRank.label}
                </span>
              )}
            </div>
            <div
              className={`text-sm sm:text-base font-bold font-mono ${
                lastReactionMs && lastReactionMs < 700
                  ? 'text-emerald-400'
                  : lastReactionMs && lastReactionMs < 1300
                  ? 'text-amber-400'
                  : 'text-zinc-200'
              }`}
            >
              {lastReactionMs !== null ? `${lastReactionMs}ms` : '—'}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 sm:p-3 rounded-2xl flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-medium">{t.accuracy}</div>
            <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
              {accuracyPct}% <span className="text-[10px] text-zinc-500">({correctAttempts}/{totalAttempts})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Flashcard Sheet Music SVG Canvas */}
      <div
        className={`flex-1 relative min-h-[250px] rounded-2xl border flex items-center justify-center transition-all overflow-hidden ${
          feedbackState === 'correct'
            ? 'bg-emerald-950/20 border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.25)]'
            : feedbackState === 'wrong'
            ? 'bg-red-950/20 border-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.25)]'
            : 'bg-zinc-900/50 border-zinc-800'
        }`}
      >
        <svg className="w-full max-w-md h-64 overflow-visible">
          {/* Treble Staff Lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`t-${i}`}
              x1="35"
              y1={trebleBottomY - i * lineSpacing}
              x2="385"
              y2={trebleBottomY - i * lineSpacing}
              stroke="#52525b"
              strokeWidth="1.2"
            />
          ))}

          {/* Bass Staff Lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`b-${i}`}
              x1="35"
              y1={bassTopY + i * lineSpacing}
              x2="385"
              y2={bassTopY + i * lineSpacing}
              stroke="#52525b"
              strokeWidth="1.2"
            />
          ))}

          {/* Clef Glyphs */}
          <text x="45" y={trebleBottomY - lineSpacing} fill="#e4e4e7" fontSize="40" fontFamily="serif">
            𝄞
          </text>
          <text x="47" y={bassTopY + lineSpacing * 3} fill="#e4e4e7" fontSize="32" fontFamily="serif">
            𝄢
          </text>

          {/* Dynamic Ledger Lines */}
          {ledgerLines.map((ly, idx) => (
            <line
              key={`ll-${idx}`}
              x1="185"
              y1={ly}
              x2="235"
              y2={ly}
              stroke="#71717a"
              strokeWidth="1.8"
            />
          ))}

          {/* Target Note Head (Golden Oval) + Accidental Symbol */}
          <g>
            {/* Accidental Sign (Sharp ♯ or Flat ♭) */}
            {currentTarget.accidental === 'sharp' && (
              <text
                x="188"
                y={noteY + 5.5}
                fontSize="22"
                fill={feedbackState === 'correct' ? '#34d399' : feedbackState === 'wrong' ? '#f87171' : '#f59e0b'}
                fontFamily="serif"
                fontWeight="bold"
              >
                ♯
              </text>
            )}
            {currentTarget.accidental === 'flat' && (
              <text
                x="188"
                y={noteY + 4}
                fontSize="22"
                fill={feedbackState === 'correct' ? '#34d399' : feedbackState === 'wrong' ? '#f87171' : '#f59e0b'}
                fontFamily="serif"
                fontWeight="bold"
              >
                ♭
              </text>
            )}

            {/* Oval Notehead */}
            <ellipse
              cx="210"
              cy={noteY}
              rx="9"
              ry="7"
              transform={`rotate(-25 210 ${noteY})`}
              fill={feedbackState === 'correct' ? '#34d399' : feedbackState === 'wrong' ? '#f87171' : '#f59e0b'}
              stroke="#09090b"
              strokeWidth="1.5"
            />

            {/* Note Stem */}
            <line
              x1={currentTarget.clef === 'treble' ? 218 : 202}
              y1={noteY}
              x2={currentTarget.clef === 'treble' ? 218 : 202}
              y2={currentTarget.clef === 'treble' ? noteY - 36 : noteY + 36}
              stroke={feedbackState === 'correct' ? '#34d399' : feedbackState === 'wrong' ? '#f87171' : '#f59e0b'}
              strokeWidth="2"
            />
          </g>
        </svg>

        {/* Note Pedagogy & Context Hint */}
        {currentTarget.description && (
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="font-mono bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800">
              {currentTarget.clef === 'treble' ? 'Treble Clef (RH)' : 'Bass Clef (LH)'}: {currentTarget.description}
            </span>
          </div>
        )}

        {/* Immediate Result Feedback Banner */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {feedbackState === 'correct' ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" /> {t.correct} {currentTarget.noteName}
              </span>
            ) : feedbackState === 'wrong' ? (
              <span className="flex items-center gap-1.5 text-red-400 font-bold">
                <XCircle className="w-4 h-4" /> {t.tryAgain} {currentTarget.noteName}
              </span>
            ) : (
              <span className="text-zinc-400 flex items-center gap-1 text-[11px]">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                Play on Roland LX-9, acoustic piano, or tap below
              </span>
            )}
          </div>

          <button
            onClick={nextCard}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200"
          >
            <RefreshCw className="w-3 h-3" /> Skip
          </button>
        </div>
      </div>

      {/* On-Screen Touch Answer Buttons (Playable without piano) */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
            {t.tapToAnswer}
          </span>
          {currentTarget.accidental && (
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              Requires {currentTarget.accidental === 'sharp' ? 'Sharp (♯)' : 'Flat (♭)'}
            </span>
          )}
        </div>

        {/* Diatonic Buttons with Direct Accidental Options */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((letter) => {
            const isMatch = currentTarget.noteName.startsWith(letter)
            return (
              <button
                key={letter}
                onClick={() => {
                  if (isMatch) {
                    evaluateNote(currentTarget.midi)
                  } else {
                    const octave = Math.floor(currentTarget.midi / 12) - 1
                    const baseOffsets: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
                    const wrongMidi = (octave + 1) * 12 + baseOffsets[letter]
                    evaluateNote(wrongMidi)
                  }
                }}
                className={`py-3 rounded-xl border text-sm font-bold active:scale-95 transition-all shadow-sm ${
                  isMatch && feedbackState === 'correct'
                    ? 'bg-emerald-500/30 border-emerald-500 text-emerald-200'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-100'
                }`}
              >
                {letter}
              </button>
            )
          })}
        </div>
      </div>

      {/* Mnemonic Guide Modal */}
      {showMnemonicModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-4 text-xs animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>{t.mnemonicGuide} & Pedagogy</span>
              </h3>
              <button onClick={() => setShowMnemonicModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-zinc-300">
              <div>
                <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5" />
                  <span>Treble Clef (Right Hand / G-Schlüssel)</span>
                </h4>
                <p className="mt-1">• Lines (bottom to top): <strong>E – G – B – D – F</strong> (<em>Every Good Boy Does Fine</em>)</p>
                <p>• Spaces (bottom to top): <strong>F – A – C – E</strong> (Spells FACE)</p>
              </div>

              <div>
                <h4 className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5" />
                  <span>Bass Clef (Left Hand / F-Schlüssel)</span>
                </h4>
                <p className="mt-1">• Lines (bottom to top): <strong>G – B – D – F – A</strong> (<em>Good Boys Do Fine Always</em>)</p>
                <p>• Spaces (bottom to top): <strong>A – C – E – G</strong> (<em>All Cows Eat Grass</em>)</p>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1">
                <span className="font-bold text-amber-300">Core Landmark Anchors:</span>
                <p className="text-[11px] text-zinc-400">
                  • <strong>Middle C (C4)</strong> sits on its own ledger line centered exactly between Treble and Bass staves.
                </p>
                <p className="text-[11px] text-zinc-400">
                  • <strong>Treble G (G4)</strong> circles Line 2 where the treble clef curl crosses.
                </p>
                <p className="text-[11px] text-zinc-400">
                  • <strong>Bass F (F3)</strong> sits between the two dots of the Bass clef on Line 4.
                </p>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1">
                <span className="font-bold text-purple-300">Vorzeichen & Accidentals (Level 3–5):</span>
                <p className="text-[11px] text-zinc-400">
                  • <strong>Sharp (♯)</strong> raises the note by 1 semitone (one key to the right).
                </p>
                <p className="text-[11px] text-zinc-400">
                  • <strong>Flat (♭)</strong> lowers the note by 1 semitone (one key to the left), e.g. E♭ and B♭ in Chopin Ballade & Tony Ann ICARUS.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
