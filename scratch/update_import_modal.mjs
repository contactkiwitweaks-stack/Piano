import fs from 'fs'

const path = 'src/components/ImportModal.tsx'
let code = fs.readFileSync(path, 'utf8')

// Add Laptop / Wifi icon from lucide-react if not present
if (!code.includes('Laptop')) {
  code = code.replace("  Music,\n} from 'lucide-react'", "  Music,\n  Laptop,\n  RefreshCw,\n} from 'lucide-react'")
}

// Add pcSync to activeTab
code = code.replace(
  "const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'cloud'>('upload')",
  "const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'cloud' | 'pcSync'>('cloud')"
)

// Add pcIp state & pcSongList state & dynamic cloud songs state
const stateInsertTarget = "const fileInputRef = useRef<HTMLInputElement>(null)"
const stateInsertReplacement = `const fileInputRef = useRef<HTMLInputElement>(null)
  const [cloudList, setCloudList] = useState<CloudSongPreset[]>(SongStorageManager.cloudCatalog)
  const [pcIp, setPcIp] = useState<string>(() => localStorage.getItem('virtuoso_pc_ip') || '192.168.1.100')
  const [pcSongs, setPcSongs] = useState<Array<{ id: string; title: string; composer: string; fileName: string; downloadUrl: string }>>([])
  const [isScanningPc, setIsScanningPc] = useState(false)

  // Fetch updated catalog on mount
  React.useEffect(() => {
    SongStorageManager.fetchCloudCatalog().then((list) => {
      if (list && list.length > 0) setCloudList(list)
    })
  }, [])

  const handleScanPc = async () => {
    if (!pcIp.trim()) return
    setIsScanningPc(true)
    setStatusMsg(\`Connecting to PC at \${pcIp}:8080...\`)
    localStorage.setItem('virtuoso_pc_ip', pcIp.trim())
    try {
      const songs = await SongStorageManager.fetchLocalPcSongs(pcIp)
      setPcSongs(songs)
      setStatusMsg(\`Found \${songs.length} song(s) on your PC!\`)
    } catch (err: unknown) {
      setStatusMsg(\`Could not connect to PC: \${(err as Error).message}\`)
    } finally {
      setIsScanningPc(false)
    }
  }

  const handleDownloadFromPc = async (song: { title: string; downloadUrl: string; fileName: string }) => {
    setIsProcessing(true)
    setStatusMsg(\`Downloading "\${song.title}" from your PC...\`)
    try {
      const res = await fetch(song.downloadUrl)
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`)
      const buffer = await res.arrayBuffer()
      const parsedPiece = await FileImportPipeline.parseMidiFile(buffer, song.fileName)
      handleFinishImport(parsedPiece)
    } catch (err: unknown) {
      setStatusMsg(\`Failed to download from PC: \${(err as Error).message}\`)
    } finally {
      setIsProcessing(false)
    }
  }`

code = code.replace(stateInsertTarget, stateInsertReplacement)

// Update Tab Switcher to include PC Sync
const tabSwitcherTarget = `{/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-2 bg-zinc-950/60 border-b border-white/5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('upload')}
            className={\`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all \${
              activeTab === 'upload'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }\`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{language === 'de' ? 'iPhone Dateien / AirDrop' : 'iPhone Files'}</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={\`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all \${
              activeTab === 'url'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }\`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web URL</span>
          </button>

          <button
            onClick={() => setActiveTab('cloud')}
            className={\`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all \${
              activeTab === 'cloud'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }\`}
          >
            <CloudDownload className="w-3.5 h-3.5" />
            <span>Song Cloud ({SongStorageManager.cloudCatalog.length})</span>
          </button>
        </div>`

const tabSwitcherReplacement = `{/* Tab Switcher */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-zinc-950/60 border-b border-white/5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('cloud')}
            className={\`py-2 rounded-xl flex items-center justify-center gap-1 transition-all \${
              activeTab === 'cloud'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }\`}
          >
            <CloudDownload className="w-3.5 h-3.5" />
            <span>Cloud</span>
          </button>

          <button
            onClick={() => setActiveTab('pcSync')}
            className={\`py-2 rounded-xl flex items-center justify-center gap-1 transition-all \${
              activeTab === 'pcSync'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }\`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>PC WLAN</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={\`py-2 rounded-xl flex items-center justify-center gap-1 transition-all \${
              activeTab === 'upload'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }\`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Dateien</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={\`py-2 rounded-xl flex items-center justify-center gap-1 transition-all \${
              activeTab === 'url'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }\`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>URL</span>
          </button>
        </div>`

code = code.replace(tabSwitcherTarget, tabSwitcherReplacement)

// In cloudTab: use cloudList instead of SongStorageManager.cloudCatalog
code = code.replace(
  'SongStorageManager.cloudCatalog.map((preset) => (',
  'cloudList.map((preset) => ('
)

// Add pcSync section into Modal Body
const pcSyncBody = `
          {activeTab === 'pcSync' && (
            <div className="space-y-4 py-1">
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                    <Laptop className="w-4 h-4 text-amber-400" />
                    <span>Lokal vom PC laden (WLAN)</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">Port 8080</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Starte auf deinem PC im Terminal <code className="text-amber-300 font-mono">npm run song-server</code> und ziehe beliebige MIDI-Dateien auf die Webseite.
                </p>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="PC IP-Adresse (z.B. 192.168.1.100)"
                    value={pcIp}
                    onChange={(e) => setPcIp(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    onClick={handleScanPc}
                    disabled={isScanningPc}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <RefreshCw className={\`w-3.5 h-3.5 \${isScanningPc ? 'animate-spin' : ''}\`} />
                    <span>Scannen</span>
                  </button>
                </div>
              </div>

              {pcSongs.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-zinc-300 flex items-center justify-between px-1">
                    <span>Verfügbare Songs auf dem PC:</span>
                    <span className="text-amber-400 font-mono">{pcSongs.length}</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {pcSongs.map((s) => (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-zinc-950/70 border border-white/5 hover:border-amber-500/40 flex items-center justify-between gap-2"
                      >
                        <div className="truncate min-w-0">
                          <div className="font-bold text-xs text-white truncate">{s.title}</div>
                          <div className="text-[10px] text-zinc-400 font-mono truncate">{s.fileName}</div>
                        </div>
                        <button
                          onClick={() => handleDownloadFromPc(s)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black flex items-center gap-1 transition-all flex-shrink-0 active:scale-95"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Laden</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cloud Sync Alternative Note */}
              <div className="p-3 rounded-2xl bg-zinc-950/40 border border-white/5 text-[11px] text-zinc-400 space-y-1">
                <span className="font-bold text-zinc-200">Alternative: Cloud-Upload vom PC</span>
                <p>
                  Auf dem PC: <code className="text-amber-300 font-mono">npm run add-song "mein-song.mid"</code> ausführen. Der Song wird automatisch in den <strong>Cloud</strong>-Tab synchronisiert und kann überall (auch unterwegs) mit 1 Klick geladen werden!
                </p>
              </div>
            </div>
          )}
`

code = code.replace(
  "{activeTab === 'cloud' && (",
  pcSyncBody + "\n          {activeTab === 'cloud' && ("
)

fs.writeFileSync(path, code, 'utf8')
console.log('Successfully updated ImportModal.tsx with PC WLAN Sync!')
