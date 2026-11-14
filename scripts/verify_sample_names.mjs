import fs from 'fs';
import path from 'path';

const map = JSON.parse(fs.readFileSync('public/samples/splendid/mapping.json', 'utf8'));
const diskFiles = new Set(fs.readdirSync('public/samples/splendid'));

let missing = 0;
for (const m in map) {
  for (const l of ['PP', 'MP', 'MF', 'FF']) {
    const s = map[m][l]?.sample;
    if (s && !diskFiles.has(s)) {
      console.log(`Missing file on disk: ${s}`);
      missing++;
    }
  }
}

console.log(`Total missing sample references: ${missing}`);
