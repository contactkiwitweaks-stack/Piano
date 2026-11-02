// SongStorageManager: Persistent storage and cloud catalog synchronization
// Enables adding any song directly on iPhone without PC / iTunes rebuilds.

import type { Piece } from '../types/music'
import type { LibraryPieceSummary } from '../types/edition'

const CUSTOM_SONGS_KEY = 'virtuoso_custom_songs_v1'
const COMPETITION_SCORES_KEY = 'virtuoso_competition_scores_v1'

export interface CompetitionScoreRecord {
  pieceId: string
  score: number
  accuracyPercent: number
  grade: 'S+' | 'S' | 'A' | 'B' | 'C' | 'D'
  date: string
  timingErrorMs: number
  extraNotesCount: number
  missedNotesCount: number
}

export interface CloudSongPreset {
  id: string
  title: string
  composer: string
  difficulty: number
  key: string
  period: string
  durationSeconds: number
  coverColor: string
  description: string
  midiUrl: string
}

export class SongStorageManager {
  // Curated online cloud library of downloadable classical & modern pieces
  public static cloudCatalog: CloudSongPreset[] = [
    {
      id: 'cloud-carol-of-the-bells',
      title: 'Carol of the Bells',
      composer: 'Mykola Leontovych',
      difficulty: 5,
      key: 'G minor',
      period: 'Holiday / Contemporary',
      durationSeconds: 141,
      coverColor: 'from-emerald-600 via-teal-900 to-zinc-950',
      description: 'Full 1,568-note concert arrangement: four-note Ukrainian bell motif, rolling arpeggios, and festive polyphony.',
      midiUrl: 'https://raw.githubusercontent.com/contactkiwitweaks-stack/Piano/main/public/songs/carol-of-the-bells.mid',
    },
    {
      id: 'cloud-sia-snowman',
      title: 'Snowman',
      composer: 'Sia (Arr. John Rod Dondoyano)',
      difficulty: 4,
      key: 'Db Major',
      period: 'Holiday / Pop',
      durationSeconds: 163,
      coverColor: 'from-cyan-500 via-blue-900 to-zinc-950',
      description: 'Full 1,473-note arrangement: warm syncopated chord voicings, lyrical vocal line, and emotive climax.',
      midiUrl: 'https://raw.githubusercontent.com/contactkiwitweaks-stack/Piano/main/public/songs/sia-snowman.mid',
    },
    {
      id: 'cloud-chopin-nocturne-op9-2',
      title: 'Nocturne in Eb Major',
      composer: 'Frédéric Chopin',
      difficulty: 6,
      key: 'Eb Major',
      period: 'Romantic',
      durationSeconds: 270,
      coverColor: 'from-blue-600 via-indigo-900 to-zinc-950',
      description: 'Chopin’s immortal bel canto nocturne: singing right-hand fiorituras over gentle 12/8 waltz bass.',
      midiUrl: 'https://raw.githubusercontent.com/fuun/chopin-midi/master/nocturne-op9-no2.mid',
    },
    {
      id: 'cloud-debussy-clair-de-lune',
      title: 'Clair de Lune',
      composer: 'Claude Debussy',
      difficulty: 6,
      key: 'Db Major',
      period: 'Impressionist',
      durationSeconds: 310,
      coverColor: 'from-cyan-600 via-blue-900 to-zinc-950',
      description: 'Ethereal moonlight harmonies, rolling 9/8 arpeggios, and delicate pianissimo pedal colors.',
      midiUrl: 'https://raw.githubusercontent.com/fuun/classical-midi/master/debussy-clair-de-lune.mid',
    },
    {
      id: 'cloud-satie-gymnopedie-1',
      title: 'Gymnopédie No. 1',
      composer: 'Erik Satie',
      difficulty: 3,
      key: 'D Major',
      period: 'Modern / Ambient',
      durationSeconds: 195,
      coverColor: 'from-amber-500 via-stone-800 to-zinc-950',
      description: 'Hypnotic, melancholic 3/4 chords and serene, solitary melodic lines. Perfect for touch & pedal control.',
      midiUrl: 'https://raw.githubusercontent.com/fuun/classical-midi/master/satie-gymnopedie-1.mid',
    },
    {
      id: 'cloud-mozart-rondo-alla-turca',
      title: 'Rondo alla Turca (Turkish March)',
      composer: 'W. A. Mozart',
      difficulty: 5,
      key: 'A minor / A Major',
      period: 'Classical',
      durationSeconds: 215,
      coverColor: 'from-red-600 via-orange-800 to-zinc-950',
      description: 'Dazzling 16th-note staccato runs, fiery Janissary march octaves, and exuberant classical humor.',
      midiUrl: 'https://raw.githubusercontent.com/fuun/classical-midi/master/mozart-turkish-march.mid',
    },
    {
      id: 'cloud-joplin-the-entertainer',
      title: 'The Entertainer (Ragtime Two-Step)',
      composer: 'Scott Joplin',
      difficulty: 4,
      key: 'C Major',
      period: 'Ragtime / Early Jazz',
      durationSeconds: 230,
      coverColor: 'from-amber-600 via-yellow-800 to-zinc-950',
      description: 'Syncopated stride piano, bouncing left-hand tenths, and joyful vintage swing rhythms.',
      midiUrl: 'https://raw.githubusercontent.com/fuun/classical-midi/master/joplin-the-entertainer.mid',
    },
    {
      id: 'cloud-yiruma-river-flows-in-you',
      title: 'River Flows in You',
      composer: 'Yiruma',
      difficulty: 4,
      key: 'A Major / F# Minor',
      period: 'Neoclassical / Contemporary',
      durationSeconds: 200,
      coverColor: 'from-teal-600 via-slate-900 to-zinc-950',
      description: 'Gentle, introspective neoclassical pattern loved worldwide. Great for flow and subtle dynamic shading.',
      midiUrl: 'https://raw.githubusercontent.com/fuun/classical-midi/master/yiruma-river-flows-in-you.mid',
    },
    {
      id: 'cloud-your-lie-in-april-again',
      title: 'Again (Your Lie in April OST)',
      composer: 'Masaru Yokoyama',
      difficulty: 5,
      key: 'D Major',
      period: 'Anime / Soundtrack',
      durationSeconds: 165,
      coverColor: 'from-pink-500 via-rose-800 to-zinc-950',
      description: 'Heart-wrenching anime piano solo featuring lyrical romantic rubato and expressive chord climaxes.',
      midiUrl: 'https://raw.githubusercontent.com/fuun/anime-midi/master/your-lie-in-april-again.mid',
    },
  ]

  // Dynamic cloud catalog fetch from GitHub repo (auto-updates when songs are uploaded from PC)
  public static async fetchCloudCatalog(): Promise<CloudSongPreset[]> {
    try {
      const res = await fetch(
        'https://raw.githubusercontent.com/contactkiwitweaks-stack/Piano/main/public/songs/catalog.json',
        { cache: 'no-store' }
      )
      if (res.ok) {
        const remoteSongs = (await res.json()) as CloudSongPreset[]
        if (Array.isArray(remoteSongs) && remoteSongs.length > 0) {
          // Merge remote songs with static defaults, avoiding duplicate IDs
          const map = new Map<string, CloudSongPreset>()
          remoteSongs.forEach((s) => map.set(s.id, s))
          this.cloudCatalog.forEach((s) => {
            if (!map.has(s.id)) map.set(s.id, s)
          })
          return Array.from(map.values())
        }
      }
    } catch (e) {
      console.warn('Using cached cloud catalog:', e)
    }
    return this.cloudCatalog
  }

  // Fetch songs directly from PC over local home Wi-Fi
  public static async fetchLocalPcSongs(pcIp: string): Promise<Array<{ id: string; title: string; composer: string; fileName: string; downloadUrl: string }>> {
    const cleanIp = pcIp.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    const url = `http://${cleanIp}:8080/api/songs`
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to reach PC on ${cleanIp}:8080`)
    return (await res.json()) as Array<{ id: string; title: string; composer: string; fileName: string; downloadUrl: string }>
  }

  // Retrieve all permanently saved custom pieces from local storage
  public static getSavedPieces(): Piece[] {
    try {
      const raw = localStorage.getItem(CUSTOM_SONGS_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw) as Piece[]
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      console.warn('Failed to load saved custom pieces:', e)
      return []
    }
  }

  // Save or update a piece permanently in local storage
  public static savePiece(piece: Piece): void {
    try {
      const existing = this.getSavedPieces()
      const index = existing.findIndex((p) => p.id === piece.id)
      if (index >= 0) {
        existing[index] = piece
      } else {
        existing.unshift(piece)
      }
      localStorage.setItem(CUSTOM_SONGS_KEY, JSON.stringify(existing))
    } catch (e) {
      console.error('Failed to save piece to local storage:', e)
    }
  }

  // Remove a custom piece
  public static removePiece(pieceId: string): void {
    try {
      const existing = this.getSavedPieces().filter((p) => p.id !== pieceId)
      localStorage.setItem(CUSTOM_SONGS_KEY, JSON.stringify(existing))
    } catch (e) {
      console.error('Failed to remove custom piece:', e)
    }
  }

  // Get piece summaries for catalog integration
  public static getCustomPieceSummaries(): LibraryPieceSummary[] {
    const pieces = this.getSavedPieces()
    return pieces.map((p) => ({
      id: p.id,
      title: p.title,
      composer: p.composer || 'Imported Song',
      opus: 'Custom',
      difficulty: (p.notes.length > 2500 ? 8 : p.notes.length > 1000 ? 5 : 3) as any,
      key: p.key || 'Custom',
      period: 'Custom Import' as any,
      durationSeconds: Math.round(p.duration),
      coverColor: 'from-amber-600 via-orange-700 to-zinc-950',
      availableEditions: [
        {
          id: 'urtext',
          name: 'Device Import',
          year: new Date().getFullYear().toString(),
          description: `Custom piece with ${p.notes.length} notes imported directly on device.`,
        },
      ],
    }))
  }

  // Save competition score record
  public static saveCompetitionScore(record: CompetitionScoreRecord): void {
    try {
      const raw = localStorage.getItem(COMPETITION_SCORES_KEY)
      const existing: CompetitionScoreRecord[] = raw ? JSON.parse(raw) : []
      existing.unshift(record)
      // Keep latest 100 records
      localStorage.setItem(COMPETITION_SCORES_KEY, JSON.stringify(existing.slice(0, 100)))
    } catch (e) {
      console.warn('Failed to save competition score:', e)
    }
  }

  // Get all competition scores
  public static getAllCompetitionScores(): CompetitionScoreRecord[] {
    try {
      const raw = localStorage.getItem(COMPETITION_SCORES_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  // Get best score for a piece
  public static getBestScore(pieceId: string): CompetitionScoreRecord | null {
    try {
      const raw = localStorage.getItem(COMPETITION_SCORES_KEY)
      if (!raw) return null
      const existing: CompetitionScoreRecord[] = JSON.parse(raw)
      const matching = existing.filter((r) => r.pieceId === pieceId)
      if (matching.length === 0) return null
      return matching.reduce((best, curr) => (curr.score > best.score ? curr : best), matching[0])
    } catch {
      return null
    }
  }
}
