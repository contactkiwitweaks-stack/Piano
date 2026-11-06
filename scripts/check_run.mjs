async function check() {
  const res = await fetch('https://api.github.com/repos/contactkiwitweaks-stack/Piano/actions/runs?per_page=3', {
    headers: { 'User-Agent': 'Node' }
  });
  const d = await res.json();
  if (d.message) console.log('API msg:', d.message);
  const runs = d.workflow_runs || [];
  for (const r of runs) {
    console.log(`Run #${r.run_number} (ID: ${r.id}): ${r.name} - status: ${r.status}, conclusion: ${r.conclusion}, commit: "${r.head_commit?.message?.slice(0, 60)}"`);
  }
}
check().catch(console.error);
