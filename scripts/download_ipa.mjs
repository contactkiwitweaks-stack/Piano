import fs from 'fs';
import { execSync } from 'child_process';

const token = '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';
const repo = 'contactkiwitweaks-stack/Piano';

async function checkAndDownload() {
  const res = await fetch(`https://api.github.com/repos/${repo}/actions/runs`, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'Node' }
  });
  const data = await res.json();
  const latestRun = (data.workflow_runs || []).find(r => r.name === 'Build iOS App (.ipa)' && r.head_branch === 'main');
  if (!latestRun) {
    console.log('No runs found');
    return false;
  }

  console.log(`Run #${latestRun.run_number} (${latestRun.id}): status = ${latestRun.status}, conclusion = ${latestRun.conclusion}`);

  if (latestRun.status === 'completed' && latestRun.conclusion === 'success') {
    console.log('Build succeeded! Fetching artifacts...');
    const artRes = await fetch(latestRun.artifacts_url, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'Node' }
    });
    const artData = await artRes.json();
    const ipaArtifact = artData.artifacts?.find(a => a.name.includes('IPA'));
    if (ipaArtifact) {
      console.log('Downloading artifact:', ipaArtifact.name, `(${ipaArtifact.size_in_bytes} bytes)...`);
      const downloadRes = await fetch(ipaArtifact.archive_download_url, {
        headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'Node' }
      });
      const buffer = Buffer.from(await downloadRes.arrayBuffer());
      const zipPath = 'C:\\Users\\Kxwie\\Downloads\\Virtuoso-Piano-iOS-IPA.zip';
      fs.writeFileSync(zipPath, buffer);
      console.log('Downloaded zip. Unpacking to C:\\Users\\Kxwie\\Downloads...');
      execSync(`powershell -Command "Expand-Archive -Force -Path '${zipPath}' -DestinationPath 'C:\\Users\\Kxwie\\Downloads'"`);
      console.log('SUCCESS: Virtuoso-Piano.ipa is ready in C:\\Users\\Kxwie\\Downloads\\Virtuoso-Piano.ipa');
      return true;
    }
  } else if (latestRun.status === 'completed' && latestRun.conclusion === 'failure') {
    console.error('Run failed. Check job logs.');
    return false;
  }
  return false;
}

checkAndDownload().catch(console.error);
