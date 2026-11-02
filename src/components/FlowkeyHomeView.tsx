import React, { useState, useMemo, useRef, useEffect } from 'react'
import type { PracticeVariant } from '../types/music'
import type { MasterEditionId, LibraryPieceSummary } from '../types/edition'
import { LibraryRepository } from '../library/LibraryRepository'
import { SongStorageManager } from '../library/SongStorageManager'
import type { LanguageCode } from '../i18n/translations'
import type { TabId } from './FlowkeyTabBar'
import {
  Play,
  Search,
  Sparkles,
  ChevronRight,
  Flame,
  Upload,
  X,
  Music,
  Compass,
  Clock,
  BookOpen,
  Bookmark,
  SlidersHorizontal,
  Trophy,
  Trash2,
} from 'lucide-react'

interface FlowkeyHomeViewProps {
  language: LanguageCode
  viewTab?: TabId
  onSelectPieceAndEdition: (
    pieceId: string,
    editionId: MasterEditionId,
    variant?: PracticeVariant,
    loopRange?: [number, number]
  ) => void
  onOpenPlayer: () => void
  onOpenImportModal: () => void
}

const normalize = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export const FlowkeyHomeView: React.FC<FlowkeyHomeViewProps> = ({
  language,
  viewTab = 'songs',
  onSelectPieceAndEdition,
  onOpenPlayer,
  onOpenImportModal,
}) => {
  const catalog = useMemo(() => LibraryRepository.getCatalog(), [])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [savedCustomPieces, setSavedCustomPieces] = useState(() => SongStorageManager.getSavedPieces())
  const [competitionScores, setCompetitionScores] = useState(() => SongStorageManager.getAllCompetitionScores())

  useEffect(() => {
    if (viewTab === 'mySongs') {
      setSavedCustomPieces(SongStorageManager.getSavedPieces())
      setCompetitionScores(SongStorageManager.getAllCompetitionScores())
    }
  }, [viewTab])

  const handleDeleteSavedPiece = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    SongStorageManager.removePiece(id)
    setSavedCustomPieces(SongStorageManager.getSavedPieces())
  }

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('all')

  // Auto-focus search input when switching to search tab
  useEffect(() => {
    if (viewTab === 'search') {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [viewTab])

  const genreLabels: Record<string, Record<LanguageCode, string>> = {
    all: {
      en: 'All Masterpieces',
      de: 'Alle Meisterwerke',
      fr: 'Tous les morceaux',
      ja: 'すべての名曲',
      zh: '全部曲目',
    },
    holiday: {
      en: 'Holiday & Winter',
      de: 'Weihnachten & Winter',
      fr: 'Fêtes & Hiver',
      ja: 'クリスマス・冬',
      zh: '节日与冬季',
    },
    contemporary: {
      en: 'Pop & Contemporary',
      de: 'Pop & Modern',
      fr: 'Pop & Contemporain',
      ja: 'ポップス・現代曲',
      zh: '流行与现代',
    },
    classical: {
      en: 'Classical & Baroque',
      de: 'Klassik & Barock',
      fr: 'Classique & Baroque',
      ja: '古典派・バロック',
      zh: '古典与巴洛克',
    },
    romantic: {
      en: 'Romantic & Impressionist',
      de: 'Romantik & Impressionismus',
      fr: 'Romantique & Impressionniste',
      ja: 'ロマン派・印象派',
      zh: '浪漫派与印象派',
    },
    technique: {
      en: 'Scales & Hanon Drills',
      de: 'Tonleitern & Hanon',
      fr: 'Gammes & Hanon',
      ja: '音階・ハノン練習',
      zh: '音阶与哈农练习',
    },
    beginner: {
      en: 'Beginner Pieces',
      de: 'Für Anfänger',
      fr: 'Pour débutants',
      ja: '初級向け',
      zh: '新手入门精选',
    },
    advanced: {
      en: 'Advanced & Virtuoso',
      de: 'Fortgeschritten & Virtuos',
      fr: 'Avancé & Virtuose',
      ja: '上級・演奏会用',
      zh: '演奏级大师杰作',
    },
  }

  const quickSearchTags = [
    { label: '🔔 Carol of the Bells', query: 'carol' },
    { label: '⛄ Sia - Snowman', query: 'snowman' },
    { label: 'Passacaglia', query: 'passacaglia' },
    { label: 'ABBA', query: 'abba' },
    { label: 'The Winner Takes It All', query: 'winner' },
    { label: 'Tony Ann', query: 'tony ann' },
    { label: 'ICARUS', query: 'icarus' },
    { label: 'Für Elise', query: 'fur elise' },
    { label: 'Chopin', query: 'chopin' },
    { label: 'Ballade 1', query: 'ballade' },
    { label: 'Tonleitern & Scales', query: 'scale' },
    { label: 'Hanon', query: 'hanon' },
  ]

  const difficultyBadge = (diff: number) => {
    if (diff <= 2) {
      return {
        label:
          language === 'de'
            ? 'Anfänger'
            : language === 'fr'
            ? 'Débutant'
            : language === 'ja'
            ? '初級'
            : language === 'zh'
            ? '初级'
            : 'Beginner',
        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      }
    }
    if (diff <= 5) {
      return {
        label:
          language === 'de'
            ? 'Mittel'
            : language === 'fr'
            ? 'Intermédiaire'
            : language === 'ja'
            ? '中級'
            : language === 'zh'
            ? '中级'
            : 'Intermediate',
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      }
    }
    if (diff <= 8) {
      return {
        label:
          language === 'de'
            ? 'Schwer'
            : language === 'fr'
            ? 'Avancé'
            : language === 'ja'
            ? '上級'
            : language === 'zh'
            ? '高级'
            : 'Advanced',
        color: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      }
    }
    return {
      label:
        language === 'de'
          ? 'Virtuos'
          : language === 'fr'
          ? 'Virtuose'
          : language === 'ja'
          ? 'プロ'
          : language === 'zh'
          ? '演奏级'
          : 'Virtuoso',
      color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '2:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Filtered pieces based on genre, difficulty, and diacritic-insensitive search query
  const filteredPieces = useMemo(() => {
    return catalog.filter((p) => {
      const q = normalize(searchQuery.trim())
      if (q !== '') {
        const matchesTitle = normalize(p.title).includes(q)
        const matchesComposer = normalize(p.composer).includes(q)
        const matchesOpus = normalize(p.opus).includes(q)
        const matchesKey = normalize(p.key).includes(q)
        const matchesPeriod = normalize(p.period).includes(q)
        const matchesId = normalize(p.id).includes(q)

        if (!matchesTitle && !matchesComposer && !matchesOpus && !matchesKey && !matchesPeriod && !matchesId) {
          return false
        }
      }

      if (selectedGenre === 'all') return true
      if (selectedGenre === 'holiday') {
        return p.id === 'carol-of-the-bells' || p.id === 'sia-snowman' || p.period?.toLowerCase().includes('holiday')
      }
      if (selectedGenre === 'contemporary') {
        return (
          p.period === 'Contemporary' ||
          p.period === 'Neoclassical' ||
          p.id === 'carol-of-the-bells' ||
          p.id === 'sia-snowman' ||
          p.id === 'tony-ann-icarus' ||
          p.id === 'abba-the-winner-takes-it-all'
        )
      }
      if (selectedGenre === 'classical') {
        return p.period === 'Classical' || p.period === 'Baroque'
      }
      if (selectedGenre === 'romantic') {
        return p.period === 'Romantic' || p.period === 'Impressionist'
      }
      if (selectedGenre === 'technique') {
        return p.period === 'Technique' || p.id.startsWith('scale-') || p.id.startsWith('hanon-')
      }
      if (selectedGenre === 'beginner') {
        return p.difficulty <= 3
      }
      if (selectedGenre === 'advanced') {
        return p.difficulty >= 6
      }
      return true
    })
  }, [catalog, searchQuery, selectedGenre])

  const featuredNewPieces = useMemo(() => {
    return catalog.filter((p) =>
      ['carol-of-the-bells', 'sia-snowman'].includes(p.id)
    )
  }, [catalog])

  const recommendedPieces = useMemo(() => {
    return catalog.filter((p) =>
      ['carol-of-the-bells', 'sia-snowman', 'handel-halvorsen-passacaglia', 'abba-the-winner-takes-it-all', 'tony-ann-icarus', 'beethoven-fur-elise', 'chopin-ballade-1'].includes(p.id)
    )
  }, [catalog])

  const popularPieces = useMemo(() => {
    return catalog.filter((p) =>
      ['carol-of-the-bells', 'sia-snowman', 'tony-ann-icarus', 'abba-the-winner-takes-it-all', 'handel-halvorsen-passacaglia', 'beethoven-fur-elise', 'chopin-ballade-1'].includes(p.id)
    )
  }, [catalog])

  const techniquePieces = useMemo(() => {
    return catalog.filter((p) =>
      p.period === 'Technique' || p.id.startsWith('scale-') || p.id.startsWith('hanon-') || p.id.includes('arpeggio')
    )
  }, [catalog])

  const handleLaunchPiece = (pieceSummary: LibraryPieceSummary, editionId: MasterEditionId = 'urtext') => {
    onSelectPieceAndEdition(pieceSummary.id, editionId, 'original')
    onOpenPlayer()
  }

  const renderPieceCard = (pieceItem: LibraryPieceSummary, compact = false) => {
    const diff = difficultyBadge(pieceItem.difficulty)
    return (
      <div
        key={pieceItem.id}
        onClick={() => handleLaunchPiece(pieceItem)}
        className="p-3.5 sm:p-4 rounded-3xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 hover:border-orange-500/50 cursor-pointer flex flex-col justify-between gap-3 transition-all duration-200 shadow-md hover:shadow-orange-500/10 group active:scale-[0.98]"
      >
        <div
          className={`${
            compact ? 'h-28' : 'h-36'
          } rounded-2xl bg-gradient-to-tr ${pieceItem.coverColor} flex flex-col justify-between p-3.5 relative overflow-hidden shadow-inner`}
        >
          <div className="flex items-center justify-between z-10">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${diff.color}`}>
              {diff.label}
            </span>
            <span className="text-[10px] font-mono font-semibold text-white/90 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {formatDuration(pieceItem.durationSeconds)}
            </span>
          </div>

          <div className="flex items-center justify-between z-10">
            <span className="text-[11px] font-mono text-white/90 font-bold bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-lg">
              {pieceItem.key}
            </span>
            <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-orange-400 transition-all">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          </div>
        </div>

        <div className="space-y-0.5">
          <h3 className="font-bold text-sm sm:text-base text-zinc-100 group-hover:text-amber-400 transition-colors truncate">
            {pieceItem.title}
          </h3>
          <p className="text-xs text-zinc-400 truncate">
            {pieceItem.composer}
          </p>
        </div>
      </div>
    )
  }

  // MY SONGS TAB VIEW
  if (viewTab === 'mySongs') {
    return (
      <div className="w-full h-full bg-[#0a0a0f] text-zinc-100 overflow-y-auto select-none px-4 sm:px-8 pl-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))] pr-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))] py-6 space-y-8 max-w-7xl mx-auto scrollbar-thin scrollbar-thumb-zinc-800 pb-[max(7rem,calc(env(safe-area-inset-bottom)+5rem))]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-amber-950/20 border border-white/10 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-md">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
                <span>{language === 'de' ? 'Meine Bibliothek & Rekorde' : 'My Library & Achievements'}</span>
                <span className="text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  {savedCustomPieces.length} {language === 'de' ? 'eigene Songs' : 'custom songs'}
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                {language === 'de'
                  ? 'Deine auf dem iPhone gespeicherten Noten, Downloads und Wettbewerbsergebnisse.'
                  : 'Your locally saved pieces, Song Cloud downloads, and competition juror scorecards.'}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenImportModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-zinc-950 font-bold text-xs shadow-md flex items-center gap-2 active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>{language === 'de' ? '+ Song hinzufügen' : '+ Add New Song'}</span>
          </button>
        </div>

        {/* Section 1: User's Custom & Downloaded Scores */}
        <section className="space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-zinc-200 flex items-center gap-2">
            <Music className="w-5 h-5 text-orange-400" />
            <span>{language === 'de' ? 'Eigene & Heruntergeladene Noten' : 'Custom & Downloaded Pieces'}</span>
            <span className="text-xs text-zinc-500">({savedCustomPieces.length})</span>
          </h2>

          {savedCustomPieces.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 rounded-3xl border border-white/5 space-y-3">
              <Music className="w-10 h-10 text-zinc-600 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-300">
                  {language === 'de' ? 'Noch keine eigenen Songs gespeichert' : 'No custom songs saved yet'}
                </p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  {language === 'de'
                    ? 'Lade eigene MIDI/MusicXML-Dateien hoch oder lade beliebte Stücke aus der Song Cloud herunter.'
                    : 'Import your own MIDI or MusicXML files, or 1-click download classics from the Song Cloud.'}
                </p>
              </div>
              <button
                onClick={onOpenImportModal}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold text-xs border border-amber-500/30 transition-all inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{language === 'de' ? 'Song Cloud & Import öffnen' : 'Open Song Cloud & Import'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedCustomPieces.map((piece) => (
                <div
                  key={piece.id}
                  onClick={() => {
                    onSelectPieceAndEdition(piece.id, 'urtext', 'original')
                    onOpenPlayer()
                  }}
                  className="p-4 rounded-2xl bg-zinc-900 border border-white/5 hover:border-amber-500/40 cursor-pointer group transition-all flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-bold text-sm text-zinc-100 group-hover:text-amber-300 transition-colors truncate">
                      {piece.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span>{piece.composer || 'Custom Composer'}</span>
                      <span>•</span>
                      <span className="font-mono">{piece.notes.length} notes</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDeleteSavedPiece(piece.id, e)}
                      className="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 flex items-center justify-center transition-colors"
                      title="Delete piece"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 group-hover:bg-orange-500 text-orange-400 group-hover:text-zinc-950 flex items-center justify-center transition-colors shadow-sm">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Competition Juror Honor Roll & Best Scores */}
        <section className="space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-zinc-200 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>{language === 'de' ? 'Wettbewerbs-Ehrentafel & Rekorde' : 'Competition Hall of Fame'}</span>
            <span className="text-xs text-zinc-500">({competitionScores.length})</span>
          </h2>

          {competitionScores.length === 0 ? (
            <div className="p-6 text-center bg-zinc-900/40 rounded-3xl border border-white/5 space-y-2">
              <Trophy className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">
                {language === 'de'
                  ? 'Noch keine Wettbewerbe abgeschlossen. Starte ein beliebiges Stück im "Wettbewerb"-Modus für strenge Jury-Bewertung!'
                  : 'No competition records yet. Play any piece in "Compete" mode to earn high scores and jury critique!'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {competitionScores.slice(0, 10).map((record, rIdx) => (
                <div
                  key={rIdx}
                  className="p-3.5 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-extrabold text-sm flex-shrink-0">
                      {record.grade}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-zinc-100 truncate">{record.pieceId}</div>
                      <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                        <span>{record.date ? new Date(record.date).toLocaleDateString() : 'Recent'}</span>
                        <span>•</span>
                        <span>Genauigkeit: {record.accuracyPercent}%</span>
                        <span>•</span>
                        <span>+{record.extraNotesCount} Extranoten</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono font-bold text-amber-400 text-sm">
                      {record.score.toLocaleString()} pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 3: Recommended Favorites */}
        <section className="space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-zinc-200 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-400" />
            <span>
              {language === 'de'
                ? 'Empfohlene Meisterwerke'
                : 'Recommended Repertoire'}
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {catalog.slice(0, 4).map((p) => renderPieceCard(p, true))}
          </div>
        </section>
      </div>
    )
  }

  const isBrowsingAll = selectedGenre === 'all' && searchQuery.trim().length === 0 && viewTab !== 'search'

  return (
    <div className="w-full h-full bg-[#0a0a0f] text-zinc-100 overflow-y-auto select-none px-4 sm:px-8 pl-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))] pr-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))] py-6 space-y-8 max-w-7xl mx-auto scrollbar-thin scrollbar-thumb-zinc-800 pb-[max(7rem,calc(env(safe-area-inset-bottom)+5rem))]">
      {/* Search Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'de'
                ? 'Meisterwerke, Komponisten oder Tonleitern suchen (z.B. Chopin, Beethoven, Mozart, Für Elise)...'
                : language === 'fr'
                ? 'Rechercher une pièce ou un compositeur (Chopin, Debussy, Mozart)...'
                : language === 'ja'
                ? '曲名や作曲者を検索 (ショパン、モーツァルト、ベートーヴェン)...'
                : language === 'zh'
                ? '搜索乐曲或作曲家 (肖邦、德彪西、莫扎特、贝多芬)...'
                : 'Search pieces, composers, or drills (Chopin, Beethoven, Mozart, Für Elise)...'
            }
            className={`w-full bg-zinc-900 border text-white pl-12 pr-10 py-3.5 rounded-2xl text-sm focus:outline-none placeholder-zinc-500 transition-all shadow-inner ${
              viewTab === 'search' || searchQuery.length > 0
                ? 'border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/40'
                : 'border-white/10 hover:border-white/20'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Search Tags (Visible on Search Tab or when typing) */}
        {(viewTab === 'search' || searchQuery.length > 0) && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-zinc-500 font-semibold mr-1 flex items-center gap-1 flex-shrink-0">
              <SlidersHorizontal className="w-3 h-3" />
              {language === 'de' ? 'Schnellsuche:' : 'Quick:'}
            </span>
            {quickSearchTags.map((tag) => (
              <button
                key={tag.label}
                onClick={() => setSearchQuery(tag.query)}
                className={`px-2.5 py-1 rounded-lg border text-xs whitespace-nowrap transition-colors ${
                  normalize(searchQuery) === tag.query
                    ? 'bg-orange-500/20 border-orange-500/60 text-orange-300'
                    : 'bg-zinc-900/80 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['all', 'holiday', 'contemporary', 'classical', 'romantic', 'technique', 'beginner', 'advanced'].map((genre) => {
          const isActive = selectedGenre === genre
          const label = genreLabels[genre]?.[language] || genre

          return (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                isActive
                  ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/5'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* If Search is active OR a specific Genre is filtered: Render Grid */}
      {!isBrowsingAll ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-zinc-200 flex items-center gap-2">
              <Compass className="w-5 h-5 text-orange-400" />
              <span>
                {genreLabels[selectedGenre]?.[language] || 'Catalog'}
                {searchQuery ? ` – "${searchQuery}"` : ''}
              </span>
              <span className="text-xs font-normal text-zinc-400">({filteredPieces.length})</span>
            </h2>
            {selectedGenre !== 'all' && (
              <button
                onClick={() => setSelectedGenre('all')}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold"
              >
                {language === 'de' ? 'Alle Stücke anzeigen' : 'Show all pieces'}
              </button>
            )}
          </div>

          {filteredPieces.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 rounded-3xl border border-white/5 space-y-2">
              <Music className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm text-zinc-400">
                {language === 'de'
                  ? 'Keine Stücke für diese Kriterien gefunden.'
                  : 'No pieces found matching your criteria.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPieces.map((p) => renderPieceCard(p, true))}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* FLOWKEY HERO: NEW ARRIVALS & SEASONAL CLASSICS */}
          {featuredNewPieces.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span>
                    {language === 'de'
                      ? 'Neu hinzugefügt & Winter-Klassiker'
                      : 'New Arrivals & Seasonal Classics'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase tracking-wider">
                    NEW
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
                {featuredNewPieces.map((pieceItem) => renderPieceCard(pieceItem))}
              </div>
            </section>
          )}

          {/* FLOWKEY HERO: RECOMMENDED FOR YOU */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>
                  {language === 'de'
                    ? 'Für dich empfohlen'
                    : language === 'fr'
                    ? 'Recommandé pour vous'
                    : language === 'ja'
                    ? 'あなたへのおすすめ'
                    : language === 'zh'
                    ? '为你推荐'
                    : 'Recommended for You'}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {recommendedPieces.map((pieceItem) => renderPieceCard(pieceItem))}
            </div>
          </section>

          {/* FLOWKEY ROW 2: MONTHLY FAVORITES */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span>
                  {language === 'de'
                    ? 'Beliebte Meisterwerke'
                    : language === 'fr'
                    ? 'Chefs-d’œuvre populaires'
                    : language === 'ja'
                    ? '今月の人気名曲'
                    : language === 'zh'
                    ? '经典大师作品'
                    : 'Popular Masterpieces'}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {popularPieces.map((pieceItem) => renderPieceCard(pieceItem))}
            </div>
          </section>

          {/* FLOWKEY ROW 3: HANON & TECHNIQUE DRILLS */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span>
                  {language === 'de'
                    ? 'Hanon-Übungen & Geläufigkeit'
                    : language === 'fr'
                    ? 'Exercices Hanon & Vélocité'
                    : language === 'ja'
                    ? 'ハノン練習曲と指の敏捷性'
                    : language === 'zh'
                    ? '哈农练习曲与运指强化'
                    : 'Hanon Drills & Velocity'}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {techniquePieces.map((pieceItem) => renderPieceCard(pieceItem, true))}
            </div>
          </section>

          {/* ALL REPERTOIRE CATALOG */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Music className="w-5 h-5 text-amber-400" />
                <span>
                  {language === 'de'
                    ? 'Gesamtes Repertoire & Songbibliothek'
                    : 'Complete Repertoire Catalog'}
                </span>
                <span className="text-xs font-normal text-zinc-500">
                  ({catalog.length} {language === 'de' ? 'Stücke' : 'pieces'})
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {catalog.map((pieceItem) => renderPieceCard(pieceItem, true))}
            </div>
          </section>

          {/* Quick Import Banner */}
          <div
            onClick={onOpenImportModal}
            className="p-5 rounded-3xl bg-gradient-to-r from-zinc-900 to-zinc-950 border border-white/10 hover:border-amber-500/40 flex items-center justify-between gap-4 cursor-pointer shadow-lg group transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition-colors">
                  {language === 'de' ? 'Eigene Noten & MIDI importieren' : 'Import Custom Sheet Music & MIDI'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {language === 'de'
                    ? 'Lade eigene .mid oder MusicXML-Dateien hoch und spiele sie direkt im Player.'
                    : 'Upload your own MIDI or MusicXML files to practice with interactive hands & wait mode.'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 transition-colors flex-shrink-0" />
          </div>
        </>
      )}
    </div>
  )
}
