// Core musical and pedagogical data models

export interface NoteEvent {
  id: string
  midi: number // MIDI pitch (21 = A0, 60 = C4, 108 = C8)
  noteName: string // e.g. "G4", "D5", "Eb4"
  startTime: number // In seconds from piece start
  duration: number // Duration in seconds
  durationBeats?: number // Exact notated duration in quarter-note beats (4=whole, 3=dotted half, 2=half, 1=quarter, 0.5=8th, 0.25=16th)
  hand: 'left' | 'right'
  voice?: 1 | 2 // Polyphonic staff voice (1 = upper/melody stem-up, 2 = lower/accompaniment stem-down)
  finger?: number // 1 = thumb, 2 = index, ..., 5 = pinky
  measure: number
  beat?: number
  velocity?: number // 1 - 127
  isAccent?: boolean
  isStaccato?: boolean
  isTriplet?: boolean
  tieToNext?: boolean
}

export interface PedalEvent {
  startTime: number
  duration: number
  depth: number // 0 to 127 (continuous CC64 for Roland LX-9)
  type: 'sustain' | 'half' | 'flutter' | 'syncopated'
  measure: number
  tip?: string
}

export interface MasterclassAnnotation {
  id: string
  measureRange: [number, number]
  title: string
  germanTerm?: string // e.g. "Übergang", "Klangfarbe", "Gewichtsverlagerung"
  category: 'transition' | 'pedal' | 'fingering' | 'tone-color' | 'rubato'
  instruction: string
  pedalGuidance?: {
    action: 'catch' | 'full-hold' | 'flutter' | 'clear'
    explanation: string
    idealHoldMs: number
  }
  handTechnique?: string
  wristGuidance?: string
  referenceTimestampSeconds: number
}

export type PracticeVariant = 
  | 'original'
  | 'hands-separate-right'
  | 'hands-separate-left'
  | 'dotted-long-short'
  | 'dotted-short-long'
  | 'harmonic-skeleton'
  | 'wait-for-note'
  | 'slow-practice'

export interface MeasureMarking {
  tempo?: string
  dynamic?: string
  expression?: string
  hairpin?: 'cresc' | 'decresc'
}

export interface Piece {
  id: string
  title: string
  composer: string
  opus?: string
  key: string
  timeSignature: [number, number]
  timeSignatureChanges?: { measure: number; timeSignature: [number, number] }[]
  leftHandClef?: 'bass' | 'treble'
  measureClefs?: Record<number, { right?: 'treble' | 'bass'; left?: 'treble' | 'bass' }>
  measureMarkings?: Record<number, MeasureMarking>
  tempoBpm: number
  duration: number // seconds
  notes: NoteEvent[]
  pedalEvents: PedalEvent[]
  annotations: MasterclassAnnotation[]
  sections: {
    id: string
    title: string
    startMeasure: number
    endMeasure: number
    startTime: number
    endTime: number
    tempoSuggestion: string
    character: string
  }[]
}

export interface MidiInputState {
  activeNotes: Map<number, { velocity: number; timestamp: number }>
  damperPedal: number // 0 to 127
  softPedal: number // 0 to 127
  sostenutoPedal: number
  deviceName: string
  isConnected: boolean
  connectionType: 'ble' | 'usb' | 'simulated' | 'none'
  isRolandBluetooth?: boolean
  latencyMs: number
}
