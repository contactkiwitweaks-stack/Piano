async function run() {
  const url = "https://raw.githubusercontent.com/sfzinstruments/SplendidGrandPiano/master/Samples/FF%20C4.flac";
  console.log("Fetching test sample:", url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  import("fs").then(fs => {
    fs.writeFileSync("scripts/test_sample_C4.flac", buf);
    console.log("Saved scripts/test_sample_C4.flac, size:", buf.length);
  });
}
run();
