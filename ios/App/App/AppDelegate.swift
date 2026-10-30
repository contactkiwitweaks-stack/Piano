import UIKit
import Capacitor
import AVFoundation
import CoreMIDI
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

// MARK: - Native CoreMIDI Bridge for Roland & USB-C Digital Pianos
@objc public class CoreMIDIBridge: NSObject {
    @objc public static let shared = CoreMIDIBridge()

    private var midiClient = MIDIClientRef()
    private var inputPort = MIDIPortRef()
    private weak var bridgeViewController: CAPBridgeViewController?

    private override init() {
        super.init()
    }

    @objc public func initialize(with viewController: CAPBridgeViewController) {
        self.bridgeViewController = viewController

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

        print("[Virtuoso CoreMIDI] Native CoreMIDI bridge initialized successfully.")
        connectAllEndpoints()
    }

    private func connectAllEndpoints() {
        let sourceCount = MIDIGetNumberOfSources()
        for i in 0..<sourceCount {
            let src = MIDIGetSource(i)
            MIDIPortConnectSource(inputPort, src, nil)
        }

        if sourceCount > 0 {
            let src = MIDIGetSource(0)
            var nameProp: Unmanaged<CFString>?
            MIDIObjectGetStringProperty(src, kMIDIPropertyDisplayName, &nameProp)
            let deviceName = (nameProp?.takeRetainedValue() as String?) ?? "Roland Digital Piano (USB-C CoreMIDI)"

            print("[Virtuoso CoreMIDI] Connected to hardware MIDI source: \(deviceName)")
            DispatchQueue.main.async { [weak self] in
                guard let webView = self?.bridgeViewController?.webView else { return }
                let safeName = deviceName.replacingOccurrences(of: "'", with: "\\'")
                let js = "window.dispatchEvent(new CustomEvent('nativeMidiDeviceConnected', { detail: { name: '\(safeName)' } }));"
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
