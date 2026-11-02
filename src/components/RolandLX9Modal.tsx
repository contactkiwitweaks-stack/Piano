import React, { useState, useEffect } from 'react'
import { MidiManager } from '../midi/MidiManager'
import { PianoAudioEngine } from '../audio/PianoAudioEngine'
import { AcousticNoteRecognizer } from '../engine/AcousticNoteRecognizer'
import { type LanguageCode } from '../i18n/translations'
import {
  Bluetooth,
  Cable,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  Activity,
  Volume2,
  Piano,
  Mic,
  MicOff,
} from 'lucide-react'

interface RolandLX9ModalProps {
  isOpen: boolean
  onClose: () => void
  isConnected: boolean
  deviceName: string
  connectionType: 'ble' | 'usb' | 'simulated' | 'none'
  damperPedal: number
  latencyMs: number
  language: LanguageCode
}

export const RolandLX9Modal: React.FC<RolandLX9ModalProps> = ({
  isOpen,
  onClose,
  isConnected,
  deviceName,
  connectionType,
  damperPedal,
  latencyMs,
  language,
}) => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [lastNote, setLastNote] = useState<{ midi: number; name: string; velocity: number } | null>(null)
  const [pressedKeys, setPressedKeys] = useState<Set<number>>(new Set())
  const [softPedalDepth, setSoftPedalDepth] = useState<number>(0)
  const [isMicListening, setIsMicListening] = useState<boolean>(() => AcousticNoteRecognizer.getInstance().isListening)

  const handleToggleMicModal = async () => {
    const recognizer = AcousticNoteRecognizer.getInstance()
    if (recognizer.isListening) {
      recognizer.stopListening()
      setIsMicListening(false)
    } else {
      const ok = await recognizer.startListening()
      setIsMicListening(ok)
    }
  }

  // Subscribe to live MIDI events when modal is open for real-time visual diagnostics
  useEffect(() => {
    if (!isOpen) return

    const midiMgr = MidiManager.getInstance()
    const unsubscribe = midiMgr.subscribe(
      (midi, velocity) => {
        const octave = Math.floor(midi / 12) - 1
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        const name = `${notes[midi % 12]}${octave}`
        setLastNote({ midi, name, velocity })
        setPressedKeys((prev) => new Set(prev).add(midi))
      },
      (midi) => {
        setPressedKeys((prev) => {
          const next = new Set(prev)
          next.delete(midi)
          return next
        })
      },
      () => {},
      (state) => {
        setSoftPedalDepth(state.softPedal || 0)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConnectBluetooth = async () => {
    setIsConnecting(true)
    setErrorMsg(null)
    try {
      const ok = await MidiManager.getInstance().connectBluetoothMidi()
      if (!ok) {
        setErrorMsg(
          language === 'de'
            ? 'Kein Bluetooth-Gerät gefunden. Bitte prüfe, ob Bluetooth am Piano aktiv ist.'
            : 'Could not pair Bluetooth MIDI device. Ensure Bluetooth is ON on your piano.'
        )
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Bluetooth connection failed')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleConnectUsb = async () => {
    setIsConnecting(true)
    setErrorMsg(null)
    try {
      const ok = await MidiManager.getInstance().connectWebMidi()
      if (!ok) {
        setErrorMsg(
          language === 'de'
            ? 'Kein USB-MIDI-Eingang erkannt. Schließe dein Piano per USB-C/Lightning an.'
            : 'No USB MIDI devices detected. Connect your piano via USB-C or Lightning cable.'
        )
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'USB connection failed')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleEnableSimulator = () => {
    MidiManager.getInstance().enableSimulator()
    setErrorMsg(null)
  }

  const handleSimulateNote = (midi: number) => {
    PianoAudioEngine.getInstance().unlockAudio()
    PianoAudioEngine.getInstance().noteOn(midi, 95)
    MidiManager.getInstance().simulateNoteOn(midi, 95)
    setTimeout(() => {
      PianoAudioEngine.getInstance().noteOff(midi)
      MidiManager.getInstance().simulateNoteOff(midi)
    }, 450)
  }

  const playTestChord = () => {
    PianoAudioEngine.getInstance().unlockAudio()
    // Concert Eb Major chord
    ;[51, 58, 63, 67, 70].forEach((m, idx) => {
      setTimeout(() => {
        PianoAudioEngine.getInstance().noteOn(m, 88)
        setTimeout(() => PianoAudioEngine.getInstance().noteOff(m), 1200)
      }, idx * 60)
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0e0f14] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 select-none max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-zinc-950/90 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-sm">
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {language === 'de' ? 'Bluetooth & USB-MIDI Studio' : 'Universal Bluetooth & USB MIDI Studio'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Roland, Yamaha, Kawai, Casio, Donner, Korg & Apple CoreMIDI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto">
          {/* Connection Status Badge */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${
              isConnected
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-zinc-950/60 border-white/10 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-3">
              {isConnected ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500">
                  <XCircle className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="font-extrabold text-sm text-white">
                  {isConnected ? deviceName : (language === 'de' ? 'Warte auf Verbindung...' : 'Waiting for connection...')}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  {isConnected
                    ? `Typ: ${connectionType.toUpperCase()} • Latenz: ~${latencyMs}ms • CoreMIDI Aktiv`
                    : (language === 'de' ? 'Piano per Kabel oder Bluetooth koppeln' : 'Connect piano via cable or Bluetooth')}
                </div>
              </div>
            </div>

            {isConnected && (
              <button
                onClick={() => MidiManager.getInstance().disconnect()}
                className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 rounded-xl text-[11px] font-bold active:scale-95 transition-all"
              >
                {language === 'de' ? 'Trennen' : 'Disconnect'}
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-950/50 border border-red-500/40 text-red-300 text-[11px] leading-tight animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons: Bluetooth & USB */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleConnectBluetooth}
              disabled={isConnecting}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border border-blue-500/40 hover:border-blue-400 text-blue-300 transition-all shadow-md active:scale-98 group"
            >
              <div className="relative">
                <Bluetooth className={`w-7 h-7 text-blue-400 ${isConnecting ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                {isConnecting && (
                  <span className="absolute -inset-1 rounded-full border border-blue-400/40 animate-ping" />
                )}
              </div>
              <div className="text-center">
                <div className="font-extrabold text-xs text-white">
                  {language === 'de' ? 'Bluetooth MIDI Koppeln' : 'Pair Bluetooth MIDI'}
                </div>
                <div className="text-[9.5px] text-zinc-500 mt-0.5">
                  {language === 'de' ? 'Drahtlos (BLE MIDI)' : 'Wireless BLE MIDI'}
                </div>
              </div>
            </button>

            <button
              onClick={handleConnectUsb}
              disabled={isConnecting}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border border-amber-500/40 hover:border-amber-400 text-amber-300 transition-all shadow-md active:scale-98 group"
            >
              <Cable className="w-7 h-7 text-amber-400 group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <div className="font-extrabold text-xs text-white">
                  {language === 'de' ? 'USB-C / Lightning Kabel' : 'USB-C / Cable'}
                </div>
                <div className="text-[9.5px] text-zinc-500 mt-0.5">
                  {language === 'de' ? '0ms Latenz (CoreMIDI)' : '0ms Latency Plug & Play'}
                </div>
              </div>
            </button>
          </div>

          {/* Live Real-Time MIDI Key & Velocity Diagnostic Monitor */}
          <div className="p-3.5 bg-zinc-950 rounded-2xl border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-zinc-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>{language === 'de' ? 'Echtzeit-Tasten & Anschlag-Monitor' : 'Live Key & Velocity Monitor'}</span>
              </span>
              <button
                onClick={playTestChord}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-300 border border-white/10 transition-colors"
                title="Play Concert Chord Sound Test"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Sound Test</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/80 border border-white/5 font-mono text-[11px]">
              {lastNote ? (
                <div className="flex items-center gap-4 text-zinc-200">
                  <span>
                    Taste: <strong className="text-amber-400 text-xs">{lastNote.name}</strong> (MIDI {lastNote.midi})
                  </span>
                  <span>
                    Velocity: <strong className="text-sky-400">{lastNote.velocity}</strong> / 127
                  </span>
                </div>
              ) : (
                <span className="text-zinc-500 italic">
                  {language === 'de' ? 'Drücke eine Taste am Piano...' : 'Press any key on your piano...'}
                </span>
              )}
              <span className={`w-2.5 h-2.5 rounded-full ${pressedKeys.size > 0 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-zinc-700'}`} />
            </div>

            {/* Continuous Dual Pedal Monitors */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Damper CC64 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400 font-bold">
                  <span>Dämpfer (CC64)</span>
                  <span className="font-mono text-amber-400">{damperPedal} / 127</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-75"
                    style={{ width: `${Math.round((damperPedal / 127) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Una Corda CC67 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400 font-bold">
                  <span>Una Corda (CC67)</span>
                  <span className="font-mono text-sky-400">{softPedalDepth} / 127</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-teal-300 h-full transition-all duration-75"
                    style={{ width: `${Math.round((softPedalDepth / 127) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* iOS & Mobile Pairing Guide */}
          <div className="p-3.5 bg-blue-950/30 rounded-2xl border border-blue-500/30 space-y-2 text-[11px] leading-relaxed">
            <div className="flex items-center gap-1.5 text-blue-300 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>{language === 'de' ? 'iPhone & iPad Anleitung (CoreMIDI)' : 'iOS Connection Guide'}</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 pl-1 text-[11px] text-zinc-300">
              <li>
                <strong className="text-white">USB-C / Lightning Kabel (Empfohlen):</strong> Direkt an dein iPhone anschließen. Native CoreMIDI-Erkennung erkennt dein Piano sofort mit 0ms Latenz ohne Treiber!
              </li>
              <li>
                <strong className="text-white">Drahtloses Bluetooth:</strong> Schalte Bluetooth an deinem Digitalpiano ein. Auf iOS wird Bluetooth MIDI über CoreMIDI gekoppelt (einmalig in *iOS Einstellungen* oder in einer kostenlosen App wie *GarageBand* koppeln — Virtuoso Piano empfängt es danach sofort!).
              </li>
            </ul>
          </div>

          {/* Acoustic Piano Microphone Recognition (Aubio / Stepkar2004 polyphonic note & chord listening) */}
          <div className="p-3.5 bg-zinc-950 rounded-2xl border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-emerald-400" />
                <span>Akustisches Klavier (Mikrofon-Erkennung)</span>
              </span>
              <button
                onClick={handleToggleMicModal}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 active:scale-95 ${
                  isMicListening
                    ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_12px_rgba(16,185,129,0.5)] font-black'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10'
                }`}
              >
                {isMicListening ? <Mic className="w-3.5 h-3.5 animate-pulse" /> : <MicOff className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{isMicListening ? 'Aktiv (Hört zu...)' : 'Mikrofon Aktivieren'}</span>
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 leading-snug">
              Ideal für normale Klaviere & Flügel ohne Kabel oder Bluetooth: Virtuoso hört Akkorde und Einzeltöne in Echtzeit über das iPhone-Mikrofon und synchronisiert sie direkt mit Übe- und Wettkampf-Modus!
            </p>
          </div>

          {/* Virtual Simulator Mode */}
          <div className="p-3.5 bg-zinc-950 rounded-2xl border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Piano className="w-4 h-4 text-amber-400" />
                <span>Virtueller Simulator (Testen ohne Piano)</span>
              </span>
              <button
                onClick={handleEnableSimulator}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg font-black text-[10px] transition-colors"
              >
                Simulator Aktivieren
              </button>
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => handleSimulateNote(48)}
                className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[10px] font-mono text-zinc-200 border border-white/5 active:scale-95 transition-all"
              >
                C3 (Bass)
              </button>
              <button
                onClick={() => handleSimulateNote(60)}
                className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[10px] font-mono text-zinc-200 border border-white/5 active:scale-95 transition-all"
              >
                C4 (Middle)
              </button>
              <button
                onClick={() => handleSimulateNote(72)}
                className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[10px] font-mono text-zinc-200 border border-white/5 active:scale-95 transition-all"
              >
                C5 (Treble)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
