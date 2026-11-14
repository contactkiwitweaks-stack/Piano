import fs from 'fs';
import pkg from '@tonejs/midi';
const { Midi } = pkg;

const PITCH_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
function midiToNoteName(midi) {
  const pitch = PITCH_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return pitch + octave;
}

function convertMidiToScore(midiPath, meta) {
  const buf = fs.readFileSync(midiPath);
  const midi = new Midi(buf);
  const ppq = midi.header.ppq || 480;
  const timeSigs = midi.header.timeSignatures?.length > 0
    ? midi.header.timeSignatures
    : [{ ticks: 0, timeSignature: meta.defaultTimeSig || [4, 4], measures: 0 }];

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
    let beat = parseFloat((ticksInMeasure / ticksPerBeat + 1).toFixed(2));
    if (beat > numBeats + 0.99) beat = numBeats + 0.99;

    return {
      measure: baseMeasure + measureInSig,
      beat,
    };
  }

  const notes = [];
  let noteCounter = 1;

  midi.tracks.forEach((track, trackIdx) => {
    const isRight = trackIdx === 0;
    const hand = isRight ? 'right' : 'left';

    track.notes.forEach((n) => {
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
        velocity: Math.max(40, Math.min(127, Math.round(n.velocity * 127))),
      });
    });
  });

  notes.sort((a, b) => a.startTime - b.startTime || a.midi - b.midi);

  const pedalEvents = [];
  const pedalTrack = midi.tracks.find(t => t.controlChanges?.[64]?.length > 0);
  if (pedalTrack) {
    const cc64List = pedalTrack.controlChanges[64];
    for (let i = 0; i < cc64List.length; i++) {
      const cc = cc64List[i];
      if (cc.value > 0.4) {
        let releaseTime = cc.time + 1.8;
        for (let j = i + 1; j < cc64List.length; j++) {
          if (cc64List[j].value <= 0.4) {
            releaseTime = cc64List[j].time;
            break;
          }
        }
        const mb = getMeasureAndBeat(cc.ticks);
        pedalEvents.push({
          time: parseFloat(cc.time.toFixed(3)),
          duration: parseFloat(Math.max(0.2, releaseTime - cc.time).toFixed(3)),
          type: 'sustain',
          measure: mb.measure,
          beat: mb.beat,
        });
        while (i + 1 < cc64List.length && cc64List[i + 1].time < releaseTime) {
          i++;
        }
      }
    }
  }

  const duration = notes.length > 0
    ? parseFloat((notes[notes.length - 1].startTime + notes[notes.length - 1].duration).toFixed(1))
    : 0;

  return {
    id: meta.id,
    title: meta.title,
    composer: meta.composer,
    opus: meta.opus,
    key: meta.key,
    timeSignature: meta.defaultTimeSig,
    tempoBpm: meta.tempoBpm,
    duration,
    notes,
    pedalEvents,
    sections: meta.sections,
    annotations: meta.annotations,
  };
}

// 1. Czardas (Vittorio Monti)
const czardasMeta = {
  id: 'monti-czardas',
  title: 'Czardas',
  composer: 'Vittorio Monti (Arr. Kristopha K. S.)',
  opus: '1904',
  key: 'D minor / D Major',
  defaultTimeSig: [2, 4],
  tempoBpm: 60,
  sections: [
    {
      id: 'monti-cz-sec-1',
      title: 'Largo – Gypsy Rhapsody & Passionate Rubato (M. 1–28)',
      startMeasure: 1,
      endMeasure: 28,
      startTime: 0,
      endTime: 84.8,
      tempoSuggestion: '55–80 BPM Largo con passione',
      character: 'Lassú – slow, melancholy gypsy lament with soaring rhapsodic ornaments'
    },
    {
      id: 'monti-cz-sec-2',
      title: 'Allegro vivace – Friss I: Hungarian Folk Fire (M. 29–60)',
      startMeasure: 29,
      endMeasure: 60,
      startTime: 84.8,
      endTime: 129.8,
      tempoSuggestion: '140 BPM Allegro vivace',
      character: 'Friss – explosive Hungarian folk dance, crisp staccato and driving syncopations'
    },
    {
      id: 'monti-cz-sec-3',
      title: 'Meno, quasi lento – Cantabile Gypsy Serenade in D Major (M. 61–84)',
      startMeasure: 61,
      endMeasure: 84,
      startTime: 129.8,
      endTime: 163.8,
      tempoSuggestion: '90 BPM Dolce cantabile',
      character: 'Tender D Major serenade, warm singing tone and romantic expressive swells'
    },
    {
      id: 'monti-cz-sec-4',
      title: 'Allegro – Friss II: Virtuoso Pyrotechnics (M. 85–116)',
      startMeasure: 85,
      endMeasure: 116,
      startTime: 163.8,
      endTime: 214.6,
      tempoSuggestion: '140 BPM Vivacissimo',
      character: 'Dazzling rapid articulation, sparkling runs, and exhilarating accelerando'
    },
    {
      id: 'monti-cz-sec-5',
      title: 'Molto più vivo – Coda con fuoco & Prestissimo (M. 117–End)',
      startMeasure: 117,
      endMeasure: 160,
      startTime: 214.6,
      endTime: 313.7,
      tempoSuggestion: '160 BPM Prestissimo con fuoco',
      character: 'Fiery grand finale, furious Hungarian czardas tempo to a thunderous close'
    },
    {
      id: 'monti-cz-full',
      title: 'Czardas – Complete Master Performance',
      startMeasure: 1,
      endMeasure: 160,
      startTime: 0,
      endTime: 313.7,
      tempoSuggestion: 'Lassú to Friss Rubato',
      character: 'Full Masterclass Performance'
    }
  ],
  annotations: [
    {
      id: 'cz-ann-1',
      measureRange: [1, 16],
      title: 'Lassú: Gypsy Rhapsodic Rubato',
      germanTerm: 'Rhapsodisches Rubato & Zigeunerton',
      category: 'rubato',
      instruction: 'Play with deep emotional freedom. Lean into the poignant diminished chords, linger on expressive high notes, and articulate the violin-inspired arabesques with elastic flexibility.',
      referenceTimestampSeconds: 10
    },
    {
      id: 'cz-ann-2',
      measureRange: [29, 45],
      title: 'Friss Ignition: Featherweight Staccatissimo',
      germanTerm: 'Feuriges Staccato & Ungarischer Rhythmus',
      category: 'fingering',
      instruction: 'Instant change of character! Spring from the keys with crisp fingertip precision. Keep the left-hand bass and off-beat chords razor-sharp like a cimbalom.',
      pedalGuidance: {
        action: 'staccato',
        explanation: 'Keep pedal completely dry during fast passagework to preserve rhythmic electricity.',
        idealHoldMs: 150
      },
      referenceTimestampSeconds: 88
    },
    {
      id: 'cz-ann-3',
      measureRange: [61, 76],
      title: 'Dolce Cantabile in D Major: Pure Serenade',
      germanTerm: 'Gesangsstimme in D-Dur',
      category: 'tone-color',
      instruction: 'Unfold the golden D Major theme with deep arm weight and warm vocal tone. Balance the rocking accompaniment softly beneath the soaring melodic phrase.',
      referenceTimestampSeconds: 132
    },
    {
      id: 'cz-ann-4',
      measureRange: [117, 140],
      title: 'Coda Prestissimo con fuoco: The Ultimate Sprint',
      germanTerm: 'Prestissimo con Fuoco',
      category: 'transition',
      instruction: 'Build momentum through the accelerando. Do not rush prematurely; allow the rhythmic tension to crest into an electrifying, unstoppable surge to the final fortissimo cadence.',
      pedalGuidance: {
        action: 'catch',
        explanation: 'Firm pedal taps on accented downbeats for orchestral impact.',
        idealHoldMs: 400
      },
      referenceTimestampSeconds: 270
    }
  ]
};

const czardasScore = convertMidiToScore('C:/Users/Kxwie/Downloads/Kristopha K. S. - Czardas.mid', czardasMeta);
fs.writeFileSync('src/data/scores/monti-czardas.json', JSON.stringify(czardasScore, null, 2));
console.log('Saved Czardas! Total notes:', czardasScore.notes.length, 'pedals:', czardasScore.pedalEvents.length, 'duration:', czardasScore.duration);

// 2. Twinkle Twinkle Little Star (Mozart K. 265)
const twinkleMeta = {
  id: 'mozart-twinkle-twinkle',
  title: '12 Variations on Ah vous dirai-je Maman (Twinkle, Twinkle)',
  composer: 'Wolfgang Amadeus Mozart',
  opus: 'K. 265 / 300e',
  key: 'C Major',
  defaultTimeSig: [2, 4],
  tempoBpm: 120,
  sections: [
    {
      id: 'moz-tw-sec-0',
      title: 'Thema – Simple Pastoral Theme (M. 1–24)',
      startMeasure: 1,
      endMeasure: 24,
      startTime: 0,
      endTime: 24.0,
      tempoSuggestion: '120 BPM Grazioso',
      character: 'Naive, pure childhood melody with pristine classical clarity'
    },
    {
      id: 'moz-tw-sec-1',
      title: 'Variation I – Pearly 16th Notes in Right Hand (M. 25–48)',
      startMeasure: 25,
      endMeasure: 48,
      startTime: 24.0,
      endTime: 55.4,
      tempoSuggestion: '130 BPM Leggiero',
      character: 'Sparkling right-hand runs around quiet left-hand chord pulses'
    },
    {
      id: 'moz-tw-sec-2',
      title: 'Variation II – Running Left-Hand Bass Arpeggios (M. 49–72)',
      startMeasure: 49,
      endMeasure: 72,
      startTime: 55.4,
      endTime: 92.3,
      tempoSuggestion: '130 BPM Con moto',
      character: 'Energetic flowing left-hand 16ths supporting crisp melody'
    },
    {
      id: 'moz-tw-sec-3',
      title: 'Variation III – Synchronized Broken Thirds & Cross-Rhythms (M. 73–96)',
      startMeasure: 73,
      endMeasure: 96,
      startTime: 92.3,
      endTime: 136.6,
      tempoSuggestion: '130 BPM Legato',
      character: 'Silky triplet arpeggios rolling gently between hands'
    },
    {
      id: 'moz-tw-sec-4',
      title: 'Variation IV – Left-Hand Triplet Waves & Singing Treble (M. 97–120)',
      startMeasure: 97,
      endMeasure: 120,
      startTime: 136.6,
      endTime: 180.9,
      tempoSuggestion: '130 BPM Dolce',
      character: 'Lyrical melody supported by rippling bass triplets'
    },
    {
      id: 'moz-tw-sec-5',
      title: 'Variation V – Syncopated Off-Beat Bells & Staccato Accents (M. 121–144)',
      startMeasure: 121,
      endMeasure: 144,
      startTime: 180.9,
      endTime: 225.2,
      tempoSuggestion: '130 BPM Giocoso',
      character: 'Playful displaced syncopations like delicate musical clockwork'
    },
    {
      id: 'moz-tw-sec-6',
      title: 'Variation VI – Alternating Rapid Hands & Scales (M. 145–168)',
      startMeasure: 145,
      endMeasure: 168,
      startTime: 225.2,
      endTime: 269.5,
      tempoSuggestion: '130 BPM Brillante',
      character: 'Fast cascading dialogue tossing phrases between left and right'
    },
    {
      id: 'moz-tw-sec-7',
      title: 'Variation VII – Classical Scale Flourishes & Fanfares (M. 169–192)',
      startMeasure: 169,
      endMeasure: 192,
      startTime: 269.5,
      endTime: 313.8,
      tempoSuggestion: '130 BPM Maestoso',
      character: 'Triumphant scale cascades spanning three octaves'
    },
    {
      id: 'moz-tw-sec-8',
      title: 'Variation VIII – Tragic C Minor Canonic Counterpoint (M. 193–216)',
      startMeasure: 193,
      endMeasure: 216,
      startTime: 313.8,
      endTime: 366.9,
      tempoSuggestion: '110 BPM Sotto voce',
      character: 'Deeply expressive minor-mode canon filled with pathos and shadows'
    },
    {
      id: 'moz-tw-sec-9',
      title: 'Variation IX – Joyous Return to C Major with Staccato Leaps (M. 217–240)',
      startMeasure: 217,
      endMeasure: 240,
      startTime: 366.9,
      endTime: 417.9,
      tempoSuggestion: '130 BPM Brillante',
      character: 'Bright festive return, sparkling staccato jumps and joy'
    },
    {
      id: 'moz-tw-sec-10',
      title: 'Variation X – Hand-Crossing Bravura & Polyphony (M. 241–264)',
      startMeasure: 241,
      endMeasure: 264,
      startTime: 417.9,
      endTime: 462.2,
      tempoSuggestion: '130 BPM Virtuoso',
      character: 'Daring hand-crossing leaps over singing inner voices'
    },
    {
      id: 'moz-tw-sec-11',
      title: 'Variation XI – Adagio Cantabile in 3/4 Time (M. 265–312)',
      startMeasure: 265,
      endMeasure: 312,
      startTime: 462.2,
      endTime: 632.7,
      tempoSuggestion: '43 BPM Adagio cantabile',
      character: 'Sublime Mozartian opera aria, rich ornamentation and heartfelt rubato'
    },
    {
      id: 'moz-tw-sec-12',
      title: 'Variation XII – Allegro Vivace & Grand Finale (M. 313–End)',
      startMeasure: 313,
      endMeasure: 360,
      startTime: 632.7,
      endTime: 713.5,
      tempoSuggestion: '130 BPM Allegro vivace',
      character: 'Jubilant closing celebration with extended trills and virtuosic coda'
    },
    {
      id: 'moz-tw-full',
      title: '12 Variations K. 265 – Complete Master Performance',
      startMeasure: 1,
      endMeasure: 360,
      startTime: 0,
      endTime: 713.5,
      tempoSuggestion: 'Classical Mozartean Precision',
      character: 'Full Masterclass Performance'
    }
  ],
  annotations: [
    {
      id: 'tw-ann-1',
      measureRange: [1, 12],
      title: 'Thema: Absolute Classical Simplicity',
      germanTerm: 'Klassische Schlichtheit & Artikulation',
      category: 'tone-color',
      instruction: 'Do not over-romanticize the opening. Play with crystalline touch, gentle detached quarter notes, and an affectionate, unhurried cantilena.',
      referenceTimestampSeconds: 2
    },
    {
      id: 'tw-ann-2',
      measureRange: [25, 36],
      title: 'Variation I: Weightless Pearly 16ths',
      germanTerm: 'Perlender Anschlag der rechten Hand',
      category: 'fingering',
      instruction: 'Keep the right wrist relaxed and curved. The 16th notes must sound like glowing pearls dropping into calm water, completely even in volume and rhythm.',
      pedalGuidance: {
        action: 'staccato',
        explanation: 'No pedal or minimal light touch to maintain maximum transparency and Viennese sparkle.',
        idealHoldMs: 100
      },
      referenceTimestampSeconds: 26
    },
    {
      id: 'tw-ann-3',
      measureRange: [193, 208],
      title: 'Variation VIII: Dramatic C Minor Pathos',
      germanTerm: 'c-Moll Kontrapunkt & Affekt',
      category: 'rubato',
      instruction: 'The emotional turning point of the work. Bring out the strict canonic imitation between soprano and bass. Play with brooding warmth and expressive dynamic shading.',
      referenceTimestampSeconds: 320
    },
    {
      id: 'tw-ann-4',
      measureRange: [265, 280],
      title: 'Variation XI: Operatic Adagio Cantabile',
      germanTerm: 'Adagio Cantabile & Opernarie',
      category: 'transition',
      instruction: 'Treat the 3/4 meter like a poignant soprano aria from Le Nozze di Figaro. Give each chromatic turn and appoggiatura time to breathe and blossom.',
      pedalGuidance: {
        action: 'catch',
        explanation: 'Gentle harmonic pedal changes on each beat to support the sustained vocal tone.',
        idealHoldMs: 1400
      },
      referenceTimestampSeconds: 470
    },
    {
      id: 'tw-ann-5',
      measureRange: [313, 340],
      title: 'Variation XII: Triumphant Vivace Bravura',
      germanTerm: 'Vivace Bravour & Festlicher Abschluss',
      category: 'tone-color',
      instruction: 'Reignite the tempo with joy and fireworks! Keep long trills sparkling and light, ending with a decisive, joyous fortissimo cadence.',
      pedalGuidance: {
        action: 'catch',
        explanation: 'Clear pedal on downbeat chords for crisp classical triumph.',
        idealHoldMs: 500
      },
      referenceTimestampSeconds: 640
    }
  ]
};

const twinkleScore = convertMidiToScore('C:/Users/Kxwie/Downloads/W. A. Mozart - 12 Variations on _Ah, vous dirai-je maman_, K.265.mid', twinkleMeta);
fs.writeFileSync('src/data/scores/mozart-twinkle-twinkle.json', JSON.stringify(twinkleScore, null, 2));
console.log('Saved Twinkle Twinkle! Total notes:', twinkleScore.notes.length, 'duration:', twinkleScore.duration);
