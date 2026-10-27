import { Midi } from '@tonejs/midi'
import type { Piece, NoteEvent, PedalEvent, MasterclassAnnotation } from '../types/music'

const PITCH_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

function midiToAccurateNoteName(midi: number): string {
  const pitch = PITCH_NAMES[midi % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${pitch}${octave}`
}

export class FileImportPipeline {
  /**
   * Parses standard MIDI (.mid) file buffer and automatically generates pedagogical masterclass annotations
   */
  public static async parseMidiFile(fileBuffer: ArrayBuffer, fileName: string): Promise<Piece> {
    const midi = new Midi(fileBuffer)
    const notes: NoteEvent[] = []
    const pedalEvents: PedalEvent[] = []

    const cleanTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
    const bpm = midi.header.tempos.length > 0 ? Math.round(midi.header.tempos[0].bpm) : 100
    const ppq = midi.header.ppq || 384
    const timeSigs = midi.header.timeSignatures && midi.header.timeSignatures.length > 0
      ? midi.header.timeSignatures
      : [{ ticks: 0, timeSignature: [4, 4], measures: 0 }]

    function getMeasureAndBeat(ticks: number) {
      let curSig = timeSigs[0]
      let curSigIdx = 0
      for (let i = 0; i < timeSigs.length; i++) {
        if (ticks >= timeSigs[i].ticks) {
          curSig = timeSigs[i]
          curSigIdx = i
        } else {
          break
        }
      }

      let baseMeasure = 1
      for (let i = 0; i < curSigIdx; i++) {
        const segTicks = timeSigs[i + 1].ticks - timeSigs[i].ticks
        const ticksPerMeasure = (timeSigs[i].timeSignature[0] * ppq * 4) / timeSigs[i].timeSignature[1]
        baseMeasure += Math.round(segTicks / ticksPerMeasure)
      }

      const numBeats = curSig.timeSignature[0]
      const beatUnit = curSig.timeSignature[1]
      const ticksPerBeat = (ppq * 4) / beatUnit
      const ticksPerMeasure = numBeats * ticksPerBeat

      const offsetTicks = Math.max(0, ticks - curSig.ticks)
      const measureInSig = Math.floor(offsetTicks / ticksPerMeasure)
      const ticksInMeasure = offsetTicks % ticksPerMeasure
      const beat = parseFloat((ticksInMeasure / ticksPerBeat + 1).toFixed(2))

      return {
        measure: baseMeasure + measureInSig,
        beat,
      }
    }

    let noteIdCounter = 1
    midi.tracks.forEach((track, trackIdx) => {
      const trackName = (track.name || '').toLowerCase()
      let defaultHand: 'left' | 'right' = trackIdx === 0 ? 'right' : 'left'
      if (trackName.includes('left') || trackName.includes('lh') || trackName.includes('bass')) {
        defaultHand = 'left'
      } else if (trackName.includes('right') || trackName.includes('rh') || trackName.includes('treble')) {
        defaultHand = 'right'
      }

      track.notes.forEach((n) => {
        const hand = midi.tracks.length === 1 ? (n.midi < 60 ? 'left' : 'right') : defaultHand
        const mb = getMeasureAndBeat(n.ticks)

        notes.push({
          id: `imp-${noteIdCounter++}`,
          midi: n.midi,
          noteName: midiToAccurateNoteName(n.midi),
          startTime: parseFloat(n.time.toFixed(3)),
          duration: Math.max(0.1, parseFloat(n.duration.toFixed(3))),
          hand,
          measure: mb.measure,
          beat: mb.beat,
          velocity: Math.round(n.velocity * 127),
        })
      })

      const cc64List = track.controlChanges[64] || []
      cc64List.forEach((cc) => {
        if (cc.value > 0.3) {
          const mb = getMeasureAndBeat(cc.ticks)
          pedalEvents.push({
            startTime: parseFloat(cc.time.toFixed(3)),
            duration: 1.8,
            depth: Math.round(cc.value * 127),
            type: cc.value > 0.7 ? 'sustain' : 'half',
            measure: mb.measure,
          })
        }
      })
    })

    notes.sort((a, b) => a.startTime - b.startTime)
    const duration = notes.length > 0 ? notes[notes.length - 1].startTime + notes[notes.length - 1].duration : 30
    const maxMeasure = notes.length > 0 ? Math.max(...notes.map((n) => n.measure)) : 1

    // Automated Tutorial Generation
    const generatedTutorials = this.generateAutomatedPedagogy(notes, bpm)
    if (pedalEvents.length === 0) {
      this.generateAutomatedPedals(notes, pedalEvents, bpm)
    }

    // Generate balanced practice sections (approx 16-24 measures each)
    const sections: Piece['sections'] = []
    const sectionCount = Math.max(1, Math.min(6, Math.ceil(maxMeasure / 20)))
    const measuresPerSection = Math.ceil(maxMeasure / sectionCount)

    for (let sIdx = 0; sIdx < sectionCount; sIdx++) {
      const startM = sIdx * measuresPerSection + 1
      const endM = Math.min(maxMeasure, (sIdx + 1) * measuresPerSection)
      const secNotes = notes.filter((n) => n.measure >= startM && n.measure <= endM)
      const startTime = secNotes[0]?.startTime || 0
      const endTime = secNotes.length > 0 ? secNotes[secNotes.length - 1].startTime + 2.0 : duration

      sections.push({
        id: `sec-${sIdx + 1}`,
        title: sectionCount === 1 ? 'Full Piece (AI Masterclass)' : `Section ${sIdx + 1} (M. ${startM}–${endM})`,
        startMeasure: startM,
        endMeasure: endM,
        startTime,
        endTime,
        tempoSuggestion: `${bpm} BPM`,
        character: sIdx === 0 ? 'Theme Introduction' : sIdx === sectionCount - 1 ? 'Climax & Coda' : 'Development',
      })
    }

    return {
      id: `imported-${Date.now()}`,
      title: cleanTitle,
      composer: 'Custom Score',
      key: 'Detected',
      timeSignature: [4, 4],
      tempoBpm: bpm,
      duration: parseFloat(duration.toFixed(2)),
      notes,
      pedalEvents,
      annotations: generatedTutorials,
      sections,
    }
  }

  /**
   * Parses MusicXML text content and synthesizes masterclass guidance
   */
  public static async parseMusicXml(xmlString: string, fileName: string): Promise<Piece> {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml')

    const notes: NoteEvent[] = []
    const pedalEvents: PedalEvent[] = []
    const cleanTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')

    const scoreTitle = xmlDoc.querySelector('work-title, movement-title')?.textContent || cleanTitle
    const composer = xmlDoc.querySelector('creator[type="composer"]')?.textContent || 'Uploaded Composer'

    let currentTime = 0
    let noteIdCounter = 1

    const measures = xmlDoc.querySelectorAll('measure')
    measures.forEach((mEl, mIdx) => {
      const measureNum = parseInt(mEl.getAttribute('number') || `${mIdx + 1}`, 10)
      const noteNodes = mEl.querySelectorAll('note')

      noteNodes.forEach((nEl) => {
        const isRest = nEl.querySelector('rest') !== null
        if (isRest) {
          const durationVal = parseFloat(nEl.querySelector('duration')?.textContent || '1')
          currentTime += durationVal * 0.25
          return
        }

        const step = nEl.querySelector('pitch > step')?.textContent || 'C'
        const alter = parseInt(nEl.querySelector('pitch > alter')?.textContent || '0', 10)
        const octave = parseInt(nEl.querySelector('pitch > octave')?.textContent || '4', 10)
        const staff = parseInt(nEl.querySelector('staff')?.textContent || '1', 10)
        const durationVal = parseFloat(nEl.querySelector('duration')?.textContent || '1')

        let pitchName = step
        if (alter === 1) pitchName += '#'
        else if (alter === -1) pitchName += 'b'

        const midiBaseMap: { [s: string]: number } = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
        const midi = 12 + (octave + 1) * 12 + (midiBaseMap[step] || 0) + alter
        const hand = staff === 2 || midi < 60 ? 'left' : 'right'
        const noteDuration = Math.max(0.15, durationVal * 0.28)

        notes.push({
          id: `xml-${noteIdCounter++}`,
          midi,
          noteName: `${pitchName}${octave}`,
          startTime: parseFloat(currentTime.toFixed(3)),
          duration: parseFloat(noteDuration.toFixed(3)),
          hand,
          measure: measureNum,
          velocity: 80,
        })

        currentTime += noteDuration * 0.95
      })
    })

    notes.sort((a, b) => a.startTime - b.startTime)
    const duration = notes.length > 0 ? notes[notes.length - 1].startTime + notes[notes.length - 1].duration : 30
    const maxMeasure = notes.length > 0 ? Math.max(...notes.map((n) => n.measure)) : 1

    const generatedTutorials = this.generateAutomatedPedagogy(notes, 100)
    this.generateAutomatedPedals(notes, pedalEvents, 100)

    return {
      id: `imported-xml-${Date.now()}`,
      title: scoreTitle,
      composer,
      key: 'Urtext',
      timeSignature: [4, 4],
      tempoBpm: 100,
      duration: parseFloat(duration.toFixed(2)),
      notes,
      pedalEvents,
      annotations: generatedTutorials,
      sections: [
        {
          id: 'sec-xml-1',
          title: 'Full Score',
          startMeasure: 1,
          endMeasure: maxMeasure,
          startTime: 0,
          endTime: duration,
          tempoSuggestion: '100 BPM',
          character: 'Urtext Engraving',
        },
      ],
    }
  }

  private static generateAutomatedPedagogy(notes: NoteEvent[], _bpm: number): MasterclassAnnotation[] {
    const annotations: MasterclassAnnotation[] = []
    if (notes.length === 0) return annotations

    // 1. Opening Statement
    annotations.push({
      id: 'ann-intro',
      measureRange: [1, 4],
      title: 'Opening Phrasing & Touch',
      germanTerm: 'Auftakt & Anschlagskultur',
      category: 'tone-color',
      instruction: 'Drop forearm weight into the keys with supple wrist cushion. Avoid finger stiffness.',
      handTechnique: 'Relaxed lateral wrist angle with curved finger pads.',
      wristGuidance: 'Fluid horizontal breathing motion.',
      referenceTimestampSeconds: 0,
    })

    // 2. Structural Cadence
    const midIdx = Math.floor(notes.length / 2)
    const midNote = notes[midIdx]
    if (midNote) {
      annotations.push({
        id: 'ann-cadence',
        measureRange: [midNote.measure, midNote.measure + 4],
        title: 'Climax & Harmonic Progression',
        germanTerm: 'Höhepunkt & Klangbalance',
        category: 'transition',
        instruction: 'Bring out the melodic top voice while keeping accompanying chords light and resonant.',
        handTechnique: 'Finger 5 firm bridge support on the upper melodic line.',
        wristGuidance: 'Elevate wrist slightly to transfer arm momentum.',
        referenceTimestampSeconds: midNote.startTime,
      })
    }

    return annotations
  }

  private static generateAutomatedPedals(notes: NoteEvent[], pedals: PedalEvent[], _bpm: number) {
    const bassNotes = notes.filter((n) => n.hand === 'left')
    bassNotes.forEach((bn, idx) => {
      if (idx % 3 === 0) {
        pedals.push({
          startTime: bn.startTime,
          duration: Math.max(1.2, bn.duration * 1.5),
          depth: 95,
          type: 'sustain',
          measure: bn.measure,
        })
      }
    })
  }
}
