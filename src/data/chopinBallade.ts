import type { Piece, NoteEvent, PedalEvent, MasterclassAnnotation } from '../types/music'

// Helper to convert note name to MIDI number
export function noteToMidi(name: string): number {
  const noteMap: { [key: string]: number } = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
    'A#': 10, 'Bb': 10, 'B': 11
  }
  const match = name.match(/^([A-Ga-g][#b]?)(-?\d+)$/)
  if (!match) return 60
  const pitch = match[1].charAt(0).toUpperCase() + match[1].slice(1)
  const octave = parseInt(match[2], 10)
  return 12 + octave * 12 + noteMap[pitch]
}

export function midiToNoteName(midi: number): string {
  const names = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
  const octave = Math.floor(midi / 12) - 1
  const pitch = names[midi % 12]
  return `${pitch}${octave}`
}

// Precise notes for Chopin's Ballade No. 1 in G minor, Op. 23
const notes: NoteEvent[] = [
  // SECTION 1: LARGO (Bars 1 - 7)
  { id: 'n1', midi: noteToMidi('C2'), noteName: 'C2', startTime: 0.0, duration: 2.4, hand: 'left', finger: 5, measure: 1, velocity: 85, isAccent: true },
  { id: 'n2', midi: noteToMidi('C3'), noteName: 'C3', startTime: 0.0, duration: 2.4, hand: 'left', finger: 1, measure: 1, velocity: 85 },
  
  { id: 'n3', midi: noteToMidi('Ab2'), noteName: 'Ab2', startTime: 2.5, duration: 1.0, hand: 'left', finger: 3, measure: 2, velocity: 75 },
  { id: 'n4', midi: noteToMidi('Eb3'), noteName: 'Eb3', startTime: 3.5, duration: 1.2, hand: 'left', finger: 1, measure: 2, velocity: 80 },
  { id: 'n5', midi: noteToMidi('G3'), noteName: 'G3', startTime: 4.8, duration: 1.0, hand: 'right', finger: 1, measure: 2, velocity: 82 },
  { id: 'n6', midi: noteToMidi('C4'), noteName: 'C4', startTime: 5.9, duration: 1.1, hand: 'right', finger: 2, measure: 2, velocity: 85 },
  
  { id: 'n7', midi: noteToMidi('Eb4'), noteName: 'Eb4', startTime: 7.1, duration: 1.8, hand: 'right', finger: 4, measure: 3, velocity: 92, isAccent: true },
  { id: 'n8', midi: noteToMidi('D4'), noteName: 'D4', startTime: 9.0, duration: 0.8, hand: 'right', finger: 3, measure: 3, velocity: 80 },
  { id: 'n9', midi: noteToMidi('C4'), noteName: 'C4', startTime: 9.9, duration: 0.8, hand: 'right', finger: 2, measure: 3, velocity: 76 },
  { id: 'n10', midi: noteToMidi('Bb3'), noteName: 'Bb3', startTime: 10.8, duration: 0.9, hand: 'right', finger: 1, measure: 3, velocity: 74 },
  
  { id: 'n11', midi: noteToMidi('A3'), noteName: 'A3', startTime: 11.8, duration: 1.2, hand: 'right', finger: 2, measure: 4, velocity: 70 },
  { id: 'n12', midi: noteToMidi('G3'), noteName: 'G3', startTime: 13.1, duration: 1.5, hand: 'right', finger: 1, measure: 4, velocity: 68 },
  { id: 'n13', midi: noteToMidi('F#3'), noteName: 'F#3', startTime: 14.7, duration: 2.2, hand: 'left', finger: 2, measure: 4, velocity: 65 },
  
  // Bar 6 - The famous "Question Mark"
  { id: 'n14', midi: noteToMidi('Eb3'), noteName: 'Eb3', startTime: 17.2, duration: 3.5, hand: 'left', finger: 5, measure: 6, velocity: 50 },
  { id: 'n15', midi: noteToMidi('Bb3'), noteName: 'Bb3', startTime: 17.2, duration: 3.5, hand: 'left', finger: 2, measure: 6, velocity: 52 },
  { id: 'n16', midi: noteToMidi('Db4'), noteName: 'Db4', startTime: 17.2, duration: 3.5, hand: 'right', finger: 1, measure: 6, velocity: 55 },
  { id: 'n17', midi: noteToMidi('G4'), noteName: 'G4', startTime: 17.2, duration: 3.5, hand: 'right', finger: 4, measure: 6, velocity: 58 },
  { id: 'n18', midi: noteToMidi('C5'), noteName: 'C5', startTime: 18.2, duration: 2.5, hand: 'right', finger: 5, measure: 6, velocity: 52 },

  // SECTION 2: MODERATO (Bars 8 - 36)
  { id: 'm1', midi: noteToMidi('D4'), noteName: 'D4', startTime: 22.0, duration: 0.9, hand: 'right', finger: 1, measure: 8, velocity: 60 },
  
  { id: 'm2', midi: noteToMidi('G2'), noteName: 'G2', startTime: 23.0, duration: 0.6, hand: 'left', finger: 5, measure: 9, velocity: 65 },
  { id: 'm3', midi: noteToMidi('Bb3'), noteName: 'Bb3', startTime: 23.6, duration: 0.5, hand: 'left', finger: 3, measure: 9, velocity: 55 },
  { id: 'm4', midi: noteToMidi('D4'), noteName: 'D4', startTime: 23.6, duration: 0.5, hand: 'left', finger: 1, measure: 9, velocity: 55 },
  { id: 'm5', midi: noteToMidi('Bb3'), noteName: 'Bb3', startTime: 24.2, duration: 0.5, hand: 'left', finger: 3, measure: 9, velocity: 50 },
  { id: 'm6', midi: noteToMidi('D4'), noteName: 'D4', startTime: 24.2, duration: 0.5, hand: 'left', finger: 1, measure: 9, velocity: 50 },
  { id: 'm7', midi: noteToMidi('G4'), noteName: 'G4', startTime: 23.0, duration: 1.2, hand: 'right', finger: 3, measure: 9, velocity: 74, isAccent: true },
  { id: 'm8', midi: noteToMidi('A4'), noteName: 'A4', startTime: 24.2, duration: 0.6, hand: 'right', finger: 4, measure: 9, velocity: 70 },
  
  { id: 'm9', midi: noteToMidi('G2'), noteName: 'G2', startTime: 24.8, duration: 0.6, hand: 'left', finger: 5, measure: 10, velocity: 62 },
  { id: 'm10', midi: noteToMidi('Bb3'), noteName: 'Bb3', startTime: 25.4, duration: 0.5, hand: 'left', finger: 3, measure: 10, velocity: 52 },
  { id: 'm11', midi: noteToMidi('D4'), noteName: 'D4', startTime: 25.4, duration: 0.5, hand: 'left', finger: 1, measure: 10, velocity: 52 },
  { id: 'm12', midi: noteToMidi('Bb4'), noteName: 'Bb4', startTime: 24.8, duration: 1.1, hand: 'right', finger: 5, measure: 10, velocity: 78, isAccent: true },
  { id: 'm13', midi: noteToMidi('A4'), noteName: 'A4', startTime: 25.9, duration: 0.6, hand: 'right', finger: 4, measure: 10, velocity: 70 },
  
  { id: 'm14', midi: noteToMidi('D3'), noteName: 'D3', startTime: 26.5, duration: 0.6, hand: 'left', finger: 5, measure: 11, velocity: 60 },
  { id: 'm15', midi: noteToMidi('F#3'), noteName: 'F#3', startTime: 27.1, duration: 0.5, hand: 'left', finger: 3, measure: 11, velocity: 50 },
  { id: 'm16', midi: noteToMidi('C4'), noteName: 'C4', startTime: 27.1, duration: 0.5, hand: 'left', finger: 1, measure: 11, velocity: 50 },
  { id: 'm17', midi: noteToMidi('F#4'), noteName: 'F#4', startTime: 26.5, duration: 1.2, hand: 'right', finger: 2, measure: 11, velocity: 72 },
  { id: 'm18', midi: noteToMidi('G4'), noteName: 'G4', startTime: 27.7, duration: 0.6, hand: 'right', finger: 3, measure: 11, velocity: 75 },

  { id: 'm19', midi: noteToMidi('G2'), noteName: 'G2', startTime: 28.3, duration: 0.6, hand: 'left', finger: 5, measure: 12, velocity: 60 },
  { id: 'm20', midi: noteToMidi('D4'), noteName: 'D4', startTime: 28.3, duration: 1.5, hand: 'right', finger: 1, measure: 12, velocity: 78, isAccent: true },
  { id: 'm21', midi: noteToMidi('D5'), noteName: 'D5', startTime: 28.3, duration: 1.5, hand: 'right', finger: 5, measure: 12, velocity: 84, isAccent: true },

  { id: 'm22', midi: noteToMidi('C5'), noteName: 'C5', startTime: 29.9, duration: 0.5, hand: 'right', finger: 4, measure: 13, velocity: 74 },
  { id: 'm23', midi: noteToMidi('Bb4'), noteName: 'Bb4', startTime: 30.5, duration: 0.6, hand: 'right', finger: 3, measure: 13, velocity: 72 },
  { id: 'm24', midi: noteToMidi('A4'), noteName: 'A4', startTime: 31.2, duration: 0.6, hand: 'right', finger: 2, measure: 13, velocity: 70 },
  { id: 'm25', midi: noteToMidi('G4'), noteName: 'G4', startTime: 31.8, duration: 1.2, hand: 'right', finger: 1, measure: 14, velocity: 68 },
  
  // SECTION 3: MENO MOSSO / 2nd THEME (Bar 68+)
  { id: 's1', midi: noteToMidi('Eb2'), noteName: 'Eb2', startTime: 34.0, duration: 1.8, hand: 'left', finger: 5, measure: 68, velocity: 68 },
  { id: 's2', midi: noteToMidi('Bb2'), noteName: 'Bb2', startTime: 34.8, duration: 1.2, hand: 'left', finger: 3, measure: 68, velocity: 60 },
  { id: 's3', midi: noteToMidi('G3'), noteName: 'G3', startTime: 35.5, duration: 1.2, hand: 'left', finger: 1, measure: 68, velocity: 60 },
  { id: 's4', midi: noteToMidi('Eb4'), noteName: 'Eb4', startTime: 34.0, duration: 0.9, hand: 'right', finger: 1, measure: 68, velocity: 70 },
  { id: 's5', midi: noteToMidi('G4'), noteName: 'G4', startTime: 34.0, duration: 0.9, hand: 'right', finger: 2, measure: 68, velocity: 70 },
  { id: 's6', midi: noteToMidi('Bb4'), noteName: 'Bb4', startTime: 34.9, duration: 1.5, hand: 'right', finger: 4, measure: 68, velocity: 85, isAccent: true },
  { id: 's7', midi: noteToMidi('Eb5'), noteName: 'Eb5', startTime: 36.5, duration: 2.2, hand: 'right', finger: 5, measure: 69, velocity: 90, isAccent: true },
  { id: 's8', midi: noteToMidi('D5'), noteName: 'D5', startTime: 38.8, duration: 0.7, hand: 'right', finger: 4, measure: 69, velocity: 78 },
  { id: 's9', midi: noteToMidi('C5'), noteName: 'C5', startTime: 39.5, duration: 0.8, hand: 'right', finger: 3, measure: 70, velocity: 76 },
  { id: 's10', midi: noteToMidi('Bb4'), noteName: 'Bb4', startTime: 40.4, duration: 1.8, hand: 'right', finger: 2, measure: 70, velocity: 82 },

  // SECTION 4: PRESTO CON FUOCO (CODA, Bar 208+)
  { id: 'c1', midi: noteToMidi('G1'), noteName: 'G1', startTime: 43.0, duration: 0.4, hand: 'left', finger: 5, measure: 208, velocity: 105, isAccent: true },
  { id: 'c2', midi: noteToMidi('G2'), noteName: 'G2', startTime: 43.0, duration: 0.4, hand: 'left', finger: 1, measure: 208, velocity: 105 },
  { id: 'c3', midi: noteToMidi('G3'), noteName: 'G3', startTime: 43.4, duration: 0.2, hand: 'right', finger: 1, measure: 208, velocity: 88 },
  { id: 'c4', midi: noteToMidi('A3'), noteName: 'A3', startTime: 43.6, duration: 0.2, hand: 'right', finger: 2, measure: 208, velocity: 90 },
  { id: 'c5', midi: noteToMidi('Bb3'), noteName: 'Bb3', startTime: 43.8, duration: 0.2, hand: 'right', finger: 3, measure: 208, velocity: 92 },
  { id: 'c6', midi: noteToMidi('C#4'), noteName: 'C#4', startTime: 44.0, duration: 0.2, hand: 'right', finger: 1, measure: 208, velocity: 95 },
  { id: 'c7', midi: noteToMidi('D4'), noteName: 'D4', startTime: 44.2, duration: 0.2, hand: 'right', finger: 2, measure: 208, velocity: 98 },
  { id: 'c8', midi: noteToMidi('Eb4'), noteName: 'Eb4', startTime: 44.4, duration: 0.2, hand: 'right', finger: 3, measure: 208, velocity: 100 },
  { id: 'c9', midi: noteToMidi('F#4'), noteName: 'F#4', startTime: 44.6, duration: 0.2, hand: 'right', finger: 4, measure: 208, velocity: 104 },
  { id: 'c10', midi: noteToMidi('G4'), noteName: 'G4', startTime: 44.8, duration: 0.25, hand: 'right', finger: 5, measure: 208, velocity: 110, isAccent: true },
  { id: 'c11', midi: noteToMidi('D2'), noteName: 'D2', startTime: 45.1, duration: 0.4, hand: 'left', finger: 5, measure: 209, velocity: 100 },
  { id: 'c12', midi: noteToMidi('D3'), noteName: 'D3', startTime: 45.1, duration: 0.4, hand: 'left', finger: 1, measure: 209, velocity: 100 },
  { id: 'c13', midi: noteToMidi('F4'), noteName: 'F4', startTime: 45.5, duration: 0.2, hand: 'right', finger: 4, measure: 209, velocity: 95 },
  { id: 'c14', midi: noteToMidi('Eb4'), noteName: 'Eb4', startTime: 45.7, duration: 0.2, hand: 'right', finger: 3, measure: 209, velocity: 92 },
  { id: 'c15', midi: noteToMidi('D4'), noteName: 'D4', startTime: 45.9, duration: 0.2, hand: 'right', finger: 2, measure: 209, velocity: 90 },
  { id: 'c16', midi: noteToMidi('C4'), noteName: 'C4', startTime: 46.1, duration: 0.2, hand: 'right', finger: 1, measure: 209, velocity: 88 },
  { id: 'c17', midi: noteToMidi('Bb3'), noteName: 'Bb3', startTime: 46.3, duration: 0.4, hand: 'right', finger: 3, measure: 209, velocity: 92 },
  { id: 'c18', midi: noteToMidi('A3'), noteName: 'A3', startTime: 46.7, duration: 0.6, hand: 'right', finger: 2, measure: 209, velocity: 85 }
]

const pedalEvents: PedalEvent[] = [
  { startTime: 0.0, duration: 15.0, depth: 120, type: 'sustain', measure: 1, tip: 'Keep damper depressed to let harmonics accumulate and sing.' },
  { startTime: 15.1, duration: 1.8, depth: 0, type: 'sustain', measure: 5, tip: 'Clear dampers completely! Let the silence create suspense.' },
  { startTime: 17.2, duration: 4.5, depth: 65, type: 'half', measure: 6, tip: 'Roland LX-9 Half-pedal: 50% depth. Retains warmth without muddiness.' },
  
  { startTime: 23.1, duration: 1.6, depth: 110, type: 'syncopated', measure: 9, tip: 'Pedal Catch: Depress immediately AFTER playing the bass G2.' },
  { startTime: 24.9, duration: 1.5, depth: 110, type: 'syncopated', measure: 10, tip: 'Clean release on beat 1, re-depress on beat 1.5.' },
  { startTime: 26.6, duration: 1.6, depth: 110, type: 'syncopated', measure: 11, tip: 'Clear pedal for harmonic shift to D dominant.' },
  { startTime: 28.4, duration: 2.2, depth: 115, type: 'syncopated', measure: 12, tip: 'Allow the D5 octave to ring into the release.' },

  { startTime: 34.0, duration: 2.3, depth: 90, type: 'syncopated', measure: 68, tip: 'Lyrical warmth. Do not let bass Eb overtake the vocal melody.' },
  { startTime: 36.5, duration: 3.8, depth: 95, type: 'syncopated', measure: 69, tip: 'Catch the Eb5 high cantabile and hold through the bar.' },

  { startTime: 43.0, duration: 1.8, depth: 100, type: 'sustain', measure: 208, tip: 'Pedal down on the explosive G octave, lift during scalar apex.' },
  { startTime: 45.1, duration: 1.8, depth: 90, type: 'sustain', measure: 209, tip: 'Short pedal impulse on the downbeat.' }
]

const annotations: MasterclassAnnotation[] = [
  {
    id: 'a1',
    measureRange: [1, 5],
    title: 'The Monumental Largo Arpeggio',
    germanTerm: 'Klangentfaltung & Resonanz',
    category: 'pedal',
    instruction: 'Do NOT rush the opening C. Strike with full arm weight, not finger poke. Allow the Roland LX-9 modeled piano soundboard to bloom before stepping forward.',
    pedalGuidance: {
      action: 'full-hold',
      explanation: 'Keep pedal completely pinned down through the entire ascent. Let the resonance build up like an orchestra tuning.',
      idealHoldMs: 15000
    },
    wristGuidance: 'Keep the wrist loose and flexible, moving upward in a gentle sweeping curve as you cross hands into the treble.',
    referenceTimestampSeconds: 0.0
  },
  {
    id: 'a2',
    measureRange: [6, 7],
    title: 'The Famous "Question Mark" (Db - G - C)',
    germanTerm: 'Der Übergang zur Stille',
    category: 'transition',
    instruction: 'Chopin asks a cosmic question here. Decelerate gracefully (ritardando). Play this chord pianissimo smorzando (dying away). The silence after the chord is as important as the notes!',
    pedalGuidance: {
      action: 'flutter',
      explanation: 'Use half-pedal (approx 40-50% depth on your Roland LX-9 continuous damper) to let it hover in the air without being sharp or dry.',
      idealHoldMs: 4000
    },
    wristGuidance: 'Drop gently from the arm with relaxed fingertips; do not press into the bottom of the keybed.',
    referenceTimestampSeconds: 17.0
  },
  {
    id: 'a3',
    measureRange: [8, 12],
    title: 'Moderato: The Melancholy Ballade Lilt',
    germanTerm: 'Bässen-Sprünge & Nachpedalieren',
    category: 'rubato',
    instruction: 'This is not a strict Viennese waltz; it is a wistful Polish narrative. The melody must sing cantabile with a flexible tempo (rubato). Notice the left hand jump from the deep bass octave.',
    pedalGuidance: {
      action: 'catch',
      explanation: 'Syncopated Pedaling: Strike the bass G2 with finger 5, THEN depress the pedal 50ms later. If you pedal simultaneously, you capture the previous silence.',
      idealHoldMs: 1600
    },
    handTechnique: 'Left hand choreography: Immediately after striking the low G2, release tension and float the forearm over to the Bb-D chord. Never jump frantically.',
    referenceTimestampSeconds: 23.0
  },
  {
    id: 'a4',
    measureRange: [68, 72],
    title: 'Second Theme: Lyrical Eb Major Cantabile',
    germanTerm: 'Gesanglichkeit & Schwebung',
    category: 'tone-color',
    instruction: 'A complete transformation into golden light. Bring out the top note (Eb5) with the 5th finger by leaning your arm weight toward the outer edge of your hand.',
    pedalGuidance: {
      action: 'catch',
      explanation: 'Continuous half-pedaling keeps the accompaniment cushion soft without drowning the vocal melody.',
      idealHoldMs: 2500
    },
    wristGuidance: 'Draw smooth horizontal wrist circles connecting the melodic arches.',
    referenceTimestampSeconds: 34.0
  },
  {
    id: 'a5',
    measureRange: [208, 220],
    title: 'Presto con Fuoco Coda: Virtuosic Fury',
    germanTerm: 'Fingerakrobatik & Rhythmus-Varianten',
    category: 'fingering',
    instruction: 'The most demanding section of the piece. To master these rapid runs at tempo, use our Dotted Rhythm practice variant in the Practice Lab!',
    pedalGuidance: {
      action: 'clear',
      explanation: 'Do NOT over-pedal! Excessive sustain turns these virtuosic chromatic runs into mud. Clear crisply on the apex.',
      idealHoldMs: 800
    },
    handTechnique: 'Thumb tucking: As your 3rd finger strikes, the thumb must already be sliding underneath toward C#4. Prepare early!',
    referenceTimestampSeconds: 43.0
  }
]

export const chopinBalladePiece: Piece = {
  id: 'chopin-ballade-1-op23',
  title: 'Ballade No. 1 in G minor',
  composer: 'Frédéric Chopin',
  opus: 'Op. 23',
  key: 'G minor / Eb major',
  timeSignature: [6, 4],
  tempoBpm: 66,
  duration: 48.0,
  notes,
  pedalEvents,
  annotations,
  sections: [
    {
      id: 'sec-largo',
      title: '1. Largo (Opening Arpeggio)',
      startMeasure: 1,
      endMeasure: 7,
      startTime: 0.0,
      endTime: 21.5,
      tempoSuggestion: 'Largo - Pesante e Maestoso',
      character: 'Stately, brooding, question mark to the heavens'
    },
    {
      id: 'sec-moderato',
      title: '2. Moderato (Main Theme)',
      startMeasure: 8,
      endMeasure: 36,
      startTime: 22.0,
      endTime: 33.5,
      tempoSuggestion: 'Moderato - espressivo con rubato',
      character: 'Melancholic narrative, singing cantabile, gentle waltz motion'
    },
    {
      id: 'sec-sostenuto',
      title: '3. Meno Mosso (2nd Theme in Eb)',
      startMeasure: 68,
      endMeasure: 105,
      startTime: 34.0,
      endTime: 42.5,
      tempoSuggestion: 'Meno mosso - sotto voce',
      character: 'Luminous, warm, tender romantic yearning'
    },
    {
      id: 'sec-coda',
      title: '4. Presto con Fuoco (Coda)',
      startMeasure: 208,
      endMeasure: 264,
      startTime: 43.0,
      endTime: 48.0,
      tempoSuggestion: 'Presto con fuoco',
      character: 'Tempestuous, ferocious, tragic virtuosity'
    }
  ]
}
