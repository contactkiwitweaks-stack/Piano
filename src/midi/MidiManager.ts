// Roland LX-9 Bluetooth MIDI (BLE) & Web MIDI Manager

import type { MidiInputState } from '../types/music'
import { PianoAudioEngine } from '../audio/PianoAudioEngine'

type NoteCallback = (midi: number, velocity: number) => void
type NoteOffCallback = (midi: number) => void
type PedalCallback = (depth: number) => void
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
    latencyMs: 4,
  }

  private noteOnListeners: Set<NoteCallback> = new Set()
  private noteOffListeners: Set<NoteOffCallback> = new Set()
  private pedalListeners: Set<PedalCallback> = new Set()
  private stateListeners: Set<StateCallback> = new Set()

  private midiAccess: GenericMidiAccess | null = null
  private bleDevice: GenericBleDevice | null = null
  private bleCharacteristic: GenericGattCharacteristic | null = null

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('nativeMidiMessage', (e: Event) => {
        const customEv = e as CustomEvent<{ data: number[] }>
        if (customEv.detail && customEv.detail.data) {
          this.processRawMidiMessage(new Uint8Array(customEv.detail.data))
        }
      })

      window.addEventListener('nativeMidiDeviceConnected', (e: Event) => {
        const customEv = e as CustomEvent<{ name: string }>
        if (customEv.detail && customEv.detail.name) {
          this.state.deviceName = customEv.detail.name
          this.state.isConnected = true
          this.state.connectionType = 'usb'
          this.notifyState()
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

  public subscribe(
    onNoteOn: NoteCallback,
    onNoteOff: NoteOffCallback,
    onPedal: PedalCallback,
    onState: StateCallback
  ): () => void {
    this.noteOnListeners.add(onNoteOn)
    this.noteOffListeners.add(onNoteOff)
    this.pedalListeners.add(onPedal)
    this.stateListeners.add(onState)

    return () => {
      this.noteOnListeners.delete(onNoteOn)
      this.noteOffListeners.delete(onNoteOff)
      this.pedalListeners.delete(onPedal)
      this.stateListeners.delete(onState)
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

      // Prioritize Roland LX-9 if present in device names
      const selectedInput = inputs.find((input: GenericMidiInput) =>
        input.name?.toLowerCase().includes('roland') || input.name?.toLowerCase().includes('lx-9')
      ) || inputs[0]

      this.bindMidiInput(selectedInput)
      return true
    } catch (err) {
      console.error('Error requesting Web MIDI access:', err)
      return false
    }
  }

  private bindMidiInput(input: GenericMidiInput) {
    this.state.deviceName = input.name || 'Roland Digital Piano'
    this.state.isConnected = true
    this.state.connectionType = input.name?.toLowerCase().includes('bluetooth') ? 'ble' : 'usb'
    this.notifyState()

    input.onmidimessage = (event: { data: Uint8Array }) => {
      this.processRawMidiMessage(event.data)
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
   * Connects via Web Bluetooth (BLE MIDI) directly to digital pianos
   * Compatible with Bluefy, WebBLE, Chrome, Edge, and iOS WebKit Bluetooth bridges
   */
  public async connectBluetoothMidi(): Promise<boolean> {
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

      // Bluefy / WebBLE on iOS: standard BLE MIDI service filter
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
        // Fallback 1: Uppercase UUID for older WebBLE wrappers
        try {
          this.bleDevice = await nav.bluetooth.requestDevice({
            filters: [{ services: [upperUuid] }],
            optionalServices: [lowerUuid, upperUuid],
          })
        } catch {
          // Fallback 2: acceptAllDevices with optionalServices
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

      this.state.deviceName = this.bleDevice.name || 'Bluetooth Digital Piano'
      this.state.isConnected = true
      this.state.connectionType = 'ble'
      this.notifyState()

      return true
    } catch (err) {
      console.error('Failed to connect Bluetooth MIDI:', err)
      return false
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
    let i = 1 // Skip Header Byte (dataView[0] has bit 7 set and 6-bit timestamp high)

    while (i < len) {
      const b = dataView.getUint8(i++)

      // System Real-Time messages (0xF8 - 0xFF, e.g. 0xFE Active Sensing from Roland/Yamaha)
      // Must be handled/ignored WITHOUT altering runningStatus!
      if (b >= 0xf8) {
        continue
      }

      // If byte has MSB set (0x80 - 0xF7): either timestamp low or status byte
      if ((b & 0x80) !== 0) {
        if (i < len) {
          const next = dataView.getUint8(i)
          if (next >= 0xf8) {
            i++ // Skip interleaved real-time byte
            continue
          }
          if ((next & 0x80) !== 0) {
            // b was timestamp low, next is status byte!
            runningStatus = dataView.getUint8(i++)
          } else {
            // b was status byte, next is data byte!
            runningStatus = b
          }
        }
      } else {
        // b has MSB 0: this is data1 under existing runningStatus
        i--
      }

      if (runningStatus === 0 || i >= len) continue

      const cmd = runningStatus & 0xf0
      if (cmd === 0xc0 || cmd === 0xd0) {
        // 1-byte data commands (Program Change, Channel Pressure)
        if (i < len) {
          const d1 = dataView.getUint8(i++)
          this.processRawMidiMessage(new Uint8Array([runningStatus, d1]))
        }
      } else {
        // 2-byte data commands (Note On 0x90, Note Off 0x80, CC Damper 0xB0, Pitch Bend 0xE0)
        if (i + 1 < len) {
          const d1 = dataView.getUint8(i++)
          const d2 = dataView.getUint8(i++)
          this.processRawMidiMessage(new Uint8Array([runningStatus, d1, d2]))
        } else if (i < len) {
          const d1 = dataView.getUint8(i++)
          this.processRawMidiMessage(new Uint8Array([runningStatus, d1, 0]))
        }
      }
    }
  }

  /**
   * Processes raw MIDI messages (handles single messages, continuous buffers, and chords)
   */
  public processRawMidiMessage(data: Uint8Array) {
    if (!data || data.length === 0) return
    let i = 0
    let hasChanged = false

    while (i < data.length) {
      const status = data[i]
      if ((status & 0x80) !== 0) {
        const command = status & 0xf0
        const note = data[i + 1] ?? 0
        const velocity = data[i + 2] ?? 0

        if (command === 0x90) {
          if (velocity > 0) {
            this.state.activeNotes.set(note, { velocity, timestamp: performance.now() })
            this.noteOnListeners.forEach((cb) => cb(note, velocity))
          } else {
            this.state.activeNotes.delete(note)
            this.noteOffListeners.forEach((cb) => cb(note))
          }
          hasChanged = true
          i += 3
        } else if (command === 0x80) {
          this.state.activeNotes.delete(note)
          this.noteOffListeners.forEach((cb) => cb(note))
          hasChanged = true
          i += 3
        } else if (command === 0xb0) {
          const controller = note
          const value = velocity
          if (controller === 64) {
            this.state.damperPedal = value
            this.pedalListeners.forEach((cb) => cb(value))
          } else if (controller === 67) {
            this.state.softPedal = value
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

  public simulateNoteOn(midi: number, velocity: number = 80) {
    this.processRawMidiMessage(new Uint8Array([0x90, midi, velocity]))
  }

  public simulateNoteOff(midi: number) {
    this.processRawMidiMessage(new Uint8Array([0x80, midi, 0]))
  }

  public simulatePedal(depth: number) {
    this.processRawMidiMessage(new Uint8Array([0xb0, 64, Math.max(0, Math.min(127, depth))]))
  }

  public simulateSoftPedal(depth: number) {
    this.processRawMidiMessage(new Uint8Array([0xb0, 67, Math.max(0, Math.min(127, depth))]))
  }

  public enableSimulator() {
    this.state.deviceName = 'Roland LX-9 (Virtual Bridge)'
    this.state.isConnected = true
    this.state.connectionType = 'simulated'
    this.notifyState()
  }

  public disconnect() {
    if (this.bleDevice && this.bleDevice.gatt?.connected) {
      this.bleDevice.gatt.disconnect()
    }
    this.state.deviceName = 'Disconnected'
    this.state.isConnected = false
    this.state.connectionType = 'none'
    this.state.activeNotes.clear()
    this.notifyState()
  }

  private notifyState() {
    this.stateListeners.forEach((cb) => cb({ ...this.state }))
  }
}
