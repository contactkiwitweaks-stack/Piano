import fs from 'fs'
import pkg from '@tonejs/midi'
const { Midi } = pkg

// Helper to calculate measure and beat accurately with time signatures
function createMeasureCalculator(midi, defaultTimeSig = [4, 4]) {
  const ppq = midi.header.ppq || 480
  const timeSigs = (midi.header.timeSignatures || []).slice().sort((a, b) => a.ticks - b.ticks)
  if (timeSigs.length === 0) {
    timeSigs.push({ ticks: 0, timeSignature: defaultTimeSig })
  }

  const segments = []
  let curMeasure = 1
  for (let i = 0; i < timeSigs.length; i++) {
    const ts = timeSigs[i]
    const nextTicks = i + 1 < timeSigs.length ? timeSigs[i + 1].ticks : Infinity
    const num = ts.timeSignature[0]
    const den = ts.timeSignature[1]
    const ticksPerBeat = ppq * (4 / den)
    const ticksPerMeasure = ticksPerBeat * num
    segments.push({
      startTicks: ts.ticks,
      endTicks: nextTicks,
      num,
      den,
      ticksPerBeat,
      ticksPerMeasure,
      startMeasure: curMeasure,
    })
    if (nextTicks !== Infinity) {
      const numMeasuresInSeg = Math.round((nextTicks - ts.ticks) / ticksPerMeasure)
      curMeasure += numMeasuresInSeg
    }
  }

  return function getMeasureAndBeat(ticks) {
    for (const seg of segments) {
      if (ticks >= seg.startTicks && ticks < seg.endTicks) {
        const delta = ticks - seg.startTicks
        const measureOffset = Math.floor(delta / seg.ticksPerMeasure)
        const beatInMeasure = (delta % seg.ticksPerMeasure) / seg.ticksPerBeat + 1
        return {
          measure: seg.startMeasure + measureOffset,
          beat: Math.round(beatInMeasure * 100) / 100,
        }
      }
    }
    const last = segments[segments.length - 1]
    const delta = ticks - last.startTicks
    return {
      measure: last.startMeasure + Math.floor(delta / last.ticksPerMeasure),
      beat: Math.round(((delta % last.ticksPerMeasure) / last.ticksPerBeat + 1) * 100) / 100,
    }
  }
}

// Ergonomic Pianistic Fingering Engine (1 to 5)
function assignPianisticFingering(notes, hand) {
  notes.sort((a, b) => a.time - b.time || a.midi - b.midi)

  // Cluster notes sounding almost simultaneously into chords
  const clusters = []
  let currentCluster = []
  notes.forEach((n) => {
    if (currentCluster.length === 0) {
      currentCluster.push(n)
    } else {
      if (Math.abs(n.time - currentCluster[0].time) < 0.035) {
        currentCluster.push(n)
      } else {
        clusters.push(currentCluster)
        currentCluster = [n]
      }
    }
  })
  if (currentCluster.length > 0) clusters.push(currentCluster)

  let prevMidi = hand === 'right' ? 67 : 48
  let prevFinger = hand === 'right' ? 2 : 2

  clusters.forEach((chord) => {
    chord.sort((a, b) => a.midi - b.midi)
    const count = chord.length

    if (count === 1) {
      const n = chord[0]
      const delta = n.midi - prevMidi
      if (hand === 'right') {
        if (delta > 0) {
          if (delta >= 7) prevFinger = 5
          else if (delta >= 4) prevFinger = Math.min(5, prevFinger + 2)
          else if (delta >= 1) prevFinger = Math.min(5, prevFinger + 1)
          else prevFinger = 1
        } else if (delta < 0) {
          const abs = Math.abs(delta)
          if (abs >= 7) prevFinger = 1
          else if (abs >= 4) prevFinger = Math.max(1, prevFinger - 2)
          else if (abs >= 1) prevFinger = Math.max(1, prevFinger - 1)
          else prevFinger = 5
        }
      } else {
        // Left hand
        if (delta > 0) {
          if (delta >= 7) prevFinger = 1
          else if (delta >= 4) prevFinger = Math.max(1, prevFinger - 2)
          else if (delta >= 1) prevFinger = Math.max(1, prevFinger - 1)
          else prevFinger = 5
        } else if (delta < 0) {
          const abs = Math.abs(delta)
          if (abs >= 7) prevFinger = 5
          else if (abs >= 4) prevFinger = Math.min(5, prevFinger + 2)
          else if (abs >= 1) prevFinger = Math.min(5, prevFinger + 1)
          else prevFinger = 1
        }
      }
      n.finger = Math.max(1, Math.min(5, prevFinger))
      prevMidi = n.midi
    } else if (count === 2) {
      const span = chord[1].midi - chord[0].midi
      if (hand === 'right') {
        chord[0].finger = 1
        chord[1].finger = span > 7 ? 5 : span > 4 ? 4 : 3
      } else {
        chord[0].finger = span > 7 ? 5 : span > 4 ? 4 : 3
        chord[1].finger = 1
      }
      prevMidi = chord[count - 1].midi
      prevFinger = chord[count - 1].finger
    } else if (count === 3) {
      if (hand === 'right') {
        chord[0].finger = 1
        chord[1].finger = chord[2].midi - chord[0].midi > 8 ? 2 : 3
        chord[2].finger = 5
      } else {
        chord[0].finger = 5
        chord[1].finger = chord[2].midi - chord[0].midi > 8 ? 2 : 3
        chord[2].finger = 1
      }
      prevMidi = chord[count - 1].midi
      prevFinger = chord[count - 1].finger
    } else if (count === 4) {
      if (hand === 'right') {
        chord[0].finger = 1
        chord[1].finger = 2
        chord[2].finger = 4
        chord[3].finger = 5
      } else {
        chord[0].finger = 5
        chord[1].finger = 4
        chord[2].finger = 2
        chord[3].finger = 1
      }
      prevMidi = chord[count - 1].midi
      prevFinger = chord[count - 1].finger
    } else {
      chord.forEach((n, idx) => {
        if (hand === 'right') {
          n.finger = idx === 0 ? 1 : idx === 1 ? 2 : idx === 2 ? 3 : idx === 3 ? 4 : 5
        } else {
          n.finger = idx === 0 ? 5 : idx === 1 ? 4 : idx === 2 ? 3 : idx === 3 ? 2 : 1
        }
      })
      prevMidi = chord[count - 1].midi
      prevFinger = chord[count - 1].finger
    }
  })
}

// ==========================================
// 1. PROCESS PASSACAGLIA
// ==========================================
console.log('--- Processing Handel-Halvorsen Passacaglia ---')
const passBuffer = fs.readFileSync('C:/Users/Kxwie/Downloads/Arrangement by Handel Halvorsen - Passacaglia.mid')
const passMidi = new Midi(passBuffer)
const passCalc = createMeasureCalculator(passMidi, [4, 4])

// Track 0 = RH, Track 1 = LH
const passRh = passMidi.tracks[0].notes.map((n) => {
  const mInfo = passCalc(n.ticks)
  return {
    midi: n.midi,
    name: n.name,
    time: n.time,
    duration: Math.max(0.08, n.duration),
    velocity: Math.min(127, Math.max(30, Math.round(n.velocity * 127))),
    ticks: n.ticks,
    hand: 'right',
    measure: mInfo.measure,
    beat: mInfo.beat,
  }
})

const passLh = passMidi.tracks[1].notes.map((n) => {
  const mInfo = passCalc(n.ticks)
  return {
    midi: n.midi,
    name: n.name,
    time: n.time,
    duration: Math.max(0.08, n.duration),
    velocity: Math.min(127, Math.max(30, Math.round(n.velocity * 127))),
    ticks: n.ticks,
    hand: 'left',
    measure: mInfo.measure,
    beat: mInfo.beat,
  }
})

assignPianisticFingering(passRh, 'right')
assignPianisticFingering(passLh, 'left')

const allPassNotes = [...passRh, ...passLh].sort((a, b) => a.time - b.time || a.midi - b.midi)
const finalPassNotes = allPassNotes.map((n, idx) => ({
  id: `passacaglia-note-${idx + 1}`,
  midi: n.midi,
  noteName: n.name,
  startTime: Math.round(n.time * 1000) / 1000,
  duration: Math.round(n.duration * 1000) / 1000,
  hand: n.hand,
  finger: n.finger,
  measure: n.measure,
  beat: n.beat,
  velocity: n.velocity,
}))

// Extract CC64 pedals from Track 1
const passPedals = []
const cc64List = passMidi.tracks[1].controlChanges[64] || []
let curDown = null
let curDepth = 127
cc64List.forEach((cc) => {
  const isDown = cc.value > 0.1
  if (isDown) {
    if (curDown === null) {
      curDown = cc.time
      curDepth = Math.round(cc.value * 127)
    }
  } else {
    if (curDown !== null) {
      const dur = Math.max(0.12, cc.time - curDown)
      const mInfo = passCalc(cc.ticks)
      passPedals.push({
        startTime: Math.round(curDown * 1000) / 1000,
        duration: Math.round(dur * 1000) / 1000,
        depth: Math.min(127, Math.max(75, curDepth)),
        type: 'syncopated',
        measure: mInfo.measure,
      })
      curDown = null
    }
  }
})
if (curDown !== null && cc64List.length > 0) {
  passPedals.push({
    startTime: Math.round(curDown * 1000) / 1000,
    duration: 2.0,
    depth: 127,
    type: 'syncopated',
    measure: passCalc(cc64List[cc64List.length - 1].ticks).measure,
  })
}

const passDuration = Math.round(passMidi.duration * 100) / 100

const passPiece = {
  id: 'handel-halvorsen-passacaglia',
  title: 'Passacaglia in G minor',
  composer: 'Johan Halvorsen (after G.F. Handel)',
  opus: 'Concert Solo Edition (HWV 432 / Suite No. 7)',
  key: 'G minor',
  timeSignature: [4, 4],
  tempoBpm: 130,
  duration: passDuration,
  notes: finalPassNotes,
  pedalEvents: passPedals,
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
    {
      id: 'pass-ann-2',
      measureRange: [9, 24],
      title: 'Staccato Sparkle & Voice Separation',
      germanTerm: 'Staccato Klarheit',
      category: 'fingering',
      instruction: 'Crisp finger staccato in the accompaniment while keeping the cantabile soprano melody line soaring effortlessly.',
      referenceTimestampSeconds: 15.0,
    },
    {
      id: 'pass-ann-3',
      measureRange: [41, 64],
      title: 'Weight Transfer in Double Octaves',
      germanTerm: 'Gewichtsverlagerung & Kraftentfaltung',
      category: 'transition',
      instruction: 'Transfer forearm weight directly into the keybeds. Keep wrists supple to avoid arm tension in rapid octave leaps.',
      referenceTimestampSeconds: 75.0,
    },
  ],
  sections: [
    { id: 'pass-sec-1', title: 'Ground Bass Theme (Maestoso)', startMeasure: 1, endMeasure: 8, startTime: 0, endTime: 14.77, tempoSuggestion: '130 BPM Maestoso', character: 'Dark, noble ground bass and grand baroque harmony' },
    { id: 'pass-sec-2', title: 'Variation 1 & 2: Flowing Arpeggios', startMeasure: 9, endMeasure: 24, startTime: 14.77, endTime: 44.31, tempoSuggestion: '130 BPM Con moto', character: 'Liquid broken chords and vocal line' },
    { id: 'pass-sec-3', title: 'Variation 3 & 4: Staccato Brilliance', startMeasure: 25, endMeasure: 40, startTime: 44.31, endTime: 73.85, tempoSuggestion: '130 BPM Scherzando', character: 'Crisp staccato and dazzling runs' },
    { id: 'pass-sec-4', title: 'Variation 5 & 6: Dramatic Driving Octaves', startMeasure: 41, endMeasure: 56, startTime: 73.85, endTime: 103.38, tempoSuggestion: '130 BPM Crescendo ed agitato', character: 'Powerful rhythmic drive and dynamic intensity' },
    { id: 'pass-sec-5', title: 'Fortissimo Double-Octave Climax & Coda', startMeasure: 57, endMeasure: 73, startTime: 103.38, endTime: passDuration, tempoSuggestion: '130 BPM Grandioso fff', character: 'Thunderous octave climax and majestic ringing resolution' },
  ],
}

fs.writeFileSync('public/scores/handel-halvorsen-passacaglia.json', JSON.stringify(passPiece, null, 2))
fs.copyFileSync('C:/Users/Kxwie/Downloads/Arrangement by Handel Halvorsen - Passacaglia.mid', 'public/scores/handel-halvorsen-passacaglia.mid')
console.log(`Saved Passacaglia: ${passPiece.notes.length} notes, ${passPiece.pedalEvents.length} pedals, duration: ${passPiece.duration}s`)

// ==========================================
// 2. PROCESS FÜR ELISE
// ==========================================
console.log('--- Processing Beethoven Für Elise ---')
const feBuffer = fs.readFileSync('C:/Users/Kxwie/Downloads/Ludwig van Beethoven - FÜR ELISE.mid')
const feMidi = new Midi(feBuffer)
const feCalc = createMeasureCalculator(feMidi, [3, 8])

// Track 0 = RH, Track 1 = LH
const feRh = feMidi.tracks[0].notes.map((n) => {
  const mInfo = feCalc(n.ticks)
  return {
    midi: n.midi,
    name: n.name,
    time: n.time,
    duration: Math.max(0.08, n.duration),
    velocity: Math.min(127, Math.max(30, Math.round(n.velocity * 127))),
    ticks: n.ticks,
    hand: 'right',
    measure: mInfo.measure,
    beat: mInfo.beat,
  }
})

const feLh = feMidi.tracks[1].notes.map((n) => {
  const mInfo = feCalc(n.ticks)
  return {
    midi: n.midi,
    name: n.name,
    time: n.time,
    duration: Math.max(0.08, n.duration),
    velocity: Math.min(127, Math.max(30, Math.round(n.velocity * 127))),
    ticks: n.ticks,
    hand: 'left',
    measure: mInfo.measure,
    beat: mInfo.beat,
  }
})

assignPianisticFingering(feRh, 'right')
assignPianisticFingering(feLh, 'left')

const allFeNotes = [...feRh, ...feLh].sort((a, b) => a.time - b.time || a.midi - b.midi)
const finalFeNotes = allFeNotes.map((n, idx) => ({
  id: `fur-elise-note-${idx + 1}`,
  midi: n.midi,
  noteName: n.name,
  startTime: Math.round(n.time * 1000) / 1000,
  duration: Math.round(n.duration * 1000) / 1000,
  hand: n.hand,
  finger: n.finger,
  measure: n.measure,
  beat: n.beat,
  velocity: n.velocity,
}))

// Create Urtext damper pedal events based on LH harmony measures
// Für Elise holds pedal during the LH arpeggios (A minor, E7, C, G, F)
const fePedals = []
let currentMeasureNotes = new Map()
feLh.forEach((n) => {
  if (!currentMeasureNotes.has(n.measure)) {
    currentMeasureNotes.set(n.measure, [])
  }
  currentMeasureNotes.get(n.measure).push(n)
})

currentMeasureNotes.forEach((notesInMeasure, m) => {
  if (notesInMeasure.length > 0) {
    const start = notesInMeasure[0].time
    const end = notesInMeasure[notesInMeasure.length - 1].time + notesInMeasure[notesInMeasure.length - 1].duration
    fePedals.push({
      startTime: Math.round(start * 1000) / 1000,
      duration: Math.round(Math.max(0.2, end - start) * 1000) / 1000,
      depth: 95,
      type: 'sustain',
      measure: m,
    })
  }
})

const feDuration = Math.round(feMidi.duration * 100) / 100

const fePiece = {
  id: 'beethoven-fur-elise',
  title: 'Für Elise',
  composer: 'Ludwig van Beethoven',
  opus: 'Bagatelle in A minor, WoO 59 (Complete)',
  key: 'A minor',
  timeSignature: [3, 8],
  tempoBpm: 68,
  duration: feDuration,
  notes: finalFeNotes,
  pedalEvents: fePedals,
  annotations: [
    {
      id: 'fe-ann-1',
      measureRange: [1, 8],
      title: 'The Semitone Motif (E - D# - E)',
      germanTerm: 'Halbton-Schwingung',
      category: 'fingering',
      instruction: 'Play the opening E-D#-E oscillation with fingers 5-4-5 using supple micro-wrist rotation. Do not lift fingers tensely off the ivory.',
      wristGuidance: 'Light, floating wrist without tension.',
      referenceTimestampSeconds: 0.0,
    },
    {
      id: 'fe-ann-2',
      measureRange: [23, 45],
      title: 'F Major Episode (Dolce e Cantabile)',
      germanTerm: 'Liedhafter Mittelteil',
      category: 'tone-color',
      instruction: 'Warm, sunny F major character. Roll the 32nd-note decorative turn gently and bring out the upper singing voice.',
      referenceTimestampSeconds: 38.0,
    },
    {
      id: 'fe-ann-3',
      measureRange: [60, 82],
      title: 'A Minor Pedal Point Storm & Chromatic Run',
      germanTerm: 'Orgelpunkt & Chromatische Kaskade',
      category: 'rubato',
      instruction: 'Keep the continuous LH 16th-note repeated A2 pedal point ominous and controlled, while RH articulates intense chords leading into the ascending Bb arpeggio and descending chromatic cascade.',
      referenceTimestampSeconds: 98.0,
    },
  ],
  sections: [
    { id: 'fe-sec-1', title: 'Main Theme A (Poco Moto)', startMeasure: 1, endMeasure: 22, startTime: 0, endTime: 37.5, tempoSuggestion: '68 BPM Poco moto', character: 'Delicate, wistful and flowing' },
    { id: 'fe-sec-2', title: 'Episode B: F Major Sunshine', startMeasure: 23, endMeasure: 45, startTime: 37.5, endTime: 76.0, tempoSuggestion: '68 BPM Dolce espressivo', character: 'Lyrical, singing melody and cheerful ornaments' },
    { id: 'fe-sec-3', title: 'Theme A Return', startMeasure: 46, endMeasure: 59, startTime: 76.0, endTime: 99.5, tempoSuggestion: '68 BPM Tempo I', character: 'Melancholic familiarity' },
    { id: 'fe-sec-4', title: 'Episode C: Thunderous Repeated Bass & Chromatic Cascade', startMeasure: 60, endMeasure: 82, startTime: 99.5, endTime: 138.0, tempoSuggestion: '68 BPM Drammatico', character: 'Dark rumbling pedal point and dazzling chromatic sweep' },
    { id: 'fe-sec-5', title: 'Final Recapitulation A & Serene Coda', startMeasure: 83, endMeasure: 105, startTime: 138.0, endTime: feDuration, tempoSuggestion: '68 BPM Calando', character: 'Gentle fading resolution into quiet final A minor chord' },
  ],
}

fs.writeFileSync('public/scores/beethoven-fur-elise.json', JSON.stringify(fePiece, null, 2))
fs.copyFileSync('C:/Users/Kxwie/Downloads/Ludwig van Beethoven - FÜR ELISE.mid', 'public/scores/beethoven-fur-elise.mid')
fs.copyFileSync('C:/Users/Kxwie/Downloads/Ludwig van Beethoven - FÜR ELISE.mid', 'public/scores/fur-elise.mid')
console.log(`Saved Für Elise: ${fePiece.notes.length} notes, ${fePiece.pedalEvents.length} pedals, duration: ${fePiece.duration}s`)
