import fs from 'fs'
import pkg from '@tonejs/midi'
const { Midi } = pkg

const filePath = 'C:/Users/Kxwie/Downloads/ballade-1-chopin.mid'
if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath)
  process.exit(1)
}

const buf = fs.readFileSync(filePath)
console.log('File size:', buf.length, 'bytes')

const midi = new Midi(buf)
console.log('=== User MIDI: ballade-1-chopin.mid ===')
console.log('Name:', midi.name)
console.log('PPQ:', midi.header.ppq)
console.log('Duration (s):', midi.duration.toFixed(2))
console.log('Tempos count:', midi.header.tempos.length)
console.log('First 5 tempos:', midi.header.tempos.slice(0, 5))
console.log('TimeSignatures:', midi.header.timeSignatures)
console.log('KeySignatures:', midi.header.keySignatures)
console.log('Tracks count:', midi.tracks.length)

let totalNotes = 0
let totalCC64 = 0

midi.tracks.forEach((t, i) => {
  let minM = 127, maxM = 0, sumM = 0
  t.notes.forEach((n) => {
    if (n.midi < minM) minM = n.midi
    if (n.midi > maxM) maxM = n.midi
    sumM += n.midi
  })
  const cc64 = t.controlChanges[64] ? t.controlChanges[64].length : 0
  totalNotes += t.notes.length
  totalCC64 += cc64
  console.log(`  Track ${i}: name="${t.name}" notes=${t.notes.length} CC64=${cc64} range=${minM}..${maxM} avgPitch=${(sumM / (t.notes.length || 1)).toFixed(1)}`)
  if (t.notes.length > 0) {
    console.log('    First 5 notes:', t.notes.slice(0, 5).map((n) => `${n.name}(${n.midi}) t=${n.time.toFixed(2)} d=${n.duration.toFixed(2)}`).join(', '))
    console.log('    Last 2 notes:', t.notes.slice(-2).map((n) => `${n.name}(${n.midi}) t=${n.time.toFixed(2)}`).join(', '))
  }
})

console.log('Total Notes:', totalNotes, '| Total CC64:', totalCC64)

// Let's also compare with existing chopin-ballade-1.mid
console.log('\n=== Existing public/scores/chopin-ballade-1.mid ===')
const exBuf = fs.readFileSync('public/scores/chopin-ballade-1.mid')
const exMidi = new Midi(exBuf)
console.log('Existing Duration (s):', exMidi.duration.toFixed(2))
console.log('Existing Tracks count:', exMidi.tracks.length)
exMidi.tracks.forEach((t, i) => {
  console.log(`  Track ${i}: name="${t.name}" notes=${t.notes.length}`)
  if (t.notes.length > 0) {
    console.log('    First 5 notes:', t.notes.slice(0, 5).map((n) => `${n.name}(${n.midi}) t=${n.time.toFixed(2)} d=${n.duration.toFixed(2)}`).join(', '))
  }
})
