import React from 'react'
import type { Piece } from '../types/music'
import type { MasterEditionId } from '../types/edition'
import type { LanguageCode } from '../i18n/translations'
import {
  Music2,
  Search,
  Bookmark,
  GraduationCap,
  Play,
  Pause,
  Maximize2,
} from 'lucide-react'

export type TabId = 'songs' | 'search' | 'mySongs' | 'courses' | 'player'

interface FlowkeyTabBarProps {
  activeTab: TabId
  onSelectTab: (tab: TabId) => void
  currentPiece: Piece | null
  currentEdition: MasterEditionId
  currentTime?: number
  isPlaying: boolean
  onTogglePlay: () => void
  damperPedal: number
  language: LanguageCode
}

export const FlowkeyTabBar: React.FC<FlowkeyTabBarProps> = ({
  activeTab,
  onSelectTab,
  currentPiece,
  currentEdition,
  currentTime = 0,
  isPlaying,
  onTogglePlay,
  language,
}) => {
  const tabLabels = {
    songs: {
      en: 'Songs',
      de: 'Songs',
      fr: 'Morceaux',
      ja: '楽曲',
      zh: '曲库',
    },
    search: {
      en: 'Search',
      de: 'Suche',
      fr: 'Recherche',
      ja: '検索',
      zh: '搜索',
    },
    mySongs: {
      en: 'My Songs',
      de: 'Meine Songs',
      fr: 'Mes morceaux',
      ja: 'マイソング',
      zh: '我的乐曲',
    },
    courses: {
      en: 'Courses',
      de: 'Kurse',
      fr: 'Cours',
      ja: 'コース',
      zh: '课程与音阶',
    },
  }

  const tabs: { id: TabId; icon: React.ReactNode }[] = [
    {
      id: 'songs',
      icon: <Music2 className="w-5 h-5" />,
    },
    {
      id: 'search',
      icon: <Search className="w-5 h-5" />,
    },
    {
      id: 'mySongs',
      icon: <Bookmark className="w-5 h-5" />,
    },
    {
      id: 'courses',
      icon: <GraduationCap className="w-5 h-5" />,
    },
  ]

  // Don't show bottom tab bar when inside the immersive Player view!
  if (activeTab === 'player') {
    return null
  }

  const progressPct =
    currentPiece && currentPiece.duration > 0
      ? Math.min(100, Math.max(0, (currentTime / currentPiece.duration) * 100))
      : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none flex flex-col">
      {/* PERSISTENT MINI-PLAYER BAR */}
      {currentPiece && (
        <div className="pointer-events-auto mx-3 sm:mx-6 ml-[max(0.75rem,env(safe-area-inset-left))] mr-[max(0.75rem,env(safe-area-inset-right))] mb-2 landscape:mb-1 rounded-2xl bg-zinc-900/95 border border-white/10 hover:border-orange-500/40 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] overflow-hidden transition-all">
          {/* Thin live playback progress strip */}
          <div className="w-full h-0.5 bg-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-150"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="px-3.5 py-2 landscape:py-1.5 flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={() => onSelectTab('player')}
              className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 group text-left"
            >
              <div className="w-9 h-9 landscape:w-7 landscape:h-7 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-700 border border-orange-500/40 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <Music2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-amber-400 transition-colors truncate">
                    {currentPiece.title}
                  </h4>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex-shrink-0 hidden sm:inline">
                    {currentEdition}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate landscape:hidden">
                  {currentPiece.composer}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={onTogglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-9 h-9 landscape:w-8 landscape:h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.5)] active:scale-95 transition-all"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('player')}
                className="w-9 h-9 landscape:w-8 landscape:h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
                title={language === 'de' ? 'Vollbild-Klavier öffnen' : 'Open Full Piano'}
                aria-label="Open Full Piano"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOWKEY BOTTOM 4-TAB NAVIGATION BAR */}
      <nav
        aria-label="Main Navigation"
        className="pointer-events-auto min-h-[3.75rem] landscape:min-h-[2.75rem] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 bg-zinc-950/95 backdrop-blur-2xl border-t border-white/[0.08] px-2 sm:px-8 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] flex items-center justify-around shadow-2xl"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const label = tabLabels[tab.id as keyof typeof tabLabels]?.[language] || tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col landscape:flex-row items-center justify-center gap-0.5 landscape:gap-2 py-1.5 px-3 sm:px-6 min-w-[64px] min-h-[44px] landscape:min-h-[36px] rounded-2xl transition-all relative active:scale-95 ${
                isActive
                  ? 'text-orange-500 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 font-medium'
              }`}
            >
              <div
                className={`transition-transform duration-200 ${
                  isActive ? 'scale-110 text-orange-500' : ''
                }`}
              >
                {tab.icon}
              </div>
              <span className="text-[11px] tracking-tight leading-none">{label}</span>
              {isActive && (
                <div className="w-5 h-0.5 rounded-full bg-orange-500 absolute bottom-0.5 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
