export type MasterEditionId = 'urtext' | 'zimerman' | 'horowitz' | 'lang-lang'

export interface HistoricalVariant {
  measure: number
  edition: MasterEditionId
  pianistName: string
  description: string
  rubatoCurve: 'expressive-delay' | 'accelerando-surge' | 'strict-metric' | 'poetic-breathing'
  pedalGuidance: string
  dynamicMarking: string
}

export interface LibraryPieceSummary {
  id: string
  title: string
  composer: string
  opus: string
  difficulty: number // 1 to 10
  key: string
  period: 'Baroque' | 'Classical' | 'Romantic' | 'Impressionist' | 'Contemporary' | 'Neoclassical' | 'Technique'
  durationSeconds: number
  availableEditions: {
    id: MasterEditionId
    name: string
    year: string
    description: string
  }[]
  coverColor: string
  coverImage?: string
  badge?: string
  quote?: string
  tags?: string[]
}

export interface EditionConfig {
  editionId: MasterEditionId
  rubatoMultiplier: number
  pedalResonanceDepth: number
  voicingTrebleBoost: number
  octaveDoublingClimax: boolean
}
