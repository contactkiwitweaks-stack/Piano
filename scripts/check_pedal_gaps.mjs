import fs from 'fs';

const ballade = JSON.parse(fs.readFileSync('src/data/scores/chopin-ballade-1.json', 'utf8'));
const pedals = ballade.pedalEvents || [];
let touching = 0;
for (let i = 0; i < pedals.length - 1; i++) {
  const p1 = pedals[i];
  const p2 = pedals[i+1];
  const gap = p2.startTime - (p1.startTime + p1.duration);
  if (gap <= 0.05) {
    touching++;
  }
}
console.log(`Ballade pedals: ${pedals.length}, consecutive pedals with gap <= 0.05s: ${touching}`);
