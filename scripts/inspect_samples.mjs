import fs from 'fs';
const stat = fs.statSync('public/samples/piano/C4.mp3');
console.log('C4.mp3 size:', stat.size);
const buf = fs.readFileSync('public/samples/piano/C4.mp3');
console.log('First 64 bytes (hex):', buf.subarray(0, 64).toString('hex'));
console.log('First 64 bytes (ascii):', buf.subarray(0, 64).toString('ascii').replace(/[^\x20-\x7E]/g, '.'));
