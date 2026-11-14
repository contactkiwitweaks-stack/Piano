async function run() {
  try {
    const res = await fetch("https://api.github.com/repos/sfzinstruments/SplendidGrandPiano/contents/Samples?per_page=100", {
      headers: { "User-Agent": "Antigravity" }
    });
    const data = await res.json();
    console.log("Total sample files count in page 1:", data.length);

    // Also fetch the sfz file to see how it maps velocity layers and key ranges!
    const sfzRes = await fetch("https://raw.githubusercontent.com/sfzinstruments/SplendidGrandPiano/master/Splendid%20Grand%20Piano.sfz");
    const sfzText = await sfzRes.text();
    import("fs").then(fs => {
      fs.writeFileSync("scripts/splendid_piano.sfz", sfzText);
      console.log("Saved scripts/splendid_piano.sfz, lines:", sfzText.split('\n').length);
    });
  } catch (err) {
    console.error(err);
  }
}
run();
