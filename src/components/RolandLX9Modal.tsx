import React, { useState } from 'react'
import { MidiManager } from '../midi/MidiManager'
import { PianoAudioEngine } from '../audio/PianoAudioEngine'
import { translations, type LanguageCode } from '../i18n/translations'
import {
  Bluetooth,
  Cable,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  Sliders,
  HelpCircle,
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
  const [simPedalVal, setSimPedalVal] = useState(0)

  const t = translations[language].rolandModal

  if (!isOpen) return null

  const handleConnectBluetooth = async () => {
    setIsConnecting(true)
    setErrorMsg(null)
    try {
      const ok = await MidiManager.getInstance().connectBluetoothMidi()
      if (!ok) {
        setErrorMsg(t.errorBle)
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || t.errorBle)
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
        setErrorMsg(t.errorUsb)
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || t.errorUsb)
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

  const handleSimulatePedalChange = (val: number) => {
    setSimPedalVal(val)
    PianoAudioEngine.getInstance().setDamperPedal(val)
    MidiManager.getInstance().simulatePedal(val)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Bluetooth className="w-4 h-4" />
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

        {/* Content */}
        <div className="p-4 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Status Badge */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              isConnected
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {isConnected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-zinc-500" />
              )}
              <div>
                <div className="font-semibold text-zinc-200">
                  {isConnected ? deviceName : t.waitingConnection}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  {isConnected
                    ? `Protocol: ${connectionType.toUpperCase()} • Latency ~${latencyMs}ms`
                    : t.waitingConnection}
                </div>
              </div>
            </div>

            {isConnected && (
              <button
                onClick={() => MidiManager.getInstance().disconnect()}
                className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 rounded-lg text-[10px] font-semibold"
              >
                {t.disconnect}
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-500/40 text-red-300 text-[11px] leading-tight">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleConnectBluetooth}
              disabled={isConnecting}
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-blue-500/40 text-blue-300 transition-all active:scale-98"
            >
              <Bluetooth className={`w-6 h-6 ${isConnecting ? 'animate-spin' : ''}`} />
              <span className="font-semibold text-xs">{t.pairBle}</span>
              <span className="text-[9px] text-zinc-500 text-center">{t.pairBleSub}</span>
            </button>

            <button
              onClick={handleConnectUsb}
              disabled={isConnecting}
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 transition-all active:scale-98"
            >
              <Cable className="w-6 h-6 text-amber-400" />
              <span className="font-semibold text-xs">{t.connectUsb}</span>
              <span className="text-[9px] text-zinc-500 text-center">{t.connectUsbSub}</span>
            </button>
          </div>

          {/* Continuous Damper Pedal Calibration Bar */}
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                {t.damperDepth}
              </span>
              <span className="font-mono text-amber-400 font-bold text-xs">
                {damperPedal} / 127 ({Math.round((damperPedal / 127) * 100)}%)
              </span>
            </div>

            <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden flex">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-75"
                style={{ width: `${Math.round((damperPedal / 127) * 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-[9px] font-mono text-zinc-500">
              <span>{t.damped}</span>
              <span>{t.halfPedalRange}</span>
              <span>{t.fullSustainRange}</span>
            </div>
          </div>

          {/* Virtual Simulator Mode */}
          <div className="p-3 bg-zinc-950/80 rounded-xl border border-amber-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {t.virtualSimulator}
              </span>
              <button
                onClick={handleEnableSimulator}
                className="px-2 py-0.5 bg-amber-500 text-zinc-950 rounded font-bold text-[10px]"
              >
                {t.enableSimulator}
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 leading-tight">
              {t.simulatorDesc}
            </p>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>{t.simulatePedal}:</span>
                <span className="font-mono text-amber-400 font-bold">{simPedalVal}</span>
              </div>
              <input
                type="range"
                min="0"
                max="127"
                value={simPedalVal}
                onChange={(e) => handleSimulatePedalChange(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-zinc-400">{t.testChords}:</span>
              <button
                onClick={() => handleSimulateNote(43)}
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] font-mono text-zinc-200"
              >
                G2 (Bass)
              </button>
              <button
                onClick={() => handleSimulateNote(60)}
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] font-mono text-zinc-200"
              >
                C4 (Mid)
              </button>
              <button
                onClick={() => handleSimulateNote(75)}
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] font-mono text-zinc-200"
              >
                Eb5 (Cantabile)
              </button>
            </div>
          </div>

          {/* iOS Safari Notice */}
          <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-500/30 space-y-1.5 text-[11px] leading-snug">
            <div className="flex items-center gap-1.5 text-blue-300 font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Playing on iPhone / iPad?</span>
            </div>
            <p className="text-[10px] text-zinc-300">
              Apple Safari restricts Web Bluetooth inside standard browser tabs. For immediate zero-setup practice:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[10px] text-zinc-400">
              <li><strong className="text-zinc-200">Acoustic & Vocal Recognition</strong>: Tap the Mic button on the top bar! It listens to your piano speakers or vocal humming with instant pitch recognition.</li>
              <li><strong className="text-zinc-200">Direct Bluetooth on iOS</strong>: Open this site in the free <span className="text-blue-300 font-semibold">WebBLE</span> or <span className="text-blue-300 font-semibold">Bluefy</span> app from the App Store for hardware Bluetooth MIDI.</li>
              <li><strong className="text-zinc-200">Touch & Simulator</strong>: Use the on-screen keys or simulator bar.</li>
            </ul>
          </div>

          {/* Roland LX-9 Pairing Steps */}
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1.5 text-zinc-400 text-[11px] leading-snug">
            <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-xs">
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.pairingStepsTitle}</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-[10px]">
              <li>{t.step1}</li>
              <li>{t.step2}</li>
              <li>{t.step3}</li>
              <li>{t.step4}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
