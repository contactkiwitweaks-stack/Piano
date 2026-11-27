import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { Midi } = require('@tonejs/midi')

// Source MIDI: prefer the user's downloaded "Test Drive.mid", fallback to bundled public/songs copy
const dlPath = path.join(process.env.USERPROFILE || '', 'Downloads', 'Test Drive.mid')
const bundledMidiPath = path.resolve('public/songs/httyd-test-drive.mid')
const sourcePath = fs.existsSync(dlPath) ? dlPath : bundledMidiPath

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Test Drive.mid not found at ${dlPath} or ${bundledMidiPath}`)
}

// Keep a bundled copy in public/songs/ so rebuilds remain reproducible
if (sourcePath === dlPath) {
  fs.mkdirSync(path.dirname(bundledMidiPath), { recursive: true })
  fs.copyFileSync(dlPath, bundledMidiPath)
}

const midi = new Midi(fs.readFileSync(sourcePath))
const ppq = midi.header.ppq || 480

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
    2.5,
    3.0, // dotted half
    4.0, // whole
  ]
  const compensated = rawBeats * 1.06
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

// Handle the 1-beat anacrusis pickup at ticks 0..ppq-1 (1/4), then 4/4 (4*ppq ticks/bar) from tick ppq onward
const firstBarTicks =
  midi.header.timeSignatures[0]?.timeSignature?.[0] === 1 &&
  midi.header.timeSignatures[1]?.ticks === ppq
    ? ppq
    : 0

function ticksToMeasureAndBeat(ticks) {
  if (firstBarTicks > 0) {
    if (ticks < firstBarTicks) {
      return {
        measure: 1,
        beat: Math.round((ticks / ppq + 1) * 1000) / 1000,
      }
    }
    const relTicks = ticks - firstBarTicks
    const totalBeats = relTicks / ppq
    const measure = Math.floor(totalBeats / 4) + 2
    const beat = Math.round(((totalBeats % 4) + 1) * 1000) / 1000
    return { measure, beat }
  }
  const totalBeats = ticks / ppq
  return {
    measure: Math.floor(totalBeats / 4) + 1,
    beat: Math.round(((totalBeats % 4) + 1) * 1000) / 1000,
  }
}

// Merge all tracks cleanly: Tracks 0 & 2 = Right Hand (treble), Tracks 1 & 3 = Left Hand (bass)
// Deduplicate identical (hand, midi, rounded tick) collisions across Piano 1 & Piano 2
const dedupMap = new Map()

midi.tracks.forEach((track, trackIdx) => {
  const hand = trackIdx % 2 === 0 ? 'right' : 'left'
  track.notes.forEach((n) => {
    const bucketTick = Math.round(n.ticks / 10) * 10
    const key = `${hand}:${n.midi}:${bucketTick}`
    const existing = dedupMap.get(key)
    if (!existing || n.durationTicks > existing.durationTicks) {
      dedupMap.set(key, {
        midi: n.midi,
        noteName: n.name,
        time: n.time,
        duration: n.duration,
        ticks: n.ticks,
        durationTicks: n.durationTicks,
        velocity: Math.max(32, Math.min(120, Math.round(n.velocity * 127))),
        hand,
      })
    }
  })
})

const rawNotes = Array.from(dedupMap.values()).sort(
  (a, b) => a.time - b.time || a.midi - b.midi
)

let seq = 1
const notes = rawNotes.map((n) => {
  const { measure, beat } = ticksToMeasureAndBeat(n.ticks)
  const durationBeats = quantizeBeats(n.durationTicks / ppq)
  return {
    id: `httyd-${seq++}`,
    midi: n.midi,
    noteName: n.noteName,
    startTime: Math.round(n.time * 1000) / 1000,
    duration: Math.max(0.05, Math.round(n.duration * 1000) / 1000),
    durationBeats,
    hand: n.hand,
    voice: 1,
    measure,
    beat,
    velocity: n.velocity,
    ...(Math.abs(durationBeats - 0.3333) < 0.02 || Math.abs(durationBeats - 0.1667) < 0.02
      ? { isTriplet: true }
      : {}),
  }
})

// Detect polyphonic voice splits within each measure & hand when sustained melody overlaps shorter notes
const byMeasureHand = new Map()
for (const n of notes) {
  const k = `${n.measure}:${n.hand}`
  if (!byMeasureHand.has(k)) byMeasureHand.set(k, [])
  byMeasureHand.get(k).push(n)
}
for (const [, mNotes] of byMeasureHand.entries()) {
  const hasLong = mNotes.some((n) => n.durationBeats >= 2.0)
  const hasShort = mNotes.some((n) => n.durationBeats <= 0.5)
  if (hasLong && hasShort) {
    for (const n of mNotes) {
      n.voice = n.durationBeats >= 1.75 ? 1 : 2
    }
  }
}

const maxMeasure = Math.max(1, ...notes.map((n) => n.measure))
const lastNote = notes[notes.length - 1]
const totalDuration = lastNote
  ? Math.round((lastNote.startTime + lastNote.duration + 1.0) * 100) / 100
  : Math.round(midi.duration * 100) / 100

const baseBpm = Math.round(midi.header.tempos[0]?.bpm || 110)

// Find modulation measure (tick 96480 = E Major, 115 BPM)
const modTick = midi.header.keySignatures.find((k) => k.ticks > 0)?.ticks || 96480
const modMeasure = ticksToMeasureAndBeat(modTick).measure

const mStart = (m) => notes.find((n) => n.measure >= m)?.startTime ?? 0

// Generate clean harmonic damper pedals (1 pedal per bar after pickup)
const pedalEvents = []
for (let m = 2; m <= maxMeasure; m++) {
  const s = mStart(m)
  const nextS = m < maxMeasure ? mStart(m + 1) : totalDuration
  const dur = Math.max(0.4, Math.round((nextS - s - 0.08) * 1000) / 1000)
  if (dur > 0.4) {
    pedalEvents.push({
      startTime: Math.round((s + 0.04) * 1000) / 1000,
      duration: dur,
      depth: m >= modMeasure ? 105 : 78,
      type: m >= modMeasure ? 'sustain' : 'half',
      measure: m,
    })
  }
}

// Divide into 4 musical sections aligned with the real MIDI structure & E-major key change
const s2M = Math.min(maxMeasure, Math.round(modMeasure * 0.35))
const s3M = Math.min(maxMeasure, Math.round(modMeasure * 0.68))
const s4M = Math.min(maxMeasure, modMeasure)

const piece = {
  id: 'httyd-test-drive',
  title: 'Test Drive (How to Train Your Dragon)',
  composer: 'John Powell',
  opus: 'HTTYD OST (2010)',
  key: 'D Major',
  timeSignature: firstBarTicks > 0 ? [1, 4] : [4, 4],
  ...(firstBarTicks > 0
    ? {
        timeSignatureChanges: [
          { measure: 1, timeSignature: [1, 4] },
          { measure: 2, timeSignature: [4, 4] },
        ],
      }
    : {}),
  measureMarkings: {
    1: { tempo: 'Allegro eroico', dynamic: 'mf' },
    [s2M]: { dynamic: 'f', expression: 'marcato' },
    [s3M]: { dynamic: 'mp', expression: 'espress.' },
    [s4M]: { tempo: 'Più mosso (E Major)', dynamic: 'ff', expression: 'maestoso' },
  },
  tempoBpm: baseBpm,
  duration: totalDuration,
  notes,
  pedalEvents,
  annotations: [
    {
      id: 'httyd-ann-1',
      measureRange: [1, s2M - 1],
      title: 'The Launch — Pickup Flourish & Opening Ostinato',
      germanTerm: 'Auftakt & D-Dur Fundament',
      category: 'rubato',
      instruction:
        'Spiele den schnellen Auftakt und die aufsteigenden 32stel-Läufe leicht aus den Fingern ohne Verkrampfung, und lasse die tiefen D-Oktaven breit ausschwingen.',
      referenceTimestampSeconds: mStart(1),
    },
    {
      id: 'httyd-ann-2',
      measureRange: [s4M, maxMeasure],
      title: 'E Major Modulation & Full Flight Climax',
      germanTerm: 'Tonartwechsel nach E-Dur (115 BPM)',
      category: 'tone-color',
      instruction:
        `Ab Takt ${s4M} wechselt das Stück nach E-Dur (4 Kreuze) und zieht leicht auf 115 BPM an. Stimme die oberste Oktavstimme strahlend hervor und wechsle das Pedal sauber auf jedem Taktstrich.`,
      referenceTimestampSeconds: mStart(s4M),
    },
  ],
  sections: [
    {
      id: 'httyd-sec-1',
      title: 'The Launch & Opening Theme (D Major)',
      startMeasure: 1,
      endMeasure: Math.max(1, s2M - 1),
      startTime: mStart(1),
      endTime: mStart(s2M),
      tempoSuggestion: `♩ = ${baseBpm} (D Major)`,
      character: 'Dramatic pickup flourish, sweeping scale runs, and heroic opening chords',
    },
    {
      id: 'httyd-sec-2',
      title: 'Above the Clouds — Driving Flight',
      startMeasure: s2M,
      endMeasure: Math.max(s2M, s3M - 1),
      startTime: mStart(s2M),
      endTime: mStart(s3M),
      tempoSuggestion: `♩ = ${baseBpm} (Marcato)`,
      character: 'Energetic rhythmic drive and full soaring harmonies',
    },
    {
      id: 'httyd-sec-3',
      title: 'Mid-Flight Build & Transition',
      startMeasure: s3M,
      endMeasure: Math.max(s3M, s4M - 1),
      startTime: mStart(s3M),
      endTime: mStart(s4M),
      tempoSuggestion: `♩ = ${baseBpm} (Espressivo → Cresc.)`,
      character: 'Expressive lyrical suspension gathering momentum toward the modulation',
    },
    {
      id: 'httyd-sec-4',
      title: 'Soaring Climax & Finale (E Major)',
      startMeasure: s4M,
      endMeasure: maxMeasure,
      startTime: mStart(s4M),
      endTime: totalDuration,
      tempoSuggestion: '♩ = 115 (E Major, Maestoso)',
      character: 'Triumphant modulation to E Major and orchestral concert grand finale',
    },
  ],
}

fs.writeFileSync('src/data/scores/httyd-test-drive.json', JSON.stringify(piece))
fs.writeFileSync('public/scores/httyd-test-drive.json', JSON.stringify(piece))

const durDist = {}
for (const n of notes) durDist[n.durationBeats] = (durDist[n.durationBeats] || 0) + 1
console.log(
  `Built Test Drive from real MIDI (${sourcePath}): ${notes.length} notes, ${maxMeasure} measures, ${totalDuration}s, mod at M.${s4M}`
)
console.log('durationBeats distribution:', durDist)
