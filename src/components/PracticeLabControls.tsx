import React, { useState } from 'react'
import type { PracticeVariant } from '../types/music'
import type { MasterEditionId } from '../types/edition'
import { translations, type LanguageCode } from '../i18n/translations'
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Bluetooth,
  Upload,
  Repeat,
  Gauge,
  Eye,
  CheckCircle2,
  Mic,
  MicOff,
  BookOpen,
  Volume2,
  Globe,
} from 'lucide-react'

interface PracticeLabControlsProps {
  isPlaying: boolean
  playbackRate: number
  practiceVariant: PracticeVariant
  viewMode: 'waterfall' | 'sheet' | 'split'
  waterfallCamera: '3d' | '2d'
  isLooping: boolean
  loopRange: [number, number]
  tempoRampEnabled: boolean
  isConnectedLX9: boolean
  isMicActive: boolean
  mechanicalNoiseEnabled: boolean
  language: LanguageCode
  edition: MasterEditionId
  onTogglePlay: () => void
  onRewind: () => void
  onRateChange: (rate: number) => void
  onVariantChange: (variant: PracticeVariant) => void
  onViewModeChange: (mode: 'waterfall' | 'sheet' | 'split') => void
  onWaterfallCameraToggle: () => void
  onToggleLoop: () => void
  onLoopRangeChange: (range: [number, number]) => void
  onToggleTempoRamp: () => void
  onToggleMic: () => void
  onToggleMechanicalNoise: () => void
  onLanguageChange: (lang: LanguageCode) => void
  onOpenBluetoothModal: () => void
  onOpenImportModal: () => void
  onOpenLibraryModal: () => void
}

export const PracticeLabControls: React.FC<PracticeLabControlsProps> = ({
  isPlaying,
  playbackRate,
  practiceVariant,
  viewMode,
  waterfallCamera,
  isLooping,
  loopRange,
  tempoRampEnabled,
  isConnectedLX9,
  isMicActive,
  mechanicalNoiseEnabled,
  language,
  edition,
  onTogglePlay,
  onRewind,
  onRateChange,
  onVariantChange,
  onViewModeChange,
  onWaterfallCameraToggle,
  onToggleLoop,
  onLoopRangeChange,
  onToggleTempoRamp,
  onToggleMic,
  onToggleMechanicalNoise,
  onLanguageChange,
  onOpenBluetoothModal,
  onOpenImportModal,
  onOpenLibraryModal,
}) => {
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false)
  const t = translations[language]

  const variantOptions: { id: PracticeVariant; label: string }[] = [
    { id: 'original', label: t.variants.original },
    { id: 'wait-for-note', label: t.variants.waitForNote },
    { id: 'hands-separate-right', label: t.variants.rightHand },
    { id: 'hands-separate-left', label: t.variants.leftHand },
    { id: 'dotted-long-short', label: t.variants.dottedLongShort },
    { id: 'dotted-short-long', label: t.variants.dottedShortLong },
    { id: 'harmonic-skeleton', label: t.variants.harmonicSkeleton },
  ]

  const languages: { code: LanguageCode; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'Deutsch' },
    { code: 'fr', label: 'Français' },
    { code: 'ja', label: '日本語' },
    { code: 'zh', label: '中文' },
  ]

  return (
    <div className="w-full bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 text-zinc-100 flex flex-col z-40 select-none pb-[var(--sab)]">
      {/* Upper Quick Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80 gap-1.5 flex-wrap">
        {/* Play/Pause & Transport */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onTogglePlay}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg transition-transform active:scale-95 ${
              isPlaying
                ? 'bg-amber-500 text-zinc-950 shadow-amber-500/20'
                : 'bg-gradient-to-tr from-amber-500 to-amber-400 text-zinc-950 shadow-amber-500/30'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <button
            onClick={onRewind}
            className="w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 flex items-center justify-center border border-zinc-700/60 active:scale-95 transition-all"
            title="Rewind"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Practice Mode Picker */}
        <div className="flex-1 min-w-[130px] max-w-xs mx-1">
          <select
            value={practiceVariant}
            onChange={(e) => onVariantChange(e.target.value as PracticeVariant)}
            className="w-full bg-zinc-900 border border-zinc-700/80 text-zinc-200 text-xs rounded-xl px-2.5 py-1.5 font-medium focus:outline-none focus:border-amber-500"
          >
            {variantOptions.map((item) => (
              <option key={item.id} value={item.id} className="bg-zinc-900 text-zinc-200">
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Layout Selector (Waterfall / Sheet / Split) */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5">
          <button
            onClick={() => onViewModeChange('waterfall')}
            className={`px-2 py-1 text-[11px] rounded-lg font-medium transition-colors ${
              viewMode === 'waterfall' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.ui.waterfallOnly}
          </button>
          <button
            onClick={() => onViewModeChange('split')}
            className={`px-2 py-1 text-[11px] rounded-lg font-medium transition-colors ${
              viewMode === 'split' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.ui.splitView}
          </button>
          <button
            onClick={() => onViewModeChange('sheet')}
            className={`px-2 py-1 text-[11px] rounded-lg font-medium transition-colors ${
              viewMode === 'sheet' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.ui.sheetOnly}
          </button>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-1.5">
          {/* Library Selector */}
          <button
            onClick={onOpenLibraryModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-700/80 bg-zinc-900 text-amber-400 hover:bg-zinc-800 text-xs font-medium"
            title="Choose piece & master edition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono text-[11px] uppercase">
              {edition}
            </span>
          </button>

          {/* Acoustic Mic Toggle */}
          <button
            onClick={onToggleMic}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              isMicActive
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Acoustic Microphone Pitch Detection"
          >
            {isMicActive ? <Mic className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>

          {/* Roland LX-9 Bluetooth */}
          <button
            onClick={onOpenBluetoothModal}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              isConnectedLX9
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Roland LX-9 Bluetooth & MIDI"
          >
            <Bluetooth className={`w-3.5 h-3.5 ${isConnectedLX9 ? 'animate-pulse text-blue-400' : ''}`} />
          </button>

          {/* Settings Drawer Toggle */}
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className={`p-2 rounded-xl border transition-all ${
              showSettingsDrawer ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Practice Lab Settings Drawer */}
      {showSettingsDrawer && (
        <div className="p-3.5 bg-zinc-950 border-t border-zinc-800/80 space-y-3 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Row 1: Tempo Control */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-zinc-200">{t.tempo}:</span>
              <span className="font-mono text-amber-400 font-bold">{Math.round(playbackRate * 100)}%</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="range"
                min="0.25"
                max="1.3"
                step="0.05"
                value={playbackRate}
                onChange={(e) => onRateChange(parseFloat(e.target.value))}
                className="w-full sm:w-36 accent-amber-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
              />

              <div className="flex gap-1">
                {[0.5, 0.75, 1.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => onRateChange(rate)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      Math.abs(playbackRate - rate) < 0.02
                        ? 'bg-amber-500 text-zinc-950 border-amber-500 font-bold'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {Math.round(rate * 100)}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Measure Looper & Auto-Ramp */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleLoop}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                  isLooping
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>{t.loopMeasures}</span>
              </button>

              {isLooping && (
                <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-300">
                  <input
                    type="number"
                    min="1"
                    max={loopRange[1]}
                    value={loopRange[0]}
                    onChange={(e) => onLoopRangeChange([parseInt(e.target.value, 10) || 1, loopRange[1]])}
                    className="w-12 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-center text-amber-400 font-bold"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    min={loopRange[0]}
                    max="300"
                    value={loopRange[1]}
                    onChange={(e) => onLoopRangeChange([loopRange[0], parseInt(e.target.value, 10) || loopRange[0]])}
                    className="w-12 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-center text-amber-400 font-bold"
                  />
                </div>
              )}
            </div>

            {isLooping && (
              <button
                onClick={onToggleTempoRamp}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                  tempoRampEnabled
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.speedRamp}</span>
              </button>
            )}
          </div>

          {/* Row 3: Acoustic Noise, Language, & Importer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
            {/* Mechanical Noise Toggle */}
            <button
              onClick={onToggleMechanicalNoise}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] ${
                mechanicalNoiseEnabled
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{t.mechanicalNoise}: {mechanicalNoiseEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Language Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-xl">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
                className="bg-transparent text-zinc-200 text-[11px] focus:outline-none cursor-pointer"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code} className="bg-zinc-900 text-zinc-200">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Camera View */}
            <button
              onClick={onWaterfallCameraToggle}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-zinc-100 text-[11px]"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.cameraAngle}: <strong className="text-zinc-100">{waterfallCamera.toUpperCase()}</strong></span>
            </button>

            {/* Import Custom Score */}
            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl text-amber-400 hover:text-amber-300 text-[11px] font-medium"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t.importScore}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
