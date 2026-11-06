import fs from 'fs';
import pkg from '@tonejs/midi';
const { Midi } = pkg;

const PITCH_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
function midiToNoteName(midi) {
  const pitch = PITCH_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return pitch + octave;
}

const SONGS = [
  {
    id: 'river-flows-in-you',
    title: 'River Flows in You',
    composer: 'Yiruma',
    opus: '2001 (First Love)',
    difficulty: 3,
    key: 'A Major',
    period: 'Contemporary / Neoclassical',
    coverColor: 'from-sky-500 via-indigo-900 to-zinc-950',
    filePath: 'C:/Users/Kxwie/Downloads/Yiruma - River Flows in You.mid',
    description: 'Iconic, emotional flowing ballad with gentle rubato arpeggios and lyrical cantabile melody.'
  },
  {
    id: 'liszt-la-campanella',
    title: 'La Campanella',
    composer: 'Franz Liszt',
    opus: 'S. 141 No. 3 (1851)',
    difficulty: 5,
    key: 'G# minor',
    period: 'Romantic Virtuoso',
    coverColor: 'from-amber-500 via-orange-950 to-zinc-950',
    filePath: 'C:/Users/Kxwie/Downloads/Liszt - La Campanella.mid',
    description: 'Legendary virtuoso bravura showpiece with lightning-fast right hand bell leaps and sparkling trills.'
  },
  {
    id: 'kensuke-ushio-in-the-sea',
    title: 'In the Sea (Chainsaw Man)',
    composer: 'Kensuke Ushio (Arr. Henry Garcia)',
    opus: '2022 (Chainsaw Man OST)',
    difficulty: 2,
    key: 'A minor',
    period: 'Anime / Soundtrack',
    coverColor: 'from-blue-600 via-slate-900 to-zinc-950',
    filePath: 'C:/Users/Kxwie/Downloads/Kensuke Ushio _ arr. Henry Garcia - In the Sea.mid',
    description: 'Atmospheric, haunting minimalist piano theme evoking deep ocean solitude and emotional stillness.'
  },
  {
    id: 'hikaru-nara',
    title: 'Hikaru Nara (Your Lie in April)',
    composer: 'Goose house',
    opus: '2014 (Shigatsu wa Kimi no Uso)',
    difficulty: 4,
    key: 'Eb Major',
    period: 'Anime / J-Pop',
    coverColor: 'from-pink-500 via-rose-950 to-zinc-950',
    filePath: 'C:/Users/Kxwie/Downloads/Hikaru Nara.mid',
    description: 'Exuberant, passionate theme song of Your Lie in April arranged into a spirited, virtuosic piano duet.'
  },
  {
    id: 'chopin-nocturne-c-sharp-minor',
    title: 'Nocturne in C-sharp minor',
    composer: 'Frédéric Chopin',
    opus: 'Op. posth., B. 49 (1830)',
    difficulty: 4,
    key: 'C# minor',
    period: 'Romantic',
    coverColor: 'from-violet-600 via-purple-950 to-zinc-950',
    filePath: 'C:/Users/Kxwie/Downloads/Chopin - Nocturne No 20 in C sharp minor.mid',
    description: 'Intensely poignant masterpiece with flowing broken-chord accompaniment and famous 35-note downward arabesque.'
  },
  {
    id: 'joe-hisaishi-one-summers-day',
    title: "One Summer's Day (Spirited Away)",
    composer: 'Joe Hisaishi (Arr. Tuan-Anh Le)',
    opus: '2001 (Studio Ghibli)',
    difficulty: 3,
    key: 'C Major',
    period: 'Film Soundtrack',
    coverColor: 'from-emerald-500 via-teal-950 to-zinc-950',
    filePath: 'C:/Users/Kxwie/Downloads/Music by Joe Hisaishi_Arranged by Tuan-Anh Trung Le - One Summer Day.mid',
    description: 'Nostalgic, timeless Ghibli masterpiece opening with reflective suspended chords before blossoming into warmth.'
  },
  {
    id: 'joe-hisaishi-merry-go-round',
    title: 'Merry-Go-Round of Life',
    composer: 'Joe Hisaishi',
    opus: '2004 (Howl\'s Moving Castle)',
    difficulty: 4,
    key: 'G minor',
    period: 'Film Soundtrack',
    coverColor: 'from-amber-600 via-yellow-950 to-zinc-950',
    filePath: 'C:/Users/Kxwie/Downloads/Composed by Joe Hisaishi. - Merry go Round of Life.mid',
    description: 'Swirling Viennese waltz theme with dramatic dynamic arches, spirited rubato, and lush orchestral chords.'
  },
  {
    id: 'dj-okawari-flower-dance',
    title: 'Flower Dance',
    composer: 'DJ Okawari',
    opus: '2010 (A Cup of Coffee)',
    difficulty: 4,
    key: 'G minor',
    period: 'Contemporary / Melodic',
    coverColor: 'from-fuchsia-500 via-pink-950 to-zinc-950',
    filePath: 'C:/Users/Kxwie/Downloads/DJ Okawari - Flower Dance.mid',
    description: 'Electrifying, driving contemporary piano masterpiece with relentless running semiquaver arpeggios.'
  }
];

function processSong(meta) {
  console.log(`Processing ${meta.title} from ${meta.filePath}...`);
  const buf = fs.readFileSync(meta.filePath);
  const midi = new Midi(buf);

  const bpm = midi.header.tempos.length > 0 ? Math.round(midi.header.tempos[0].bpm) : 100;
  const ppq = midi.header.ppq || 384;
  const timeSigs = midi.header.timeSignatures?.length > 0
    ? midi.header.timeSignatures
    : [{ ticks: 0, timeSignature: [4, 4], measures: 0 }];

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
  const pedalEvents = [];
  let noteCounter = 1;

  midi.tracks.forEach((track, trackIdx) => {
    const trackName = (track.name || '').toLowerCase();
    let defaultHand = trackIdx === 0 ? 'right' : 'left';
    if (trackName.includes('left') || trackName.includes('lh') || trackName.includes('bass')) {
      defaultHand = 'left';
    } else if (trackName.includes('right') || trackName.includes('rh') || trackName.includes('treble')) {
      defaultHand = 'right';
    }

    track.notes.forEach((n) => {
      // Smart hand assignment: if single track, split at Middle C (60)
      const hand = midi.tracks.length === 1 ? (n.midi < 60 ? 'left' : 'right') : defaultHand;
      const mb = getMeasureAndBeat(n.ticks);

      notes.push({
        id: `${meta.id}-${noteCounter++}`,
        midi: n.midi,
        noteName: midiToNoteName(n.midi),
        startTime: parseFloat(n.time.toFixed(3)),
        duration: Math.max(0.08, parseFloat(n.duration.toFixed(3))),
        hand,
        measure: mb.measure,
        beat: mb.beat,
        velocity: Math.max(45, Math.min(120, Math.round(n.velocity * 127))),
      });
    });

    const cc64List = track.controlChanges?.[64] || [];
    cc64List.forEach((cc) => {
      if (cc.value > 0.3) {
        const mb = getMeasureAndBeat(cc.ticks);
        pedalEvents.push({
          startTime: parseFloat(cc.time.toFixed(3)),
          duration: 1.8,
          depth: Math.round(cc.value * 127),
          type: cc.value > 0.7 ? 'sustain' : 'half',
          measure: mb.measure,
        });
      }
    });
  });

  notes.sort((a, b) => a.startTime - b.startTime);
  const duration = notes.length > 0 ? parseFloat((notes[notes.length - 1].startTime + notes[notes.length - 1].duration + 1.2).toFixed(2)) : 60;
  const maxMeasure = notes.length > 0 ? Math.max(...notes.map((n) => n.measure)) : 1;

  // Build natural practice sections (3 to 6 sections)
  const sections = [];
  const sectionCount = Math.max(2, Math.min(6, Math.ceil(maxMeasure / 16)));
  const measuresPerSection = Math.ceil(maxMeasure / sectionCount);

  for (let sIdx = 0; sIdx < sectionCount; sIdx++) {
    const startM = sIdx * measuresPerSection + 1;
    const endM = Math.min(maxMeasure, (sIdx + 1) * measuresPerSection);
    const secNotes = notes.filter((n) => n.measure >= startM && n.measure <= endM);
    const startTime = secNotes[0]?.startTime || 0;
    const endTime = secNotes.length > 0 ? secNotes[secNotes.length - 1].startTime + 2.0 : duration;

    const titles = ['Intro & Main Theme', 'Exposition & First Development', 'Secondary Theme & Arpeggios', 'Grand Climax & Virtuoso Passage', 'Recapitulation & Coda'];
    const characters = ['Lyrical & Expressive', 'Flowing Motion', 'Deep Emotional Resonance', 'Passionate & Dynamic', 'Gentle Resolution'];

    sections.push({
      id: `${meta.id}-sec-${sIdx + 1}`,
      title: sIdx < titles.length ? `${titles[sIdx]} (M. ${startM}–${endM})` : `Section ${sIdx + 1} (M. ${startM}–${endM})`,
      startMeasure: startM,
      endMeasure: endM,
      startTime: parseFloat(startTime.toFixed(2)),
      endTime: parseFloat(endTime.toFixed(2)),
      tempoSuggestion: `${bpm} BPM`,
      character: sIdx < characters.length ? characters[sIdx] : 'Masterclass Repertoire',
    });
  }

  // Full piece overview section
  sections.push({
    id: `${meta.id}-full`,
    title: 'Complete Master Concert Arrangement',
    startMeasure: 1,
    endMeasure: maxMeasure,
    startTime: 0,
    endTime: duration,
    tempoSuggestion: `${bpm} BPM`,
    character: 'Full Performance',
  });

  const pieceData = {
    id: meta.id,
    title: meta.title,
    composer: meta.composer,
    key: meta.key,
    timeSignature: [4, 4],
    tempoBpm: bpm,
    duration,
    durationSeconds: Math.round(duration),
    notes,
    pedalEvents,
    annotations: [],
    sections,
  };

  // Write to both public/scores and src/data/scores
  const publicPath = `public/scores/${meta.id}.json`;
  const srcPath = `src/data/scores/${meta.id}.json`;

  fs.writeFileSync(publicPath, JSON.stringify(pieceData, null, 2), 'utf8');
  fs.writeFileSync(srcPath, JSON.stringify(pieceData, null, 2), 'utf8');
  console.log(`[DONE] ${meta.title}: ${notes.length} notes, ${maxMeasure} measures, duration: ${duration}s.`);
}

SONGS.forEach(processSong);
console.log('All 8 songs successfully processed and bundled!');
