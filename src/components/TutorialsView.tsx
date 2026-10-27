import React from 'react'
import type { Piece } from '../types/music'
import { translations, type LanguageCode } from '../i18n/translations'
import {
  GraduationCap,
  Play,
  ExternalLink,
  Flame,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Volume2,
  Sliders,
  AlertTriangle,
  X,
} from 'lucide-react'

interface TutorialLesson {
  id: string
  title: string
  subtitle: string
  chapterNumber: number
  measureRange: [number, number]
  tempoRecommendation: number
  youtubeTimestampUrl: string
  videoTimestampText: string
  focusArea: string
  pedalTip: string
  wristGuidance: string
  commonPitfall: string
  badge: 'pedagogy' | 'technique' | 'sightreading' | 'acoustics'
}

interface TutorialsViewProps {
  language: LanguageCode
  onLaunchPracticePassage: (startMeasure: number, endMeasure: number, tempoRate: number) => void
  onSwitchToSightReading: () => void
  onSwitchToWarmups: () => void
  onClose?: () => void
  piece: Piece
}

export const TutorialsView: React.FC<TutorialsViewProps> = ({
  language,
  onLaunchPracticePassage,
  onSwitchToSightReading,
  onSwitchToWarmups,
  onClose,
  piece,
}) => {
  const t = translations[language].tutorials

  const lessons: TutorialLesson[] = [
    {
      id: 'lesson-1',
      chapterNumber: 1,
      title: language === 'de' ? 'Das majestätische Largo (Takte 1–7)' : language === 'fr' ? 'L’Ouverture Majestueuse Largo (Mesures 1–7)' : language === 'ja' ? '荘厳なラルゴ序奏（第1〜7小節）' : language === 'zh' ? '庄严的广板开篇 Largo（第1–7小节）' : 'The Majestic Opening Largo (Measures 1–7)',
      subtitle: language === 'de' ? 'Schwereübertragung, Vorhalt & präzises Nachpedalieren' : language === 'fr' ? 'Transfert de poids et synchronisation de demi-pédale' : language === 'ja' ? '腕の重み移動とハーフペダルの余韻保持' : language === 'zh' ? '手臂重力落键与半踏板共鸣控制' : 'Arm weight transfer, declamatory voicing & syncopated pedaling',
      measureRange: [1, 7],
      tempoRecommendation: 0.65,
      youtubeTimestampUrl: 'https://www.youtube.com/watch?v=gYUa-2L7ryY&t=0s',
      videoTimestampText: '0:00 - 1:45',
      focusArea: language === 'de' ? 'Klangfarben-Öffnung & Dämpfer-Aufnahme' : language === 'fr' ? 'Ouverture harmonique & gestion du souffle' : language === 'ja' ? '響きの広がりとダンパーの踏み替え' : language === 'zh' ? '如歌宣告性开篇与踏板余音' : 'Harmonic bloom & slow arm weight release',
      pedalTip: language === 'de' ? 'Roland CC64 auf ca. 60–80 (Halbpedal). Erst nach dem Tastenanschlag fangen (Nachpedalieren).' : language === 'fr' ? 'Demi-pédale Roland CC64 (60–80). Attraper la résonance après l’attaque.' : language === 'ja' ? 'Roland CC64を60〜80（ハーフペダル）に保持。打鍵直後に踏み替えます。' : language === 'zh' ? 'Roland CC64 半踏板深度保持在 60–80，击弦后瞬间踩下捕捉余音。' : 'Roland CC64 at ~60-80 (Half-Pedal). Catch dampers strictly AFTER the note attack to preserve acoustic clarity.',
      wristGuidance: language === 'de' ? 'Handgelenk tief absenken und beim letzten Ton C4 elastisch nach oben ausschwingen.' : language === 'fr' ? 'Descendez le poignet avec souplesse et remontez doucement sur le dernier C4.' : language === 'ja' ? '手首をしなやかに沈め、最後のC4でふわりと持ち上げます。' : language === 'zh' ? '手腕自然下沉，在最后一个 C4 音上伴随手臂呼吸轻柔弹起。' : 'Drop arm weight deeply into the keys with loose knuckles; lift the wrist smoothly upward on the final C4.',
      commonPitfall: language === 'de' ? 'Zu schnelles Herunterdrücken des Pedals führt zu dumpfem Dröhnen.' : language === 'fr' ? 'Enfoncer la pédale trop tôt crée un flou dissonant.' : language === 'ja' ? '打鍵前にペダルを踏むと音が濁ってしまいます。' : language === 'zh' ? '击键前过早踩死踏板会导致和声浑浊杂乱。' : 'Depressing the pedal before the key bottom creates muddy harmonic smearing.',
      badge: 'pedagogy',
    },
    {
      id: 'lesson-2',
      chapterNumber: 2,
      title: language === 'de' ? 'Das Moderato Cantabile Thema (Takte 8–35)' : language === 'fr' ? 'Le Thème Cantabile Moderato (Mesures 8–35)' : language === 'ja' ? '歌うようなモデラート主題（第8〜35小節）' : language === 'zh' ? '如歌的中板主题 Cantabile（第8–35小节）' : 'The Moderato Cantabile Theme (Measures 8–35)',
      subtitle: language === 'de' ? 'Melodieführung im 5. Finger über schwebendem Walzer-Bass' : language === 'fr' ? 'Chant du 5e doigt sur accompagnement de valse fluide' : language === 'ja' ? '左手のワルツ伴奏と小指（第5指）の伸びやかな旋律歌唱' : language === 'zh' ? '右手小指如歌旋律与左手轻盈圆舞曲低音' : 'Cantabile voicing on the 5th finger over floating LH waltz harmony',
      measureRange: [8, 20],
      tempoRecommendation: 0.8,
      youtubeTimestampUrl: 'https://www.youtube.com/watch?v=gYUa-2L7ryY&t=105s',
      videoTimestampText: '1:45 - 4:15',
      focusArea: language === 'de' ? 'Klangbalance Sopran vs. Begleitung' : language === 'fr' ? 'Équilibre chant et accompagnement' : language === 'ja' ? '右手主旋律と左手伴奏のバランス' : language === 'zh' ? '高音声部穿透力与低音弹性' : 'Soprano voice projection & subtle rubato',
      pedalTip: language === 'de' ? 'Pedal auf Zählzeit 3 sanft lösen, um der Melodie Atempause zu geben.' : language === 'fr' ? 'Relâchez la pédale sur le 3e temps pour laisser respirer la phrase.' : language === 'ja' ? '第3拍でペダルを浅く戻し、息継ぎの余白を作ります。' : language === 'zh' ? '在第3拍轻抬半踏板，让如歌的旋律拥有自然的呼吸空隙。' : 'Lightly release damper to 30 on beat 3 so the phrase can breathe before the next downbeat.',
      wristGuidance: language === 'de' ? 'Seitliche Neigung des Handgelenks zur Außenkante der Hand (5. Finger).' : language === 'fr' ? 'Inclinez légèrement la main vers le 5e doigt pour projeter le timbre.' : language === 'ja' ? '手首をわずかに外側（小指側）へ傾け、豊かな響きを支えます。' : language === 'zh' ? '手腕微向外侧（小指侧）倾斜，让手臂重量自然灌注到旋律线条。' : 'Tilt forearm weight slightly outward towards the 5th finger to produce a warm bell-like cantabile.',
      commonPitfall: language === 'de' ? 'Zu laute linke Hand verdeckt die melancholische Chopin-Melodie.' : language === 'fr' ? 'Main gauche trop présente qui écrase la mélodie mélancolique.' : language === 'ja' ? '左手が強すぎて繊細なショパンの旋律をかき消してしまうこと。' : language === 'zh' ? '左手伴奏过响，掩盖了肖邦标志性的忧郁歌唱旋律。' : 'Heavy left-hand chords drowning the delicate right-hand soprano narrative.',
      badge: 'pedagogy',
    },
    {
      id: 'lesson-3',
      chapterNumber: 3,
      title: language === 'de' ? 'Der dramatische Agitato Übergang (Takte 36–67)' : language === 'fr' ? 'La Transition Dramatique Agitato (Mesures 36–67)' : language === 'ja' ? '劇的なアジタート展開部（第36〜67小節）' : language === 'zh' ? '激动的过渡段 Agitato（第36–67小节）' : 'The Dramatic Agitato Transition (Measures 36–67)',
      subtitle: language === 'de' ? 'Handgelenkskreise & Spannungsabbau bei hoher Notendichte' : language === 'fr' ? 'Cercles de poignet et relâchement des avant-bras' : language === 'ja' ? '腕の脱力と手首の円運動による加速' : language === 'zh' ? '手腕画圈运动与前臂肌肉深度放松' : 'Elliptical wrist circles and tension release in accelerating arpeggios',
      measureRange: [36, 50],
      tempoRecommendation: 0.75,
      youtubeTimestampUrl: 'https://www.youtube.com/watch?v=gYUa-2L7ryY&t=260s',
      videoTimestampText: '4:20 - 7:30',
      focusArea: language === 'de' ? 'Geschmeidiger Übergang ohne Verkrampfung' : language === 'fr' ? 'Transition fluide sans contraction musculaire' : language === 'ja' ? '前腕の脱力とスムーズなポジション移動' : language === 'zh' ? '高速跑动中的前臂防酸痛脱力技巧' : 'Forearm relaxation under sustained accelerando',
      pedalTip: language === 'de' ? 'Flatterpedal bei rasanten harmonischen Wechseln einsetzen.' : language === 'fr' ? 'Pédale vibrée (flutter) lors des changements d’accords rapides.' : language === 'ja' ? '和音交代が速いパッセージではフラッターペダル（浅い小刻みな踏み替え）を使用。' : language === 'zh' ? '在和声密集跑动处使用颤动踏板（Flutter Pedal），防浑浊。' : 'Use flutter pedaling (rapid micro-releases) during dense harmonic shifts.',
      wristGuidance: language === 'de' ? 'Kleine, fließende elliptische Kreise mit dem Handgelenk zeichnen.' : language === 'fr' ? 'Effectuez de légers cercles elliptiques du poignet pour libérer les tendons.' : language === 'ja' ? '手首で小さな楕円を描くように動かし、腱の緊張を逃がします。' : language === 'zh' ? '手腕在琴键上方顺势画出平滑的椭圆弧线，释放肌腱负荷。' : 'Draw supple elliptical circles with your wrist to transfer momentum without locking flexor tendons.',
      commonPitfall: language === 'de' ? 'Erstarren des Handgelenks führt zu Ermüdung und ungleichmäßigem Ton.' : language === 'fr' ? 'Poignet figé causant fatigue et inégalité sonore.' : language === 'ja' ? '手首が固まり、腕が疲労して打鍵が不揃いになること。' : language === 'zh' ? '手腕僵死导致前臂肌肉酸痛紧绷、音色干硬不均。' : 'Locking the wrist joint, causing immediate forearm burn and rhythmic unevenness.',
      badge: 'technique',
    },
    {
      id: 'lesson-4',
      chapterNumber: 4,
      title: language === 'de' ? 'Die virtuose Coda: Presto con fuoco (Takte 208–264)' : language === 'fr' ? 'La Coda Virtuose : Presto con fuoco (Mesures 208–264)' : language === 'ja' ? '超絶技巧コーダ：プレスト・コン・フォーコ（第208〜264小節）' : language === 'zh' ? '终曲烈火般的急板 Coda: Presto con fuoco（第208–264小节）' : 'The Virtuoso Coda: Presto con fuoco (Measures 208–264)',
      subtitle: language === 'de' ? 'Cortot-Punktierungsübungen & Daumendrehpunkt auf C#' : language === 'fr' ? 'Méthode Cortot en rythmes pointés et passage du pouce' : language === 'ja' ? 'コルトーの付点リズム練習法と親指の黒鍵旋回' : language === 'zh' ? '科尔托附点变奏训练法与大拇指黑键穿指' : 'Cortot dotted rhythm drills, thumb pivots on C# and octave velocity',
      measureRange: [208, 224],
      tempoRecommendation: 0.7,
      youtubeTimestampUrl: 'https://www.youtube.com/watch?v=gYUa-2L7ryY&t=470s',
      videoTimestampText: '7:50 - 10:45',
      focusArea: language === 'de' ? 'Explosive Fingerkraft & Oktavensprung-Präzision' : language === 'fr' ? 'Vélocité explosive et précision des sauts d’octaves' : language === 'ja' ? '爆発的アジリティと跳躍の着地精度' : language === 'zh' ? '高强爆发力跑动与大跳音准定位' : 'Finger velocity clusters & wide interval leaps',
      pedalTip: language === 'de' ? 'Impulsartiges Pedal nur auf die Bass-Oktaven setzen, nicht überbinden.' : language === 'fr' ? 'Pédale percutante sur les basses uniquement, sans chevauchement.' : language === 'ja' ? '低音オクターヴにのみ鋭くペダルを踏み込み、濁らせないこと。' : language === 'zh' ? '踏板仅在左手低音八度重音处瞬间下压，切忌跨小节连踏。' : 'Punch sharp pedal impulses solely on the bass octave beats; release immediately for chromatic runs.',
      wristGuidance: language === 'de' ? 'Den Ellbogen nicht nach außen strecken; Daumen flach unter die Handfläche gleiten lassen.' : language === 'fr' ? 'Ne pas écarter le coude; laissez le pouce glisser sous la paume vers C#.' : language === 'ja' ? '肘を外側に突き出さず、親指を手のひらの下へ自然に潜り込ませます。' : language === 'zh' ? '手肘切忌向外翻拐，大拇指自然在手掌下方平顺潜入黑键 C#。' : 'Never flare the elbow outward; let the thumb glide naturally under the palm onto the black key C#4.',
      commonPitfall: language === 'de' ? 'Versuch, sofort im Originaltempo zu rasen, führt zu falscher Handstellung.' : language === 'fr' ? 'Jouer trop vite trop tôt entraîne des crispations irréversibles.' : language === 'ja' ? '最初からインテンポで弾こうとするとフォームが崩れます。' : language === 'zh' ? '急于求成以原速练习会导致手型坍塌与音准失控。' : 'Rushing at full tempo before mastering dotted rhythm variants (Long-Short & Short-Long).',
      badge: 'technique',
    },
    {
      id: 'lesson-5',
      chapterNumber: 5,
      title: language === 'de' ? 'Notenlesen & Orientierungsanker' : language === 'fr' ? 'Lecture Rapide & Notes Repères' : language === 'ja' ? '瞬発読譜とランドマーク音符法' : language === 'zh' ? '五线谱地标快速识谱秘诀' : 'Rapid Sight-Reading & Landmark Anchors',
      subtitle: language === 'de' ? 'Schluss mit Buchstabenzählen: Intervall-Erkennung in Millisekunden' : language === 'fr' ? 'Reconnaissance d’intervalles instantanée au lieu d’épeler les notes' : language === 'ja' ? '音名を数えるのをやめ、音程間隔をミリ秒で視覚認識する特訓' : language === 'zh' ? '摆脱逐音数谱习惯：毫秒级音程视奏反射' : 'Stop counting letters: recognize intervals (2nds, 3rds, 5ths) instantaneously',
      measureRange: [1, 5],
      tempoRecommendation: 1.0,
      youtubeTimestampUrl: 'https://www.youtube.com/watch?v=gYUa-2L7ryY',
      videoTimestampText: 'Pedagogy Lab',
      focusArea: language === 'de' ? 'Neuro-visuelle Reflexe auf dem Roland LX-9 & Mikrofon' : language === 'fr' ? 'Réflexes neuro-visuels avec clavier Roland & Micro' : language === 'ja' ? 'Roland LX-9とマイクによる視覚・聴覚フィードバック' : language === 'zh' ? 'Roland 电钢琴与原声麦克风实时音准映射' : 'Instant neuro-visual note-to-key mapping',
      pedalTip: language === 'de' ? 'Trockene Akustik (ohne Pedal) wählen, um Intonationsfehler sofort zu hören.' : language === 'fr' ? 'Pratiquez sans pédale pour entendre la justesse d’attaque.' : language === 'ja' ? 'ペダルなしで音の粒立ちと正誤を明瞭に把握します。' : language === 'zh' ? '视谱特训时建议不踩踏板，以便清晰听辨每次击键的精准度。' : 'Practice dry without pedal to hear the crisp exactness of your finger strikes.',
      wristGuidance: language === 'de' ? 'Entspannte Fingerkrümmung, Augen fest auf die Notenzeile gerichtet.' : language === 'fr' ? 'Mains bien arrondies, regard fixé sur la portée sans regarder le clavier.' : language === 'ja' ? '指のアーチを保ち、鍵盤を見ずに譜面だけを凝視して弾きます。' : language === 'zh' ? '手指保持饱满掌骨拱桥，视线固定在乐谱上盲弹寻键。' : 'Maintain natural finger curves; keep eyes locked onto the staff without looking down at hands.',
      commonPitfall: language === 'de' ? 'Ständiges Hin- und Herschauen zwischen Noten und Händen.' : language === 'fr' ? 'Regarder constamment ses mains au lieu de faire confiance à la mémoire tactile.' : language === 'ja' ? '手元と譜面を交互に見つめすぎて視覚反射が遅れること。' : language === 'zh' ? '眼睛频繁在乐谱与琴键之间切换，阻断手指空间定位感。' : 'Glancing down at your fingers after every note, breaking tactical spatial memory.',
      badge: 'sightreading',
    },
    {
      id: 'lesson-6',
      chapterNumber: 6,
      title: language === 'de' ? 'Roland CC64 Kontinuierliche Dämpfer-Akustik' : language === 'fr' ? 'Acoustique & Pédale Continue Roland CC64' : language === 'ja' ? 'Roland CC64 連続ダンパー音響マスター' : language === 'zh' ? 'Roland CC64 连续可变延音踏板声学解析' : 'Roland CC64 Continuous Damper Acoustics',
      subtitle: language === 'de' ? 'Unterschied zwischen Ein/Aus-Pedalen und stufenloser Resonanz' : language === 'fr' ? 'Différence entre pédale interrupteur et résonance continue' : language === 'ja' ? 'スイッチ式ペダルとRoland連続可変ペダル（0〜127）の決定的違い' : language === 'zh' ? '开关式踏板与 Roland 0–127 连续感应声学生态' : 'Mastering the 0–127 continuous damper gradient and wooden action mechanical noise',
      measureRange: [1, 10],
      tempoRecommendation: 0.9,
      youtubeTimestampUrl: 'https://www.youtube.com/watch?v=gYUa-2L7ryY',
      videoTimestampText: 'Acoustic Soundboard',
      focusArea: language === 'de' ? 'Halbpedal-Schwebung & Resonanzboden-Dynamik' : language === 'fr' ? 'Demi-pédale feutrée et vibrations de table d’harmonie' : language === 'ja' ? '弦振動と響板共鳴のコントロール' : language === 'zh' ? '半踏板泛音共鸣与机械起落杂音' : 'Damper felt graze resonance & string bloom',
      pedalTip: language === 'de' ? 'CC64 Bereich 40–70 erzeugt das samtige, singende Halbpedal des Konzertflügels.' : language === 'fr' ? 'La plage CC64 40–70 offre le velouté de demi-pédale d’un piano de concert.' : language === 'ja' ? 'CC64値40〜70の領域がグランドピアノ特有の歌うハーフペダルを生みます。' : language === 'zh' ? 'CC64 踏板深度在 40–70 区间时，能呈现音乐会三角琴清澈歌唱的半踏板泛音。' : 'CC64 values 40-70 allow dampers to graze strings lightly for singing warmth without chord clashing.',
      wristGuidance: language === 'de' ? 'Das Fußgelenk bleibt flexibel wie das Handgelenk – niemals verkrampft abdrücken.' : language === 'fr' ? 'La cheville doit être aussi souple que le poignet.' : language === 'ja' ? '足首も手首と同様にしなやかに動かし、踵を床につけて微調整します。' : language === 'zh' ? '脚踝如同手腕一样保持柔韧，脚跟稳着地，用脚掌轻柔控制深度。' : 'The ankle must remain as supple as your wrist; keep the heel anchored and modulate pedal depth gently.',
      commonPitfall: language === 'de' ? 'Binäres Durchtreten bis Anschlag 127 erstickt die Transparenz des Flügels.' : language === 'fr' ? 'Enfoncer la pédale à 100% systématiquement noie l’acoustique.' : language === 'ja' ? '常に127まで踏み切ると、ショパンの美しいポリフォニーが消えてしまいます。' : language === 'zh' ? '习惯性将踏板一脚踩到底（127），会彻底破坏肖邦复调的清澈层次。' : 'Binary on/off stomping to 127 drowning the natural transparent decay of the piano soundboard.',
      badge: 'acoustics',
    },
  ]

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-zinc-100 p-3 sm:p-5 overflow-y-auto select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold font-serif-title text-zinc-100">
                {t.title}
              </h2>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono uppercase">
                {piece.title}
              </span>
            </div>
            <p className="text-xs text-zinc-400">{t.subtitle}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onSwitchToWarmups}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-950/40 border border-orange-500/40 text-orange-400 hover:bg-orange-950/70 text-xs font-semibold transition-all"
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>Warm-Ups</span>
          </button>
          <button
            onClick={onSwitchToSightReading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-500/50 text-zinc-200 text-xs font-semibold transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sight-Reading</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Video Masterclass Direct Link Banner */}
      <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-zinc-900 to-zinc-900 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>YouTube Masterclass Reference</span>
          </div>
          <p className="text-xs text-zinc-300">
            Chopin Ballade No. 1 in G minor Op. 23 - Master Pedagogy, Transition Analysis & Pedal Timing
          </p>
        </div>

        <a
          href="https://www.youtube.com/watch?v=gYUa-2L7ryY"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>{t.watchVideo}</span>
        </a>
      </div>

      {/* Lesson Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-amber-500/50 p-4 sm:p-5 flex flex-col justify-between transition-all group hover:shadow-[0_4px_25px_rgba(0,0,0,0.5)]"
          >
            <div className="space-y-3">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono font-bold text-xs flex items-center justify-center">
                    {lesson.chapterNumber}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {t.targetMeasures}: {lesson.measureRange[0]}–{lesson.measureRange[1]}
                  </span>
                </div>

                <a
                  href={lesson.youtubeTimestampUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-amber-400/90 hover:text-amber-300 font-mono bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded-md"
                >
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{lesson.videoTimestampText}</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </a>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h3 className="text-sm font-bold text-zinc-100 group-hover:text-amber-300 transition-colors">
                  {lesson.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">{lesson.subtitle}</p>
              </div>

              {/* Pedagogical Checkpoints */}
              <div className="space-y-2 pt-1 text-xs">
                {/* Wrist Guidance */}
                <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/70 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                    <Sliders className="w-3 h-3" />
                    {t.wristGuidance}
                  </span>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {lesson.wristGuidance}
                  </p>
                </div>

                {/* Pedal Timing */}
                <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/70 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {t.pedalTip}
                  </span>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {lesson.pedalTip}
                  </p>
                </div>

                {/* Pitfall Alert */}
                <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/20 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>{t.pitfall}</span>
                  </span>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {lesson.commonPitfall}
                  </p>
                </div>
              </div>
            </div>

            {/* Launch Practice Button */}
            <div className="pt-4 mt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-amber-400" />
                Tempo: {Math.round(lesson.tempoRecommendation * 100)}%
              </span>

              <button
                onClick={() => {
                  if (lesson.badge === 'sightreading') {
                    onSwitchToSightReading()
                  } else {
                    onLaunchPracticePassage(
                      lesson.measureRange[0],
                      lesson.measureRange[1],
                      lesson.tempoRecommendation
                    )
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-zinc-950 font-bold text-xs shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{lesson.badge === 'sightreading' ? 'Sight-Reading' : t.practiceInLab}</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
