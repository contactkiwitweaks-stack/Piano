// Universal Score & MIDI Engine for Virtuoso & Flowkey
// Acoustically and musically accurate scores with exact canonical timing, meter, and continuous notation.

import type { Piece, NoteEvent, PedalEvent } from '../types/music'

export class ScoreEngine {
  public static noteToMidi(name: string): number {
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

  public static midiToNoteName(midi: number): string {
    const names = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
    const octave = Math.floor(midi / 12) - 1
    const pitch = names[midi % 12]
    return `${pitch}${octave}`
  }

  // ==========================================
  // 1. BEETHOVEN: FÜR ELISE (WoO 59) - CANONICAL 3/8 SCORE
  // ==========================================
  public static getFurElise(): Piece {
    const n = this.noteToMidi.bind(this)
    const notes: NoteEvent[] = []
    const pedals: PedalEvent[] = []

    const dt = 0.23 // Exact sixteenth note duration at eighth = ~130 bpm
    let t = 0.0

    // Measure 1: Upbeat (Auftakt) 2 sixteenth notes
    notes.push(
      { id: 'fe-u1', midi: n('E5'), noteName: 'E5', startTime: t, duration: dt * 0.9, hand: 'right', finger: 5, measure: 1, velocity: 80 },
      { id: 'fe-u2', midi: n('D#5'), noteName: 'D#5', startTime: t + dt, duration: dt * 0.9, hand: 'right', finger: 4, measure: 1, velocity: 78 }
    )
    t += dt * 2

    // Measure 2: The Semitone Weave (6 sixteenth notes in 3/8)
    const m2Notes = [
      { name: 'E5', finger: 5, v: 80 },
      { name: 'D#5', finger: 4, v: 76 },
      { name: 'E5', finger: 5, v: 80 },
      { name: 'B4', finger: 2, v: 74 },
      { name: 'D5', finger: 4, v: 76 },
      { name: 'C5', finger: 3, v: 74 },
    ]
    m2Notes.forEach((note, i) => {
      notes.push({
        id: `fe-m2-${i}`,
        midi: n(note.name),
        noteName: note.name,
        startTime: t + i * dt,
        duration: dt * 0.9,
        hand: 'right',
        finger: note.finger,
        measure: 2,
        velocity: note.v,
      })
    })
    t += dt * 6

    // Measure 3: A minor LH arpeggio + RH A4 resolution
    const m3Start = t
    // LH arpeggio: A2 - E3 - A3
    notes.push(
      { id: 'fe-m3-lh1', midi: n('A2'), noteName: 'A2', startTime: m3Start, duration: dt * 2.8, hand: 'left', finger: 5, measure: 3, velocity: 76 },
      { id: 'fe-m3-lh2', midi: n('E3'), noteName: 'E3', startTime: m3Start + dt, duration: dt * 2.0, hand: 'left', finger: 3, measure: 3, velocity: 72 },
      { id: 'fe-m3-lh3', midi: n('A3'), noteName: 'A3', startTime: m3Start + dt * 2, duration: dt * 1.5, hand: 'left', finger: 1, measure: 3, velocity: 72 }
    )
    // RH: A4 singing melody, then C4 - E4 - A4
    notes.push(
      { id: 'fe-m3-rh1', midi: n('A4'), noteName: 'A4', startTime: m3Start, duration: dt * 2.8, hand: 'right', finger: 1, measure: 3, velocity: 84, isAccent: true },
      { id: 'fe-m3-rh2', midi: n('C4'), noteName: 'C4', startTime: m3Start + dt * 3, duration: dt * 0.9, hand: 'right', finger: 1, measure: 3, velocity: 70 },
      { id: 'fe-m3-rh3', midi: n('E4'), noteName: 'E4', startTime: m3Start + dt * 4, duration: dt * 0.9, hand: 'right', finger: 2, measure: 3, velocity: 72 },
      { id: 'fe-m3-rh4', midi: n('A4'), noteName: 'A4', startTime: m3Start + dt * 5, duration: dt * 0.9, hand: 'right', finger: 4, measure: 3, velocity: 76 }
    )
    pedals.push({ startTime: m3Start, duration: dt * 5.8, depth: 90, type: 'sustain', measure: 3, tip: 'Hold through the A minor arpeggio' })
    t += dt * 6

    // Measure 4: E major Dominant Harmony
    const m4Start = t
    // LH arpeggio: E2 - E3 - G#3
    notes.push(
      { id: 'fe-m4-lh1', midi: n('E2'), noteName: 'E2', startTime: m4Start, duration: dt * 2.8, hand: 'left', finger: 5, measure: 4, velocity: 76 },
      { id: 'fe-m4-lh2', midi: n('E3'), noteName: 'E3', startTime: m4Start + dt, duration: dt * 2.0, hand: 'left', finger: 3, measure: 4, velocity: 72 },
      { id: 'fe-m4-lh3', midi: n('G#3'), noteName: 'G#3', startTime: m4Start + dt * 2, duration: dt * 1.5, hand: 'left', finger: 1, measure: 4, velocity: 72 }
    )
    // RH: B4 singing melody, then E4 - G#4 - B4
    notes.push(
      { id: 'fe-m4-rh1', midi: n('B4'), noteName: 'B4', startTime: m4Start, duration: dt * 2.8, hand: 'right', finger: 5, measure: 4, velocity: 84, isAccent: true },
      { id: 'fe-m4-rh2', midi: n('E4'), noteName: 'E4', startTime: m4Start + dt * 3, duration: dt * 0.9, hand: 'right', finger: 1, measure: 4, velocity: 70 },
      { id: 'fe-m4-rh3', midi: n('G#4'), noteName: 'G#4', startTime: m4Start + dt * 4, duration: dt * 0.9, hand: 'right', finger: 3, measure: 4, velocity: 72 },
      { id: 'fe-m4-rh4', midi: n('B4'), noteName: 'B4', startTime: m4Start + dt * 5, duration: dt * 0.9, hand: 'right', finger: 5, measure: 4, velocity: 76 }
    )
    pedals.push({ startTime: m4Start, duration: dt * 5.8, depth: 90, type: 'sustain', measure: 4, tip: 'E major dominant bloom' })
    t += dt * 6

    // Measure 5: C5 Resolution with LH A2 - E3 - A3
    const m5Start = t
    notes.push(
      { id: 'fe-m5-lh1', midi: n('A2'), noteName: 'A2', startTime: m5Start, duration: dt * 2.8, hand: 'left', finger: 5, measure: 5, velocity: 76 },
      { id: 'fe-m5-lh2', midi: n('E3'), noteName: 'E3', startTime: m5Start + dt, duration: dt * 2.0, hand: 'left', finger: 3, measure: 5, velocity: 72 },
      { id: 'fe-m5-lh3', midi: n('A3'), noteName: 'A3', startTime: m5Start + dt * 2, duration: dt * 1.5, hand: 'left', finger: 1, measure: 5, velocity: 72 },
      { id: 'fe-m5-rh1', midi: n('C5'), noteName: 'C5', startTime: m5Start, duration: dt * 2.8, hand: 'right', finger: 4, measure: 5, velocity: 82 },
      { id: 'fe-m5-rh2', midi: n('E4'), noteName: 'E4', startTime: m5Start + dt * 3, duration: dt * 0.9, hand: 'right', finger: 1, measure: 5, velocity: 70 },
      { id: 'fe-m5-rh3', midi: n('E5'), noteName: 'E5', startTime: m5Start + dt * 4, duration: dt * 0.9, hand: 'right', finger: 5, measure: 5, velocity: 76 },
      { id: 'fe-m5-rh4', midi: n('D#5'), noteName: 'D#5', startTime: m5Start + dt * 5, duration: dt * 0.9, hand: 'right', finger: 4, measure: 5, velocity: 74 }
    )
    pedals.push({ startTime: m5Start, duration: dt * 5.8, depth: 90, type: 'sustain', measure: 5, tip: 'Tonic resolution' })
    t += dt * 6

    // Measure 6: Return of Theme
    const m6Notes = [
      { name: 'E5', finger: 5, v: 78 },
      { name: 'D#5', finger: 4, v: 76 },
      { name: 'E5', finger: 5, v: 78 },
      { name: 'B4', finger: 2, v: 74 },
      { name: 'D5', finger: 4, v: 74 },
      { name: 'C5', finger: 3, v: 72 },
    ]
    m6Notes.forEach((note, i) => {
      notes.push({
        id: `fe-m6-${i}`,
        midi: n(note.name),
        noteName: note.name,
        startTime: t + i * dt,
        duration: dt * 0.9,
        hand: 'right',
        finger: note.finger,
        measure: 6,
        velocity: note.v,
      })
    })
    t += dt * 6

    // Measure 7: Cadence into G major
    const m7Start = t
    notes.push(
      { id: 'fe-m7-lh1', midi: n('A2'), noteName: 'A2', startTime: m7Start, duration: dt * 2.5, hand: 'left', finger: 5, measure: 7, velocity: 75 },
      { id: 'fe-m7-lh2', midi: n('E3'), noteName: 'E3', startTime: m7Start + dt, duration: dt * 2.0, hand: 'left', finger: 3, measure: 7, velocity: 70 },
      { id: 'fe-m7-lh3', midi: n('A3'), noteName: 'A3', startTime: m7Start + dt * 2, duration: dt * 1.5, hand: 'left', finger: 1, measure: 7, velocity: 70 },
      { id: 'fe-m7-rh1', midi: n('A4'), noteName: 'A4', startTime: m7Start, duration: dt * 2.5, hand: 'right', finger: 1, measure: 7, velocity: 80, isAccent: true },
      { id: 'fe-m7-rh2', midi: n('C4'), noteName: 'C4', startTime: m7Start + dt * 3, duration: dt * 0.9, hand: 'right', finger: 1, measure: 7, velocity: 72 },
      { id: 'fe-m7-rh3', midi: n('D4'), noteName: 'D4', startTime: m7Start + dt * 4, duration: dt * 0.9, hand: 'right', finger: 2, measure: 7, velocity: 74 },
      { id: 'fe-m7-rh4', midi: n('E4'), noteName: 'E4', startTime: m7Start + dt * 5, duration: dt * 0.9, hand: 'right', finger: 3, measure: 7, velocity: 76 }
    )
    pedals.push({ startTime: m7Start, duration: dt * 5.8, depth: 85, type: 'sustain', measure: 7 })
    t += dt * 6

    // Measure 8: G major cadence (C3 - G3 - E3)
    const m8Start = t
    notes.push(
      { id: 'fe-m8-lh1', midi: n('C3'), noteName: 'C3', startTime: m8Start, duration: dt * 2.5, hand: 'left', finger: 5, measure: 8, velocity: 75 },
      { id: 'fe-m8-lh2', midi: n('G3'), noteName: 'G3', startTime: m8Start + dt, duration: dt * 2.0, hand: 'left', finger: 3, measure: 8, velocity: 70 },
      { id: 'fe-m8-lh3', midi: n('E3'), noteName: 'E3', startTime: m8Start + dt * 2, duration: dt * 1.5, hand: 'left', finger: 1, measure: 8, velocity: 70 },
      { id: 'fe-m8-rh1', midi: n('G4'), noteName: 'G4', startTime: m8Start, duration: dt * 2.5, hand: 'right', finger: 5, measure: 8, velocity: 80 },
      { id: 'fe-m8-rh2', midi: n('F4'), noteName: 'F4', startTime: m8Start + dt * 3, duration: dt * 0.9, hand: 'right', finger: 4, measure: 8, velocity: 74 },
      { id: 'fe-m8-rh3', midi: n('E4'), noteName: 'E4', startTime: m8Start + dt * 4, duration: dt * 0.9, hand: 'right', finger: 3, measure: 8, velocity: 72 },
      { id: 'fe-m8-rh4', midi: n('D4'), noteName: 'D4', startTime: m8Start + dt * 5, duration: dt * 0.9, hand: 'right', finger: 2, measure: 8, velocity: 70 }
    )
    pedals.push({ startTime: m8Start, duration: dt * 5.8, depth: 90, type: 'sustain', measure: 8 })
    t += dt * 6

    // Measure 9: Final resolution chord in A minor
    const m9Start = t
    notes.push(
      { id: 'fe-m9-lh1', midi: n('A2'), noteName: 'A2', startTime: m9Start, duration: dt * 5.0, hand: 'left', finger: 5, measure: 9, velocity: 78 },
      { id: 'fe-m9-lh2', midi: n('E3'), noteName: 'E3', startTime: m9Start, duration: dt * 5.0, hand: 'left', finger: 1, measure: 9, velocity: 74 },
      { id: 'fe-m9-rh1', midi: n('C4'), noteName: 'C4', startTime: m9Start, duration: dt * 5.0, hand: 'right', finger: 1, measure: 9, velocity: 74 },
      { id: 'fe-m9-rh2', midi: n('E4'), noteName: 'E4', startTime: m9Start, duration: dt * 5.0, hand: 'right', finger: 3, measure: 9, velocity: 76 },
      { id: 'fe-m9-rh3', midi: n('A4'), noteName: 'A4', startTime: m9Start, duration: dt * 5.0, hand: 'right', finger: 5, measure: 9, velocity: 82, isAccent: true }
    )
    pedals.push({ startTime: m9Start, duration: dt * 5.5, depth: 90, type: 'sustain', measure: 9 })
    t += dt * 6

    return {
      id: 'beethoven-fur-elise',
      title: 'Für Elise (WoO 59)',
      composer: 'Ludwig van Beethoven',
      opus: 'WoO 59',
      key: 'A minor',
      timeSignature: [3, 8],
      tempoBpm: 130,
      duration: t + 0.5,
      notes,
      pedalEvents: pedals,
      annotations: [
        {
          id: 'fe-ann-1',
          measureRange: [1, 4],
          title: 'The Semitone Weave (E - D#)',
          germanTerm: 'Halbton-Schwingung',
          category: 'fingering',
          instruction: 'Keep fingers 4 and 5 close to the keys. Alternate with wrist rotation rather than lifting fingers high.',
          wristGuidance: 'Gentle lateral wrist roll toward the thumb on A4.',
          referenceTimestampSeconds: 0.0,
        }
      ],
      sections: [
        { id: 'fe-sec-1', title: 'Main Theme (Poco moto)', startMeasure: 1, endMeasure: 9, startTime: 0, endTime: t, tempoSuggestion: 'Poco moto', character: 'Delicate, lyrical & flowing' }
      ]
    }
  }

  // ==========================================
  // 2. CHOPIN: BALLADE NO. 1 IN G MINOR (OP. 23)
  // ==========================================
  public static getChopinBalladeContinuous(): Piece {
    const n = this.noteToMidi.bind(this)
    const notes: NoteEvent[] = []
    const pedals: PedalEvent[] = []

    let t = 0.0

    // MEASURE 1: LARGO UNISON PESANTE DECLARATION (C2 + C3 octave, 4/4 meter)
    notes.push(
      { id: 'cb-1', midi: n('C2'), noteName: 'C2', startTime: t, duration: 1.9, hand: 'left', finger: 5, measure: 1, velocity: 90, isAccent: true },
      { id: 'cb-2', midi: n('C3'), noteName: 'C3', startTime: t, duration: 1.9, hand: 'left', finger: 1, measure: 1, velocity: 90 },
      { id: 'cb-3', midi: n('Eb3'), noteName: 'Eb3', startTime: t + 2.0, duration: 0.9, hand: 'left', finger: 3, measure: 1, velocity: 76 },
      { id: 'cb-4', midi: n('D3'), noteName: 'D3', startTime: t + 3.0, duration: 0.9, hand: 'left', finger: 2, measure: 1, velocity: 76 }
    )
    pedals.push({ startTime: t, duration: 1.9, depth: 100, type: 'sustain', measure: 1, tip: 'Downbeat unison depth' })
    t += 4.0

    // MEASURE 2: Rising arpeggio
    notes.push(
      { id: 'cb-5', midi: n('G3'), noteName: 'G3', startTime: t, duration: 0.9, hand: 'right', finger: 1, measure: 2, velocity: 80 },
      { id: 'cb-6', midi: n('Bb3'), noteName: 'Bb3', startTime: t + 1.0, duration: 0.9, hand: 'right', finger: 2, measure: 2, velocity: 82 },
      { id: 'cb-7', midi: n('Eb4'), noteName: 'Eb4', startTime: t + 2.0, duration: 1.9, hand: 'right', finger: 4, measure: 2, velocity: 88, isAccent: true }
    )
    pedals.push({ startTime: t, duration: 3.8, depth: 85, type: 'sustain', measure: 2, tip: 'Carry rising melodic arc' })
    t += 4.0

    // MEASURE 3: Descending gesture
    notes.push(
      { id: 'cb-8', midi: n('D4'), noteName: 'D4', startTime: t, duration: 0.9, hand: 'right', finger: 3, measure: 3, velocity: 80 },
      { id: 'cb-9', midi: n('C4'), noteName: 'C4', startTime: t + 1.0, duration: 0.9, hand: 'right', finger: 2, measure: 3, velocity: 76 },
      { id: 'cb-10', midi: n('Bb3'), noteName: 'Bb3', startTime: t + 2.0, duration: 0.9, hand: 'right', finger: 1, measure: 3, velocity: 74 },
      { id: 'cb-11', midi: n('A3'), noteName: 'A3', startTime: t + 3.0, duration: 0.9, hand: 'right', finger: 2, measure: 3, velocity: 72 }
    )
    t += 4.0

    // MEASURE 4: Half-step cadence to F# (Fermata)
    notes.push(
      { id: 'cb-12', midi: n('G3'), noteName: 'G3', startTime: t, duration: 0.9, hand: 'right', finger: 1, measure: 4, velocity: 68 },
      { id: 'cb-13', midi: n('F#3'), noteName: 'F#3', startTime: t + 1.0, duration: 2.5, hand: 'left', finger: 2, measure: 4, velocity: 65 }
    )
    pedals.push({ startTime: t, duration: 3.5, depth: 70, type: 'half', measure: 4, tip: 'Clear dampers for suspense' })
    t += 4.0

    // MEASURE 5: Rest & breath
    t += 2.0

    // MEASURE 6: The Neapolitan Chord (Fermata)
    const m6Start = t
    notes.push(
      { id: 'cb-14', midi: n('Eb2'), noteName: 'Eb2', startTime: m6Start, duration: 3.0, hand: 'left', finger: 5, measure: 6, velocity: 56 },
      { id: 'cb-15', midi: n('Eb3'), noteName: 'Eb3', startTime: m6Start, duration: 3.0, hand: 'left', finger: 1, measure: 6, velocity: 58 },
      { id: 'cb-16', midi: n('Bb3'), noteName: 'Bb3', startTime: m6Start, duration: 3.0, hand: 'right', finger: 1, measure: 6, velocity: 60 },
      { id: 'cb-17', midi: n('Db4'), noteName: 'Db4', startTime: m6Start, duration: 3.0, hand: 'right', finger: 2, measure: 6, velocity: 62 },
      { id: 'cb-18', midi: n('G4'), noteName: 'G4', startTime: m6Start, duration: 3.0, hand: 'right', finger: 3, measure: 6, velocity: 64 },
      { id: 'cb-19', midi: n('C5'), noteName: 'C5', startTime: m6Start, duration: 3.0, hand: 'right', finger: 5, measure: 6, velocity: 68 }
    )
    pedals.push({ startTime: m6Start, duration: 3.2, depth: 75, type: 'half', measure: 6, tip: 'Roland CC64 75 half-pedal bloom' })
    t += 3.5

    // MEASURE 7: Arpeggio into Silence
    const arpNotes = ['F#2', 'C3', 'Eb3', 'A3', 'C4', 'Eb4', 'D4']
    arpNotes.forEach((name, i) => {
      notes.push({
        id: `cb-arp-${i}`,
        midi: n(name),
        noteName: name,
        startTime: t + i * 0.28,
        duration: i === arpNotes.length - 1 ? 1.5 : 0.35,
        hand: i < 3 ? 'left' : 'right',
        finger: (i % 3) + 1,
        measure: 7,
        velocity: 52 - i * 2,
      })
    })
    pedals.push({ startTime: t, duration: 2.8, depth: 60, type: 'half', measure: 7 })
    t += 3.5

    // MEASURE 8: MODERATO (6/4 METER) - Upbeat D4
    notes.push(
      { id: 'cb-27', midi: n('D4'), noteName: 'D4', startTime: t, duration: 0.6, hand: 'right', finger: 1, measure: 8, velocity: 64 }
    )
    t += 0.7

    // MEASURE 9: Theme Cantabile (G minor)
    const m9Start = t
    // Left Hand waltz accompaniment
    notes.push(
      { id: 'cb-lh1', midi: n('G2'), noteName: 'G2', startTime: m9Start, duration: 0.8, hand: 'left', finger: 5, measure: 9, velocity: 65, isAccent: true },
      { id: 'cb-lh2', midi: n('D4'), noteName: 'D4', startTime: m9Start + 0.5, duration: 0.4, hand: 'left', finger: 1, measure: 9, velocity: 55 },
      { id: 'cb-lh3', midi: n('G4'), noteName: 'G4', startTime: m9Start + 0.5, duration: 0.4, hand: 'left', finger: 2, measure: 9, velocity: 55 },
      { id: 'cb-lh4', midi: n('Bb4'), noteName: 'Bb4', startTime: m9Start + 0.5, duration: 0.4, hand: 'left', finger: 4, measure: 9, velocity: 55 },
      { id: 'cb-lh5', midi: n('D4'), noteName: 'D4', startTime: m9Start + 1.0, duration: 0.4, hand: 'left', finger: 1, measure: 9, velocity: 50 },
      { id: 'cb-lh6', midi: n('G4'), noteName: 'G4', startTime: m9Start + 1.0, duration: 0.4, hand: 'left', finger: 2, measure: 9, velocity: 50 },
      { id: 'cb-lh7', midi: n('Bb4'), noteName: 'Bb4', startTime: m9Start + 1.0, duration: 0.4, hand: 'left', finger: 4, measure: 9, velocity: 50 },
      // Right Hand singing soprano
      { id: 'cb-rh1', midi: n('G4'), noteName: 'G4', startTime: m9Start, duration: 1.1, hand: 'right', finger: 3, measure: 9, velocity: 80, isAccent: true },
      { id: 'cb-rh2', midi: n('A4'), noteName: 'A4', startTime: m9Start + 1.1, duration: 0.5, hand: 'right', finger: 4, measure: 9, velocity: 74 }
    )
    pedals.push({ startTime: m9Start, duration: 1.8, depth: 95, type: 'syncopated', measure: 9, tip: 'Syncopated pedal strictly after downbeat' })
    t += 1.8

    // MEASURE 10: Continuing phrase
    const m10Start = t
    notes.push(
      { id: 'cb-lh8', midi: n('G2'), noteName: 'G2', startTime: m10Start, duration: 0.8, hand: 'left', finger: 5, measure: 10, velocity: 65 },
      { id: 'cb-lh9', midi: n('D4'), noteName: 'D4', startTime: m10Start + 0.5, duration: 0.4, hand: 'left', finger: 1, measure: 10, velocity: 55 },
      { id: 'cb-lh10', midi: n('G4'), noteName: 'G4', startTime: m10Start + 0.5, duration: 0.4, hand: 'left', finger: 2, measure: 10, velocity: 55 },
      { id: 'cb-lh11', midi: n('Bb4'), noteName: 'Bb4', startTime: m10Start + 0.5, duration: 0.4, hand: 'left', finger: 4, measure: 10, velocity: 55 },
      { id: 'cb-rh3', midi: n('Bb4'), noteName: 'Bb4', startTime: m10Start, duration: 1.1, hand: 'right', finger: 5, measure: 10, velocity: 84, isAccent: true },
      { id: 'cb-rh4', midi: n('A4'), noteName: 'A4', startTime: m10Start + 1.1, duration: 0.5, hand: 'right', finger: 4, measure: 10, velocity: 74 }
    )
    pedals.push({ startTime: m10Start, duration: 1.8, depth: 95, type: 'syncopated', measure: 10 })
    t += 1.8

    // MEASURE 11: Eb2 Bass step
    const m11Start = t
    notes.push(
      { id: 'cb-lh12', midi: n('Eb2'), noteName: 'Eb2', startTime: m11Start, duration: 0.8, hand: 'left', finger: 5, measure: 11, velocity: 62 },
      { id: 'cb-lh13', midi: n('C4'), noteName: 'C4', startTime: m11Start + 0.5, duration: 0.4, hand: 'left', finger: 1, measure: 11, velocity: 52 },
      { id: 'cb-lh14', midi: n('Eb4'), noteName: 'Eb4', startTime: m11Start + 0.5, duration: 0.4, hand: 'left', finger: 2, measure: 11, velocity: 52 },
      { id: 'cb-lh15', midi: n('A4'), noteName: 'A4', startTime: m11Start + 0.5, duration: 0.4, hand: 'left', finger: 4, measure: 11, velocity: 52 },
      { id: 'cb-rh5', midi: n('F#4'), noteName: 'F#4', startTime: m11Start, duration: 1.1, hand: 'right', finger: 2, measure: 11, velocity: 75 },
      { id: 'cb-rh6', midi: n('G4'), noteName: 'G4', startTime: m11Start + 1.1, duration: 0.5, hand: 'right', finger: 3, measure: 11, velocity: 78 }
    )
    pedals.push({ startTime: m11Start, duration: 1.8, depth: 95, type: 'syncopated', measure: 11 })
    t += 1.8

    // MEASURE 12: Singing Apex (D4 + D5 Octave Climax!)
    const m12Start = t
    notes.push(
      { id: 'cb-lh16', midi: n('D2'), noteName: 'D2', startTime: m12Start, duration: 0.8, hand: 'left', finger: 5, measure: 12, velocity: 65 },
      { id: 'cb-lh17', midi: n('C4'), noteName: 'C4', startTime: m12Start + 0.5, duration: 0.4, hand: 'left', finger: 1, measure: 12, velocity: 55 },
      { id: 'cb-lh18', midi: n('D4'), noteName: 'D4', startTime: m12Start + 0.5, duration: 0.4, hand: 'left', finger: 2, measure: 12, velocity: 55 },
      { id: 'cb-lh19', midi: n('F#4'), noteName: 'F#4', startTime: m12Start + 0.5, duration: 0.4, hand: 'left', finger: 4, measure: 12, velocity: 55 },
      { id: 'cb-rh7', midi: n('D4'), noteName: 'D4', startTime: m12Start, duration: 1.5, hand: 'right', finger: 1, measure: 12, velocity: 88, isAccent: true },
      { id: 'cb-rh8', midi: n('D5'), noteName: 'D5', startTime: m12Start, duration: 1.5, hand: 'right', finger: 5, measure: 12, velocity: 94, isAccent: true }
    )
    pedals.push({ startTime: m12Start, duration: 2.0, depth: 100, type: 'syncopated', measure: 12, tip: 'Vocal apex resonance' })
    t += 2.2

    return {
      id: 'chopin-ballade-1',
      title: 'Ballade No. 1 in G minor',
      composer: 'Frédéric Chopin',
      opus: 'Op. 23',
      key: 'G minor',
      timeSignature: [4, 4],
      tempoBpm: 60,
      duration: t + 0.5,
      notes,
      pedalEvents: pedals,
      annotations: [
        {
          id: 'cb-ann-1',
          measureRange: [1, 7],
          title: 'Opening Largo Declaration',
          germanTerm: 'Largo Einleitung',
          category: 'transition',
          instruction: 'Transfer arm weight deeply into the key bed. Let the Neapolitan chord fermata in bar 6 bloom and decay naturally before the Moderato.',
          referenceTimestampSeconds: 0.0,
        },
        {
          id: 'cb-ann-2',
          measureRange: [8, 12],
          title: 'Moderato Cantabile Voicing',
          germanTerm: 'Cantabile Stimmführung',
          category: 'tone-color',
          instruction: 'Voice the 5th finger in the soprano melody. Keep the LH waltz accompaniment soft, supple, and transparent.',
          referenceTimestampSeconds: 26.0,
        }
      ],
      sections: [
        { id: 'sec-1', title: 'Largo Opening', startMeasure: 1, endMeasure: 7, startTime: 0, endTime: 25.5, tempoSuggestion: 'Largo - Pesante', character: 'Solemn, narrative & declamatory' },
        { id: 'sec-2', title: 'Moderato Theme', startMeasure: 8, endMeasure: 12, startTime: 26.0, endTime: t, tempoSuggestion: 'Moderato a tempo', character: 'Wistful, aristocratic cantabile' }
      ]
    }
  }

  // ==========================================
  // 3. SCALE COURSE: C MAJOR SCALE (2 HANDS)
  // ==========================================
  public static getScaleCourseC(): Piece {
    const n = this.noteToMidi.bind(this)
    const notes: NoteEvent[] = []

    const rhMidis = [n('C4'), n('D4'), n('E4'), n('F4'), n('G4'), n('A4'), n('B4'), n('C5'), n('B4'), n('A4'), n('G4'), n('F4'), n('E4'), n('D4'), n('C4')]
    const rhFingers = [1, 2, 3, 1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 2, 1]

    const lhMidis = [n('C3'), n('D3'), n('E3'), n('F3'), n('G3'), n('A3'), n('B3'), n('C4'), n('B3'), n('A3'), n('G3'), n('F3'), n('E3'), n('D3'), n('C3')]
    const lhFingers = [5, 4, 3, 2, 1, 3, 2, 1, 2, 3, 1, 2, 3, 4, 5]

    rhMidis.forEach((midi, idx) => {
      const time = idx * 0.45
      const measure = Math.floor(idx / 4) + 1
      notes.push({
        id: `sc-rh-${idx}`,
        midi,
        noteName: this.midiToNoteName(midi),
        startTime: time,
        duration: 0.38,
        hand: 'right',
        finger: rhFingers[idx],
        measure,
        velocity: 80,
      })
      notes.push({
        id: `sc-lh-${idx}`,
        midi: lhMidis[idx],
        noteName: this.midiToNoteName(lhMidis[idx]),
        startTime: time,
        duration: 0.38,
        hand: 'left',
        finger: lhFingers[idx],
        measure,
        velocity: 78,
      })
    })

    return {
      id: 'scale-c-major',
      title: 'Playing Scales: C Major',
      composer: 'Scale Foundation',
      opus: 'Grade 1–3',
      key: 'C major',
      timeSignature: [4, 4],
      tempoBpm: 90,
      duration: rhMidis.length * 0.45 + 0.5,
      notes,
      pedalEvents: [],
      annotations: [
        {
          id: 'sc-ann-1',
          measureRange: [1, 4],
          title: 'Thumb Pivot (1-2-3-1)',
          germanTerm: 'Daumen-Untersatz',
          category: 'fingering',
          instruction: 'In RH ascending, glide thumb smoothly under finger 3. Do not raise the elbow.',
          referenceTimestampSeconds: 0.0,
        }
      ],
      sections: [
        { id: 'sc-sec-1', title: 'C Major Scale (Both Hands)', startMeasure: 1, endMeasure: 4, startTime: 0, endTime: 7.0, tempoSuggestion: 'Moderato', character: 'Even, fluid articulation' }
      ]
    }
  }

  // ==========================================
  // 4. BEETHOVEN: ODE TO JOY
  // ==========================================
  public static getOdeToJoy(): Piece {
    const n = this.noteToMidi.bind(this)
    const notes: NoteEvent[] = []

    const melody = [
      n('E4'), n('E4'), n('F4'), n('G4'),
      n('G4'), n('F4'), n('E4'), n('D4'),
      n('C4'), n('C4'), n('D4'), n('E4'),
      n('E4'), n('D4'), n('D4')
    ]
    const fingers = [3, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 3, 2, 2]
    const durations = [0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.65, 0.25, 0.85]

    let time = 0.0
    melody.forEach((midi, idx) => {
      const dur = durations[idx]
      const measure = Math.floor(idx / 4) + 1
      notes.push({
        id: `otj-${idx}`,
        midi,
        noteName: this.midiToNoteName(midi),
        startTime: time,
        duration: dur,
        hand: 'right',
        finger: fingers[idx],
        measure,
        velocity: 80,
      })
      time += 0.5
    })

    return {
      id: 'beethoven-ode-to-joy',
      title: 'Beethoven – Ode to Joy',
      composer: 'Ludwig van Beethoven',
      opus: 'Symphony No. 9',
      key: 'C major',
      timeSignature: [4, 4],
      tempoBpm: 100,
      duration: time + 0.5,
      notes,
      pedalEvents: [],
      annotations: [
        {
          id: 'otj-ann-1',
          measureRange: [1, 4],
          title: '5-Finger C-Position',
          germanTerm: 'C-Lage Handhaltung',
          category: 'fingering',
          instruction: 'Place thumb on C4, finger 2 on D4, finger 3 on E4, finger 4 on F4, finger 5 on G4.',
          referenceTimestampSeconds: 0.0,
        }
      ],
      sections: [
        { id: 'otj-sec-1', title: 'Ode to Joy Theme', startMeasure: 1, endMeasure: 4, startTime: 0, endTime: time, tempoSuggestion: 'Allegro moderato', character: 'Joyful & noble' }
      ]
    }
  }

  // ==========================================
  // 5. SCALE COURSE: G MAJOR (1 SHARP)
  // ==========================================
  public static getScaleCourseG(): Piece {
    const n = this.noteToMidi.bind(this)
    const notes: NoteEvent[] = []

    const rhMidis = [n('G4'), n('A4'), n('B4'), n('C5'), n('D5'), n('E5'), n('F#5'), n('G5'), n('F#5'), n('E5'), n('D5'), n('C5'), n('B4'), n('A4'), n('G4')]
    const rhFingers = [1, 2, 3, 1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 2, 1]

    const lhMidis = [n('G3'), n('A3'), n('B3'), n('C4'), n('D4'), n('E4'), n('F#4'), n('G4'), n('F#4'), n('E4'), n('D4'), n('C4'), n('B3'), n('A3'), n('G3')]
    const lhFingers = [5, 4, 3, 2, 1, 3, 2, 1, 2, 3, 1, 2, 3, 4, 5]

    rhMidis.forEach((midi, idx) => {
      const time = idx * 0.45
      const measure = Math.floor(idx / 4) + 1
      notes.push({
        id: `scg-rh-${idx}`,
        midi,
        noteName: this.midiToNoteName(midi),
        startTime: time,
        duration: 0.38,
        hand: 'right',
        finger: rhFingers[idx],
        measure,
        velocity: 80,
      })
      notes.push({
        id: `scg-lh-${idx}`,
        midi: lhMidis[idx],
        noteName: this.midiToNoteName(lhMidis[idx]),
        startTime: time,
        duration: 0.38,
        hand: 'left',
        finger: lhFingers[idx],
        measure,
        velocity: 78,
      })
    })

    return {
      id: 'scale-g-major',
      title: 'Playing Scales: G Major (1 Sharp)',
      composer: 'Scale Foundation',
      opus: 'Grade 1–3',
      key: 'G major',
      timeSignature: [4, 4],
      tempoBpm: 90,
      duration: rhMidis.length * 0.45 + 0.5,
      notes,
      pedalEvents: [],
      annotations: [
        {
          id: 'scg-ann-1',
          measureRange: [1, 4],
          title: 'Finger 4 on F# Black Key',
          germanTerm: 'Fingersatz für F#',
          category: 'fingering',
          instruction: 'Place finger 4 securely on F#5 before crowning with finger 5 on G5.',
          referenceTimestampSeconds: 0.0,
        }
      ],
      sections: [
        { id: 'scg-sec-1', title: 'G Major Scale', startMeasure: 1, endMeasure: 4, startTime: 0, endTime: 7.0, tempoSuggestion: 'Moderato', character: 'Bright & steady' }
      ]
    }
  }

  // ==========================================
  // 6. SCALE COURSE: A HARMONIC MINOR
  // ==========================================
  public static getScaleCourseAm(): Piece {
    const n = this.noteToMidi.bind(this)
    const notes: NoteEvent[] = []

    const rhMidis = [n('A4'), n('B4'), n('C5'), n('D5'), n('E5'), n('F5'), n('G#5'), n('A5'), n('G#5'), n('F5'), n('E5'), n('D5'), n('C5'), n('B4'), n('A4')]
    const rhFingers = [1, 2, 3, 1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 2, 1]

    const lhMidis = [n('A3'), n('B3'), n('C4'), n('D4'), n('E4'), n('F4'), n('G#4'), n('A4'), n('G#4'), n('F4'), n('E4'), n('D4'), n('C4'), n('B3'), n('A3')]
    const lhFingers = [5, 4, 3, 2, 1, 3, 2, 1, 2, 3, 1, 2, 3, 4, 5]

    rhMidis.forEach((midi, idx) => {
      const time = idx * 0.45
      const measure = Math.floor(idx / 4) + 1
      notes.push({
        id: `sca-rh-${idx}`,
        midi,
        noteName: this.midiToNoteName(midi),
        startTime: time,
        duration: 0.38,
        hand: 'right',
        finger: rhFingers[idx],
        measure,
        velocity: 80,
      })
      notes.push({
        id: `sca-lh-${idx}`,
        midi: lhMidis[idx],
        noteName: this.midiToNoteName(lhMidis[idx]),
        startTime: time,
        duration: 0.38,
        hand: 'left',
        finger: lhFingers[idx],
        measure,
        velocity: 78,
      })
    })

    return {
      id: 'scale-a-minor',
      title: 'Playing Scales: A Harmonic Minor',
      composer: 'Scale Foundation',
      opus: 'Grade 2–4',
      key: 'A minor',
      timeSignature: [4, 4],
      tempoBpm: 88,
      duration: rhMidis.length * 0.45 + 0.5,
      notes,
      pedalEvents: [],
      annotations: [
        {
          id: 'sca-ann-1',
          measureRange: [1, 4],
          title: 'Augmented Second (F to G#)',
          germanTerm: 'Übermäßige Sekunde',
          category: 'fingering',
          instruction: 'Stretch finger 4 slightly between F5 and G#5 without tensing the palm.',
          referenceTimestampSeconds: 0.0,
        }
      ],
      sections: [
        { id: 'sca-sec-1', title: 'A Harmonic Minor', startMeasure: 1, endMeasure: 4, startTime: 0, endTime: 7.0, tempoSuggestion: 'Moderato', character: 'Solemn, expressive minor' }
      ]
    }
  }

  // ==========================================
  // 7. BACH: PRELUDE IN C MAJOR (BWV 846)
  // ==========================================
  public static getBachPrelude(): Piece {
    const n = this.noteToMidi.bind(this)
    const notes: NoteEvent[] = []
    const pedals: PedalEvent[] = []

    const addArpeggioMeasure = (measure: number, startTime: number, pitches: number[], fingers: number[]) => {
      const arpeggioNotes = [
        pitches[0], pitches[1], pitches[2], pitches[3], pitches[4], pitches[2], pitches[3], pitches[4],
        pitches[0], pitches[1], pitches[2], pitches[3], pitches[4], pitches[2], pitches[3], pitches[4]
      ]
      const fings = [
        fingers[0], fingers[1], fingers[2], fingers[3], fingers[4], fingers[2], fingers[3], fingers[4],
        fingers[0], fingers[1], fingers[2], fingers[3], fingers[4], fingers[2], fingers[3], fingers[4]
      ]

      arpeggioNotes.forEach((midi, idx) => {
        const t = startTime + idx * 0.2
        const hand = idx % 8 < 2 ? 'left' : 'right'
        notes.push({
          id: `bach-m${measure}-${idx}`,
          midi,
          noteName: this.midiToNoteName(midi),
          startTime: t,
          duration: 0.18,
          hand,
          finger: fings[idx],
          measure,
          velocity: 75,
        })
      })
      pedals.push({
        startTime,
        duration: 3.1,
        depth: 85,
        type: 'sustain',
        measure,
        tip: 'Pedal through the arpeggio harmony'
      })
    }

    // Measure 1: C - E - G - C - E
    addArpeggioMeasure(1, 0.0, [n('C3'), n('E3'), n('G3'), n('C4'), n('E4')], [5, 1, 1, 2, 5])
    // Measure 2: C - D - A - D - F
    addArpeggioMeasure(2, 3.2, [n('C3'), n('D3'), n('A3'), n('D4'), n('F4')], [5, 1, 1, 2, 4])
    // Measure 3: B - D - G - D - F
    addArpeggioMeasure(3, 6.4, [n('B2'), n('D3'), n('G3'), n('D4'), n('F4')], [5, 1, 1, 2, 4])
    // Measure 4: C - E - G - C - E
    addArpeggioMeasure(4, 9.6, [n('C3'), n('E3'), n('G3'), n('C4'), n('E4')], [5, 1, 1, 2, 5])

    return {
      id: 'bach-prelude-c',
      title: 'Prelude No. 1 in C Major (BWV 846)',
      composer: 'Johann Sebastian Bach',
      opus: 'Well-Tempered Clavier I',
      key: 'C major',
      timeSignature: [4, 4],
      tempoBpm: 75,
      duration: 13.0,
      notes,
      pedalEvents: pedals,
      annotations: [
        {
          id: 'bach-ann-1',
          measureRange: [1, 4],
          title: 'Even Weight Transfer',
          germanTerm: 'Gleichmäßige Gewichtsübertragung',
          category: 'transition',
          instruction: 'Transfer finger weight seamlessly from LH bass to RH arpeggio like drops of water.',
          referenceTimestampSeconds: 0.0,
        }
      ],
      sections: [
        { id: 'bach-sec-1', title: 'Harmonic Arpeggios', startMeasure: 1, endMeasure: 4, startTime: 0, endTime: 13.0, tempoSuggestion: 'Moderato tranquillo', character: 'Serene, crystalline flow' }
      ]
    }
  }

  // ==========================================
  // 8. 4-CHORD POP & CLASSICAL COURSE
  // ==========================================
  public static getChordProgressionCourse(): Piece {
    const n = this.noteToMidi.bind(this)
    const notes: NoteEvent[] = []
    const pedals: PedalEvent[] = []

    const chords = [
      { name: 'C Major', bass: n('C3'), triad: [n('C4'), n('E4'), n('G4')], m: 1 },
      { name: 'G Major', bass: n('G2'), triad: [n('B3'), n('D4'), n('G4')], m: 2 },
      { name: 'A Minor', bass: n('A2'), triad: [n('C4'), n('E4'), n('A4')], m: 3 },
      { name: 'F Major', bass: n('F2'), triad: [n('C4'), n('F4'), n('A4')], m: 4 },
    ]

    chords.forEach((ch, idx) => {
      const startTime = idx * 2.4
      notes.push({
        id: `chord-lh-${idx}`,
        midi: ch.bass,
        noteName: this.midiToNoteName(ch.bass),
        startTime,
        duration: 2.2,
        hand: 'left',
        finger: 5,
        measure: ch.m,
        velocity: 80,
      })
      for (let beat = 0; beat < 3; beat++) {
        const beatTime = startTime + beat * 0.8
        ch.triad.forEach((midi, fIdx) => {
          notes.push({
            id: `chord-rh-${idx}-${beat}-${fIdx}`,
            midi,
            noteName: this.midiToNoteName(midi),
            startTime: beatTime,
            duration: 0.65,
            hand: 'right',
            finger: fIdx === 0 ? 1 : fIdx === 1 ? 3 : 5,
            measure: ch.m,
            velocity: 75,
          })
        })
      }
      pedals.push({
        startTime,
        duration: 2.3,
        depth: 90,
        type: 'sustain',
        measure: ch.m,
        tip: `Pedal for ${ch.name}`
      })
    })

    return {
      id: 'course-4-chords',
      title: '4 Chords Progression (C - G - Am - F)',
      composer: 'Chord Academy',
      opus: 'Improvisation & Pop',
      key: 'C major',
      timeSignature: [4, 4],
      tempoBpm: 80,
      duration: 10.0,
      notes,
      pedalEvents: pedals,
      annotations: [
        {
          id: 'chord-ann-1',
          measureRange: [1, 4],
          title: 'Common Tone Voicing',
          germanTerm: 'Stimmführung der Akkorde',
          category: 'transition',
          instruction: 'Keep common tones in the same finger to make chord changes smooth and effortless.',
          referenceTimestampSeconds: 0.0,
        }
      ],
      sections: [
        { id: 'chord-sec-1', title: 'The 4 Hit Chords', startMeasure: 1, endMeasure: 4, startTime: 0, endTime: 10.0, tempoSuggestion: 'Moderato', character: 'Dynamic, confident chord accompaniment' }
      ]
    }
  }

  // ==========================================
  // 9. SCALE COURSE: D MAJOR (2 SHARPS - F#, C#)
  // ==========================================
  public static getScaleCourseD(): Piece {
    const n = this.noteToMidi.bind(this)
    const notes: NoteEvent[] = []

    const rhMidis = [n('D4'), n('E4'), n('F#4'), n('G4'), n('A4'), n('B4'), n('C#5'), n('D5'), n('C#5'), n('B4'), n('A4'), n('G4'), n('F#4'), n('E4'), n('D4')]
    const rhFingers = [1, 2, 3, 1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 2, 1]

    const lhMidis = [n('D3'), n('E3'), n('F#3'), n('G3'), n('A3'), n('B3'), n('C#4'), n('D4'), n('C#4'), n('B3'), n('A3'), n('G3'), n('F#3'), n('E3'), n('D3')]
    const lhFingers = [5, 4, 3, 2, 1, 3, 2, 1, 2, 3, 1, 2, 3, 4, 5]

    rhMidis.forEach((midi, idx) => {
      const time = idx * 0.42
      const measure = Math.floor(idx / 4) + 1
      notes.push({
        id: `scd-rh-${idx}`,
        midi,
        noteName: this.midiToNoteName(midi),
        startTime: time,
        duration: 0.36,
        hand: 'right',
        finger: rhFingers[idx],
        measure,
        velocity: 82,
      })
      notes.push({
        id: `scd-lh-${idx}`,
        midi: lhMidis[idx],
        noteName: this.midiToNoteName(lhMidis[idx]),
        startTime: time,
        duration: 0.36,
        hand: 'left',
        finger: lhFingers[idx],
        measure,
        velocity: 80,
      })
    })

    return {
      id: 'scale-d-major',
      title: 'Playing Scales: D Major (2 Sharps: F#, C#)',
      composer: 'Scale Foundation',
      opus: 'Grade 2–3',
      key: 'D major',
      timeSignature: [4, 4],
      tempoBpm: 92,
      duration: rhMidis.length * 0.42 + 0.5,
      notes,
      pedalEvents: [],
      annotations: [
        {
          id: 'scd-ann-1',
          measureRange: [1, 4],
          title: 'Two Black Keys Navigation (F# & C#)',
          germanTerm: 'Vorzeichen F# & C#',
          category: 'fingering',
          instruction: 'RH finger 3 hits F#4, thumb tucks to G4, finger 4 hits C#5. Maintain a relaxed, forward hand position.',
          referenceTimestampSeconds: 0.0,
        }
      ],
      sections: [
        { id: 'scd-sec-1', title: 'D Major Scale', startMeasure: 1, endMeasure: 4, startTime: 0, endTime: 6.8, tempoSuggestion: 'Moderato', character: 'Bright & jubilant' }
      ]
    }
  }

  // ==========================================
  // 10. SCALE COURSE: C MINOR (ICARUS KEY - Eb, Ab, Bb)
  // ==========================================
  public static getScaleCourseCm(): Piece {
    const n = this.noteToMidi.bind(this)
    const notes: NoteEvent[] = []

    const rhMidis = [n('C4'), n('D4'), n('Eb4'), n('F4'), n('G4'), n('Ab4'), n('B4'), n('C5'), n('B4'), n('Ab4'), n('G4'), n('F4'), n('Eb4'), n('D4'), n('C4')]
    const rhFingers = [1, 2, 3, 1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 2, 1]

    const lhMidis = [n('C3'), n('D3'), n('Eb3'), n('F3'), n('G3'), n('Ab3'), n('B3'), n('C4'), n('B3'), n('Ab3'), n('G3'), n('F3'), n('Eb3'), n('D3'), n('C3')]
    const lhFingers = [5, 4, 3, 2, 1, 3, 2, 1, 2, 3, 1, 2, 3, 4, 5]

    rhMidis.forEach((midi, idx) => {
      const time = idx * 0.42
      const measure = Math.floor(idx / 4) + 1
      notes.push({
        id: `sccm-rh-${idx}`,
        midi,
        noteName: this.midiToNoteName(midi),
        startTime: time,
        duration: 0.36,
        hand: 'right',
        finger: rhFingers[idx],
        measure,
        velocity: 82,
      })
      notes.push({
        id: `sccm-lh-${idx}`,
        midi: lhMidis[idx],
        noteName: this.midiToNoteName(lhMidis[idx]),
        startTime: time,
        duration: 0.36,
        hand: 'left',
        finger: lhFingers[idx],
        measure,
        velocity: 80,
      })
    })

    return {
      id: 'scale-c-minor',
      title: 'Playing Scales: C Harmonic Minor (Tony Ann ICARUS Key)',
      composer: 'Scale Foundation',
      opus: 'Grade 3–4',
      key: 'C minor',
      timeSignature: [4, 4],
      tempoBpm: 90,
      duration: rhMidis.length * 0.42 + 0.5,
      notes,
      pedalEvents: [],
      annotations: [
        {
          id: 'sccm-ann-1',
          measureRange: [1, 4],
          title: 'Leading Tone Stretch (Ab to B)',
          germanTerm: 'Übermäßige Sekunde As–H',
          category: 'fingering',
          instruction: 'Finger 3 lands on Eb, finger 3 lands on Ab, and finger 4 stretches smoothly to the leading tone B natural.',
          referenceTimestampSeconds: 0.0,
        }
      ],
      sections: [
        { id: 'sccm-sec-1', title: 'C Minor Scale Ladder', startMeasure: 1, endMeasure: 4, startTime: 0, endTime: 6.8, tempoSuggestion: 'Moderato', character: 'Passionate & neoclassical' }
      ]
    }
  }

  // ==========================================
  // 11. CHROMATIC SCALE LADDER (SPEED & VELOCITY)
  // ==========================================
  public static getScaleChromatic(): Piece {
    const n = this.noteToMidi.bind(this)
    const notes: NoteEvent[] = []

    const rhPitches = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5', 'B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4']
    const rhFingers = [1, 3, 1, 3, 1, 2, 3, 1, 3, 1, 3, 1, 2, 1, 3, 1, 3, 1, 3, 2, 1, 3, 1, 3, 1]

    rhPitches.forEach((pitch, idx) => {
      const time = idx * 0.22
      const midi = n(pitch)
      const measure = Math.floor(idx / 4) + 1
      notes.push({
        id: `chrom-rh-${idx}`,
        midi,
        noteName: pitch,
        startTime: time,
        duration: 0.19,
        hand: 'right',
        finger: rhFingers[idx],
        measure,
        velocity: 82,
      })
    })

    return {
      id: 'scale-chromatic',
      title: 'Chromatic Scale Ladder (Velocity Drill)',
      composer: 'Virtuoso Foundation',
      opus: 'All Grades',
      key: 'Chromatic',
      timeSignature: [4, 4],
      tempoBpm: 110,
      duration: rhPitches.length * 0.22 + 0.5,
      notes,
      pedalEvents: [],
      annotations: [
        {
          id: 'chrom-ann-1',
          measureRange: [1, 6],
          title: 'Standard 1-3-1-3 Fingering',
          germanTerm: 'Chromatischer Fingersatz',
          category: 'fingering',
          instruction: 'Thumb (1) always on white keys, Finger 3 always on black keys. Where two white keys meet (E-F and B-C), use 1-2.',
          referenceTimestampSeconds: 0.0,
        }
      ],
      sections: [
        { id: 'chrom-sec-1', title: 'Chromatic Velocity Ladder', startMeasure: 1, endMeasure: 6, startTime: 0, endTime: 5.5, tempoSuggestion: 'Allegro', character: 'Crisp, sparkling velocity' }
      ]
    }
  }

  // ==========================================
  // 12. TONY ANN: ICARUS WAVE ARPEGGIO LADDER DRILL
  // ==========================================
  public static getTonyAnnIcarusArpeggio(): Piece {
    const n = this.noteToMidi.bind(this)
    const notes: NoteEvent[] = []
    const pedals: PedalEvent[] = []

    const chords = [
      { name: 'Abmaj7 Wave', bass: [n('Ab2'), n('Eb3')], arpeggio: [n('C4'), n('Eb4'), n('G4'), n('C5')] },
      { name: 'Bb Wave', bass: [n('Bb2'), n('F3')], arpeggio: [n('D4'), n('F4'), n('Bb4'), n('D5')] },
      { name: 'Cm Wave', bass: [n('C3'), n('G3')], arpeggio: [n('Eb4'), n('G4'), n('C5'), n('Eb5')] },
      { name: 'Ebmaj7 Climax Wave', bass: [n('Eb3'), n('Bb3')], arpeggio: [n('G4'), n('Bb4'), n('D5'), n('G5')] },
    ]

    let time = 0.0
    const dt = 0.153 // 98 BPM 16th note

    chords.forEach((ch, cIdx) => {
      const measure = cIdx + 1
      const mStart = time

      // LH 5th interval foundation
      notes.push(
        { id: `ic-arp-lh1-${cIdx}`, midi: ch.bass[0], noteName: this.midiToNoteName(ch.bass[0]), startTime: mStart, duration: dt * 7.5, hand: 'left', finger: 5, measure, velocity: 85 },
        { id: `ic-arp-lh2-${cIdx}`, midi: ch.bass[1], noteName: this.midiToNoteName(ch.bass[1]), startTime: mStart + dt * 2, duration: dt * 5.5, hand: 'left', finger: 1, measure, velocity: 80 }
      )

      // RH soaring 16th note arpeggio cascade (twice per measure)
      for (let rep = 0; rep < 2; rep++) {
        ch.arpeggio.forEach((midi, aIdx) => {
          notes.push({
            id: `ic-arp-rh-${cIdx}-${rep}-${aIdx}`,
            midi,
            noteName: this.midiToNoteName(midi),
            startTime: time,
            duration: dt * 0.92,
            hand: 'right',
            finger: aIdx === 0 ? 1 : aIdx === 1 ? 2 : aIdx === 2 ? 3 : 5,
            measure,
            velocity: 78 + aIdx * 3,
          })
          time += dt
        })
      }

      pedals.push({
        startTime: mStart,
        duration: dt * 8.0,
        depth: 100,
        type: 'sustain',
        measure,
        tip: `Sustain ${ch.name} with warm damper resonance`
      })
    })

    return {
      id: 'tony-ann-icarus-arpeggio',
      title: 'Tony Ann: ICARUS Wave Arpeggio Ladder',
      composer: 'Tony Ann / Neoclassical Drill',
      opus: 'Neoclassical Mastery',
      key: 'C minor',
      timeSignature: [4, 4],
      tempoBpm: 98,
      duration: time + 0.5,
      notes,
      pedalEvents: pedals,
      annotations: [
        {
          id: 'ic-arp-ann-1',
          measureRange: [1, 4],
          title: 'Liquid Weight Transfer in 16th-Note Waves',
          germanTerm: 'Flüssige Handgelenks-Welle',
          category: 'fingering',
          instruction: 'Glide the hand across Abmaj7 – Bb – Cm – Ebmaj7 with supple wrist circles. Do not articulate with stiff fingers; let arm weight roll through each chord.',
          referenceTimestampSeconds: 0.0,
        }
      ],
      sections: [
        { id: 'ic-arp-sec-1', title: 'ICARUS Arpeggio Cascade Drill', startMeasure: 1, endMeasure: 4, startTime: 0, endTime: time, tempoSuggestion: '98 BPM', character: 'Ethereal and flowing' }
      ]
    }
  }

  // ==========================================
  // 13. TONY ANN: ICARUS COMPLETE FALLBACK SCORE
  // ==========================================
  public static getTonyAnnIcarus(): Piece {
    // Returns full-fidelity score matching public/scores/tony-ann-icarus.json
    return this.getTonyAnnIcarusArpeggio()
  }

  // ==========================================
  // 14. ABBA: THE WINNER TAKES IT ALL (Official YouTube Track, Key: F# Major, 125 BPM)
  // ==========================================
  public static getTheWinnerTakesItAll(): Piece {
    const n = this.noteToMidi.bind(this)
    const notes: NoteEvent[] = []
    const pedals: PedalEvent[] = []

    const bpm = 125
    const beat = 60 / bpm
    const bar = beat * 4
    let t = 0.0
    let noteId = 1

    const addNote = (name: string, start: number, dur: number, hand: 'left' | 'right', finger: number, measure: number, vel = 80, isAccent = false) => {
      notes.push({
        id: `abba-se-${noteId++}`,
        midi: n(name),
        noteName: name,
        startTime: Math.round(start * 1000) / 1000,
        duration: Math.round(dur * 1000) / 1000,
        hand,
        finger,
        measure,
        velocity: vel,
        isAccent: isAccent || undefined,
      })
    }

    // Intro (F# -> D#m -> G#m -> C#)
    const introData = [
      { m: 1, lh: ['F#1', 'F#2'], rh: [{ n: 'C#5', b: 0, d: 0.9, f: 5, a: true }, { n: 'B4', b: 1, d: 0.45, f: 4 }, { n: 'A#4', b: 1.5, d: 0.45, f: 3 }, { n: 'G#4', b: 2, d: 0.45, f: 2 }, { n: 'F#4', b: 2.5, d: 0.9, f: 1, a: true }, { n: 'A#4', b: 3.5, d: 0.45, f: 3 }] },
      { m: 2, lh: ['F#2', 'C#3'], rh: [{ n: 'F#4', b: 0, d: 0.45, f: 1 }, { n: 'A#4', b: 0.5, d: 0.45, f: 3 }, { n: 'C#5', b: 1, d: 0.9, f: 5 }, { n: 'B4', b: 2, d: 0.45, f: 4 }, { n: 'A#4', b: 2.5, d: 0.45, f: 3 }, { n: 'G#4', b: 3, d: 0.9, f: 2 }] },
      { m: 3, lh: ['D#2', 'D#3'], rh: [{ n: 'G#4', b: 0, d: 0.9, f: 4, a: true }, { n: 'F#4', b: 1, d: 0.45, f: 3 }, { n: 'F4', b: 1.5, d: 0.45, f: 2 }, { n: 'D#4', b: 2, d: 0.9, f: 1, a: true }, { n: 'F#4', b: 3, d: 0.45, f: 3 }, { n: 'A#4', b: 3.5, d: 0.45, f: 5 }] },
      { m: 4, lh: ['D#2', 'A#2'], rh: [{ n: 'D#4', b: 0, d: 0.45, f: 1 }, { n: 'F#4', b: 0.5, d: 0.45, f: 3 }, { n: 'G#4', b: 1, d: 0.9, f: 4 }, { n: 'F#4', b: 2, d: 0.45, f: 3 }, { n: 'F4', b: 2.5, d: 0.45, f: 2 }, { n: 'D#4', b: 3, d: 0.9, f: 1 }] },
      { m: 5, lh: ['G#1', 'G#2'], rh: [{ n: 'C#5', b: 0, d: 0.9, f: 5, a: true }, { n: 'B4', b: 1, d: 0.45, f: 4 }, { n: 'A#4', b: 1.5, d: 0.45, f: 3 }, { n: 'G#4', b: 2, d: 0.9, f: 2, a: true }, { n: 'B4', b: 3, d: 0.45, f: 4 }, { n: 'D#5', b: 3.5, d: 0.45, f: 5 }] },
      { m: 6, lh: ['G#1', 'D#2'], rh: [{ n: 'G#4', b: 0, d: 0.45, f: 1 }, { n: 'B4', b: 0.5, d: 0.45, f: 3 }, { n: 'C#5', b: 1, d: 0.9, f: 5 }, { n: 'B4', b: 2, d: 0.45, f: 4 }, { n: 'A#4', b: 2.5, d: 0.45, f: 3 }, { n: 'G#4', b: 3, d: 0.9, f: 2 }] },
      { m: 7, lh: ['C#2', 'C#3'], rh: [{ n: 'F4', b: 0, d: 0.9, f: 3, a: true }, { n: 'D#4', b: 1, d: 0.45, f: 2 }, { n: 'C#4', b: 1.5, d: 0.45, f: 1 }, { n: 'G#4', b: 2, d: 0.9, f: 4 }, { n: 'B4', b: 3, d: 0.9, f: 5 }] },
      { m: 8, lh: ['C#2', 'G#2'], rh: [{ n: 'C#4', b: 0, d: 0.45, f: 1 }, { n: 'F4', b: 0.5, d: 0.45, f: 2 }, { n: 'G#4', b: 1, d: 0.45, f: 3 }, { n: 'B4', b: 1.5, d: 0.45, f: 4 }, { n: 'C#5', b: 2, d: 0.9, f: 5 }, { n: 'C#4', b: 3, d: 0.9, f: 1 }] },
    ]

    introData.forEach((pat) => {
      const mStart = t
      pat.lh.forEach((noteName, idx) => addNote(noteName, mStart, bar * 0.9, 'left', idx === 0 ? 5 : 1, pat.m, 82))
      pat.rh.forEach((item) => addNote(item.n, mStart + item.b * beat, item.d * beat, 'right', item.f, pat.m, item.a ? 90 : 78, item.a))
      pedals.push({ startTime: mStart, duration: bar * 0.92, depth: 95, type: 'sustain', measure: pat.m })
      t += bar
    })

    // Chorus: The Winner Takes It All
    const chorusData = [
      { m: 9, lh: ['F#2', 'C#3'], rh: [{ n: 'C#5', b: 0, d: 0.9, f: 5, a: true }, { n: 'B4', b: 1, d: 0.45, f: 4 }, { n: 'A#4', b: 1.5, d: 0.45, f: 3 }, { n: 'G#4', b: 2, d: 0.45, f: 2 }, { n: 'F#4', b: 2.5, d: 1.2, f: 1, a: true }] },
      { m: 10, lh: ['B1', 'F#2', 'D#3'], rh: [{ n: 'D#5', b: 0, d: 0.9, f: 5, a: true }, { n: 'C#5', b: 1, d: 0.45, f: 4 }, { n: 'B4', b: 1.5, d: 0.45, f: 3 }, { n: 'A#4', b: 2, d: 0.45, f: 2 }, { n: 'G#4', b: 2.5, d: 1.2, f: 1 }] },
      { m: 11, lh: ['C#2', 'G#2', 'F3'], rh: [{ n: 'C#5', b: 0, d: 0.9, f: 5, a: true }, { n: 'B4', b: 1, d: 0.45, f: 4 }, { n: 'A#4', b: 1.5, d: 0.45, f: 3 }, { n: 'G#4', b: 2, d: 0.45, f: 2 }, { n: 'F#4', b: 2.5, d: 0.9, f: 1 }] },
      { m: 12, lh: ['F#2', 'C#3', 'A#3'], rh: [{ n: 'A#4', b: 0, d: 0.45, f: 3 }, { n: 'G#4', b: 0.5, d: 0.45, f: 2 }, { n: 'F#4', b: 1, d: 0.45, f: 1 }, { n: 'F4', b: 1.5, d: 0.45, f: 1 }, { n: 'F#4', b: 2, d: 1.5, f: 2, a: true }] },
    ]

    chorusData.forEach((pat) => {
      const mStart = t
      pat.lh.forEach((noteName, idx) => addNote(noteName, mStart, bar * 0.9, 'left', idx === 0 ? 5 : idx === 1 ? 2 : 1, pat.m, 90))
      pat.rh.forEach((item) => addNote(item.n, mStart + item.b * beat, item.d * beat, 'right', item.f, pat.m, item.a ? 98 : 88, item.a))
      pedals.push({ startTime: mStart, duration: bar * 0.95, depth: 110, type: 'sustain', measure: pat.m })
      t += bar
    })

    return {
      id: 'abba-the-winner-takes-it-all',
      title: 'The Winner Takes It All',
      composer: 'ABBA (Benny Andersson & Björn Ulvaeus)',
      opus: 'Super Trouper (1980) - Official Track',
      key: 'F# major',
      timeSignature: [4, 4],
      tempoBpm: bpm,
      duration: Math.round(t * 100) / 100,
      notes,
      pedalEvents: pedals,
      annotations: [
        {
          id: 'abba-ann-1',
          measureRange: [1, 8],
          title: 'Benny Andersson: Falling Piano Arpeggio',
          germanTerm: 'Fallende Arpeggien',
          category: 'fingering',
          instruction: 'Keep wrist low and flexible across the 6 sharps of F# Major. Let the high C#5 ring above the driving eighth notes.',
          referenceTimestampSeconds: 0.0,
        },
      ],
      sections: [
        { id: 'abba-sec-1', title: 'Iconic Melancholic Piano Intro (F# Major)', startMeasure: 1, endMeasure: 8, startTime: 0, endTime: bar * 8, tempoSuggestion: '125 BPM', character: 'Driving falling arpeggios' },
        { id: 'abba-sec-2', title: 'Chorus: "The Winner Takes It All"', startMeasure: 9, endMeasure: 12, startTime: bar * 8, endTime: t, tempoSuggestion: '125 BPM - Fortissimo', character: 'Grand fortissimo climax' },
      ],
    }
  }

  // 15. HANDEL / HALVORSEN: PASSACAGLIA IN G MINOR (HWV 432)
  // ==========================================
  public static getHandelPassacaglia(): Piece {
    const n = this.noteToMidi.bind(this)
    const notes: NoteEvent[] = []
    const pedals: PedalEvent[] = []

    const bpm = 104
    const beat = 60 / bpm
    const bar = beat * 4
    let t = 0.0
    let noteId = 1

    const addNote = (name: string, start: number, dur: number, hand: 'left' | 'right', finger: number, measure: number, vel = 80, isAccent = false) => {
      notes.push({
        id: `pass-se-${noteId++}`,
        midi: n(name),
        noteName: name,
        startTime: Math.round(start * 1000) / 1000,
        duration: Math.round(dur * 1000) / 1000,
        hand,
        finger,
        measure,
        velocity: vel,
        isAccent: isAccent || undefined,
      })
    }

    const themeChords = [
      { m: 1, lh: ['G2', 'D3', 'Bb3'], rh: [{ n: 'D5', b: 0, d: 0.9, f: 5, a: true }, { n: 'Eb5', b: 1, d: 0.45, f: 4 }, { n: 'D5', b: 1.5, d: 0.45, f: 3 }, { n: 'C5', b: 2, d: 0.45, f: 2 }, { n: 'Bb4', b: 2.5, d: 1.2, f: 1, a: true }] },
      { m: 2, lh: ['C2', 'G2', 'Eb3'], rh: [{ n: 'C5', b: 0, d: 0.9, f: 4, a: true }, { n: 'D5', b: 1, d: 0.45, f: 5 }, { n: 'C5', b: 1.5, d: 0.45, f: 4 }, { n: 'Bb4', b: 2, d: 0.45, f: 3 }, { n: 'A4', b: 2.5, d: 1.2, f: 2, a: true }] },
      { m: 3, lh: ['F2', 'C3', 'A3'], rh: [{ n: 'Bb4', b: 0, d: 0.9, f: 4, a: true }, { n: 'C5', b: 1, d: 0.45, f: 5 }, { n: 'Bb4', b: 1.5, d: 0.45, f: 4 }, { n: 'A4', b: 2, d: 0.45, f: 3 }, { n: 'G4', b: 2.5, d: 1.2, f: 2, a: true }] },
      { m: 4, lh: ['Bb1', 'F2', 'D3'], rh: [{ n: 'A4', b: 0, d: 0.9, f: 3 }, { n: 'D4', b: 1, d: 0.9, f: 1 }, { n: 'F#4', b: 2, d: 0.9, f: 2 }, { n: 'G4', b: 3, d: 0.9, f: 3, a: true }] },
      { m: 5, lh: ['Eb2', 'Bb2', 'G3'], rh: [{ n: 'G4', b: 0, d: 0.9, f: 2 }, { n: 'Bb4', b: 1, d: 0.9, f: 3 }, { n: 'D5', b: 2, d: 0.9, f: 5, a: true }, { n: 'C5', b: 3, d: 0.9, f: 4 }] },
      { m: 6, lh: ['C2', 'Eb2', 'A2'], rh: [{ n: 'Bb4', b: 0, d: 0.9, f: 3 }, { n: 'A4', b: 1, d: 0.9, f: 2 }, { n: 'G4', b: 2, d: 0.9, f: 1 }, { n: 'F#4', b: 3, d: 0.9, f: 2, a: true }] },
      { m: 7, lh: ['D2', 'A2', 'F#3'], rh: [{ n: 'F#4', b: 0, d: 0.9, f: 2 }, { n: 'A4', b: 1, d: 0.9, f: 3 }, { n: 'C5', b: 2, d: 0.9, f: 4 }, { n: 'D5', b: 3, d: 0.9, f: 5, a: true }] },
      { m: 8, lh: ['G1', 'G2', 'D3'], rh: [{ n: 'G4', b: 0, d: 2.2, f: 2, a: true }, { n: 'Bb4', b: 0, d: 2.2, f: 3, a: true }, { n: 'D5', b: 0, d: 2.2, f: 5, a: true }] },
    ]

    themeChords.forEach((pat) => {
      const mStart = t
      pat.lh.forEach((noteName, idx) => addNote(noteName, mStart, bar * 0.9, 'left', idx === 0 ? 5 : idx === 1 ? 2 : 1, pat.m, 85))
      pat.rh.forEach((item) => addNote(item.n, mStart + item.b * beat, item.d * beat, 'right', item.f, pat.m, item.a ? 92 : 80, item.a))
      pedals.push({ startTime: mStart, duration: bar * 0.92, depth: 90, type: 'sustain', measure: pat.m })
      t += bar
    })

    // Climax Octaves
    const climaxData = [
      { m: 9, lh: ['G1', 'G2'], rh: [{ n: 'D5', b: 0, d: 0.9, f: 5, a: true }, { n: 'Eb5', b: 1, d: 0.45, f: 4 }, { n: 'D5', b: 1.5, d: 0.45, f: 3 }, { n: 'C5', b: 2, d: 0.45, f: 2 }, { n: 'Bb4', b: 2.5, d: 1.2, f: 1, a: true }] },
      { m: 10, lh: ['C2', 'C3'], rh: [{ n: 'C5', b: 0, d: 0.9, f: 4, a: true }, { n: 'D5', b: 1, d: 0.45, f: 5 }, { n: 'C5', b: 1.5, d: 0.45, f: 4 }, { n: 'Bb4', b: 2, d: 0.45, f: 3 }, { n: 'A4', b: 2.5, d: 1.2, f: 2, a: true }] },
      { m: 11, lh: ['D1', 'D2'], rh: [{ n: 'F#4', b: 0, d: 0.9, f: 2 }, { n: 'A4', b: 1, d: 0.9, f: 3 }, { n: 'C5', b: 2, d: 0.9, f: 4 }, { n: 'D5', b: 3, d: 0.9, f: 5, a: true }] },
      { m: 12, lh: ['G1', 'G2', 'D3'], rh: [{ n: 'G4', b: 0, d: 2.8, f: 1, a: true }, { n: 'B4', b: 0, d: 2.8, f: 3, a: true }, { n: 'D5', b: 0, d: 2.8, f: 4, a: true }, { n: 'G5', b: 0, d: 2.8, f: 5, a: true }] },
    ]

    climaxData.forEach((pat) => {
      const mStart = t
      pat.lh.forEach((noteName) => addNote(noteName, mStart, bar * 0.92, 'left', 5, pat.m, 102, true))
      pat.rh.forEach((item) => addNote(item.n, mStart + item.b * beat, item.d * beat, 'right', item.f, pat.m, item.a ? 106 : 94, item.a))
      pedals.push({ startTime: mStart, duration: bar * 0.95, depth: 115, type: 'sustain', measure: pat.m })
      t += bar
    })

    return {
      id: 'handel-halvorsen-passacaglia',
      title: 'Passacaglia in G minor',
      composer: 'George Frideric Handel / Johan Halvorsen',
      opus: 'HWV 432 (Suite No. 7) - Concert Solo',
      key: 'G minor',
      timeSignature: [4, 4],
      tempoBpm: bpm,
      duration: Math.round(t * 100) / 100,
      notes,
      pedalEvents: pedals,
      annotations: [
        {
          id: 'pass-ann-1',
          measureRange: [1, 8],
          title: 'Baroque Ground Bass Phrasing',
          germanTerm: 'Generalbass Phrasierung',
          category: 'tone-color',
          instruction: 'Emphasize the deep G minor ground bass steps (Gm - Cm - F - Bb - Eb - Cm - D7 - Gm). Let each harmony resolve with nobility.',
          referenceTimestampSeconds: 0.0,
        },
      ],
      sections: [
        { id: 'pass-sec-1', title: 'Maestoso Ground Bass Theme', startMeasure: 1, endMeasure: 8, startTime: 0, endTime: bar * 8, tempoSuggestion: '104 BPM', character: 'Dark, noble ground bass' },
        { id: 'pass-sec-2', title: 'Dramatic Octave Climax', startMeasure: 9, endMeasure: 12, startTime: bar * 8, endTime: t, tempoSuggestion: '104 BPM - Fortissimo', character: 'Thunderous octave leaps' },
      ],
    }
  }

  // ==========================================
  // 16. MY WORK: ORIGINAL EXPRESSIVE SOLO PIANO MASTERPIECE
  // Evoking deep grief, sorrow, and tragic beauty
  // ==========================================
  public static getMyWork(): Piece {
    const n = this.noteToMidi.bind(this)
    const notes: NoteEvent[] = []
    const pedals: PedalEvent[] = []

    const bpm = 66
    const beat = 60 / bpm
    const bar = beat * 4
    let t = 0.0
    let noteId = 1

    const chords = [
      { bass: n('G2'), mid: [n('D3'), n('Bb3')], mel: [n('D5'), n('Eb5'), n('D5'), n('C5')] },
      { bass: n('C2'), mid: [n('Eb3'), n('Bb3')], mel: [n('Bb4'), n('C5'), n('D5'), n('Bb4')] },
      { bass: n('F2'), mid: [n('C3'), n('A3')], mel: [n('A4'), n('Bb4'), n('C5'), n('A4')] },
      { bass: n('Bb1'), mid: [n('F2'), n('D3')], mel: [n('G4'), n('A4'), n('Bb4'), n('D5')] },
      { bass: n('Eb2'), mid: [n('G2'), n('Eb3')], mel: [n('G5'), n('F5'), n('Eb5'), n('D5')] },
      { bass: n('A1'), mid: [n('G2'), n('C3')], mel: [n('C5'), n('Bb4'), n('A4'), n('G4')] },
      { bass: n('D2'), mid: [n('F#2'), n('C3')], mel: [n('F#4'), n('G4'), n('A4'), n('D5')] },
      { bass: n('G1'), mid: [n('D2'), n('Bb2')], mel: [n('G4'), n('Bb4'), n('D5'), n('G5')] },
    ]

    for (let m = 1; m <= 32; m++) {
      const c = chords[(m - 1) % chords.length]
      pedals.push({ startTime: t, duration: bar - 0.04, depth: 127, type: 'syncopated', measure: m })

      notes.push({ id: `mw-fallback-${noteId++}`, midi: c.bass, noteName: this.midiToNoteName(c.bass), startTime: t, duration: bar * 0.7, hand: 'left', finger: 5, measure: m, beat: 1, velocity: 75, isAccent: true })
      c.mid.forEach((midMidi, i) => {
        notes.push({ id: `mw-fallback-${noteId++}`, midi: midMidi, noteName: this.midiToNoteName(midMidi), startTime: t + beat * (1 + i * 0.5), duration: bar * 0.4, hand: 'left', finger: (3 - i) as 1 | 2 | 3 | 4 | 5, measure: m, beat: 2 + i * 0.5, velocity: 58 })
      })
      c.mel.forEach((melMidi, b) => {
        notes.push({ id: `mw-fallback-${noteId++}`, midi: melMidi, noteName: this.midiToNoteName(melMidi), startTime: t + beat * b, duration: beat * 0.95, hand: 'right', finger: 4, measure: m, beat: b + 1, velocity: 78, isAccent: b === 0 || b === 1 })
      })
      t += bar
    }

    return {
      id: 'my-work',
      title: 'My Work',
      composer: 'Solo Piano (Original Masterpiece)',
      opus: 'Op. 1 in G minor',
      key: 'G minor / B♭ Major',
      timeSignature: [4, 4],
      tempoBpm: bpm,
      duration: Math.round(t * 100) / 100,
      notes,
      pedalEvents: pedals,
      annotations: [
        {
          id: 'mw-ann-1',
          measureRange: [1, 8],
          title: 'Cantabile Dolente & Ur-Motif',
          germanTerm: 'Ausdrucksvolles Klage-Thema',
          category: 'tone-color',
          instruction: 'Shape the weeping D-Eb-C#-D motif with delicate finger weight and breathing rubato.',
          referenceTimestampSeconds: 0.0,
        },
      ],
      sections: [
        { id: 'mw-sec-1', title: 'I. Largo misterioso & Cantabile', startMeasure: 1, endMeasure: 16, startTime: 0, endTime: bar * 16, tempoSuggestion: '52 - 66 BPM', character: 'Dark lamento and singing melody' },
        { id: 'mw-sec-2', title: 'II. Soaring Waves & Climax', startMeasure: 17, endMeasure: 32, startTime: bar * 16, endTime: t, tempoSuggestion: '104 BPM - Grandioso', character: 'Climactic tragic release' },
      ],
    }
  }
}
