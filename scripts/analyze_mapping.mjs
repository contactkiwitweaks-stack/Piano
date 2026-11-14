import fs from 'fs';

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
console.log(`Unique sample files referenced: ${allSamples.size}`);
console.log(Array.from(allSamples).slice(0, 10));
