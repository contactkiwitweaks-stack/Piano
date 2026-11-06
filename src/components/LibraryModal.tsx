import React, { useState } from 'react'
import type { Piece } from '../types/music'
import type { MasterEditionId } from '../types/edition'
import { LibraryRepository } from '../library/LibraryRepository'
import { translations, type LanguageCode } from '../i18n/translations'
import {
  BookOpen,
  Search,
  Sparkles,
  X,
  Star,
  Check,
  UserCheck,
} from 'lucide-react'

interface LibraryModalProps {
  isOpen: boolean
  onClose: () => void
  currentPieceId: string
  currentEdition: MasterEditionId
  language: LanguageCode
  onSelectPieceAndEdition: (piece: Piece, edition: MasterEditionId) => void
}

export const LibraryModal: React.FC<LibraryModalProps> = ({
  isOpen,
  onClose,
  currentPieceId,
  currentEdition,
  language,
  onSelectPieceAndEdition,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPieceId, setSelectedPieceId] = useState<string>(currentPieceId)
  const [selectedEdition, setSelectedEdition] = useState<MasterEditionId>(currentEdition)
  const [isLoading, setIsLoading] = useState(false)

  const t = translations[language]
  const catalog = LibraryRepository.getCatalog()

  if (!isOpen) return null

  const filteredCatalog = catalog.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.composer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.opus.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activePieceSummary = catalog.find((p) => p.id === selectedPieceId) || catalog[0]

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      const piece = await LibraryRepository.loadPiece(selectedPieceId, selectedEdition)
      onSelectPieceAndEdition(piece, selectedEdition)
      onClose()
    } catch (err) {
      console.error('Failed to load piece from library:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[88vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">{t.ui.library}</h3>
              <p className="text-[10px] text-zinc-400">{t.editions.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-2.5 bg-zinc-950/60 border-b border-zinc-800 flex items-center gap-2 text-xs">
          <Search className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search Chopin, Beethoven, Liszt, Debussy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-zinc-200 focus:outline-none placeholder-zinc-500 text-xs"
          />
        </div>

        {/* Two-Column Browser: Pieces List (Left) & Edition Chooser (Right) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-zinc-800">
          {/* Left Column: Piece List */}
          <div className="w-full md:w-1/2 p-3 overflow-y-auto space-y-2 max-h-64 md:max-h-none">
            {filteredCatalog.map((piece) => {
              const isSelected = piece.id === selectedPieceId
              return (
                <div
                  key={piece.id}
                  onClick={() => {
                    setSelectedPieceId(piece.id)
                    // Reset edition to first available if not supported
                    if (!piece.availableEditions.some((e) => e.id === selectedEdition)) {
                      setSelectedEdition(piece.availableEditions[0].id)
                    }
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/60 text-zinc-100 shadow-md'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-zinc-950 flex-shrink-0 border border-white/10 relative shadow-sm">
                      <img
                        src={piece.coverImage || '/images/covers/carol-of-the-bells.svg'}
                        alt={piece.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-zinc-100 truncate">{piece.title}</h4>
                      <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
                        <span>{piece.composer}</span>
                        {piece.badge && (
                          <span className="text-amber-400 font-semibold">• {piece.badge}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-amber-400/90 font-mono">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Lvl {piece.difficulty}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Column: Edition Selector & Detailed Notes */}
          <div className="w-full md:w-1/2 p-4 overflow-y-auto space-y-4 bg-zinc-950/40">
            {/* Visual Cover Header */}
            <div className="relative h-28 w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-zinc-950">
              <img
                src={activePieceSummary.coverImage || '/images/covers/carol-of-the-bells.svg'}
                alt={activePieceSummary.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber-300 font-bold bg-black/60 px-2 py-0.5 rounded-lg border border-white/10 shadow-sm">
                  {activePieceSummary.badge || activePieceSummary.period}
                </span>
                <span className="text-[10px] font-mono text-white/90 bg-black/60 px-2 py-0.5 rounded-lg border border-white/10 shadow-sm">
                  {activePieceSummary.key} • {Math.floor(activePieceSummary.durationSeconds / 60)}:{(activePieceSummary.durationSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                {t.editions.title}
              </span>
              <h4 className="text-sm font-bold text-zinc-100 mt-0.5">
                {activePieceSummary.title}
              </h4>
              <p className="text-[11px] text-zinc-400">
                {activePieceSummary.composer} • {activePieceSummary.opus}
              </p>
              {activePieceSummary.quote && (
                <p className="text-[11px] text-zinc-400 italic mt-1.5 p-2 rounded-xl bg-white/[0.04] border border-white/5">
                  "{activePieceSummary.quote}"
                </p>
              )}
            </div>

            {/* Editions List */}
            <div className="space-y-2">
              {activePieceSummary.availableEditions.map((ed) => {
                const isSelected = ed.id === selectedEdition
                return (
                  <div
                    key={ed.id}
                    onClick={() => setSelectedEdition(ed.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-zinc-100 shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-bold text-xs">{ed.name}</span>
                        <span className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 font-mono">
                          {ed.year}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                      {ed.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[10px] text-zinc-500 font-mono">
            Edition: {selectedEdition.toUpperCase()}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs font-medium"
            >
              {t.ui.close}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 hover:brightness-105 font-bold text-xs shadow-md flex items-center gap-1.5"
            >
              {isLoading ? (
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Load Masterclass</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
