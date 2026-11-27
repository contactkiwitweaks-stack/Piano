import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { PianoAudioEngine } from '../audio/PianoAudioEngine'
import { MidiManager } from '../midi/MidiManager'
import { AcousticNoteRecognizer } from '../engine/AcousticNoteRecognizer'
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
  Mic,
  Layers,
  Clock,
} from 'lucide-react'

interface NoteReadingTrainerProps {
  language: LanguageCode
}

type TrainerMode = 'notes' | 'chords' | 'rhythm'
type KeySigId = 'C' | 'G' | 'D' | 'F' | 'Gm'

interface NoteTarget {
  midi: number
  noteName: string
  clef: 'treble' | 'bass'
  stepOffset: number // Diatonic step relative to C4 = 0
  accidental?: 'sharp' | 'flat' | 'natural'
  description?: string
}

interface ChordTarget {
  id: string
  labelDe: string
  labelEn: string
  category: 'interval' | 'triad'
  clef: 'treble' | 'bass'
  notes: { midi: number; stepOffset: number; accidental?: 'sharp' | 'flat' }[]
  choices: { id: string; de: string; en: string }[]
}

interface RhythmTarget {
  id: string
  beats: number
  kind: 'whole' | 'dotted-half' | 'half' | 'dotted-quarter' | 'quarter' | 'eighth' | 'sixteenth' | 'quarter-rest' | 'half-rest'
  labelDe: string
  labelEn: string
  beatsLabel: string
}

// Canonical SMuFL vector paths (renders identically crisp on iPhone Safari & Desktop — never missing glyph boxes!)
const G_CLEF_PATH =
  'M12.4,56.7 C11.5,57.8 9.9,58.5 8.4,58.3 C6.1,58.0 4.3,56.0 4.3,53.7 C4.3,51.3 6.0,49.4 8.4,49.4 C9.7,49.4 11.0,50.1 11.7,51.1 L11.9,46.8 C10.1,44.9 8.2,42.5 6.7,39.7 C4.8,36.1 3.8,32.3 3.8,28.4 C3.8,21.5 6.6,15.1 11.5,9.8 C14.3,6.8 17.5,4.3 20.8,2.5 L21.6,2.1 L21.7,3.0 C21.4,7.8 20.5,14.6 19.3,21.5 C21.5,19.3 24.1,18.0 27.0,18.0 C31.6,18.0 35.5,21.8 35.5,27.1 C35.5,33.0 30.8,38.0 24.5,38.0 C20.6,38.0 17.2,36.0 15.3,32.8 L14.7,40.1 C16.0,42.3 17.7,44.9 19.5,47.2 C21.5,49.7 23.3,52.8 23.3,56.4 C23.3,62.2 18.5,66.8 12.5,66.8 C7.0,66.8 2.5,62.8 2.0,57.3 L4.6,57.1 C5.0,61.1 8.3,64.2 12.5,64.2 C16.9,64.2 20.6,60.8 20.6,56.4 C20.6,53.4 19.2,50.8 17.5,48.6 C16.1,46.8 14.6,44.7 13.4,42.6 L12.4,56.7 Z M15.1,28.3 C16.5,32.2 19.8,35.4 24.0,35.4 C28.8,35.4 32.7,31.4 32.7,27.0 C32.7,22.9 29.5,19.9 25.8,19.9 C23.1,19.9 20.7,21.2 18.9,23.3 C17.8,24.6 16.9,26.2 15.1,28.3 Z'

const F_CLEF_PATH =
  'M4.2,8.5 C4.2,4.8 7.3,1.8 11.2,1.8 C15.0,1.8 18.1,4.7 18.3,8.4 C18.3,8.7 18.3,9.0 18.3,9.3 C18.3,15.6 13.9,22.8 5.6,30.0 L4.2,28.5 C10.9,22.6 14.8,16.5 15.1,11.5 C14.0,12.7 12.5,13.4 10.8,13.4 C7.1,13.4 4.2,10.6 4.2,8.5 Z M22.5,5.8 C22.5,4.3 23.7,3.1 25.2,3.1 C26.7,3.1 27.9,4.3 27.9,5.8 C27.9,7.3 26.7,8.5 25.2,8.5 C23.7,8.5 22.5,7.3 22.5,5.8 Z M22.5,15.2 C22.5,13.7 23.7,12.5 25.2,12.5 C26.7,12.5 27.9,13.7 27.9,15.2 C27.9,16.7 26.7,17.9 25.2,17.9 C23.7,17.9 22.5,16.7 22.5,15.2 Z'

const QUARTER_REST_PATH =
  'M -3.5 -16 L 4.5 -6.5 C 0.6 -2.2 -3.8 1.2 -3.8 4.4 C -3.8 7.6 0.8 9.6 3.6 11.8 C 0.2 10.5 -4.4 11.8 -4.4 15.0 C -4.4 17.8 -1.8 20.0 1.2 21.2 L 0.2 22.6 C -4.8 20.8 -7.8 17.2 -7.8 13.4 C -7.8 9.4 -4.0 7.2 -0.6 7.6 L -6.4 0.4 C -2.2 -3.4 1.2 -6.8 1.2 -10.2 C 1.2 -12.4 -0.6 -14.4 -4.2 -15.4 Z'

const WEAK_NOTES_KEY = 'virtuoso_sight_weak_notes_v1'

const KEY_SIGNATURES: Record<KeySigId, { label: string; sharps: string[]; flats: string[] }> = {
  C: { label: 'C-Dur (0)', sharps: [], flats: [] },
  G: { label: 'G-Dur (1♯)', sharps: ['F'], flats: [] },
  D: { label: 'D-Dur (2♯)', sharps: ['F', 'C'], flats: [] },
  F: { label: 'F-Dur (1♭)', sharps: [], flats: ['B'] },
  Gm: { label: 'g-Moll (2♭)', sharps: [], flats: ['B', 'E'] },
}

const LEVEL_1_NOTES: NoteTarget[] = [
  { midi: 60, noteName: 'C4', clef: 'treble', stepOffset: 0, description: 'Middle C (Treble anchor)' },
  { midi: 60, noteName: 'C4', clef: 'bass', stepOffset: 0, description: 'Middle C (Bass anchor)' },
  { midi: 62, noteName: 'D4', clef: 'treble', stepOffset: 1, description: 'Space below staff' },
  { midi: 64, noteName: 'E4', clef: 'treble', stepOffset: 2, description: 'Line 1 (Every Good Boy)' },
  { midi: 65, noteName: 'F4', clef: 'treble', stepOffset: 3, description: 'Space 1 (FACE)' },
  { midi: 67, noteName: 'G4', clef: 'treble', stepOffset: 4, description: 'Line 2 (Treble Clef curl)' },
  { midi: 48, noteName: 'C3', clef: 'bass', stepOffset: -7, description: 'Space 2 (All Cows Eat Grass)' },
  { midi: 50, noteName: 'D3', clef: 'bass', stepOffset: -6, description: 'Line 3' },
  { midi: 52, noteName: 'E3', clef: 'bass', stepOffset: -5, description: 'Space 3' },
  { midi: 53, noteName: 'F3', clef: 'bass', stepOffset: -4, description: 'Line 4 (Bass Clef two dots)' },
  { midi: 55, noteName: 'G3', clef: 'bass', stepOffset: -3, description: 'Space 4' },
]

const LEVEL_2_NOTES: NoteTarget[] = [
  ...LEVEL_1_NOTES,
  { midi: 69, noteName: 'A4', clef: 'treble', stepOffset: 5, description: 'Space 2' },
  { midi: 71, noteName: 'B4', clef: 'treble', stepOffset: 6, description: 'Line 3' },
  { midi: 72, noteName: 'C5', clef: 'treble', stepOffset: 7, description: 'Space 3 (Tenor C)' },
  { midi: 74, noteName: 'D5', clef: 'treble', stepOffset: 8, description: 'Line 4' },
  { midi: 76, noteName: 'E5', clef: 'treble', stepOffset: 9, description: 'Space 4' },
  { midi: 77, noteName: 'F5', clef: 'treble', stepOffset: 10, description: 'Line 5 (Top line)' },
  { midi: 57, noteName: 'A3', clef: 'bass', stepOffset: -2, description: 'Line 5 (Top line)' },
  { midi: 59, noteName: 'B3', clef: 'bass', stepOffset: -1, description: 'Space above Bass' },
  { midi: 47, noteName: 'B2', clef: 'bass', stepOffset: -8, description: 'Line 2' },
  { midi: 45, noteName: 'A2', clef: 'bass', stepOffset: -9, description: 'Space 1' },
  { midi: 43, noteName: 'G2', clef: 'bass', stepOffset: -10, description: 'Line 1 (Bottom line)' },
  { midi: 41, noteName: 'F2', clef: 'bass', stepOffset: -11, description: 'Space below Bass' },
]

const LEVEL_3_NOTES: NoteTarget[] = [
  ...LEVEL_2_NOTES,
  { midi: 66, noteName: 'F#4', clef: 'treble', stepOffset: 3, accidental: 'sharp', description: 'G/D Major F♯' },
  { midi: 73, noteName: 'C#5', clef: 'treble', stepOffset: 7, accidental: 'sharp', description: 'D Major / Ballade C♯' },
  { midi: 68, noteName: 'G#4', clef: 'treble', stepOffset: 4, accidental: 'sharp', description: 'A Minor leading tone' },
  { midi: 78, noteName: 'F#5', clef: 'treble', stepOffset: 10, accidental: 'sharp', description: 'Upper F♯' },
  { midi: 54, noteName: 'F#3', clef: 'bass', stepOffset: -4, accidental: 'sharp', description: 'Bass F♯' },
  { midi: 70, noteName: 'Bb4', clef: 'treble', stepOffset: 6, accidental: 'flat', description: 'Chopin Ballade B♭' },
  { midi: 63, noteName: 'Eb4', clef: 'treble', stepOffset: 2, accidental: 'flat', description: 'Chopin Ballade E♭' },
  { midi: 75, noteName: 'Eb5', clef: 'treble', stepOffset: 9, accidental: 'flat', description: 'Upper E♭' },
  { midi: 68, noteName: 'Ab4', clef: 'treble', stepOffset: 5, accidental: 'flat', description: 'Neapolitan A♭' },
  { midi: 46, noteName: 'Bb2', clef: 'bass', stepOffset: -8, accidental: 'flat', description: 'Bass B♭' },
  { midi: 51, noteName: 'Eb3', clef: 'bass', stepOffset: -5, accidental: 'flat', description: 'Bass E♭' },
]

const LEVEL_4_NOTES: NoteTarget[] = [
  ...LEVEL_3_NOTES,
  { midi: 79, noteName: 'G5', clef: 'treble', stepOffset: 11, description: 'Space above line 5' },
  { midi: 81, noteName: 'A5', clef: 'treble', stepOffset: 12, description: '1st Ledger Line above' },
  { midi: 83, noteName: 'B5', clef: 'treble', stepOffset: 13, description: 'Space above 1st Ledger' },
  { midi: 84, noteName: 'C6', clef: 'treble', stepOffset: 14, description: '2nd Ledger Line (High C)' },
  { midi: 40, noteName: 'E2', clef: 'bass', stepOffset: -12, description: '1st Ledger Line below Bass' },
  { midi: 38, noteName: 'D2', clef: 'bass', stepOffset: -13, description: 'Space below 1st Ledger' },
  { midi: 36, noteName: 'C2', clef: 'bass', stepOffset: -14, description: '2nd Ledger Line (Deep C)' },
]

const LEVEL_5_NOTES: NoteTarget[] = [
  ...LEVEL_4_NOTES,
  { midi: 31, noteName: 'G1', clef: 'bass', stepOffset: -17, description: 'Deep Concert Bass G1' },
  { midi: 39, noteName: 'Eb2', clef: 'bass', stepOffset: -12, accidental: 'flat', description: 'Ballade No. 1 Opening E♭2' },
  { midi: 87, noteName: 'Eb6', clef: 'treble', stepOffset: 15, accidental: 'flat', description: 'Soaring E♭6' },
  { midi: 91, noteName: 'G6', clef: 'treble', stepOffset: 18, description: '4th Ledger Line G6' },
]

const CHORD_DRILLS: ChordTarget[] = [
  {
    id: 'int-2nd',
    labelDe: 'Sekunde (C4 + D4)',
    labelEn: '2nd Interval (C4 + D4)',
    category: 'interval',
    clef: 'treble',
    notes: [
      { midi: 60, stepOffset: 0 },
      { midi: 62, stepOffset: 1 },
    ],
    choices: [
      { id: 'int-2nd', de: 'Sekunde (2te)', en: '2nd (Step)' },
      { id: 'int-3rd', de: 'Terz (3te)', en: '3rd (Skip)' },
      { id: 'int-5th', de: 'Quinte (5te)', en: '5th' },
      { id: 'int-8th', de: 'Oktave (8ve)', en: 'Octave' },
    ],
  },
  {
    id: 'int-3rd',
    labelDe: 'Terz (E4 + G4)',
    labelEn: '3rd Interval (E4 + G4)',
    category: 'interval',
    clef: 'treble',
    notes: [
      { midi: 64, stepOffset: 2 },
      { midi: 67, stepOffset: 4 },
    ],
    choices: [
      { id: 'int-2nd', de: 'Sekunde (2te)', en: '2nd' },
      { id: 'int-3rd', de: 'Terz (3te)', en: '3rd (Skip)' },
      { id: 'int-5th', de: 'Quinte (5te)', en: '5th' },
      { id: 'int-8th', de: 'Oktave (8ve)', en: 'Octave' },
    ],
  },
  {
    id: 'int-5th',
    labelDe: 'Quinte (C3 + G3)',
    labelEn: '5th Interval (C3 + G3)',
    category: 'interval',
    clef: 'bass',
    notes: [
      { midi: 48, stepOffset: -7 },
      { midi: 55, stepOffset: -3 },
    ],
    choices: [
      { id: 'int-3rd', de: 'Terz (3te)', en: '3rd' },
      { id: 'int-4th', de: 'Quarte (4te)', en: '4th' },
      { id: 'int-5th', de: 'Quinte (5te)', en: '5th' },
      { id: 'int-8th', de: 'Oktave (8ve)', en: 'Octave' },
    ],
  },
  {
    id: 'int-8th',
    labelDe: 'Oktave (G4 + G5)',
    labelEn: 'Octave (G4 + G5)',
    category: 'interval',
    clef: 'treble',
    notes: [
      { midi: 67, stepOffset: 4 },
      { midi: 79, stepOffset: 11 },
    ],
    choices: [
      { id: 'int-5th', de: 'Quinte (5te)', en: '5th' },
      { id: 'int-6th', de: 'Sexte (6te)', en: '6th' },
      { id: 'int-7th', de: 'Septime (7te)', en: '7th' },
      { id: 'int-8th', de: 'Oktave (8ve)', en: 'Octave' },
    ],
  },
  {
    id: 'triad-cmaj',
    labelDe: 'C-Dur Dreiklang (C–E–G)',
    labelEn: 'C Major Triad (C–E–G)',
    category: 'triad',
    clef: 'treble',
    notes: [
      { midi: 60, stepOffset: 0 },
      { midi: 64, stepOffset: 2 },
      { midi: 67, stepOffset: 4 },
    ],
    choices: [
      { id: 'triad-cmaj', de: 'C-Dur (C–E–G)', en: 'C Major' },
      { id: 'triad-gm', de: 'g-Moll (G–B♭–D)', en: 'G Minor' },
      { id: 'triad-dmaj', de: 'D-Dur (D–F♯–A)', en: 'D Major' },
      { id: 'triad-am', de: 'a-Moll (A–C–E)', en: 'A Minor' },
    ],
  },
  {
    id: 'triad-gm',
    labelDe: 'g-Moll Dreiklang (G–B♭–D — Ballade Nr. 1)',
    labelEn: 'G Minor Triad (G–B♭–D — Ballade No. 1)',
    category: 'triad',
    clef: 'treble',
    notes: [
      { midi: 67, stepOffset: 4 },
      { midi: 70, stepOffset: 6, accidental: 'flat' },
      { midi: 74, stepOffset: 8 },
    ],
    choices: [
      { id: 'triad-cmaj', de: 'C-Dur (C–E–G)', en: 'C Major' },
      { id: 'triad-gm', de: 'g-Moll (G–B♭–D)', en: 'G Minor' },
      { id: 'triad-dmaj', de: 'D-Dur (D–F♯–A)', en: 'D Major' },
      { id: 'triad-fmaj', de: 'F-Dur (F–A–C)', en: 'F Major' },
    ],
  },
  {
    id: 'triad-dmaj',
    labelDe: 'D-Dur Dreiklang (D–F♯–A — HTTYD)',
    labelEn: 'D Major Triad (D–F♯–A — HTTYD)',
    category: 'triad',
    clef: 'treble',
    notes: [
      { midi: 62, stepOffset: 1 },
      { midi: 66, stepOffset: 3, accidental: 'sharp' },
      { midi: 69, stepOffset: 5 },
    ],
    choices: [
      { id: 'triad-cmaj', de: 'C-Dur (C–E–G)', en: 'C Major' },
      { id: 'triad-gm', de: 'g-Moll (G–B♭–D)', en: 'G Minor' },
      { id: 'triad-dmaj', de: 'D-Dur (D–F♯–A)', en: 'D Major' },
      { id: 'triad-am', de: 'a-Moll (A–C–E)', en: 'A Minor' },
    ],
  },
]

const RHYTHM_DRILLS: RhythmTarget[] = [
  { id: 'whole', beats: 4, kind: 'whole', labelDe: 'Ganze Note', labelEn: 'Whole Note', beatsLabel: '4 Schläge' },
  { id: 'dotted-half', beats: 3, kind: 'dotted-half', labelDe: 'Punktierte Halbe', labelEn: 'Dotted Half', beatsLabel: '3 Schläge' },
  { id: 'half', beats: 2, kind: 'half', labelDe: 'Halbe Note', labelEn: 'Half Note', beatsLabel: '2 Schläge' },
  { id: 'dotted-quarter', beats: 1.5, kind: 'dotted-quarter', labelDe: 'Punktierte Viertel', labelEn: 'Dotted Quarter', beatsLabel: '1.5 Schläge' },
  { id: 'quarter', beats: 1, kind: 'quarter', labelDe: 'Viertelnote', labelEn: 'Quarter Note', beatsLabel: '1 Schlag' },
  { id: 'eighth', beats: 0.5, kind: 'eighth', labelDe: 'Achtelnote', labelEn: 'Eighth Note', beatsLabel: '½ Schlag' },
  { id: 'sixteenth', beats: 0.25, kind: 'sixteenth', labelDe: 'Sechzehntelnote', labelEn: 'Sixteenth Note', beatsLabel: '¼ Schlag' },
  { id: 'quarter-rest', beats: 1, kind: 'quarter-rest', labelDe: 'Viertelpause', labelEn: 'Quarter Rest', beatsLabel: '1 Schlag Pause' },
  { id: 'half-rest', beats: 2, kind: 'half-rest', labelDe: 'Halbe Pause', labelEn: 'Half Rest', beatsLabel: '2 Schläge Pause' },
]

export const NoteReadingTrainer: React.FC<NoteReadingTrainerProps> = ({ language }) => {
  const isDe = language === 'de'
  const [mode, setMode] = useState<TrainerMode>('notes')
  const [level, setLevel] = useState<1 | 2 | 3 | 4 | 5>(2)
  const [clefFilter, setClefFilter] = useState<'all' | 'treble' | 'bass'>('all')
  const [keySig, setKeySig] = useState<KeySigId>('C')
  const [currentTarget, setCurrentTarget] = useState<NoteTarget>(LEVEL_2_NOTES[0])
  const [currentChord, setCurrentChord] = useState<ChordTarget>(CHORD_DRILLS[0])
  const [currentRhythm, setCurrentRhythm] = useState<RhythmTarget>(RHYTHM_DRILLS[1])
  const [heldChordMidis, setHeldChordMidis] = useState<Set<number>>(new Set())

  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [lastReactionMs, setLastReactionMs] = useState<number | null>(null)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [correctAttempts, setCorrectAttempts] = useState(0)
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [showMnemonicModal, setShowMnemonicModal] = useState(false)
  const [isMicActive, setIsMicActive] = useState<boolean>(() => AcousticNoteRecognizer.getInstance().isListening)

  // Persistent Adaptive Weak-Note Memory (drills the notes you miss most!)
  const [weakCounts, setWeakCounts] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(WEAK_NOTES_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })

  const recordWeakNote = useCallback((noteName: string, wasCorrect: boolean) => {
    setWeakCounts((prev) => {
      const next = { ...prev }
      if (wasCorrect) {
        if (next[noteName]) {
          next[noteName] = Math.max(0, next[noteName] - 1)
          if (next[noteName] === 0) delete next[noteName]
        }
      } else {
        next[noteName] = Math.min(8, (next[noteName] || 0) + 2)
      }
      try {
        localStorage.setItem(WEAK_NOTES_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  // Apply selected Key Signature transformation to natural notes in Notes mode!
  const effectiveTarget = useMemo<NoteTarget>(() => {
    const ks = KEY_SIGNATURES[keySig]
    if (!ks || (ks.sharps.length === 0 && ks.flats.length === 0)) return currentTarget
    const letter = currentTarget.noteName.charAt(0).toUpperCase()
    const octave = currentTarget.noteName.slice(-1)
    if (!currentTarget.accidental && ks.sharps.includes(letter)) {
      return { ...currentTarget, midi: currentTarget.midi + 1, noteName: `${letter}#${octave}` }
    }
    if (!currentTarget.accidental && ks.flats.includes(letter)) {
      return { ...currentTarget, midi: currentTarget.midi - 1, noteName: `${letter}b${octave}` }
    }
    return currentTarget
  }, [currentTarget, keySig])

  useEffect(() => {
    if (mode === 'notes') {
      AcousticNoteRecognizer.getInstance().setTargetNotes([effectiveTarget.midi])
    } else if (mode === 'chords') {
      AcousticNoteRecognizer.getInstance().setTargetNotes(currentChord.notes.map((n) => n.midi))
    } else {
      AcousticNoteRecognizer.getInstance().clearTargetNotes()
    }
    return () => {
      AcousticNoteRecognizer.getInstance().clearTargetNotes()
    }
  }, [mode, effectiveTarget, currentChord])

  const toggleMic = async () => {
    const rec = AcousticNoteRecognizer.getInstance()
    if (rec.isListening) {
      rec.stopListening()
      setIsMicActive(false)
    } else {
      const ok = await rec.startListening()
      setIsMicActive(ok)
    }
  }

  const t = translations[language].sightReading
  const cardStartTimeRef = useRef<number>(performance.now())

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
    setFeedbackState('idle')
    setHeldChordMidis(new Set())
    cardStartTimeRef.current = performance.now()

    if (mode === 'chords') {
      let next: ChordTarget
      do {
        next = CHORD_DRILLS[Math.floor(Math.random() * CHORD_DRILLS.length)]
      } while (next.id === currentChord.id && CHORD_DRILLS.length > 1)
      setCurrentChord(next)
      return
    }

    if (mode === 'rhythm') {
      let next: RhythmTarget
      do {
        next = RHYTHM_DRILLS[Math.floor(Math.random() * RHYTHM_DRILLS.length)]
      } while (next.id === currentRhythm.id && RHYTHM_DRILLS.length > 1)
      setCurrentRhythm(next)
      return
    }

    if (pool.length === 0) return
    // Weighted Adaptive Selection: notes the user previously missed appear 3x more often!
    const weighted: NoteTarget[] = []
    pool.forEach((n) => {
      const w = 1 + (weakCounts[n.noteName] || 0)
      for (let i = 0; i < w; i++) weighted.push(n)
    })
    let next: NoteTarget
    let tries = 0
    do {
      next = weighted[Math.floor(Math.random() * weighted.length)]
      tries++
    } while (next.midi === currentTarget.midi && pool.length > 1 && tries < 8)
    setCurrentTarget(next)
  }, [mode, pool, currentTarget, currentChord, currentRhythm, weakCounts])

  const triggerCorrect = useCallback(
    (playMidis: number[]) => {
      const reactionMs = Math.round(performance.now() - cardStartTimeRef.current)
      setCorrectAttempts((prev) => prev + 1)
      setStreak((prev) => {
        const nextStreak = prev + 1
        if (nextStreak > bestStreak) setBestStreak(nextStreak)
        return nextStreak
      })
      setLastReactionMs(reactionMs)
      setFeedbackState('correct')
      playMidis.forEach((m) => PianoAudioEngine.getInstance().noteOn(m, 90))
      setTimeout(() => {
        playMidis.forEach((m) => PianoAudioEngine.getInstance().noteOff(m))
        nextCard()
      }, 480)
    },
    [bestStreak, nextCard]
  )

  const evaluateNote = useCallback(
    (midi: number) => {
      if (mode === 'rhythm') return

      if (mode === 'chords') {
        const expected = currentChord.notes.map((n) => n.midi)
        if (expected.includes(midi)) {
          PianoAudioEngine.getInstance().noteOn(midi, 88)
          setHeldChordMidis((prev) => {
            const next = new Set(prev).add(midi)
            if (expected.every((em) => next.has(em))) {
              setTotalAttempts((a) => a + 1)
              triggerCorrect(expected)
            }
            return next
          })
        } else {
          setTotalAttempts((a) => a + 1)
          setStreak(0)
          setFeedbackState('wrong')
          PianoAudioEngine.getInstance().noteOn(midi, 58)
          setTimeout(() => PianoAudioEngine.getInstance().noteOff(midi), 220)
        }
        return
      }

      setTotalAttempts((prev) => prev + 1)
      if (midi === effectiveTarget.midi) {
        recordWeakNote(currentTarget.noteName, true)
        triggerCorrect([midi])
      } else {
        recordWeakNote(currentTarget.noteName, false)
        PianoAudioEngine.getInstance().noteOn(midi, 60)
        setStreak(0)
        setFeedbackState('wrong')
        setTimeout(() => PianoAudioEngine.getInstance().noteOff(midi), 250)
      }
    },
    [mode, effectiveTarget, currentTarget, currentChord, recordWeakNote, triggerCorrect]
  )

  const evaluateChoice = (choiceId: string, correctId: string, soundMidis: number[]) => {
    setTotalAttempts((prev) => prev + 1)
    if (choiceId === correctId) {
      triggerCorrect(soundMidis)
    } else {
      setStreak(0)
      setFeedbackState('wrong')
      PianoAudioEngine.getInstance().noteOn(45, 58)
      setTimeout(() => PianoAudioEngine.getInstance().noteOff(45), 200)
    }
  }

  useEffect(() => {
    const unsub = MidiManager.getInstance().subscribe(
      (midi) => evaluateNote(midi),
      () => {},
      () => {},
      () => {}
    )
    return () => unsub()
  }, [evaluateNote])

  // Staff Geometry
  const lineSpacing = 12
  const staffHeight = lineSpacing * 4 // 48
  const trebleTopY = 56
  const trebleBottomY = trebleTopY + staffHeight // 104
  const middleCY = trebleBottomY + lineSpacing // 116
  const bassTopY = middleCY + lineSpacing // 128

  const getYForStep = (stepOffset: number): number => middleCY - stepOffset * (lineSpacing / 2)

  const getLedgerLinesForStep = (step: number): number[] => {
    const lines: number[] = []
    if (step === 0) lines.push(middleCY)
    if (step >= 12) {
      for (let s = 12; s <= step; s += 2) lines.push(middleCY - s * (lineSpacing / 2))
    }
    if (step <= -12) {
      for (let s = -12; s >= step; s -= 2) lines.push(middleCY - s * (lineSpacing / 2))
    }
    return lines
  }

  const accuracyPct = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 100
  const topWeakNotes = useMemo(
    () =>
      Object.entries(weakCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4),
    [weakCounts]
  )

  const noteColor =
    feedbackState === 'correct' ? '#34d399' : feedbackState === 'wrong' ? '#f87171' : '#f59e0b'

  const ksObj = KEY_SIGNATURES[keySig]

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-zinc-100 p-3 sm:p-5 select-none overflow-y-auto touch-pan-y">
      {/* Top Mode & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-zinc-800">
        {/* 3 Modes: Single Notes / Intervals & Chords / Rhythm & Rests */}
        <div className="flex items-center bg-zinc-900 border border-white/10 rounded-xl p-0.5 text-xs">
          {(
            [
              { id: 'notes', label: isDe ? 'Einzelnoten' : 'Notes', icon: Target },
              { id: 'chords', label: isDe ? 'Akkorde & Int.' : 'Chords & Int.', icon: Layers },
              { id: 'rhythm', label: isDe ? 'Notenwerte' : 'Rhythms', icon: Clock },
            ] as const
          ).map((m) => {
            const Icon = m.icon
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMode(m.id)
                  setFeedbackState('idle')
                  setStreak(0)
                }}
                className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                  mode === m.id ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            )
          })}
        </div>

        {/* Context Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {mode === 'notes' && (
            <>
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 text-[10px]">
                {(['all', 'treble', 'bass'] as const).map((cf) => (
                  <button
                    key={cf}
                    type="button"
                    onClick={() => setClefFilter(cf)}
                    className={`px-2 py-1 rounded-lg font-bold ${
                      clefFilter === cf ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'
                    }`}
                  >
                    {cf === 'all' ? t.clefAll : cf === 'treble' ? 'RH' : 'LH'}
                  </button>
                ))}
              </div>

              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 text-[10px]">
                {([1, 2, 3, 4, 5] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={`px-2 py-1 rounded-lg font-bold ${
                      level === lvl ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'
                    }`}
                  >
                    L{lvl}
                  </button>
                ))}
              </div>

              {/* Key Signature Selector (Includes Chopin Ballade g-Moll & HTTYD D-Dur!) */}
              <select
                value={keySig}
                onChange={(e) => setKeySig(e.target.value as KeySigId)}
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-2 py-1 text-[10px] font-mono font-bold text-amber-300 focus:outline-none"
                aria-label="Key Signature"
              >
                {Object.entries(KEY_SIGNATURES).map(([id, cfg]) => (
                  <option key={id} value={id}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </>
          )}

          <button
            type="button"
            onClick={toggleMic}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1 transition-all ${
              isMicActive
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Mic className="w-3 h-3 text-emerald-400" />
            <span>{isMicActive ? 'MIC ON' : 'MIC'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMnemonicModal(true)}
            className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-xl bg-zinc-900 border border-zinc-800"
            title={t.mnemonicGuide}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stat Badges + Weak-Note Adaptive Drilling Strip */}
      <div className="grid grid-cols-3 gap-2 my-3">
        <div className="bg-zinc-900/60 border border-zinc-800 p-2 rounded-2xl flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 flex-shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-zinc-400 truncate">{t.streak}</div>
            <div className="text-xs sm:text-sm font-bold font-mono text-white">
              {streak} <span className="text-[10px] text-zinc-500 hidden sm:inline">/ {bestStreak}</span>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 p-2 rounded-2xl flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-zinc-400 truncate">{isDe ? 'Reaktion' : 'Speed'}</div>
            <div className="text-xs sm:text-sm font-bold font-mono text-amber-300">
              {lastReactionMs !== null ? `${lastReactionMs}ms` : '—'}
            </div>
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 p-2 rounded-2xl flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-zinc-400 truncate">{t.accuracy}</div>
            <div className="text-xs sm:text-sm font-bold font-mono text-emerald-400">{accuracyPct}%</div>
          </div>
        </div>
      </div>

      {mode === 'notes' && topWeakNotes.length > 0 && (
        <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between gap-2 text-[11px]">
          <span className="text-rose-200 font-semibold truncate">
            {isDe ? 'Adaptiver Fokus (öfter geübt):' : 'Adaptive Weak-Note Focus:'}{' '}
            <strong className="font-mono text-amber-300">{topWeakNotes.map(([n]) => n).join(', ')}</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              setWeakCounts({})
              localStorage.removeItem(WEAK_NOTES_KEY)
            }}
            className="text-[10px] text-zinc-400 hover:text-white flex-shrink-0"
          >
            Reset
          </button>
        </div>
      )}

      {/* Main Engraved Vector Grand Staff SVG Canvas */}
      <div
        className={`flex-1 relative min-h-[220px] rounded-2xl border flex items-center justify-center transition-all overflow-hidden ${
          feedbackState === 'correct'
            ? 'bg-emerald-950/20 border-emerald-500/60'
            : feedbackState === 'wrong'
            ? 'bg-red-950/20 border-red-500/60'
            : 'bg-zinc-900/55 border-zinc-800'
        }`}
      >
        <svg viewBox="0 0 420 245" preserveAspectRatio="xMidYMid meet" className="w-full max-w-md h-56 sm:h-64 overflow-visible">
          {/* Grand Staff Brace & Vertical Bar */}
          <line x1="36" y1={trebleTopY} x2="36" y2={bassTopY + staffHeight} stroke="#a1a1aa" strokeWidth="2" />
          {[0, 1, 2, 3, 4].map((i) => (
            <React.Fragment key={`st-${i}`}>
              <line x1="36" y1={trebleTopY + i * lineSpacing} x2="386" y2={trebleTopY + i * lineSpacing} stroke="#52525b" strokeWidth="1.3" />
              {mode !== 'rhythm' && (
                <line x1="36" y1={bassTopY + i * lineSpacing} x2="386" y2={bassTopY + i * lineSpacing} stroke="#52525b" strokeWidth="1.3" />
              )}
            </React.Fragment>
          ))}

          {/* Crisp SMuFL Vector Clefs (Zero iOS missing-glyph boxes!) */}
          <g transform={`translate(42, ${trebleTopY - 38}) scale(1.22)`} fill="#e4e4e7">
            <path d={G_CLEF_PATH} />
          </g>
          {mode !== 'rhythm' && (
            <g transform={`translate(43, ${bassTopY + 7}) scale(1.28)`} fill="#e4e4e7">
              <path d={F_CLEF_PATH} />
            </g>
          )}

          {/* Key Signature Accidentals on Staff (in Notes mode) */}
          {mode === 'notes' && ksObj.sharps.length > 0 && (
            <g fill="#fbbf24" fontSize="18" fontFamily="serif" fontWeight="bold">
              {ksObj.sharps.length >= 1 && <text x="90" y={trebleTopY + 5}>♯</text>}
              {ksObj.sharps.length >= 2 && <text x="102" y={trebleTopY + 23}>♯</text>}
              {ksObj.sharps.length >= 1 && <text x="90" y={bassTopY + 17}>♯</text>}
              {ksObj.sharps.length >= 2 && <text x="102" y={bassTopY + 35}>♯</text>}
            </g>
          )}
          {mode === 'notes' && ksObj.flats.length > 0 && (
            <g fill="#38bdf8" fontSize="19" fontFamily="serif" fontWeight="bold">
              {ksObj.flats.length >= 1 && <text x="90" y={trebleTopY + 30}>♭</text>}
              {ksObj.flats.length >= 2 && <text x="102" y={trebleTopY + 12}>♭</text>}
              {ksObj.flats.length >= 1 && <text x="90" y={bassTopY + 42}>♭</text>}
              {ksObj.flats.length >= 2 && <text x="102" y={bassTopY + 24}>♭</text>}
            </g>
          )}

          {/* MODE 1: SINGLE NOTE */}
          {mode === 'notes' && (() => {
            const noteY = getYForStep(currentTarget.stepOffset)
            const ledgers = getLedgerLinesForStep(currentTarget.stepOffset)
            const stemUp = currentTarget.clef === 'treble' ? currentTarget.stepOffset < 6 : currentTarget.stepOffset < -6
            return (
              <g>
                {ledgers.map((ly, i) => (
                  <line key={`ll-${i}`} x1="192" y1={ly} x2="238" y2={ly} stroke="#a1a1aa" strokeWidth="1.8" />
                ))}
                {currentTarget.accidental && (
                  <text x="190" y={noteY + 6} fontSize="22" fill={noteColor} fontFamily="serif" fontWeight="bold">
                    {currentTarget.accidental === 'sharp' ? '♯' : currentTarget.accidental === 'flat' ? '♭' : '♮'}
                  </text>
                )}
                <ellipse cx="215" cy={noteY} rx="8.5" ry="6.2" transform={`rotate(-22 215 ${noteY})`} fill={noteColor} />
                <line
                  x1={stemUp ? 223 : 207}
                  y1={noteY}
                  x2={stemUp ? 223 : 207}
                  y2={stemUp ? noteY - 38 : noteY + 38}
                  stroke={noteColor}
                  strokeWidth="2"
                />
              </g>
            )
          })()}

          {/* MODE 2: INTERVALS & CHORDS (With Proper Second-Interval Displacement!) */}
          {mode === 'chords' && (() => {
            const sorted = [...currentChord.notes].sort((a, b) => a.stepOffset - b.stepOffset)
            const ys = sorted.map((n) => getYForStep(n.stepOffset))
            const highY = Math.min(...ys)
            const lowY = Math.max(...ys)
            const stemUp = currentChord.clef === 'treble'
            return (
              <g>
                <line
                  x1={stemUp ? 223 : 207}
                  y1={stemUp ? lowY : highY}
                  x2={stemUp ? 223 : 207}
                  y2={stemUp ? highY - 38 : lowY + 38}
                  stroke={noteColor}
                  strokeWidth="2"
                />
                {sorted.map((cn, idx) => {
                  const y = getYForStep(cn.stepOffset)
                  const isSecondCollide = idx > 0 && cn.stepOffset - sorted[idx - 1].stepOffset === 1
                  const cx = 215 + (isSecondCollide ? 15 : 0)
                  const hit = heldChordMidis.has(cn.midi)
                  const col = hit ? '#34d399' : noteColor
                  return (
                    <g key={cn.midi}>
                      {getLedgerLinesForStep(cn.stepOffset).map((ly, li) => (
                        <line key={`cl-${li}`} x1={cx - 15} y1={ly} x2={cx + 15} y2={ly} stroke="#a1a1aa" strokeWidth="1.6" />
                      ))}
                      {cn.accidental && (
                        <text x={188 - idx * 8} y={y + 6} fontSize="20" fill={col} fontFamily="serif" fontWeight="bold">
                          {cn.accidental === 'sharp' ? '♯' : '♭'}
                        </text>
                      )}
                      <ellipse cx={cx} cy={y} rx="8.5" ry="6.2" transform={`rotate(-22 ${cx} ${y})`} fill={col} />
                    </g>
                  )
                })}
              </g>
            )
          })()}

          {/* MODE 3: RHYTHM VALUES & RESTS */}
          {mode === 'rhythm' && (() => {
            const cy = trebleTopY + lineSpacing * 2 // Middle line B4
            const k = currentRhythm.kind
            const isHollow = k === 'whole' || k === 'half' || k === 'dotted-half'
            const isDotted = k === 'dotted-half' || k === 'dotted-quarter'
            const hasStem = k !== 'whole' && k !== 'quarter-rest' && k !== 'half-rest'
            return (
              <g>
                {k === 'quarter-rest' && (
                  <g transform={`translate(215, ${cy})`}>
                    <path d={QUARTER_REST_PATH} fill={noteColor} />
                  </g>
                )}
                {k === 'half-rest' && (
                  <rect x="204" y={cy - 7} width="22" height="7" fill={noteColor} />
                )}
                {k !== 'quarter-rest' && k !== 'half-rest' && (
                  <>
                    <ellipse
                      cx="215"
                      cy={cy}
                      rx={k === 'whole' ? 11 : 9}
                      ry={k === 'whole' ? 7.2 : 6.4}
                      transform={k === 'whole' ? undefined : `rotate(-22 215 ${cy})`}
                      fill={isHollow ? '#18181b' : noteColor}
                      stroke={noteColor}
                      strokeWidth={isHollow ? '2.8' : '0'}
                    />
                    {hasStem && (
                      <line x1="223" y1={cy} x2="223" y2={cy - 44} stroke={noteColor} strokeWidth="2.2" />
                    )}
                    {isDotted && <circle cx="234" cy={cy - 5} r="3.2" fill={noteColor} />}
                    {(k === 'eighth' || k === 'sixteenth') && (
                      <path
                        d={`M 223 ${cy - 44} C 234 ${cy - 36}, 238 ${cy - 26}, 228 ${cy - 16}`}
                        fill="none"
                        stroke={noteColor}
                        strokeWidth="2.6"
                        strokeLinecap="round"
                      />
                    )}
                    {k === 'sixteenth' && (
                      <path
                        d={`M 223 ${cy - 34} C 234 ${cy - 26}, 238 ${cy - 16}, 228 ${cy - 6}`}
                        fill="none"
                        stroke={noteColor}
                        strokeWidth="2.6"
                        strokeLinecap="round"
                      />
                    )}
                  </>
                )}
              </g>
            )
          })()}
        </svg>

        {/* Bottom Prompt & Skip */}
        <div className="absolute bottom-2.5 left-4 right-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {feedbackState === 'correct' ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold truncate">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {mode === 'notes'
                  ? `${t.correct} ${effectiveTarget.noteName}`
                  : mode === 'chords'
                  ? isDe
                    ? `Richtig! ${currentChord.labelDe}`
                    : `Correct! ${currentChord.labelEn}`
                  : isDe
                  ? `Richtig! ${currentRhythm.labelDe} (${currentRhythm.beatsLabel})`
                  : `Correct! ${currentRhythm.labelEn}`}
              </span>
            ) : feedbackState === 'wrong' ? (
              <span className="flex items-center gap-1.5 text-red-400 font-bold truncate">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {mode === 'notes' ? `${t.tryAgain} (${effectiveTarget.noteName})` : isDe ? 'Nochmal versuchen!' : 'Try again!'}
              </span>
            ) : (
              <span className="text-zinc-400 flex items-center gap-1 text-[11px] truncate">
                <Music className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                {mode === 'notes'
                  ? isDe
                    ? 'Am Klavier spielen oder Taste antippen'
                    : 'Play on piano or tap key below'
                  : mode === 'chords'
                  ? isDe
                    ? 'Akkord am Klavier greifen oder Form wählen'
                    : 'Play chord on piano or choose shape'
                  : isDe
                  ? 'Welcher Noten- oder Pausenwert ist das?'
                  : 'Identify this note or rest value'}
              </span>
            )}
          </div>
          <button type="button" onClick={nextCard} className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 flex-shrink-0">
            <RefreshCw className="w-3 h-3" /> Skip
          </button>
        </div>
      </div>

      {/* Interactive Answer Controls */}
      <div className="mt-3 space-y-1.5">
        {mode === 'notes' && (
          <>
            {(level >= 3 || keySig !== 'C') && (
              <div className="grid grid-cols-5 gap-1.5 pb-1">
                {[
                  { pc: 1, label: 'C♯/D♭' },
                  { pc: 3, label: 'D♯/E♭' },
                  { pc: 6, label: 'F♯/G♭' },
                  { pc: 8, label: 'G♯/A♭' },
                  { pc: 10, label: 'A♯/B♭' },
                ].map((bk) => {
                  const isMatch = effectiveTarget.midi % 12 === bk.pc
                  return (
                    <button
                      key={bk.pc}
                      type="button"
                      onClick={() => {
                        if (isMatch) evaluateNote(effectiveTarget.midi)
                        else evaluateNote(Math.floor(effectiveTarget.midi / 12) * 12 + bk.pc)
                      }}
                      className="py-2.5 rounded-xl border bg-zinc-950 hover:bg-zinc-800 border-zinc-700 text-amber-300 text-[11px] font-mono font-bold active:scale-95 transition-all"
                    >
                      {bk.label}
                    </button>
                  )
                })}
              </div>
            )}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {(
                [
                  { letter: 'C', pc: 0 },
                  { letter: 'D', pc: 2 },
                  { letter: 'E', pc: 4 },
                  { letter: 'F', pc: 5 },
                  { letter: 'G', pc: 7 },
                  { letter: 'A', pc: 9 },
                  { letter: 'B', pc: 11 },
                ] as const
              ).map(({ letter, pc }) => {
                const isMatch = effectiveTarget.midi % 12 === pc
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => {
                      if (isMatch) evaluateNote(effectiveTarget.midi)
                      else evaluateNote(Math.floor(effectiveTarget.midi / 12) * 12 + pc)
                    }}
                    className="py-3 rounded-xl border bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-100 text-sm font-bold active:scale-95 transition-all"
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {mode === 'chords' && (
          <div className="grid grid-cols-2 gap-2">
            {currentChord.choices.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => evaluateChoice(ch.id, currentChord.id, currentChord.notes.map((n) => n.midi))}
                className="py-3 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-amber-500/50 text-xs sm:text-sm font-bold text-white active:scale-95 transition-all"
              >
                {isDe ? ch.de : ch.en}
              </button>
            ))}
          </div>
        )}

        {mode === 'rhythm' && (
          <div className="grid grid-cols-3 gap-2">
            {RHYTHM_DRILLS.slice(0, 9).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => evaluateChoice(r.id, currentRhythm.id, [60, 64, 67])}
                className="py-2.5 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-amber-500/50 text-left active:scale-95 transition-all"
              >
                <div className="text-[11px] sm:text-xs font-extrabold text-white truncate">
                  {isDe ? r.labelDe : r.labelEn}
                </div>
                <div className="text-[10px] font-mono text-amber-400">{r.beatsLabel}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mnemonic Guide Modal */}
      {showMnemonicModal && (
        <div
          onClick={() => setShowMnemonicModal(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-3 text-xs max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>{isDe ? 'Eselsbrücken & Notenwerte' : 'Sight-Reading Guide'}</span>
              </h3>
              <button type="button" onClick={() => setShowMnemonicModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-zinc-300">
              <p><strong className="text-emerald-400">Violinschlüssel:</strong> Linien <strong>E–G–H–D–F</strong> • Räume <strong>F–A–C–E</strong></p>
              <p><strong className="text-cyan-400">Bassschlüssel:</strong> Linien <strong>G–H–D–F–A</strong> • Räume <strong>A–C–E–G</strong></p>
              <p><strong className="text-amber-300">Notenwerte:</strong> Ganze (4) • Punktierte Halbe (3) • Halbe (2) • Punktierte Viertel (1.5) • Viertel (1) • Achtel (½) • Sechzehntel (¼)</p>
              <p><strong className="text-purple-300">Formen lesen:</strong> Linie→Raum = Sekunde • Linie→Linie = Terz • Gestapelte Terzen = Dreiklang!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
