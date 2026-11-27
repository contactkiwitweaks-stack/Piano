// Roland LX-9 Bluetooth MIDI (BLE) & Web MIDI Manager
// Captures attack velocity, Note Off release velocity, millisecond key hold depth,
// and continuous CC64 Damper / CC67 Una Corda telemetry for the Conservatory Piano Teacher.

import type { MidiInputState } from '../types/music'
import { PianoAudioEngine } from '../audio/PianoAudioEngine'

export type MidiEventOrigin = 'hardware-ble' | 'hardware-usb' | 'simulated' | 'acoustic-mic'

type NoteCallback = (midi: number, velocity: number, origin?: MidiEventOrigin) => void
type NoteOffCallback = (midi: number, releaseVelocity?: number, holdDurationMs?: number, origin?: MidiEventOrigin) => void
type PedalCallback = (depth: number, origin?: MidiEventOrigin) => void
type SoftPedalCallback = (depth: number, origin?: MidiEventOrigin) => void
type StateCallback = (state: MidiInputState) => void

// Roland / Apple Bluetooth LE MIDI UUIDs
export const BLE_MIDI_SERVICE_UUID = '03b80e5a-ede8-4b33-a020-00810d8c8fd3'
export const BLE_MIDI_CHARACTERISTIC_UUID = '7772e5db-3868-4112-a1a9-f2669d106bf3'

interface GenericMidiInput {
  id: string
  name?: string
  onmidimessage: ((event: { data: Uint8Array }) => void) | null
}

interface GenericMidiAccess {
  inputs: {
    values: () => IterableIterator<GenericMidiInput>
  }
  onstatechange: ((event: { port: { id: string; type: string; state: string } }) => void) | null
}

interface GenericBleDevice {
  name?: string
  gatt?: {
    connected: boolean
    connect: () => Promise<GenericGattServer>
    disconnect: () => void
  }
}

interface GenericGattServer {
  getPrimaryService: (uuid: string) => Promise<GenericGattService>
}

interface GenericGattService {
  getCharacteristic: (uuid: string) => Promise<GenericGattCharacteristic>
}

interface GenericGattCharacteristic {
  value?: DataView
  startNotifications: () => Promise<GenericGattCharacteristic>
  addEventListener: (type: string, listener: (event: Event) => void) => void
}

export class MidiManager {
  private static instance: MidiManager
  private state: MidiInputState = {
    activeNotes: new Map(),
    damperPedal: 0,
    softPedal: 0,
    sostenutoPedal: 0,
    deviceName: 'Disconnected',
    isConnected: false,
    connectionType: 'none',
    isRolandBluetooth: false,
    latencyMs: 4,
  }

  private noteOnListeners: Set<NoteCallback> = new Set()
  private noteOffListeners: Set<NoteOffCallback> = new Set()
  private pedalListeners: Set<PedalCallback> = new Set()
  private softPedalListeners: Set<SoftPedalCallback> = new Set()
  private stateListeners: Set<StateCallback> = new Set()

  private midiAccess: GenericMidiAccess | null = null
  private bleDevice: GenericBleDevice | null = null
  private bleCharacteristic: GenericGattCharacteristic | null = null

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('nativeMidiMessage', (e: Event) => {
        const customEv = e as CustomEvent<{ data: number[] }>
        if (customEv.detail && customEv.detail.data) {
          const origin: MidiEventOrigin = this.state.connectionType === 'ble' ? 'hardware-ble' : 'hardware-usb'
          this.processRawMidiMessage(new Uint8Array(customEv.detail.data), origin)
        }
      })

      window.addEventListener('nativeMidiDeviceConnected', (e: Event) => {
        const customEv = e as CustomEvent<{ name: string; transport?: 'ble' | 'usb' }>
        if (customEv.detail && customEv.detail.name) {
          const name = customEv.detail.name
          const lower = name.toLowerCase()
          const transport: 'ble' | 'usb' =
            customEv.detail.transport === 'ble' || lower.includes('bluetooth') || lower.includes('ble')
              ? 'ble'
              : 'usb'
          this.state.deviceName = name
          this.state.isConnected = true
          this.state.connectionType = transport
          this.state.isRolandBluetooth = transport === 'ble'
          this.notifyState()
        }
      })

      window.addEventListener('nativeMidiDeviceDisconnected', () => {
        if (this.state.connectionType !== 'simulated') {
          this.disconnect()
        }
      })
    }
  }

  public static getInstance(): MidiManager {
    if (!MidiManager.instance) {
      MidiManager.instance = new MidiManager()
    }
    return MidiManager.instance
  }

  public getState(): MidiInputState {
    return {
      ...this.state,
      activeNotes: new Map(this.state.activeNotes),
    }
  }

  /**
   * Strict hardware gate for the Conservatory Piano Teacher:
   * Returns true ONLY when actively connected via real Bluetooth MIDI (Roland LX-9 BLE MIDI).
   * Explicitly excludes microphone input, on-screen touch keys, simulator, and disconnected state.
   */
  public isRolandBluetoothConnected(): boolean {
    return this.state.isConnected && this.state.connectionType === 'ble'
  }

  public subscribe(
    onNoteOn: NoteCallback,
    onNoteOff: NoteOffCallback,
    onPedal: PedalCallback,
    onState: StateCallback,
    onSoftPedal?: SoftPedalCallback
  ): () => void {
    this.noteOnListeners.add(onNoteOn)
    this.noteOffListeners.add(onNoteOff)
    this.pedalListeners.add(onPedal)
    this.stateListeners.add(onState)
    if (onSoftPedal) {
      this.softPedalListeners.add(onSoftPedal)
    }

    return () => {
      this.noteOnListeners.delete(onNoteOn)
      this.noteOffListeners.delete(onNoteOff)
      this.pedalListeners.delete(onPedal)
      this.stateListeners.delete(onState)
      if (onSoftPedal) {
        this.softPedalListeners.delete(onSoftPedal)
      }
    }
  }

  /**
   * Opens Apple's native iOS CABTMIDICentralViewController Bluetooth MIDI picker when running inside iOS app,
   * or falls back to Web Bluetooth BLE MIDI pairing on desktop/Bluefy.
   */
  public async connectBluetoothMidi(): Promise<boolean> {
    if (typeof window !== 'undefined') {
      const wk = (window as unknown as {
        webkit?: { messageHandlers?: { openBleMidiPicker?: { postMessage: (v: unknown) => void } } }
      }).webkit
      if (wk?.messageHandlers?.openBleMidiPicker) {
        wk.messageHandlers.openBleMidiPicker.postMessage({})
        return true
      }
    }

    const nav = navigator as unknown as {
      bluetooth?: { requestDevice: (opt: object) => Promise<GenericBleDevice> }
      requestMIDIAccess?: (opt: { sysex: boolean }) => Promise<GenericMidiAccess>
    }
    if (!nav.bluetooth) {
      console.warn('Web Bluetooth API is not available natively in Mobile Safari. Bridging to Web MIDI if supported...')
      if (nav.requestMIDIAccess) {
        return await this.connectWebMidi()
      }
      return false
    }

    try {
      const lowerUuid = BLE_MIDI_SERVICE_UUID.toLowerCase()
      const upperUuid = BLE_MIDI_SERVICE_UUID.toUpperCase()

      try {
        this.bleDevice = await nav.bluetooth.requestDevice({
          filters: [{ services: [lowerUuid] }],
          optionalServices: [lowerUuid, upperUuid],
        })
      } catch (err: unknown) {
        const errMsg = (err as Error)?.message || ''
        if (errMsg.toLowerCase().includes('cancel') || errMsg.toLowerCase().includes('abort')) {
          return false
        }
        try {
          this.bleDevice = await nav.bluetooth.requestDevice({
            filters: [{ services: [upperUuid] }],
            optionalServices: [lowerUuid, upperUuid],
          })
        } catch {
          this.bleDevice = await nav.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [lowerUuid, upperUuid],
          })
        }
      }

      if (!this.bleDevice || !this.bleDevice.gatt) return false

      const server = await this.bleDevice.gatt.connect()
      let service: GenericGattService
      try {
        service = await server.getPrimaryService(lowerUuid)
      } catch {
        service = await server.getPrimaryService(upperUuid)
      }

      let characteristic: GenericGattCharacteristic
      try {
        characteristic = await service.getCharacteristic(BLE_MIDI_CHARACTERISTIC_UUID.toLowerCase())
      } catch {
        characteristic = await service.getCharacteristic(BLE_MIDI_CHARACTERISTIC_UUID.toUpperCase())
      }
      this.bleCharacteristic = characteristic

      await this.bleCharacteristic.startNotifications()
      const onValChanged = (event: Event) => {
        const target = event.target as unknown as { value?: DataView }
        const val = target?.value || this.bleCharacteristic?.value
        if (val) {
          this.parseBleMidiPacket(val)
        }
      }
      this.bleCharacteristic.addEventListener('characteristicvaluechanged', onValChanged)
      ;(this.bleCharacteristic as unknown as { oncharacteristicvaluechanged?: (event: Event) => void }).oncharacteristicvaluechanged = onValChanged

      this.state.deviceName = this.bleDevice.name || 'Roland LX-9 (BLE MIDI)'
      this.state.isConnected = true
      this.state.connectionType = 'ble'
      this.state.isRolandBluetooth = true
      this.notifyState()

      return true
    } catch (err) {
      console.error('Failed to connect Bluetooth MIDI:', err)
      return false
    }
  }

  /**
   * Attempts connection to Roland LX-9 via Web MIDI API (USB or system-paired BLE)
   */
  public async connectWebMidi(): Promise<boolean> {
    const nav = navigator as unknown as { requestMIDIAccess?: (opt: { sysex: boolean }) => Promise<GenericMidiAccess> }
    if (!nav.requestMIDIAccess) {
      console.warn('Web MIDI API not supported in this browser environment.')
      return false
    }

    try {
      this.midiAccess = await nav.requestMIDIAccess({ sysex: false })
      const inputs = Array.from(this.midiAccess.inputs.values())

      if (inputs.length === 0) {
        return false
      }

      const selectedInput =
        inputs.find((input: GenericMidiInput) => {
          const n = input.name?.toLowerCase() || ''
          return n.includes('lx-9') || n.includes('lx9') || n.includes('roland')
        }) || inputs[0]

      this.bindMidiInput(selectedInput)
      return true
    } catch (err) {
      console.error('Error requesting Web MIDI access:', err)
      return false
    }
  }

  private bindMidiInput(input: GenericMidiInput) {
    const name = input.name || 'Roland Digital Piano'
    const lower = name.toLowerCase()
    const isBle = lower.includes('bluetooth') || lower.includes('ble')
    this.state.deviceName = name
    this.state.isConnected = true
    this.state.connectionType = isBle ? 'ble' : 'usb'
    this.state.isRolandBluetooth = isBle
    this.notifyState()

    input.onmidimessage = (event: { data: Uint8Array }) => {
      this.processRawMidiMessage(event.data, isBle ? 'hardware-ble' : 'hardware-usb')
    }

    if (this.midiAccess) {
      this.midiAccess.onstatechange = (e: { port: { id: string; type: string; state: string } }) => {
        const port = e.port
        if (port.type === 'input' && port.state === 'disconnected') {
          if (port.id === input.id) {
            this.disconnect()
          }
        }
      }
    }
  }

  /**
   * Parses Apple/Standard BLE MIDI protocol packet
   * Correctly ignores Real-Time Active Sensing (0xFE) and Timing Clock (0xF8)
   * without corrupting running status.
   */
  private parseBleMidiPacket(dataView: DataView) {
    if (dataView.byteLength < 3) return
    const len = dataView.byteLength
    let runningStatus = 0
    let i = 1

    while (i < len) {
      const b = dataView.getUint8(i++)
      if (b >= 0xf8) {
        continue
      }

      if ((b & 0x80) !== 0) {
        if (i < len) {
          const next = dataView.getUint8(i)
          if (next >= 0xf8) {
            i++
            continue
          }
          if ((next & 0x80) !== 0) {
            runningStatus = dataView.getUint8(i++)
          } else {
            runningStatus = b
          }
        }
      } else {
        i--
      }

      if (runningStatus === 0 || i >= len) continue

      const cmd = runningStatus & 0xf0
      if (cmd === 0xc0 || cmd === 0xd0) {
        if (i < len) {
          const d1 = dataView.getUint8(i++)
          this.processRawMidiMessage(new Uint8Array([runningStatus, d1]), 'hardware-ble')
        }
      } else {
        if (i + 1 < len) {
          const d1 = dataView.getUint8(i++)
          const d2 = dataView.getUint8(i++)
          this.processRawMidiMessage(new Uint8Array([runningStatus, d1, d2]), 'hardware-ble')
        } else if (i < len) {
          const d1 = dataView.getUint8(i++)
          this.processRawMidiMessage(new Uint8Array([runningStatus, d1, 0]), 'hardware-ble')
        }
      }
    }
  }

  /**
   * Processes raw MIDI messages preserving Attack Velocity, Note Off Release Velocity,
   * exact millisecond Hold Duration, and continuous CC64 / CC67 pedals.
   */
  public processRawMidiMessage(data: Uint8Array, origin: MidiEventOrigin = 'simulated') {
    if (!data || data.length === 0) return
    let i = 0
    let hasChanged = false
    const now = performance.now()

    while (i < data.length) {
      const status = data[i]
      if ((status & 0x80) !== 0) {
        const command = status & 0xf0
        const note = data[i + 1] ?? 0
        const value = data[i + 2] ?? 0

        if (command === 0x90) {
          if (value > 0) {
            this.state.activeNotes.set(note, { velocity: value, timestamp: now })
            this.noteOnListeners.forEach((cb) => cb(note, value, origin))
          } else {
            const held = this.state.activeNotes.get(note)
            const holdMs = held ? Math.max(10, Math.round(now - held.timestamp)) : 0
            this.state.activeNotes.delete(note)
            this.noteOffListeners.forEach((cb) => cb(note, 0, holdMs, origin))
          }
          hasChanged = true
          i += 3
        } else if (command === 0x80) {
          const held = this.state.activeNotes.get(note)
          const holdMs = held ? Math.max(10, Math.round(now - held.timestamp)) : 0
          const releaseVelocity = value // Roland LX-9 transmits real 0–127 key release speed!
          this.state.activeNotes.delete(note)
          this.noteOffListeners.forEach((cb) => cb(note, releaseVelocity, holdMs, origin))
          hasChanged = true
          i += 3
        } else if (command === 0xb0) {
          const controller = note
          if (controller === 64) {
            this.state.damperPedal = value
            this.pedalListeners.forEach((cb) => cb(value, origin))
          } else if (controller === 67) {
            this.state.softPedal = value
            this.softPedalListeners.forEach((cb) => cb(value, origin))
            try {
              PianoAudioEngine.getInstance().setSoftPedal(value)
            } catch {}
          } else if (controller === 66) {
            this.state.sostenutoPedal = value
          }
          hasChanged = true
          i += 3
        } else if (command === 0xc0 || command === 0xd0) {
          i += 2
        } else {
          i += 3
        }
      } else {
        i++
      }
    }

    if (hasChanged) {
      this.notifyState()
    }
  }

  public simulateNoteOn(midi: number, velocity: number = 80, origin: MidiEventOrigin = 'simulated') {
    this.processRawMidiMessage(new Uint8Array([0x90, midi, velocity]), origin)
  }

  public simulateNoteOff(midi: number, releaseVelocity: number = 48, origin: MidiEventOrigin = 'simulated') {
    this.processRawMidiMessage(new Uint8Array([0x80, midi, releaseVelocity]), origin)
  }

  public simulatePedal(depth: number) {
    this.processRawMidiMessage(new Uint8Array([0xb0, 64, Math.max(0, Math.min(127, depth))]))
  }

  public simulateSoftPedal(depth: number) {
    this.processRawMidiMessage(new Uint8Array([0xb0, 67, Math.max(0, Math.min(127, depth))]))
  }

  public enableSimulator() {
    this.state.deviceName = 'Roland LX-9 (Virtual Simulator)'
    this.state.isConnected = true
    this.state.connectionType = 'simulated'
    this.state.isRolandBluetooth = false
    this.notifyState()
  }

  public disconnect() {
    if (this.bleDevice && this.bleDevice.gatt?.connected) {
      this.bleDevice.gatt.disconnect()
    }
    this.state.deviceName = 'Disconnected'
    this.state.isConnected = false
    this.state.connectionType = 'none'
    this.state.isRolandBluetooth = false
    this.state.activeNotes.clear()
    this.notifyState()
  }

  private notifyState() {
    this.stateListeners.forEach((cb) => cb({ ...this.state }))
  }
}
