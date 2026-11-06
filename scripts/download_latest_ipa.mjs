import fs from 'fs';
import { execSync } from 'child_process';
import { pipeline } from 'stream/promises';

async function downloadIpa() {
  console.log('Retrieving GitHub credentials from Git Credential Manager...');
  let token = null;

  try {
    const gcmOutput = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf8'
    });
    for (const line of gcmOutput.split('\n')) {
      if (line.startsWith('password=')) {
        token = line.substring('password='.length).trim();
      }
    }
  } catch (err) {
    console.log('Git credential fill warning:', err.message);
  }

  const runId = 42282125880;
  console.log(`Checking artifacts for Run #${runId}...`);

  const headers = { 'User-Agent': 'Node' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const artRes = await fetch(`https://api.github.com/repos/contactkiwitweaks-stack/Piano/actions/runs/${runId}/artifacts`, { headers });
  const artData = await artRes.json();
  const artifact = artData.artifacts?.[0];

  if (!artifact) {
    console.log('Artifact not found or unauthorized:', artData);
    return;
  }

  console.log(`Downloading artifact: ${artifact.name} (${(artifact.size_in_bytes / (1024 * 1024)).toFixed(2)} MB)...`);

  const dlRes = await fetch(artifact.archive_download_url, { headers });
  if (!dlRes.ok) {
    console.error(`Download failed with status ${dlRes.status}: ${dlRes.statusText}`);
    return;
  }

  const zipPath = 'C:\\Users\\Kxwie\\Downloads\\Virtuoso-Piano-iOS-IPA-new.zip';
  const fileStream = fs.createWriteStream(zipPath);
  await pipeline(dlRes.body, fileStream);
  console.log(`Saved zip to: ${zipPath}`);

  console.log('Unzipping to Downloads folder...');
  execSync(`powershell -Command "Expand-Archive -Force -Path '${zipPath}' -DestinationPath 'C:\\Users\\Kxwie\\Downloads'"`);

  const ipaPath = 'C:\\Users\\Kxwie\\Downloads\\Virtuoso-Piano.ipa';
  if (fs.existsSync(ipaPath)) {
    const stats = fs.statSync(ipaPath);
    console.log(`SUCCESS: Virtuoso-Piano.ipa updated! (${(stats.size / (1024 * 1024)).toFixed(2)} MB, Last Modified: ${stats.mtime.toLocaleString()})`);
  }
}

downloadIpa().catch(console.error);
