import fs from 'fs';
import path from 'path';

const dir = 'public/samples/splendid';
const files = fs.readdirSync(dir);

function sanitizeName(name) {
  return name
    .replace(/#/g, 's')
    .replace(/-/g, 'neg')
    .replace(/ /g, '_');
}

let renamed = 0;
for (const file of files) {
  if (file === 'mapping.json') continue;
  const safe = sanitizeName(file);
  if (safe !== file) {
    fs.renameSync(path.join(dir, file), path.join(dir, safe));
    renamed++;
  }
}

console.log(`Renamed ${renamed} sample files in ${dir}`);

// Now update mapping.json and SplendidSfzMap.ts
const map = JSON.parse(fs.readFileSync('public/samples/splendid/mapping.json', 'utf8'));
for (const midi in map) {
  for (const layer of ['PP', 'MP', 'MF', 'FF']) {
    if (map[midi][layer]?.sample) {
      map[midi][layer].sample = sanitizeName(map[midi][layer].sample);
    }
  }
}

fs.writeFileSync('public/samples/splendid/mapping.json', JSON.stringify(map, null, 2));

const lines = [
  `// Auto-generated sanitized SFZ region mapping for Splendid Grand Piano (Steinway Model B)`,
  `export interface SfzRegion {`,
  `  layer: 'PP' | 'MP' | 'MF' | 'FF'`,
  `  center: number`,
  `  sample: string`,
  `  release: number`,
  `  offset: number`,
  `}`,
  ``,
  `export interface NoteMapping {`,
  `  PP: SfzRegion`,
  `  MP: SfzRegion`,
  `  MF: SfzRegion`,
  `  FF: SfzRegion`,
  `}`,
  ``,
  `export const SPLENDID_SFZ_MAP: Record<number, NoteMapping> = {`,
];

for (let midi = 21; midi <= 108; midi++) {
  const m = map[midi];
  const formatRegion = (r) => {
    if (!r) return 'null as any';
    return `{ layer: '${r.layer}', center: ${r.center}, sample: '${r.sample}', release: ${r.release}, offset: ${r.offset} }`;
  };
  lines.push(`  ${midi}: {`);
  lines.push(`    PP: ${formatRegion(m.PP)},`);
  lines.push(`    MP: ${formatRegion(m.MP)},`);
  lines.push(`    MF: ${formatRegion(m.MF)},`);
  lines.push(`    FF: ${formatRegion(m.FF)},`);
  lines.push(`  },`);
}
lines.push(`};`);

fs.writeFileSync('src/audio/SplendidSfzMap.ts', lines.join('\n'));
console.log('Updated mapping.json and SplendidSfzMap.ts with clean filenames!');
