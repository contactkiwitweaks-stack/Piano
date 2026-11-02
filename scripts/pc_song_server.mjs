import http from 'http'
import fs from 'fs'
import path from 'path'
import os from 'os'

const PORT = 8080
const songsDir = path.resolve(process.cwd(), 'public', 'songs')
if (!fs.existsSync(songsDir)) fs.mkdirSync(songsDir, { recursive: true })

function getLocalIp() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return '127.0.0.1'
}

const localIp = getLocalIp()

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  // API: Get list of songs
  if (url.pathname === '/api/songs') {
    const files = fs.readdirSync(songsDir).filter((f) => f.endsWith('.mid') || f.endsWith('.midi') || f.endsWith('.xml') || f.endsWith('.musicxml'))
    const songList = files.map((file) => {
      const title = path.basename(file, path.extname(file)).replace(/[_-]/g, ' ')
      return {
        id: `local-pc-${file}`,
        title,
        composer: 'PC Upload',
        fileName: file,
        downloadUrl: `http://${localIp}:${PORT}/songs/${encodeURIComponent(file)}`
      }
    })
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(songList))
    return
  }

  // API: Serve song files
  if (url.pathname.startsWith('/songs/')) {
    const fileName = decodeURIComponent(url.pathname.replace('/songs/', ''))
    const filePath = path.join(songsDir, fileName)
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`
      })
      fs.createReadStream(filePath).pipe(res)
      return
    }
    res.writeHead(404)
    res.end('File not found')
    return
  }

  // API: Handle file upload from web interface
  if (url.pathname === '/upload' && req.method === 'POST') {
    let body = []
    req.on('data', (chunk) => body.push(chunk))
    req.on('end', () => {
      const buffer = Buffer.concat(body)
      const fileName = req.headers['x-filename'] ? decodeURIComponent(req.headers['x-filename']) : `uploaded-${Date.now()}.mid`
      const dest = path.join(songsDir, fileName)
      fs.writeFileSync(dest, buffer)
      console.log(`Saved uploaded song from PC: ${fileName}`)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true, fileName }))
    })
    return
  }

  // HTML Web Interface on PC
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Virtuoso PC Song Drop</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0a0a0f; color: #f1f5f9; margin: 0; padding: 2rem; display: flex; flex-direction: column; align-items: center; }
    .card { background: #13141c; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 2rem; max-width: 550px; width: 100%; box-shadow: 0 10px 40px rgba(0,0,0,0.6); }
    h1 { font-size: 1.4rem; margin-top: 0; color: #fbbf24; }
    p { font-size: 0.9rem; color: #94a3b8; line-height: 1.4; }
    .dropzone { border: 2px dashed #f59e0b; border-radius: 16px; padding: 2.5rem 1rem; text-align: center; margin: 1.5rem 0; background: rgba(245,158,11,0.05); cursor: pointer; transition: all 0.2s; }
    .dropzone:hover { background: rgba(245,158,11,0.1); border-color: #fbbf24; }
    .badge { display: inline-block; background: #1e293b; padding: 0.4rem 0.8rem; border-radius: 8px; font-family: monospace; font-size: 0.85rem; color: #38bdf8; margin-top: 0.5rem; }
    ul { list-style: none; padding: 0; margin-top: 1rem; }
    li { background: #1a1b26; padding: 0.6rem 0.8rem; border-radius: 8px; margin-bottom: 0.5rem; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🎵 Virtuoso Piano — PC Song Uploader</h1>
    <p>Drop any <code>.mid</code>, <code>.midi</code>, or <code>.musicxml</code> files below. They are instantly served over your local Wi-Fi to your iPhone!</p>
    
    <div class="dropzone" id="dropzone">
      <strong>Drag & Drop MIDI Files Here</strong>
      <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.4rem;">or click to browse your PC</div>
      <input type="file" id="fileinput" accept=".mid,.midi,.xml,.musicxml" style="display: none">
    </div>

    <div style="margin-top: 1.5rem;">
      <strong>📱 How to open on your iPhone:</strong>
      <p style="margin-bottom: 0.3rem;">On your iPhone in Virtuoso Piano, tap <strong>„+ Song hinzufügen“</strong> > <strong>„PC WLAN Drop“</strong>, or enter your PC IP:</p>
      <div class="badge">http://${localIp}:${PORT}</div>
    </div>

    <div style="margin-top: 1.5rem;">
      <strong>Songs currently available for phone:</strong>
      <ul id="songlist">Loading...</ul>
    </div>
  </div>

  <script>
    const dropzone = document.getElementById('dropzone');
    const fileinput = document.getElementById('fileinput');
    const songlist = document.getElementById('songlist');

    dropzone.onclick = () => fileinput.click();
    fileinput.onchange = (e) => handleFiles(e.target.files);

    dropzone.ondragover = (e) => { e.preventDefault(); dropzone.style.background = 'rgba(245,158,11,0.15)'; };
    dropzone.ondragleave = () => { dropzone.style.background = 'rgba(245,158,11,0.05)'; };
    dropzone.ondrop = (e) => {
      e.preventDefault();
      dropzone.style.background = 'rgba(245,158,11,0.05)';
      handleFiles(e.dataTransfer.files);
    };

    async function handleFiles(files) {
      for (const file of files) {
        await fetch('/upload', {
          method: 'POST',
          headers: { 'x-filename': encodeURIComponent(file.name) },
          body: file
        });
      }
      loadList();
    }

    async function loadList() {
      const res = await fetch('/api/songs');
      const data = await res.json();
      songlist.innerHTML = data.length === 0 ? '<li style="color:#64748b">No songs yet. Drag a .mid file above!</li>' : data.map(s => '<li><span>' + s.title + '</span><span style="color:#38bdf8;font-size:0.75rem;">Ready for iPhone</span></li>').join('');
    }
    loadList();
  </script>
</body>
</html>
`)
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════════════════╗
║             VIRTUOSO PIANO PC SONG DROP SERVER RUNNING                 ║
╚════════════════════════════════════════════════════════════════════════╝
  🖥️  On this PC: Open in browser -> http://localhost:${PORT}
  📱  On your iPhone: Connected to same Wi-Fi -> http://${localIp}:${PORT}
  
  Simply drag and drop any .mid or .xml song on your PC to send to iPhone!
  Press Ctrl+C to stop.
`)
})
