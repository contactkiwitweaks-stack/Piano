import fs from 'fs';
const map = JSON.parse(fs.readFileSync('src/audio/SplendidSfzMap.json', 'utf8'));

const allFiles = new Set();
const mfFiles = new Set();
const coreFiles = new Set();

for (let m = 21; m <= 108; m++) {
  const item = map[m];
  allFiles.add(item.PP.sample);
  allFiles.add(item.MP.sample);
  allFiles.add(item.MF.sample);
  allFiles.add(item.FF.sample);
  mfFiles.add(item.MF.sample);
  if (m >= 48 && m <= 84) {
    coreFiles.add(item.MF.sample);
  }
}

console.log(`Total unique files: ${allFiles.size}`);
console.log(`MF unique files: ${mfFiles.size}`);
console.log(`Core C3-C6 MF unique files: ${coreFiles.size}`);
console.log("Core files:", Array.from(coreFiles));
