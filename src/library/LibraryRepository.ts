// Dynamic Piece & Repertoire Repository for Virtuoso & Flowkey
// Integrates complete canonical multi-measure masterworks with zero gaps.

import type { Piece } from '../types/music'
import type { MasterEditionId, LibraryPieceSummary } from '../types/edition'
import { ScoreEngine } from '../engine/ScoreEngine'
import { SongStorageManager } from './SongStorageManager'
import carolOfTheBellsScore from '../data/scores/carol-of-the-bells.json'
import siaSnowmanScore from '../data/scores/sia-snowman.json'
import riverFlowsInYouScore from '../data/scores/river-flows-in-you.json'
import lisztLaCampanellaScore from '../data/scores/liszt-la-campanella.json'
import lisztLiebestraum3Score from '../data/scores/liszt-liebestraum-3.json'
import kensukeInTheSeaScore from '../data/scores/kensuke-ushio-in-the-sea.json'
import hikaruNaraScore from '../data/scores/hikaru-nara.json'
import chopinNocturneScore from '../data/scores/chopin-nocturne-c-sharp-minor.json'
import hisaishiOneSummerDayScore from '../data/scores/joe-hisaishi-one-summers-day.json'
import hisaishiMerryGoRoundScore from '../data/scores/joe-hisaishi-merry-go-round.json'
import djOkawariFlowerDanceScore from '../data/scores/dj-okawari-flower-dance.json'

export class LibraryRepository {
  private static catalog: LibraryPieceSummary[] = [
    {
      id: 'carol-of-the-bells',
      title: 'Carol of the Bells',
      composer: 'Mykola Leontovych',
      opus: '1914',
      difficulty: 5,
      key: 'G minor',
      period: 'Contemporary',
      durationSeconds: 141,
      coverColor: 'from-emerald-600 via-teal-900 to-zinc-950',
      coverImage: '/images/covers/carol-of-the-bells.svg',
      badge: 'Holiday Concert',
      quote: 'Authentic 1,568-note Ukrainian bell motif and rolling arpeggios under winter midnight.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Authentic Concert Edition',
          year: '1914 / Complete MIDI',
          description: 'Full 1,568-note arrangement: four-note Ukrainian bell motif, rolling arpeggios, and festive polyphony.',
        },
      ],
    },
    {
      id: 'sia-snowman',
      title: 'Snowman',
      composer: 'Sia (Arr. John Rod Dondoyano)',
      opus: '2017',
      difficulty: 4,
      key: 'Db Major',
      period: 'Contemporary',
      durationSeconds: 131,
      coverColor: 'from-cyan-500 via-blue-900 to-zinc-950',
      coverImage: '/images/covers/sia-snowman.svg',
      badge: 'Winter Pop Ballad',
      quote: 'Iconic Takt 20 theme: warm syncopated chord voicings and lyrical vocal climax.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'John Rod Dondoyano Concert Arrangement (Takt 20 Edition)',
          year: '2017 / Direct Verse Edition',
          description: 'Special Direct Edition starting right at the iconic Takt 20 theme: warm syncopated chord voicings, lyrical vocal line, and emotive climax.',
        },
      ],
    },
    {
      id: 'river-flows-in-you',
      title: 'River Flows in You',
      composer: 'Yiruma',
      opus: '2001 (First Love)',
      difficulty: 3,
      key: 'A Major',
      period: 'Contemporary',
      durationSeconds: 168,
      coverColor: 'from-sky-500 via-indigo-900 to-zinc-950',
      coverImage: '/images/covers/river-flows-in-you.svg',
      badge: 'Modern Classic',
      quote: 'Liquid arpeggios that flow like gentle river currents through the soul.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Original Concert Edition',
          year: '2001 / Canonical Arrangement',
          description: 'Flowing romantic ballad with gentle rubato arpeggios, graceful ornaments, and a lyrical cantabile melody.',
        },
      ],
    },
    {
      id: 'liszt-la-campanella',
      title: 'La Campanella',
      composer: 'Franz Liszt',
      opus: 'S. 141 No. 3 (1851)',
      difficulty: 6,
      key: 'G# minor',
      period: 'Romantic',
      durationSeconds: 245,
      coverColor: 'from-amber-500 via-orange-950 to-zinc-950',
      coverImage: '/images/covers/liszt-la-campanella.svg',
      badge: 'Virtuoso Bravura',
      quote: 'Lightning right-hand bell leaps across two octaves with crystalline trills.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Grandes études de Paganini',
          year: '1851 Urtext Edition',
          description: 'Legendary virtuoso bravura showpiece with lightning-fast right-hand bell leaps (up to two octaves) and sparkling trills.',
        },
      ],
    },
    {
      id: 'liszt-liebestraum-3',
      title: 'Liebestraum No. 3',
      composer: 'Franz Liszt',
      opus: 'S. 541 / Op. 62 No. 3 (1850)',
      difficulty: 5,
      key: 'Ab Major',
      period: 'Romantic',
      durationSeconds: 247,
      coverColor: 'from-rose-600 via-pink-950 to-zinc-950',
      coverImage: '/images/covers/liszt-liebestraum-3.svg',
      badge: 'Romantic Masterpiece',
      quote: 'Immortal cantabile tenor melody accompanied by celestial arpeggios and triumphant passion.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Notturno III in As-Dur (Urtext)',
          year: '1850 Breitkopf & Härtel',
          description: 'Authentic 1,887-note concert edition with full pedal markings, cantabile tenor line, both virtuosic cadenzas, and radiant A-flat major coda.',
        },
      ],
    },
    {
      id: 'kensuke-ushio-in-the-sea',
      title: 'In the Sea (Chainsaw Man)',
      composer: 'Kensuke Ushio (Arr. Henry Garcia)',
      opus: '2022 (Chainsaw Man OST)',
      difficulty: 2,
      key: 'A minor',
      period: 'Contemporary',
      durationSeconds: 52,
      coverColor: 'from-blue-600 via-slate-900 to-zinc-950',
      coverImage: '/images/covers/kensuke-ushio-in-the-sea.svg',
      badge: 'Chainsaw Man OST',
      quote: 'Deep ocean minimalist solitude, breath pauses, and emotive stillness.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Acoustic Piano Transcription',
          year: '2022 / Henry Garcia Arr.',
          description: 'Atmospheric, haunting minimalist piano theme evoking deep ocean solitude, breath-like pauses, and emotional stillness.',
        },
      ],
    },
    {
      id: 'hikaru-nara',
      title: 'Hikaru Nara (Your Lie in April)',
      composer: 'Goose house',
      opus: '2014 (Shigatsu wa Kimi no Uso)',
      difficulty: 4,
      key: 'Eb Major',
      period: 'Contemporary',
      durationSeconds: 94,
      coverColor: 'from-pink-500 via-rose-950 to-zinc-950',
      coverImage: '/images/your-lie-in-april-3840x2160-21020.jpg',
      badge: 'Anime Masterpiece',
      quote: 'Your Lie in April: radiant cherry blossoms, driving pulse, and heartfelt duet.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Opening Theme Concert Arr.',
          year: '2014 / Anime Master Edition',
          description: 'Exuberant, passionate theme song of Your Lie in April arranged into a spirited, virtuosic piano arrangement with driving pulse.',
        },
      ],
    },
    {
      id: 'chopin-nocturne-c-sharp-minor',
      title: 'Nocturne in C-sharp minor',
      composer: 'Frédéric Chopin',
      opus: 'Op. posth., B. 49 (1830)',
      difficulty: 4,
      key: 'C# minor',
      period: 'Romantic',
      durationSeconds: 235,
      coverColor: 'from-violet-600 via-purple-950 to-zinc-950',
      coverImage: '/images/covers/chopin-nocturne-c-sharp-minor.svg',
      badge: 'Romantic Masterwork',
      quote: 'Poignant Parisian night reverie crowned by the famous 35-note downward arabesque.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Henle Urtext (KK IVa/16)',
          year: '1830 Canonical Edition',
          description: 'Intensely poignant masterpiece with flowing broken-chord accompaniment, expressive rubato, and famous 35-note downward arabesque.',
        },
      ],
    },
    {
      id: 'joe-hisaishi-one-summers-day',
      title: "One Summer's Day (Spirited Away)",
      composer: 'Joe Hisaishi (Arr. Tuan-Anh Le)',
      opus: '2001 (Studio Ghibli)',
      difficulty: 3,
      key: 'C Major',
      period: 'Contemporary',
      durationSeconds: 192,
      coverColor: 'from-emerald-500 via-teal-950 to-zinc-950',
      coverImage: '/images/covers/joe-hisaishi-one-summers-day.svg',
      badge: 'Studio Ghibli',
      quote: 'Nostalgic Spirited Away summer sky and sea railway across memory.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Studio Ghibli Concert Edition',
          year: '2001 / Official Score',
          description: 'Nostalgic, timeless Ghibli masterpiece opening with reflective suspended chords before blossoming into lush warmth and yearning.',
        },
      ],
    },
    {
      id: 'joe-hisaishi-merry-go-round',
      title: 'Merry-Go-Round of Life',
      composer: 'Joe Hisaishi',
      opus: "2004 (Howl's Moving Castle)",
      difficulty: 4,
      key: 'G minor',
      period: 'Contemporary',
      durationSeconds: 353,
      coverColor: 'from-amber-600 via-yellow-950 to-zinc-950',
      coverImage: '/images/covers/joe-hisaishi-merry-go-round.svg',
      badge: "Howl's Moving Castle",
      quote: 'Swirling Viennese waltz dancing over alpine meadows and flying castles.',
      availableEditions: [
        {
          id: 'urtext',
          name: "Howl's Moving Castle Symphonic Piano",
          year: '2004 / Studio Ghibli',
          description: 'Swirling Viennese waltz theme with dramatic dynamic arches, spirited rubato, dancing bass octaves, and lush orchestral chords.',
        },
      ],
    },
    {
      id: 'dj-okawari-flower-dance',
      title: 'Flower Dance',
      composer: 'DJ Okawari',
      opus: '2010 (A Cup of Coffee)',
      difficulty: 4,
      key: 'G minor',
      period: 'Contemporary',
      durationSeconds: 259,
      coverColor: 'from-fuchsia-500 via-pink-950 to-zinc-950',
      coverImage: '/images/covers/dj-okawari-flower-dance.svg',
      badge: 'Jazz-Hop Piano',
      quote: 'Relentless running 16th-note arpeggios dancing like sakura petals in the wind.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Official Solo Piano Transcription',
          year: '2010 / Melodic Master Edition',
          description: 'Electrifying, driving contemporary piano masterpiece with relentless running semiquaver arpeggios and crystalline melody.',
        },
      ],
    },
    {
      id: 'tony-ann-icarus',
      title: 'ICARUS',
      composer: 'Tony Ann',
      opus: '2023',
      difficulty: 6,
      key: 'C minor / Eb Major',
      period: 'Neoclassical',
      durationSeconds: 189,
      coverColor: 'from-amber-500 via-orange-600 to-amber-950',
      coverImage: '/images/covers/tony-ann-icarus.svg',
      badge: 'Neoclassical Bravura',
      quote: 'Liquid 16th-note wave arpeggios and fortissimo double-octave climax.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'henryurayama Concert Edition',
          year: '2023 / MuseScore 14361967',
          description: 'Official MuseScore transcription directly from authentic MIDI: liquid 16th-note wave arpeggios, soaring soprano melody, fortissimo double-octave climax, and whisper coda.',
        },
      ],
    },
    {
      id: 'abba-the-winner-takes-it-all',
      title: 'The Winner Takes It All',
      composer: 'ABBA',
      opus: '1980',
      difficulty: 4,
      key: 'Gb Major / F# Major',
      period: 'Contemporary',
      durationSeconds: 292,
      coverColor: 'from-sky-500 via-indigo-600 to-purple-950',
      coverImage: '/images/covers/abba-the-winner-takes-it-all.svg',
      badge: 'Pop Ballad Legend',
      quote: 'Iconic Benny Andersson piano intro, dramatic bridge, and heartfelt double chorus.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Grandpapa Leeee Concert Solo Edition',
          year: '1980 / MuseScore 33064946',
          description: 'Official MuseScore transcription directly from authentic MIDI: iconic Benny Andersson piano intro, heartfelt verses, dramatic bridge (Does it feel the same?), fortissimo double chorus, and peaceful outro.',
        },
      ],
    },
    {
      id: 'handel-halvorsen-passacaglia',
      title: 'Passacaglia in G minor',
      composer: 'Handel / Halvorsen',
      opus: 'HWV 432',
      difficulty: 6,
      key: 'G minor',
      period: 'Baroque',
      durationSeconds: 137,
      coverColor: 'from-amber-600 via-red-900 to-zinc-950',
      coverImage: '/images/covers/handel-halvorsen-passacaglia.svg',
      badge: 'Baroque Fire',
      quote: 'Noble Baroque ground bass, cascading arpeggios, and thunderous octave climax.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Halvorsen Concert Solo Edition',
          year: '1894 / Authentic MIDI',
          description: 'Official arrangement directly from authentic MIDI: noble Baroque ground bass, cascading arpeggios, rapid staccato dialogues, and thunderous octave climax (1,030 notes complete).',
        },
      ],
    },
    {
      id: 'beethoven-fur-elise',
      title: 'Für Elise',
      composer: 'Ludwig van Beethoven',
      opus: 'WoO 59',
      difficulty: 4,
      key: 'A minor',
      period: 'Classical',
      durationSeconds: 165,
      coverColor: 'from-amber-500 to-amber-800',
      coverImage: '/images/covers/beethoven-fur-elise.svg',
      badge: 'Classical Essential',
      quote: 'The world\'s most beloved piano melody, complete with stormy middle episodes.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Henle Urtext Complete',
          year: 'Canonical 1810 / Authentic MIDI',
          description: 'Official complete transcription from authentic MIDI (1,039 notes complete): iconic A minor theme, lyrical F major episode, ominous repeated-bass drama, and chromatic cascade.',
        },
      ],
    },
    {
      id: 'beethoven-moonlight-1',
      title: 'Moonlight Sonata (1st Mvt)',
      composer: 'Ludwig van Beethoven',
      opus: 'Op. 27 No. 2',
      difficulty: 5,
      key: 'C# minor',
      period: 'Classical',
      durationSeconds: 362,
      coverColor: 'from-indigo-600 via-blue-900 to-zinc-950',
      coverImage: '/images/covers/beethoven-moonlight-1.svg',
      badge: 'Immortal Adagio',
      quote: 'Delicate undulating triplets and singing soprano melody beneath a silver moon.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Henle Urtext',
          year: '1801 / Authentic MIDI',
          description: 'The immortal Adagio sostenuto: delicate undulating triplets, singing soprano melody, and haunting nocturnal resonance (1,144 notes complete, 154 damper pedals).',
        },
      ],
    },
    {
      id: 'bach-prelude-c',
      title: 'Prelude in C Major',
      composer: 'Johann Sebastian Bach',
      opus: 'BWV 846',
      difficulty: 2,
      key: 'C major',
      period: 'Baroque',
      durationSeconds: 131,
      coverColor: 'from-emerald-500 via-teal-800 to-zinc-950',
      coverImage: '/images/covers/bach-prelude-c.svg',
      badge: 'Keyboard Foundation',
      quote: 'Crystalline harmonic purity: the universal foundation of keyboard literature.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Bach-Gesellschaft Urtext',
          year: '1722 / Authentic MIDI',
          description: 'The foundation of keyboard literature: crystalline flowing 16th-note arpeggios over continuous noble bass fundamentals (549 notes complete).',
        },
      ],
    },
    {
      id: 'chopin-ballade-1',
      title: 'Ballade No. 1 in G minor',
      composer: 'Frédéric Chopin',
      opus: 'Op. 23',
      difficulty: 9,
      key: 'G minor',
      period: 'Romantic',
      durationSeconds: 474,
      coverColor: 'from-amber-600 to-red-950',
      coverImage: '/images/covers/chopin-ballade-1.svg',
      badge: 'Concert Masterpiece',
      quote: 'Complete 264-measure unabridged masterpiece from Largo to Presto con fuoco.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Henle Urtext',
          year: 'Canonical',
          description: 'Complete 264-measure unabridged masterpiece (5,096 notes) from Largo to Presto con fuoco.',
        },
        {
          id: 'zimerman',
          name: 'Krystian Zimerman',
          year: '1987 DG Recording',
          description: 'Aristocratic cantabile, extreme dynamic contrasts, and breathing rubato.',
        },
        {
          id: 'horowitz',
          name: 'Vladimir Horowitz',
          year: '1968 Carnegie Hall',
          description: 'Fiery bravura, thunderous double octaves, and tempestuous phrasing.',
        },
        {
          id: 'lang-lang',
          name: 'Lang Lang',
          year: '2001 Carnegie Hall',
          description: 'Lush romantic rubato, deep singing melodies, lingering poetic pauses, and dazzling coda speed.',
        },
      ],
    },
    {
      id: 'scale-c-major',
      title: 'Playing Scales: C Major',
      composer: 'Scale Foundation',
      opus: 'Grade 1–3',
      difficulty: 2,
      key: 'C major',
      period: 'Technique',
      durationSeconds: 8,
      coverColor: 'from-emerald-600 to-teal-950',
      coverImage: '/images/covers/scales-technique.svg',
      badge: 'Scale Foundation',
      quote: 'Essential finger coordination, thumb-under agility, and key signature mastery.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Royal Conservatory',
          year: 'Standard',
          description: 'Both hands parallel motion with 1-2-3-1-2-3-4-5 fingering.',
        },
      ],
    },
    {
      id: 'scale-g-major',
      title: 'Playing Scales: G Major (1 Sharp: F#)',
      composer: 'Scale Foundation',
      opus: 'Grade 1–3',
      difficulty: 2,
      key: 'G major',
      period: 'Technique',
      durationSeconds: 8,
      coverColor: 'from-emerald-600 to-cyan-950',
      coverImage: '/images/covers/scales-technique.svg',
      badge: 'Scale Foundation',
      quote: 'Essential finger coordination, thumb-under agility, and key signature mastery.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Royal Conservatory',
          year: 'Standard',
          description: 'Finger 4 on F# black key navigation.',
        },
      ],
    },
    {
      id: 'scale-d-major',
      title: 'Playing Scales: D Major (2 Sharps: F#, C#)',
      composer: 'Scale Foundation',
      opus: 'Grade 2–3',
      difficulty: 3,
      key: 'D major',
      period: 'Technique',
      durationSeconds: 8,
      coverColor: 'from-teal-600 to-blue-950',
      coverImage: '/images/covers/scales-technique.svg',
      badge: 'Scale Foundation',
      quote: 'Essential finger coordination, thumb-under agility, and key signature mastery.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Royal Conservatory',
          year: 'Standard',
          description: 'Coordination across two black keys (F# & C#).',
        },
      ],
    },
    {
      id: 'scale-a-minor',
      title: 'Playing Scales: A Harmonic Minor',
      composer: 'Scale Foundation',
      opus: 'Grade 2–4',
      difficulty: 3,
      key: 'A minor',
      period: 'Technique',
      durationSeconds: 8,
      coverColor: 'from-purple-600 to-indigo-950',
      coverImage: '/images/covers/scales-technique.svg',
      badge: 'Scale Foundation',
      quote: 'Essential finger coordination, thumb-under agility, and key signature mastery.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Royal Conservatory',
          year: 'Standard',
          description: 'Augmented second stretch (F to G#) training without hand tension.',
        },
      ],
    },
    {
      id: 'scale-c-minor',
      title: 'Playing Scales: C Minor (Tony Ann ICARUS Key)',
      composer: 'Scale Foundation',
      opus: 'Grade 3–4',
      difficulty: 4,
      key: 'C minor',
      period: 'Technique',
      durationSeconds: 8,
      coverColor: 'from-indigo-600 to-purple-950',
      coverImage: '/images/covers/scales-technique.svg',
      badge: 'Scale Foundation',
      quote: 'Essential finger coordination, thumb-under agility, and key signature mastery.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Royal Conservatory',
          year: 'Standard',
          description: 'Eb, Ab, and leading tone B natural for modern neoclassical fluency.',
        },
      ],
    },
    {
      id: 'scale-chromatic',
      title: 'Chromatic Scale Ladder (Velocity Drill)',
      composer: 'Virtuoso Foundation',
      opus: 'All Grades',
      difficulty: 4,
      key: 'Chromatic',
      period: 'Technique',
      durationSeconds: 6,
      coverColor: 'from-rose-600 to-slate-950',
      coverImage: '/images/covers/scales-technique.svg',
      badge: 'Scale Foundation',
      quote: 'Essential finger coordination, thumb-under agility, and key signature mastery.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Cortot Velocity',
          year: 'Standard',
          description: 'Rapid 1-3-1-3-1-2-3 gliding fingering across all 12 semitones.',
        },
      ],
    },
    {
      id: 'tony-ann-icarus-arpeggio',
      title: 'Tony Ann: ICARUS Wave Arpeggio Ladder',
      composer: 'Tony Ann / Neoclassical Drill',
      opus: 'Neoclassical Mastery',
      difficulty: 5,
      key: 'C minor',
      period: 'Technique',
      durationSeconds: 12,
      coverColor: 'from-amber-600 to-orange-950',
      coverImage: '/images/covers/scales-technique.svg',
      badge: 'Scale Foundation',
      quote: 'Essential finger coordination, thumb-under agility, and key signature mastery.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Mastery Edition',
          year: '2023',
          description: 'Rapid 16th-note wave arpeggios: Abmaj7 – Bb – Cm – Ebmaj7.',
        },
      ],
    },
    {
      id: 'bach-minuet-g',
      title: 'Minuet in G Major',
      composer: 'Johann Sebastian Bach',
      opus: 'BWV Anh. 114',
      difficulty: 2,
      key: 'G major',
      period: 'Baroque',
      durationSeconds: 38,
      coverColor: 'from-amber-600 to-yellow-950',
      coverImage: '/images/covers/scales-technique.svg',
      badge: 'Scale Foundation',
      quote: 'Essential finger coordination, thumb-under agility, and key signature mastery.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Notenbüchlein für Anna Magdalena',
          year: '1725',
          description: 'Noble baroque 3/4 minuet dance with singing right-hand eighth-note passages and stately bassline.',
        },
      ],
    },
    {
      id: 'c-position-starter',
      title: 'First Notes in C Position',
      composer: 'Beginner Foundation',
      opus: 'Grade 1 Starter',
      difficulty: 1,
      key: 'C major',
      period: 'Technique',
      durationSeconds: 12,
      coverColor: 'from-emerald-500 to-teal-950',
      coverImage: '/images/covers/scales-technique.svg',
      badge: 'Scale Foundation',
      quote: 'Essential finger coordination, thumb-under agility, and key signature mastery.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'First Steps',
          year: 'Standard',
          description: 'C4-D4-E4 right hand with fingers 1-2-3 and whole note bass grounding.',
        },
      ],
    },
    {
      id: 'c-position-five-fingers',
      title: 'The 5-Finger Wave',
      composer: 'Beginner Foundation',
      opus: 'Grade 1 Agility',
      difficulty: 1,
      key: 'C major',
      period: 'Technique',
      durationSeconds: 15,
      coverColor: 'from-teal-500 to-cyan-950',
      coverImage: '/images/covers/scales-technique.svg',
      badge: 'Scale Foundation',
      quote: 'Essential finger coordination, thumb-under agility, and key signature mastery.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Five Fingers',
          year: 'Standard',
          description: 'C4-D4-E4-F4-G4 five-finger scale and broken triad arpeggios.',
        },
      ],
    },
    {
      id: 'hanon-exercise-1',
      title: 'Hanon Virtuoso Pianist: No. 1',
      composer: 'C. L. Hanon',
      opus: 'The Virtuoso Pianist',
      difficulty: 2,
      key: 'C major',
      period: 'Technique',
      durationSeconds: 18,
      coverColor: 'from-amber-600 to-orange-950',
      coverImage: '/images/covers/hanon-exercise-1.svg',
      badge: 'Technique Drill',
      quote: 'Finger independence, high lift, and stretch agility between fingers 4 and 5.',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Schirmer Edition',
          year: 'Standard',
          description: 'Finger independence, high lift, and stretch agility between fingers 4 and 5.',
        },
      ],
    },
  ]

  public static getCatalog(): LibraryPieceSummary[] {
    const customSummaries = SongStorageManager.getCustomPieceSummaries()
    return [...this.catalog, ...customSummaries]
  }

  public static async loadPiece(pieceId: string, editionId: MasterEditionId = 'urtext'): Promise<Piece> {
    // 0. Check custom device-saved pieces first
    const customPiece = SongStorageManager.getSavedPieces().find((p) => p.id === pieceId)
    if (customPiece) {
      return customPiece
    }

    // Direct bundled canonical scores (zero network dependency)
    if (pieceId === 'carol-of-the-bells') {
      return carolOfTheBellsScore as unknown as Piece
    }
    if (pieceId === 'sia-snowman') {
      return siaSnowmanScore as unknown as Piece
    }
    if (pieceId === 'river-flows-in-you') {
      return riverFlowsInYouScore as unknown as Piece
    }
    if (pieceId === 'liszt-la-campanella') {
      return lisztLaCampanellaScore as unknown as Piece
    }
    if (pieceId === 'liszt-liebestraum-3') {
      return lisztLiebestraum3Score as unknown as Piece
    }
    if (pieceId === 'kensuke-ushio-in-the-sea') {
      return kensukeInTheSeaScore as unknown as Piece
    }
    if (pieceId === 'hikaru-nara') {
      return hikaruNaraScore as unknown as Piece
    }
    if (pieceId === 'chopin-nocturne-c-sharp-minor') {
      return chopinNocturneScore as unknown as Piece
    }
    if (pieceId === 'joe-hisaishi-one-summers-day') {
      return hisaishiOneSummerDayScore as unknown as Piece
    }
    if (pieceId === 'joe-hisaishi-merry-go-round') {
      return hisaishiMerryGoRoundScore as unknown as Piece
    }
    if (pieceId === 'dj-okawari-flower-dance') {
      return djOkawariFlowerDanceScore as unknown as Piece
    }

    // 1. Try loading complete pre-parsed canonical JSON score
    try {
      let resp = await fetch(`./scores/${pieceId}.json`).catch(() => null)
      if (!resp || !resp.ok) {
        resp = await fetch(`/scores/${pieceId}.json`).catch(() => null)
      }
      if (resp && resp.ok) {
        const fullScore = (await resp.json()) as Piece
        if (fullScore && fullScore.notes && fullScore.notes.length > 0) {
          if (editionId === 'horowitz' && pieceId === 'chopin-ballade-1') {
            return {
              ...fullScore,
              title: `${fullScore.title} (Horowitz 1968)`,
              tempoBpm: Math.round(fullScore.tempoBpm * 1.08),
              notes: fullScore.notes.map((n) => {
                const isCoda = n.measure >= 208
                const isClimax = (n.measure >= 126 && n.measure <= 137) || (n.measure >= 242 && n.measure <= 264)
                const velFactor = isCoda || isClimax ? 1.2 : 1.1
                return {
                  ...n,
                  velocity: Math.min(127, Math.round((n.velocity || 80) * velFactor)),
                  duration: isCoda && n.hand === 'right' ? Math.max(0.12, n.duration * 0.9) : n.duration,
                }
              }),
            }
          } else if (editionId === 'zimerman' && pieceId === 'chopin-ballade-1') {
            return {
              ...fullScore,
              title: `${fullScore.title} (Zimerman 1987)`,
              tempoBpm: Math.round(fullScore.tempoBpm * 0.96),
              notes: fullScore.notes.map((n) => {
                const isMelody = n.hand === 'right' && ((n.measure >= 8 && n.measure <= 36) || (n.measure >= 68 && n.measure <= 82))
                const isAccomp = n.hand === 'left' && ((n.measure >= 8 && n.measure <= 36) || (n.measure >= 68 && n.measure <= 82))
                const vel = isMelody
                  ? Math.min(127, Math.round((n.velocity || 75) * 1.18))
                  : isAccomp
                  ? Math.max(30, Math.round((n.velocity || 65) * 0.88))
                  : n.velocity
                return {
                  ...n,
                  velocity: vel,
                }
              }),
              pedalEvents: fullScore.pedalEvents.map((p) => ({
                ...p,
                depth: p.type === 'half' ? 52 : Math.min(115, Math.round((p.depth || 100) * 0.9)),
              })),
            }
          } else if (editionId === 'lang-lang' && pieceId === 'chopin-ballade-1') {
            return {
              ...fullScore,
              title: `${fullScore.title} (Lang Lang 2001)`,
              tempoBpm: Math.round(fullScore.tempoBpm * 1.02),
              notes: fullScore.notes.map((n) => {
                const isMelody = n.hand === 'right' && ((n.measure >= 8 && n.measure <= 36) || (n.measure >= 68 && n.measure <= 82))
                const isCoda = n.measure >= 208
                let vel = n.velocity || 75
                if (isMelody) vel = Math.round(vel * 1.22)
                else if (isCoda) vel = Math.round(vel * 1.15)
                return {
                  ...n,
                  velocity: Math.min(127, Math.max(35, vel)),
                }
              }),
              pedalEvents: fullScore.pedalEvents.map((p) => ({
                ...p,
                depth: 127,
                duration: p.measure >= 8 && p.measure <= 36 ? p.duration * 1.05 : p.duration,
              })),
            }
          }
          return fullScore
        }
      }
    } catch {}

    // 2. ScoreEngine fallback for courses, drills & scales
    switch (pieceId) {
      case 'abba-the-winner-takes-it-all':
        return ScoreEngine.getTheWinnerTakesItAll()

      case 'handel-halvorsen-passacaglia':
        return ScoreEngine.getHandelPassacaglia()

      case 'tony-ann-icarus':
        return ScoreEngine.getTonyAnnIcarus()

      case 'chopin-ballade-1':
        return ScoreEngine.getChopinBalladeContinuous()

      case 'beethoven-fur-elise':
        return ScoreEngine.getFurElise()

      case 'scale-c-major':
        return ScoreEngine.getScaleCourseC()

      case 'scale-g-major':
        return ScoreEngine.getScaleCourseG()

      case 'scale-d-major':
        return ScoreEngine.getScaleCourseD()

      case 'scale-a-minor':
        return ScoreEngine.getScaleCourseAm()

      case 'scale-c-minor':
        return ScoreEngine.getScaleCourseCm()

      case 'scale-chromatic':
        return ScoreEngine.getScaleChromatic()

      case 'tony-ann-icarus-arpeggio':
        return ScoreEngine.getTonyAnnIcarusArpeggio()

      case 'beethoven-ode-to-joy':
        return ScoreEngine.getOdeToJoy()

      case 'bach-prelude-c':
        return ScoreEngine.getBachPrelude()

      case 'beethoven-moonlight-1':
        return ScoreEngine.getMoonlightSonata()

      case 'course-4-chords':
        return ScoreEngine.getChordProgressionCourse()

      case 'bach-minuet-g':
        return ScoreEngine.getMinuetInG()

      case 'hanon-exercise-1':
        return ScoreEngine.getHanonExercise1()

      case 'c-position-starter':
        return ScoreEngine.getCPositionStarter()

      case 'c-position-five-fingers':
        return ScoreEngine.getCPositionFiveFingers()

      default:
        return ScoreEngine.getFurElise()
    }
  }
}
