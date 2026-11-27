// Conservatory Pedagogy Rubric for Frédéric Chopin's Ballade No. 1 in G minor, Op. 23
// Deeply engineered for Measures 1–26 (Lento Recitative + Moderato First Theme Statement)
// plus structural benchmarks for the remaining sections.

export interface PhraseRubric {
  id: string
  measureRange: [number, number]
  titleDe: string
  titleEn: string
  tempoRangeBpm: [number, number]
  targetMelodyVel: [number, number] // Expected RH melody velocity range (1–127)
  targetAccompVel: [number, number] // Expected LH / inner chord accompaniment velocity range
  minVoicingLead: number // Minimum RH melody - accomp MIDI velocity advantage
  minLegatoHoldRatio: number // Minimum holdDuration / expectedDuration for cantabile depth
  maxRecommendedPedalDepth: number // CC64 ceiling (lower for M.1-6 recitative & M.24-25 chromatic bass!)
  expectPedalCleanChanges: boolean
  maxChordSpreadMs: number // Maximum acceptable unintentional hand flamming (higher for rolled M.7!)
  keyFocusDe: string
  keyFocusEn: string
  commonMistakesDe: string[]
  commonMistakesEn: string[]
  touchAdviceDe: string
  touchAdviceEn: string
}

export const BALLADE_NO1_RUBRIC: PhraseRubric[] = [
  {
    id: 'bal-p1-lento-opening',
    measureRange: [1, 3],
    titleDe: 'Takt 1–3: Lento pesante — Deklamation & Neapolitanisches As-Dur',
    titleEn: 'M. 1–3: Lento pesante — Declamation & Neapolitan Ab Major',
    tempoRangeBpm: [54, 70],
    targetMelodyVel: [76, 102],
    targetAccompVel: [66, 92],
    minVoicingLead: 4,
    minLegatoHoldRatio: 0.82,
    maxRecommendedPedalDepth: 45,
    expectPedalCleanChanges: true,
    maxChordSpreadMs: 32,
    keyFocusDe:
      'Majestätische Ruhe ohne Hast: Tiefes Armgewicht auf der C-Oktave, dann organisches Diminuendo ab Takt 2 ohne zu rennen.',
    keyFocusEn:
      'Majestic unhurried nobility: deep arm-weight drop into the opening C octave, then organic diminuendo from M. 2 without rushing.',
    commonMistakesDe: [
      'Zu schneller, geschlagener Tastenanschlag (Velocity > 108) statt weichem, tiefem Armgewicht.',
      'Beschleunigen in den aufsteigenden Achteln ab Takt 2 — das Rezitativ verliert seine Würde.',
      'Zu viel Dämpferpedal (CC64 > 80) verschmiert die aufsteigenden Oktaven.',
    ],
    commonMistakesEn: [
      'Slapped/percussive fast key attack (vel > 108) instead of deep cushioned arm weight.',
      'Rushing the ascending eighth notes in M. 2–3, losing recitative gravitas.',
      'Over-pedaling (CC64 > 80) blurs the ascending Neapolitan octaves.',
    ],
    touchAdviceDe:
      'Lege die Finger vor dem Ton bereits auf die Tasten (kein Ausholen aus der Luft!) und sinke langsam bis zum Tastenboden durch.',
    touchAdviceEn:
      'Place fingers on the key surface before striking (no airborne slapping) and sink smoothly to the keybed.',
  },
  {
    id: 'bal-p2-chromatic-sigh',
    measureRange: [4, 5],
    titleDe: 'Takt 4–5: Piano-Abstieg & Triolen-Balance',
    titleEn: 'M. 4–5: Piano Chromatic Descent & Triplets',
    tempoRangeBpm: [54, 68],
    targetMelodyVel: [42, 64],
    targetAccompVel: [36, 58],
    minVoicingLead: 4,
    minLegatoHoldRatio: 0.8,
    maxRecommendedPedalDepth: 40,
    expectPedalCleanChanges: true,
    maxChordSpreadMs: 30,
    keyFocusDe:
      'Klarer dynamischer Rückzug ins zarte Piano (p). Gleichmäßige Triolen in Takt 4 (Schlag 4) und Takt 5 (Schlag 2).',
    keyFocusEn:
      'Clear dynamic drop into intimate piano (p). Even, unhurried triplets on M. 4 beat 4 and M. 5 beat 2.',
    commonMistakesDe: [
      'Lautstärke bleibt im mf/f hängen statt deutlich ins Piano (Velocity 45–60) zurückzugehen.',
      'Die punktierte Achtel + Sechzehntel in Takt 5 wird rhythmisch verwaschen oder die Triole gehetzt.',
      'Abruptes Abreißen der letzten Note D in Takt 5 (hohe Release-Velocity).',
    ],
    commonMistakesEn: [
      'Staying stuck in mf/f instead of dropping genuinely into piano (vel 45–60).',
      'Compressing the dotted-8th + 16th in M. 5 or hurrying the triplets.',
      'Snapping off the final D in M. 5 with high release velocity instead of floating upward.',
    ],
    touchAdviceDe:
      'Langsamerer, flacher Tastenweg im Piano — führe die Hand am Ende von Takt 5 weich nach oben aus der Taste heraus.',
    touchAdviceEn:
      'Slower, flatter key descent for intimate piano — float the wrist gently off the final D in M. 5.',
  },
  {
    id: 'bal-p3-espressivo-fermata',
    measureRange: [6, 7],
    titleDe: 'Takt 6–7: Espressivo & Große Frage-Fermate (Vorbereitung g-Moll)',
    titleEn: 'M. 6–7: Espressivo & Rhetorical Breath before Moderato',
    tempoRangeBpm: [48, 66],
    targetMelodyVel: [52, 74],
    targetAccompVel: [38, 56],
    minVoicingLead: 12,
    minLegatoHoldRatio: 0.88,
    maxRecommendedPedalDepth: 127,
    expectPedalCleanChanges: true,
    maxChordSpreadMs: 110, // Intentional expressive arpeggiation allowed in M. 7!
    keyFocusDe:
      'Singendes C5–G4 (Takt 6), dann der ikonische arpeggierte Akkord in Takt 7 mit vollem, warmem Pedal — Raum lassen vor Takt 8!',
    keyFocusEn:
      'Singing C5–G4 (M. 6), then the iconic rolled chord in M. 7 with warm full pedal — hold the suspenseful silence before M. 8!',
    commonMistakesDe: [
      'Zu ungeduldiges Weiterhetzen nach Takt 7 — der Akkord braucht Zeit zum Ausschwingen.',
      'Dämpferpedal in Takt 7 wird nicht sauber gelöst, bevor der tiefe Bass D2 in Takt 8 einsetzt.',
      'Linke Hand (Es–G–C / D–G–Es) ist lauter als das singende Bb4 in der rechten Hand.',
    ],
    commonMistakesEn: [
      'Cutting M. 7 short without letting the rhetorical question hang in the air.',
      'Failing to clear M. 7 damper pedal cleanly before the low D2 pickup in M. 8.',
      'Left hand chord louder than the top Bb4 singing note.',
    ],
    touchAdviceDe:
      'Rolle den Takt-7-Akkord weich von unten nach oben mit dem Oberton Bb4 als klanglichem Ziel und löse das Pedal erst kurz vor Takt 8.',
    touchAdviceEn:
      'Roll the M. 7 chord warmly bottom-to-top aiming into Bb4, then clear the damper cleanly before M. 8.',
  },
  {
    id: 'bal-p4-moderato-statement',
    measureRange: [8, 12],
    titleDe: 'Takt 8–12: Moderato dolce — Erstes Thema im 6/4-Wiegeschritt',
    titleEn: 'M. 8–12: Moderato dolce — First Theme Statement (6/4 Lilt)',
    tempoRangeBpm: [76, 96],
    targetMelodyVel: [60, 82],
    targetAccompVel: [34, 54],
    minVoicingLead: 16,
    minLegatoHoldRatio: 0.78,
    maxRecommendedPedalDepth: 88,
    expectPedalCleanChanges: true,
    maxChordSpreadMs: 36,
    keyFocusDe:
      'Das Herz der Kritik vieler Klavierlehrer: 6/4 in ZWEI weiten Bögen (1–2–3 | 4–5–6) denken, Melodie (punktierte Halbe) singend +18 Velocity über flüsternden Begleitakkorden!',
    keyFocusEn:
      'The #1 teacher focus: feel 6/4 in TWO broad waves (1–2–3 | 4–5–6), singing soprano dotted-half melody +18 velocity above whispered inner chords!',
    commonMistakesDe: [
      'Begleitakkorde auf Schlag 2–3 und 5–6 werden zu laut und klobig gespielt („Stampf-Walzer“ statt dolce).',
      'Punktierte Halbe der Melodie (G4, D5, C5, E4, F#4) werden mit den Fingern zu früh losgelassen (< 60% Haltedauer) — kein echtes Finger-Legato!',
      'Pedal wird über Takt 10 (c-Moll → D7) durchgehalten und erzeugt trübe Harmonie-Suppe.',
      'Rechte und linke Hand landen asynchron (ungewolltes Nachklappen / Flamming).',
    ],
    commonMistakesEn: [
      'Inner accompaniment chords on beats 2–3 & 5–6 played too loud/heavy (stiff oom-pah instead of dolce).',
      'Dotted-half melody notes (G4, D5, C5, E4, F#4) released too early by the fingers (< 60% hold) instead of true finger-legato.',
      'Holding one pedal across M. 10 (Cm/A → D7) creates muddy dissonance.',
      'Chronic hand desync (unintentional flamming between LH bass and RH inner chords).',
    ],
    touchAdviceDe:
      'Gewicht in die Außenkante der rechten Hand (Finger 4–5) verlagern; die Daumen-Begleitung (Bb3–D4, Eb4–G4) mit ganz langsamer Tastengeschwindigkeit fast geräuschlos streicheln.',
    touchAdviceEn:
      'Lean arm weight gently toward the outer right hand (fingers 4–5); stroke thumb-side accompaniment chords with slow, feather-light key speed.',
  },
  {
    id: 'bal-p5-g5-soaring-arch',
    measureRange: [13, 16],
    titleDe: 'Takt 13–16: Aufschwung zum G5 & Erster Phrasenabschluss',
    titleEn: 'M. 13–16: Soaring Reach to G5 & First Cadence',
    tempoRangeBpm: [76, 98],
    targetMelodyVel: [66, 90],
    targetAccompVel: [38, 58],
    minVoicingLead: 16,
    minLegatoHoldRatio: 0.8,
    maxRecommendedPedalDepth: 88,
    expectPedalCleanChanges: true,
    maxChordSpreadMs: 36,
    keyFocusDe:
      'Leuchtender, aber niemals schriller Höhepunkt auf G5 (Takt 13, Schlag 4) → F5 (Takt 14), dann schmelzendes Abschwellen über Cis5–D5–C5 (Takt 15–16).',
    keyFocusEn:
      'Radiant yet never harsh peak on G5 (M. 13 beat 4) → F5 (M. 14), then melting diminuendo through C#5–D5–C5 (M. 15–16).',
    commonMistakesDe: [
      'Harter, schneller „Kleiner-Finger-Schlag“ auf dem hohen G5 (Velocity > 98 mit dünnem, spitzem Klang).',
      'Eintönige Lautstärke ohne spürbaren Bogen hin zum G5 und wieder zurück in Takt 16.',
      'Pedalwechsel zwischen Takt 14 (F5/Bb) und Takt 15 (Cis5 → D5) verschleppt.',
    ],
    commonMistakesEn: [
      'Pinched, overly fast pinky strike on high G5 (vel > 98 causing a brittle ping).',
      'Flat dynamics with no perceptible swell toward G5 and taper into M. 16.',
      'Blurred pedal across the chromatic C#5 → D5 resolution in M. 15.',
    ],
    touchAdviceDe:
      'Öffne das Handgelenk weich beim Sprung zum G5 und sinke tief statt schnell in die Taste — ein langsamerer, schwerer Anschlag klingt rund und gesanglich!',
    touchAdviceEn:
      'Open the wrist smoothly into G5 and use deep arm weight rather than fast finger slapping — round cantabile tone comes from cushioned weight.',
  },
  {
    id: 'bal-p6-varied-return',
    measureRange: [17, 23],
    titleDe: 'Takt 17–23: Vertiefte Wiederkehr & Harmonische Öffnung (G7 → c-Moll)',
    titleEn: 'M. 17–23: Deepened Return & Harmonic Opening (G7 → Cm)',
    tempoRangeBpm: [78, 100],
    targetMelodyVel: [62, 92],
    targetAccompVel: [38, 60],
    minVoicingLead: 15,
    minLegatoHoldRatio: 0.78,
    maxRecommendedPedalDepth: 86,
    expectPedalCleanChanges: true,
    maxChordSpreadMs: 36,
    keyFocusDe:
      'Takt 17–20 nicht mechanisch identisch zu Takt 9–12 spielen! Ab Takt 21 (H-Auflösungszeichen in G7) wächst die innere Spannung in den weiten Bogen Takt 22–23.',
    keyFocusEn:
      'Do not play M. 17–20 mechanically identical to M. 9–12! From M. 21 (G7 with B natural) build true emotional expansion into M. 22–23.',
    commonMistakesDe: [
      'Geringe dynamische Spannweite (alles im gleichförmigen mp/mf ohne Kontrast zwischen Takt 17 und Takt 22).',
      'Linke Hand Oktav-Bässe in Takt 22–23 (C2–C3, D2–D3, Es2–Es3) werden abrupt gekappt statt warm getragen.',
      'Zu hohe Anschlagshärte in den dichten Dreiklangs-Begleitungen der rechten Hand (Takt 21–22).',
    ],
    commonMistakesEn: [
      'Narrow dynamic span — playing M. 17 and M. 22 at identical flat volume.',
      'Cutting off the resonant LH bass octaves in M. 22–23 instead of letting them anchor the harmony.',
      'Over-striking the thicker 3-note RH inner chords in M. 21–22.',
    ],
    touchAdviceDe:
      'Gib den tiefen Basstönen in Takt 22–23 (C2, D2, Es2) einen warmen, langsamen „Cello-Strich“ und halte die inneren Begleitakkorde transparent.',
    touchAdviceEn:
      'Give the deep bass notes in M. 22–23 (C2, D2, Eb2) a warm, slow cello-like touch while keeping inner chords transparent.',
  },
  {
    id: 'bal-p7-chromatic-bass-bridge',
    measureRange: [24, 26],
    titleDe: 'Takt 24–26: Laufender Chromatischer Bass & Übergang zum Tenuto',
    titleEn: 'M. 24–26: Chromatic Running Bass & Cadence into Tenuto',
    tempoRangeBpm: [76, 98],
    targetMelodyVel: [60, 88],
    targetAccompVel: [42, 64],
    minVoicingLead: 12,
    minLegatoHoldRatio: 0.78,
    maxRecommendedPedalDepth: 66, // Half-pedal essential for running bass 8ths!
    expectPedalCleanChanges: true,
    maxChordSpreadMs: 34,
    keyFocusDe:
      'Halbpedal-Meisterprüfung! Die linke Hand singt bewegte Achtel-Linien (H–C–D–C / Cis–D–Es) — bei vollem Pedal (CC64 > 90) verschwimmt alles sofort. Gleichmäßiges Tempo ohne Hetzen!',
    keyFocusEn:
      'Half-pedal mastery test! LH sings moving 8th-note chromatic lines (B–C–D–C / C#–D–Eb) — full pedal (CC64 > 90) instantly turns it into mud. Keep tempo poised!',
    commonMistakesDe: [
      'Durchgetretenes Vollpedal (CC64 100–127) verschmiert die chromatischen Achtel in Takt 24–25.',
      'Beschleunigen in den linken Achteln (Takt 24–25), wodurch der 6/4-Puls kippt.',
      'Takt 26 fällt plötzlich auseinander statt ruhig im Piano (p) die nächste Phrase einzuleiten.',
    ],
    commonMistakesEn: [
      'Pinned full damper pedal (CC64 100–127) muddies the chromatic 8th-note bass in M. 24–25.',
      'Accelerating during the LH 8th notes in M. 24–25, destabilizing the 6/4 bar pulse.',
      'Dropping poise in M. 26 instead of landing gently in piano (p) for the tenuto transition.',
    ],
    touchAdviceDe:
      'Hebe den rechten Fuß auf ca. 40–55% Pedaltiefe (Halbpedal CC64 ~50–65) und führe die linke Hand mit weichem, singendem Daumen-Untersatz.',
    touchAdviceEn:
      'Float the right foot into true half-pedal (CC64 ~50–65) and shape the LH chromatic 8ths with smooth thumb-under legato.',
  },
]

export function getBalladeRubricForMeasure(measure: number): PhraseRubric | null {
  return (
    BALLADE_NO1_RUBRIC.find(
      (r) => measure >= r.measureRange[0] && measure <= r.measureRange[1]
    ) || null
  )
}
