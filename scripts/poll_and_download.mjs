import fs from 'fs';
import { execSync } from 'child_process';

const token = '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';
const repo = 'contactkiwitweaks-stack/Piano';
const runId = '41509083649';

async function waitAndDownload() {
  console.log(`Polling workflow run ${runId}...`);
  while (true) {
    const res = await fetch(`https://api.github.com/repos/${repo}/actions/runs/${runId}`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'Node' }
    });
    const run = await res.json();
    console.log(`[${new Date().toLocaleTimeString()}] Status: ${run.status}, Conclusion: ${run.conclusion}`);

    if (run.status === 'completed') {
      if (run.conclusion === 'success') {
        console.log('Build succeeded! Fetching artifacts...');
        const artRes = await fetch(run.artifacts_url, {
          headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'Node' }
        });
        const artData = await artRes.json();
        const ipaArtifact = artData.artifacts?.find(a => a.name.includes('IPA'));
        if (ipaArtifact) {
          console.log(`Downloading ${ipaArtifact.name} (${(ipaArtifact.size_in_bytes / (1024 * 1024)).toFixed(2)} MB)...`);
          const dlRes = await fetch(ipaArtifact.archive_download_url, {
            headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'Node' }
          });
          const buf = Buffer.from(await dlRes.arrayBuffer());
          const zipPath = 'C:\\Users\\Kxwie\\Downloads\\Virtuoso-Piano-iOS-IPA.zip';
          fs.writeFileSync(zipPath, buf);
          console.log('Unpacking to C:\\Users\\Kxwie\\Downloads...');
          execSync(`powershell -Command "Expand-Archive -Force -Path '${zipPath}' -DestinationPath 'C:\\Users\\Kxwie\\Downloads'"`);
          console.log('COMPLETE: Virtuoso-Piano.ipa successfully updated in C:\\Users\\Kxwie\\Downloads\\Virtuoso-Piano.ipa');
          process.exit(0);
        } else {
          console.error('No IPA artifact found in successful run!');
          process.exit(1);
        }
      } else {
        console.error(`Build completed with failure conclusion: ${run.conclusion}`);
        process.exit(1);
      }
    }

    await new Promise(r => setTimeout(r, 15000));
  }
}

waitAndDownload().catch(err => {
  console.error(err);
  process.exit(1);
});
