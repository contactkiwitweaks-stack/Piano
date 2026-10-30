import fs from 'fs'

// Note naming helper
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
function midiToNoteNameSharp(midi) {
  const octave = Math.floor(midi / 12) - 1
  const name = SHARP_NAMES[midi % 12]
  return `${name}${octave}`
}

function assignPianisticFingering(notes, hand) {
  notes.sort((a, b) => a.startTime - b.startTime || a.midi - b.midi)

  const clusters = []
  let currentCluster = []
  notes.forEach((n) => {
    if (currentCluster.length === 0) {
      currentCluster.push(n)
    } else {
      if (Math.abs(n.startTime - currentCluster[0].startTime) < 0.035) {
        currentCluster.push(n)
      } else {
        clusters.push(currentCluster)
        currentCluster = [n]
      }
    }
  })
  if (currentCluster.length > 0) clusters.push(currentCluster)

  let prevMidi = hand === 'right' ? 64 : 48
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

// 1. Process Moonlight Sonata
const ml = JSON.parse(fs.readFileSync('public/scores/beethoven-moonlight-1.json', 'utf8'))
const mlRh = ml.notes.filter((n) => n.hand === 'right')
const mlLh = ml.notes.filter((n) => n.hand === 'left')
assignPianisticFingering(mlRh, 'right')
assignPianisticFingering(mlLh, 'left')
ml.notes = [...mlRh, ...mlLh].sort((a, b) => a.startTime - b.startTime || a.midi - b.midi)
// Fix enharmonics for C# minor
ml.notes.forEach((n) => {
  n.noteName = midiToNoteNameSharp(n.midi)
})
ml.annotations = [
  {
    id: 'ml-ann-1',
    measureRange: [1, 5],
    title: 'Adagio Sostenuto (Delicatissimamente e Senza Sordino)',
    germanTerm: 'Flüsternder Klangteppich',
    category: 'tone-color',
    instruction: 'Play the continuous triplet accompaniment as softly and evenly as possible. Beethoven instructed this movement to be played "senza sordino" (with continuous gentle damper resonance).',
    pedalGuidance: {
      action: 'full-hold',
      explanation: 'Sustain through harmonic blocks, clearing cleanly at each bass shift.',
      idealHoldMs: 4000,
    },
    referenceTimestampSeconds: 0.0,
  },
  {
    id: 'ml-ann-2',
    measureRange: [5, 15],
    title: 'The Soaring Dotted Soprano Voice',
    germanTerm: 'Gesangsstimme über Wellen',
    category: 'fingering',
    instruction: 'The right-hand pinky (finger 5) must voice the dotted melody (G# - G# - G# - E) with rich singing cantabile, distinct from the quiet inner triplet murmur.',
    wristGuidance: 'Lean hand weight slightly toward the fifth finger on each melody note.',
    referenceTimestampSeconds: 24.0,
  },
]
ml.sections = [
  { id: 'ml-sec-1', title: 'Exposition: The Hypnotic C# Minor Waves', startMeasure: 1, endMeasure: 14, startTime: 0, endTime: 72.0, tempoSuggestion: '54 BPM Adagio sostenuto', character: 'Nocturnal, hushed and haunting' },
  { id: 'ml-sec-2', title: 'Modulation to E Major & B Minor', startMeasure: 15, endMeasure: 27, startTime: 72.0, endTime: 144.0, tempoSuggestion: '54 BPM Dolce e legato', character: 'Tender glimmer of warmth before solemn descent' },
  { id: 'ml-sec-3', title: 'Development & Stormy Diminished Climax', startMeasure: 28, endMeasure: 41, startTime: 144.0, endTime: 220.0, tempoSuggestion: '54 BPM Crescendo', character: 'Ominous tension building in low register' },
  { id: 'ml-sec-4', title: 'Recapitulation: C# Minor Theme Return', startMeasure: 42, endMeasure: 59, startTime: 220.0, endTime: 310.0, tempoSuggestion: '54 BPM Espressivo', character: 'Solemn and profound' },
  { id: 'ml-sec-5', title: 'Coda: Deep Bass Octaves & Final Whispers', startMeasure: 60, endMeasure: 69, startTime: 310.0, endTime: ml.duration, tempoSuggestion: '50 BPM Pianissimo', character: 'Dissolving into midnight silence' },
]

fs.writeFileSync('public/scores/beethoven-moonlight-1.json', JSON.stringify(ml, null, 2))
console.log(`Updated Moonlight: ${ml.notes.length} notes, ${ml.pedalEvents.length} pedals, duration: ${ml.duration}s`)

// 2. Process Bach Prelude in C
const bach = JSON.parse(fs.readFileSync('public/scores/bach-prelude-c.json', 'utf8'))
const bachRh = bach.notes.filter((n) => n.hand === 'right')
const bachLh = bach.notes.filter((n) => n.hand === 'left')
assignPianisticFingering(bachRh, 'right')
assignPianisticFingering(bachLh, 'left')
bach.notes = [...bachRh, ...bachLh].sort((a, b) => a.startTime - b.startTime || a.midi - b.midi)
bach.annotations = [
  {
    id: 'bach-ann-1',
    measureRange: [1, 8],
    title: 'The Liquid 16th-Note Harmonic Skeleton',
    germanTerm: 'Klangrede & Harmonischer Bogen',
    category: 'tone-color',
    instruction: 'Keep the arpeggiated 16th-note figures completely even, like droplets of water. LH provides the sustained harmonic foundation (C - E - G - C - E).',
    referenceTimestampSeconds: 0.0,
  },
]
bach.sections = [
  { id: 'bach-sec-1', title: 'C Major Harmonic Flourish', startMeasure: 1, endMeasure: 19, startTime: 0, endTime: 76.0, tempoSuggestion: '112 BPM Moderato', character: 'Pure, crystalline harmonic motion' },
  { id: 'bach-sec-2', title: 'Dominant Pedal Point & Final Coda', startMeasure: 20, endMeasure: 35, startTime: 76.0, endTime: bach.duration, tempoSuggestion: '100 BPM Allargando', character: 'Grand organ-point resonance and serene resolution' },
]

fs.writeFileSync('public/scores/bach-prelude-c.json', JSON.stringify(bach, null, 2))
console.log(`Updated Bach: ${bach.notes.length} notes, duration: ${bach.duration}s`)
