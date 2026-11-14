async function testSpeed() {
  const t0 = Date.now();
  const testFiles = ["FF C4.flac", "FF A4.flac", "FF G3.flac", "MF C4.flac", "PP C4.flac"];
  await Promise.all(testFiles.map(async f => {
    const res = await fetch(`https://raw.githubusercontent.com/sfzinstruments/SplendidGrandPiano/master/Samples/${encodeURIComponent(f)}`);
    const buf = await res.arrayBuffer();
    console.log(`Downloaded ${f}: ${buf.byteLength} bytes`);
  }));
  console.log(`Downloaded 5 files in ${Date.now() - t0} ms`);
}
testSpeed();
