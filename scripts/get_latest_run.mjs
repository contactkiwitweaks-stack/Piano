const token = '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';
const repo = 'contactkiwitweaks-stack/Piano';

async function main() {
  const res = await fetch(`https://api.github.com/repos/${repo}/actions/runs?per_page=3`, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'Node' }
  });
  const data = await res.json();
  const runs = data.workflow_runs.map(r => ({
    id: r.id,
    run_number: r.run_number,
    status: r.status,
    conclusion: r.conclusion,
    head_sha: r.head_sha.slice(0, 7),
    message: r.head_commit?.message?.slice(0, 60)
  }));
  console.log(JSON.stringify(runs, null, 2));
}

main();
