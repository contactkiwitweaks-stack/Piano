import fs from 'fs';
import pkg from '@tonejs/midi';
const { Midi } = pkg;

const score = JSON.parse(fs.readFileSync('src/data/scores/chopin-liszt-sorrow.json', 'utf8'));

const midi = new Midi();
midi.name = 'Sorrow (Concert Rhapsody in G Minor)';
midi.header.setTempo(58);
midi.header.timeSignatures = [
  { ticks: 0, timeSignature: [4, 4], measures: 0 },
  { ticks: 960 * 24, timeSignature: [12, 8], measures: 24 },
  { ticks: 960 * 64, timeSignature: [4, 4], measures: 64 },
  { ticks: 960 * 108, timeSignature: [2, 2], measures: 108 }
];

const rhTrack = midi.addTrack();
rhTrack.name = 'Right Hand (Cantabile & Virtuosity)';

const lhTrack = midi.addTrack();
lhTrack.name = 'Left Hand (Lament Bass & Ostinato)';

score.notes.forEach((n) => {
  const targetTrack = n.hand === 'left' ? lhTrack : rhTrack;
  targetTrack.addNote({
    midi: n.midi,
    time: n.startTime,
    duration: n.duration,
    velocity: n.velocity / 127,
  });
});

// Add CC64 damper pedal events to Left Hand track
score.pedalEvents?.forEach((p) => {
  lhTrack.addCC({
    number: 64,
    value: (p.depth || 127) / 127,
    time: p.time,
  });
  lhTrack.addCC({
    number: 64,
    value: 0,
    time: p.time + p.duration,
  });
});

const midiBuffer = Buffer.from(midi.toArray());

if (!fs.existsSync('public/songs')) fs.mkdirSync('public/songs', { recursive: true });
fs.writeFileSync('public/songs/chopin-liszt-sorrow.mid', midiBuffer);

// Also copy to Downloads so user can listen to it right away
fs.writeFileSync('C:/Users/Kxwie/Downloads/Sorrow - Chopin & Liszt (Virtuoso Piano Solo).mid', midiBuffer);

console.log('Exported Sorrow MIDI successfully! Size:', midiBuffer.length, 'bytes');
