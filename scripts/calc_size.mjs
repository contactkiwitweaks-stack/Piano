async function run() {
  try {
    const res = await fetch("https://api.github.com/repos/sfzinstruments/SplendidGrandPiano/contents/Samples?per_page=100", {
      headers: { "User-Agent": "Antigravity" }
    });
    const data = await res.json();
    let totalBytes = 0;
    for (const item of data) {
      totalBytes += item.size || 0;
    }
    console.log(`Total sample files: ${data.length}, total size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  } catch (err) {
    console.error(err);
  }
}
run();
