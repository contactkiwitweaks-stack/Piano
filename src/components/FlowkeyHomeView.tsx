import React, { useState, useMemo, useRef, useEffect } from 'react'
import type { PracticeVariant } from '../types/music'
import type { MasterEditionId, LibraryPieceSummary } from '../types/edition'
import { LibraryRepository } from '../library/LibraryRepository'
import { SongStorageManager, type StudyShelfId } from '../library/SongStorageManager'
import { PassivePracticeCoach } from '../engine/PassivePracticeCoach'
import type { LanguageCode } from '../i18n/translations'
import type { TabId } from './FlowkeyTabBar'
import {
  Play,
  Search,
  Sparkles,
  ChevronRight,
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
  Film,
  Award,
  Plus,
  Check,
  Star,
  GraduationCap,
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
  onOpenPlayer: _onOpenPlayer,
  onOpenImportModal,
}) => {
  const catalog = useMemo(() => LibraryRepository.getCatalog(), [])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [savedCustomPieces, setSavedCustomPieces] = useState(() => SongStorageManager.getSavedPieces())
  const [competitionScores, setCompetitionScores] = useState(() => SongStorageManager.getAllCompetitionScores())
  const [studyShelves, setStudyShelves] = useState(() => SongStorageManager.getStudyShelves())
  const [activeShelfFilter, setActiveShelfFilter] = useState<StudyShelfId>('studying')
  const [addToShelfPickerOpen, setAddToShelfPickerOpen] = useState<StudyShelfId | null>(null)
  const [shelfPickerSearch, setShelfPickerSearch] = useState('')
  const [quickShelfMenuPieceId, setQuickShelfMenuPieceId] = useState<string | null>(null)
  const [spotlightIndex, setSpotlightIndex] = useState(0)

  const handleAssignShelf = (pieceId: string, shelf: StudyShelfId | null) => {
    const updated = SongStorageManager.setPieceShelf(pieceId, shelf)
    setStudyShelves(updated)
    setQuickShelfMenuPieceId(null)
  }

  useEffect(() => {
    if (viewTab === 'mySongs') {
      setSavedCustomPieces(SongStorageManager.getSavedPieces())
      setCompetitionScores(SongStorageManager.getAllCompetitionScores())
      setStudyShelves(SongStorageManager.getStudyShelves())
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
    anime_film: {
      en: 'Anime & Ghibli',
      de: 'Anime & Studio Ghibli',
      fr: 'Anime & Ghibli',
      ja: 'アニメ・ジブリ',
      zh: '动漫与吉卜力',
    },
    contemporary: {
      en: 'Pop & Modern',
      de: 'Pop & Modern',
      fr: 'Pop & Moderne',
      ja: 'ポップス・現代曲',
      zh: '流行与现代',
    },
    classical: {
      en: 'Classical Masters',
      de: 'Klassik & Barock',
      fr: 'Classique & Baroque',
      ja: 'クラシック名曲',
      zh: '古典大师杰作',
    },
    holiday: {
      en: 'Winter & Holiday',
      de: 'Weihnachten & Winter',
      fr: 'Fêtes & Hiver',
      ja: '冬・クリスマス',
      zh: '冬季与节日',
    },
    technique: {
      en: 'Scales & Hanon',
      de: 'Tonleitern & Hanon',
      fr: 'Gammes & Hanon',
      ja: '音階・ハノン練習',
      zh: '音阶与哈农练习',
    },
    beginner: {
      en: 'Beginner (Lvl 1–3)',
      de: 'Für Anfänger (Lvl 1–3)',
      fr: 'Débutant (Lvl 1–3)',
      ja: '初級 (Lvl 1–3)',
      zh: '入门级 (Lvl 1–3)',
    },
    advanced: {
      en: 'Virtuoso (Lvl 4+)',
      de: 'Virtuos (Lvl 4+)',
      fr: 'Virtuose (Lvl 4+)',
      ja: '演奏会用 (Lvl 4+)',
      zh: '演奏大师级 (Lvl 4+)',
    },
  }

  const quickSearchTags = [
    { label: 'HTTYD Test Drive', query: 'dragon' },
    { label: 'Chopin Ballade 1', query: 'ballade' },
    { label: "French Child's Song", query: 'behr' },
    { label: 'Bohemian Rhapsody', query: 'bohemian' },
    { label: 'Sorrow', query: 'sorrow' },
    { label: 'Czardas', query: 'czardas' },
    { label: 'Liebestraum', query: 'liebestraum' },
    { label: 'Flower Dance', query: 'flower dance' },
    { label: 'River Flows in You', query: 'river flows' },
    { label: 'La Campanella', query: 'campanella' },
    { label: 'Hikaru Nara', query: 'hikaru' },
    { label: 'Chopin Nocturne', query: 'nocturne' },
    { label: 'Spirited Away', query: 'summer' },
    { label: 'Howl Castle', query: 'merry' },
    { label: 'ICARUS', query: 'icarus' },
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
    if (diff <= 4) {
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
    if (diff <= 6) {
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

  // Curated spotlight pieces for top carousel (includes newest additions!)
  const spotlightPieces = useMemo(() => {
    return catalog.filter((p) =>
      [
        'httyd-test-drive',
        'chopin-ballade-1',
        'franz-behr-french-childs-song',
        'queen-bohemian-rhapsody',
        'chopin-liszt-sorrow',
        'liszt-la-campanella',
        'liszt-liebestraum-3',
        'hikaru-nara',
        'joe-hisaishi-one-summers-day',
        'chopin-nocturne-c-sharp-minor',
      ].includes(p.id)
    )
  }, [catalog])

  const activeSpotlight = spotlightPieces[spotlightIndex % spotlightPieces.length] || catalog[0]

  // Filtered pieces based on genre, difficulty, and search query
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
        const matchesBadge = p.badge ? normalize(p.badge).includes(q) : false

        if (!matchesTitle && !matchesComposer && !matchesOpus && !matchesKey && !matchesPeriod && !matchesId && !matchesBadge) {
          return false
        }
      }

      if (selectedGenre === 'all') return true
      if (selectedGenre === 'anime_film') {
        return (
          p.id === 'httyd-test-drive' ||
          p.id === 'hikaru-nara' ||
          p.id === 'joe-hisaishi-one-summers-day' ||
          p.id === 'joe-hisaishi-merry-go-round' ||
          p.id === 'kensuke-ushio-in-the-sea' ||
          p.title.includes('Dragon') ||
          p.title.includes('Chainsaw') ||
          p.title.includes('April') ||
          p.title.includes('Spirited') ||
          p.title.includes('Castle')
        )
      }
      if (selectedGenre === 'contemporary') {
        return (
          p.id === 'river-flows-in-you' ||
          p.id === 'dj-okawari-flower-dance' ||
          p.id === 'sia-snowman' ||
          p.id === 'carol-of-the-bells' ||
          p.id === 'tony-ann-icarus' ||
          p.id === 'abba-the-winner-takes-it-all' ||
          p.period === 'Contemporary' ||
          p.period === 'Neoclassical'
        )
      }
      if (selectedGenre === 'classical') {
        return (
          p.id === 'liszt-la-campanella' ||
          p.id === 'chopin-nocturne-c-sharp-minor' ||
          p.id === 'chopin-ballade-1' ||
          p.id === 'beethoven-moonlight-1' ||
          p.id === 'beethoven-fur-elise' ||
          p.id === 'handel-halvorsen-passacaglia' ||
          p.id === 'bach-prelude-c' ||
          p.period === 'Classical' ||
          p.period === 'Romantic' ||
          p.period === 'Baroque'
        )
      }
      if (selectedGenre === 'holiday') {
        return p.id === 'carol-of-the-bells' || p.id === 'sia-snowman'
      }
      if (selectedGenre === 'technique') {
        return p.period === 'Technique' || p.id.startsWith('scale-') || p.id.startsWith('hanon-')
      }
      if (selectedGenre === 'beginner') {
        return p.difficulty <= 3
      }
      if (selectedGenre === 'advanced') {
        return p.difficulty >= 4
      }
      return true
    })
  }, [catalog, searchQuery, selectedGenre])

  // Dynamic Shelves (automatically include all pieces by category so new songs never disappear!)
  const animeIds = [
    'httyd-test-drive',
    'hikaru-nara',
    'joe-hisaishi-one-summers-day',
    'joe-hisaishi-merry-go-round',
    'kensuke-ushio-in-the-sea',
  ]

  const animeShelf = useMemo(() => {
    return catalog.filter((p) => animeIds.includes(p.id))
  }, [catalog])

  const contemporaryShelf = useMemo(() => {
    return catalog.filter(
      (p) =>
        !animeIds.includes(p.id) &&
        (p.period === 'Contemporary' || p.period === 'Neoclassical')
    )
  }, [catalog])

  const classicalShelf = useMemo(() => {
    return catalog.filter(
      (p) =>
        p.period === 'Classical' || p.period === 'Romantic' || p.period === 'Baroque'
    )
  }, [catalog])

  const techniqueShelf = useMemo(() => {
    return catalog.filter((p) =>
      p.period === 'Technique' || p.id.startsWith('scale-') || p.id.startsWith('hanon-')
    )
  }, [catalog])

  const handleLaunchPiece = (pieceSummary: LibraryPieceSummary, editionId: MasterEditionId = 'urtext') => {
    onSelectPieceAndEdition(pieceSummary.id, editionId, 'original')
  }

  // Gorgeous Album Art Card with Quick Study-Shelf Bookmark Picker
  const renderPieceCard = (pieceItem: LibraryPieceSummary, compact = false) => {
    const diff = difficultyBadge(pieceItem.difficulty)
    const coverSrc = pieceItem.coverImage || '/images/covers/carol-of-the-bells.svg'
    const currentShelf = studyShelves.find((s) => s.pieceId === pieceItem.id)?.shelf || null
    const isMenuOpen = quickShelfMenuPieceId === pieceItem.id

    const shelfOptions: { id: StudyShelfId; de: string; en: string }[] = [
      { id: 'studying', de: 'Aktuell am Lernen', en: 'Currently Studying' },
      { id: 'planning', de: 'Geplant zu lernen', en: 'Planning to Learn' },
      { id: 'mastered', de: 'Gemeistert', en: 'Mastered' },
      { id: 'favorites', de: 'Favoriten', en: 'Favorites' },
    ]

    return (
      <div
        key={pieceItem.id}
        onClick={() => handleLaunchPiece(pieceItem)}
        className="group relative rounded-3xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-white/10 hover:border-orange-500/60 cursor-pointer flex flex-col justify-between p-3 sm:p-4 gap-3 transition-all duration-300 shadow-xl hover:shadow-[0_10px_30px_rgba(249,115,22,0.18)] active:scale-[0.98] overflow-visible"
      >
        {/* Cover Picture Container */}
        <div
          className={`${
            compact ? 'h-36 sm:h-40' : 'h-48 sm:h-52'
          } w-full rounded-2xl relative overflow-hidden bg-zinc-950 shadow-inner flex flex-col justify-between p-3.5`}
        >
          <img
            src={coverSrc}
            alt={pieceItem.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/40 pointer-events-none" />

          {/* Top Row Badges + Study Shelf Bookmark Button */}
          <div className="relative z-10 flex items-center justify-between gap-1.5 w-full">
            {pieceItem.badge ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-black/60 backdrop-blur-md border border-white/20 text-amber-300 shadow-md truncate max-w-[60%]">
                {pieceItem.badge}
              </span>
            ) : (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${diff.color}`}>
                {diff.label}
              </span>
            )}

            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono font-semibold text-white/90 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10 shadow-sm">
                <Clock className="w-2.5 h-2.5 text-zinc-400" />
                {formatDuration(pieceItem.durationSeconds)}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setQuickShelfMenuPieceId(isMenuOpen ? null : pieceItem.id)
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center border backdrop-blur-md transition-all active:scale-90 ${
                  currentShelf
                    ? 'bg-amber-500 text-zinc-950 border-amber-300 shadow-md'
                    : 'bg-black/65 text-zinc-200 border-white/20 hover:border-amber-400 hover:text-amber-300'
                }`}
                title={language === 'de' ? 'Zu Lern-Regal hinzufügen' : 'Add to Study Shelf'}
              >
                <Bookmark className={`w-3.5 h-3.5 ${currentShelf ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Bottom Row inside Cover Picture */}
          <div className="relative z-10 flex items-end justify-between w-full">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-white/95 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
                {pieceItem.key}
              </span>
              <span className="text-[10px] font-bold text-amber-400 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
                Lvl {pieceItem.difficulty}
              </span>
            </div>

            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-zinc-950 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.6)] group-hover:scale-110 group-hover:brightness-110 transition-all duration-300">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>
        </div>

        {/* Floating Study Shelf Quick Picker Popover */}
        {isMenuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-12 right-3 z-40 w-48 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-amber-500/40 shadow-2xl p-1.5 space-y-1 text-xs animate-in fade-in zoom-in-95"
          >
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 border-b border-white/10">
              {language === 'de' ? 'In Lern-Regal speichern' : 'Save to Study Shelf'}
            </div>
            {shelfOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleAssignShelf(pieceItem.id, opt.id)}
                className={`w-full px-2.5 py-1.5 rounded-xl text-left font-semibold flex items-center justify-between transition-colors ${
                  currentShelf === opt.id
                    ? 'bg-amber-500 text-zinc-950 font-black'
                    : 'text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <span>{language === 'de' ? opt.de : opt.en}</span>
                {currentShelf === opt.id && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
            {currentShelf && (
              <button
                type="button"
                onClick={() => handleAssignShelf(pieceItem.id, null)}
                className="w-full px-2.5 py-1.5 rounded-xl text-left text-rose-400 hover:bg-rose-950/40 font-semibold border-t border-white/5"
              >
                {language === 'de' ? 'Aus Regal entfernen' : 'Remove from shelf'}
              </button>
            )}
          </div>
        )}

        {/* Text Metadata */}
        <div className="space-y-1 px-1">
          <h3 className="font-bold text-sm sm:text-base text-zinc-100 group-hover:text-amber-300 transition-colors truncate">
            {pieceItem.title}
          </h3>
          <p className="text-xs text-zinc-400 truncate flex items-center gap-1.5">
            <span>{pieceItem.composer}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-500 font-mono text-[11px]">{pieceItem.opus}</span>
          </p>
          {pieceItem.quote && !compact && (
            <p className="text-[11px] text-zinc-500 italic line-clamp-1 pt-0.5">
              "{pieceItem.quote}"
            </p>
          )}
        </div>
      </div>
    )
  }

  // MY SONGS TAB VIEW — PERSONAL STUDY REPERTOIRE ("Aktuell am Lernen", "Geplant", "Gemeistert", "Favoriten")
  if (viewTab === 'mySongs') {
    const isDe = language === 'de'
    const shelfMeta: {
      id: StudyShelfId
      label: string
      desc: string
      accent: string
      badgeBg: string
    }[] = [
      {
        id: 'studying',
        label: isDe ? 'Aktuell am Lernen' : 'Currently Studying',
        desc: isDe ? 'Deine aktiven Übestücke mit Live-Fortschritt & Übe-Coach' : 'Your active study pieces with live practice coach stats',
        accent: 'text-amber-400',
        badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
      },
      {
        id: 'planning',
        label: isDe ? 'Geplant zu lernen' : 'Planning to Learn',
        desc: isDe ? 'Deine nächsten Stücke auf der Wunschliste' : 'Upcoming pieces on your study wishlist',
        accent: 'text-sky-400',
        badgeBg: 'bg-sky-500/20 border-sky-500/40 text-sky-300',
      },
      {
        id: 'mastered',
        label: isDe ? 'Gemeistert / Repertoire' : 'Mastered Repertoire',
        desc: isDe ? 'Konzertreife Stücke, die du regelmäßig auffrischst' : 'Concert-ready pieces you keep polished',
        accent: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
      },
      {
        id: 'favorites',
        label: isDe ? 'Favoriten' : 'Favorites',
        desc: isDe ? 'Deine persönlichen Lieblingsstücke' : 'Your all-time favorite pieces',
        accent: 'text-rose-400',
        badgeBg: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
      },
    ]

    const entriesForShelf = (shelf: StudyShelfId) =>
      studyShelves
        .filter((e) => e.shelf === shelf)
        .map((e) => ({
          entry: e,
          piece: catalog.find((c) => c.id === e.pieceId) || null,
        }))
        .filter((x): x is { entry: (typeof studyShelves)[number]; piece: LibraryPieceSummary } => x.piece !== null)

    const activeShelfObj = shelfMeta.find((s) => s.id === activeShelfFilter) || shelfMeta[0]
    const activeEntries = entriesForShelf(activeShelfFilter)

    return (
      <div className="w-full h-full bg-[#0a0a0f] text-zinc-100 overflow-y-auto touch-pan-y select-none px-4 sm:px-8 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-6 space-y-7 max-w-7xl mx-auto pb-[calc(11.5rem+env(safe-area-inset-bottom))]">
        {/* Hero Study Hub Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-amber-950/30 border border-white/10 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md flex-shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                {isDe ? 'Mein Lern-Repertoire' : 'My Study Repertoire'}
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isDe
                  ? 'Organisiere was du gerade lernst, planst oder schon gemeistert hast — inklusive passivem Übe-Fortschritt.'
                  : 'Organize what you are currently studying, planning to learn, or have mastered — with live practice stats.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setAddToShelfPickerOpen(activeShelfFilter)
                setShelfPickerSearch('')
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isDe ? 'Song aus Katalog hinzufügen' : 'Add Song to Shelf'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenImportModal}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/35 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>{isDe ? 'MIDI / Cloud importieren' : 'Import MIDI / Cloud'}</span>
            </button>
          </div>
        </div>

        {/* 4 Study Shelf Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {shelfMeta.map((sh) => {
            const count = entriesForShelf(sh.id).length
            const active = activeShelfFilter === sh.id
            return (
              <button
                key={sh.id}
                type="button"
                onClick={() => setActiveShelfFilter(sh.id)}
                className={`p-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                  active
                    ? 'bg-zinc-900 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                    : 'bg-zinc-900/50 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-extrabold truncate ${active ? sh.accent : 'text-zinc-300'}`}>
                    {sh.label}
                  </span>
                  <span className={`font-mono text-[11px] font-black px-2 py-0.5 rounded-lg border ${sh.badgeBg}`}>
                    {count}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 line-clamp-1">{sh.desc}</p>
              </button>
            )
          })}
        </div>

        {/* Active Study Shelf Songs Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <Star className={`w-5 h-5 ${activeShelfObj.accent}`} />
              <span>{activeShelfObj.label}</span>
              <span className="text-xs font-mono text-zinc-500">({activeEntries.length})</span>
            </h2>
            <button
              type="button"
              onClick={() => {
                setAddToShelfPickerOpen(activeShelfFilter)
                setShelfPickerSearch('')
              }}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isDe ? 'Hier hinzufügen' : 'Add here'}</span>
            </button>
          </div>

          {activeEntries.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 rounded-3xl border border-white/5 space-y-3">
              <Bookmark className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-sm font-semibold text-zinc-300">
                {isDe ? `Noch keine Stücke in „${activeShelfObj.label}“` : `No songs in "${activeShelfObj.label}" yet`}
              </p>
              <button
                type="button"
                onClick={() => setAddToShelfPickerOpen(activeShelfFilter)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isDe ? 'Stück hinzufügen' : 'Add a Song'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeEntries.map(({ entry, piece: p }) => {
                const coachBadge = PassivePracticeCoach.getInstance().getQuickProgressBadge(p.id)
                const coverSrc = p.coverImage || '/images/covers/chopin-ballade-1.svg'
                return (
                  <div
                    key={p.id}
                    onClick={() => handleLaunchPiece(p)}
                    className="rounded-3xl bg-zinc-900/85 hover:bg-zinc-900 border border-white/10 hover:border-amber-500/50 cursor-pointer overflow-hidden flex flex-col justify-between transition-all shadow-lg group"
                  >
                    <div className="relative h-32 w-full overflow-hidden bg-zinc-950 p-3 flex flex-col justify-between">
                      <img src={coverSrc} alt={p.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/30" />
                      <div className="relative z-10 flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/65 text-amber-300 border border-white/15">
                          {p.key} • Lvl {p.difficulty}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </div>
                      </div>
                      <div className="relative z-10">
                        <h3 className="font-extrabold text-sm sm:text-base text-white truncate">{p.title}</h3>
                        <p className="text-[11px] text-zinc-300 truncate">{p.composer}</p>
                      </div>
                    </div>

                    <div className="p-3.5 space-y-2.5 text-xs">
                      {entry.targetNote && (
                        <div className="text-[11px] text-amber-300/90 font-semibold truncate">
                          {entry.targetNote}
                        </div>
                      )}

                      {/* Live Passive Practice Coach Progress Strip */}
                      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-950/90 border border-white/5 text-[11px]">
                        {coachBadge.practiced ? (
                          <>
                            <span className="text-emerald-300 font-mono font-bold">
                              {coachBadge.accuracyPercent}% {isDe ? 'sicher' : 'acc'} ({coachBadge.totalHits})
                            </span>
                            {coachBadge.worstMeasure && (
                              <span className="text-amber-300 font-mono text-[10px]">
                                {isDe ? `Fokus M.${coachBadge.worstMeasure}` : `Focus M.${coachBadge.worstMeasure}`}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-zinc-500 italic">
                            {isDe ? 'Noch nicht im Wait-Modus geübt' : 'Start playing to track progress'}
                          </span>
                        )}
                      </div>

                      {/* Quick Shelf Move / Remove Controls */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-between gap-1.5 pt-0.5"
                      >
                        <select
                          value={entry.shelf}
                          onChange={(e) => handleAssignShelf(p.id, e.target.value as StudyShelfId)}
                          className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-2 py-1.5 text-[10.5px] font-bold text-zinc-200 focus:outline-none"
                          aria-label="Move to shelf"
                        >
                          {shelfMeta.map((sm) => (
                            <option key={sm.id} value={sm.id}>
                              {sm.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleAssignShelf(p.id, null)}
                          className="p-1.5 rounded-xl bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors"
                          title={isDe ? 'Aus Regal entfernen' : 'Remove from shelf'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Section 2: User's Custom & Downloaded Scores */}
        <section className="space-y-3">
          <h2 className="text-sm sm:text-base font-bold text-zinc-200 flex items-center gap-2">
            <Music className="w-4 h-4 text-orange-400" />
            <span>{isDe ? 'Eigene & Importierte MIDI-Dateien' : 'Custom & Imported MIDI Files'}</span>
            <span className="text-xs text-zinc-500">({savedCustomPieces.length})</span>
          </h2>

          {savedCustomPieces.length === 0 ? (
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-zinc-400">
                {isDe
                  ? 'Importiere eigene .mid/.musicxml Dateien direkt auf dein iPhone (erscheinen dann sofort in deinen Regalen).'
                  : 'Import your own .mid or .musicxml files directly on iPhone.'}
              </span>
              <button
                type="button"
                onClick={onOpenImportModal}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isDe ? 'Importieren' : 'Import'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedCustomPieces.map((piece) => (
                <div
                  key={piece.id}
                  onClick={() => onSelectPieceAndEdition(piece.id, 'urtext', 'original')}
                  className="p-3.5 rounded-2xl bg-zinc-900 border border-white/5 hover:border-amber-500/40 cursor-pointer group transition-all flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="font-bold text-sm text-zinc-100 group-hover:text-amber-300 truncate">{piece.title}</h4>
                    <div className="text-[11px] text-zinc-400 font-mono">{piece.notes.length} notes</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSavedPiece(piece.id, e)}
                      className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 3: Competition Juror Honor Roll */}
        <section className="space-y-3">
          <h2 className="text-sm sm:text-base font-bold text-zinc-200 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{isDe ? 'Wettbewerbs- & Lehrer-Rekorde' : 'Competition & Teacher Records'}</span>
            <span className="text-xs text-zinc-500">({competitionScores.length})</span>
          </h2>
          {competitionScores.length === 0 ? (
            <div className="p-5 text-center bg-zinc-900/40 rounded-2xl border border-white/5 text-xs text-zinc-400">
              {isDe
                ? 'Verbinde dein Roland LX-9 per Bluetooth und absolviere einen Durchgang im Comp-Modus für gespeicherte Gutachten.'
                : 'Connect Roland LX-9 Bluetooth and complete a Comp session to record conservatory scorecards.'}
            </div>
          ) : (
            <div className="space-y-2">
              {competitionScores.slice(0, 8).map((record, rIdx) => {
                const matchedCatalog = catalog.find((c) => c.id === record.pieceId)
                return (
                  <div
                    key={rIdx}
                    onClick={() => onSelectPieceAndEdition(record.pieceId, 'urtext', 'original')}
                    className="p-3 rounded-xl bg-zinc-900 border border-white/5 hover:border-amber-500/40 cursor-pointer flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black flex-shrink-0">
                        {record.grade}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{matchedCatalog ? matchedCatalog.title : record.pieceId}</div>
                        <div className="text-[10.5px] text-zinc-400">{record.date} • {record.accuracyPercent}%</div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-amber-400">{record.score.toLocaleString()} pts</div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Catalog -> Study Shelf Picker Modal */}
        {addToShelfPickerOpen && (
          <div
            onClick={() => setAddToShelfPickerOpen(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[85dvh] bg-[#0e0f14] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-5 py-4 bg-zinc-950 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    {isDe ? 'Song zu Lern-Regal hinzufügen' : 'Add Song to Study Shelf'}
                  </h3>
                  <p className="text-[11px] text-amber-400 font-semibold">
                    {shelfMeta.find((s) => s.id === addToShelfPickerOpen)?.label}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddToShelfPickerOpen(null)}
                  className="w-8 h-8 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
                <input
                  type="text"
                  value={shelfPickerSearch}
                  onChange={(e) => setShelfPickerSearch(e.target.value)}
                  placeholder={isDe ? 'Stück suchen (z. B. Ballade, HTTYD, Behr, Liszt)...' : 'Search piece (e.g. Ballade, HTTYD, Behr)...'}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />

                <div className="space-y-1.5">
                  {catalog
                    .filter((p) => {
                      const q = normalize(shelfPickerSearch.trim())
                      if (!q) return true
                      return normalize(p.title).includes(q) || normalize(p.composer).includes(q)
                    })
                    .map((p) => {
                      const assigned = studyShelves.find((s) => s.pieceId === p.id)?.shelf === addToShelfPickerOpen
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleAssignShelf(p.id, assigned ? null : addToShelfPickerOpen)}
                          className={`w-full p-3 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all ${
                            assigned
                              ? 'bg-amber-500/20 border-amber-500/60 text-white'
                              : 'bg-zinc-900/70 hover:bg-zinc-800 border-white/5 text-zinc-200'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{p.title}</div>
                            <div className="text-[10.5px] text-zinc-400 truncate">
                              {p.composer} • {p.key} • Lvl {p.difficulty}
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black flex-shrink-0 ${
                              assigned ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {assigned ? (isDe ? 'Drin ✓' : 'Added ✓') : '+ Add'}
                          </span>
                        </button>
                      )
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const isBrowsingAll = selectedGenre === 'all' && searchQuery.trim().length === 0 && viewTab !== 'search'

  return (
    <div className="w-full h-full bg-[#0a0a0f] text-zinc-100 overflow-y-auto touch-pan-y select-none px-4 sm:px-8 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-6 space-y-8 max-w-7xl mx-auto pb-[calc(11.5rem+env(safe-area-inset-bottom))]">
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
                ? 'Meisterwerke, Anime, Ghibli oder Pop suchen (z.B. Liszt, Chopin, Flower Dance, Snowman)...'
                : language === 'fr'
                ? 'Rechercher une pièce ou un compositeur (Liszt, Chopin, Ghibli, Yiruma)...'
                : language === 'ja'
                ? '曲名や作曲者を検索 (リスト、ショパン、ジブリ、花舞)...'
                : language === 'zh'
                ? '搜索乐曲或作曲家 (李斯特、肖邦、吉卜力、花舞、四月是你的谎言)...'
                : 'Search pieces, composers, anime, or drills (Liszt, Chopin, Flower Dance, Snowman)...'
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

        {/* Quick Search Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-zinc-500 font-semibold mr-1 flex items-center gap-1 flex-shrink-0">
            <SlidersHorizontal className="w-3 h-3" />
            {language === 'de' ? 'Entdecken:' : 'Explore:'}
          </span>
          {quickSearchTags.map((tag) => (
            <button
              key={tag.label}
              onClick={() => setSearchQuery(tag.query)}
              className={`px-3 py-1.5 rounded-xl border text-xs whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                normalize(searchQuery) === tag.query
                  ? 'bg-orange-500/25 border-orange-500/70 text-orange-300 shadow-sm'
                  : 'bg-zinc-900/90 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Music className="w-3 h-3 text-orange-400/80" />
              <span>{tag.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['all', 'anime_film', 'contemporary', 'classical', 'holiday', 'technique', 'beginner', 'advanced'].map((genre) => {
          const isActive = selectedGenre === genre
          const label = genreLabels[genre]?.[language] || genre

          return (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-extrabold shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/5'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* If Search is active OR a specific Genre is filtered: Render Search Grid */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {filteredPieces.map((p) => renderPieceCard(p, true))}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* TOP SPOTLIGHT FEATURED HERO BANNER */}
          {activeSpotlight && (
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-950 group">
              {/* Wide Blurred Backdrop */}
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={activeSpotlight.coverImage || '/images/covers/carol-of-the-bells.svg'}
                  alt=""
                  className="w-full h-full object-cover blur-2xl opacity-40 scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/95 via-black/75 to-transparent" />
              </div>

              <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-3 max-w-xl text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                      Featured Masterpiece
                    </span>
                    {activeSpotlight.badge && (
                      <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 text-xs font-medium border border-white/10">
                        {activeSpotlight.badge}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    {activeSpotlight.title}
                  </h1>

                  <p className="text-sm sm:text-base font-semibold text-orange-400">
                    {activeSpotlight.composer} • {activeSpotlight.opus}
                  </p>

                  {activeSpotlight.quote && (
                    <p className="text-xs sm:text-sm text-zinc-300 italic max-w-lg leading-relaxed">
                      "{activeSpotlight.quote}"
                    </p>
                  )}

                  <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                    <button
                      onClick={() => handleLaunchPiece(activeSpotlight)}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 hover:brightness-110 text-zinc-950 font-bold text-sm shadow-[0_0_20px_rgba(249,115,22,0.5)] flex items-center gap-2.5 active:scale-95 transition-all"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Playing</span>
                    </button>

                    <button
                      onClick={() => setSpotlightIndex((prev) => prev + 1)}
                      className="px-4 py-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 text-xs font-bold transition-colors flex items-center gap-1.5"
                      title="Next spotlight song"
                    >
                      <span>Next Spotlight</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                  </div>
                </div>

                {/* Right Album Artwork Frame */}
                <div
                  onClick={() => handleLaunchPiece(activeSpotlight)}
                  className="w-48 h-48 sm:w-60 sm:h-60 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl relative flex-shrink-0 cursor-pointer hover:scale-105 transition-transform duration-300"
                >
                  <img
                    src={activeSpotlight.coverImage || '/images/covers/carol-of-the-bells.svg'}
                    alt={activeSpotlight.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors" />
                </div>
              </div>
            </div>
          )}

          {/* SHELF 1: ANIME & STUDIO GHIBLI MAGIC */}
          {animeShelf.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Film className="w-5 h-5 text-pink-400" />
                  <span>Anime &amp; Studio Ghibli Magic</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold">
                    OST
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {animeShelf.map((p) => renderPieceCard(p))}
              </div>
            </section>
          )}

          {/* SHELF 2: PIANO BALLADS & POP HITS */}
          {contemporaryShelf.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>Piano Ballads &amp; Contemporary Hits</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    POPULAR
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {contemporaryShelf.map((p) => renderPieceCard(p))}
              </div>
            </section>
          )}

          {/* SHELF 3: GRAND CLASSICAL & ROMANTIC MASTERS */}
          {classicalShelf.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Award className="w-5 h-5 text-orange-400" />
                  <span>Grand Classical &amp; Romantic Masters</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold">
                    CANONICAL
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {classicalShelf.map((p) => renderPieceCard(p))}
              </div>
            </section>
          )}

          {/* SHELF 4: TECHNIQUE, SCALES & HANON */}
          {techniqueShelf.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  <span>Hanon Exercises &amp; Scale Agility</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {techniqueShelf.slice(0, 4).map((p) => renderPieceCard(p, true))}
              </div>
            </section>
          )}

          {/* ALL REPERTOIRE CATALOG */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Music className="w-5 h-5 text-amber-400" />
                <span>All Pieces Repertoire</span>
                <span className="text-xs font-normal text-zinc-500">
                  ({catalog.length} {language === 'de' ? 'Stücke' : 'pieces'})
                </span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {catalog.map((p) => renderPieceCard(p, true))}
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
