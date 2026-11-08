import fs from 'fs';
import pkg from '@tonejs/midi';
const { Midi } = pkg;

const midiPath = 'C:/Users/Kxwie/Downloads/Liszt - Liebestraum No 3.mid';
const outPath = 'src/data/scores/liszt-liebestraum-3.json';

const buf = fs.readFileSync(midiPath);
const midi = new Midi(buf);

const PITCH_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
function midiToNoteName(midi) {
  const pitch = PITCH_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return pitch + octave;
}

const ppq = midi.header.ppq || 480;
const timeSigs = midi.header.timeSignatures?.length > 0
  ? midi.header.timeSignatures
  : [{ ticks: 0, timeSignature: [6, 4], measures: 0 }];

function getMeasureAndBeat(ticks) {
  let curSig = timeSigs[0];
  let curSigIdx = 0;
  for (let i = 0; i < timeSigs.length; i++) {
    if (ticks >= timeSigs[i].ticks) {
      curSig = timeSigs[i];
      curSigIdx = i;
    } else {
      break;
    }
  }

  let baseMeasure = 1;
  for (let i = 0; i < curSigIdx; i++) {
    const segTicks = timeSigs[i + 1].ticks - timeSigs[i].ticks;
    const ticksPerMeasure = (timeSigs[i].timeSignature[0] * ppq * 4) / timeSigs[i].timeSignature[1];
    baseMeasure += Math.round(segTicks / ticksPerMeasure);
  }

  const numBeats = curSig.timeSignature[0];
  const beatUnit = curSig.timeSignature[1];
  const ticksPerBeat = (ppq * 4) / beatUnit;
  const ticksPerMeasure = numBeats * ticksPerBeat;

  const offsetTicks = Math.max(0, ticks - curSig.ticks);
  const measureInSig = Math.floor(offsetTicks / ticksPerMeasure);
  const ticksInMeasure = offsetTicks % ticksPerMeasure;
  const beat = parseFloat((ticksInMeasure / ticksPerBeat + 1).toFixed(2));

  return {
    measure: baseMeasure + measureInSig,
    beat,
  };
}

const notes = [];
let noteCounter = 1;

midi.tracks.forEach((track, trackIdx) => {
  const trackName = (track.name || '').toLowerCase();
  const isRight = trackIdx === 0 || trackName.includes('right') || trackName.includes('rh');
  const isLeft = trackIdx === 1 || trackName.includes('left') || trackName.includes('lh');
  if (!isRight && !isLeft && track.notes.length === 0) return;

  const hand = isLeft ? 'left' : 'right';

  track.notes.forEach((n) => {
    const mb = getMeasureAndBeat(n.ticks);
    notes.push({
      id: `liszt-liebestraum-3-${noteCounter++}`,
      midi: n.midi,
      noteName: midiToNoteName(n.midi),
      startTime: parseFloat(n.time.toFixed(3)),
      duration: Math.max(0.08, parseFloat(n.duration.toFixed(3))),
      hand,
      measure: mb.measure,
      beat: mb.beat,
      velocity: Math.max(40, Math.min(127, Math.round(n.velocity * 127))),
    });
  });
});

notes.sort((a, b) => a.startTime - b.startTime);

// Process CC64 Sustain Pedal Events
const pedalEvents = [];
const pedalTrack = midi.tracks.find(t => t.controlChanges?.[64]?.length > 0);
if (pedalTrack) {
  const cc64List = pedalTrack.controlChanges[64];
  for (let i = 0; i < cc64List.length; i++) {
    const cc = cc64List[i];
    if (cc.value > 0.4) {
      // Find pedal release
      let releaseTime = cc.time + 1.8;
      for (let j = i + 1; j < cc64List.length; j++) {
        if (cc64List[j].value <= 0.4) {
          releaseTime = cc64List[j].time;
          break;
        }
      }
      const duration = Math.max(0.2, parseFloat((releaseTime - cc.time).toFixed(3)));
      const mb = getMeasureAndBeat(cc.ticks);
      pedalEvents.push({
        startTime: parseFloat(cc.time.toFixed(3)),
        duration,
        depth: Math.round(cc.value * 127),
        type: cc.value > 0.7 ? 'sustain' : 'half',
        measure: mb.measure,
      });
    }
  }
}

const duration = notes.length > 0 ? parseFloat((notes[notes.length - 1].startTime + notes[notes.length - 1].duration + 1.5).toFixed(2)) : 245;
const maxMeasure = Math.max(...notes.map((n) => n.measure));

const sections = [
  {
    id: 'liszt-lt3-sec-1',
    title: 'Poco allegro, con affetto – Theme I (M. 1–25)',
    startMeasure: 1,
    endMeasure: 25,
    startTime: notes.find(n => n.measure === 1)?.startTime || 0,
    endTime: notes.find(n => n.measure === 26)?.startTime || 66.0,
    tempoSuggestion: '76 BPM (quarter = 76 in 6/4)',
    character: 'Cantabile, dolce con tenerezza'
  },
  {
    id: 'liszt-lt3-sec-2',
    title: 'Cadenza I – Presto leggierissimo (M. 25–26)',
    startMeasure: 25,
    endMeasure: 26,
    startTime: notes.find(n => n.measure === 25)?.startTime || 61.9,
    endTime: notes.find(n => n.measure === 27)?.startTime || 71.2,
    tempoSuggestion: 'Presto leggierissimo (Rubato)',
    character: 'Cascading pearly arpeggios'
  },
  {
    id: 'liszt-lt3-sec-3',
    title: 'Più animato con passione – Theme II (M. 27–40)',
    startMeasure: 27,
    endMeasure: 40,
    startTime: notes.find(n => n.measure === 27)?.startTime || 71.2,
    endTime: notes.find(n => n.measure === 41)?.startTime || 107.0,
    tempoSuggestion: '84 BPM in B Major',
    character: 'Passionato, crescendo poco a poco'
  },
  {
    id: 'liszt-lt3-sec-4',
    title: 'Grand Climax Appassionato Assai (M. 41–59)',
    startMeasure: 41,
    endMeasure: 59,
    startTime: notes.find(n => n.measure === 41)?.startTime || 107.0,
    endTime: notes.find(n => n.measure === 60)?.startTime || 149.7,
    tempoSuggestion: '92 BPM Climax Fortissimo',
    character: 'Orchestral grandeur & soaring emotion'
  },
  {
    id: 'liszt-lt3-sec-5',
    title: 'Cadenza II – Dolcissimo con grazia (M. 60–61)',
    startMeasure: 60,
    endMeasure: 61,
    startTime: notes.find(n => n.measure === 60)?.startTime || 149.7,
    endTime: notes.find(n => n.measure === 62)?.startTime || 157.6,
    tempoSuggestion: 'Dolcissimo con grazia',
    character: 'Descending crystalline arabesque'
  },
  {
    id: 'liszt-lt3-sec-6',
    title: 'Tempo I – Recapitulation & Nocturnal Coda (M. 62–88)',
    startMeasure: 62,
    endMeasure: maxMeasure,
    startTime: notes.find(n => n.measure === 62)?.startTime || 157.6,
    endTime: duration,
    tempoSuggestion: '72 BPM dying away',
    character: 'Ethereal pianissimo resolution'
  },
  {
    id: 'liszt-lt3-full',
    title: 'Liebestraum No. 3 – Complete Master Performance',
    startMeasure: 1,
    endMeasure: maxMeasure,
    startTime: 0,
    endTime: duration,
    tempoSuggestion: 'Rubato con affetto',
    character: 'Full Masterclass Performance'
  }
];

const annotations = [
  {
    id: 'lt3-ann-1',
    measureRange: [1, 8],
    title: 'Tenor Melody Projection & Whispering Arpeggios',
    germanTerm: 'Gesangsstimme & Klangbalance',
    category: 'tone-color',
    instruction: 'Liszt marks the melody to be played by the right-hand thumb and shared with the left hand in the tenor range. Keep the surrounding six-eight broken chords completely sotto voce while projecting the cantabile line with warm arm weight.',
    referenceTimestampSeconds: 2.5
  },
  {
    id: 'lt3-ann-2',
    measureRange: [25, 26],
    title: 'Cadenza I: Weightless Pearly Touch',
    germanTerm: 'Perlender Anschlag',
    category: 'fingering',
    instruction: 'Do not stiffen the wrists. Keep fingers curved and light as feathers (leggierissimo), letting momentum carry the chromatic double-arpeggio cascade upwards and downwards.',
    pedalGuidance: {
      action: 'catch',
      explanation: 'Use soft pedal (una corda) and hold damper gently to blend the harmonic overtone aura without clouding.',
      idealHoldMs: 4000
    },
    referenceTimestampSeconds: 62.0
  },
  {
    id: 'lt3-ann-3',
    measureRange: [41, 50],
    title: 'Appassionato Assai: Full Orchestral Resonance',
    germanTerm: 'Orchesterklang & Steigerung',
    category: 'rubato',
    instruction: 'Deliver triumphant fortissimo octaves in both hands. Use your back and shoulders for power rather than isolated finger tension, creating an impassioned, resonant romantic swell.',
    pedalGuidance: {
      action: 'catch',
      explanation: 'Clear pedal crisply on the principal downbeats to prevent acoustic muddiness during dense chord changes.',
      idealHoldMs: 1200
    },
    referenceTimestampSeconds: 110.0
  },
  {
    id: 'lt3-ann-4',
    measureRange: [60, 61],
    title: 'Cadenza II: Pearly Descending Arabesque',
    germanTerm: 'Klangauflösung',
    category: 'transition',
    instruction: 'After the thunderous climax, dissolve into crystalline pianissimo drops. Decelerate gracefully into the return of the main theme in A-flat major.',
    referenceTimestampSeconds: 150.0
  },
  {
    id: 'lt3-ann-5',
    measureRange: [75, 88],
    title: 'Nocturnal Coda: Timeless Stillness',
    germanTerm: 'Verklingender Ausklang',
    category: 'pedal',
    instruction: 'Allow the final low A-flat pedal points to ring freely. The arpeggiated chords should sound as though suspended in mid-air, fading into complete serenity.',
    pedalGuidance: {
      action: 'full-hold',
      explanation: 'Hold the damper pedal throughout the final two bars until the acoustic vibration naturally dissipates.',
      idealHoldMs: 8000
    },
    referenceTimestampSeconds: 220.0
  }
];

const pieceData = {
  id: 'liszt-liebestraum-3',
  title: 'Liebestraum No. 3 (Notturno III)',
  composer: 'Franz Liszt',
  opus: 'S. 541 / Op. 62 No. 3 (1850)',
  key: 'Ab Major',
  timeSignature: [6, 4],
  tempoBpm: 76,
  duration,
  notes,
  pedalEvents,
  annotations,
  sections,
};

fs.writeFileSync(outPath, JSON.stringify(pieceData, null, 2), 'utf8');
console.log(`Successfully generated ${outPath}!`);
console.log(`Notes: ${notes.length}, PedalEvents: ${pedalEvents.length}, Sections: ${sections.length}, Duration: ${duration}s`);
