// Roland LX-9 Bluetooth MIDI (BLE) & Web MIDI Manager

import type { MidiInputState } from '../types/music'

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
   * Connects via Web Bluetooth (BLE MIDI) directly to Roland LX-9
   * Compatible with Bluefy, WebBLE, Chrome, and Edge on iOS/iPadOS/macOS/Windows/Android
   */
  public async connectBluetoothMidi(): Promise<boolean> {
    const nav = navigator as unknown as {
      bluetooth?: { requestDevice: (opt: object) => Promise<GenericBleDevice> }
      requestMIDIAccess?: (opt: { sysex: boolean }) => Promise<GenericMidiAccess>
    }
    if (!nav.bluetooth) {
      console.warn('Web Bluetooth API is not available natively on this browser. Bridging to Web MIDI for system-paired Bluetooth digital pianos...')
      if (nav.requestMIDIAccess) {
        return await this.connectWebMidi()
      }
      return false
    }

    try {
      // 1. First attempt: acceptAllDevices discovers Roland LX-9 even if 128-bit UUID is omitted in the 31-byte advertising packet
      try {
        this.bleDevice = await nav.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [BLE_MIDI_SERVICE_UUID],
        })
      } catch (err: unknown) {
        const errMsg = (err as Error)?.message || ''
        if (errMsg.toLowerCase().includes('cancel') || errMsg.toLowerCase().includes('abort')) {
          return false
        }
        // Fallback filter for browsers requiring explicit namePrefix/service filters
        this.bleDevice = await nav.bluetooth.requestDevice({
          filters: [
            { services: [BLE_MIDI_SERVICE_UUID] },
            { namePrefix: 'Roland' },
            { namePrefix: 'LX' },
          ],
          optionalServices: [BLE_MIDI_SERVICE_UUID],
        })
      }

      if (!this.bleDevice || !this.bleDevice.gatt) return false

      const server = await this.bleDevice.gatt.connect()
      const service = await server.getPrimaryService(BLE_MIDI_SERVICE_UUID)
      this.bleCharacteristic = await service.getCharacteristic(BLE_MIDI_CHARACTERISTIC_UUID)

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

      this.state.deviceName = this.bleDevice.name || 'Roland LX-9 (Bluetooth)'
      this.state.isConnected = true
      this.state.connectionType = 'ble'
      this.notifyState()

      return true
    } catch (err) {
      console.error('Failed to connect Roland LX-9 over BLE:', err)
      return false
    }
  }

  /**
   * Parses Apple/Roland BLE MIDI protocol packet
   * Correctly handles timestamp headers, running status, and multi-note packets
   */
  private parseBleMidiPacket(dataView: DataView) {
    if (dataView.byteLength < 3) return
    const len = dataView.byteLength
    let runningStatus = 0
    let i = 1 // Skip Header Byte (dataView[0] has bit 7 set and 6-bit timestamp high)

    while (i < len) {
      const b = dataView.getUint8(i++)

      // If byte has MSB set, it's either a timestamp low byte (0x80-0xFF) or a status byte
      if ((b & 0x80) !== 0) {
        if (i < len) {
          const next = dataView.getUint8(i)
          if ((next & 0x80) !== 0) {
            // Both current and next have MSB set: b was timestamp low, next is status byte!
            runningStatus = dataView.getUint8(i++)
          }
          // If next had MSB 0, b was timestamp low and next is data1 under existing runningStatus!
        }
      } else {
        // b has MSB 0: this is data1 under running status! Step back 1 byte so data extraction reads it
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
   * Processes standard 3-byte MIDI message
   */
  public processRawMidiMessage(data: Uint8Array) {
    const status = data[0]
    const command = status & 0xf0
    const note = data[1]
    const velocity = data[2]

    if (command === 0x90) {
      if (velocity > 0) {
        this.state.activeNotes.set(note, { velocity, timestamp: performance.now() })
        this.noteOnListeners.forEach((cb) => cb(note, velocity))
      } else {
        this.state.activeNotes.delete(note)
        this.noteOffListeners.forEach((cb) => cb(note))
      }
      this.notifyState()
    } else if (command === 0x80) {
      this.state.activeNotes.delete(note)
      this.noteOffListeners.forEach((cb) => cb(note))
      this.notifyState()
    } else if (command === 0xb0) {
      const controller = note
      const value = velocity

      if (controller === 64) {
        this.state.damperPedal = value
        this.pedalListeners.forEach((cb) => cb(value))
        this.notifyState()
      } else if (controller === 67) {
        this.state.softPedal = value
        this.notifyState()
      } else if (controller === 66) {
        this.state.sostenutoPedal = value
        this.notifyState()
      }
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
