import React, { useState, useMemo } from 'react'
import type { Piece } from '../types/music'
import { warmupsList } from '../data/warmups'
import { translations, type LanguageCode } from '../i18n/translations'
import {
  Flame,
  X,
  Play,
  BookOpen,
} from 'lucide-react'

interface WarmupsModalProps {
  isOpen: boolean
  onClose: () => void
  language: LanguageCode
  onSelectWarmupPiece: (piece: Piece) => void
}

export const WarmupsModal: React.FC<WarmupsModalProps> = ({
  isOpen,
  onClose,
  language,
  onSelectWarmupPiece,
}) => {
  const [selectedCat, setSelectedCat] = useState<'all' | 'scales' | 'arpeggios' | 'velocity'>('all')
  const t = translations[language].warmups

  const filteredWarmups = useMemo(() => {
    if (selectedCat === 'all') return warmupsList
    if (selectedCat === 'scales') return warmupsList.filter(w => w.category === 'thumb-agility' || w.id.includes('scale'))
    if (selectedCat === 'arpeggios') return warmupsList.filter(w => w.category === 'arpeggio' || w.id.includes('arpeggio'))
    if (selectedCat === 'velocity') return warmupsList.filter(w => w.category === 'coda-velocity' || w.category === 'trill' || w.category === 'independence')
    return warmupsList
  }, [selectedCat])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">{t.title}</h3>
              <p className="text-[10px] text-zinc-400">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Selector Pills */}
        <div className="px-5 py-2.5 bg-zinc-950/60 border-b border-zinc-800/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: language === 'de' ? 'Alle Übungen' : 'All Warmups' },
            { id: 'scales', label: language === 'de' ? 'Tonleitern' : 'Scales' },
            { id: 'arpeggios', label: language === 'de' ? 'Arpeggien' : 'Arpeggios' },
            { id: 'velocity', label: language === 'de' ? 'Geläufigkeit & Oktaven' : 'Velocity & Octaves' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id as typeof selectedCat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCat === cat.id
                  ? 'bg-amber-500 text-zinc-950 font-extrabold shadow-sm'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content List */}
        <div className="p-4 overflow-y-auto space-y-3">
          {filteredWarmups.map((exercise) => (
            <div
              key={exercise.id}
              className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-zinc-100 group-hover:text-amber-300 transition-colors">
                    {exercise.title}
                  </span>
                  <span className="text-[10px] bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded text-zinc-300 font-mono">
                    Lvl {exercise.difficulty}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-snug">
                  {exercise.description}
                </p>

                <div className="flex items-center gap-3 pt-1 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                    <BookOpen className="w-3 h-3" />
                    {exercise.targetPiece}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectWarmupPiece(exercise.exercisePiece)
                  onClose()
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-zinc-950 font-bold text-xs shadow-md flex items-center justify-center gap-1.5 flex-shrink-0 active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t.startWarmup}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
