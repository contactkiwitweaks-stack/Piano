import fs from 'fs';

const meta = {
  'carol-of-the-bells': {
    coverImage: '/images/covers/carol-of-the-bells.svg',
    badge: 'Holiday Concert',
    quote: 'Authentic 1,568-note Ukrainian bell motif and rolling arpeggios under winter midnight.',
  },
  'sia-snowman': {
    coverImage: '/images/covers/sia-snowman.svg',
    badge: 'Winter Pop Ballad',
    quote: 'Iconic Takt 20 theme: warm syncopated chord voicings and lyrical vocal climax.',
  },
  'river-flows-in-you': {
    coverImage: '/images/covers/river-flows-in-you.svg',
    badge: 'Modern Classic',
    quote: 'Liquid arpeggios that flow like gentle river currents through the soul.',
  },
  'liszt-la-campanella': {
    coverImage: '/images/covers/liszt-la-campanella.svg',
    badge: 'Virtuoso Bravura',
    quote: 'Lightning right-hand bell leaps across two octaves with crystalline trills.',
  },
  'kensuke-ushio-in-the-sea': {
    coverImage: '/images/covers/kensuke-ushio-in-the-sea.svg',
    badge: 'Chainsaw Man OST',
    quote: 'Deep ocean minimalist solitude, breath pauses, and emotive stillness.',
  },
  'hikaru-nara': {
    coverImage: '/images/your-lie-in-april-3840x2160-21020.jpg',
    badge: 'Anime Masterpiece',
    quote: 'Your Lie in April: radiant cherry blossoms, driving pulse, and heartfelt duet.',
  },
  'chopin-nocturne-c-sharp-minor': {
    coverImage: '/images/covers/chopin-nocturne-c-sharp-minor.svg',
    badge: 'Romantic Masterwork',
    quote: 'Poignant Parisian night reverie crowned by the famous 35-note downward arabesque.',
  },
  'joe-hisaishi-one-summers-day': {
    coverImage: '/images/covers/joe-hisaishi-one-summers-day.svg',
    badge: 'Studio Ghibli',
    quote: 'Nostalgic Spirited Away summer sky and sea railway across memory.',
  },
  'joe-hisaishi-merry-go-round': {
    coverImage: '/images/covers/joe-hisaishi-merry-go-round.svg',
    badge: "Howl's Moving Castle",
    quote: 'Swirling Viennese waltz dancing over alpine meadows and flying castles.',
  },
  'dj-okawari-flower-dance': {
    coverImage: '/images/covers/dj-okawari-flower-dance.svg',
    badge: 'Jazz-Hop Piano',
    quote: 'Relentless running 16th-note arpeggios dancing like sakura petals in the wind.',
  },
  'tony-ann-icarus': {
    coverImage: '/images/covers/tony-ann-icarus.svg',
    badge: 'Neoclassical Bravura',
    quote: 'Liquid 16th-note wave arpeggios and fortissimo double-octave climax.',
  },
  'abba-the-winner-takes-it-all': {
    coverImage: '/images/covers/abba-the-winner-takes-it-all.svg',
    badge: 'Pop Ballad Legend',
    quote: "Iconic Benny Andersson piano intro, dramatic bridge, and heartfelt double chorus.",
  },
  'handel-halvorsen-passacaglia': {
    coverImage: '/images/covers/handel-halvorsen-passacaglia.svg',
    badge: 'Baroque Fire',
    quote: 'Noble Baroque ground bass, cascading arpeggios, and thunderous octave climax.',
  },
  'beethoven-fur-elise': {
    coverImage: '/images/covers/beethoven-fur-elise.svg',
    badge: 'Classical Essential',
    quote: "The world's most beloved piano melody, complete with stormy middle episodes.",
  },
  'beethoven-moonlight-1': {
    coverImage: '/images/covers/beethoven-moonlight-1.svg',
    badge: 'Immortal Adagio',
    quote: 'Delicate undulating triplets and singing soprano melody beneath a silver moon.',
  },
  'bach-prelude-c': {
    coverImage: '/images/covers/bach-prelude-c.svg',
    badge: 'Keyboard Foundation',
    quote: 'Crystalline harmonic purity: the universal foundation of keyboard literature.',
  },
  'chopin-ballade-1': {
    coverImage: '/images/covers/chopin-ballade-1.svg',
    badge: 'Concert Masterpiece',
    quote: 'Complete 264-measure unabridged masterpiece from Largo to Presto con fuoco.',
  },
  'hanon-exercise-1': {
    coverImage: '/images/covers/hanon-exercise-1.svg',
    badge: 'Technique Drill',
    quote: 'Finger independence, high lift, and stretch agility between fingers 4 and 5.',
  },
};

const defaultScaleMeta = {
  coverImage: '/images/covers/scales-technique.svg',
  badge: 'Scale Foundation',
  quote: 'Essential finger coordination, thumb-under agility, and key signature mastery.',
};

let repoContent = fs.readFileSync('src/library/LibraryRepository.ts', 'utf8');

// For each piece in meta, replace its coverColor: '...' line with coverColor, coverImage, badge, quote
for (const [id, data] of Object.entries(meta)) {
  const pattern = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?coverColor:\\s*'[a-zA-Z0-9_\\-\\s\\/]+',)`, 'g');
  repoContent = repoContent.replace(pattern, (match) => {
    if (match.includes('coverImage:')) return match; // already injected
    return `${match}
      coverImage: '${data.coverImage}',
      badge: '${data.badge}',
      quote: '${data.quote.replace(/'/g, "\\'")}',`;
  });
}

// Also add defaultScaleMeta for scale items
const scaleIds = [
  'scale-c-major',
  'scale-g-major',
  'scale-d-major',
  'scale-a-minor',
  'scale-c-minor',
  'scale-chromatic',
  'tony-ann-icarus-arpeggio',
  'bach-minuet-g',
  'c-position-starter',
  'c-position-five-fingers'
];

for (const id of scaleIds) {
  const pattern = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?coverColor:\\s*'[a-zA-Z0-9_\\-\\s\\/]+',)`, 'g');
  repoContent = repoContent.replace(pattern, (match) => {
    if (match.includes('coverImage:')) return match;
    return `${match}
      coverImage: '${defaultScaleMeta.coverImage}',
      badge: '${defaultScaleMeta.badge}',
      quote: '${defaultScaleMeta.quote}',`;
  });
}

fs.writeFileSync('src/library/LibraryRepository.ts', repoContent, 'utf8');
console.log('Successfully enriched LibraryRepository with cover images, badges, and concert quotes!');
