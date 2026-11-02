import fs from 'fs'

// 1. Add complete note reading course to src/data/courses.ts
const coursesPath = 'src/data/courses.ts'
let coursesCode = fs.readFileSync(coursesPath, 'utf8')

const completeNoteReadingCourse = `  // 0. FLAGSHIP: VOLLSTÄNDIGES NOTENLESEN VON GRUND AUF (NOTE READING FROM ZERO)
  {
    id: 'course-complete-note-reading-from-zero',
    category: 'beginner',
    title: {
      en: 'Complete Note Reading from Zero',
      de: 'Notenlesen lernen von Grund auf',
      fr: 'Apprendre à lire les notes de zéro',
      ja: 'ゼロからの完全な楽譜の読み方',
      zh: '从零开始完全掌握五线谱',
    },
    subtitle: {
      en: 'Learn to read sheet music from scratch: Treble & Bass clefs, lines & spaces, rhythms, accidentals, and fluent sight-reading.',
      de: 'Lerne Notenlesen von Grund auf: Violin- & Bassschlüssel, Notenlinien, Zwischenräume, Notenwerte, Vorzeichen und flüssiges Prima-Vista-Spiel.',
      fr: 'Apprenez à lire les partitions : clés de sol et de fa, lignes et interlignes, rythmes et altérations.',
      ja: '五線の仕組み、ト音・ヘ音記号、リズム、臨時記号まで、ゼロから読譜を完全習得。',
      zh: '从第一根线开始，彻底搞懂高低音谱表、间与线、时值与升降号。',
    },
    lessonCount: 7,
    overallProgress: 0,
    coverGradient: 'from-emerald-600 via-teal-700 to-zinc-950',
    lessons: [
      {
        id: 'cnr-1',
        number: 1,
        title: {
          en: 'The Grand Staff & Middle C (The Anchor)',
          de: 'Das Notensystem & Schloss-C (Der Mittelpunkt)',
          fr: 'Le système et le Do central',
          ja: '大譜表と中央C（ランドマーク）',
          zh: '大谱表与中央C（核心地标音）',
        },
        durationMin: 7,
        progressPercent: 0,
        targetPieceId: 'c-position-starter',
        practiceVariant: 'wait-for-note',
        description: {
          en: 'Understand the 5 lines and 4 spaces. Locate Middle C (C4) on its ledger line between Treble and Bass.',
          de: 'Verstehe die 5 Linien und 4 Zwischenräume. Entdecke Schloss-C (C4) auf seiner Hilfslinie zwischen den Schlüsseln.',
          fr: 'Comprenez les 5 lignes et 4 interlignes. Repérez le Do central.',
          ja: '五線の5本の線と4つの間を学び、大譜表の中央Cを位置付けます。',
          zh: '认识五线四间，定位高低音谱表间夹线上的中央C。',
        },
      },
      {
        id: 'cnr-2',
        number: 2,
        title: {
          en: 'Treble Clef Lines & Spaces (Right Hand E4–F5)',
          de: 'Violinschlüssel: Linien E-G-B-D-F & F-A-C-E',
          fr: 'Clé de sol : lignes et interlignes',
          ja: 'ト音記号：線と間の音符 (E4〜F5)',
          zh: '高音谱表：线音与间音完全掌握',
        },
        durationMin: 10,
        progressPercent: 0,
        targetPieceId: 'c-position-five-fingers',
        practiceVariant: 'hands-separate-right',
        description: {
          en: 'Lines: E-G-B-D-F ("Every Good Boy Does Fine"). Spaces: F-A-C-E ("FACE"). Play them with the right hand.',
          de: 'Linien: E-G-H-D-F ("Eine Gans Brät Der Fuchs"). Räume: F-A-C-E ("FACE"). Spiele sie mit rechts.',
          fr: 'Lignes : Mi-Sol-Si-Ré-Fa. Interlignes : Fa-La-Do-Mi.',
          ja: '線音符と間音符の覚え方と、右手のポジション練習。',
          zh: '五条线上的E-G-B-D-F与四个间上的F-A-C-E。',
        },
      },
      {
        id: 'cnr-3',
        number: 3,
        title: {
          en: 'Bass Clef Lines & Spaces (Left Hand G2–A3)',
          de: 'Bassschlüssel: Linien G-B-D-F-A & A-C-E-G',
          fr: 'Clé de fa : main gauche (Sol2–La3)',
          ja: 'ヘ音記号：左手の線と間 (G2〜A3)',
          zh: '低音谱表：左手伴奏与低音线音',
        },
        durationMin: 10,
        progressPercent: 0,
        targetPieceId: 'bach-prelude-c',
        practiceVariant: 'hands-separate-left',
        description: {
          en: 'Lines: G-B-D-F-A ("Great Big Dogs Fight Animals"). Spaces: A-C-E-G ("All Cows Eat Grass").',
          de: 'Linien: G-H-D-F-A ("Guten Tag Des Abends"). Räume: A-C-E-G ("Alle Clowns Essen Gern").',
          fr: 'Lignes : Sol-Si-Ré-Fa-La. Interlignes : La-Do-Mi-Sol.',
          ja: 'ヘ音記号のランドマークと左手の安定した読譜。',
          zh: '掌握低音谱表的五条线与四个间，打牢伴奏基础。',
        },
      },
      {
        id: 'cnr-4',
        number: 4,
        title: {
          en: 'Note Values, Rhythms & Time Signatures',
          de: 'Notenwerte, Takte & Rhythmus (4/4 & 3/4)',
          fr: 'Valeurs de notes, rythmes et mesures',
          ja: '音符の長さ、拍子とリズム',
          zh: '音符时值、节拍与时值换算',
        },
        durationMin: 8,
        progressPercent: 0,
        targetPieceId: 'bach-minuet-g',
        practiceVariant: 'wait-for-note',
        description: {
          en: 'Whole (4 beats), Half (2 beats), Quarter (1 beat), 8th (1/2 beat). 4/4 March vs 3/4 Waltz rhythms.',
          de: 'Ganze (4 Schläge), Halbe (2), Viertel (1), Achtel (1/2). Der 4/4-Marschtakt vs. 3/4-Walzertakt.',
          fr: 'Ronde (4 temps), Blanche (2 temps), Noire (1 temps), Croche (1/2 temps).',
          ja: '全音符、2分音符、4分音符、8分音符と4/4拍子・3/4拍子。',
          zh: '全音符、二分音符、四分音符与八分音符的节拍与律动。',
        },
      },
      {
        id: 'cnr-5',
        number: 5,
        title: {
          en: 'Sharps (#), Flats (b) & Black Keys',
          de: 'Vorzeichen: Kreuz (#), Be (b) & Schwarze Tasten',
          fr: 'Dièses (#), Bémols (b) et touches noires',
          ja: 'シャープ(#)、フラット(b)、黒鍵の読み方',
          zh: '升号(#)、降号(b)与黑键识别',
        },
        durationMin: 12,
        progressPercent: 0,
        targetPieceId: 'scale-d-major',
        practiceVariant: 'original',
        description: {
          en: 'Semitones, sharps that raise pitch, flats that lower pitch, and the natural sign that cancels them.',
          de: 'Halbtonschritte, Kreuze (#) zur Erhöhung, Be (b) zur Erniedrigung und das Auflösungszeichen.',
          fr: 'Demi-tons, altérations et béquarre.',
          ja: '半音の仕組み、黒鍵と調号の読み方を学びます。',
          zh: '半音关系、升降调号与还原记号的实际弹奏。',
        },
      },
      {
        id: 'cnr-6',
        number: 6,
        title: {
          en: 'Ledger Lines Above & Below the Staff',
          de: 'Hilfslinien über & unter dem Notensystem',
          fr: 'Lignes supplémentaires au-dessus et en dessous',
          ja: '五線の上下の加線を読む',
          zh: '谱表上下加线极速定位',
        },
        durationMin: 10,
        progressPercent: 0,
        targetPieceId: 'beethoven-fur-elise',
        practiceVariant: 'hands-separate-right',
        description: {
          en: 'Expand your range: High soprano notes (A5, C6) and deep resonant bass notes (E2, C2).',
          de: 'Erweitere deinen Tonumfang: Hohe Diskant-Töne (A5, C6) und tiefe Bassnoten (E2, C2).',
          fr: 'Étendez votre tessiture vers l’aigu et le grave.',
          ja: '高い高音域と深い低音域の加線を迷わず読めるようにします。',
          zh: '突破五线界限，快速识记高音加线与低音加线。',
        },
      },
      {
        id: 'cnr-7',
        number: 7,
        title: {
          en: 'Real Repertoire Sight-Reading: Bach & Beethoven',
          de: 'Vom-Blatt-Spiel: J.S. Bach & Beethoven',
          fr: 'Lecture à vue : Bach et Beethoven',
          ja: '実践初見演奏：バッハとベートーヴェン',
          zh: '实战视奏：巴赫前奏曲与致爱丽丝',
        },
        durationMin: 15,
        progressPercent: 0,
        targetPieceId: 'beethoven-fur-elise',
        practiceVariant: 'original',
        description: {
          en: 'Put it all together: Read real scores seamlessly while listening to your acoustic piano!',
          de: 'Führe alles zusammen: Notenlesen in Echtzeit am Klavier mit automatischer Mikrofon-Rückmeldung!',
          fr: 'Jouez de vraies partitions en direct avec le micro de votre piano.',
          ja: 'マイク認識と連携し、本物の名曲を楽譜から直接演奏します。',
          zh: '将识谱能力转化为真正的钢琴演奏，配合麦克风原声识别。',
        },
      },
    ],
  },
`

coursesCode = coursesCode.replace(
  'export const coursesData: Course[] = [\n  // 1. ANFÄNGERKURSE (BEGINNER COURSES)',
  'export const coursesData: Course[] = [\n' + completeNoteReadingCourse + '  // 1. ANFÄNGERKURSE (BEGINNER COURSES)'
)

fs.writeFileSync(coursesPath, coursesCode, 'utf8')
console.log('Successfully added Complete Note Reading course to src/data/courses.ts!')
