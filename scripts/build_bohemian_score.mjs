import pkg from '@tonejs/midi';
const { Midi } = pkg;
import fs from 'fs';

const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

function midiToName(midi) {
  const name = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

async function build() {
  const buf = fs.readFileSync('scripts/bohemian_temp.mid');
  const m = new Midi(buf);

  const measureDuration = 4 * (60 / 72); // 3.33333 seconds per measure at 72 BPM

  const rawNotes = [];

  // Track 2 = Left Hand Bass
  m.tracks[2].notes.forEach((n, idx) => {
    const measure = Math.floor(n.time / measureDuration) + 1;
    rawNotes.push({
      id: `q-br-lh-${idx}`,
      midi: n.midi,
      noteName: midiToName(n.midi),
      startTime: Number(n.time.toFixed(3)),
      duration: Number(Math.max(0.12, n.duration).toFixed(3)),
      hand: 'left',
      measure,
      velocity: Math.round(n.velocity * 127)
    });
  });

  // Track 0 = Right Hand Chords
  m.tracks[0].notes.forEach((n, idx) => {
    const measure = Math.floor(n.time / measureDuration) + 1;
    rawNotes.push({
      id: `q-br-rh-${idx}`,
      midi: n.midi,
      noteName: midiToName(n.midi),
      startTime: Number(n.time.toFixed(3)),
      duration: Number(Math.max(0.12, n.duration).toFixed(3)),
      hand: 'right',
      measure,
      velocity: Math.round(n.velocity * 127)
    });
  });

  // Track 1 = Right Hand Fill
  m.tracks[1].notes.forEach((n, idx) => {
    const measure = Math.floor(n.time / measureDuration) + 1;
    rawNotes.push({
      id: `q-br-fill-${idx}`,
      midi: n.midi,
      noteName: midiToName(n.midi),
      startTime: Number(n.time.toFixed(3)),
      duration: Number(Math.max(0.12, n.duration).toFixed(3)),
      hand: 'right',
      measure,
      velocity: Math.round(n.velocity * 127)
    });
  });

  // Track 4 = Right Hand Vocal Melody
  m.tracks[4].notes.forEach((n, idx) => {
    const measure = Math.floor(n.time / measureDuration) + 1;
    rawNotes.push({
      id: `q-br-mel-${idx}`,
      midi: n.midi,
      noteName: midiToName(n.midi),
      startTime: Number(n.time.toFixed(3)),
      duration: Number(Math.max(0.12, n.duration).toFixed(3)),
      hand: 'right',
      measure,
      velocity: Math.min(127, Math.round(n.velocity * 127 * 1.15)) // Boost melody slightly for projection
    });
  });

  // Sort notes chronologically, then by pitch ascending
  rawNotes.sort((a, b) => a.startTime - b.startTime || a.midi - b.midi);

  // Generate pedal events: pedal down on each measure beat 1, lift on beat 3 or 4
  const pedalEvents = [];
  const totalMeasures = Math.ceil(m.duration / measureDuration);
  for (let meas = 1; meas <= totalMeasures; meas++) {
    const mStart = (meas - 1) * measureDuration;
    pedalEvents.push({
      id: `br-ped-${meas}-1`,
      time: Number(mStart.toFixed(3)),
      type: 'down',
      depth: 100,
      measure: meas
    });
    pedalEvents.push({
      id: `br-ped-${meas}-2`,
      time: Number((mStart + measureDuration * 0.48).toFixed(3)),
      type: 'up',
      depth: 0,
      measure: meas
    });
    pedalEvents.push({
      id: `br-ped-${meas}-3`,
      time: Number((mStart + measureDuration * 0.50).toFixed(3)),
      type: 'down',
      depth: 100,
      measure: meas
    });
    pedalEvents.push({
      id: `br-ped-${meas}-4`,
      time: Number((mStart + measureDuration * 0.96).toFixed(3)),
      type: 'up',
      depth: 0,
      measure: meas
    });
  }

  const sections = [
    {
      id: 'br-sec-1',
      title: 'Intro – Iconic Bb Major Piano Ballad (M. 1–8)',
      startMeasure: 1,
      endMeasure: 8,
      startTime: 0,
      endTime: Number((8 * measureDuration).toFixed(2)),
      tempoSuggestion: '72 BPM Andante maestoso',
      character: 'The world-famous Freddie Mercury piano intro. Flowing Bb-Gm-Cm-F arpeggios.'
    },
    {
      id: 'br-sec-2',
      title: 'Verse 1 – "Mama, just killed a man" (M. 9–16)',
      startMeasure: 9,
      endMeasure: 16,
      startTime: Number((8 * measureDuration).toFixed(2)),
      endTime: Number((16 * measureDuration).toFixed(2)),
      tempoSuggestion: '72 BPM Espressivo cantabile',
      character: 'Haunting storytelling. Let the right hand vocal line soar over the rocking chords.'
    },
    {
      id: 'br-sec-3',
      title: 'Verse 2 – "Mama, life had just begun" (M. 17–24)',
      startMeasure: 17,
      endMeasure: 24,
      startTime: Number((16 * measureDuration).toFixed(2)),
      endTime: Number((24 * measureDuration).toFixed(2)),
      tempoSuggestion: '72 BPM Con calore',
      character: 'Emotional build-up. Warmer bass octaves and soaring vocal melody.'
    },
    {
      id: 'br-sec-4',
      title: 'Climax & Outro – "Carry on, carry on" (M. 25–33)',
      startMeasure: 25,
      endMeasure: 33,
      startTime: Number((24 * measureDuration).toFixed(2)),
      endTime: Number((33 * measureDuration).toFixed(2)),
      tempoSuggestion: '72 BPM Dolce rallentando',
      character: 'Grand emotional climax resolving into the gentle "nothing really matters" fade.'
    }
  ];

  const annotations = [
    {
      id: 'br-ann-1',
      measureRange: [1, 8],
      title: 'The Iconic Freddie Mercury Piano Touch',
      germanTerm: 'Legato-Arpeggien & Rock-Ballade',
      category: 'tone-color',
      instruction: 'Articulate the opening Bb major eighth-note arpeggios with crisp clarity and gentle rhythmic pulse. Avoid over-pedaling so the internal harmonic shifts (Bb - Gm - Cm - F) ring out transparently.',
      referenceTimestampSeconds: 2
    },
    {
      id: 'br-ann-2',
      measureRange: [9, 16],
      title: 'Vocal Melody Projection ("Mama")',
      germanTerm: 'Gesangsstimme & Cantabile',
      category: 'voicing',
      instruction: 'Give the right-hand pinky and fourth finger firm arm weight on the melody (D5, Bb4, C5). Keep the left-hand bass octaves resonant but deep beneath the voice.',
      referenceTimestampSeconds: 28
    },
    {
      id: 'br-ann-3',
      measureRange: [25, 33],
      title: 'Climax & Gentle Resolution',
      germanTerm: 'Höhepunkt & Sanfter Ausklang',
      category: 'transition',
      instruction: 'Lean passionately into the chromatic bass descent on "Carry on", then gradually soften dynamics towards the final tender cadence.',
      referenceTimestampSeconds: 82
    }
  ];

  const piece = {
    id: 'queen-bohemian-rhapsody',
    title: 'Bohemian Rhapsody',
    composer: 'Freddie Mercury (Queen)',
    key: 'Bb major',
    timeSignature: [4, 4],
    tempoBpm: 72,
    duration: Number(m.duration.toFixed(2)),
    notes: rawNotes,
    pedalEvents,
    sections,
    annotations
  };

  fs.writeFileSync('src/data/scores/queen-bohemian-rhapsody.json', JSON.stringify(piece, null, 2));
  console.log(`Successfully generated queen-bohemian-rhapsody.json: ${rawNotes.length} notes across ${totalMeasures} measures.`);
}

build().catch(console.error);
