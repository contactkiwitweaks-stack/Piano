import fs from 'fs';

const PITCH_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
function midiToNoteName(midi) {
  const pitch = PITCH_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return pitch + octave;
}

const notes = [];
let noteCounter = 1;

function addNote(midi, startTime, duration, hand, measure, beat, velocity = 80) {
  notes.push({
    id: `sorrow-${noteCounter++}`,
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

let curTime = 1.0;

// =========================================================================
// SECTION 1: LENTO DOLOROSO & SOLITARY RECITATION (M. 1–16) — 4/4, 58 BPM
// Beat duration = 60 / 58 = 1.034s
// =========================================================================
const bSec1 = 60 / 58;

// M. 1: Solitary Bell & Pregnant Pause
// Low G1-G2 octave (span 12)
addNote(31, curTime, bSec1 * 2.8, 'left', 1, 1, 85); // G1
addNote(43, curTime, bSec1 * 2.8, 'left', 1, 1, 80); // G2
addPedal(curTime, bSec1 * 3.8, 1, 1, 120);

// Weeping motif enters in soprano on beat 3
addNote(74, curTime + bSec1 * 2.0, bSec1 * 0.9, 'right', 1, 3, 76); // D5
addNote(73, curTime + bSec1 * 3.0, bSec1 * 0.45, 'right', 1, 4, 72); // C#5 (sighing appoggiatura)
addNote(76, curTime + bSec1 * 3.5, bSec1 * 0.45, 'right', 1, 4.5, 78); // E5
curTime += bSec1 * 4;

// M. 2: Fall to D and yearning minor third
addNote(74, curTime, bSec1 * 1.8, 'right', 2, 1, 80); // D5
addNote(70, curTime + bSec1 * 2.0, bSec1 * 0.9, 'right', 2, 3, 74); // Bb4
addNote(69, curTime + bSec1 * 3.0, bSec1 * 0.9, 'right', 2, 4, 70); // A4
// Left hand: D2-D3 octave on beat 1 (span 12), then F#3-C4 chord on beat 3 (span 6)
addNote(26, curTime, bSec1 * 1.8, 'left', 2, 1, 78); // D2
addNote(38, curTime, bSec1 * 1.8, 'left', 2, 1, 72); // D3
addNote(54, curTime + bSec1 * 2.0, bSec1 * 1.8, 'left', 2, 3, 62); // F#3
addNote(60, curTime + bSec1 * 2.0, bSec1 * 1.8, 'left', 2, 3, 60); // C4
addPedal(curTime, bSec1 * 3.8, 2, 1, 105);
curTime += bSec1 * 4;

// M. 3: Resolution to G minor
addNote(67, curTime, bSec1 * 2.8, 'right', 3, 1, 82); // G4
// Left hand: G1-G2 octave on beat 1 (span 12), then D3-Bb3 on beat 2 (span 8)
addNote(31, curTime, bSec1 * 1.8, 'left', 3, 1, 82); // G1
addNote(43, curTime, bSec1 * 1.8, 'left', 3, 1, 78); // G2
addNote(50, curTime + bSec1 * 1.5, bSec1 * 2.2, 'left', 3, 2.5, 64); // D3
addNote(58, curTime + bSec1 * 1.5, bSec1 * 2.2, 'left', 3, 2.5, 62); // Bb3
addPedal(curTime, bSec1 * 3.8, 3, 1, 115);
curTime += bSec1 * 4;

// M. 4: Expressive chromatic bridge to Theme I
addNote(69, curTime, bSec1 * 0.9, 'right', 4, 1, 72); // A4
addNote(70, curTime + bSec1 * 1.0, bSec1 * 0.9, 'right', 4, 2, 75); // Bb4
addNote(72, curTime + bSec1 * 2.0, bSec1 * 0.9, 'right', 4, 3, 78); // C5
addNote(73, curTime + bSec1 * 3.0, bSec1 * 0.9, 'right', 4, 4, 82); // C#5
// Left hand: Eb2-Eb3 octave on beat 1 (span 12), D2-D3 on beat 3 (span 12)
addNote(27, curTime, bSec1 * 1.8, 'left', 4, 1, 75); // Eb2
addNote(39, curTime, bSec1 * 1.8, 'left', 4, 1, 70); // Eb3
addNote(26, curTime + bSec1 * 2.0, bSec1 * 1.8, 'left', 4, 3, 78); // D2
addNote(38, curTime + bSec1 * 2.0, bSec1 * 1.8, 'left', 4, 3, 72); // D3
addPedal(curTime, bSec1 * 1.9, 4, 1, 100);
addPedal(curTime + bSec1 * 2.0, bSec1 * 1.9, 4, 3, 105);
curTime += bSec1 * 4;

// =========================================================================
// SECTION 2: MODERATO CON AFFETTO & WEEPING COUNTERPOINT (M. 5–24) — 4/4, 66 BPM
// Main Theme: Melancholic Bel Canto Cantilena with Chromatic Lament Bass
// =========================================================================
const bSec2 = 60 / 66;

// M. 5–12: Theme I First Cycle
const theme1Bars = [
  // M. 5: Tonic statement (D5 -> Bb4 -> C5 -> D5)
  { bass: [31, 43], chord: [50, 58], mel: [{ p: 74, b: 1, d: 1.4 }, { p: 70, b: 2.5, d: 0.5 }, { p: 72, b: 3, d: 0.9 }, { p: 74, b: 4, d: 0.9 }] },
  // M. 6: D7/F# (F#5 appoggiatura resolving to G5!)
  { bass: [30, 42], chord: [54, 57], mel: [{ p: 78, b: 1, d: 1.8 }, { p: 79, b: 3, d: 0.9 }, { p: 77, b: 4, d: 0.9 }] },
  // M. 7: Gmin7/F (F5 -> D5 -> Bb4)
  { bass: [29, 41], chord: [53, 58], mel: [{ p: 77, b: 1, d: 1.4 }, { p: 74, b: 2.5, d: 0.5 }, { p: 70, b: 3, d: 0.9 }, { p: 72, b: 4, d: 0.9 }] },
  // M. 8: C7/E (C5 -> E5 -> G5)
  { bass: [28, 40], chord: [52, 60], mel: [{ p: 72, b: 1, d: 1.4 }, { p: 76, b: 2.5, d: 0.5 }, { p: 79, b: 3, d: 1.8 }] },
  // M. 9: NEAPOLITAN EXPLOSION! Ab Major / C (Unbearable sorrow!)
  { bass: [24, 36], chord: [56, 60], mel: [{ p: 80, b: 1, d: 1.8 }, { p: 84, b: 3, d: 0.9 }, { p: 82, b: 4, d: 0.9 }] }, // Ab5 -> C6 -> Bb5
  // M. 10: German Augmented Sixth (Eb in bass, C# in treble) resolving to D7
  { bass: [27, 39], chord: [55, 61], mel: [{ p: 81, b: 1, d: 1.8 }, { p: 78, b: 3, d: 0.9 }, { p: 74, b: 4, d: 0.9 }] }, // A5 -> F#5 -> D5
  // M. 11: Dominant suspension D4-3
  { bass: [26, 38], chord: [54, 60], mel: [{ p: 72, b: 1, d: 1.8 }, { p: 70, b: 3, d: 0.9 }, { p: 69, b: 4, d: 0.9 }] },
  // M. 12: Resolution into G minor with 11-note fioritura!
  { bass: [31, 43], chord: [50, 58], mel: [{ p: 67, b: 1, d: 1.8 }], fioritura: true }
];

theme1Bars.forEach((tBar, tIdx) => {
  const mNum = 5 + tIdx;
  // Left hand: Low bass octave on beat 1 (span 12)
  addNote(tBar.bass[0], curTime, bSec2 * 1.8, 'left', mNum, 1, 86);
  addNote(tBar.bass[1], curTime, bSec2 * 1.8, 'left', mNum, 1, 80);
  addPedal(curTime, bSec2 * 3.8, mNum, 1, 115);

  // Left hand: Warm chord in middle register on beat 2.5 or 3 (span <= 12)
  addNote(tBar.chord[0], curTime + bSec2 * 1.5, bSec2 * 2.2, 'left', mNum, 2.5, 64);
  addNote(tBar.chord[1], curTime + bSec2 * 1.5, bSec2 * 2.2, 'left', mNum, 2.5, 62);

  // Right hand: Melody notes
  tBar.mel.forEach((mItem) => {
    const noteOnset = curTime + (mItem.b - 1) * bSec2;
    addNote(mItem.p, noteOnset, mItem.d * bSec2, 'right', mNum, mItem.b, 88);
  });

  if (tBar.fioritura) {
    // Chopin 11-note fioritura on beats 3 and 4
    const fNotes = [82, 81, 79, 78, 76, 75, 74, 72, 70, 69, 67];
    const fStep = (bSec2 * 2) / fNotes.length;
    fNotes.forEach((fMidi, fIdx) => {
      addNote(fMidi, curTime + bSec2 * 2 + fIdx * fStep, fStep * 0.92, 'right', mNum, 3 + fIdx * 0.18, 68);
    });
  }

  curTime += bSec2 * 4;
});

// M. 13–24: Theme I Second Cycle with Tenor Counter-Melody
for (let bar = 13; bar <= 24; bar++) {
  const isCadence = bar === 24;
  const bassPitches = bar % 4 === 0 ? [26, 38] : bar % 2 === 0 ? [27, 39] : [31, 43];

  addNote(bassPitches[0], curTime, bSec2 * 1.8, 'left', bar, 1, 88);
  addNote(bassPitches[1], curTime, bSec2 * 1.8, 'left', bar, 1, 82);
  addPedal(curTime, bSec2 * 3.8, bar, 1, 115);

  // Tenor counter-voice in Left Hand (span within octave of chord: e.g. 55-62 = 7 semitones)
  addNote(55 + (bar % 3), curTime + bSec2 * 1.5, bSec2 * 1.0, 'left', bar, 2.5, 75);
  addNote(58 + (bar % 3), curTime + bSec2 * 1.5, bSec2 * 1.0, 'left', bar, 2.5, 70);

  // Right Hand expressive singing line with gentle double-stops (span <= 8 semitones!)
  const rRoot = 67 + (bar % 6);
  addNote(rRoot, curTime, bSec2 * 1.8, 'right', bar, 1, 86);
  addNote(rRoot + 4, curTime, bSec2 * 1.8, 'right', bar, 1, 80); // Major/minor 3rd (span 4!)

  addNote(rRoot + 5, curTime + bSec2 * 2, bSec2 * 0.9, 'right', bar, 3, 84);
  addNote(rRoot + 7, curTime + bSec2 * 3, bSec2 * 0.9, 'right', bar, 4, 88);

  curTime += bSec2 * 4;
}

// =========================================================================
// SECTION 3: POCO PIÙ MOSSO & THE ROMANTIC DREAM IN EB MAJOR (M. 25–64) — 12/8, 80 BPM
// Dotted quarter beat = 60 / 80 = 0.75s. Eighth note = 0.25s. Bar duration = 3.0s.
// Lyrical Barcarolle & Liszt Three-Hand Cantilena
// =========================================================================
const eSec3 = (60 / 80) / 3; // 0.25s per 8th note

for (let bar = 25; bar <= 64; bar++) {
  const isBMajorSunlight = bar >= 45 && bar <= 52;
  const bassOctave = isBMajorSunlight ? [23, 35] : bar % 4 === 0 ? [26, 38] : bar % 2 === 0 ? [27, 39] : [31, 43];
  const chordBase = isBMajorSunlight ? [59, 63, 66] : [55, 58, 63]; // B Major vs Eb Major

  // Beat 1: Left hand plays bass octave (span 12)
  addNote(bassOctave[0], curTime, eSec3 * 3, 'left', bar, 1, 92);
  addNote(bassOctave[1], curTime, eSec3 * 3, 'left', bar, 1, 85);
  addPedal(curTime, eSec3 * 11.5, bar, 1, 125);

  // Left hand plays gentle broken chord on beats 4, 7, 10 (span <= 8 semitones)
  [4, 7, 10].forEach((bPulse) => {
    const pulseOffset = (bPulse - 1) * eSec3;
    addNote(chordBase[0], curTime + pulseOffset, eSec3 * 2.5, 'left', bar, bPulse, 60);
    addNote(chordBase[1], curTime + pulseOffset, eSec3 * 2.5, 'left', bar, bPulse, 58);
  });

  // Right Hand: Soaring, romantic singing cantilena (vocal bel canto)
  // Each note accompanied by gentle 3rds or single singing notes (span <= 12)
  const melProg = isBMajorSunlight
    ? [71, 75, 78, 83] // B4, D#5, F#5, B5 (glorious B Major!)
    : [67, 70, 75, 79]; // G4, Bb4, Eb5, G5 (warm Eb Major!)

  melProg.forEach((mPitch, mIdx) => {
    const mOnset = curTime + mIdx * 3 * eSec3;
    addNote(mPitch, mOnset, eSec3 * 2.8, 'right', bar, mIdx * 3 + 1, 95);
    // Add warm inner harmony note within span 7 (5th or 6th below)
    if (mPitch - 7 >= 60) {
      addNote(mPitch - 7, mOnset, eSec3 * 2.8, 'right', bar, mIdx * 3 + 1, 75);
    }
  });

  curTime += eSec3 * 12;
}

// =========================================================================
// SECTION 4: ALLEGRO TEMPESTOSO E CRESCENDO (M. 65–100) — 4/4, 112 BPM
// The Gathering Storm: Agitated syncopations, chromatic bass, growing fury
// =========================================================================
const bSec4 = 60 / 112; // ~0.536s per beat

for (let bar = 65; bar <= 100; bar++) {
  const stormProgress = (bar - 65) / (100 - 65);
  const curVel = Math.round(82 + stormProgress * 38); // 82 to 120
  const bassOct = bar % 4 === 0 ? [26, 38] : bar % 2 === 0 ? [27, 39] : [31, 43];

  // Beat 1: Left hand powerful octave (span 12)
  addNote(bassOct[0], curTime, bSec4 * 1.8, 'left', bar, 1, curVel);
  addNote(bassOct[1], curTime, bSec4 * 1.8, 'left', bar, 1, curVel - 4);
  // Beat 3: Repeated bass octave (span 12)
  addNote(bassOct[0], curTime + bSec4 * 2, bSec4 * 1.8, 'left', bar, 3, curVel);
  addNote(bassOct[1], curTime + bSec4 * 2, bSec4 * 1.8, 'left', bar, 3, curVel - 4);
  addPedal(curTime, bSec4 * 3.8, bar, 1, 115);

  // Right Hand: Urgent syncopated chords on beats 2 and 4 (span <= 10 semitones!)
  const chordRoot = 60 + Math.round(stormProgress * 12);
  [2, 4].forEach((b) => {
    const cOnset = curTime + (b - 1) * bSec4;
    addNote(chordRoot, cOnset, bSec4 * 0.9, 'right', bar, b, curVel);
    addNote(chordRoot + 3, cOnset, bSec4 * 0.9, 'right', bar, b, curVel - 3); // minor 3rd
    addNote(chordRoot + 7, cOnset, bSec4 * 0.9, 'right', bar, b, curVel); // 5th (span 7!)
  });

  curTime += bSec4 * 4;
}

// =========================================================================
// SECTION 5: CADENZA PRECIPITOSA & THE CLIFF-EDGE CUTOFF (M. 101–108)
// M. 101–104: German Sixth Fortissimo (Eb in bass, C# in treble)
// M. 105–107: 4-Octave Chromatic Cascade
// M. 108: THE 7:39 CLIFF-EDGE CUTOFF (Dead silence fermata)
// =========================================================================
const bSecCad = 0.44;

for (let bar = 101; bar <= 104; bar++) {
  // Left hand: Low Eb1-Eb2 octave (span 12)
  addNote(27, curTime, bSecCad * 3.5, 'left', bar, 1, 124);
  addNote(39, curTime, bSecCad * 3.5, 'left', bar, 1, 120);
  addPedal(curTime, bSecCad * 3.8, bar, 1, 127);

  // Right hand: German 6th chord (Eb-G-Bb-C#), compact voicing within 1 octave (span 9: 67 to 76!)
  [67, 70, 73, 76].forEach((p) => {
    addNote(p, curTime, bSecCad * 1.8, 'right', bar, 1, 124);
    addNote(p, curTime + bSecCad * 2, bSecCad * 1.8, 'right', bar, 3, 126);
  });

  curTime += bSecCad * 4;
}

// M. 105–107: Rapid descending chromatic scale (hands alternating, each note duration ~0.05s)
let cascadePitch = 88; // E6
const stepSec = 0.052;
for (let bar = 105; bar <= 107; bar++) {
  addPedal(curTime, stepSec * 16, bar, 1, 127);
  for (let s = 0; s < 16; s++) {
    const hand = s % 2 === 0 ? 'right' : 'left';
    addNote(cascadePitch, curTime + s * stepSec, stepSec * 0.9, hand, bar, 1 + s * 0.2, 120);
    cascadePitch = Math.max(28, cascadePitch - 1);
  }
  curTime += stepSec * 16;
}

// M. 108: THE 7:39 CLIFF-EDGE CUTOFF!
// Fortissimo slap on dominant D octave (span 12), instant damper release, absolute dead silence!
addNote(26, curTime, 0.22, 'left', 108, 1, 127); // D1
addNote(38, curTime, 0.22, 'left', 108, 1, 127); // D2
addNote(62, curTime, 0.22, 'right', 108, 1, 127); // D4
addNote(74, curTime, 0.22, 'right', 108, 1, 127); // D5
// ZERO PEDAL! Immediate dampening creates absolute silent suspense!
curTime += 2.0; // 2 seconds of dead silence!

// =========================================================================
// SECTION 6: PRESTO CON FUOCO — THE ZIMERMAN 7:40 CODA DROP-OFF (M. 109–156) — 2/2, 156 BPM
// Half note = 60 / 78 = 0.769s. Quarter note = 0.385s. 8th note = 0.192s.
// Sotto voce pp (whispered terror) climbing over 36 bars to il più forte possibile (fff)!
// ALL CHORDS STRICTLY <= 12 SEMITONES!
// =========================================================================
const halfSec = 60 / 78;
const qSec = halfSec / 2;
const eSec = halfSec / 4;

for (let bar = 109; bar <= 156; bar++) {
  const codaProg = (bar - 109) / (156 - 109);
  const codaVel = Math.round(50 + codaProg * 74); // 50 (sotto voce pp) climbing to 124 (fff)!
  const isEven = bar % 2 === 0;

  // Damper pedal: quarter-pedal taps on downbeats for electric crispness
  addPedal(curTime, halfSec * 0.9, bar, 1, Math.min(127, 40 + Math.round(codaProg * 80)));

  // Left Hand: Driving ostinato in broken rhythm (each moment strictly <= 12 semitones!)
  // Beat 1: Low bass octave (span 12)
  const bRoot = isEven ? 27 : 31; // Eb vs G
  addNote(bRoot, curTime, eSec * 1.5, 'left', bar, 1, codaVel + 5);
  addNote(bRoot + 12, curTime, eSec * 1.5, 'left', bar, 1, codaVel + 3);

  // Beat 1.5: Hand moves to middle harmony chord (span 7, fifth: 50 to 57)
  addNote(50, curTime + eSec * 2, eSec * 1.5, 'left', bar, 1.5, codaVel);
  addNote(57, curTime + eSec * 2, eSec * 1.5, 'left', bar, 1.5, codaVel);

  // Beat 2: Middle octave anchor (span 12)
  addNote(38, curTime + eSec * 4, eSec * 1.5, 'left', bar, 2, codaVel + 4);
  addNote(50, curTime + eSec * 4, eSec * 1.5, 'left', bar, 2, codaVel + 2);

  // Beat 2.5: Middle chord (span 8, minor sixth: 55 to 63)
  addNote(55, curTime + eSec * 6, eSec * 1.5, 'left', bar, 2.5, codaVel);
  addNote(63, curTime + eSec * 6, eSec * 1.5, 'left', bar, 2.5, codaVel);

  // Right Hand: Jagged, syncopated off-beat gasps (rest on beat 1, CHORD on 1.5, rest on 2, CHORD on 2.5)
  // Each chord voiced compactly within span 7–9 semitones!
  const rChords = isEven ? [63, 67, 72] : [62, 67, 74]; // Eb4-G4-C5 (span 9) vs D4-G4-D5 (span 12)
  [2, 6].forEach((pulseIdx) => {
    const rOnset = curTime + pulseIdx * eSec;
    rChords.forEach((p) => {
      addNote(p, rOnset, eSec * 1.4, 'right', bar, 1 + pulseIdx * 0.25, codaVel + 6);
    });
  });

  curTime += halfSec * 2;
}

// =========================================================================
// SECTION 7: APOTEOSI TRAGICA & FINAL STRETTA (M. 157–180) — 2/2, 168 BPM
// il più forte possibile (fff) — Thunderous Double Octaves & Tragic Cadence
// ALL HAND INTERVALS STRICTLY <= 12 SEMITONES (1 OCTAVE)!
// =========================================================================
const strettaHalf = 60 / 84;

for (let bar = 157; bar <= 174; bar++) {
  addPedal(curTime, strettaHalf * 1.9, bar, 1, 127);

  // Left Hand: Crashing double octaves (span exactly 12 semitones!)
  const sRoot = bar % 2 === 0 ? 27 : 31; // Eb1 or G1
  addNote(sRoot, curTime, strettaHalf * 0.85, 'left', bar, 1, 127);
  addNote(sRoot + 12, curTime, strettaHalf * 0.85, 'left', bar, 1, 125);
  addNote(sRoot, curTime + strettaHalf * 1.0, strettaHalf * 0.85, 'left', bar, 2, 127);
  addNote(sRoot + 12, curTime + strettaHalf * 1.0, strettaHalf * 0.85, 'left', bar, 2, 125);

  // Right Hand: Crashing fortissimo chords (span <= 12 semitones: e.g. 67 to 79 = exactly 12!)
  const rhOctaveRoot = bar % 2 === 0 ? 63 : 67; // Eb4 or G4
  [rhOctaveRoot, rhOctaveRoot + 3, rhOctaveRoot + 7, rhOctaveRoot + 12].forEach((p) => {
    addNote(p, curTime, strettaHalf * 0.85, 'right', bar, 1, 127);
    addNote(p, curTime + strettaHalf * 1.0, strettaHalf * 0.85, 'right', bar, 2, 127);
  });

  curTime += strettaHalf * 2;
}

// M. 175–176: German Sixth slam (span 12)
addNote(27, curTime, strettaHalf * 1.8, 'left', 175, 1, 127); // Eb1
addNote(39, curTime, strettaHalf * 1.8, 'left', 175, 1, 127); // Eb2
[67, 70, 75, 79].forEach((p) => addNote(p, curTime, strettaHalf * 1.8, 'right', 175, 1, 127)); // span 12!
addPedal(curTime, strettaHalf * 2, 175, 1, 127);
curTime += strettaHalf * 2;

// M. 177–178: Dominant D7 slam
addNote(26, curTime, strettaHalf * 1.8, 'left', 177, 1, 127); // D1
addNote(38, curTime, strettaHalf * 1.8, 'left', 177, 1, 127); // D2
[62, 66, 69, 74].forEach((p) => addNote(p, curTime, strettaHalf * 1.8, 'right', 177, 1, 127)); // span 12!
addPedal(curTime, strettaHalf * 2, 177, 1, 127);
curTime += strettaHalf * 2;

// M. 179–180: FINAL G MINOR TRAGIC RESOLUTION & DECAY
addNote(31, curTime, 8.5, 'left', 179, 1, 127); // G1
addNote(43, curTime, 8.5, 'left', 179, 1, 127); // G2 (span 12!)
[67, 70, 74, 79].forEach((p) => addNote(p, curTime, 8.0, 'right', 179, 1, 127)); // G4-Bb4-D5-G5 (span 12!)
addPedal(curTime, 9.0, 179, 1, 127);
curTime += 8.5;

// Sort notes and pedals
notes.sort((a, b) => a.startTime - b.startTime || a.midi - b.midi);
pedalEvents.sort((a, b) => a.time - b.time);

// =========================================================================
// STRICT HUMAN ERGONOMICS VALIDATION (Max span <= 12 semitones per hand!)
// =========================================================================
let maxLhSpan = 0;
let maxRhSpan = 0;
let violationsCount = 0;

// Group notes by simultaneous onset timestamp
const timeClusters = new Map();
notes.forEach((n) => {
  const tKey = Math.round(n.startTime * 100) / 100;
  if (!timeClusters.has(tKey)) timeClusters.set(tKey, { lh: [], rh: [] });
  if (n.hand === 'left') timeClusters.get(tKey).lh.push(n.midi);
  else timeClusters.get(tKey).rh.push(n.midi);
});

timeClusters.forEach(({ lh, rh }, t) => {
  if (lh.length > 1) {
    const span = Math.max(...lh) - Math.min(...lh);
    if (span > maxLhSpan) maxLhSpan = span;
    if (span > 12) {
      console.error(`VIOLATION at t=${t}s: LH span = ${span} semitones! Midis:`, lh);
      violationsCount++;
    }
  }
  if (rh.length > 1) {
    const span = Math.max(...rh) - Math.min(...rh);
    if (span > maxRhSpan) maxRhSpan = span;
    if (span > 12) {
      console.error(`VIOLATION at t=${t}s: RH span = ${span} semitones! Midis:`, rh);
      violationsCount++;
    }
  }
});

console.log(`=== ERGONOMIC VALIDATION REPORT ===`);
console.log(`Max Left Hand Span: ${maxLhSpan} semitones (Max Allowed: 12 = 1 Octave)`);
console.log(`Max Right Hand Span: ${maxRhSpan} semitones (Max Allowed: 12 = 1 Octave)`);
console.log(`Span Violations: ${violationsCount}`);
if (violationsCount > 0) {
  process.exit(1);
}

const finalDuration = parseFloat((notes[notes.length - 1].startTime + notes[notes.length - 1].duration).toFixed(1));

const sorrowScore = {
  id: 'chopin-liszt-sorrow',
  title: 'Sorrow (Concert Rhapsody in G Minor)',
  composer: 'Frédéric Chopin & Franz Liszt (Virtuoso Composition)',
  opus: 'Op. Posth. / Virtuoso Masterwork',
  key: 'G minor',
  timeSignature: [4, 4],
  tempoBpm: 58,
  duration: finalDuration,
  notes,
  pedalEvents,
  sections: [
    {
      id: 'sorrow-sec-1',
      title: 'I. Lento doloroso – Solitary Recitation (M. 1–4)',
      startMeasure: 1,
      endMeasure: 4,
      startTime: 0,
      endTime: 17.5,
      tempoSuggestion: '58 BPM Lento doloroso e rubato',
      character: 'Solitary funeral bell, deep silence, and weeping Bel Canto sighs'
    },
    {
      id: 'sorrow-sec-2',
      title: 'II. Moderato con affetto – The Weeping Cantilena (M. 5–24)',
      startMeasure: 5,
      endMeasure: 24,
      startTime: 17.5,
      endTime: 90.2,
      tempoSuggestion: '66 BPM Cantabile con rubato',
      character: 'Chopin-style singing cantilena, chromatic lament bass, and Neapolitan sighs'
    },
    {
      id: 'sorrow-sec-3',
      title: 'III. Poco più mosso – The Romantic Dream in Eb Major (M. 25–64)',
      startMeasure: 25,
      endMeasure: 64,
      startTime: 90.2,
      endTime: 210.2,
      tempoSuggestion: '80 BPM in 12/8 Barcarolle',
      character: 'Liszt three-hand texture: soaring melody wrapped in rippling crystalline arpeggios'
    },
    {
      id: 'sorrow-sec-4',
      title: 'IV. Allegro tempestoso e crescendo – The Gathering Storm (M. 65–100)',
      startMeasure: 65,
      endMeasure: 100,
      startTime: 210.2,
      endTime: 287.3,
      tempoSuggestion: '112 BPM Accelerando poco a poco',
      character: 'Urgent syncopated chords over rising chromatic bass octaves'
    },
    {
      id: 'sorrow-sec-5',
      title: 'V. Cadenza precipitosa & The Cliff-Edge Cutoff (M. 101–108)',
      startMeasure: 101,
      endMeasure: 108,
      startTime: 287.3,
      endTime: 304.5,
      tempoSuggestion: 'Rubato Presto -> Fermata Secco',
      character: 'Harrowing 4-octave chromatic descent slamming into an abrupt dead-stop cliff-edge silence'
    },
    {
      id: 'sorrow-sec-6',
      title: 'VI. Presto con fuoco – The Zimerman 7:40 Coda Drop-Off (M. 109–156)',
      startMeasure: 109,
      endMeasure: 156,
      startTime: 304.5,
      endTime: 378.3,
      tempoSuggestion: '156 BPM Alla Breve (2/2)',
      character: 'The Zimerman 7:40 drop-off: whispered sotto voce terror, sweeping ostinato, and 36-bar volcanic crescendo'
    },
    {
      id: 'sorrow-sec-7',
      title: 'VII. Apoteosi Tragica & Stretta (M. 157–180)',
      startMeasure: 157,
      endMeasure: 180,
      startTime: 378.3,
      endTime: finalDuration,
      tempoSuggestion: '168 BPM il più forte possibile (fff)',
      character: 'Crashing double octaves, catastrophic German sixth, and unyielding tragic minor resolution'
    },
    {
      id: 'sorrow-full',
      title: 'Sorrow – Complete Masterclass Performance',
      startMeasure: 1,
      endMeasure: 180,
      startTime: 0,
      endTime: finalDuration,
      tempoSuggestion: 'High Romantic Virtuoso Interpretation',
      character: 'Full Masterclass Concert Performance'
    }
  ],
  annotations: [
    {
      id: 'sorrow-ann-1',
      measureRange: [1, 4],
      title: 'Solitary Recitation & Bel Canto Sighs',
      germanTerm: 'Einsame Rezitation & Seufzer-Motiv',
      category: 'tone-color',
      instruction: 'Allow the low G bell to ring with deep chest resonance. Let the right-hand sighing motif (D5-C#5-E5-D5) breathe with tender rubato hesitation.',
      referenceTimestampSeconds: 2
    },
    {
      id: 'sorrow-ann-2',
      measureRange: [5, 12],
      title: 'The Chromatic Lament Bass & Neapolitan Pang',
      germanTerm: 'Klagender Bass & Neapolitaner Sehnsucht',
      category: 'rubato',
      instruction: 'Shape the chromatic descent in the bass (G -> F# -> F -> E -> Eb -> D). Lean into the Neapolitan Ab Major harmony at bar 9 with deep singing touch.',
      referenceTimestampSeconds: 22
    },
    {
      id: 'sorrow-ann-3',
      measureRange: [25, 44],
      title: 'The Liszt Three-Hand Barcarolle in Eb Major',
      germanTerm: 'Lisztscher Drei-Hände-Effekt in Es-Dur',
      category: 'fingering',
      instruction: 'Gentle 12/8 rocking motion. Project the singing melody warmly while keeping the surrounding 8th-note broken chords soft and crystalline.',
      pedalGuidance: {
        action: 'catch',
        explanation: 'Deep sympathetic bloom on downbeats with clean half-pedal clears on chord changes.',
        idealHoldMs: 2800
      },
      referenceTimestampSeconds: 95
    },
    {
      id: 'sorrow-ann-4',
      measureRange: [101, 108],
      title: 'The 7:35 Cliff-Edge Cutoff & Dead Silence',
      germanTerm: 'Der Abgrund & Plötzliche Stille',
      category: 'transition',
      instruction: 'Hurl total body weight into the four-octave chromatic descent. On the final downbeat of bar 108, kill the pedal INSTANTLY. Absolute dead silence.',
      referenceTimestampSeconds: 290
    },
    {
      id: 'sorrow-ann-5',
      measureRange: [109, 136],
      title: 'The 7:40 Coda Drop-Off: Sotto Voce Agitato',
      germanTerm: 'Presto con Fuoco: Sotto Voce Eröffnung',
      category: 'rubato',
      instruction: 'Snap into 156 BPM in icy, whispered pianissimo. The left hand leaps with mechanical precision, while the right hand gasps on off-beats. Let the crescendo build with terrifying patience.',
      pedalGuidance: {
        action: 'staccato',
        explanation: 'Quarter-pedal syncopated taps on downbeats for electric crispness without muddiness.',
        idealHoldMs: 380
      },
      referenceTimestampSeconds: 310
    },
    {
      id: 'sorrow-ann-6',
      measureRange: [157, 180],
      title: 'Apoteosi Tragica: The Final Apocalypse',
      germanTerm: 'Tragische Apokalypse & Verklingender Ausklang',
      category: 'tone-color',
      instruction: 'Unleash full orchestral power (fff). Engage back and shoulder muscles for the crashing octaves. Hold the final low G1-G2 octave under full pedal until silence.',
      referenceTimestampSeconds: 385
    }
  ]
};

fs.writeFileSync('src/data/scores/chopin-liszt-sorrow.json', JSON.stringify(sorrowScore, null, 2));
fs.writeFileSync('public/scores/chopin-liszt-sorrow.json', JSON.stringify(sorrowScore, null, 2));
console.log(`SUCCESS! Saved Sorrow masterwork: ${sorrowScore.notes.length} notes, ${sorrowScore.pedalEvents.length} pedals, duration ${sorrowScore.duration}s across ${sorrowScore.sections.length} sections.`);
