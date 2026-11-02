// Flowkey Courses & Curriculum Data Model
// Matches Flowkey Curriculum & Masterclasses

import type { PracticeVariant } from '../types/music'

export interface CourseLesson {
  id: string
  number: number
  title: {
    en: string
    de: string
    fr: string
    ja: string
    zh: string
  }
  durationMin: number
  progressPercent: number
  targetPieceId: string
  practiceVariant?: PracticeVariant
  description?: {
    en: string
    de: string
    fr: string
    ja: string
    zh: string
  }
}

export interface Course {
  id: string
  category: 'beginner' | 'technique' | 'scales' | 'chords'
  title: {
    en: string
    de: string
    fr: string
    ja: string
    zh: string
  }
  subtitle: {
    en: string
    de: string
    fr: string
    ja: string
    zh: string
  }
  lessonCount: number
  overallProgress: number
  coverGradient: string
  lessons: CourseLesson[]
}

export const coursesData: Course[] = [
  // 1. ANFÄNGERKURSE (BEGINNER COURSES)
  {
    id: 'course-first-steps',
    category: 'beginner',
    title: {
      en: 'First Steps & Posture',
      de: 'Die ersten Schritte',
      fr: 'Premiers pas au piano',
      ja: 'はじめの一歩',
      zh: '钢琴入门第一步',
    },
    subtitle: {
      en: 'Learn piano fundamentals: hand posture, note values, and your first melodies.',
      de: 'Lerne die Grundlagen des Klavierspielens: Haltung, Notenwerte und deine ersten Melodien.',
      fr: 'Apprenez les bases du piano : posture, valeurs de notes et premières mélodies.',
      ja: '姿勢、音符の長さ、最初のメロディなど、ピアノの基礎を学びます。',
      zh: '掌握坐姿手型、音符时值与第一首旋律。',
    },
    lessonCount: 4,
    overallProgress: 75,
    coverGradient: 'from-amber-500 to-amber-700',
    lessons: [
      {
        id: 'fs-1',
        number: 1,
        title: {
          en: 'Correct Posture & Hand Position',
          de: 'Die richtige Haltung & Handposition',
          fr: 'Posture et position des mains',
          ja: '正しい姿勢と手のポジション',
          zh: '正确的坐姿与手型',
        },
        durationMin: 5,
        progressPercent: 100,
        targetPieceId: 'c-position-starter',
        practiceVariant: 'hands-separate-right',
      },
      {
        id: 'fs-2',
        number: 2,
        title: {
          en: 'First Notes in C Position (C-D-E)',
          de: 'Die ersten Töne: C-D-E in C-Lage',
          fr: 'Premières notes en position de Do',
          ja: 'Cポジションの最初の音 (C-D-E)',
          zh: 'C大调五指原位第一组音',
        },
        durationMin: 8,
        progressPercent: 100,
        targetPieceId: 'c-position-starter',
        practiceVariant: 'wait-for-note',
      },
      {
        id: 'fs-3',
        number: 3,
        title: {
          en: 'The 5-Finger Wave & Triad (C-D-E-F-G)',
          de: 'Die 5-Finger-Welle & Dreiklang',
          fr: 'La vague à 5 doigts et l’accord parfait',
          ja: '5指の波と和音のアルペジオ',
          zh: '五指流动与三和弦琶音',
        },
        durationMin: 10,
        progressPercent: 80,
        targetPieceId: 'c-position-five-fingers',
        practiceVariant: 'wait-for-note',
      },
      {
        id: 'fs-4',
        number: 4,
        title: {
          en: 'Beethoven: Ode to Joy (Full Theme)',
          de: 'Beethoven: Ode an die Freude (Komplette Melodie)',
          fr: 'Beethoven : Hymne à la Joie (Thème complet)',
          ja: 'ベートーヴェン：歓喜の歌 (完全版)',
          zh: '贝多芬：欢乐颂完整主题实战',
        },
        durationMin: 12,
        progressPercent: 50,
        targetPieceId: 'beethoven-ode-to-joy',
        practiceVariant: 'original',
      },
    ],
  },
  {
    id: 'course-both-hands',
    category: 'beginner',
    title: {
      en: 'Playing with Both Hands',
      de: 'Klavierspielen mit beiden Händen',
      fr: 'Jouer à deux mains',
      ja: '両手で弾く',
      zh: '双手配合练习',
    },
    subtitle: {
      en: 'Master hand coordination, bass clef accompaniment, and seamless synchronization.',
      de: 'Meistere Hand-Koordination, Bassbegleitung und nahtloses Zusammenspiel beider Hände.',
      fr: 'Maîtrisez la coordination des mains et l’accompagnement en clé de fa.',
      ja: '両手の協調、ヘ音記号の伴奏、スムーズな連携を習得します。',
      zh: '学习双手独立协调与低音谱号伴奏。',
    },
    lessonCount: 3,
    overallProgress: 45,
    coverGradient: 'from-amber-600 to-orange-800',
    lessons: [
      {
        id: 'bh-1',
        number: 1,
        title: {
          en: 'Left Hand Bass Clef Foundation',
          de: 'Linke Hand Bass-Grundlagen',
          fr: 'Fondations main gauche en clé de fa',
          ja: '左手・ヘ音記号の基礎',
          zh: '左手低音基础训练',
        },
        durationMin: 8,
        progressPercent: 100,
        targetPieceId: 'bach-prelude-c',
        practiceVariant: 'hands-separate-left',
      },
      {
        id: 'bh-2',
        number: 2,
        title: {
          en: 'Coordinating Left & Right Hands',
          de: 'Koordination beider Hände',
          fr: 'Coordination mains gauche et droite',
          ja: '左右両手のタイミング調整',
          zh: '左右手对位协调',
        },
        durationMin: 12,
        progressPercent: 35,
        targetPieceId: 'bach-prelude-c',
        practiceVariant: 'wait-for-note',
      },
      {
        id: 'bh-3',
        number: 3,
        title: {
          en: 'Bach: Prelude in C Major (Flowing Hands)',
          de: 'J.S. Bach: Präludium C-Dur (Fließendes Spiel)',
          fr: 'J.S. Bach : Prélude en Do Majeur',
          ja: 'バッハ：プレリュード ハ長調',
          zh: '巴赫：C大调前奏曲（流畅琶音）',
        },
        durationMin: 15,
        progressPercent: 0,
        targetPieceId: 'bach-prelude-c',
        practiceVariant: 'original',
      },
    ],
  },
  {
    id: 'course-note-reading',
    category: 'beginner',
    title: {
      en: 'Note Reading & Landmark Keys',
      de: 'Notenlesen & Orientierung',
      fr: 'Lecture de notes et repères',
      ja: '楽譜の読み方とランドマーク',
      zh: '五线谱速读与地标音',
    },
    subtitle: {
      en: 'Master Middle C, Treble G, Bass F landmarks, and ledger line navigation.',
      de: 'Meistere das Schloss-C, den G- und F-Schlüssel sowie Hilfslinien.',
      fr: 'Maîtrisez le Do central, les clés de sol et de fa, et les lignes supplémentaires.',
      ja: '中央C、ト音記号のG、ヘ音記号のFのランドマークを完全に覚えます。',
      zh: '掌握中央C、高音G、低音F核心地标音与加线读谱。',
    },
    lessonCount: 3,
    overallProgress: 60,
    coverGradient: 'from-blue-600 to-indigo-900',
    lessons: [
      {
        id: 'nr-1',
        number: 1,
        title: {
          en: 'Landmark Notes (Middle C, Treble G, Bass F)',
          de: 'Anker-Töne (Schloss-C, G-Schlüssel, F-Schlüssel)',
          fr: 'Notes repères (Do central, Sol clé de sol, Fa clé de fa)',
          ja: '3大ランドマーク音のマスター',
          zh: '三大地标音定位',
        },
        durationMin: 10,
        progressPercent: 100,
        targetPieceId: 'bach-minuet-g',
        practiceVariant: 'wait-for-note',
      },
      {
        id: 'nr-2',
        number: 2,
        title: {
          en: 'Reading Ledger Lines Above & Below Staff',
          de: 'Hilfslinien über und unter dem System',
          fr: 'Lignes supplémentaires au-dessus et en dessous',
          ja: '五線の上下の加線を読む',
          zh: '谱表上下加线极速识记',
        },
        durationMin: 12,
        progressPercent: 50,
        targetPieceId: 'bach-minuet-g',
        practiceVariant: 'hands-separate-right',
      },
      {
        id: 'nr-3',
        number: 3,
        title: {
          en: 'J.S. Bach: Minuet in G (Reading in Action)',
          de: 'J.S. Bach: Menuett in G-Dur (Praxis-Stück)',
          fr: 'J.S. Bach : Menuet en Sol Majeur',
          ja: 'バッハ：メヌエット ト長調 (実践)',
          zh: '巴赫：G大调小步舞曲（识谱实战）',
        },
        durationMin: 15,
        progressPercent: 30,
        targetPieceId: 'bach-minuet-g',
        practiceVariant: 'original',
      },
    ],
  },

  // 2. FINGERTECHNIK & GELÄUFIGKEIT (TECHNIQUE & DRILLS)
  {
    id: 'course-fingering-mastery',
    category: 'technique',
    title: {
      en: 'Fingering Mastery & Biomechanics',
      de: 'Fingersatz-Meisterschaft & Biomechanik',
      fr: 'Doigtés anatomiques et biomécanique',
      ja: '運指マスターとピアノ生体力学',
      zh: '钢琴指法规范与人体工学',
    },
    subtitle: {
      en: 'Thumb-under passage (1-2-3-1), silent finger substitution, and Hanon velocity.',
      de: 'Daumen-Untersatz (1-2-3-1), stummer Fingerwechsel und Hanon-Geläufigkeit.',
      fr: 'Passage du pouce, substitution muette et vélocité selon Hanon.',
      ja: '親指のくぐらせ方、無音指替え、ハノンの独立強化。',
      zh: '大拇指穿指跨指、无声换指与哈农高抬指独立性。',
    },
    lessonCount: 3,
    overallProgress: 35,
    coverGradient: 'from-amber-600 to-red-950',
    lessons: [
      {
        id: 'fm-1',
        number: 1,
        title: {
          en: 'Hanon Exercise No. 1 (High Finger Lift)',
          de: 'Hanon-Übung Nr. 1 (Hohe Fingerhebung)',
          fr: 'Hanon Exercice N° 1 (Levée des doigts)',
          ja: 'ハノン第1番 (指の独立とハイフィンガー)',
          zh: '哈农第1课（手指高抬与颗粒感）',
        },
        durationMin: 12,
        progressPercent: 70,
        targetPieceId: 'hanon-exercise-1',
        practiceVariant: 'wait-for-note',
      },
      {
        id: 'fm-2',
        number: 2,
        title: {
          en: 'Fingers 4 & 5 Independence Drill',
          de: 'Unabhängigkeit für Ringfinger & Kleiner Finger',
          fr: 'Indépendance des doigts 4 et 5',
          ja: '第4指・第5指の独立強化',
          zh: '4指与5指弱指支撑与独立发力',
        },
        durationMin: 15,
        progressPercent: 35,
        targetPieceId: 'hanon-exercise-1',
        practiceVariant: 'original',
      },
      {
        id: 'fm-3',
        number: 3,
        title: {
          en: 'Silent Finger Substitution on Held Keys',
          de: 'Stummer Fingerwechsel auf gehaltenen Tasten',
          fr: 'Substitution muette de doigts sur notes tenues',
          ja: '保持音上の無音指替え奏法',
          zh: '长音保持键上的无声换指技术',
        },
        durationMin: 15,
        progressPercent: 0,
        targetPieceId: 'beethoven-fur-elise',
        practiceVariant: 'hands-separate-right',
      },
    ],
  },

  // 3. ÜBUNGEN & TONLEITERN (EXERCISES & SCALES)
  {
    id: 'course-scales-major',
    category: 'scales',
    title: {
      en: 'Playing Scales I: Major Scales (C, G, D, F)',
      de: 'Tonleitern üben I: Dur-Tonleitern (C, G, D, F)',
      fr: 'Gammes I : Gammes majeures (Do, Sol, Ré, Fa)',
      ja: '音階練習 I：長音階 (C, G, D, F)',
      zh: '音阶专练 I：大调音阶 (C, G, D, F)',
    },
    subtitle: {
      en: 'Master thumb tucks (1-2-3-1), finger velocity, and authentic key signatures.',
      de: 'Meistere den Daumen-Untersatz (1-2-3-1), Fingergeläufigkeit und Vorzeichen.',
      fr: 'Maîtrisez le passage du pouce, la vélocité et les armures.',
      ja: '親指のくぐらせ方、指の敏捷性、調号の感覚を磨きます。',
      zh: '掌握穿指跨指技术、运指速度与调号规范。',
    },
    lessonCount: 4,
    overallProgress: 60,
    coverGradient: 'from-emerald-600 to-teal-900',
    lessons: [
      {
        id: 'sm-1',
        number: 1,
        title: {
          en: 'C Major Scale (Right Hand & Thumb Tuck)',
          de: 'C-Dur Tonleiter (Rechte Hand & Daumen-Untersatz)',
          fr: 'Gamme de Do Majeur (Main droite & passage du pouce)',
          ja: 'Cメジャー音階 (右手と親指くぐり)',
          zh: 'C大调音阶（右手穿指规范）',
        },
        durationMin: 10,
        progressPercent: 100,
        targetPieceId: 'scale-c-major',
        practiceVariant: 'hands-separate-right',
      },
      {
        id: 'sm-2',
        number: 2,
        title: {
          en: 'C Major Scale (Both Hands Synchronized)',
          de: 'C-Dur Tonleiter (Beide Hände synchron)',
          fr: 'Gamme de Do Majeur (Deux mains synchronisées)',
          ja: 'Cメジャー音階 (両手シンクロ)',
          zh: 'C大调音阶（双手同向齐奏）',
        },
        durationMin: 12,
        progressPercent: 80,
        targetPieceId: 'scale-c-major',
        practiceVariant: 'original',
      },
      {
        id: 'sm-3',
        number: 3,
        title: {
          en: 'G Major Scale with F# (Black Key Navigation)',
          de: 'G-Dur Tonleiter mit F# (Schwarze Taste)',
          fr: 'Gamme de Sol Majeur avec Fa#',
          ja: 'Gメジャー音階とF# (黒鍵の攻略)',
          zh: 'G大调音阶与F#黑键运指',
        },
        durationMin: 14,
        progressPercent: 60,
        targetPieceId: 'scale-g-major',
        practiceVariant: 'original',
      },
      {
        id: 'sm-4',
        number: 4,
        title: {
          en: 'Speed Velocity & Metronome Ramp',
          de: 'Geschwindigkeit & Gleichmäßigkeit',
          fr: 'Vélocité et régularité au métronome',
          ja: 'テンポアップとメトロノーム練習',
          zh: '速度与节拍器递增强化',
        },
        durationMin: 15,
        progressPercent: 0,
        targetPieceId: 'scale-c-major',
        practiceVariant: 'wait-for-note',
      },
    ],
  },
  {
    id: 'course-scales-minor',
    category: 'scales',
    title: {
      en: 'Playing Scales II: Minor Scales & Arpeggios',
      de: 'Tonleitern üben II: Moll-Tonleitern & Arpeggien',
      fr: 'Gammes II : Gammes mineures et arpèges',
      ja: '音階練習 II：短音階とアルペジオ',
      zh: '音阶专练 II：小调音阶与琶音',
    },
    subtitle: {
      en: 'Conquer harmonic minor leading tones (G#), stretching, and Für Elise arpeggios.',
      de: 'Beherrsche den Leitton (G#), Handdehnung und Arpeggien für Für Elise.',
      fr: 'Explorez la note sensible, les extensions et les arpèges de La lettre à Élise.',
      ja: '和声的短音階の導音(G#)やエリーゼのためにのアルペジオを攻略します。',
      zh: '攻克和声小调导音(G#)、手指伸展与致爱丽丝分解和弦。',
    },
    lessonCount: 3,
    overallProgress: 30,
    coverGradient: 'from-purple-600 to-indigo-950',
    lessons: [
      {
        id: 'smi-1',
        number: 1,
        title: {
          en: 'A Harmonic Minor Scale (G# Augmented Second)',
          de: 'A-Moll Harmonisch (G# Übermäßige Sekunde)',
          fr: 'Gamme de La mineur harmonique (Seconde augmentée)',
          ja: 'Aハーモニックマイナー (G#と増2度)',
          zh: 'A和声小调音阶（G#与增二度音程）',
        },
        durationMin: 12,
        progressPercent: 90,
        targetPieceId: 'scale-a-minor',
        practiceVariant: 'original',
      },
      {
        id: 'smi-2',
        number: 2,
        title: {
          en: 'Arpeggios & Wrist Rolling (A minor & E major)',
          de: 'Arpeggien & Handgelenks-Rotation',
          fr: 'Arpèges et souplesse du poignet',
          ja: 'アルペジオと手首のローリング運動',
          zh: '琶音与手腕侧向重量转移',
        },
        durationMin: 15,
        progressPercent: 0,
        targetPieceId: 'beethoven-fur-elise',
        practiceVariant: 'hands-separate-left',
      },
      {
        id: 'smi-3',
        number: 3,
        title: {
          en: 'Beethoven: Für Elise (Main Theme in A minor)',
          de: 'Für Elise – Hauptthema in A-Moll',
          fr: 'Lettre à Élise – Thème principal en La mineur',
          ja: 'エリーゼのために – Aマイナーメインテーマ',
          zh: '致爱丽丝 – A小调经典主旋律',
        },
        durationMin: 20,
        progressPercent: 0,
        targetPieceId: 'beethoven-fur-elise',
        practiceVariant: 'original',
      },
    ],
  },
  {
    id: 'course-virtuoso-ladders',
    category: 'scales',
    title: {
      en: 'Concert Leitern & Neoclassical Waves',
      de: 'Konzert-Tonleitern & Neoklassische Wellen',
      fr: 'Gammes de concert et vagues néoclassiques',
      ja: '演奏会用音階とネオクラシック・ウェーブ',
      zh: '演奏级音阶与新古典琶音浪潮',
    },
    subtitle: {
      en: 'Master C minor, D major, chromatic speed, and Tony Ann ICARUS arpeggio cascades.',
      de: 'Meistere C-Moll, D-Dur, chromatische Geläufigkeit und Tony Ann ICARUS Arpeggio-Kaskaden.',
      fr: 'Maîtrisez Do mineur, Ré majeur, la vélocité chromatique et les arpèges d’Icarus.',
      ja: 'Cマイナー、Dメジャー、半音階、トニー・アンのICARUSアルペジオを完全習得。',
      zh: '攻克C小调、D大调、半音阶速度与Tony Ann ICARUS琶音技术。',
    },
    lessonCount: 4,
    overallProgress: 45,
    coverGradient: 'from-amber-600 to-red-950',
    lessons: [
      {
        id: 'vl-1',
        number: 1,
        title: {
          en: 'D Major Scale (2 Sharps: F#, C#)',
          de: 'Tonleiter D-Dur (2 Vorzeichen: F#, C#)',
          fr: 'Gamme de Ré Majeur (Fa#, Do#)',
          ja: 'Dメジャー音階 (2つのシャープ)',
          zh: 'D大调音阶（F#与C#穿指）',
        },
        durationMin: 12,
        progressPercent: 100,
        targetPieceId: 'scale-d-major',
        practiceVariant: 'original',
      },
      {
        id: 'vl-2',
        number: 2,
        title: {
          en: 'C Harmonic Minor Scale (ICARUS Foundation)',
          de: 'C-Moll Harmonisch (ICARUS Grundlage)',
          fr: 'Gamme de Do mineur harmonique',
          ja: 'Cハーモニックマイナー (ICARUSの基礎)',
          zh: 'C和声小调音阶（ICARUS核心调性）',
        },
        durationMin: 14,
        progressPercent: 75,
        targetPieceId: 'scale-c-minor',
        practiceVariant: 'original',
      },
      {
        id: 'vl-3',
        number: 3,
        title: {
          en: 'Chromatic Scale Ladder (Pure Velocity)',
          de: 'Chromatische Tonleiter (Reine Geläufigkeit)',
          fr: 'Gamme chromatique (Pure vélocité)',
          ja: '半音階スケール (圧倒的敏捷性)',
          zh: '半音阶梯子（指法极速强化）',
        },
        durationMin: 15,
        progressPercent: 40,
        targetPieceId: 'scale-chromatic',
        practiceVariant: 'original',
      },
      {
        id: 'vl-4',
        number: 4,
        title: {
          en: 'Tony Ann: ICARUS Wave Arpeggio Cascade',
          de: 'Tony Ann: ICARUS Wellen-Arpeggio Kaskade',
          fr: 'Tony Ann : Cascades d’arpèges ICARUS',
          ja: 'トニー・アン：ICARUS 16分音符ウェーブアルペジオ',
          zh: 'Tony Ann：ICARUS 十六分音符琶音连绵浪潮',
        },
        durationMin: 18,
        progressPercent: 20,
        targetPieceId: 'tony-ann-icarus-arpeggio',
        practiceVariant: 'original',
      },
    ],
  },

  // 4. AKKORDE & IMPROVISATION (CHORDS & IMPROVISATION)
  {
    id: 'course-chords-pop',
    category: 'chords',
    title: {
      en: 'Mastering Chord Accompaniment',
      de: 'Akkordbegleitung meistern',
      fr: 'Maîtriser l’accompagnement d’accords',
      ja: 'コード伴奏のマスター',
      zh: '和弦伴奏进阶',
    },
    subtitle: {
      en: 'Play the iconic 4 chords (C - G - Am - F) behind hundreds of hit songs.',
      de: 'Spiele die 4 Hit-Akkorde (C - G - Am - F) hinter hunderten berühmten Songs.',
      fr: 'Jouez les 4 accords incontournables (Do - Sol - Lam - Fa) de centaines de tubes.',
      ja: '何百もの名曲に使われる王道4コード (C - G - Am - F) をマスター。',
      zh: '掌握流行与古典核心4和弦 (C - G - Am - F) 编配。',
    },
    lessonCount: 4,
    overallProgress: 50,
    coverGradient: 'from-violet-600 to-purple-950',
    lessons: [
      {
        id: 'cp-1',
        number: 1,
        title: {
          en: 'The 4 Hit Chords (Root Inversions)',
          de: 'Die 4 Hit-Akkorde (Grundstellung & Umkehrung)',
          fr: 'Les 4 accords incontournables (Positions)',
          ja: '王道4コード (基本形と転回形)',
          zh: '4大核心和弦（原位与转位切换）',
        },
        durationMin: 12,
        progressPercent: 100,
        targetPieceId: 'course-4-chords',
        practiceVariant: 'original',
      },
      {
        id: 'cp-2',
        number: 2,
        title: {
          en: 'Rhythmic Patterns & Arpeggiated Chords',
          de: 'Rhythmische Muster & Arpeggierte Begleitung',
          fr: 'Motifs rythmiques et accords arpégés',
          ja: 'リズムパターンとアルペジオ伴奏',
          zh: '伴奏织体变化与分解和弦律动',
        },
        durationMin: 15,
        progressPercent: 60,
        targetPieceId: 'course-4-chords',
        practiceVariant: 'wait-for-note',
      },
      {
        id: 'cp-3',
        number: 3,
        title: {
          en: 'Left-Hand Bass Drone & Voicing',
          de: 'Linke Hand Bassfundament & Stimmführung',
          fr: 'Basse main gauche et conduite des voix',
          ja: '左手ベースラインとコードのボイシング',
          zh: '左手低音根音与声部连接',
        },
        durationMin: 14,
        progressPercent: 25,
        targetPieceId: 'course-4-chords',
        practiceVariant: 'hands-separate-left',
      },
      {
        id: 'cp-4',
        number: 4,
        title: {
          en: 'ABBA: The Winner Takes It All (Pop Masterclass)',
          de: 'ABBA: The Winner Takes It All (Meisterwerk)',
          fr: 'ABBA : The Winner Takes It All (Grand classique)',
          ja: 'ABBA：ザ・ウィナー (ポップス実践)',
          zh: 'ABBA：胜者为王（流行伴奏殿堂实战）',
        },
        durationMin: 18,
        progressPercent: 0,
        targetPieceId: 'abba-the-winner-takes-it-all',
        practiceVariant: 'wait-for-note',
      },
    ],
  },
]
