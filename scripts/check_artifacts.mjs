async function checkArtifacts() {
  const runId = 42282125880;
  const res = await fetch(`https://api.github.com/repos/contactkiwitweaks-stack/Piano/actions/runs/${runId}/artifacts`, {
    headers: { 'User-Agent': 'Node' }
  });
  const d = await res.json();
  console.log('Artifacts count:', d.total_count);
  for (const a of d.artifacts || []) {
    console.log(`- ${a.name} (${(a.size_in_bytes / (1024 * 1024)).toFixed(2)} MB, ID: ${a.id})`);
    console.log(`  download_url: ${a.archive_download_url}`);
  }
}
checkArtifacts().catch(console.error);
