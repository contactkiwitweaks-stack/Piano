import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const dir = 'public/samples/splendid';
const flacFiles = fs.readdirSync(dir).filter(f => f.endsWith('.flac'));

console.log(`Found ${flacFiles.length} FLAC files. Generating 192k MP3 fallbacks...`);

async function convertFile(flacName) {
  const base = flacName.slice(0, -5);
  const mp3Path = path.join(dir, `${base}.mp3`);
  if (fs.existsSync(mp3Path) && fs.statSync(mp3Path).size > 1000) return true;
  const flacPath = path.join(dir, flacName);
  try {
    await execAsync(`ffmpeg -v error -i "${flacPath}" -c:a libmp3lame -b:a 192k "${mp3Path}" -y`);
    return true;
  } catch (e) {
    console.error(`Error converting ${flacName}:`, e.message);
    return false;
  }
}

async function run() {
  const t0 = Date.now();
  const concurrency = 8;
  const queue = [...flacFiles];
  let done = 0;

  const workers = Array.from({ length: concurrency }).map(async () => {
    while (queue.length > 0) {
      const f = queue.shift();
      await convertFile(f);
      done++;
      if (done % 50 === 0 || queue.length === 0) {
        console.log(`Converted ${done} / ${flacFiles.length}`);
      }
    }
  });

  await Promise.all(workers);
  console.log(`Finished converting ${done} files in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

run();
