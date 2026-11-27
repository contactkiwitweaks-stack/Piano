import UIKit
import Capacitor
import AVFoundation
import CoreMIDI
import CoreAudioKit
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Configure low-latency playback audio session to bypass iPhone silent switch
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers, .allowBluetooth, .allowBluetoothA2DP])
            try session.setPreferredIOBufferDuration(128.0 / 44100.0) // ~2.9ms low latency buffer
            try session.setActive(true)
        } catch {
            print("AVAudioSession setup error: \(error)")
        }
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationDidBecomeActive(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}

// MARK: - Native CoreMIDI & Bluetooth MIDI Bridge for Roland LX-9 Digital Pianos
@objc public class CoreMIDIBridge: NSObject, WKScriptMessageHandler {
    @objc public static let shared = CoreMIDIBridge()

    private var midiClient = MIDIClientRef()
    private var inputPort = MIDIPortRef()
    private weak var bridgeViewController: CAPBridgeViewController?
    private var handlerRegistered = false

    private override init() {
        super.init()
    }

    @objc public func initialize(with viewController: CAPBridgeViewController) {
        self.bridgeViewController = viewController

        // Register JS -> Native bridge for opening Apple's built-in Bluetooth MIDI pairing sheet
        DispatchQueue.main.async { [weak self] in
            guard let self = self, !self.handlerRegistered,
                  let webView = viewController.webView else { return }
            webView.configuration.userContentController.add(self, name: "openBleMidiPicker")
            self.handlerRegistered = true
        }

        // 1. Create native CoreMIDI client
        var status = MIDIClientCreateWithBlock("VirtuosoPianoMIDIClient" as CFString, &midiClient) { [weak self] _ in
            self?.connectAllEndpoints()
        }
        guard status == noErr else {
            print("[Virtuoso CoreMIDI] Failed to create MIDI Client: \(status)")
            return
        }

        // 2. Create MIDI input port with standard packet block
        status = MIDIInputPortCreateWithBlock(midiClient, "VirtuosoPianoInputPort" as CFString, &inputPort) { [weak self] packetListPtr, _ in
            self?.handlePacketList(packetListPtr)
        }
        guard status == noErr else {
            print("[Virtuoso CoreMIDI] Failed to create MIDI Input Port: \(status)")
            return
        }

        print("[Virtuoso CoreMIDI] Native CoreMIDI & BLE MIDI bridge initialized successfully.")
        connectAllEndpoints()
    }

    public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "openBleMidiPicker" {
            DispatchQueue.main.async { [weak self] in
                self?.presentBluetoothMidiPicker()
            }
        }
    }

    private func presentBluetoothMidiPicker() {
        guard let rootVC = bridgeViewController else { return }
        let blePicker = CABTMIDICentralViewController()
        let nav = UINavigationController(rootViewController: blePicker)
        blePicker.navigationItem.rightBarButtonItem = UIBarButtonItem(
            barButtonSystemItem: .done,
            target: self,
            action: #selector(dismissBlePicker)
        )
        nav.modalPresentationStyle = .formSheet
        rootVC.present(nav, animated: true, completion: nil)
    }

    @objc private func dismissBlePicker() {
        bridgeViewController?.dismiss(animated: true) { [weak self] in
            self?.connectAllEndpoints()
        }
    }

    private func getMidiStringProperty(_ obj: MIDIObjectRef, _ prop: CFString) -> String {
        var unmanaged: Unmanaged<CFString>?
        let status = MIDIObjectGetStringProperty(obj, prop, &unmanaged)
        if status == noErr, let cf = unmanaged?.takeRetainedValue() {
            return cf as String
        }
        return ""
    }

    private func connectAllEndpoints() {
        let sourceCount = MIDIGetNumberOfSources()
        var preferredName = ""
        var preferredTransport = "usb"
        var bestPriority = -1

        for i in 0..<sourceCount {
            let src = MIDIGetSource(i)
            MIDIPortConnectSource(inputPort, src, nil)

            let displayName = getMidiStringProperty(src, kMIDIPropertyDisplayName)
            let deviceName = getMidiStringProperty(src, kMIDIPropertyName)
            let driverOwner = getMidiStringProperty(src, kMIDIPropertyDriverOwner)
            let name = displayName.isEmpty ? deviceName : displayName
            let lowerName = name.lowercased()
            let lowerDriver = driverOwner.lowercased()

            let isBle = lowerDriver.contains("bluetooth") || lowerName.contains("bluetooth") || lowerName.contains("ble")
            let isRoland = lowerName.contains("roland") || lowerName.contains("lx-9") || lowerName.contains("lx9")
            let isNetwork = lowerName.contains("network") || lowerDriver.contains("rtp")

            var priority = 1
            if isRoland && isBle { priority = 100 }
            else if isBle { priority = 80 }
            else if isRoland { priority = 60 }
            else if isNetwork { priority = 0 }

            if priority > bestPriority && !isNetwork {
                bestPriority = priority
                preferredName = name.isEmpty ? "Roland Digital Piano" : name
                preferredTransport = isBle ? "ble" : "usb"
            }
        }

        DispatchQueue.main.async { [weak self] in
            guard let webView = self?.bridgeViewController?.webView else { return }
            if bestPriority >= 0 && !preferredName.isEmpty {
                print("[Virtuoso CoreMIDI] Connected hardware MIDI source: \(preferredName) [\(preferredTransport)]")
                let safeName = preferredName.replacingOccurrences(of: "'", with: "\\'")
                let js = "window.dispatchEvent(new CustomEvent('nativeMidiDeviceConnected', { detail: { name: '\(safeName)', transport: '\(preferredTransport)' } }));"
                webView.evaluateJavaScript(js, completionHandler: nil)
            } else {
                let js = "window.dispatchEvent(new CustomEvent('nativeMidiDeviceDisconnected'));"
                webView.evaluateJavaScript(js, completionHandler: nil)
            }
        }
    }

    private func handlePacketList(_ packetListPtr: UnsafePointer<MIDIPacketList>) {
        let list = packetListPtr.pointee
        var packet = list.packet

        for _ in 0..<list.numPackets {
            let length = Int(packet.length)
            if length > 0 {
                var bytes = [UInt8]()
                withUnsafePointer(to: packet.data) { dataPtr in
                    dataPtr.withMemoryRebound(to: UInt8.self, capacity: length) { u8Ptr in
                        for i in 0..<length {
                            bytes.append(u8Ptr[i])
                        }
                    }
                }

                if !bytes.isEmpty {
                    dispatchBytesToWebView(bytes)
                }
            }
            packet = MIDIPacketNext(&packet).pointee
        }
    }

    private func dispatchBytesToWebView(_ bytes: [UInt8]) {
        DispatchQueue.main.async { [weak self] in
            guard let webView = self?.bridgeViewController?.webView else { return }
            let bytesString = bytes.map { String($0) }.joined(separator: ",")
            let js = "window.dispatchEvent(new CustomEvent('nativeMidiMessage', { detail: { data: [\(bytesString)] } }));"
            webView.evaluateJavaScript(js, completionHandler: nil)
        }
    }
}
