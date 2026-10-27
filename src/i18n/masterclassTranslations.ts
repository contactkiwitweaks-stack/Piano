// Masterclass Pedagogical Annotations Localization Dictionary (EN, DE, FR, JA, ZH)

import type { LanguageCode } from './translations'

export interface LocalizedAnnotationContent {
  title: string
  instruction: string
  wristGuidance?: string
  handTechnique?: string
  pedalRule?: string
}

export const masterclassTranslations: Record<LanguageCode, Record<string, LocalizedAnnotationContent>> = {
  en: {
    'ann-1': {
      title: 'The Monumental Largo Arpeggio',
      instruction: 'Do not rush the opening C. Strike with full arm weight, not finger poke. Allow the modeled piano soundboard to bloom before stepping forward.',
      wristGuidance: 'Keep the wrist loose and flexible, moving upward in a gentle sweeping curve as you cross hands into the treble.',
      pedalRule: 'Keep pedal completely pinned down through the entire ascent. Let the resonance build up like an orchestra tuning.',
    },
    'ann-2': {
      title: 'The Famous "Question Mark" Chord (Db - G - C)',
      instruction: 'Chopin asks a cosmic question here. Decelerate gracefully (ritardando). Play this chord pianissimo smorzando (dying away). The silence after the chord is as sacred as the notes!',
      wristGuidance: 'Drop gently from the arm with relaxed fingertips; do not press into the bottom of the keybed.',
      pedalRule: 'Use half-pedal (approx 40-50% depth on your Roland LX-9 continuous damper) to let it hover in the air without being sharp or dry.',
    },
    'ann-3': {
      title: 'Moderato: The Melancholy Ballade Lilt',
      instruction: 'This is not a strict Viennese waltz; it is a wistful Polish narrative. The melody must sing cantabile with flexible tempo (rubato). Notice the left hand jump from the deep bass octave.',
      handTechnique: 'Left hand choreography: Immediately after striking the low G2, release tension and float the forearm over to the Bb-D chord. Never jump frantically.',
      pedalRule: 'Syncopated Pedaling: Strike the bass G2 with finger 5, THEN depress the pedal 50ms later. If you pedal simultaneously, you capture the previous silence.',
    },
    'ann-4': {
      title: 'Second Theme: Lyrical Eb Major Cantabile',
      instruction: 'A complete transformation into golden light. Bring out the top note (Eb5) with the 5th finger by leaning your arm weight toward the outer edge of your hand.',
      wristGuidance: 'Draw smooth horizontal wrist circles connecting the melodic arches.',
      pedalRule: 'Continuous half-pedaling keeps the accompaniment cushion soft without drowning the vocal melody.',
    },
    'ann-5': {
      title: 'Presto con Fuoco: Virtuosic Coda',
      instruction: 'The most demanding section of the piece. To master these rapid runs at tempo, use our Dotted Rhythm practice variant in the Practice Lab!',
      handTechnique: 'Thumb tucking: As your 3rd finger strikes, the thumb must already be sliding underneath toward C#4. Prepare early!',
      pedalRule: 'Do NOT over-pedal! Excessive sustain turns these virtuosic chromatic runs into mud. Clear crisply on the apex.',
    },
  },
  de: {
    'ann-1': {
      title: 'Das Monumentale Largo-Arpeggio',
      instruction: 'Übereilen Sie das Eröffnungs-C nicht. Schlagen Sie mit vollem Armgewicht an, nicht mit isolierter Fingerkraft. Lassen Sie den Klavierresonanzboden voll aufblühen, bevor Sie aufsteigen.',
      wristGuidance: 'Halten Sie das Handgelenk locker und flexibel, während Sie in einem weichen Bogen in den Diskant hinübergreifen.',
      pedalRule: 'Halten Sie das Pedal während des gesamten Aufstiegs durchgedrückt. Die Obertöne müssen sich wie ein einstimmendes Orchester aufbauen.',
    },
    'ann-2': {
      title: 'Der Berühmte "Fragezeichen"-Akkord (Des - G - C)',
      instruction: 'Chopin stellt hier eine kosmische Frage. Verlangsamen Sie behutsam (Ritardando). Spielen Sie diesen Akkord pianissimo smorzando (verlöschend). Die Stille nach dem Klang ist genauso wichtig wie die Noten!',
      wristGuidance: 'Lassen Sie den Arm sanft mit federnden Fingerkuppen einsinken; drücken Sie nicht krampfhaft in den Tastenboden.',
      pedalRule: 'Nutzen Sie das Halbpedal (ca. 40-50% Tiefe am Roland LX-9 Dämpfer), damit der Klang schwebend und warm im Raum verbleibt.',
    },
    'ann-3': {
      title: 'Moderato: Der Schwermütige Balladenton',
      instruction: 'Dies ist kein starrer Wiener Walzer, sondern eine sehnsuchtsvolle polnische Erzählung. Die Melodie muss cantabile mit freiem Rubato atmen. Achten Sie auf den Sprung im Bass.',
      handTechnique: 'Choreographie der linken Hand: Unmittelbar nach dem tiefen G2 entspannen und den Unterarm geschmeidig zum B-D-Akkord schweben lassen. Niemals hektisch springen.',
      pedalRule: 'Nachpedalieren (Syncopated Pedal): Erst die Basstaste G2 anschlagen, 50ms SPÄTER das Pedal treten, um den Ton sauber ohne Vorschwingung zu binden.',
    },
    'ann-4': {
      title: 'Zweites Thema: Gesangliches Es-Dur Cantabile',
      instruction: 'Eine vollkommene Verwandlung in goldenes Licht. Heben Sie den Spitzenton (Es5) mit dem 5. Finger hervor, indem Sie das Armgewicht zur Handaußenkante neigen.',
      wristGuidance: 'Zeichnen Sie weiche, horizontale Handgelenkkreise, um die Melodiebögen fließend zu verbinden.',
      pedalRule: 'Kontinuierliches Halbpedal hält den Begleitteppich samtig weich, ohne die Gesangslinie zu überdecken.',
    },
    'ann-5': {
      title: 'Presto con Fuoco: Stürmische Coda',
      instruction: 'Der virtuoseste Teil des Werkes. Um diese rasanten Läufe im Originaltempo zu meistern, nutzen Sie unsere punktierten Rhythmus-Varianten im Übelabor!',
      handTechnique: 'Daumenuntersatz: Während der 3. Finger anschlägt, muss der Daumen bereits aktiv unter der Handfläche Richtung Cis4 gleiten. Frühzeitig vorbereiten!',
      pedalRule: 'Vermeiden Sie Überpedalierung! Zu viel Sustain verwandelt diese chromatischen Läufe in Schlamm. Auf den Spitzentönen knackig lüften.',
    },
  },
  fr: {
    'ann-1': {
      title: 'L’Arpège Monumental du Largo',
      instruction: 'Ne précipitez pas le premier Do grave. Attaquez avec tout le poids du bras décontracté. Laissez la table d’harmonie rayonner avant d’amorcer l’ascension.',
      wristGuidance: 'Gardez le poignet souple, accompagnant le geste d’une courbe ascendante élégante.',
      pedalRule: 'Maintenez la pédale forte enfoncée durant toute la montée pour laisser s’accumuler les harmoniques.',
    },
    'ann-2': {
      title: 'L’Accord Interrogatif Célèbre (Réb - Sol - Do)',
      instruction: 'Chopin pose ici une question au destin. Ralentissez avec grâce (ritardando). Jouez cet accord pianissimo smorzando. Le silence qui suit est aussi sacré que le son !',
      wristGuidance: 'Déposez le poids du bras avec souplesse sans écraser le fond de touche.',
      pedalRule: 'Utilisez la demi-pédale (40-50% sur votre Roland LX-9) pour créer un halo vaporeux sans sécheresse.',
    },
    'ann-3': {
      title: 'Moderato : La Mélancolie de la Ballade Polonaise',
      instruction: 'Ce n’est pas une valse viennoise rigide, mais un récit romantique intimiste. La ligne doit chanter avec un rubato naturel. Maîtrisez le grand saut de basse.',
      handTechnique: 'Chorégraphie main gauche : Dès la frappe du Sol grave, détendez le poignet et flottez vers l’accord sans précipitation.',
      pedalRule: 'Pédale syncopée : Jouez d’abord la basse, puis enfoncez la pédale 50 ms après pour un legato parfait.',
    },
    'ann-4': {
      title: 'Deuxième Thème : Cantabile Lumineux en Mib Majeur',
      instruction: 'Une clarté radieuse. Mettez en relief le chant aigu avec le 5e doigt en transférant le poids vers l’extérieur de la main.',
      wristGuidance: 'Décrivez des cercles horizontaux fluides pour lier les phrasés mélodiques.',
      pedalRule: 'La demi-pédale continue apporte de la chaleur sans alourdir le chant.',
    },
    'ann-5': {
      title: 'Presto con Fuoco : Coda Diabolique',
      instruction: 'Le passage le plus virtuose de l’œuvre. Travaillez ces traits d’agilité en rythme pointé dans notre Atelier de Pratique !',
      handTechnique: 'Passage du pouce : Dès que le 3e doigt frappe, le pouce doit glisser sous la paume vers le Do#4.',
      pedalRule: 'N’abusez pas de la pédale ! Trop de résonance transforme ces traits chromatiques en bouillie.',
    },
  },
  ja: {
    'ann-1': {
      title: '壮大なLargoのアルペジオ',
      instruction: '冒頭の低音C（ド）を急いではいけません。指先だけで叩かず、腕全体の重みを鍵盤に沈めて響きが広がるのを待ってから上昇を開始してください。',
      wristGuidance: '手首を柔軟に保ち、高音域へ手をクロスする際は緩やかな放物線を描くように動かします。',
      pedalRule: '上昇中はずっとペダルを踏み続けます。オーケストラがチューニングするように倍音を豊かに響かせましょう。',
    },
    'ann-2': {
      title: '伝説の「問いかけの和音」（D♭ - G - C）',
      instruction: 'ショパンが天に問いかける神秘的な箇所です。優雅にテンポを落とし（リタルダンド）、静寂に消え入るように弾きます。和音の後の「静寂」も音楽の一部です。',
      wristGuidance: '腕からそっと鍵盤に指を預け、底突き感のない柔らかいタッチを意識します。',
      pedalRule: 'Roland LX-9のハーフペダル（40〜50%）を使い、残響を濁らせず空間に漂わせます。',
    },
    'ann-3': {
      title: 'Moderato: 憂いを帯びたバラードの調べ',
      instruction: '厳格なワルツではなく、自由なルバートを伴う語り口です。右手は伸びやかに歌い、左手は深みのある低音オクターブから和音への跳躍を滑らかに行います。',
      handTechnique: '左手の動き：低音G2を弾いた直後に脱力し、前腕を柔らかく和音の位置へ運びます。決して跳びつかないこと。',
      pedalRule: 'シンコペーション・ペダル：バスを打鍵した直後（約50ms後）にペダルを踏み直すことで、前の音の濁りを消しつつ滑らかに繋ぎます。',
    },
    'ann-4': {
      title: '第2主題: 変ホ長調の輝かしいカンタービレ',
      instruction: '黄金の光に包まれるような場面。小指（第5指）のメロディに腕の重みを傾け、内声の和音をささやくように軽く添えます。',
      wristGuidance: '手首で水平の楕円を描くように動かし、旋律のアーチを繋げます。',
      pedalRule: 'ハーフペダルを持続させることで、旋律を邪魔せずに豊かなハーモニーを保ちます。',
    },
    'ann-5': {
      title: 'Presto con Fuoco: 激動のコーダ',
      instruction: '最も高度な技巧が要求されるクライマックス。この超速パッセージを滑らかに弾くために、練習ラボの「付点リズム」を活用しましょう。',
      handTechnique: '親指のくぐらせ：第3指が打鍵した瞬間に、親指は既にC#4へ向かって掌の下を移動していなければなりません。',
      pedalRule: 'ペダルの踏みすぎは禁物！過剰なサステインは半音階を濁らせます。頂点で歯切れよく踏み替えてください。',
    },
  },
  zh: {
    'ann-1': {
      title: '庄严肃穆的 Largo 琶音引子',
      instruction: '切勿急于弹出开头的低音 C。请用整个手臂的重量自然沉入琴键，等待琴弦与音板充分震鸣产生共鸣气场后再徐徐上升。',
      wristGuidance: '手腕保持放松与柔韧，随旋律在空中画出优美的弧线跨入高音区。',
      pedalRule: '在整个上升过程中牢牢踩住延音踏板，让泛音如交响乐团开场般层层堆叠交织。',
    },
    'ann-2': {
      title: '著名的“问号和弦”（降D - G - C）',
      instruction: '这是肖邦向苍穹发出的深邃叩问。优雅地渐慢（Ritardando），弹得极轻、仿若若有似无的消逝（Smorzando）。和弦之后的静谧与音符本身同等神圣！',
      wristGuidance: '从手臂自然落指，指腹饱满轻柔触键，不要死死压死键底。',
      pedalRule: '使用 Roland LX-9 的连续半踏板（约 40-50% 深度），让音色悬浮在空气中而不至于干瘪或刺耳。',
    },
    'ann-3': {
      title: 'Moderato: 肖邦忧郁叙事的主题摇曳',
      instruction: '这绝非严格刻板的圆舞曲，而是一首充满呼吸与弹性的波兰叙事诗。右手如歌咏唱，左手需从极深沉的低音八度轻盈跃迁至和弦。',
      handTechnique: '左手走位要领：击打低音 G2 后瞬间释放紧张，前臂如天鹅展翅般飘向和弦，切勿仓促跳砸。',
      pedalRule: '切分踏板（后踏法）：先弹击低音 G2，50 毫秒后再踩下踏板，既保持绝对连音又杜绝前一个和声的混浊。',
    },
    'ann-4': {
      title: '第二主题: 降E大调温暖如歌的 Cantabile',
      instruction: '音乐完全转入金色的温暖之光。将手臂重量自然倾斜至手掌外侧的第 5 指，让高音降 E5 穿透而出，内声部如微风拂面。',
      wristGuidance: '手腕画出平缓的水平圆弧，使每一个旋律线条无缝流淌。',
      pedalRule: '持续半踏板铺垫出天鹅绒般的和声背景，同时保证主旋律的清澈高亮。',
    },
    'ann-5': {
      title: 'Presto con Fuoco: 狂暴飞驰的尾声 Coda',
      instruction: '全曲最具挑战的狂风暴雨段落。要在原速下举重若轻，务必在练习工坊中启用“附点节奏”进行神经反射专项强化！',
      handTechnique: '大指穿指秘诀：在 3 指击键的同时，大指必须已经开始在手掌下方滑向升 C4。提前预备是速度的唯一秘密！',
      pedalRule: '严防踏板过重！过度延音会使高速半音阶瞬间化为泥淖。在顶点果断收放踏板。',
    },
  },
}
