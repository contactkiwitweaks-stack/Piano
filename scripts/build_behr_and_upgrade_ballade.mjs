import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { Midi } = require('@tonejs/midi')

const downloadsDir = path.join(process.env.USERPROFILE, 'Downloads')

/**
 * Quantize raw MIDI beat duration (durationTicks / ppq) into clean engraved beat values.
 * Handles typical 85-98% legato MIDI articulation cleanly (e.g., 0.95 -> 1.0, 1.90 -> 2.0, 2.85 -> 3.0, 3.80 -> 4.0).
 */
function quantizeBeats(rawBeats) {
  const candidates = [
    0.125, // 32nd
    0.1667, // 16th triplet
    0.25, // 16th
    0.3333, // 8th triplet
    0.375, // dotted 16th
    0.5, // 8th
    0.6667, // quarter triplet
    0.75, // dotted 8th
    1.0, // quarter
    1.5, // dotted quarter
    2.0, // half
    2.5, // half tied to 8th (Ballade M.1!)
    3.0, // dotted half
    4.0, // whole
    6.0, // dotted whole (6/4 full measure)
  ]
  // MIDI often trims 5-12% off sustained note length for release separation, so bias slightly upward
  const compensated = rawBeats * 1.045
  let best = candidates[0]
  let bestDiff = Infinity
  for (const c of candidates) {
    const diff = Math.abs(compensated - c) / c
    if (diff < bestDiff) {
      bestDiff = diff
      best = c
    }
  }
  return best
}

// ============================================================================
// 1. BUILD FRANZ BEHR (1837-1898) - FRENCH CHILD'S SONG
//    Verified note-by-note against "Franz Behr _(1837-1898) - French Child's Song.pdf"
// ============================================================================
function buildFranzBehr() {
  const midiFilename = fs
    .readdirSync(downloadsDir)
    .find((f) => f.includes('Franz Behr') && f.toLowerCase().endsWith('.mid'))
  if (!midiFilename) {
    throw new Error('Franz Behr MIDI not found in Downloads!')
  }
  const midi = new Midi(fs.readFileSync(path.join(downloadsDir, midiFilename)))
  const ppq = midi.header.ppq || 480
  const tempoBpm = Math.round(midi.header.tempos[0]?.bpm || 94)

  // Authentic PDF fingerings (C5-G5 RH 5-finger position, B3-G4 LH position)
  const rhFingerForMidi = (midiNum) => {
    // 72=C5(1), 74=D5(2), 76=E5(3), 77=F5(4), 79=G5(5)
    const map = { 72: 1, 74: 2, 76: 3, 77: 4, 79: 5 }
    return map[midiNum]
  }
  const lhFingerForMidi = (midiNum) => {
    // 59=B3(5), 60=C4(5), 62=D4(4), 64=E4(3), 65=F4(2), 67=G4(1)
    const map = { 59: 5, 60: 5, 62: 4, 64: 3, 65: 2, 67: 1 }
    return map[midiNum]
  }

  const notes = []
  let idx = 1

  // Track 0 = Right Hand, Track 1 = Left Hand (BOTH in Treble Clef per reference PDF!)
  const trackHands = [
    { track: midi.tracks[0], hand: 'right' },
    { track: midi.tracks[1], hand: 'left' },
  ]

  for (const { track, hand } of trackHands) {
    if (!track) continue
    for (const n of track.notes) {
      const totalBeats = n.ticks / ppq
      const measure = Math.floor(totalBeats / 4) + 1
      const beatInMeasure = Math.round(((totalBeats % 4) + 1) * 100) / 100
      const rawDurBeats = n.durationTicks / ppq
      const durationBeats = quantizeBeats(rawDurBeats)
      const velocity = Math.max(38, Math.min(110, Math.round(n.velocity * 127)))

      notes.push({
        id: `behr-${hand[0]}-${idx++}`,
        midi: n.midi,
        noteName: n.name,
        startTime: Math.round(n.time * 1000) / 1000,
        duration: Math.round(n.duration * 1000) / 1000,
        durationBeats,
        hand,
        voice: 1,
        finger: hand === 'right' ? rhFingerForMidi(n.midi) : lhFingerForMidi(n.midi),
        measure,
        beat: beatInMeasure,
        velocity,
      })
    }
  }

  notes.sort((a, b) => a.startTime - b.startTime || a.midi - b.midi)

  const lastNote = notes[notes.length - 1]
  const totalDuration = lastNote ? Math.round((lastNote.startTime + lastNote.duration + 0.8) * 100) / 100 : 62

  const sec1Start = notes.find((n) => n.measure >= 1)?.startTime ?? 0
  const sec2Start = notes.find((n) => n.measure >= 9)?.startTime ?? 20.43
  const sec3Start = notes.find((n) => n.measure >= 17)?.startTime ?? 40.85

  const piece = {
    id: 'franz-behr-french-childs-song',
    title: "French Child's Song",
    composer: 'Franz Behr (1837–1898)',
    opus: 'Grade 1 • Andantino',
    key: 'C Major',
    timeSignature: [4, 4],
    leftHandClef: 'treble',
    measureMarkings: {
      1: { tempo: 'Andantino', dynamic: 'p' },
      9: { dynamic: 'mf' },
      16: { hairpin: 'decresc' },
      17: { dynamic: 'p' },
    },
    tempoBpm,
    duration: totalDuration,
    notes,
    pedalEvents: [],
    annotations: [
      {
        id: 'behr-ann-1',
        measureRange: [1, 8],
        title: 'Singing Cantabile & Both Hands in Treble Clef',
        germanTerm: 'Violinschlüssel in beiden Händen',
        category: 'tone-color',
        instruction:
          'Beide Hände spielen im Violinschlüssel! Die rechte Hand singt die Halben- und Viertelnoten im zarten Piano (p), während die linke Hand im gleichmäßigen Viertelpuls (C4–G4) leicht und unaufdringlich begleitet.',
        handTechnique: 'Fünf-Finger-Lage C5–G5 rechts; ruhiges Handgelenk ohne Abhacken der Halbennoten.',
        referenceTimestampSeconds: sec1Start,
      },
      {
        id: 'behr-ann-2',
        measureRange: [9, 16],
        title: 'Warm Mezzoforte Middle Phrase & Decrescendo',
        germanTerm: 'Dynamischer Bogen (mf → p)',
        category: 'tone-color',
        instruction:
          'In Takt 9 hebt sich die Melodie zu einem warmen Mezzoforte (mf). Halte die ganze Note D5 in Takt 16 ruhig aus und führe die linke Hand mit einem weichen Decrescendo zurück ins Piano.',
        handTechnique: 'Linker 5. Finger greift ruhig hinunter zum H3 (B3), Daumen bleibt locker auf G4.',
        referenceTimestampSeconds: sec2Start,
      },
      {
        id: 'behr-ann-3',
        measureRange: [17, 24],
        title: 'Gentle Reprise & Dotted Half Ending with Quarter Rest',
        germanTerm: 'Punktierte Halbe & Viertelpause',
        category: 'rubato',
        instruction:
          'Kehre in Takt 17 ins weiche Piano zurück. In Takt 24 halte das finale C5 exakt drei Schläge (punktierte Halbe) und hebe beide Hände gemeinsam auf Schlag 4 (Viertelpause) sauber ab.',
        referenceTimestampSeconds: sec3Start,
      },
    ],
    sections: [
      {
        id: 'behr-sec-1',
        title: 'Section A — Opening Song (p)',
        startMeasure: 1,
        endMeasure: 8,
        startTime: sec1Start,
        endTime: sec2Start,
        tempoSuggestion: 'Andantino (♩ = 94)',
        character: 'Gentle, singing piano (p) in C major, both staves in treble clef',
      },
      {
        id: 'behr-sec-2',
        title: 'Section B — Expressive Contrast (mf)',
        startMeasure: 9,
        endMeasure: 16,
        startTime: sec2Start,
        endTime: sec3Start,
        tempoSuggestion: 'Andantino (♩ = 94)',
        character: 'Warmer mezzoforte (mf) dialogue leading to whole-note decrescendo in M. 16',
      },
      {
        id: 'behr-sec-3',
        title: "Section A' — Tender Reprise & Finale (p)",
        startMeasure: 17,
        endMeasure: 24,
        startTime: sec3Start,
        endTime: totalDuration,
        tempoSuggestion: 'Andantino (♩ = 94)',
        character: 'Return to delicate piano (p), closing on a dotted half note + quarter rest in M. 24',
      },
    ],
  }

  fs.writeFileSync('src/data/scores/franz-behr-french-childs-song.json', JSON.stringify(piece, null, 2))
  fs.writeFileSync('public/scores/franz-behr-french-childs-song.json', JSON.stringify(piece, null, 2))
  console.log(`Built Franz Behr: ${notes.length} notes across 24 measures (${totalDuration}s)`)
  // Summary check of quantized durations
  const counts = {}
  for (const n of notes) counts[n.durationBeats] = (counts[n.durationBeats] || 0) + 1
  console.log('Franz Behr durationBeats distribution:', counts)
}

// ============================================================================
// 2. ENRICH CHOPIN BALLADE NO. 1 IN G MINOR, OP. 23
//    Matches tick-accurate durationBeats from ballade-1-chopin.mid + Urtext PDF markings & clefs
// ============================================================================
function enrichChopinBallade() {
  const balladeJsonPath = 'public/scores/chopin-ballade-1.json'
  const ballade = JSON.parse(fs.readFileSync(balladeJsonPath, 'utf8'))
  const midiPath = path.join(downloadsDir, 'ballade-1-chopin.mid')
  const midi = new Midi(fs.readFileSync(midiPath))
  const ppq = midi.header.ppq || 384

  // Build quick lookup from MIDI notes by (hand, midiPitch, roundedTime)
  const midiPool = []
  midi.tracks.forEach((tr, ti) => {
    const hand = ti === 0 ? 'right' : 'left'
    tr.notes.forEach((n) => {
      midiPool.push({
        hand,
        midi: n.midi,
        time: n.time,
        durationBeats: quantizeBeats(n.durationTicks / ppq),
        rawBeats: n.durationTicks / ppq,
        used: false,
      })
    })
  })

  // Group midiPool by `${hand}:${midi}` for O(1) lookup
  const bucketMap = new Map()
  for (const item of midiPool) {
    const key = `${item.hand}:${item.midi}`
    if (!bucketMap.has(key)) bucketMap.set(key, [])
    bucketMap.get(key).push(item)
  }

  let matchedCount = 0
  for (const note of ballade.notes) {
    const key = `${note.hand}:${note.midi}`
    const bucket = bucketMap.get(key)
    let bestItem = null
    let bestDelta = 0.12 // 120ms tolerance
    if (bucket) {
      for (const item of bucket) {
        if (item.used) continue
        const delta = Math.abs(item.time - note.startTime)
        if (delta < bestDelta) {
          bestDelta = delta
          bestItem = item
        }
      }
    }
    if (bestItem) {
      bestItem.used = true
      note.durationBeats = bestItem.durationBeats
      if (Math.abs(bestItem.durationBeats - 0.3333) < 0.02 || Math.abs(bestItem.durationBeats - 0.1667) < 0.02) {
        note.isTriplet = true
      }
      matchedCount++
    } else {
      // Fallback: compute from local tempo
      const localBpm = note.measure <= 7 ? 65 : note.measure < 36 ? 88 : note.measure < 68 ? 110 : 120
      note.durationBeats = quantizeBeats(note.duration * (localBpm / 60))
    }
  }

  // Assign polyphonic voices within each measure & hand when long sustained melody overlaps shorter chords
  // (Classic Chopin Ballade No. 1 M. 9-26 texture: dotted-half soprano Voice 1 + quarter inner chords Voice 2!)
  const byMeasureHand = new Map()
  for (const note of ballade.notes) {
    const k = `${note.measure}:${note.hand}`
    if (!byMeasureHand.has(k)) byMeasureHand.set(k, [])
    byMeasureHand.get(k).push(note)
  }

  for (const [, mNotes] of byMeasureHand.entries()) {
    const hasLongMelody = mNotes.some((n) => (n.durationBeats || 1) >= 2.0)
    const hasShortAccomp = mNotes.some((n) => (n.durationBeats || 1) <= 1.0)
    if (hasLongMelody && hasShortAccomp) {
      for (const n of mNotes) {
        // In RH: sustained long notes (>= 2 beats) are Voice 1 (stem up), moving shorter notes are Voice 2 (stem down)
        // In LH: sustained longer notes or higher inner notes are Voice 1, lower bass pulse is Voice 2
        if (n.hand === 'right') {
          n.voice = (n.durationBeats || 1) >= 1.75 ? 1 : 2
        } else {
          n.voice = (n.durationBeats || 1) >= 1.5 ? 1 : 2
        }
      }
    } else {
      for (const n of mNotes) {
        n.voice = 1
      }
    }
  }

  // Authentic Chopin Ballade No. 1 time signature changes from Urtext PDF & MIDI
  ballade.timeSignature = [4, 4]
  ballade.timeSignatureChanges = [
    { measure: 1, timeSignature: [4, 4] },
    { measure: 8, timeSignature: [6, 4] },
    { measure: 208, timeSignature: [2, 2] },
  ]

  // Authentic clef changes for M. 1–7 from the Chopin Urtext PDF (Page 1)
  // M. 1: Both hands start in Bass Clef!
  // M. 3–5: Both hands are in Treble Clef (LH switched at M.2 beat 3, returns to Bass in M.6)!
  // M. 6+: RH Treble, LH Bass!
  ballade.measureClefs = {
    1: { right: 'bass', left: 'bass' },
    3: { right: 'treble', left: 'treble' },
    4: { right: 'treble', left: 'treble' },
    5: { right: 'treble', left: 'treble' },
  }

  // Authentic Urtext tempo & dynamic markings from Pages 1–2 of the downloaded PDF
  ballade.measureMarkings = {
    1: { tempo: 'Lento', dynamic: 'f', expression: 'pesante' },
    2: { expression: 'dim.' },
    3: { hairpin: 'decresc' },
    4: { dynamic: 'p' },
    6: { dynamic: 'p', expression: 'espress.' },
    8: { tempo: 'Moderato', dynamic: 'p', expression: 'dolce' },
    26: { dynamic: 'p' },
    27: { expression: 'tenuto' },
    31: { expression: 'ritenuto', hairpin: 'decresc' },
    32: { dynamic: 'pp' },
    33: { expression: 'poco cresc.' },
    36: { tempo: 'a tempo', dynamic: 'p' },
    38: { expression: 'cresc.' },
    40: { dynamic: 'f', expression: 'agitato' },
    44: { dynamic: 'f', expression: 'sempre più mosso' },
    48: { dynamic: 'più f' },
    54: { expression: 'poco a poco meno f' },
    67: { tempo: 'Meno mosso', expression: 'sotto voce' },
    68: { dynamic: 'pp' },
    94: { tempo: 'a tempo (meno mosso)', dynamic: 'pp', expression: 'sotto voce' },
    106: { dynamic: 'ff' },
    126: { tempo: 'più animato', dynamic: 'p', expression: 'cresc.' },
    138: { tempo: 'animato', dynamic: 'p' },
    166: { dynamic: 'ff' },
    194: { tempo: 'Meno mosso', dynamic: 'pp', expression: 'sotto voce' },
    208: { tempo: 'Presto con fuoco', dynamic: 'ffz' },
  }

  // Fix pedal events for Measures 1–26 to match Chopin's authentic Urtext harmony!
  // (No muddy pedal in M.1-6 recitative; rich pedal on M.7 chord; clean half-measure harmonic changes in 6/4 M.8-26!)
  const otherPedals = (ballade.pedalEvents || []).filter((p) => p.measure > 26)
  const urtextPedalsM1to26 = []
  const mStart = (m) => ballade.notes.find((n) => n.measure === m)?.startTime ?? 0
  const mBeatTime = (m, b) => {
    const found = ballade.notes.find((n) => n.measure === m && (n.beat || 1) >= b)
    return found ? found.startTime : mStart(m)
  }

  // M. 7 iconic Neapolitan/G-minor pedal (Ped. ... *)
  const m7Start = mStart(7)
  const m8Start = mStart(8)
  urtextPedalsM1to26.push({
    startTime: Math.round(m7Start * 1000) / 1000,
    duration: Math.max(2.2, Math.round((m8Start - m7Start - 0.12) * 1000) / 1000),
    depth: 118,
    type: 'sustain',
    measure: 7,
    tip: 'Volles, warmes Klangbad auf dem arpeggierten Akkord — sauber lösen bevor Takt 8 beginnt.',
  })

  // M. 8 beat 4 (D2 bass pickup into Moderato)
  const m8b4 = mBeatTime(8, 4)
  const m9Start = mStart(9)
  urtextPedalsM1to26.push({
    startTime: Math.round(m8b4 * 1000) / 1000,
    duration: Math.max(0.8, Math.round((m9Start - m8b4 - 0.08) * 1000) / 1000),
    depth: 72,
    type: 'half',
    measure: 8,
    tip: 'Halbpedal nach dem tiefen D2 — vor dem Auftakt in Takt 9 komplett reinigen.',
  })

  // M. 9–26: Two clean harmonic pedal changes per 6/4 bar (beats 1–3 and beats 4–6) with syncopated clear!
  for (let m = 9; m <= 26; m++) {
    const s1 = mStart(m)
    const s4 = mBeatTime(m, 4)
    const sNext = mStart(m + 1)
    if (s4 > s1 + 0.3) {
      urtextPedalsM1to26.push({
        startTime: Math.round((s1 + 0.05) * 1000) / 1000,
        duration: Math.round(Math.max(0.5, s4 - s1 - 0.12) * 1000) / 1000,
        depth: m >= 24 ? 58 : 74,
        type: 'half',
        measure: m,
      })
    }
    if (sNext > s4 + 0.3) {
      urtextPedalsM1to26.push({
        startTime: Math.round((s4 + 0.05) * 1000) / 1000,
        duration: Math.round(Math.max(0.5, sNext - s4 - 0.12) * 1000) / 1000,
        depth: m >= 24 ? 55 : 74,
        type: 'half',
        measure: m,
      })
    }
  }

  ballade.pedalEvents = [...urtextPedalsM1to26, ...otherPedals].sort((a, b) => a.startTime - b.startTime)

  // Add focused M. 1–26 study sections right at the top for the user's active practice!
  const m27Start = mStart(27)
  ballade.sections = [
    {
      id: 'sec-study-1-26',
      title: 'Exam Focus: M. 1–26 (Largo + Theme I Complete)',
      startMeasure: 1,
      endMeasure: 26,
      startTime: 0,
      endTime: Math.round(m27Start * 100) / 100,
      tempoSuggestion: 'Lento 4/4 (65) → Moderato 6/4 (88)',
      character: 'Complete opening mastery: declamatory recitative + singing 6/4 cantabile waltz-ballad',
    },
    {
      id: 'sec-1',
      title: 'Largo (Introduction)',
      startMeasure: 1,
      endMeasure: 7,
      startTime: 0,
      endTime: Math.round(m8Start * 100) / 100,
      tempoSuggestion: '4/4 Lento pesante (BPM 65)',
      character: 'Pesante, noble declamatory recitative with poised breath in M. 7',
    },
    {
      id: 'sec-2a',
      title: 'Moderato — First Statement (M. 8–26)',
      startMeasure: 8,
      endMeasure: 26,
      startTime: Math.round(m8Start * 100) / 100,
      endTime: Math.round(m27Start * 100) / 100,
      tempoSuggestion: '6/4 Moderato dolce (BPM 88)',
      character: 'Singing soprano melody over whispered 6/4 waltz accompaniment',
    },
    {
      id: 'sec-2',
      title: 'Moderato — Full Exposition (M. 8–67)',
      startMeasure: 8,
      endMeasure: 67,
      startTime: Math.round(m8Start * 100) / 100,
      endTime: 123,
      tempoSuggestion: '6/4 Moderato → Agitato',
      character: 'Expressive melancholic narrative rising into passionate agitato',
    },
    {
      id: 'sec-3',
      title: 'Meno mosso (Theme 2 in E-flat)',
      startMeasure: 68,
      endMeasure: 105,
      startTime: 123,
      endTime: 205,
      tempoSuggestion: '6/4 Meno mosso sotto voce',
      character: 'Lyrical, glowing cantabile in Eb major',
    },
    {
      id: 'sec-4',
      title: 'Scherzando & Climax',
      startMeasure: 106,
      endMeasure: 207,
      startTime: 205,
      endTime: 479,
      tempoSuggestion: '6/4 Animato / Sempre più mosso',
      character: 'Virtuosic passion and dramatic tumult',
    },
    {
      id: 'sec-5',
      title: 'Presto con fuoco (Coda)',
      startMeasure: 208,
      endMeasure: 264,
      startTime: 479,
      endTime: ballade.duration || 694.8,
      tempoSuggestion: '2/2 Presto con fuoco (BPM 210+)',
      character: 'Furious, tragic virtuoso finale',
    },
  ]

  // Add authentic M.1-26 masterclass annotations
  ballade.annotations = [
    {
      id: 'bal-ann-1',
      measureRange: [1, 7],
      title: 'Lento pesante — Arm Weight & Rhetorical Breath',
      germanTerm: 'Deklamatorisches Rezitativ',
      category: 'rubato',
      instruction:
        'Starte nicht hart oder geschlagen: Lass entspanntes Armgewicht in die C-Oktave fallen. Nicht ab Takt 2 beschleunigen! Die absteigende Linie in Takt 4–5 verklingt ins Piano, und Takt 7 braucht eine spannungsvolle, tragfähige Fermate vor dem Moderato.',
      handTechnique: 'Tiefer, weicher Tastenboden-Kontakt; oberste Oktavstimme leicht hervorheben.',
      referenceTimestampSeconds: 0,
    },
    {
      id: 'bal-ann-2',
      measureRange: [8, 16],
      title: 'Moderato dolce — Singing Soprano vs. Whispered 6/4 Pulse',
      germanTerm: 'Klangschichtung & Kantilene',
      category: 'tone-color',
      instruction:
        'Der häufigste Fehler in Takt 8–16: die inneren Begleitakkorde (Schlag 2–3 & 5–6) sind zu laut und schwer! Die Oberstimme (punktierte Halbe) muss mit +18 bis +25 Velocity über der Begleitung schweben — wie eine menschliche Stimme über gedämpftem Streicher-Pizzicato.',
      handTechnique: 'Rechte Hand kippt leicht nach außen auf Finger 4/5; Begleitakkorde aus minimaler Tastenhöhe (pp) anschlagen.',
      referenceTimestampSeconds: m8Start,
    },
    {
      id: 'bal-ann-3',
      measureRange: [17, 26],
      title: 'Rising Narrative & Chromatic Bass (M. 24–26)',
      germanTerm: 'Phrasierungsbogen & Halbpedal',
      category: 'pedal',
      instruction:
        'In Takt 21–26 öffnet sich die Ballade: Gestalte einen klaren dynamischen Bogen statt eintöniger Lautstärke. Ab Takt 24 spielt die linke Hand bewegte Achtel — reduziere hier das Dämpferpedal auf feines Halbpedal (CC64 ~50–65), sonst verschwimmen die chromatischen Durchgänge sofort!',
      referenceTimestampSeconds: mStart(17),
    },
  ]

  fs.writeFileSync(balladeJsonPath, JSON.stringify(ballade))
  console.log(`Enriched Chopin Ballade No. 1: ${matchedCount}/${ballade.notes.length} notes matched exact MIDI durationBeats!`)
  const m9 = ballade.notes.filter((n) => n.measure === 9)
  console.log('Ballade M.9 sample:', m9.map((n) => `${n.hand[0]}:${n.noteName}(${n.durationBeats}b,v${n.voice},@b${n.beat})`).join(' '))
  const m24 = ballade.notes.filter((n) => n.measure === 24)
  console.log('Ballade M.24 sample:', m24.slice(0, 12).map((n) => `${n.hand[0]}:${n.noteName}(${n.durationBeats}b,v${n.voice},@b${n.beat})`).join(' '))
}

buildFranzBehr()
enrichChopinBallade()
