import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('src/audio/SplendidSfzMap.json', 'utf8'));

const lines = [
  `// Auto-generated SFZ region mapping for Splendid Grand Piano (Steinway Model B)`,
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
  const m = raw[midi];
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
console.log('Generated src/audio/SplendidSfzMap.ts, size:', fs.statSync('src/audio/SplendidSfzMap.ts').size);
