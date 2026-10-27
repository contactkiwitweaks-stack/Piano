import type { NoteEvent, PracticeVariant } from '../types/music'

export class PracticeVariantEngine {
  /**
   * Generates a transformed set of notes based on the chosen practice variant
   */
  public static transformNotes(notes: NoteEvent[], variant: PracticeVariant): NoteEvent[] {
    switch (variant) {
      case 'original':
      case 'wait-for-note':
        return [...notes]

      case 'hands-separate-right':
        return notes.filter((n) => n.hand === 'right')

      case 'hands-separate-left':
        return notes.filter((n) => n.hand === 'left')

      case 'dotted-long-short':
        return this.createDottedRhythm(notes, 'long-short')

      case 'dotted-short-long':
        return this.createDottedRhythm(notes, 'short-long')

      case 'harmonic-skeleton':
        return this.createHarmonicSkeleton(notes)

      default:
        return [...notes]
    }
  }

  /**
   * Converts fast runs into dotted rhythm training variants (the classic Cortot / Liszt method)
   */
  private static createDottedRhythm(notes: NoteEvent[], pattern: 'long-short' | 'short-long'): NoteEvent[] {
    return notes.map((note, idx) => {
      if (note.duration > 0.45) return note

      const isOdd = idx % 2 === 0
      let modifiedDuration = note.duration

      if (pattern === 'long-short') {
        modifiedDuration = isOdd ? note.duration * 1.5 : note.duration * 0.5
      } else {
        modifiedDuration = isOdd ? note.duration * 0.5 : note.duration * 1.5
      }

      return {
        ...note,
        duration: Math.max(0.1, modifiedDuration),
      }
    })
  }

  /**
   * Harmonic skeleton reduction: clusters arpeggios into structural block chords
   */
  private static createHarmonicSkeleton(notes: NoteEvent[]): NoteEvent[] {
    const measureGroups: { [measure: number]: NoteEvent[] } = {}
    for (const note of notes) {
      if (!measureGroups[note.measure]) measureGroups[note.measure] = []
      measureGroups[note.measure].push(note)
    }

    const skeletonNotes: NoteEvent[] = []

    Object.values(measureGroups).forEach((mNotes) => {
      if (mNotes.length === 0) return

      const baseTime = mNotes[0].startTime
      mNotes.forEach((n, idx) => {
        skeletonNotes.push({
          ...n,
          startTime: baseTime + Math.floor(idx / 3) * 1.2,
          duration: 1.0,
          velocity: Math.min(100, (n.velocity || 70) + 10),
        })
      })
    })

    return skeletonNotes
  }
}
