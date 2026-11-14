import { execSync } from 'child_process';

const out = execSync('powershell -Command "tar -tf \'C:\\Users\\Kxwie\\Downloads\\Virtuoso-Piano.ipa\'"').toString();
const lines = out.split('\n').map(l => l.trim()).filter(Boolean);
const splendid = lines.filter(l => l.includes('splendid'));
console.log('Splendid files in IPA:', splendid.length);
console.log('Splendid examples:', splendid.slice(0, 15));
