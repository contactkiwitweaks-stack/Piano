import type { Piece, NoteEvent, MasterclassAnnotation } from '../types/music'
import { noteToMidi } from './chopinBallade'
import { ScoreEngine } from '../engine/ScoreEngine'

export interface WarmupExercise {
  id: string
  title: string
  category: 'independence' | 'arpeggio' | 'thumb-agility' | 'coda-velocity' | 'trill'
  difficulty: number
  targetPiece: string
  description: string
  exercisePiece: Piece
}

// 1. Hanon No. 1: Finger Independence & Weight Distribution
const hanonNotes: NoteEvent[] = [
  // Measure 1: C - E - F - G - A - G - F - E
  { id: 'h1', midi: noteToMidi('C3'), noteName: 'C3', startTime: 0.0, duration: 0.35, hand: 'left', finger: 5, measure: 1, velocity: 75 },
  { id: 'h2', midi: noteToMidi('C4'), noteName: 'C4', startTime: 0.0, duration: 0.35, hand: 'right', finger: 1, measure: 1, velocity: 75 },
  { id: 'h3', midi: noteToMidi('E3'), noteName: 'E3', startTime: 0.4, duration: 0.35, hand: 'left', finger: 4, measure: 1, velocity: 75 },
  { id: 'h4', midi: noteToMidi('E4'), noteName: 'E4', startTime: 0.4, duration: 0.35, hand: 'right', finger: 2, measure: 1, velocity: 75 },
  { id: 'h5', midi: noteToMidi('F3'), noteName: 'F3', startTime: 0.8, duration: 0.35, hand: 'left', finger: 3, measure: 1, velocity: 75 },
  { id: 'h6', midi: noteToMidi('F4'), noteName: 'F4', startTime: 0.8, duration: 0.35, hand: 'right', finger: 3, measure: 1, velocity: 75 },
  { id: 'h7', midi: noteToMidi('G3'), noteName: 'G3', startTime: 1.2, duration: 0.35, hand: 'left', finger: 2, measure: 1, velocity: 75 },
  { id: 'h8', midi: noteToMidi('G4'), noteName: 'G4', startTime: 1.2, duration: 0.35, hand: 'right', finger: 4, measure: 1, velocity: 75 },
  { id: 'h9', midi: noteToMidi('A3'), noteName: 'A3', startTime: 1.6, duration: 0.35, hand: 'left', finger: 1, measure: 1, velocity: 80, isAccent: true },
  { id: 'h10', midi: noteToMidi('A4'), noteName: 'A4', startTime: 1.6, duration: 0.35, hand: 'right', finger: 5, measure: 1, velocity: 80, isAccent: true },
  { id: 'h11', midi: noteToMidi('G3'), noteName: 'G3', startTime: 2.0, duration: 0.35, hand: 'left', finger: 2, measure: 1, velocity: 75 },
  { id: 'h12', midi: noteToMidi('G4'), noteName: 'G4', startTime: 2.0, duration: 0.35, hand: 'right', finger: 4, measure: 1, velocity: 75 },
  { id: 'h13', midi: noteToMidi('F3'), noteName: 'F3', startTime: 2.4, duration: 0.35, hand: 'left', finger: 3, measure: 1, velocity: 75 },
  { id: 'h14', midi: noteToMidi('F4'), noteName: 'F4', startTime: 2.4, duration: 0.35, hand: 'right', finger: 3, measure: 1, velocity: 75 },
  { id: 'h15', midi: noteToMidi('E3'), noteName: 'E3', startTime: 2.8, duration: 0.35, hand: 'left', finger: 4, measure: 1, velocity: 75 },
  { id: 'h16', midi: noteToMidi('E4'), noteName: 'E4', startTime: 2.8, duration: 0.35, hand: 'right', finger: 2, measure: 1, velocity: 75 },

  // Measure 2: D - F - G - A - B - A - G - F
  { id: 'h17', midi: noteToMidi('D3'), noteName: 'D3', startTime: 3.2, duration: 0.35, hand: 'left', finger: 5, measure: 2, velocity: 75 },
  { id: 'h18', midi: noteToMidi('D4'), noteName: 'D4', startTime: 3.2, duration: 0.35, hand: 'right', finger: 1, measure: 2, velocity: 75 },
  { id: 'h19', midi: noteToMidi('F3'), noteName: 'F3', startTime: 3.6, duration: 0.35, hand: 'left', finger: 4, measure: 2, velocity: 75 },
  { id: 'h20', midi: noteToMidi('F4'), noteName: 'F4', startTime: 3.6, duration: 0.35, hand: 'right', finger: 2, measure: 2, velocity: 75 },
  { id: 'h21', midi: noteToMidi('G3'), noteName: 'G3', startTime: 4.0, duration: 0.35, hand: 'left', finger: 3, measure: 2, velocity: 75 },
  { id: 'h22', midi: noteToMidi('G4'), noteName: 'G4', startTime: 4.0, duration: 0.35, hand: 'right', finger: 3, measure: 2, velocity: 75 },
  { id: 'h23', midi: noteToMidi('A3'), noteName: 'A3', startTime: 4.4, duration: 0.35, hand: 'left', finger: 2, measure: 2, velocity: 75 },
  { id: 'h24', midi: noteToMidi('A4'), noteName: 'A4', startTime: 4.4, duration: 0.35, hand: 'right', finger: 4, measure: 2, velocity: 75 },
  { id: 'h25', midi: noteToMidi('B3'), noteName: 'B3', startTime: 4.8, duration: 0.35, hand: 'left', finger: 1, measure: 2, velocity: 80, isAccent: true },
  { id: 'h26', midi: noteToMidi('B4'), noteName: 'B4', startTime: 4.8, duration: 0.35, hand: 'right', finger: 5, measure: 2, velocity: 80, isAccent: true },
  { id: 'h27', midi: noteToMidi('A3'), noteName: 'A3', startTime: 5.2, duration: 0.35, hand: 'left', finger: 2, measure: 2, velocity: 75 },
  { id: 'h28', midi: noteToMidi('A4'), noteName: 'A4', startTime: 5.2, duration: 0.35, hand: 'right', finger: 4, measure: 2, velocity: 75 },
  { id: 'h29', midi: noteToMidi('G3'), noteName: 'G3', startTime: 5.6, duration: 0.35, hand: 'left', finger: 3, measure: 2, velocity: 75 },
  { id: 'h30', midi: noteToMidi('G4'), noteName: 'G4', startTime: 5.6, duration: 0.35, hand: 'right', finger: 3, measure: 2, velocity: 75 },
  { id: 'h31', midi: noteToMidi('F3'), noteName: 'F3', startTime: 6.0, duration: 0.35, hand: 'left', finger: 4, measure: 2, velocity: 75 },
  { id: 'h32', midi: noteToMidi('F4'), noteName: 'F4', startTime: 6.0, duration: 0.35, hand: 'right', finger: 2, measure: 2, velocity: 75 },

  // Final cadence chord
  { id: 'h33', midi: noteToMidi('C3'), noteName: 'C3', startTime: 6.4, duration: 2.0, hand: 'left', finger: 5, measure: 3, velocity: 80 },
  { id: 'h34', midi: noteToMidi('G3'), noteName: 'G3', startTime: 6.4, duration: 2.0, hand: 'left', finger: 1, measure: 3, velocity: 80 },
  { id: 'h35', midi: noteToMidi('E4'), noteName: 'E4', startTime: 6.4, duration: 2.0, hand: 'right', finger: 3, measure: 3, velocity: 85 },
  { id: 'h36', midi: noteToMidi('C5'), noteName: 'C5', startTime: 6.4, duration: 2.0, hand: 'right', finger: 5, measure: 3, velocity: 88, isAccent: true }
]

const hanonAnnotations: MasterclassAnnotation[] = [
  {
    id: 'hanon-ann-1',
    measureRange: [1, 2],
    title: 'Finger Independence & Weight Transfer',
    germanTerm: 'Fingerunabhängigkeit & Gewichtsausgleich',
    category: 'fingering',
    instruction: 'Keep the wrist loose and level. Do NOT stiffen your forearm when lifting the 4th and 5th fingers. Transfer arm weight smoothly from finger to finger like footsteps in snow.',
    wristGuidance: 'Slight horizontal wrist circles help release tension as you reach for the outer 5th finger note.',
    referenceTimestampSeconds: 0.0
  }
]

// 2. Cortot Ballade No. 1 Prep Drill (Thumb Pivot & 4-Note Velocity Run)
const cortotNotes: NoteEvent[] = [
  { id: 'cor1', midi: noteToMidi('G3'), noteName: 'G3', startTime: 0.0, duration: 0.22, hand: 'right', finger: 1, measure: 1, velocity: 80 },
  { id: 'cor2', midi: noteToMidi('A3'), noteName: 'A3', startTime: 0.25, duration: 0.22, hand: 'right', finger: 2, measure: 1, velocity: 82 },
  { id: 'cor3', midi: noteToMidi('Bb3'), noteName: 'Bb3', startTime: 0.5, duration: 0.22, hand: 'right', finger: 3, measure: 1, velocity: 85 },
  { id: 'cor4', midi: noteToMidi('C#4'), noteName: 'C#4', startTime: 0.75, duration: 0.22, hand: 'right', finger: 1, measure: 1, velocity: 88, isAccent: true },

  { id: 'cor5', midi: noteToMidi('D4'), noteName: 'D4', startTime: 1.0, duration: 0.22, hand: 'right', finger: 2, measure: 2, velocity: 85 },
  { id: 'cor6', midi: noteToMidi('Eb4'), noteName: 'Eb4', startTime: 1.25, duration: 0.22, hand: 'right', finger: 3, measure: 2, velocity: 88 },
  { id: 'cor7', midi: noteToMidi('F#4'), noteName: 'F#4', startTime: 1.5, duration: 0.22, hand: 'right', finger: 4, measure: 2, velocity: 92 },
  { id: 'cor8', midi: noteToMidi('G4'), noteName: 'G4', startTime: 1.75, duration: 0.45, hand: 'right', finger: 5, measure: 2, velocity: 100, isAccent: true },

  // Left hand counter leap anchor
  { id: 'cor9', midi: noteToMidi('G1'), noteName: 'G1', startTime: 0.0, duration: 0.8, hand: 'left', finger: 5, measure: 1, velocity: 90 },
  { id: 'cor10', midi: noteToMidi('G2'), noteName: 'G2', startTime: 0.0, duration: 0.8, hand: 'left', finger: 1, measure: 1, velocity: 90 },
  { id: 'cor11', midi: noteToMidi('D3'), noteName: 'D3', startTime: 1.0, duration: 0.8, hand: 'left', finger: 5, measure: 2, velocity: 85 },
  { id: 'cor12', midi: noteToMidi('Bb3'), noteName: 'Bb3', startTime: 1.0, duration: 0.8, hand: 'left', finger: 1, measure: 2, velocity: 85 }
]

const cortotAnnotations: MasterclassAnnotation[] = [
  {
    id: 'cortot-ann-1',
    measureRange: [1, 2],
    title: 'Cortot: Thumb Pivot on Black Keys',
    germanTerm: 'Daumen-Untersatz & Geschwindigkeits-Cluster',
    category: 'transition',
    instruction: 'In Chopin’s Ballade 1 Coda, the thumb tucks underneath from Bb3 directly onto the black key C#4. Prepare the thumb early by gliding it under the palm while finger 3 strikes.',
    handTechnique: 'Do not twist your elbow outward. Keep the forearm straight and let the thumb glide naturally.',
    referenceTimestampSeconds: 0.0
  }
]

// 3. Brahms 51 Exercises No. 1a: Expanding Hand Span & Arpeggiation
const brahmsNotes: NoteEvent[] = [
  { id: 'br1', midi: noteToMidi('C3'), noteName: 'C3', startTime: 0.0, duration: 0.4, hand: 'left', finger: 5, measure: 1, velocity: 75 },
  { id: 'br2', midi: noteToMidi('E3'), noteName: 'E3', startTime: 0.45, duration: 0.4, hand: 'left', finger: 4, measure: 1, velocity: 75 },
  { id: 'br3', midi: noteToMidi('G3'), noteName: 'G3', startTime: 0.9, duration: 0.4, hand: 'left', finger: 2, measure: 1, velocity: 75 },
  { id: 'br4', midi: noteToMidi('C4'), noteName: 'C4', startTime: 1.35, duration: 0.4, hand: 'left', finger: 1, measure: 1, velocity: 80 },

  { id: 'br5', midi: noteToMidi('E4'), noteName: 'E4', startTime: 0.0, duration: 0.4, hand: 'right', finger: 1, measure: 1, velocity: 78 },
  { id: 'br6', midi: noteToMidi('G4'), noteName: 'G4', startTime: 0.45, duration: 0.4, hand: 'right', finger: 2, measure: 1, velocity: 78 },
  { id: 'br7', midi: noteToMidi('C5'), noteName: 'C5', startTime: 0.9, duration: 0.4, hand: 'right', finger: 3, measure: 1, velocity: 82 },
  { id: 'br8', midi: noteToMidi('E5'), noteName: 'E5', startTime: 1.35, duration: 0.4, hand: 'right', finger: 5, measure: 1, velocity: 88, isAccent: true },

  // Measure 2: Expanded span
  { id: 'br9', midi: noteToMidi('C3'), noteName: 'C3', startTime: 1.8, duration: 1.5, hand: 'left', finger: 5, measure: 2, velocity: 85 },
  { id: 'br10', midi: noteToMidi('G3'), noteName: 'G3', startTime: 1.8, duration: 1.5, hand: 'left', finger: 2, measure: 2, velocity: 80 },
  { id: 'br11', midi: noteToMidi('C4'), noteName: 'C4', startTime: 1.8, duration: 1.5, hand: 'left', finger: 1, measure: 2, velocity: 80 },
  { id: 'br12', midi: noteToMidi('G4'), noteName: 'G4', startTime: 1.8, duration: 1.5, hand: 'right', finger: 1, measure: 2, velocity: 85 },
  { id: 'br13', midi: noteToMidi('C5'), noteName: 'C5', startTime: 1.8, duration: 1.5, hand: 'right', finger: 3, measure: 2, velocity: 90 },
  { id: 'br14', midi: noteToMidi('G5'), noteName: 'G5', startTime: 1.8, duration: 1.5, hand: 'right', finger: 5, measure: 2, velocity: 95, isAccent: true }
]

const brahmsAnnotations: MasterclassAnnotation[] = [
  {
    id: 'brahms-ann-1',
    measureRange: [1, 2],
    title: 'Brahms Span Expansion & Voicing',
    germanTerm: 'Handspannungs-Erweiterung',
    category: 'tone-color',
    instruction: 'Never force the hand to stretch with muscular tension. Open the palm from the bridge, letting the fingers breathe open naturally.',
    wristGuidance: 'Drop the wrist slightly when articulating outer chord tones.',
    referenceTimestampSeconds: 0.0
  }
]

// 4. Chopin Op. 10 No. 1: Lateral Arm Shift & Arpeggio Roll
const chopinEtudeNotes: NoteEvent[] = [
  { id: 'ch1', midi: noteToMidi('C3'), noteName: 'C3', startTime: 0.0, duration: 0.2, hand: 'right', finger: 1, measure: 1, velocity: 80 },
  { id: 'ch2', midi: noteToMidi('G3'), noteName: 'G3', startTime: 0.22, duration: 0.2, hand: 'right', finger: 2, measure: 1, velocity: 82 },
  { id: 'ch3', midi: noteToMidi('C4'), noteName: 'C4', startTime: 0.44, duration: 0.2, hand: 'right', finger: 3, measure: 1, velocity: 85 },
  { id: 'ch4', midi: noteToMidi('E4'), noteName: 'E4', startTime: 0.66, duration: 0.2, hand: 'right', finger: 5, measure: 1, velocity: 90, isAccent: true },

  { id: 'ch5', midi: noteToMidi('G4'), noteName: 'G4', startTime: 0.88, duration: 0.2, hand: 'right', finger: 1, measure: 2, velocity: 82 },
  { id: 'ch6', midi: noteToMidi('C5'), noteName: 'C5', startTime: 1.1, duration: 0.2, hand: 'right', finger: 2, measure: 2, velocity: 85 },
  { id: 'ch7', midi: noteToMidi('E5'), noteName: 'E5', startTime: 1.32, duration: 0.2, hand: 'right', finger: 3, measure: 2, velocity: 88 },
  { id: 'ch8', midi: noteToMidi('C6'), noteName: 'C6', startTime: 1.54, duration: 0.5, hand: 'right', finger: 5, measure: 2, velocity: 95, isAccent: true },

  // Bass octaves
  { id: 'ch9', midi: noteToMidi('C2'), noteName: 'C2', startTime: 0.0, duration: 1.8, hand: 'left', finger: 5, measure: 1, velocity: 90 },
  { id: 'ch10', midi: noteToMidi('C3'), noteName: 'C3', startTime: 0.0, duration: 1.8, hand: 'left', finger: 1, measure: 1, velocity: 90 }
]

const chopinEtudeAnnotations: MasterclassAnnotation[] = [
  {
    id: 'chopin-etude-ann-1',
    measureRange: [1, 2],
    title: 'Lateral Arm Transport & Wrist Wave',
    germanTerm: 'Seitlicher Armtransport & Handgelenks-Welle',
    category: 'fingering',
    instruction: 'The forearm leads the hand across the keyboard. Do not stretch fingers 1 and 2 apart; instead, let the entire arm carry the hand in a gentle wave-like arc.',
    wristGuidance: 'The wrist remains supple and elevates slightly as the 5th finger strikes the apex note.',
    referenceTimestampSeconds: 0.0
  }
]

// 5. Liszt Trill Agility Drill: 3rd & 4th Finger Independence
const lisztTrillNotes: NoteEvent[] = [
  { id: 'lz1', midi: noteToMidi('D4'), noteName: 'D4', startTime: 0.0, duration: 0.18, hand: 'right', finger: 3, measure: 1, velocity: 82 },
  { id: 'lz2', midi: noteToMidi('E4'), noteName: 'E4', startTime: 0.18, duration: 0.18, hand: 'right', finger: 4, measure: 1, velocity: 82 },
  { id: 'lz3', midi: noteToMidi('D4'), noteName: 'D4', startTime: 0.36, duration: 0.18, hand: 'right', finger: 3, measure: 1, velocity: 82 },
  { id: 'lz4', midi: noteToMidi('E4'), noteName: 'E4', startTime: 0.54, duration: 0.18, hand: 'right', finger: 4, measure: 1, velocity: 82 },
  { id: 'lz5', midi: noteToMidi('D4'), noteName: 'D4', startTime: 0.72, duration: 0.18, hand: 'right', finger: 3, measure: 1, velocity: 85 },
  { id: 'lz6', midi: noteToMidi('E4'), noteName: 'E4', startTime: 0.90, duration: 0.18, hand: 'right', finger: 4, measure: 1, velocity: 85 },
  { id: 'lz7', midi: noteToMidi('F#4'), noteName: 'F#4', startTime: 1.08, duration: 0.18, hand: 'right', finger: 5, measure: 1, velocity: 90, isAccent: true },
  { id: 'lz8', midi: noteToMidi('G4'), noteName: 'G4', startTime: 1.26, duration: 0.6, hand: 'right', finger: 5, measure: 1, velocity: 95, isAccent: true },

  // Sustained LH harmony
  { id: 'lz9', midi: noteToMidi('G2'), noteName: 'G2', startTime: 0.0, duration: 1.8, hand: 'left', finger: 5, measure: 1, velocity: 80 },
  { id: 'lz10', midi: noteToMidi('B3'), noteName: 'B3', startTime: 0.0, duration: 1.8, hand: 'left', finger: 1, measure: 1, velocity: 80 }
]

const lisztAnnotations: MasterclassAnnotation[] = [
  {
    id: 'liszt-ann-1',
    measureRange: [1, 1],
    title: 'Liszt: Rapid 3-4 Trill Agility',
    germanTerm: 'Triller-Unabhängigkeit 3. & 4. Finger',
    category: 'fingering',
    instruction: 'The 3rd and 4th fingers share common extensor tendons. Rotate the forearm lightly (rotational freedom) rather than lifting each finger exclusively by finger muscle.',
    handTechnique: 'Think of doorknob rotation rather than hammering fingers.',
    referenceTimestampSeconds: 0.0
  }
]

export const warmupsList: WarmupExercise[] = [
  {
    id: 'warmup-hanon-1',
    title: 'Hanon No. 1: Finger Independence',
    category: 'independence',
    difficulty: 3,
    targetPiece: 'Foundational Repertoire',
    description: 'Even weight distribution, strengthening the 4th and 5th fingers for cantabile voicing.',
    exercisePiece: {
      id: 'warmup-hanon-1',
      title: 'Hanon Virtuoso No. 1',
      composer: 'C.L. Hanon',
      opus: 'The Virtuoso Pianist',
      key: 'C major',
      timeSignature: [2, 4],
      tempoBpm: 80,
      duration: 8.5,
      notes: hanonNotes,
      pedalEvents: [],
      annotations: hanonAnnotations,
      sections: [
        { id: 'w-sec-1', title: 'Hanon Exercise No. 1', startMeasure: 1, endMeasure: 3, startTime: 0, endTime: 8.5, tempoSuggestion: 'Moderato - Legato', character: 'Crisp, even finger articulation' }
      ]
    }
  },
  {
    id: 'warmup-cortot-ballade',
    title: 'Cortot: Chopin Ballade 1 Run Accelerator',
    category: 'coda-velocity',
    difficulty: 8,
    targetPiece: 'Chopin Ballade No. 1 (Op. 23)',
    description: 'Thumb tucking and explosive 4-note clusters preparing for the Presto con fuoco Coda.',
    exercisePiece: {
      id: 'warmup-cortot-ballade',
      title: 'Cortot Ballade 1 Velocity Drill',
      composer: 'Alfred Cortot / F. Chopin',
      opus: 'Principes Rationnels',
      key: 'G minor',
      timeSignature: [4, 4],
      tempoBpm: 92,
      duration: 3.5,
      notes: cortotNotes,
      pedalEvents: [
        { startTime: 0.0, duration: 1.0, depth: 100, type: 'sustain', measure: 1, tip: 'Short pedal impulse on the downbeat.' }
      ],
      annotations: cortotAnnotations,
      sections: [
        { id: 'c-sec-1', title: 'Coda Cluster Velocity', startMeasure: 1, endMeasure: 2, startTime: 0, endTime: 3.5, tempoSuggestion: 'Presto con brio', character: 'Explosive agility' }
      ]
    }
  },
  {
    id: 'warmup-brahms-51',
    title: 'Brahms 51 Exercises: Hand Span Stretch',
    category: 'arpeggio',
    difficulty: 6,
    targetPiece: 'Brahms & Romantic Masterworks',
    description: 'Unlocking tension-free palm expansion and balance between outer soprano and bass anchors.',
    exercisePiece: {
      id: 'warmup-brahms-51',
      title: 'Brahms Exercise 1a (Span)',
      composer: 'Johannes Brahms',
      opus: '51 Übungen (WoO 6)',
      key: 'C major',
      timeSignature: [4, 4],
      tempoBpm: 72,
      duration: 3.5,
      notes: brahmsNotes,
      pedalEvents: [
        { startTime: 0.0, duration: 1.5, depth: 70, type: 'half', measure: 1, tip: 'Half-pedal to keep warmth without blur.' }
      ],
      annotations: brahmsAnnotations,
      sections: [
        { id: 'b-sec-1', title: 'Span Expansion', startMeasure: 1, endMeasure: 2, startTime: 0, endTime: 3.5, tempoSuggestion: 'Andante con moto', character: 'Expansive and warm' }
      ]
    }
  },
  {
    id: 'warmup-chopin-etude',
    title: 'Chopin Op. 10 No. 1: Lateral Arpeggio Roll',
    category: 'arpeggio',
    difficulty: 9,
    targetPiece: 'Chopin Etudes & Ballades',
    description: 'Forearm arm-transport across multi-octave arpeggios, eliminating finger hyperextension.',
    exercisePiece: {
      id: 'warmup-chopin-etude',
      title: 'Chopin Op. 10 No. 1 Prep Drill',
      composer: 'Frédéric Chopin',
      opus: 'Op. 10 No. 1',
      key: 'C major',
      timeSignature: [4, 4],
      tempoBpm: 96,
      duration: 2.5,
      notes: chopinEtudeNotes,
      pedalEvents: [
        { startTime: 0.0, duration: 1.8, depth: 90, type: 'sustain', measure: 1, tip: 'Sustain full arpeggio overtone bloom.' }
      ],
      annotations: chopinEtudeAnnotations,
      sections: [
        { id: 'ch-sec-1', title: 'Arpeggio Arc', startMeasure: 1, endMeasure: 2, startTime: 0, endTime: 2.5, tempoSuggestion: 'Allegro maestoso', character: 'Resonant and fluid' }
      ]
    }
  },
  {
    id: 'warmup-liszt-trill',
    title: 'Liszt Trill Agility: 3-4 Rotation',
    category: 'trill',
    difficulty: 7,
    targetPiece: 'Liszt Hungarian Rhapsodies',
    description: 'Forearm axial rotation technique for rapid, effortless trills between 3rd and 4th fingers.',
    exercisePiece: {
      id: 'warmup-liszt-trill',
      title: 'Liszt Trill Velocity Drill',
      composer: 'Franz Liszt',
      opus: 'Technische Studien',
      key: 'G major',
      timeSignature: [2, 4],
      tempoBpm: 110,
      duration: 2.2,
      notes: lisztTrillNotes,
      pedalEvents: [],
      annotations: lisztAnnotations,
      sections: [
        { id: 'lz-sec-1', title: 'Rotational Trill', startMeasure: 1, endMeasure: 1, startTime: 0, endTime: 2.2, tempoSuggestion: 'Vivace', character: 'Sparkling and buoyant' }
      ]
    }
  },
  {
    id: 'warmup-tony-ann-wave',
    title: 'Tony Ann: ICARUS Wave Arpeggio Ladder',
    category: 'arpeggio',
    difficulty: 6,
    targetPiece: 'Tony Ann – ICARUS',
    description: 'Neoclassical wave arpeggios (Abmaj7 – Bb – Cm – Ebmaj7) with liquid wrist circles and weight distribution.',
    exercisePiece: ScoreEngine.getTonyAnnIcarusArpeggio()
  },
  {
    id: 'warmup-scale-c-minor',
    title: 'Tonleiter C-Moll (Harmonisch / ICARUS)',
    category: 'thumb-agility',
    difficulty: 4,
    targetPiece: 'Tony Ann – ICARUS',
    description: 'Thumb tucks on Eb & Ab with augmented second stretch to leading tone B natural.',
    exercisePiece: ScoreEngine.getScaleCourseCm()
  },
  {
    id: 'warmup-scale-chromatic',
    title: 'Chromatische Tonleiter (Velocity Drill)',
    category: 'coda-velocity',
    difficulty: 5,
    targetPiece: 'Virtuoso Repertoire & Chopin Ballade',
    description: 'Standard 1-3-1-3-1-2-3 gliding fingering across all 12 semitones with metronome acceleration.',
    exercisePiece: ScoreEngine.getScaleChromatic()
  },
  {
    id: 'warmup-scale-d-major',
    title: 'Tonleiter D-Dur (2 Vorzeichen: F#, C#)',
    category: 'thumb-agility',
    difficulty: 3,
    targetPiece: 'Baroque & Classical Repertoire',
    description: 'Bilateral coordination across two black keys with finger 3 and 4 placement.',
    exercisePiece: ScoreEngine.getScaleCourseD()
  },
  {
    id: 'warmup-scale-c-major',
    title: 'Tonleiter C-Dur (2 Oktaven Parallel)',
    category: 'thumb-agility',
    difficulty: 2,
    targetPiece: 'Foundational Piano Technique',
    description: 'Fundamental thumb-under (1-2-3-1) passage in parallel motion across both hands.',
    exercisePiece: ScoreEngine.getScaleCourseC()
  },
  {
    id: 'warmup-scale-g-major',
    title: 'Tonleiter G-Dur (1 Vorzeichen: F#)',
    category: 'thumb-agility',
    difficulty: 2,
    targetPiece: 'Foundational Piano Technique',
    description: 'Black key F# navigation with right hand finger 4 and left hand finger 2.',
    exercisePiece: ScoreEngine.getScaleCourseG()
  },
  {
    id: 'warmup-scale-a-minor',
    title: 'Tonleiter A-Moll Harmonisch (Für Elise Prep)',
    category: 'thumb-agility',
    difficulty: 3,
    targetPiece: 'Beethoven: Für Elise (WoO 59)',
    description: 'G# leading-tone navigation and thumb-under crossing (1-2-3-1) without tension in the wrist.',
    exercisePiece: ScoreEngine.getScaleCourseAm()
  },
  {
    id: 'warmup-octave-wrist-snap',
    title: 'Chopin Ballade: Octave Wrist Drop & Staccato Snap',
    category: 'coda-velocity',
    difficulty: 8,
    targetPiece: 'Chopin: Ballade No. 1 & Virtuoso Repertoire',
    description: 'Supple vertical wrist trampoline action for rapid fortissimo octaves without forearm fatigue.',
    exercisePiece: {
      id: 'warmup-octave-wrist-snap',
      title: 'Octave Rebound Drill',
      composer: 'Virtuoso Masterclass',
      opus: 'Ergonomic Mechanics',
      key: 'G minor',
      timeSignature: [4, 4],
      tempoBpm: 92,
      duration: 4.2,
      notes: [
        { id: 'oct1', midi: 43, noteName: 'G2', startTime: 0.0, duration: 0.2, hand: 'left', finger: 5, measure: 1, velocity: 85, isStaccato: true },
        { id: 'oct2', midi: 55, noteName: 'G3', startTime: 0.0, duration: 0.2, hand: 'left', finger: 1, measure: 1, velocity: 85, isStaccato: true },
        { id: 'oct3', midi: 45, noteName: 'A2', startTime: 0.5, duration: 0.2, hand: 'left', finger: 5, measure: 1, velocity: 88, isStaccato: true },
        { id: 'oct4', midi: 57, noteName: 'A3', startTime: 0.5, duration: 0.2, hand: 'left', finger: 1, measure: 1, velocity: 88, isStaccato: true },
        { id: 'oct5', midi: 46, noteName: 'Bb2', startTime: 1.0, duration: 0.2, hand: 'left', finger: 5, measure: 1, velocity: 92, isStaccato: true },
        { id: 'oct6', midi: 58, noteName: 'Bb3', startTime: 1.0, duration: 0.2, hand: 'left', finger: 1, measure: 1, velocity: 92, isStaccato: true },
        { id: 'oct7', midi: 48, noteName: 'C3', startTime: 1.5, duration: 0.2, hand: 'left', finger: 5, measure: 1, velocity: 95, isStaccato: true },
        { id: 'oct8', midi: 60, noteName: 'C4', startTime: 1.5, duration: 0.2, hand: 'left', finger: 1, measure: 1, velocity: 95, isStaccato: true },
        { id: 'oct9', midi: 67, noteName: 'G4', startTime: 2.0, duration: 0.2, hand: 'right', finger: 1, measure: 1, velocity: 90, isStaccato: true },
        { id: 'oct10', midi: 79, noteName: 'G5', startTime: 2.0, duration: 0.2, hand: 'right', finger: 5, measure: 1, velocity: 90, isStaccato: true },
        { id: 'oct11', midi: 69, noteName: 'A4', startTime: 2.5, duration: 0.2, hand: 'right', finger: 1, measure: 1, velocity: 92, isStaccato: true },
        { id: 'oct12', midi: 81, noteName: 'A5', startTime: 2.5, duration: 0.2, hand: 'right', finger: 5, measure: 1, velocity: 92, isStaccato: true },
        { id: 'oct13', midi: 70, noteName: 'Bb4', startTime: 3.0, duration: 0.2, hand: 'right', finger: 1, measure: 1, velocity: 96, isStaccato: true },
        { id: 'oct14', midi: 82, noteName: 'Bb5', startTime: 3.0, duration: 0.2, hand: 'right', finger: 5, measure: 1, velocity: 96, isStaccato: true },
        { id: 'oct15', midi: 72, noteName: 'C5', startTime: 3.5, duration: 0.2, hand: 'right', finger: 1, measure: 1, velocity: 100, isStaccato: true },
        { id: 'oct16', midi: 84, noteName: 'C6', startTime: 3.5, duration: 0.2, hand: 'right', finger: 5, measure: 1, velocity: 100, isStaccato: true }
      ],
      pedalEvents: [],
      annotations: [
        {
          id: 'oct-ann-1',
          measureRange: [1, 1],
          title: 'Loose Wrist Rebound (Taubman Principle)',
          germanTerm: 'Handgelenks-Federung',
          category: 'fingering',
          instruction: 'Drop forearm weight onto fingers 1 and 5 and let the wrist rebound upward like bouncing on a trampoline. Do not squeeze the hand into rigidity.',
          wristGuidance: 'The hand maintains an unstrained octave arch; all shock absorption occurs in the wrist joint.',
          referenceTimestampSeconds: 0.0
        }
      ],
      sections: [
        { id: 'oct-sec-1', title: 'Octave Rebound Drill', startMeasure: 1, endMeasure: 1, startTime: 0, endTime: 4.2, tempoSuggestion: 'Allegro vigoroso', character: 'Snappy and buoyant' }
      ]
    }
  }
]
