import fs from 'fs';
import path from 'path';

const outDir = 'public/samples/splendid';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Read sample filenames from our previous analysis
const ff = fs.readFileSync('scripts/FF.txt', 'utf8').split('\n').filter(l => l.trim().startsWith('<region>'));
const mf = fs.readFileSync('scripts/MF.txt', 'utf8').split('\n').filter(l => l.trim().startsWith('<region>'));
const mp = fs.readFileSync('scripts/MP.txt', 'utf8').split('\n').filter(l => l.trim().startsWith('<region>'));
const pp = fs.readFileSync('scripts/PP.txt', 'utf8').split('\n').filter(l => l.trim().startsWith('<region>'));

const allSamples = new Set();
[...ff, ...mf, ...mp, ...pp].forEach(line => {
  const m = line.match(/sample=([^=]+?\.\$EXT)/);
  if (m) {
    allSamples.add(m[1].replace('$EXT', 'flac').trim());
  }
});

const sampleList = Array.from(allSamples);
console.log(`Starting download of ${sampleList.length} Splendid Grand Piano FLAC samples...`);

async function downloadFile(filename) {
  const filePath = path.join(outDir, filename);
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
    return true; // already downloaded
  }
  const url = `https://raw.githubusercontent.com/sfzinstruments/SplendidGrandPiano/master/Samples/${encodeURIComponent(filename)}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1000) throw new Error('File too small');
      fs.writeFileSync(filePath, buf);
      return true;
    } catch (e) {
      if (attempt === 3) {
        console.error(`Failed ${filename} after 3 attempts:`, e.message);
        return false;
      }
      await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }
}

async function run() {
  const concurrency = 12;
  let completed = 0;
  let failed = 0;
  const queue = [...sampleList];

  const workers = Array.from({ length: concurrency }).map(async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      const ok = await downloadFile(item);
      if (ok) completed++;
      else failed++;
      if ((completed + failed) % 25 === 0 || queue.length === 0) {
        console.log(`Progress: ${completed + failed} / ${sampleList.length} (${completed} ok, ${failed} failed)`);
      }
    }
  });

  await Promise.all(workers);
  console.log(`Finished: ${completed} downloaded successfully, ${failed} failed.`);
}

run();
