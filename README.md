# Virtuoso Piano (Web & iOS PWA)

A concert-grade interactive piano learning application built with React, TypeScript, Vite, Tailwind CSS, and Web Audio. Designed for both desktop and mobile web (iPhone PWA & native iOS via Capacitor).

## Repertoire Masterworks

- **Tony Ann – ICARUS**: Full 786-note unabridged score in C minor, featuring signature 16th-note wave arpeggios, dynamic sections (Ascent, Flight, Radiance Climax, Ocean Reflection), continuous damper pedal integration, and masterclass annotations.
- **Ludwig van Beethoven – Für Elise (WoO 59)**: Complete 3/8 Urtext score (1,038 notes) with continuous damper resonance and anatomical fingering.
- **Frédéric Chopin – Ballade No. 1 in G minor (Op. 23)**: Complete 264-measure masterwork (5,096 notes) featuring 4 Master Historical Editions:
  - **Henle Urtext** (Canonical 1836)
  - **Krystian Zimerman** (1987 DG Recording: cantabile voicing, subtle half-pedal depths 52–70%)
  - **Vladimir Horowitz** (1968 Carnegie Hall: fiery bravura, +8% to +12% tempo surge in coda)
  - **Lang Lang** (2001 Carnegie Hall: dramatic rubato, +22% melody velocity, lush damper resonance)

## Pedagogy & Technical Foundations

- **5-Stage Sight-Reading Curriculum (From Scratch to Virtuoso)**:
  - Stage 1: Absolute Beginner Landmarks (Middle C, Treble G, Bass F pentachords)
  - Stage 2: Grand Staff Diatonic Fluency (2+ octaves natural notes)
  - Stage 3: Accidentals & Key Signatures (Sharps ♯ and Flats ♭ engraving glyphs)
  - Stage 4: Extended Ledger Lines (C2 to C6)
  - Stage 5: Virtuoso Masterclass (Concert repertoire range and sub-second reaction scoring)
- **Tonleitern & Hand Ladders (Technique)**:
  - C Major, G Major, D Major, A Harmonic Minor, and C Harmonic Minor (Tony Ann ICARUS Key)
  - Chromatic Scale Velocity Ladder (1-3-1-3-1-2-3 fingering)
  - Tony Ann ICARUS Wave Arpeggio Ladder (Abmaj7 – Bb – Cm – Ebmaj7)
  - Hanon No. 1, Cortot Ballade 1 Presto Coda Clusters, Brahms 51 Span, Chopin Op. 10 No. 1, and Liszt Trill Drills.
- **Hardware & Audio Integrations**:
  - Roland LX-9 & standard Bluetooth / USB MIDI with damper pedal telemetry (0–127 depth).
  - Acoustic microphone pitch detector with vocal humming & piano recognition.
  - 3-Pedal physical showcase widget with real-time brass depression animations.
  - 5-Finger articulated virtual pianist hands with smooth lerp positioning and contact rings.

## Getting Started

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Build production bundle
npm run build

# Sync iOS Capacitor project
npx cap sync ios
```

### Running on iPhone (Mobile Web)

1. Connect your iPhone to the same Wi-Fi network as your host machine.
2. Open Safari on iPhone and navigate to `http://<your-lan-ip>:5173/`.
3. Tap **Share** -> **Add to Home Screen** to launch in full-screen PWA standalone mode.

