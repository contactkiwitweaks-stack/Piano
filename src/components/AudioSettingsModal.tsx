import React, { useState, useEffect } from 'react'
import {
  PianoAudioEngine,
  type ReverbMode,
  type VelocityCurveType,
  type EngineTelemetry,
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
  Cpu,
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
  const [mechanicalNoise, setMechanicalNoise] = useState<boolean>(
    engine.isMechanicalNoiseEnabled()
  )
  const [tuningHz, setTuningHz] = useState<number>(
    engine.getMasterTuning()
  )
  const [telemetry, setTelemetry] = useState<EngineTelemetry>(() => engine.getTelemetry())

  useEffect(() => {
    if (!isOpen) return
    return engine.subscribeTelemetry((t) => setTelemetry(t))
  }, [isOpen, engine])

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

  const handleToggleMechanical = () => {
    const next = !mechanicalNoise
    setMechanicalNoise(next)
    engine.toggleMechanicalNoise(next)
  }

  const handleTuningChange = (hz: number) => {
    setTuningHz(hz)
    engine.setMasterTuning(hz)
  }

  const handleTestDamperNoise = () => {
    engine.unlockAudio()
    engine.playDamperLiftNoise(100)
  }

  const handleTestClick = (isDown: boolean) => {
    engine.unlockAudio()
    engine.playMetronomeClick(isDown)
  }

  const handleTestNote = (midi: number) => {
    engine.unlockAudio()
    engine.noteOn(midi, 90)
    setTimeout(() => {
      engine.noteOff(midi)
    }, 500)
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
      en: 'Steinway Model B (Splendid Grand Piano) with Vienna Musikverein Concert Hall IR Reverb.',
      de: 'Steinway Model B Flügel mit Wiener Musikvereinssaal-Faltungshall.',
      fr: 'Piano à queue Steinway Model B avec réverbération à convolution Musikverein.',
      ja: 'Steinway Model B グランドピアノ & ウィーン楽友協会ホール音響インパルス応答。',
      zh: '施坦威 B 型大三角钢琴与维也纳金色大厅真实脉冲响应卷积混响。',
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
      label: 'Heavy (Concert Grand Weight)',
      desc: language === 'de' ? 'Schwerer Anschlag für gewichtete Hammerklaviere (Roland PHA-50 / Hybrid Grand)' : 'Max dynamic range for hammer action keyboards (Roland PHA-50 / Hybrid Grand)',
    },
  ]

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[88dvh]"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-zinc-950/90 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 flex-shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {titles.title[language] || titles.title.en}
              </h3>
              <p className="text-[11px] text-zinc-400 truncate">
                {titles.subtitle[language] || titles.subtitle.en}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition-colors flex-shrink-0 ml-2"
            aria-label="Close acoustics settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 overflow-y-auto touch-pan-y space-y-6 flex-1 min-h-0">
          {/* REAL ENGINE TELEMETRY CARD */}
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  {language === 'de' ? 'Klang-Engine Live-Status' : 'Audio Engine Live Status'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                    telemetry.isMainEngineActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      telemetry.isMainEngineActive ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  {telemetry.isMainEngineActive ? 'Steinway Sample Active' : 'Loading Engine...'}
                </span>
                <button
                  onClick={() => handleTestNote(60)}
                  className="text-[11px] text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 rounded-lg border border-amber-500/40 transition-colors"
                  title="Test Middle C4 Steinway Sample"
                >
                  <Music className="w-3 h-3 text-amber-400" />
                  <span>Test C4</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
                <div className="text-zinc-500 text-[10px] uppercase">Engine Model</div>
                <div className="font-semibold text-zinc-200 truncate">{telemetry.engineName}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
                <div className="text-zinc-500 text-[10px] uppercase">Decoded Samples</div>
                <div className="font-semibold text-amber-400">
                  {telemetry.loadedSamples} / {telemetry.totalSamples} layers in RAM
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
                <div className="text-zinc-500 text-[10px] uppercase">Impulse Response</div>
                <div className="font-semibold text-zinc-300 truncate">
                  {telemetry.isIrLoaded ? 'Vienna Musikverein Active' : 'Loading IR...'}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
                <div className="text-zinc-500 text-[10px] uppercase">AudioContext / DAC</div>
                <div className="font-semibold text-emerald-400 truncate">
                  {telemetry.audioContextState.toUpperCase()} • {telemetry.sampleRate} Hz
                </div>
              </div>
            </div>

            {/* Live Key Strike Telemetry */}
            <div className="p-2 rounded-xl bg-zinc-900/80 border border-white/5 flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-500">Live Strike:</span>
              <span className="text-amber-300 truncate max-w-[70%] font-semibold text-right">
                {telemetry.lastTriggeredNote}
              </span>
            </div>
          </div>

          {/* 1. Reverb Ambience */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{titles.reverb[language] || titles.reverb.en}</span>
              </label>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {velocityOptions.map((opt) => {
                const isSelected = velocityCurve === opt.id
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleVelocityCurveChange(opt.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-1 ${
                      isSelected
                        ? 'bg-orange-500/15 border-orange-500/60 shadow-[0_0_12px_rgba(249,115,22,0.2)]'
                        : 'bg-zinc-950/60 hover:bg-zinc-800/60 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-orange-300' : 'text-zinc-200'}`}>
                        {opt.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-orange-400" />}
                    </div>
                    <p className="text-[10px] text-zinc-400 line-clamp-2">{opt.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 3. Metronome Volume Slider */}
          <div className="space-y-3 pt-1 border-t border-zinc-800/80">
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

          {/* 4. Acoustic Damper & Key Mechanical Noise */}
          <div className="space-y-3 pt-1 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-200">
                  {language === 'de' ? 'Dämpfer- & Mechanik-Akustik' : 'Acoustic Damper & Felt Noise'}
                </span>
                <p className="text-[10px] text-zinc-400">
                  {language === 'de'
                    ? 'Simuliert das echte Heben der 88 Filzdämpfer (Klangbrett-Atem) und Tasten-Rückfall'
                    : 'Authentic 88-damper felt lift soundboard breath and key release thud'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestDamperNoise}
                  className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-amber-300 px-2 py-1 rounded-lg border border-white/10 font-medium"
                >
                  Test Whoosh
                </button>
                <button
                  onClick={handleToggleMechanical}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    mechanicalNoise
                      ? 'bg-amber-500 text-zinc-950 font-extrabold shadow-sm'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {mechanicalNoise ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* 5. Master Concert Tuning */}
          <div className="space-y-3 pt-1 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-200">
                  {language === 'de' ? 'Konzertstimmung (Kammerton A4)' : 'Concert Pitch Master Tuning (A4)'}
                </span>
                <p className="text-[10px] text-zinc-400">
                  {language === 'de'
                    ? '440 Hz (Standard) oder 442 Hz (Wiener/Berliner Philharmoniker Glanz)'
                    : '440 Hz (Standard) or 442 Hz (European Symphony & Philharmonic brilliance)'}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {[440, 442].map((hz) => (
                  <button
                    key={hz}
                    onClick={() => handleTuningChange(hz)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                      tuningHz === hz
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {hz} Hz
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 pb-[max(0.9rem,env(safe-area-inset-bottom))] bg-zinc-950 border-t border-zinc-800 flex justify-end flex-shrink-0">
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
