import fs from 'fs'
import path from 'path'
import pkg from '@tonejs/midi'
const { Midi } = pkg

const PITCH_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

function midiToAccurateNoteName(midi) {
  const pitch = PITCH_NAMES[midi % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${pitch}${octave}`
}

function parseMidiToPiece(buffer, id, title, composer, key, difficulty, period) {
  const midi = new Midi(buffer)
  const notes = []
  const pedalEvents = []
  const ppq = midi.header.ppq || 384
  const bpm = midi.header.tempos.length > 0 ? Math.round(midi.header.tempos[0].bpm) : 100
  const timeSigs = midi.header.timeSignatures && midi.header.timeSignatures.length > 0
    ? midi.header.timeSignatures
    : [{ ticks: 0, timeSignature: [4, 4], measures: 0 }]

  function getMeasureAndBeat(ticks) {
    let curSig = timeSigs[0]
    let curSigIdx = 0
    for (let i = 0; i < timeSigs.length; i++) {
      if (ticks >= timeSigs[i].ticks) {
        curSig = timeSigs[i]
        curSigIdx = i
      } else {
        break
      }
    }
    let baseMeasure = 1
    for (let i = 0; i < curSigIdx; i++) {
      const segTicks = timeSigs[i + 1].ticks - timeSigs[i].ticks
      const ticksPerMeasure = (timeSigs[i].timeSignature[0] * ppq * 4) / timeSigs[i].timeSignature[1]
      baseMeasure += Math.round(segTicks / ticksPerMeasure)
    }
    const numBeats = curSig.timeSignature[0]
    const beatUnit = curSig.timeSignature[1]
    const ticksPerBeat = (ppq * 4) / beatUnit
    const ticksPerMeasure = numBeats * ticksPerBeat
    const offsetTicks = Math.max(0, ticks - curSig.ticks)
    const measureInSig = Math.floor(offsetTicks / ticksPerMeasure)
    const ticksInMeasure = offsetTicks % ticksPerMeasure
    const beat = parseFloat((ticksInMeasure / ticksPerBeat + 1).toFixed(2))
    return { measure: baseMeasure + measureInSig, beat }
  }

  let noteId = 1
  midi.tracks.forEach((track, trackIdx) => {
    const defaultHand = trackIdx === 0 ? 'right' : 'left'
    track.notes.forEach((n) => {
      const hand = midi.tracks.length === 1 ? (n.midi < 60 ? 'left' : 'right') : defaultHand
      const mb = getMeasureAndBeat(n.ticks)
      notes.push({
        id: `${id}-${noteId++}`,
        midi: n.midi,
        noteName: midiToAccurateNoteName(n.midi),
        startTime: parseFloat(n.time.toFixed(3)),
        duration: Math.max(0.08, parseFloat(n.duration.toFixed(3))),
        hand,
        measure: mb.measure,
        velocity: Math.round(n.velocity * 127) || 80,
      })
    })

    if (track.controlChanges && track.controlChanges[64]) {
      const cc64s = track.controlChanges[64]
      let activePedal = null
      cc64s.forEach((cc) => {
        if (cc.value >= 64 && !activePedal) {
          activePedal = { startTime: cc.time, measure: getMeasureAndBeat(cc.ticks).measure, depth: cc.value }
        } else if (cc.value < 64 && activePedal) {
          const duration = Math.max(0.1, cc.time - activePedal.startTime)
          pedalEvents.push({
            startTime: parseFloat(activePedal.startTime.toFixed(3)),
            duration: parseFloat(duration.toFixed(3)),
            depth: activePedal.depth,
            type: activePedal.depth > 100 ? 'sustain' : 'half',
            measure: activePedal.measure,
          })
          activePedal = null
        }
      })
    }
  })

  notes.sort((a, b) => a.startTime - b.startTime)
  const maxMeasure = notes.length > 0 ? Math.max(...notes.map((n) => n.measure)) : 32
  const duration = notes.length > 0 ? notes[notes.length - 1].startTime + notes[notes.length - 1].duration : 120

  const piece = {
    id,
    title,
    composer,
    key,
    timeSignature: timeSigs[0].timeSignature,
    tempoBpm: bpm,
    duration: parseFloat(duration.toFixed(2)),
    notes,
    pedalEvents,
    annotations: [],
    sections: [
      {
        id: `${id}-sec-1`,
        title: 'Complete Master Concert Arrangement',
        startMeasure: 1,
        endMeasure: maxMeasure,
        startTime: 0,
        endTime: parseFloat(duration.toFixed(2)),
        tempoSuggestion: `${bpm} BPM`,
        character: period,
      },
    ],
  }

  return piece
}

// 1. Process Carol of the Bells
const carolBuf = fs.readFileSync('C:\\Users\\Kxwie\\Downloads\\Carol of the Bells.mid')
const carolPiece = parseMidiToPiece(
  carolBuf,
  'carol-of-the-bells',
  'Carol of the Bells',
  'Mykola Leontovych',
  'G minor',
  5,
  'Traditional / Holiday'
)
fs.writeFileSync('public/scores/carol-of-the-bells.json', JSON.stringify(carolPiece, null, 2))
fs.writeFileSync('public/scores/carol-of-the-bells.mid', carolBuf)
fs.writeFileSync('public/songs/carol-of-the-bells.mid', carolBuf)
console.log('Saved carol-of-the-bells.json with', carolPiece.notes.length, 'notes!')

// 2. Process Sia - Snowman
const snowmanBuf = fs.readFileSync('C:\\Users\\Kxwie\\Downloads\\Sia_Arr._ John Rod Dondoyano (YouTube), Shawn_Transcription & Edits_ Shawn - Snowman.mid')
const snowmanPiece = parseMidiToPiece(
  snowmanBuf,
  'sia-snowman',
  'Snowman',
  'Sia (Arr. John Rod Dondoyano)',
  'Db Major / C# Major',
  4,
  'Contemporary / Pop'
)
fs.writeFileSync('public/scores/sia-snowman.json', JSON.stringify(snowmanPiece, null, 2))
fs.writeFileSync('public/scores/sia-snowman.mid', snowmanBuf)
fs.writeFileSync('public/songs/sia-snowman.mid', snowmanBuf)
console.log('Saved sia-snowman.json with', snowmanPiece.notes.length, 'notes!')

// 3. Update public/songs/catalog.json
const catalogPath = 'public/songs/catalog.json'
let catalog = []
if (fs.existsSync(catalogPath)) {
  catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
}

const carolEntry = {
  id: 'cloud-carol-of-the-bells',
  title: 'Carol of the Bells',
  composer: 'Mykola Leontovych',
  difficulty: 5,
  key: 'G minor',
  period: 'Holiday / Traditional',
  durationSeconds: Math.round(carolPiece.duration),
  coverColor: 'from-emerald-600 via-teal-900 to-zinc-950',
  description: 'Iconic four-note Ukrainian bell motif, rolling arpeggio counterpoint, and festive holiday energy.',
  midiUrl: 'https://raw.githubusercontent.com/contactkiwitweaks-stack/Piano/main/public/songs/carol-of-the-bells.mid'
}

const snowmanEntry = {
  id: 'cloud-sia-snowman',
  title: 'Snowman',
  composer: 'Sia (Arr. John Rod Dondoyano)',
  difficulty: 4,
  key: 'Db Major',
  period: 'Pop / Contemporary',
  durationSeconds: Math.round(snowmanPiece.duration),
  coverColor: 'from-cyan-500 via-blue-800 to-zinc-950',
  description: 'Sia’s romantic winter ballad: warm syncopated chords, gentle vocal melody, and sweet lyrical flow.',
  midiUrl: 'https://raw.githubusercontent.com/contactkiwitweaks-stack/Piano/main/public/songs/sia-snowman.mid'
}

catalog = catalog.filter(c => c.id !== carolEntry.id && c.id !== snowmanEntry.id)
catalog.unshift(snowmanEntry)
catalog.unshift(carolEntry)
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2))
console.log('Updated catalog.json with Carol of the Bells and Snowman!')
