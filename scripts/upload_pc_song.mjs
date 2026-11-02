import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const args = process.argv.slice(2)
if (args.length === 0) {
  console.log(`
╔════════════════════════════════════════════════════════════════════════╗
║             VIRTUOSO PC SONG UPLOADER & CLOUD SYNC                     ║
╚════════════════════════════════════════════════════════════════════════╝
Usage:
  node scripts/upload_pc_song.mjs <file-path.mid> [options]

Options:
  --title="Song Title"        (Default: file basename)
  --composer="Composer Name"  (Default: "Custom Pianist")
  --key="C Major"             (Default: "C Major")
  --difficulty=1-10           (Default: 5)
  --no-push                   (Skip git commit and push)

Example:
  node scripts/upload_pc_song.mjs "C:\\Users\\Kxwie\\Downloads\\interstellar.mid" --title="Interstellar Theme" --composer="Hans Zimmer"
`)
  process.exit(1)
}

const inputPath = args[0]
if (!fs.existsSync(inputPath)) {
  console.error(`Error: File does not exist at "${inputPath}"`)
  process.exit(1)
}

let title = path.basename(inputPath, path.extname(inputPath)).replace(/[_-]/g, ' ')
let composer = 'Custom Composer'
let key = 'C Major'
let difficulty = 5
let shouldPush = true

for (let i = 1; i < args.length; i++) {
  const arg = args[i]
  if (arg.startsWith('--title=')) title = arg.replace('--title=', '').trim()
  else if (arg.startsWith('--composer=')) composer = arg.replace('--composer=', '').trim()
  else if (arg.startsWith('--key=')) key = arg.replace('--key=', '').trim()
  else if (arg.startsWith('--difficulty=')) difficulty = parseInt(arg.replace('--difficulty=', ''), 10) || 5
  else if (arg === '--no-push') shouldPush = false
}

const publicSongsDir = path.resolve(process.cwd(), 'public', 'songs')
if (!fs.existsSync(publicSongsDir)) {
  fs.mkdirSync(publicSongsDir, { recursive: true })
}

const ext = path.extname(inputPath).toLowerCase()
const safeFileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}${ext}`
const destPath = path.join(publicSongsDir, safeFileName)

fs.copyFileSync(inputPath, destPath)
console.log(`[1/3] Copied song to public/songs/${safeFileName}`)

// Update catalog.json
const catalogPath = path.join(publicSongsDir, 'catalog.json')
let catalog = []
if (fs.existsSync(catalogPath)) {
  try {
    catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
  } catch {
    catalog = []
  }
}

const songId = `pc-song-${Date.now()}`
const rawUrl = `https://raw.githubusercontent.com/contactkiwitweaks-stack/Piano/main/public/songs/${safeFileName}`

const newEntry = {
  id: songId,
  title,
  composer,
  difficulty,
  key,
  period: 'Custom Upload',
  durationSeconds: 180,
  coverColor: 'from-amber-600 via-orange-800 to-zinc-950',
  description: `Uploaded from PC: ${title} by ${composer}.`,
  midiUrl: rawUrl,
}

// Remove any existing with same safeFileName or title
catalog = catalog.filter((c) => !c.midiUrl.endsWith(safeFileName) && c.title !== title)
catalog.unshift(newEntry)

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8')
console.log(`[2/3] Updated catalog.json with "${title}"`)

if (shouldPush) {
  console.log(`[3/3] Syncing to GitHub repo so your iPhone receives it immediately...`)
  try {
    execSync(`git add public/songs/`, { stdio: 'inherit' })
    execSync(`git commit -m "feat(songs): add ${title} by ${composer} to cloud catalog"`, { stdio: 'inherit' })
    execSync(`git push origin main`, { stdio: 'inherit' })
    console.log(`\nSUCCESS! "${title}" is now uploaded.`)
    console.log(`Open Virtuoso Piano on your iPhone > "Meine Songs" > "Song hinzufügen" > "Cloud Katalog".`)
    console.log(`"${title}" will appear at the top ready for 1-tap download!\n`)
  } catch (err) {
    console.warn('Git push warning:', err.message)
    console.log('File is saved locally. Run git push when ready.')
  }
} else {
  console.log(`[3/3] Saved locally (skipped git push).`)
}
