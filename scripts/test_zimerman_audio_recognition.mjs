import fs from 'fs';

// Load our canonical score
const score = JSON.parse(fs.readFileSync('public/scores/chopin-ballade-1.json', 'utf8'));
console.log(`Loaded canonical score: ${score.title} (${score.notes.length} total notes)`);

// Load raw float32 PCM audio (44.1 kHz mono)
const pcmBuffer = fs.readFileSync('scripts/zimerman_intro.pcm');
const sampleRate = 44100;
const floatSamples = new Float32Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.byteLength / 4);
console.log(`Loaded PCM audio: ${floatSamples.length} samples (${(floatSamples.length / sampleRate).toFixed(2)} seconds)`);

// Implementation of McLeod Pitch Method (NSDF) from AcousticNoteRecognizer.ts
function nsdfPitchDetection(buffer, sampleRate) {
  const size = buffer.length;
  // Calculate RMS
  let sumSq = 0;
  for (let i = 0; i < size; i++) sumSq += buffer[i] * buffer[i];
  const rms = Math.sqrt(sumSq / size);
  if (rms < 0.01) return null; // Silence / ambient noise

  const maxShift = Math.floor(sampleRate / 27.5); // A0 = 27.5 Hz (~1603 samples)
  const minShift = Math.floor(sampleRate / 4186); // C8 = 4186 Hz (~10 samples)
  const nsdf = new Float32Array(maxShift);

  for (let tau = 0; tau < maxShift; tau++) {
    let acf = 0;
    let divisor = 0;
    for (let i = 0; i < size - tau; i++) {
      acf += buffer[i] * buffer[i + tau];
      divisor += buffer[i] * buffer[i] + buffer[i + tau] * buffer[i + tau];
    }
    nsdf[tau] = divisor > 0.00001 ? (2 * acf) / divisor : 0;
  }

  // Find highest peak with parabolic interpolation
  let maxPeakVal = -1;
  let bestTau = -1;
  let inPositive = false;

  for (let tau = minShift; tau < maxShift - 1; tau++) {
    if (nsdf[tau] > 0 && nsdf[tau] > nsdf[tau - 1] && nsdf[tau] >= nsdf[tau + 1]) {
      if (nsdf[tau] > 0.45 && nsdf[tau] > maxPeakVal) {
        maxPeakVal = nsdf[tau];
        // Parabolic interpolation
        const y1 = nsdf[tau - 1];
        const y2 = nsdf[tau];
        const y3 = nsdf[tau + 1];
        const delta = (y3 - y1) / (2 * (2 * y2 - y1 - y3));
        bestTau = tau + delta;
      }
    }
  }

  if (bestTau > 0 && maxPeakVal > 0.5) {
    const freq = sampleRate / bestTau;
    const midi = Math.round(12 * Math.log2(freq / 440) + 69);
    return { freq, midi, clarity: maxPeakVal };
  }
  return null;
}

// Map MIDI note to standard note name
function midiToName(m) {
  const names = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const name = names[m % 12];
  const oct = Math.floor(m / 12) - 1;
  return `${name}${oct}`;
}

// Slice audio into 2048-sample analysis frames (~46ms per window, step 1024 ~23ms)
const windowSize = 4096;
const stepSize = 1024;
const detectedNotes = [];

let currentNote = null;
let noteStart = 0;

for (let offset = 0; offset + windowSize < floatSamples.length; offset += stepSize) {
  const time = offset / sampleRate;
  const frame = floatSamples.subarray(offset, offset + windowSize);
  const detected = nsdfPitchDetection(frame, sampleRate);

  if (detected && detected.midi >= 21 && detected.midi <= 108) {
    if (!currentNote || currentNote.midi !== detected.midi) {
      if (currentNote && (time - noteStart) > 0.1) {
        detectedNotes.push({ ...currentNote, duration: time - noteStart });
      }
      currentNote = { midi: detected.midi, name: midiToName(detected.midi), startTime: time };
      noteStart = time;
    }
  } else {
    if (currentNote && (time - noteStart) > 0.1) {
      detectedNotes.push({ ...currentNote, duration: time - noteStart });
      currentNote = null;
    }
  }
}
if (currentNote && (floatSamples.length / sampleRate - noteStart) > 0.1) {
  detectedNotes.push({ ...currentNote, duration: floatSamples.length / sampleRate - noteStart });
}

console.log(`\n=== Pitch Detection on Zimerman's Intro Performance (0 to 30s) ===`);
console.log(`Detected ${detectedNotes.length} sustained note events:\n`);
detectedNotes.forEach((n, idx) => {
  console.log(`  #${idx + 1}: ${n.name.padEnd(5)} (MIDI ${n.midi}) at ${n.startTime.toFixed(2)}s for ${n.duration.toFixed(2)}s`);
});

// Compare against our Canonical Score intro notes (Largo mm. 1-7)
const introNotes = score.notes.filter(n => n.measure <= 7);
console.log(`\n=== Canonical Score Largo Notes (Measures 1-7) ===`);
console.log(`Total canonical notes in Largo: ${introNotes.length}`);

// Group by beat / chord in canonical score
const chords = [];
introNotes.forEach(n => {
  let existing = chords.find(c => Math.abs(c.startTime - n.startTime) < 0.05);
  if (!existing) {
    existing = { measure: n.measure, beat: n.beat, startTime: n.startTime, notes: [] };
    chords.push(existing);
  }
  existing.notes.push(n);
});

console.log('\nCanonical Largo Note Progression:');
chords.forEach(c => {
  const noteList = c.notes.map(n => `${n.noteName}(${n.midi})`).join(' + ');
  console.log(`  Measure ${c.measure} beat ${c.beat}: ${noteList}`);
});
