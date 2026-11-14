import fs from 'fs';
import path from 'path';

const dir = 'src/data/scores';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const pCount = (data.pedalEvents || []).length;
  let maxDur = 0;
  let totalDur = 0;
  if (pCount > 0) {
    maxDur = Math.max(...data.pedalEvents.map(p => p.duration));
    totalDur = data.pedalEvents.reduce((acc, p) => acc + p.duration, 0);
  }
  console.log(`${f.padEnd(40)} pedalEvents: ${String(pCount).padStart(4)} | piece dur: ${data.duration?.toFixed(1) || '?'}s | pedal sum: ${totalDur.toFixed(1)}s | max pedal: ${maxDur.toFixed(2)}s`);
}
