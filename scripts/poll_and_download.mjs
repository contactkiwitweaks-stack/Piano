import fs from 'fs';
import { execSync } from 'child_process';
import { pipeline } from 'stream/promises';

const repo = 'contactkiwitweaks-stack/Piano';

function getGithubToken() {
  try {
    const gcmOutput = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf8'
    });
    for (const line of gcmOutput.split('\n')) {
      if (line.startsWith('password=')) {
        return line.substring('password='.length).trim();
      }
    }
  } catch (err) {
    console.warn('Could not read token from git credential:', err.message);
  }
  return null;
}

async function waitAndDownload() {
  const token = getGithubToken();
  const headers = { 'User-Agent': 'Node-Virtuoso-Builder' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  console.log('Fetching newest workflow runs...');
  const listRes = await fetch(`https://api.github.com/repos/${repo}/actions/runs?per_page=3`, { headers });
  const listData = await listRes.json();
  const latestRun = listData.workflow_runs?.[0];

  if (!latestRun) {
    console.error('No workflow runs found.');
    process.exit(1);
  }

  console.log(`Tracking Run #${latestRun.run_number} (ID: ${latestRun.id})`);
  console.log(`Commit: "${latestRun.head_commit?.message?.trim()}"`);
  console.log(`Initial Status: ${latestRun.status}, Conclusion: ${latestRun.conclusion}`);

  const runId = latestRun.id;
  let status = latestRun.status;
  let conclusion = latestRun.conclusion;

  while (status !== 'completed') {
    await new Promise(r => setTimeout(r, 10000));
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/actions/runs/${runId}`, { headers });
      const data = await res.json();
      status = data.status;
      conclusion = data.conclusion;
      console.log(`[${new Date().toLocaleTimeString()}] Status: ${status}, Conclusion: ${conclusion || 'building...'}`);
    } catch (e) {
      console.warn('Network error while polling:', e.message);
    }
  }

  if (conclusion !== 'success') {
    console.error(`Workflow completed with failure: ${conclusion}`);
    process.exit(1);
  }

  console.log('Workflow succeeded! Locating IPA artifact...');
  const artRes = await fetch(`https://api.github.com/repos/${repo}/actions/runs/${runId}/artifacts`, { headers });
  const artData = await artRes.json();
  const artifact = artData.artifacts?.find(a => a.name.includes('IPA') || a.name.includes('ipa'));

  if (!artifact) {
    console.error('No IPA artifact found in successful run!');
    process.exit(1);
  }

  console.log(`Downloading artifact "${artifact.name}" (${(artifact.size_in_bytes / (1024 * 1024)).toFixed(2)} MB)...`);
  const dlRes = await fetch(artifact.archive_download_url, { headers });
  if (!dlRes.ok) {
    console.error(`Download failed with HTTP ${dlRes.status}`);
    process.exit(1);
  }

  const zipPath = 'C:\\Users\\Kxwie\\Downloads\\Virtuoso-Piano-iOS-IPA-latest.zip';
  const fileStream = fs.createWriteStream(zipPath);
  await pipeline(dlRes.body, fileStream);
  console.log(`Saved archive to ${zipPath}`);

  console.log('Extracting to C:\\Users\\Kxwie\\Downloads...');
  execSync(`powershell -Command "Expand-Archive -Force -Path '${zipPath}' -DestinationPath 'C:\\Users\\Kxwie\\Downloads'"`);

  const ipaPath = 'C:\\Users\\Kxwie\\Downloads\\Virtuoso-Piano.ipa';
  if (fs.existsSync(ipaPath)) {
    const stats = fs.statSync(ipaPath);
    console.log(`=======================================================`);
    console.log(`SUCCESS! NEW IPA READY FOR IPHONE SIDELOAD:`);
    console.log(`File: ${ipaPath}`);
    console.log(`Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Timestamp: ${stats.mtime.toLocaleString()}`);
    console.log(`=======================================================`);
  }
}

waitAndDownload().catch(err => {
  console.error(err);
  process.exit(1);
});
