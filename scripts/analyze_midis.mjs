import fs from 'fs'
import pkg from '@tonejs/midi'
const { Midi } = pkg

function analyze(filePath, name) {
  const buf = fs.readFileSync(filePath)
  const midi = new Midi(buf)
  console.log(`=== ${name} ===`)
  console.log(`Name: ${midi.name}`)
  console.log(`PPQ: ${midi.header.ppq}`)
  console.log(`Duration (s): ${midi.duration.toFixed(2)}`)
  console.log('Tempos:', midi.header.tempos)
  console.log('TimeSignatures:', midi.header.timeSignatures)
  console.log('KeySignatures:', midi.header.keySignatures)
  console.log(`Tracks count: ${midi.tracks.length}`)
  midi.tracks.forEach((t, i) => {
    let minM = 127, maxM = 0, sumM = 0
    t.notes.forEach((n) => {
      if (n.midi < minM) minM = n.midi
      if (n.midi > maxM) maxM = n.midi
      sumM += n.midi
    })
    const cc64 = t.controlChanges[64] ? t.controlChanges[64].length : 0
    console.log(`  Track ${i}: name="${t.name}" notes=${t.notes.length} CC64=${cc64} range=${minM}..${maxM} avgPitch=${(sumM / (t.notes.length || 1)).toFixed(1)}`)
    if (t.notes.length > 0) {
      console.log('    First 3 notes:', t.notes.slice(0, 3).map((n) => `${n.name}(${n.midi}) t=${n.time.toFixed(2)} d=${n.duration.toFixed(2)}`).join(', '))
      console.log('    Last note:', `${t.notes[t.notes.length - 1].name}(${t.notes[t.notes.length - 1].midi}) t=${t.notes[t.notes.length - 1].time.toFixed(2)}`)
    }
  })
}

analyze('C:/Users/Kxwie/Downloads/Arrangement by Handel Halvorsen - Passacaglia.mid', 'Handel-Halvorsen Passacaglia')
analyze('C:/Users/Kxwie/Downloads/Ludwig van Beethoven - FÜR ELISE.mid', 'Für Elise')
