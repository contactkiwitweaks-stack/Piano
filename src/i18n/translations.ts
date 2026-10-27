// Complete Multi-Language (i18n) Translations for Virtuoso 2.0 (EN, DE, FR, JA, ZH)

export type LanguageCode = 'en' | 'de' | 'fr' | 'ja' | 'zh'

export interface TranslationDictionary {
  appTitle: string
  subtitle: string
  nav: {
    home: string
    repertoire: string
    tutorials: string
    warmups: string
    sightReading: string
  }
  pairPiano: string
  connected: string
  disconnected: string
  simulated: string
  masterclass: string
  practiceLab: string
  tempo: string
  loopMeasures: string
  speedRamp: string
  cameraAngle: string
  importScore: string
  microphone: string
  micListening: string
  micOff: string
  micActive: string
  wrongNoteDetected: string
  mechanicalNoise: string
  pedalDepth: string
  halfPedal: string
  fullSustain: string
  pedalDamped: string
  pedalWhoosh: string
  videoTutorial: string
  holdTimesSynced: string
  rule: string
  waitModes: {
    bothHands: string
    rightHandOnly: string
    leftHandOnly: string
  }
  variants: {
    original: string
    rightHand: string
    leftHand: string
    waitForNote: string
    dottedLongShort: string
    dottedShortLong: string
    harmonicSkeleton: string
  }
  editions: {
    title: string
    urtext: string
    zimerman: string
    horowitz: string
    langLang: string
    urtextDesc: string
    zimermanDesc: string
    horowitzDesc: string
    langLangDesc: string
  }
  categories: {
    transition: string
    pedal: string
    fingering: string
    toneColor: string
    rubato: string
  }
  warmups: {
    title: string
    subtitle: string
    startWarmup: string
    targetPiece: string
    difficulty: string
  }
  sightReading: {
    title: string
    subtitle: string
    streak: string
    bestStreak: string
    reactionSpeed: string
    accuracy: string
    correct: string
    tryAgain: string
    tapToAnswer: string
    mnemonicGuide: string
    clefAll: string
    clefTreble: string
    clefBass: string
  }
  tutorials: {
    title: string
    subtitle: string
    watchVideo: string
    practiceInLab: string
    targetMeasures: string
    keyFocus: string
    videoTimestamp: string
    wristGuidance: string
    pedalTip: string
    pitfall: string
    backToLab: string
  }
  homeFeed: {
    featured: string
    continuePlaying: string
    classicalMasterpieces: string
    techniqueCourses: string
    masterclassVideoAcademy: string
    skillsAndLabs: string
    all: string
    romantic: string
    classical: string
    impressionist: string
    technique: string
    startPracticing: string
    inspectPiece: string
    chooseEdition: string
    practiceMode: string
    hands: string
    bothHands: string
    rightHand: string
    leftHand: string
    openInLab: string
    miniPlayerNowPlaying: string
    openPlayer: string
    difficultyLevel: string
    searchSongs: string
  }
  rolandModal: {
    title: string
    subtitle: string
    pairBle: string
    pairBleSub: string
    connectUsb: string
    connectUsbSub: string
    disconnect: string
    waitingConnection: string
    bleProtocol: string
    damperDepth: string
    damped: string
    halfPedalRange: string
    fullSustainRange: string
    virtualSimulator: string
    enableSimulator: string
    simulatorDesc: string
    simulatePedal: string
    testChords: string
    pairingStepsTitle: string
    step1: string
    step2: string
    step3: string
    step4: string
    errorBle: string
    errorUsb: string
  }
  importModal: {
    title: string
    subtitle: string
    tapToUpload: string
    fileTypesHint: string
    curatedTitle: string
    parsing: string
    success: string
    unsupported: string
  }
  libraryModal: {
    title: string
    subtitle: string
    searchPlaceholder: string
    loadMasterclass: string
    level: string
    duration: string
    key: string
  }
  ui: {
    splitView: string
    waterfallOnly: string
    sheetOnly: string
    close: string
    play: string
    pause: string
    rewind: string
    measure: string
    time: string
    library: string
    curatedScores: string
    uploadFile: string
    audioUnlocked: string
    tapToUnlock: string
  }
}

export const translations: Record<LanguageCode, TranslationDictionary> = {
  en: {
    appTitle: 'VIRTUOSO',
    subtitle: 'Masterclass Concert Piano',
    nav: {
      home: 'Discover',
      repertoire: 'Practice Lab',
      tutorials: 'Lessons',
      warmups: 'Warm-Ups',
      sightReading: 'Trainer',
    },
    pairPiano: 'Pair Piano',
    connected: 'Connected',
    disconnected: 'Disconnected',
    simulated: 'Virtual Bridge',
    masterclass: 'Masterclass Pedagogy',
    practiceLab: 'Practice Lab',
    tempo: 'Tempo',
    loopMeasures: 'Loop Measures',
    speedRamp: '+2% Speed Ramp on Loop',
    cameraAngle: 'Camera Angle',
    importScore: 'Import Custom MIDI / MusicXML',
    microphone: 'Acoustic Mic Detection',
    micListening: 'Listening for Acoustic Piano...',
    micOff: 'Mic Off',
    micActive: 'Mic Active',
    wrongNoteDetected: 'Wrong Note Struck!',
    mechanicalNoise: 'Mechanical Acoustic Noise',
    pedalDepth: 'Roland CC64 Damper Depth',
    halfPedal: 'Half-Pedal (Roland Acoustic Resonance)',
    fullSustain: 'Full Sustained Bloom',
    pedalDamped: 'Dampers Engaged',
    pedalWhoosh: 'Acoustic Damper Whoosh',
    videoTutorial: 'Master Video Tutorial',
    holdTimesSynced: 'Hold times & rubato synced',
    rule: 'Rule',
    waitModes: {
      bothHands: 'Wait: Both Hands',
      rightHandOnly: 'Wait: Right Hand Only',
      leftHandOnly: 'Wait: Left Hand Only',
    },
    variants: {
      original: 'Original Score',
      rightHand: 'Right Hand Solo',
      leftHand: 'Left Hand Solo',
      waitForNote: 'Wait-for-Note (Cadence)',
      dottedLongShort: 'Dotted (Long-Short)',
      dottedShortLong: 'Dotted (Short-Long)',
      harmonicSkeleton: 'Harmonic Skeleton',
    },
    editions: {
      title: 'Master Interpretation',
      urtext: 'Henle Urtext (Canonical)',
      zimerman: 'Krystian Zimerman (1987 DG)',
      horowitz: 'Vladimir Horowitz (1968 Carnegie)',
      langLang: 'Lang Lang / Seong-Jin Cho',
      urtextDesc: 'Polish National Edition (Jan Ekier). Pure unembellished Chopin canonical score.',
      zimermanDesc: 'Aristocratic cantabile, elastic rubato, dynamic range (ppp to fff), clean half-pedaling.',
      horowitzDesc: 'Fiery bravura, double-octave climax reinforcements, tempestuous percussive Coda.',
      langLangDesc: 'Virtuosic finger articulation, sparkling inner voices, resonant extended pedal sustains.',
    },
    categories: {
      transition: 'Transition & Rubato',
      pedal: 'Pedal & Holding Times',
      fingering: 'Fingering & Choreography',
      toneColor: 'Tone Color & Voicing',
      rubato: 'Tempo Elasticity',
    },
    warmups: {
      title: 'Concert Warm-Ups & Technique',
      subtitle: 'Hanon & Cortot drills to prepare neuro-muscular control',
      startWarmup: 'Practice Warm-Up',
      targetPiece: 'Target Repertoire',
      difficulty: 'Difficulty',
    },
    sightReading: {
      title: 'Sight-Reading Trainer',
      subtitle: 'Interactive note reading flashcards with live Roland & Mic detection',
      streak: 'Streak',
      bestStreak: 'Best Streak',
      reactionSpeed: 'Reaction Speed',
      accuracy: 'Accuracy',
      correct: 'Correct!',
      tryAgain: 'Try again! Target is',
      tapToAnswer: 'Tap Key to Answer (Touch Screen)',
      mnemonicGuide: 'Mnemonic Guide',
      clefAll: 'All Clefs (Grand Staff)',
      clefTreble: 'Treble Clef Solo',
      clefBass: 'Bass Clef Solo',
    },
    tutorials: {
      title: 'Masterclass Academy',
      subtitle: 'Video masterclasses, anatomical wrist mechanics & interactive passage drills',
      watchVideo: 'Watch Masterclass Segment',
      practiceInLab: 'Practice in Lab',
      targetMeasures: 'Measures',
      keyFocus: 'Technical Focus',
      videoTimestamp: 'Video Timestamp',
      wristGuidance: 'Wrist & Arm Mechanics',
      pedalTip: 'Roland Damper Timing',
      pitfall: 'Common Technical Pitfall',
      backToLab: 'Return to Practice Lab',
    },
    homeFeed: {
      featured: 'Featured Masterpiece',
      continuePlaying: 'Continue Practicing',
      classicalMasterpieces: 'Classical Masterpieces & Repertoire',
      techniqueCourses: 'Technique Drills & Finger Agility',
      masterclassVideoAcademy: 'Masterclass Lessons & Analysis',
      skillsAndLabs: 'Interactive Skills & Hardware Labs',
      all: 'All Repertoire',
      romantic: 'Romantic',
      classical: 'Classical',
      impressionist: 'Impressionist',
      technique: 'Technique',
      startPracticing: 'Start Practicing',
      inspectPiece: 'Inspect & Select Edition',
      chooseEdition: 'Select Interpretation Edition',
      practiceMode: 'Practice Mode',
      hands: 'Hands',
      bothHands: 'Both Hands',
      rightHand: 'Right Hand',
      leftHand: 'Left Hand',
      openInLab: 'Open in Practice Lab',
      miniPlayerNowPlaying: 'Now In Practice Lab',
      openPlayer: 'Open Piano',
      difficultyLevel: 'Difficulty',
      searchSongs: 'Search pieces, composers, drills...',
    },
    rolandModal: {
      title: 'Roland LX-9 Connection Center',
      subtitle: 'Bluetooth LE MIDI & Continuous CC64 Damper',
      pairBle: 'Pair Bluetooth MIDI',
      pairBleSub: 'Roland LX-9 Wireless BLE',
      connectUsb: 'Connect USB MIDI',
      connectUsbSub: 'Direct Lightning / USB-C Cable',
      disconnect: 'Disconnect',
      waitingConnection: 'Waiting for piano connection',
      bleProtocol: 'Protocol: BLE MIDI • Latency ~4ms',
      damperDepth: 'Roland CC64 Damper Depth',
      damped: '0 (Damped)',
      halfPedalRange: '40-70 (Half-Pedal)',
      fullSustainRange: '127 (Full Sustain)',
      virtualSimulator: 'Roland LX-9 Virtual Simulator',
      enableSimulator: 'Enable Simulator',
      simulatorDesc: 'Test falling keys, pedal hold times, and feedback right on your screen without your Roland LX-9 nearby.',
      simulatePedal: 'Simulate Pedal Hold',
      testChords: 'Test Chords',
      pairingStepsTitle: 'Roland LX-9 Bluetooth Pairing Steps',
      step1: 'On your Roland LX-9 touch panel, tap Function.',
      step2: 'Select Bluetooth and set Bluetooth MIDI: ON.',
      step3: 'Tap the blue "Pair Bluetooth MIDI" button above.',
      step4: 'Select "Roland LX-9 MIDI" when prompted.',
      errorBle: 'Could not find or pair Roland LX-9 Bluetooth MIDI. Ensure Bluetooth is ON on your Roland LX-9 and device.',
      errorUsb: 'No USB MIDI piano detected. Connect your Roland LX-9 USB-B / USB-C cable to your device.',
    },
    importModal: {
      title: 'Score & MIDI Importer',
      subtitle: 'Import your own pieces from Files or iCloud to generate tutorials',
      tapToUpload: 'Tap to choose MIDI or MusicXML file',
      fileTypesHint: 'Supports .mid, .midi, and .musicxml from iPhone/iPad Files & PC',
      curatedTitle: 'Curated Masterclass Repertoire',
      parsing: 'Reading and analyzing score...',
      success: 'Successfully generated AI Masterclass for',
      unsupported: 'Unsupported format. Please select a .mid, .midi, or .musicxml file.',
    },
    libraryModal: {
      title: 'Score Library',
      subtitle: 'Masterpieces & Historic Performance Editions',
      searchPlaceholder: 'Search Chopin, Beethoven, Liszt, Debussy...',
      loadMasterclass: 'Load Masterclass',
      level: 'Lvl',
      duration: 'Duration',
      key: 'Key',
    },
    ui: {
      splitView: 'Split',
      waterfallOnly: 'Waterfall',
      sheetOnly: 'Sheet',
      close: 'Close',
      play: 'Play',
      pause: 'Pause',
      rewind: 'Rewind',
      measure: 'Measure',
      time: 'Time',
      library: 'Score Library',
      curatedScores: 'Masterclass Repertoire',
      uploadFile: 'Tap to choose MIDI or MusicXML file',
      audioUnlocked: 'Audio Active',
      tapToUnlock: 'Tap anywhere to unlock concert audio',
    },
  },
  de: {
    appTitle: 'VIRTUOSO',
    subtitle: 'Interaktive Klavier-App',
    nav: {
      home: 'Songs',
      repertoire: 'Klavier',
      tutorials: 'Kurse',
      warmups: 'Einspielen',
      sightReading: 'Noten lernen',
    },
    pairPiano: 'Klavier verbinden',
    connected: 'Verbunden',
    disconnected: 'Nicht verbunden',
    simulated: 'Virtuelles Klavier',
    masterclass: 'Meisterkurs & Tipps',
    practiceLab: 'Klavier & Player',
    tempo: 'Geschwindigkeit',
    loopMeasures: 'Loop (Takte wiederholen)',
    speedRamp: '+2% Tempo-Steigerung je Durchlauf',
    cameraAngle: 'Ansicht',
    importScore: 'MIDI / MusicXML importieren',
    microphone: 'Mikrofon-Erkennung',
    micListening: 'Höre auf Klaviertöne...',
    micOff: 'Mikrofon Aus',
    micActive: 'Mikrofon Aktiv',
    wrongNoteDetected: 'Falsche Taste gedrückt',
    mechanicalNoise: 'Tastenakustik',
    pedalDepth: 'Roland CC64 Haltepedal',
    halfPedal: 'Halbpedal',
    fullSustain: 'Volles Haltepedal',
    pedalDamped: 'Kein Pedal',
    pedalWhoosh: 'Pedalresonanz',
    videoTutorial: 'Video-Tutorial',
    holdTimesSynced: 'Haltezeiten synchron',
    rule: 'Tipp',
    waitModes: {
      bothHands: 'Warten: Beide Hände',
      rightHandOnly: 'Warten: Rechte Hand',
      leftHandOnly: 'Warten: Linke Hand',
    },
    variants: {
      original: 'Original (Beide Hände)',
      rightHand: 'Rechte Hand',
      leftHand: 'Linke Hand',
      waitForNote: 'Warten-Modus',
      dottedLongShort: 'Punktiert (Lang-Kurz)',
      dottedShortLong: 'Punktiert (Kurz-Lang)',
      harmonicSkeleton: 'Akkord-Gerüst',
    },
    editions: {
      title: 'Meister-Interpretation',
      urtext: 'Henle Urtext (Kanonisch)',
      zimerman: 'Krystian Zimerman (1987 DG)',
      horowitz: 'Vladimir Horowitz (1968 Carnegie)',
      langLang: 'Lang Lang / Seong-Jin Cho',
      urtextDesc: 'Polnische Nationalausgabe (Jan Ekier). Reiner ungeschminkter Chopin-Text.',
      zimermanDesc: 'Adeliges Cantabile, elastisches Rubato, extreme Dynamik (ppp bis fff), feines Halbpedal.',
      horowitzDesc: 'Feurige Virtuosität, Doppeloktaven im Höhepunkt, stürmische Coda.',
      langLangDesc: 'Kristalline Fingerartikulation, leuchtende Mittelstimmen, lange Resonanzpedale.',
    },
    categories: {
      transition: 'Übergänge & Rubato',
      pedal: 'Pedal & Haltezeiten',
      fingering: 'Fingersatz & Handführung',
      toneColor: 'Klangfarbe & Stimmführung',
      rubato: 'Tempo-Elastizität',
    },
    warmups: {
      title: 'Konzert-Aufwärmen & Technik',
      subtitle: 'Hanon & Cortot Übungen zur Stärkung der Feinmotorik',
      startWarmup: 'Übung Starten',
      targetPiece: 'Ziel-Repertoire',
      difficulty: 'Schwierigkeit',
    },
    sightReading: {
      title: 'Notenlese-Trainer',
      subtitle: 'Interaktive Lernkarten mit Roland- & Mikrofon-Erkennung',
      streak: 'Serie',
      bestStreak: 'Beste Serie',
      reactionSpeed: 'Reaktionszeit',
      accuracy: 'Genauigkeit',
      correct: 'Richtig!',
      tryAgain: 'Noch einmal! Gesuchter Ton:',
      tapToAnswer: 'Taste antippen (Touchscreen)',
      mnemonicGuide: 'Merkregeln & Hilfen',
      clefAll: 'Alle Schlüssel (Großes Notensystem)',
      clefTreble: 'Nur Violinschlüssel (Rechte Hand)',
      clefBass: 'Nur Bassschlüssel (Linke Hand)',
    },
    tutorials: {
      title: 'Meisterkurs-Akademie',
      subtitle: 'Video-Meisterkurse, Handgelenksmechanik & interaktive Taktübungen',
      watchVideo: 'Meisterkurs-Video Ansehen',
      practiceInLab: 'Im Übelabor Trainieren',
      targetMeasures: 'Takte',
      keyFocus: 'Technischer Schwerpunkt',
      videoTimestamp: 'Video-Zeitmarke',
      wristGuidance: 'Handgelenks- & Armführung',
      pedalTip: 'Roland Dämpferpedal-Timing',
      pitfall: 'Häufiger technischer Fehler',
      backToLab: 'Zurück zum Übelabor',
    },
    homeFeed: {
      featured: 'Meisterwerk im Fokus',
      continuePlaying: 'Weiterüben',
      classicalMasterpieces: 'Klassische Meisterwerke & Repertoire',
      techniqueCourses: 'Technik-Übungen & Fingerkraft',
      masterclassVideoAcademy: 'Meisterkurs-Lektionen & Analyse',
      skillsAndLabs: 'Interaktive Fähigkeiten & Hardware-Labs',
      all: 'Alle Stücke',
      romantic: 'Romantik',
      classical: 'Klassik',
      impressionist: 'Impressionismus',
      technique: 'Technik',
      startPracticing: 'Jetzt Üben',
      inspectPiece: 'Details & Edition Wählen',
      chooseEdition: 'Interpretations-Edition Wählen',
      practiceMode: 'Übemodus',
      hands: 'Hände',
      bothHands: 'Beide Hände',
      rightHand: 'Rechte Hand',
      leftHand: 'Linke Hand',
      openInLab: 'Im Übelabor Öffnen',
      miniPlayerNowPlaying: 'Im Übelabor Aktiv',
      openPlayer: 'Klavier Öffnen',
      difficultyLevel: 'Schwierigkeit',
      searchSongs: 'Stücke, Komponisten, Übungen suchen...',
    },
    rolandModal: {
      title: 'Roland LX-9 Verbindungszentrum',
      subtitle: 'Bluetooth LE MIDI & Kontinuierlicher CC64 Dämpfer',
      pairBle: 'Bluetooth MIDI Koppeln',
      pairBleSub: 'Roland LX-9 Kabelloses BLE',
      connectUsb: 'USB MIDI Verbinden',
      connectUsbSub: 'Direktes Lightning / USB-C Kabel',
      disconnect: 'Trennen',
      waitingConnection: 'Warte auf Klavierverbindung',
      bleProtocol: 'Protokoll: BLE MIDI • Latenz ~4ms',
      damperDepth: 'Roland CC64 Dämpfer-Tiefe',
      damped: '0 (Gedämpft)',
      halfPedalRange: '40-70 (Halbpedal)',
      fullSustainRange: '127 (Volles Sustain)',
      virtualSimulator: 'Roland LX-9 Virtueller Simulator',
      enableSimulator: 'Simulator Aktivieren',
      simulatorDesc: 'Testen Sie fallende Noten, Haltezeiten und Feedback direkt auf dem Bildschirm ohne physisches Roland LX-9.',
      simulatePedal: 'Pedaldruck Simulieren',
      testChords: 'Test-Akkorde',
      pairingStepsTitle: 'Roland LX-9 Bluetooth Kopplungsschritte',
      step1: 'Tippen Sie auf dem Touchpanel des Roland LX-9 auf "Function".',
      step2: 'Wählen Sie "Bluetooth" und setzen Sie "Bluetooth MIDI: ON".',
      step3: 'Tippen Sie oben auf "Bluetooth MIDI Koppeln".',
      step4: 'Wählen Sie "Roland LX-9 MIDI" aus.',
      errorBle: 'Konnte Roland LX-9 Bluetooth MIDI nicht finden. Bitte prüfen Sie, ob Bluetooth am Klavier und Gerät aktiv ist.',
      errorUsb: 'Kein USB-MIDI-Klavier erkannt. Schließen Sie Ihr Roland LX-9 per USB-Kabel an.',
    },
    importModal: {
      title: 'Partitur- & MIDI-Import',
      subtitle: 'Laden Sie eigene Stücke und generieren Sie automatisch Meisterkurs-Anleitungen',
      tapToUpload: 'Tippen zum Laden von MIDI oder MusicXML',
      fileTypesHint: 'Unterstützt .mid, .midi und .musicxml von iPhone/iPad Dateien & PC',
      curatedTitle: 'Meisterkurs-Repertoire',
      parsing: 'Lese und analysiere Partitur...',
      success: 'KI-Meisterkurs erfolgreich erstellt für',
      unsupported: 'Nicht unterstütztes Format. Bitte wählen Sie eine .mid, .midi oder .musicxml Datei.',
    },
    libraryModal: {
      title: 'Notenbibliothek',
      subtitle: 'Meisterwerke & Historische Interpretations-Editionen',
      searchPlaceholder: 'Suche nach Chopin, Beethoven, Liszt, Debussy...',
      loadMasterclass: 'Meisterkurs Laden',
      level: 'Stufe',
      duration: 'Dauer',
      key: 'Tonart',
    },
    ui: {
      splitView: 'Geteilt',
      waterfallOnly: 'Wasserfall',
      sheetOnly: 'Noten',
      close: 'Schließen',
      play: 'Abspielen',
      pause: 'Pause',
      rewind: 'Zurücksetzen',
      measure: 'Takt',
      time: 'Zeit',
      library: 'Notenbibliothek',
      curatedScores: 'Meisterkurs-Repertoire',
      uploadFile: 'Tippen zum Laden von MIDI oder MusicXML',
      audioUnlocked: 'Audio Bereit',
      tapToUnlock: 'Tippen um Konzert-Audio zu aktivieren',
    },
  },
  fr: {
    appTitle: 'VIRTUOSO',
    subtitle: 'Piano de Concert & Masterclass',
    nav: {
      home: 'Découvrir',
      repertoire: 'Atelier Piano',
      tutorials: 'Leçons',
      warmups: 'Échauffement',
      sightReading: 'Entraîneur',
    },
    pairPiano: 'Connecter Piano',
    connected: 'Connecté',
    disconnected: 'Déconnecté',
    simulated: 'Simulateur Virtuel',
    masterclass: 'Pédagogie de Masterclass',
    practiceLab: 'Atelier de Pratique',
    tempo: 'Tempo',
    loopMeasures: 'Boucler Mesures',
    speedRamp: '+2% d’Accélération par Boucle',
    cameraAngle: 'Angle Caméra',
    importScore: 'Importer MIDI / MusicXML',
    microphone: 'Détection Acoustique Micro',
    micListening: 'Écoute du piano acoustique...',
    micOff: 'Micro Éteint',
    micActive: 'Micro Actif',
    wrongNoteDetected: 'Fausse Note Détectée !',
    mechanicalNoise: 'Bruit Mécanique du Piano',
    pedalDepth: 'Enfoncement Pédale CC64',
    halfPedal: 'Demi-Pédale (Résonance Feutrée)',
    fullSustain: 'Pédale Forte Entière',
    pedalDamped: 'Étouffoirs Baissés',
    pedalWhoosh: 'Souffle d’Étouffoirs Acoustique',
    videoTutorial: 'Tutoriel Vidéo de Maître',
    holdTimesSynced: 'Durées de tenue & rubato synchronisés',
    rule: 'Règle',
    waitModes: {
      bothHands: 'Attente : Deux Mains',
      rightHandOnly: 'Attente : Main Droite Seule',
      leftHandOnly: 'Attente : Main Gauche Seule',
    },
    variants: {
      original: 'Partition Originale',
      rightHand: 'Main Droite Solo',
      leftHand: 'Main Gauche Solo',
      waitForNote: 'Attente de Note (Cadence)',
      dottedLongShort: 'Pointé (Long-Court)',
      dottedShortLong: 'Pointé (Court-Long)',
      harmonicSkeleton: 'Squelette Harmonique',
    },
    editions: {
      title: 'Interprétation de Maître',
      urtext: 'Henle Urtext (Canonique)',
      zimerman: 'Krystian Zimerman (1987 DG)',
      horowitz: 'Vladimir Horowitz (1968 Carnegie)',
      langLang: 'Lang Lang / Seong-Jin Cho',
      urtextDesc: 'Édition Nationale Polonaise (Jan Ekier). Texte original pur de Chopin.',
      zimermanDesc: 'Cantabile aristocratique, rubato élastique, contrastes dynamiques immenses (ppp à fff).',
      horowitzDesc: 'Bravoure incandescente, octaves doublées au climax, coda torrentielle.',
      langLangDesc: 'Articulation digitale cristalline, polyphonie lumineuse, tenues de pédale chantantes.',
    },
    categories: {
      transition: 'Transitions & Rubato',
      pedal: 'Pédale & Durées de Tenue',
      fingering: 'Doigté & Geste',
      toneColor: 'Timbre & Équilibre',
      rubato: 'Élasticité du Tempo',
    },
    warmups: {
      title: 'Échauffements & Technique de Concert',
      subtitle: 'Exercices Hanon et Cortot pour la vélocité et l’indépendance',
      startWarmup: 'Lancer l’Exercice',
      targetPiece: 'Morceau Cible',
      difficulty: 'Difficulté',
    },
    sightReading: {
      title: 'Entraînement à la Lecture de Notes',
      subtitle: 'Flashcards interactives avec détection Roland et Micro acoustique',
      streak: 'Série',
      bestStreak: 'Meilleure Série',
      reactionSpeed: 'Vitesse de Réaction',
      accuracy: 'Précision',
      correct: 'Correct !',
      tryAgain: 'Réessayez ! Note cible :',
      tapToAnswer: 'Touchez une note pour répondre',
      mnemonicGuide: 'Astuces & Mnémotechnique',
      clefAll: 'Toutes les clés (Portée complète)',
      clefTreble: 'Clé de Sol seule (Main droite)',
      clefBass: 'Clé de Fa seule (Main gauche)',
    },
    tutorials: {
      title: 'Académie Masterclass',
      subtitle: 'Tutoriels vidéo, mécanique du poignet & exercices interactifs de mesures',
      watchVideo: 'Voir le Segment Vidéo',
      practiceInLab: 'Pratiquer dans l’Atelier',
      targetMeasures: 'Mesures',
      keyFocus: 'Point Technique Clé',
      videoTimestamp: 'Repère Vidéo',
      wristGuidance: 'Mécanique du Poignet & Bras',
      pedalTip: 'Pédale Roland & Demi-pédale',
      pitfall: 'Erreur Technique Fréquente',
      backToLab: 'Retourner à l’Atelier',
    },
    homeFeed: {
      featured: 'Chef-d’œuvre à l’Honneur',
      continuePlaying: 'Continuer la Pratique',
      classicalMasterpieces: 'Chefs-d’œuvre Classiques & Répertoire',
      techniqueCourses: 'Exercices Techniques & Vélocité',
      masterclassVideoAcademy: 'Leçons Masterclass & Analyse',
      skillsAndLabs: 'Compétences & Laboratoires Matériels',
      all: 'Tout le Répertoire',
      romantic: 'Romantique',
      classical: 'Classique',
      impressionist: 'Impressionniste',
      technique: 'Technique',
      startPracticing: 'Commencer à Jouer',
      inspectPiece: 'Inspecter & Choisir l’Édition',
      chooseEdition: 'Sélectionner l’Édition de Maître',
      practiceMode: 'Mode de Pratique',
      hands: 'Mains',
      bothHands: 'Deux Mains',
      rightHand: 'Main Droite',
      leftHand: 'Main Gauche',
      openInLab: 'Ouvrir dans l’Atelier',
      miniPlayerNowPlaying: 'En cours dans l’Atelier',
      openPlayer: 'Ouvrir Piano',
      difficultyLevel: 'Difficulté',
      searchSongs: 'Rechercher morceaux, compositeurs, exercices...',
    },
    rolandModal: {
      title: 'Centre de Connexion Roland LX-9',
      subtitle: 'Bluetooth LE MIDI & Pédale Continue CC64',
      pairBle: 'Jumeler Bluetooth MIDI',
      pairBleSub: 'Roland LX-9 Sans Fil BLE',
      connectUsb: 'Connecter USB MIDI',
      connectUsbSub: 'Câble Direct Lightning / USB-C',
      disconnect: 'Déconnecter',
      waitingConnection: 'En attente de connexion du piano',
      bleProtocol: 'Protocole : BLE MIDI • Latence ~4ms',
      damperDepth: 'Enfoncement Pédale CC64',
      damped: '0 (Étouffé)',
      halfPedalRange: '40-70 (Demi-Pédale)',
      fullSustainRange: '127 (Pédale Complète)',
      virtualSimulator: 'Simulateur Virtuel Roland LX-9',
      enableSimulator: 'Activer Simulateur',
      simulatorDesc: 'Testez les notes descendantes, le maintien de pédale et les retours sur votre écran sans piano physique.',
      simulatePedal: 'Simuler Pression Pédale',
      testChords: 'Accords Test',
      pairingStepsTitle: 'Étapes de Jumelage Bluetooth Roland LX-9',
      step1: 'Sur l’écran tactile du Roland LX-9, touchez "Function".',
      step2: 'Sélectionnez "Bluetooth" et réglez "Bluetooth MIDI : ON".',
      step3: 'Touchez le bouton bleu "Jumeler Bluetooth MIDI" ci-dessus.',
      step4: 'Sélectionnez "Roland LX-9 MIDI".',
      errorBle: 'Impossible de trouver le Roland LX-9. Vérifiez que le Bluetooth est activé sur le piano et l’appareil.',
      errorUsb: 'Aucun piano USB MIDI détecté. Branchez votre câble USB.',
    },
    importModal: {
      title: 'Importateur de Partitions & MIDI',
      subtitle: 'Importez vos propres morceaux pour générer des tutoriels complets',
      tapToUpload: 'Touchez pour choisir un fichier MIDI ou MusicXML',
      fileTypesHint: 'Prend en charge .mid, .midi et .musicxml',
      curatedTitle: 'Répertoire Masterclass',
      parsing: 'Lecture et analyse musicale...',
      success: 'Masterclass IA générée avec succès pour',
      unsupported: 'Format non supporté. Veuillez choisir un fichier .mid ou .musicxml.',
    },
    libraryModal: {
      title: 'Bibliothèque de Partitions',
      subtitle: 'Chefs-d’œuvre & Éditions Historiques',
      searchPlaceholder: 'Rechercher Chopin, Beethoven, Liszt, Debussy...',
      loadMasterclass: 'Charger Masterclass',
      level: 'Niv.',
      duration: 'Durée',
      key: 'Tonalité',
    },
    ui: {
      splitView: 'Partagé',
      waterfallOnly: 'Cascade',
      sheetOnly: 'Partition',
      close: 'Fermer',
      play: 'Lecture',
      pause: 'Pause',
      rewind: 'Remise à zéro',
      measure: 'Mesure',
      time: 'Temps',
      library: 'Bibliothèque de Partitions',
      curatedScores: 'Répertoire Masterclass',
      uploadFile: 'Touchez pour choisir un fichier MIDI ou MusicXML',
      audioUnlocked: 'Audio Actif',
      tapToUnlock: 'Touchez pour débloquer l’audio de concert',
    },
  },
  ja: {
    appTitle: 'VIRTUOSO',
    subtitle: 'コンサートピアノ・マスタークラス',
    nav: {
      home: 'ホーム',
      repertoire: 'ピアノラボ',
      tutorials: 'レッスン',
      warmups: 'ウォームアップ',
      sightReading: '読譜トレ',
    },
    pairPiano: 'ピアノ接続',
    connected: '接続完了',
    disconnected: '未接続',
    simulated: '仮想ブリッジ',
    masterclass: 'マスタークラス解説',
    practiceLab: '練習ラボ',
    tempo: 'テンポ',
    loopMeasures: '小節ループ',
    speedRamp: 'ループ毎に+2%自動加速',
    cameraAngle: 'カメラアングル',
    importScore: 'MIDI / MusicXML取込',
    microphone: 'マイク音程検出',
    micListening: 'アコースティックピアノ聴取中...',
    micOff: 'マイクOFF',
    micActive: 'マイク動作中',
    wrongNoteDetected: 'ミスノート検出！',
    mechanicalNoise: 'アコースティック機構音',
    pedalDepth: 'Roland CC64 ダンパー深度',
    halfPedal: 'ハーフペダル（共鳴保持）',
    fullSustain: 'フルサステイン',
    pedalDamped: '消音ダンパー',
    pedalWhoosh: 'ダンパー風切りノイズ',
    videoTutorial: 'マスター動画解説',
    holdTimesSynced: '保持時間とルバート同期中',
    rule: '規則',
    waitModes: {
      bothHands: '待機：両手',
      rightHandOnly: '待機：右手のみ',
      leftHandOnly: '待機：左手のみ',
    },
    variants: {
      original: '原曲スコア',
      rightHand: '右手ソロ',
      leftHand: '左手ソロ',
      waitForNote: 'ノート待機（打鍵待ち）',
      dottedLongShort: '付点リズム（長-短）',
      dottedShortLong: '付点リズム（短-長）',
      harmonicSkeleton: '和音スケルトン',
    },
    editions: {
      title: '巨匠の演奏解釈',
      urtext: 'ヘンレ原典版（エキエル版準拠）',
      zimerman: 'クリスチャン・ツィメルマン (1987 DG)',
      horowitz: 'ウラディミール・ホロヴィッツ (1968)',
      langLang: 'ラン・ラン / チョ・ソンジン',
      urtextDesc: 'ポーランド国民版（エキエル）。純粋なショパンのオリジナル譜。',
      zimermanDesc: '気品溢れるカンタービレ、自在なルバート、pppからfffの圧倒的ダイナミクス。',
      horowitzDesc: '情熱的なブラヴーラ、クライマックスのオクターヴ補強、圧倒的なコーダ。',
      langLangDesc: '透明感ある指のタッチ、明瞭な内声部の歌い回し、豊かなペダル残響。',
    },
    categories: {
      transition: '転換（ウーバーガング）とルバート',
      pedal: 'ペダル操作と保持時間',
      fingering: '運指法と腕の重み',
      toneColor: '音色と声部バランス',
      rubato: 'テンポの呼吸',
    },
    warmups: {
      title: '基礎技術＆ウォームアップ',
      subtitle: 'ハノンとコルトーの処方箋による指の独立と敏捷性強化',
      startWarmup: '練習開始',
      targetPiece: '対象楽曲',
      difficulty: '難易度',
    },
    sightReading: {
      title: '読譜力トレーニング',
      subtitle: 'Roland LX-9およびマイク検出による瞬発的な譜読み特訓',
      streak: '連続正解',
      bestStreak: '最高記録',
      reactionSpeed: '反応速度',
      accuracy: '正解率',
      correct: '正解！',
      tryAgain: 'もう一度！指定音：',
      tapToAnswer: '鍵盤をタップして回答',
      mnemonicGuide: '読譜のコツと覚え方',
      clefAll: '全音部記号（大譜表）',
      clefTreble: 'ト音記号のみ（右手）',
      clefBass: 'ヘ音記号のみ（左手）',
    },
    tutorials: {
      title: 'マスタークラス・アカデミー',
      subtitle: '動画レッスン・手首と腕の脱力脱腱・小節別実践ドリル',
      watchVideo: '解説動画を見る',
      practiceInLab: '練習ラボで特訓',
      targetMeasures: '対象小節',
      keyFocus: '技術の要点',
      videoTimestamp: '動画再生位置',
      wristGuidance: '手首と腕の脱力法',
      pedalTip: 'Rolandペダル制御のコツ',
      pitfall: '陥りやすい演奏の罠',
      backToLab: '練習ラボに戻る',
    },
    homeFeed: {
      featured: '今週の特別名曲',
      continuePlaying: '練習を再開する',
      classicalMasterpieces: 'クラシック不朽の名曲・レパートリー',
      techniqueCourses: '技術ドリル＆指の瞬発力強化',
      masterclassVideoAcademy: 'マスタークラス動画解説＆楽曲分析',
      skillsAndLabs: '読譜＆Rolandハードウェアラボ',
      all: 'すべての楽曲',
      romantic: 'ロマン派',
      classical: '古典派',
      impressionist: '印象派',
      technique: '基礎技術',
      startPracticing: '今すぐ練習を開始',
      inspectPiece: '楽曲詳細・版を選択',
      chooseEdition: '演奏エディションを選択',
      practiceMode: '練習モード',
      hands: '演奏手',
      bothHands: '両手',
      rightHand: '右手のみ',
      leftHand: '左手のみ',
      openInLab: 'ピアノラボで開く',
      miniPlayerNowPlaying: 'ピアノラボで再生中',
      openPlayer: 'ピアノを開く',
      difficultyLevel: '難易度',
      searchSongs: '曲名、作曲家、練習曲を検索...',
    },
    rolandModal: {
      title: 'Roland LX-9 接続センター',
      subtitle: 'Bluetooth LE MIDI & 連続CC64ダンパー',
      pairBle: 'Bluetooth MIDI ペアリング',
      pairBleSub: 'Roland LX-9 ワイヤレスBLE',
      connectUsb: 'USB MIDI 接続',
      connectUsbSub: 'Lightning / USB-C ケーブル直結',
      disconnect: '接続解除',
      waitingConnection: 'ピアノ接続待機中',
      bleProtocol: 'プロトコル: BLE MIDI • レイテンシ ~4ms',
      damperDepth: 'Roland CC64 ダンパー深度',
      damped: '0 (消音)',
      halfPedalRange: '40-70 (ハーフペダル)',
      fullSustainRange: '127 (フルサステイン)',
      virtualSimulator: 'Roland LX-9 仮想シミュレータ',
      enableSimulator: 'シミュレータ起動',
      simulatorDesc: '実機が手元になくても画面上で鍵盤・ペダル保持時間・フィードバックをテストできます。',
      simulatePedal: 'ペダル踏み込みシミュレート',
      testChords: 'テストコード',
      pairingStepsTitle: 'Roland LX-9 Bluetooth ペアリング手順',
      step1: 'Roland LX-9のタッチパネルで「Function」をタップ。',
      step2: '「Bluetooth」を選択し「Bluetooth MIDI: ON」に設定。',
      step3: '上の青い「Bluetooth MIDI ペアリング」をタップ。',
      step4: '「Roland LX-9 MIDI」を選択します。',
      errorBle: 'Roland LX-9が見つかりません。ピアノと端末のBluetoothがONになっているか確認してください。',
      errorUsb: 'USB MIDIピアノが検出されません。ケーブル接続を確認してください。',
    },
    importModal: {
      title: '楽譜 & MIDI インポーター',
      subtitle: '自作ファイルを取り込んでAIマスタークラス解説を自動生成',
      tapToUpload: 'MIDIまたはMusicXMLを選択',
      fileTypesHint: '.mid、.midi、.musicxml ファイルに対応',
      curatedTitle: '厳選マスタークラス楽曲',
      parsing: '楽譜を解析中...',
      success: 'AIマスタークラスの生成完了：',
      unsupported: '対応していない形式です。.midまたは.musicxmlを選択してください。',
    },
    libraryModal: {
      title: '楽譜ライブラリ',
      subtitle: '名曲コレクション & 歴史的名演エディション',
      searchPlaceholder: 'ショパン、ベートーヴェン、リスト、ドビュッシーを検索...',
      loadMasterclass: 'マスタークラス読込',
      level: 'Lv.',
      duration: '演奏時間',
      key: '調性',
    },
    ui: {
      splitView: '分割',
      waterfallOnly: '滝',
      sheetOnly: '楽譜',
      close: '閉じる',
      play: '再生',
      pause: '一時停止',
      rewind: '最初へ',
      measure: '小節',
      time: '時間',
      library: '楽譜ライブラリ',
      curatedScores: '厳選マスタークラス楽曲',
      uploadFile: 'MIDIまたはMusicXMLを選択',
      audioUnlocked: '音源アクティブ',
      tapToUnlock: 'タップしてピアノ音声を起動',
    },
  },
  zh: {
    appTitle: 'VIRTUOSO',
    subtitle: '大师级音乐会钢琴',
    nav: {
      home: '发现主页',
      repertoire: '练琴工坊',
      tutorials: '大师课程',
      warmups: '热身基本功',
      sightReading: '视奏训练',
    },
    pairPiano: '配对钢琴',
    connected: '已连接',
    disconnected: '未连接',
    simulated: '虚拟模拟桥',
    masterclass: '大师课教学指导',
    practiceLab: '练习工坊',
    tempo: '速度',
    loopMeasures: '小节循环',
    speedRamp: '每次循环提速 +2%',
    cameraAngle: '视角切换',
    importScore: '导入 MIDI / MusicXML',
    microphone: '麦克风原声拾音检测',
    micListening: '正在监听原声钢琴声音...',
    micOff: '麦克风已关闭',
    micActive: '麦克风拾音中',
    wrongNoteDetected: '检测到弹错音符！',
    mechanicalNoise: '原声三角钢琴机械杂音',
    pedalDepth: 'Roland CC64 踏板深度',
    halfPedal: '半踏板（泛音回响）',
    fullSustain: '全延音踏板',
    pedalDamped: '制音器下落',
    pedalWhoosh: '踏板制音起落风声',
    videoTutorial: '大师示范视频',
    holdTimesSynced: '音符时值与弹性速度同步',
    rule: '规则',
    waitModes: {
      bothHands: '等待模式：双手同时',
      rightHandOnly: '等待模式：仅右手',
      leftHandOnly: '等待模式：仅左手',
    },
    variants: {
      original: '原始乐谱',
      rightHand: '右手独奏',
      leftHand: '左手独奏',
      waitForNote: '按键等待（弹准再前进）',
      dottedLongShort: '附点节奏（长-短）飞跑训练',
      dottedShortLong: '附点节奏（短-长）离键爆发',
      harmonicSkeleton: '和声骨架（和弦跨步）',
    },
    editions: {
      title: '大师演奏版本',
      urtext: '原典版 Henle / 国家版 (艾基尔)',
      zimerman: '齐默尔曼 Krystian Zimerman (1987 DG)',
      horowitz: '霍洛维茨 Vladimir Horowitz (1968)',
      langLang: '郎朗 / 赵成珍 Seong-Jin Cho',
      urtextDesc: '波兰国家版肖邦手稿原版，严谨权威的和声与踏板。',
      zimermanDesc: '贵族般的如歌咏唱、富有弹性的自由速度(Rubato)与ppp至fff的惊人动态。',
      horowitzDesc: '炽热狂放的个人英雄主义，高潮处标志性八度加倍与凶猛的终曲。',
      langLangDesc: '晶莹剔透的高音颗粒感，层次分明的内声部歌唱与充沛的踏板共鸣。',
    },
    categories: {
      transition: '乐段过渡(Übergang)与弹性速度',
      pedal: '踏板动作与音符保持时值',
      fingering: '指法规划与手臂重心转移',
      toneColor: '音色层次与触键发力',
      rubato: '呼吸式弹性速度',
    },
    warmups: {
      title: '音乐会级热身与技术突破',
      subtitle: '哈农与科尔托神经反射针对性强化训练',
      startWarmup: '开始练琴',
      targetPiece: '针对乐曲',
      difficulty: '技术难度',
    },
    sightReading: {
      title: '快速读谱与视奏反应训练',
      subtitle: '支持 Roland 电钢琴与原声钢琴麦克风实时识别打卡',
      streak: '连续正确',
      bestStreak: '最佳连胜',
      reactionSpeed: '击键反应用时',
      accuracy: '正确率',
      correct: '正确！',
      tryAgain: '弹错了，再试一次！目标音：',
      tapToAnswer: '点击虚拟琴键作答',
      mnemonicGuide: '五线谱记忆秘诀',
      clefAll: '全谱表（高低音大谱表）',
      clefTreble: '仅高音谱号（右手视奏）',
      clefBass: '仅低音谱号（左手视奏）',
    },
    tutorials: {
      title: '大师课课堂',
      subtitle: '示范视频讲解、手腕发力力学与乐段针对性循环实战',
      watchVideo: '观看大师示范视频',
      practiceInLab: '在练习工坊中特训',
      targetMeasures: '目标小节',
      keyFocus: '核心技术要点',
      videoTimestamp: '视频对应时间',
      wristGuidance: '手腕与手臂重力传导',
      pedalTip: 'Roland 踏板踩放时机',
      pitfall: '初学者常见弹奏误区',
      backToLab: '返回练习工坊',
    },
    homeFeed: {
      featured: '传世名曲特荐',
      continuePlaying: '继续练琴',
      classicalMasterpieces: '音乐会传世经典与大师曲库',
      techniqueCourses: '基本功训练与手指机能飞跃',
      masterclassVideoAcademy: '大师课视频讲解与乐段精析',
      skillsAndLabs: '视奏强化与 Roland 硬件声学实验室',
      all: '全部曲目',
      romantic: '浪漫主义',
      classical: '古典主义',
      impressionist: '印象主义',
      technique: '基本功技术',
      startPracticing: '进入练琴工坊',
      inspectPiece: '查看乐谱详情与版本',
      chooseEdition: '选择大师演奏版本',
      practiceMode: '练习模式',
      hands: '演奏手别',
      bothHands: '双手弹奏',
      rightHand: '仅练右手',
      leftHand: '仅练左手',
      openInLab: '进入练习工坊',
      miniPlayerNowPlaying: '正在工坊练琴中',
      openPlayer: '展开钢琴',
      difficultyLevel: '曲目难度',
      searchSongs: '搜索乐曲、作曲家、练习曲...',
    },
    rolandModal: {
      title: 'Roland LX-9 连接中心',
      subtitle: '蓝牙低功耗 MIDI & 连续 CC64 踏板感知',
      pairBle: '配对蓝牙 MIDI',
      pairBleSub: 'Roland LX-9 无线蓝牙',
      connectUsb: '连接 USB MIDI',
      connectUsbSub: '直连 Lightning / USB-C 数据线',
      disconnect: '断开连接',
      waitingConnection: '正在等待钢琴连接',
      bleProtocol: '协议: BLE MIDI • 极低延迟 ~4ms',
      damperDepth: 'Roland CC64 延音深度',
      damped: '0 (完全制音)',
      halfPedalRange: '40-70 (半踏板模式)',
      fullSustainRange: '127 (全踏板延音)',
      virtualSimulator: 'Roland LX-9 虚拟模拟器',
      enableSimulator: '启用虚拟钢琴',
      simulatorDesc: '即使琴不在身边，也可以在屏幕上直接测试瀑布流、踏板保持时值及判定反馈。',
      simulatePedal: '模拟踏板踩踏深度',
      testChords: '测试琴键',
      pairingStepsTitle: 'Roland LX-9 蓝牙配对步骤',
      step1: '在 Roland LX-9 触控面板上，轻触 "Function" 设置键。',
      step2: '找到 "Bluetooth" 选项并将 "Bluetooth MIDI" 设为 "ON"。',
      step3: '点击上方的蓝色 "配对蓝牙 MIDI" 按钮。',
      step4: '在设备列表中选择 "Roland LX-9 MIDI"。',
      errorBle: '未找到 Roland LX-9 蓝牙设备。请确保钢琴与本机的蓝牙均已开启。',
      errorUsb: '未检测到 USB MIDI 钢琴。请检查数据线连接。',
    },
    importModal: {
      title: '乐谱与 MIDI 导入器',
      subtitle: '导入自己的乐谱，系统将自动生成大师课教程与跳跃标注',
      tapToUpload: '点击选择设备中的 MIDI 或 MusicXML 文件',
      fileTypesHint: '支持 iPhone/iPad 文件 App 及电脑端 .mid, .midi, .musicxml',
      curatedTitle: '经典大师课曲目',
      parsing: '正在解析乐谱和声与指法...',
      success: '已成功生成 AI 大师课教程：',
      unsupported: '不支持的格式，请选择 .mid 或 .musicxml 文件。',
    },
    libraryModal: {
      title: '乐谱曲库',
      subtitle: '经典传世名曲 & 历史大师演奏版本',
      searchPlaceholder: '搜索肖邦、贝多芬、李斯特、德彪西...',
      loadMasterclass: '载入大师课',
      level: '难度',
      duration: '时长',
      key: '调性',
    },
    ui: {
      splitView: '分屏',
      waterfallOnly: '瀑布流',
      sheetOnly: '五线谱',
      close: '关闭',
      play: '播放',
      pause: '暂停',
      rewind: '回到开头',
      measure: '小节',
      time: '时间',
      library: '乐谱曲库',
      curatedScores: '经典大师课曲目',
      uploadFile: '点击选择设备中的 MIDI 或 MusicXML 文件',
      audioUnlocked: '音频已就绪',
      tapToUnlock: '轻触屏幕开启音乐会三角钢琴音色',
    },
  },
}
