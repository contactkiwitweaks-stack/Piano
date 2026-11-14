import fs from 'fs';

const PITCH_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
function midiToNoteName(midi) {
  const pitch = PITCH_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return pitch + octave;
}

const notes = [];
let noteIdCounter = 1;

function addNote(midi, startTime, duration, hand, measure, beat, velocity = 80) {
  notes.push({
    id: `sorrow-${noteIdCounter++}`,
    midi,
    noteName: midiToNoteName(midi),
    startTime: parseFloat(startTime.toFixed(3)),
    duration: parseFloat(Math.max(0.06, duration).toFixed(3)),
    hand,
    measure,
    beat: parseFloat(beat.toFixed(2)),
    velocity: Math.max(35, Math.min(127, Math.round(velocity))),
  });
}

const pedalEvents = [];
function addPedal(time, duration, measure, beat, depth = 127) {
  pedalEvents.push({
    time: parseFloat(time.toFixed(3)),
    duration: parseFloat(duration.toFixed(3)),
    type: 'sustain',
    measure,
    beat: parseFloat(beat.toFixed(2)),
    depth,
  });
}

// -------------------------------------------------------------
// PART I: MODERATO DOLOROSO (M. 1–28) — 4/4 Time, 66 BPM
// Seconds per beat at 66 BPM = 60 / 66 = 0.909s. Bar duration = 3.636s.
// -------------------------------------------------------------
let currentTime = 1.0;
const beatSecPart1 = 60 / 66;

// M. 1–4: Unaccompanied Solo Introduction (Funeral Bell & Motif Alpha)
// M. 1: Low G0/G1 Octave Bell ringing out
addNote(31, currentTime, 3.2, 'left', 1, 1, 95); // G1
addNote(43, currentTime, 3.2, 'left', 1, 1, 90); // G2
addPedal(currentTime, 3.5, 1, 1, 120);

// M. 2: Motif Alpha enters in Soprano (D5 -> C#5 -> E5 -> D5)
addNote(74, currentTime + beatSecPart1 * 2, beatSecPart1 * 0.9, 'right', 2, 3, 76); // D5
addNote(73, currentTime + beatSecPart1 * 3, beatSecPart1 * 0.45, 'right', 2, 4, 72); // C#5
addNote(76, currentTime + beatSecPart1 * 3.5, beatSecPart1 * 0.45, 'right', 2, 4.5, 78); // E5
currentTime += beatSecPart1 * 4;

// M. 3–4: Weeping descent
addNote(74, currentTime, beatSecPart1 * 1.8, 'right', 3, 1, 80); // D5
addNote(38, currentTime, beatSecPart1 * 3.5, 'left', 3, 1, 75); // D2
addNote(50, currentTime, beatSecPart1 * 3.5, 'left', 3, 1, 70); // D3
addPedal(currentTime, 3.4, 3, 1, 100);

addNote(70, currentTime + beatSecPart1 * 2, beatSecPart1 * 0.9, 'right', 3, 3, 75); // Bb4
addNote(69, currentTime + beatSecPart1 * 3, beatSecPart1 * 0.9, 'right', 3, 4, 72); // A4
currentTime += beatSecPart1 * 4;

// M. 4: Resolution into G minor
addNote(67, currentTime, beatSecPart1 * 2.5, 'right', 4, 1, 78); // G4
addNote(31, currentTime, beatSecPart1 * 3.5, 'left', 4, 1, 85); // G1
addNote(43, currentTime, beatSecPart1 * 3.5, 'left', 4, 1, 80); // G2
addNote(55, currentTime + beatSecPart1 * 1, beatSecPart1 * 2, 'left', 4, 2, 65); // G3
addNote(58, currentTime + beatSecPart1 * 2, beatSecPart1 * 1.5, 'left', 4, 3, 62); // Bb3
addNote(62, currentTime + beatSecPart1 * 3, beatSecPart1 * 1, 'left', 4, 4, 60); // D4
addPedal(currentTime, 3.4, 4, 1, 110);
currentTime += beatSecPart1 * 4;

// M. 5–16: Theme I with Chromatic Lament Bass (G -> F# -> F -> E -> Eb -> D)
const lamentBassMidis = [
  { mBass: 31, mTenor: [55, 58, 62], melody: [74, 73, 76, 74], mNum: 5 }, // G minor
  { mBass: 30, mTenor: [54, 57, 62], melody: [72, 70, 69, 70], mNum: 6 }, // D7/F#
  { mBass: 29, mTenor: [53, 58, 62], melody: [69, 67, 69, 70], mNum: 7 }, // Gmin7/F
  { mBass: 28, mTenor: [52, 58, 64], melody: [72, 74, 76, 77], mNum: 8 }, // C7/E
  { mBass: 27, mTenor: [51, 55, 63], melody: [75, 74, 72, 70], mNum: 9 }, // Eb Major
  { mBass: 26, mTenor: [50, 57, 62], melody: [69, 67, 66, 67], mNum: 10 }, // D7
  { mBass: 31, mTenor: [55, 58, 62], melody: [74, 77, 76, 74], mNum: 11 }, // G minor var
  { mBass: 20, mTenor: [48, 56, 60], melody: [68, 72, 75, 80], mNum: 12 }, // Ab Major (Neapolitan!)
  { mBass: 26, mTenor: [50, 54, 57, 62], melody: [79, 78, 74, 70], mNum: 13 }, // D7b9
  { mBass: 31, mTenor: [55, 58, 62], melody: [67, 70, 74, 79], mNum: 14 }, // G minor
  { mBass: 27, mTenor: [51, 58, 63], melody: [75, 79, 82, 87], mNum: 15 }, // Eb Major swell
  { mBass: 26, mTenor: [50, 57, 62], melody: [86, 84, 82, 81], mNum: 16 }, // D Major dominant
];

lamentBassMidis.forEach(({ mBass, mTenor, melody, mNum }) => {
  addNote(mBass, currentTime, beatSecPart1 * 3.5, 'left', mNum, 1, 85);
  addNote(mBass + 12, currentTime, beatSecPart1 * 3.5, 'left', mNum, 1, 78);
  addPedal(currentTime, beatSecPart1 * 3.8, mNum, 1, 115);

  // Left hand arpeggiated tenor pulses on beats 2, 3, 4
  mTenor.forEach((tMidi, tIdx) => {
    addNote(tMidi, currentTime + beatSecPart1 * (tIdx + 1), beatSecPart1 * 0.85, 'left', mNum, tIdx + 2, 58);
  });

  // Right hand singing cantabile melody
  melody.forEach((melMidi, melIdx) => {
    addNote(melMidi, currentTime + beatSecPart1 * melIdx, beatSecPart1 * 0.92, 'right', mNum, melIdx + 1, 86);
  });

  currentTime += beatSecPart1 * 4;
});

// M. 17–28: Tenor Cello Dialogue & Fioritura Cascade
for (let bar = 17; bar <= 28; bar++) {
  const isFiorituraBar = bar === 24;
  const isNeapolitanClimax = bar === 26;

  addNote(bar % 2 === 0 ? 27 : 31, currentTime, beatSecPart1 * 3.6, 'left', bar, 1, 88);
  addNote((bar % 2 === 0 ? 27 : 31) + 12, currentTime, beatSecPart1 * 3.6, 'left', bar, 1, 80);
  addPedal(currentTime, beatSecPart1 * 3.8, bar, 1, 120);

  // Tenor melody (played by left hand thumb, rich cello timbre)
  const tenorNotes = [55, 57, 58, 62];
  tenorNotes.forEach((tNote, tIdx) => {
    addNote(tNote, currentTime + beatSecPart1 * tIdx, beatSecPart1 * 0.9, 'left', bar, tIdx + 1, 92);
  });

  // Right hand shimmering counterpoint
  if (isFiorituraBar) {
    // 11-note Chopin fioritura cascade
    const fiorituraPitches = [82, 81, 79, 78, 76, 75, 74, 72, 70, 69, 67];
    const fioStep = (beatSecPart1 * 2) / fiorituraPitches.length;
    fiorituraPitches.forEach((fMidi, fIdx) => {
      addNote(fMidi, currentTime + beatSecPart1 * 2 + fIdx * fioStep, fioStep * 0.95, 'right', bar, 3 + fIdx * 0.18, 68);
    });
  } else if (isNeapolitanClimax) {
    // Neapolitan Ab Major emotional swell
    [68, 72, 75, 80].forEach((nMidi, nIdx) => {
      addNote(nMidi, currentTime + beatSecPart1 * nIdx, beatSecPart1 * 0.9, 'right', bar, nIdx + 1, 102);
    });
  } else {
    // Gentle bel canto chords
    [70, 74, 79].forEach((cMidi) => {
      addNote(cMidi, currentTime + beatSecPart1 * 1, beatSecPart1 * 1.2, 'right', bar, 2, 72);
      addNote(cMidi, currentTime + beatSecPart1 * 3, beatSecPart1 * 0.9, 'right', bar, 4, 70);
    });
  }

  currentTime += beatSecPart1 * 4;
}

// -------------------------------------------------------------
// PART II: PIÙ MOSSO APPASSIONATO (M. 29–72) — 12/8 Time, 84 BPM
// Eb Major / C minor. Dotted quarter beat = 60 / 84 = 0.714s. Bar duration = 2.857s.
// -------------------------------------------------------------
const beatSecPart2 = (60 / 84) / 3; // Eighth note duration = ~0.238s

for (let bar = 29; bar <= 72; bar++) {
  const isBMajorDream = bar >= 49 && bar <= 56;
  const bassRoot = isBMajorDream ? 23 : bar % 4 === 0 ? 24 : bar % 2 === 0 ? 27 : 31; // B0, C1, Eb1, G1
  const harmonyMidis = isBMajorDream ? [59, 63, 66] : [55, 58, 63]; // B Major vs Eb Major

  // Downbeat sub-bass anchor
  addNote(bassRoot, currentTime, beatSecPart2 * 11, 'left', bar, 1, 95);
  addNote(bassRoot + 12, currentTime, beatSecPart2 * 11, 'left', bar, 1, 88);
  addPedal(currentTime, beatSecPart2 * 11.5, bar, 1, 125);

  // Liszt Three-Hand Texture:
  // 1. Alternating thumbs sing the melody in tenor/alto register on dotted quarter beats (1, 4, 7, 10)
  const melodyPitches = isBMajorDream
    ? [63, 66, 71, 75] // D#4, F#4, B4, D#5
    : [63, 67, 70, 75]; // Eb4, G4, Bb4, Eb5

  melodyPitches.forEach((mPitch, mIdx) => {
    const onsetSec = currentTime + mIdx * 3 * beatSecPart2;
    addNote(mPitch, onsetSec, beatSecPart2 * 2.8, mIdx % 2 === 0 ? 'left' : 'right', bar, mIdx * 3 + 1, 98);
  });

  // 2. Rippling 16th/8th-note treble arpeggio weave across all 12 pulses
  for (let pulse = 0; pulse < 12; pulse++) {
    const chordTone = harmonyMidis[pulse % 3] + 12 * Math.floor(pulse / 4);
    if (chordTone <= 88) {
      addNote(chordTone, currentTime + pulse * beatSecPart2, beatSecPart2 * 0.88, 'right', bar, pulse + 1, 54);
    }
  }

  currentTime += beatSecPart2 * 12;
}

// -------------------------------------------------------------
// PART III: TEMPESTOSO E CRESCENDO (M. 73–104) — 4/4 Time, 108 BPM
// Accelerando, Interlocking Octaves, and Gathering Crisis
// -------------------------------------------------------------
const beatSecPart3 = 60 / 108; // ~0.556s per beat

for (let bar = 73; bar <= 104; bar++) {
  const progressRatio = (bar - 73) / (104 - 73);
  const curVel = 80 + Math.round(progressRatio * 38); // 80 to 118
  const bassOctave = bar % 4 === 0 ? 26 : bar % 2 === 0 ? 27 : 31; // D, Eb, G

  // Rumbling left-hand octave tremolos on beats 1 and 3
  addNote(bassOctave, currentTime, beatSecPart3 * 1.8, 'left', bar, 1, curVel);
  addNote(bassOctave + 12, currentTime, beatSecPart3 * 1.8, 'left', bar, 1, curVel - 5);
  addNote(bassOctave, currentTime + beatSecPart3 * 2, beatSecPart3 * 1.8, 'left', bar, 3, curVel);
  addNote(bassOctave + 12, currentTime + beatSecPart3 * 2, beatSecPart3 * 1.8, 'left', bar, 3, curVel - 5);
  addPedal(currentTime, beatSecPart3 * 3.8, bar, 1, 110);

  // Right-hand urgent syncopated chords
  const chordRoots = [58, 62, 65, 70]; // Bb, D, F, Bb
  chordRoots.forEach((cPitch) => {
    addNote(cPitch + Math.round(progressRatio * 12), currentTime + beatSecPart3 * 1, beatSecPart3 * 0.9, 'right', bar, 2, curVel);
    addNote(cPitch + Math.round(progressRatio * 12) + 4, currentTime + beatSecPart3 * 1, beatSecPart3 * 0.9, 'right', bar, 2, curVel - 3);
    addNote(cPitch + Math.round(progressRatio * 12), currentTime + beatSecPart3 * 3, beatSecPart3 * 0.9, 'right', bar, 4, curVel);
    addNote(cPitch + Math.round(progressRatio * 12) + 4, currentTime + beatSecPart3 * 3, beatSecPart3 * 0.9, 'right', bar, 4, curVel - 3);
  });

  currentTime += beatSecPart3 * 4;
}

// -------------------------------------------------------------
// PART IV: CADENZA PRECIPITOSA (M. 105–112) — The 7:35 Precipice & Cutoff
// M. 105–108: German Augmented Sixth Crisis (Eb - G - Bb - C#)
// M. 109–111: Torrential 4-octave chromatic descent
// M. 112: The 7:39 Cliff-Edge Cutoff (Dead Silence)
// -------------------------------------------------------------
const beatSecCadenza = 0.42;

// M. 105–108: German Sixth Fortissimo
for (let bar = 105; bar <= 108; bar++) {
  addNote(27, currentTime, beatSecCadenza * 3.5, 'left', bar, 1, 122); // Low Eb1
  addNote(39, currentTime, beatSecCadenza * 3.5, 'left', bar, 1, 120); // Eb2
  addPedal(currentTime, beatSecCadenza * 3.8, bar, 1, 127);

  // Massive crashing German 6th chords
  [63, 67, 70, 73, 79].forEach((p) => {
    addNote(p, currentTime, beatSecCadenza * 1.8, 'right', bar, 1, 122);
    addNote(p, currentTime + beatSecCadenza * 2, beatSecCadenza * 1.8, 'right', bar, 3, 125);
  });
  currentTime += beatSecCadenza * 4;
}

// M. 109–111: The Downward Chromatic Torrent (F7 down to F1)
let descPitch = 89; // F6
const descStepSec = 0.055;
for (let bar = 109; bar <= 111; bar++) {
  addPedal(currentTime, descStepSec * 16, bar, 1, 127);
  for (let step = 0; step < 16; step++) {
    addNote(descPitch, currentTime + step * descStepSec, descStepSec * 0.9, step % 2 === 0 ? 'right' : 'left', bar, 1 + step * 0.2, 118);
    descPitch = Math.max(29, descPitch - 1);
  }
  currentTime += descStepSec * 16;
}

// M. 112: THE 7:39 CLIFF-EDGE CUTOFF (Fortissimo slap, instant damper choke, dead silence)
addNote(26, currentTime, 0.25, 'left', 112, 1, 127); // Low D1 slap
addNote(38, currentTime, 0.25, 'left', 112, 1, 127); // D2
addNote(62, currentTime, 0.25, 'right', 112, 1, 125); // D4
addNote(74, currentTime, 0.25, 'right', 112, 1, 125); // D5
// NO PEDAL! Immediate dampening creates absolute silent suspense!
currentTime += 1.8; // Dead silence fermata

// -------------------------------------------------------------
// PART V: PRESTO CON FUOCO (M. 113–152) — THE ZIMERMAN 7:40 CODA DROP-OFF
// 2/2 Meter (Alla Breve), 152 BPM. Half-note beat = 60 / 76 = ~0.789s.
// Sotto voce whispered pp exploding over 36 measures into il più forte possibile (fff)!
// -------------------------------------------------------------
const halfNoteSec = 60 / 76;
const eighthSecCoda = halfNoteSec / 4; // ~0.197s

for (let bar = 113; bar <= 152; bar++) {
  const codaProgress = (bar - 113) / (152 - 113);
  const codaVel = Math.round(48 + codaProgress * 75); // Whispered 48 climbing to 123!
  const isEvenBar = bar % 2 === 0;

  // Damper pedal: quarter-pedal taps on downbeats for electric crispness
  addPedal(currentTime, halfNoteSec * 0.9, bar, 1, Math.min(127, 40 + Math.round(codaProgress * 80)));

  // Left Hand: Motif Gamma — Demonic driving ostinato leaping over tenths
  // Downbeat low G1 anchor
  addNote(31, currentTime, eighthSecCoda * 1.5, 'left', bar, 1, codaVel + 5);
  // Climbing arpeggio
  addNote(43, currentTime + eighthSecCoda * 1, eighthSecCoda * 0.95, 'left', bar, 1.25, codaVel);
  addNote(50, currentTime + eighthSecCoda * 2, eighthSecCoda * 0.95, 'left', bar, 1.5, codaVel);
  addNote(55, currentTime + eighthSecCoda * 3, eighthSecCoda * 0.95, 'left', bar, 1.75, codaVel);
  // Leaping tenth snap!
  addNote(isEvenBar ? 63 : 62, currentTime + eighthSecCoda * 4, eighthSecCoda * 1.5, 'left', bar, 2, codaVel + 6);
  addNote(55, currentTime + eighthSecCoda * 5, eighthSecCoda * 0.95, 'left', bar, 2.25, codaVel);
  addNote(50, currentTime + eighthSecCoda * 6, eighthSecCoda * 0.95, 'left', bar, 2.5, codaVel);
  addNote(43, currentTime + eighthSecCoda * 7, eighthSecCoda * 0.95, 'left', bar, 2.75, codaVel);

  // Right Hand: Jagged, syncopated chord gasps on off-beats (syncopation on beats 1.5 and 2.5)
  const chordSet = isEvenBar ? [63, 67, 72] : [62, 66, 74]; // Eb-G-C vs D-F#-D
  chordSet.forEach((p) => {
    addNote(p, currentTime + eighthSecCoda * 2, eighthSecCoda * 1.4, 'right', bar, 1.5, codaVel + 8);
    addNote(p + (codaProgress > 0.5 ? 12 : 0), currentTime + eighthSecCoda * 6, eighthSecCoda * 1.4, 'right', bar, 2.5, codaVel + 10);
  });

  currentTime += halfNoteSec * 2;
}

// -------------------------------------------------------------
// PART VI: APOTEOSI TRAGICA & FINAL CODA STRETTA (M. 153–176) — 164 BPM
// il più forte possibile (fff) — Thunderous double chromatic scales and tragic close
// -------------------------------------------------------------
const strettaSec = 60 / 82;
const strettaEighth = strettaSec / 4;

for (let bar = 153; bar <= 170; bar++) {
  addPedal(currentTime, strettaSec * 1.8, bar, 1, 127);

  // Blinding double octaves in both hands
  addNote(31, currentTime, strettaSec * 0.9, 'left', bar, 1, 127);
  addNote(43, currentTime, strettaSec * 0.9, 'left', bar, 1, 125);
  addNote(55, currentTime + strettaSec * 0.5, strettaSec * 0.45, 'left', bar, 1.5, 124);
  addNote(67, currentTime + strettaSec * 1.0, strettaSec * 0.9, 'left', bar, 2, 127);

  // Right Hand crashing fortissimo chords
  [67, 70, 74, 79, 82].forEach((p) => {
    addNote(p, currentTime, strettaSec * 0.9, 'right', bar, 1, 127);
    addNote(p, currentTime + strettaSec * 1.0, strettaSec * 0.9, 'right', bar, 2, 127);
  });

  currentTime += strettaSec * 2;
}

// Final 6 Bars (M. 171–176): German Augmented Sixth slam and low G0 bell
addNote(27, currentTime, strettaSec * 2.5, 'left', 171, 1, 127); // Eb1
[63, 67, 70, 73, 79].forEach((p) => addNote(p, currentTime, strettaSec * 1.8, 'right', 171, 1, 127)); // Ger+6
addPedal(currentTime, strettaSec * 3, 171, 1, 127);
currentTime += strettaSec * 2;

// Dominant D7
addNote(26, currentTime, strettaSec * 2.5, 'left', 172, 1, 127); // D1
[62, 66, 69, 72, 78].forEach((p) => addNote(p, currentTime, strettaSec * 1.8, 'right', 172, 1, 127)); // D7
addPedal(currentTime, strettaSec * 3, 172, 1, 127);
currentTime += strettaSec * 2;

// M. 173–176: Final G minor Triple-Forte Chord & Decaying Resonance
addNote(19, currentTime, 8.0, 'left', 173, 1, 127); // Sub-contra G0!
addNote(31, currentTime, 8.0, 'left', 173, 1, 127); // G1
addNote(43, currentTime, 8.0, 'left', 173, 1, 125); // G2
[55, 58, 62, 67, 70, 74, 79].forEach((p) => addNote(p, currentTime, 7.5, 'right', 173, 1, 127));
addPedal(currentTime, 8.5, 173, 1, 127);
currentTime += 8.0;

// Sort notes
notes.sort((a, b) => a.startTime - b.startTime || a.midi - b.midi);
pedalEvents.sort((a, b) => a.time - b.time);

const finalDuration = parseFloat((notes[notes.length - 1].startTime + notes[notes.length - 1].duration).toFixed(1));

const sorrowScore = {
  id: 'chopin-liszt-sorrow',
  title: 'Sorrow (Concert Rhapsody in G Minor)',
  composer: 'Frédéric Chopin & Franz Liszt (Virtuoso Composition)',
  opus: '2026',
  key: 'G minor',
  timeSignature: [4, 4],
  tempoBpm: 66,
  duration: finalDuration,
  notes,
  pedalEvents,
  sections: [
    {
      id: 'sorrow-sec-1',
      title: 'I. Moderato doloroso – The Solitary Lament (M. 1–28)',
      startMeasure: 1,
      endMeasure: 28,
      startTime: 0,
      endTime: 102.8,
      tempoSuggestion: '66 BPM Moderato con affetto',
      character: 'Sotto voce solitary cantilena, weeping chromatic bass, and poignant Neapolitan sighs'
    },
    {
      id: 'sorrow-sec-2',
      title: 'II. Più mosso appassionato – Nostalgia in Eb Major (M. 29–72)',
      startMeasure: 29,
      endMeasure: 72,
      startTime: 102.8,
      endTime: 228.5,
      tempoSuggestion: '84 BPM in 12/8 Barcarolle',
      character: 'Liszt three-hand illusion: soaring tenor melody wrapped in rippling crystalline arpeggios'
    },
    {
      id: 'sorrow-sec-3',
      title: 'III. Tempestoso e crescendo – The Gathering Storm (M. 73–104)',
      startMeasure: 73,
      endMeasure: 104,
      startTime: 228.5,
      endTime: 299.7,
      tempoSuggestion: '108 BPM Accelerando poco a poco',
      character: 'Urgent syncopated chords over rising chromatic bass octaves, gathering uncontrollable fury'
    },
    {
      id: 'sorrow-sec-4',
      title: 'IV. Cadenza precipitosa – The 7:35 Precipice & Cutoff (M. 105–112)',
      startMeasure: 105,
      endMeasure: 112,
      startTime: 299.7,
      endTime: 318.0,
      tempoSuggestion: 'Rubato Presto -> Fermata Secco',
      character: 'Harrowing 4-octave chromatic descent slamming into an abrupt dead-stop cliff-edge silence'
    },
    {
      id: 'sorrow-sec-5',
      title: 'V. Presto con fuoco – The Zimerman 7:40 Coda Drop-Off (M. 113–152)',
      startMeasure: 113,
      endMeasure: 152,
      startTime: 318.0,
      endTime: 381.1,
      tempoSuggestion: '152 BPM Alla Breve (2/2)',
      character: 'The Zimerman 7:40 drop-off: whispered sotto voce terror, sweeping 10th ostinatos, and 36-bar volcanic crescendo'
    },
    {
      id: 'sorrow-sec-6',
      title: 'VI. Apoteosi Tragica & Final Stretta (M. 153–176)',
      startMeasure: 153,
      endMeasure: 176,
      startTime: 381.1,
      endTime: finalDuration,
      tempoSuggestion: '164 BPM il più forte possibile (fff)',
      character: 'Blinding double chromatic scales, crashing full-keyboard octaves, and unyielding tragic minor resolution'
    },
    {
      id: 'sorrow-full',
      title: 'Sorrow – Complete Masterclass Performance',
      startMeasure: 1,
      endMeasure: 176,
      startTime: 0,
      endTime: finalDuration,
      tempoSuggestion: 'High Romantic Virtuoso Interpretation',
      character: 'Full Masterclass Concert Performance'
    }
  ],
  annotations: [
    {
      id: 'sorrow-ann-1',
      measureRange: [1, 14],
      title: 'The Weeping Lament Bass & Bel Canto Sighs',
      germanTerm: 'Klagelied & Chromatische Basslinie',
      category: 'tone-color',
      instruction: 'Allow the low G bell to ring with deep chest resonance. Let the right hand melody breathe with subtle rubato, leaning tenderly into the Neapolitan Ab Major harmony at bar 12.',
      referenceTimestampSeconds: 5
    },
    {
      id: 'sorrow-ann-2',
      measureRange: [29, 48],
      title: 'The Liszt Three-Hand Illusion in Eb Major',
      germanTerm: 'Drei-Hände-Effekt & Barcarolle-Welle',
      category: 'fingering',
      instruction: 'Project the singing tenor melody with the fleshy pads of your alternating thumbs (velocity ~98). Keep the surrounding 12/8 treble arpeggios whispering like silk (velocity ~54).',
      pedalGuidance: {
        action: 'catch',
        explanation: 'Deep sympathetic bloom on downbeat bass roots with clean half-pedal clears on chord changes.',
        idealHoldMs: 2600
      },
      referenceTimestampSeconds: 110
    },
    {
      id: 'sorrow-ann-3',
      measureRange: [105, 112],
      title: 'The 7:35 Cliff-Edge Cutoff & Dead Silence',
      germanTerm: 'Der Abgrund & Plötzliche Stille',
      category: 'transition',
      instruction: 'Pour total body weight into the four-octave chromatic cascade. On the final downbeat of bar 112, kill the damper pedal INSTANTLY. The audience must feel the floor drop away into breathless silence.',
      referenceTimestampSeconds: 305
    },
    {
      id: 'sorrow-ann-4',
      measureRange: [113, 136],
      title: 'The 7:40 Coda Drop-Off: Whispered Sotto Voce Terror',
      germanTerm: 'Presto con Fuoco: Sotto Voce Eröffnung',
      category: 'rubato',
      instruction: 'CRITICAL: Do not play loud here! Snap into 152 BPM in icy, whispered pianissimo. The left-hand ostinato leaps across tenths like an inescapable heartbeat of destiny. Let the crescendo build with terrifying patience over 36 measures.',
      pedalGuidance: {
        action: 'staccato',
        explanation: 'Quarter-pedal syncopated taps on downbeats for electric crispness without muddying the ostinato.',
        idealHoldMs: 380
      },
      referenceTimestampSeconds: 320
    },
    {
      id: 'sorrow-ann-5',
      measureRange: [153, 176],
      title: 'Apoteosi Tragica: The Final Apocalypse',
      germanTerm: 'Tragische Apokalypse & Verklingender Ausklang',
      category: 'tone-color',
      instruction: 'Unleash full orchestral power (fff). Engage back and shoulder muscles for the crashing double octaves. Hold the final low sub-contra G0 fundamental under full pedal until the acoustic vibration dissipates into eternity.',
      referenceTimestampSeconds: 390
    }
  ]
};

fs.writeFileSync('src/data/scores/chopin-liszt-sorrow.json', JSON.stringify(sorrowScore, null, 2));
fs.writeFileSync('public/scores/chopin-liszt-sorrow.json', JSON.stringify(sorrowScore, null, 2));
console.log('Successfully composed Sorrow! Total notes:', sorrowScore.notes.length, 'pedal events:', sorrowScore.pedalEvents.length, 'duration:', sorrowScore.duration, 'seconds');
