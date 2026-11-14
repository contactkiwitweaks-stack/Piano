import fs from 'fs';
import path from 'path';

function parseRegions(filePath, layerName) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const regions = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('<region>')) continue;
    const lokeyMatch = trimmed.match(/lokey=(\d+)/);
    const hikeyMatch = trimmed.match(/hikey=(\d+)/);
    const pitchMatch = trimmed.match(/pitch_keycenter=(\d+)/);
    const sampleMatch = trimmed.match(/sample=([^=]+?\.\$EXT)/);
    const releaseMatch = trimmed.match(/ampeg_release=([0-9.]+)/);
    const offsetMatch = trimmed.match(/offset=(\d+)/);

    if (lokeyMatch && hikeyMatch && pitchMatch && sampleMatch) {
      regions.push({
        layer: layerName,
        lokey: parseInt(lokeyMatch[1], 10),
        hikey: parseInt(hikeyMatch[1], 10),
        center: parseInt(pitchMatch[1], 10),
        sample: sampleMatch[1].replace('$EXT', 'flac').trim(),
        release: releaseMatch ? parseFloat(releaseMatch[1]) : 0.45,
        offset: offsetMatch ? parseInt(offsetMatch[1], 10) : 0,
      });
    }
  }
  return regions;
}

const pp = parseRegions('scripts/PP.txt', 'PP');
const mp = parseRegions('scripts/MP.txt', 'MP');
const mf = parseRegions('scripts/MF.txt', 'MF');
const ff = parseRegions('scripts/FF.txt', 'FF');

console.log(`Parsed regions: PP=${pp.length}, MP=${mp.length}, MF=${mf.length}, FF=${ff.length}`);

// For each key from 21 to 108, find matching region for each layer
const mapping = {};
for (let midi = 21; midi <= 108; midi++) {
  mapping[midi] = {
    PP: pp.find(r => midi >= r.lokey && midi <= r.hikey) || null,
    MP: mp.find(r => midi >= r.lokey && midi <= r.hikey) || null,
    MF: mf.find(r => midi >= r.lokey && midi <= r.hikey) || null,
    FF: ff.find(r => midi >= r.lokey && midi <= r.hikey) || null,
  };
}

let missing = 0;
for (let midi = 21; midi <= 108; midi++) {
  const m = mapping[midi];
  if (!m.PP || !m.MP || !m.MF || !m.FF) {
    console.log(`MIDI ${midi} missing layers: PP=${!!m.PP}, MP=${!!m.MP}, MF=${!!m.MF}, FF=${!!m.FF}`);
    missing++;
  }
}
console.log(`Keys with missing layers: ${missing}`);

// Save mapping
fs.writeFileSync('public/samples/splendid/mapping.json', JSON.stringify(mapping, null, 2));
fs.writeFileSync('src/audio/SplendidSfzMap.json', JSON.stringify(mapping, null, 2));
console.log('Saved mapping to public/samples/splendid/mapping.json and src/audio/SplendidSfzMap.json');
