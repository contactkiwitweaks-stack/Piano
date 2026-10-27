import React, { useState } from 'react'
import {
  PianoAudioEngine,
  type ReverbMode,
  type VelocityCurveType,
} from '../audio/PianoAudioEngine'
import type { LanguageCode } from '../i18n/translations'
import {
  Sliders,
  Volume2,
  Sparkles,
  X,
  Music,
  Activity,
  Check,
} from 'lucide-react'

interface AudioSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  language: LanguageCode
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const engine = PianoAudioEngine.getInstance()
  const [reverb, setReverb] = useState<ReverbMode>(engine.getReverbMode())
  const [velocityCurve, setVelocityCurve] = useState<VelocityCurveType>(
    engine.getVelocityCurve()
  )
  const [metronomeVol, setMetronomeVol] = useState<number>(
    engine.getMetronomeVolume()
  )

  if (!isOpen) return null

  const handleReverbChange = (mode: ReverbMode) => {
    setReverb(mode)
    engine.setReverbMode(mode)
  }

  const handleVelocityCurveChange = (curve: VelocityCurveType) => {
    setVelocityCurve(curve)
    engine.setVelocityCurve(curve)
  }

  const handleMetronomeVolChange = (val: number) => {
    setMetronomeVol(val)
    engine.setMetronomeVolume(val)
  }

  const handleTestClick = (isDown: boolean) => {
    engine.unlockAudio()
    engine.playMetronomeClick(isDown)
  }

  const handleTestNote = (midi: number) => {
    engine.unlockAudio()
    engine.noteOn(midi, 88)
    setTimeout(() => {
      engine.noteOff(midi)
    }, 450)
  }

  const titles = {
    title: {
      en: 'Acoustics & Soundboard Settings',
      de: 'Akustik & Klang-Einstellungen',
      fr: 'Paramètres Acoustiques & Son',
      ja: '音響・響板セッティング',
      zh: '声学与音板设置',
    },
    subtitle: {
      en: 'Yamaha C5 multi-sampled concert grand with procedural impulse reverb.',
      de: 'Yamaha C5 Konzertflügel mit Raumakustik-Simulation.',
      fr: 'Grand piano de concert Yamaha C5 avec réverbération acoustique.',
      ja: 'Yamaha C5 コンサートグランドと空間リバーブ設定。',
      zh: '雅马哈 C5 音乐会大三角钢琴空间声学仿真。',
    },
    reverb: {
      en: 'Concert Hall Reverb Ambience',
      de: 'Konzertsaal-Reverb (Hall)',
      fr: 'Réverbération Salle de Concert',
      ja: '空間リバーブ設定',
      zh: '音乐厅声学混响',
    },
    velocity: {
      en: 'Keyboard Touch Velocity Curve',
      de: 'Tasten-Anschlagsdynamik',
      fr: 'Courbe de Vélocité Clavier',
      ja: 'タッチ感度・ベロシティ曲線',
      zh: '键盘触键力度曲线',
    },
    metronome: {
      en: 'Metronome Click Volume',
      de: 'Metronom-Lautstärke',
      fr: 'Volume du Métronome',
      ja: 'メトロノーム音量',
      zh: '节拍器滴答音量',
    },
  }

  const reverbOptions: { id: ReverbMode; label: string; desc: string }[] = [
    {
      id: 'off',
      label: 'Dry Studio',
      desc: language === 'de' ? 'Direkter, trockener Klang ohne Raum' : 'Direct dry sound without room reflections',
    },
    {
      id: 'studio',
      label: 'Intimate Studio',
      desc: language === 'de' ? 'Kompakte Kammermusik-Akustik (0.9s)' : 'Intimate acoustic chamber (0.9s decay)',
    },
    {
      id: 'hall',
      label: 'Concert Hall',
      desc: language === 'de' ? 'Ausgewogene, warme Saalakustik (2.2s)' : 'Balanced concert hall stage warmth (2.2s)',
    },
    {
      id: 'cathedral',
      label: 'Grand Cathedral',
      desc: language === 'de' ? 'Monumentale Kathedralen-Weite (3.8s)' : 'Monumental expansive sanctuary reverb (3.8s)',
    },
  ]

  const velocityOptions: { id: VelocityCurveType; label: string; desc: string }[] = [
    {
      id: 'light',
      label: 'Light (Soft Touch)',
      desc: language === 'de' ? 'Leichter Anschlag für Synth- und ungewichtete Tastaturen' : 'Easier forte response for unweighted/semi-weighted keys',
    },
    {
      id: 'normal',
      label: 'Normal (Linear Balanced)',
      desc: language === 'de' ? 'Standard Yamaha & Roland Konzertkurve' : 'Standard acoustic concert grand response',
    },
    {
      id: 'heavy',
      label: 'Heavy (Concert Action)',
      desc: language === 'de' ? 'Echte schwere Hammermechanik (Roland LX-9 / Steinway)' : 'Demands genuine arm weight for full dynamic range (Roland LX-9)',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                {titles.title[language] || titles.title.en}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {titles.subtitle[language] || titles.subtitle.en}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
          {/* 1. Reverb Ambience */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{titles.reverb[language] || titles.reverb.en}</span>
              </label>
              <button
                onClick={() => handleTestNote(60)}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-white/5"
              >
                <Music className="w-3 h-3" />
                <span>Test C4</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {reverbOptions.map((opt) => {
                const isSelected = reverb === opt.id
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleReverbChange(opt.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-1 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'bg-zinc-950/60 hover:bg-zinc-800/60 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-zinc-200'}`}>
                        {opt.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <p className="text-[10px] text-zinc-400">{opt.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 2. Touch Velocity Curve */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-orange-400" />
              <span>{titles.velocity[language] || titles.velocity.en}</span>
            </label>

            <div className="space-y-2">
              {velocityOptions.map((opt) => {
                const isSelected = velocityCurve === opt.id
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleVelocityCurveChange(opt.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-orange-500/15 border-orange-500/60 shadow-[0_0_12px_rgba(249,115,22,0.2)]'
                        : 'bg-zinc-950/60 hover:bg-zinc-800/60 border-white/5'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className={`text-xs font-bold ${isSelected ? 'text-orange-300' : 'text-zinc-200'}`}>
                        {opt.label}
                      </span>
                      <p className="text-[10px] text-zinc-400">{opt.desc}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-orange-400 flex-shrink-0" />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 3. Metronome Click Volume */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{titles.metronome[language] || titles.metronome.en}</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTestClick(true)}
                  className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-lg border border-white/10"
                >
                  Beat 1
                </button>
                <button
                  onClick={() => handleTestClick(false)}
                  className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-lg border border-white/10"
                >
                  Beat 2
                </button>
                <span className="font-mono text-xs text-emerald-400 ml-1">
                  {Math.round(metronomeVol * 100)}%
                </span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={metronomeVol}
              onChange={(e) => handleMetronomeVolChange(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-colors"
          >
            {language === 'de' ? 'Fertig' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  )
}
