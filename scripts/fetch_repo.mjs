async function run() {
  try {
    const res = await fetch("https://api.github.com/repos/sfzinstruments/SplendidGrandPiano/contents/Samples", {
      headers: { "User-Agent": "Antigravity" }
    });
    const data = await res.json();
    console.log("Samples dirs:", Array.isArray(data) ? data.map(x => `${x.name} (${x.type}, ${x.size} bytes)`) : data);
  } catch (err) {
    console.error(err);
  }
}
run();
