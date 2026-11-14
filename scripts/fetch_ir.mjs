async function run() {
  try {
    const url = "https://oramics.github.io/sampled/IR/Voxengo/samples/musikvereinsaal.wav";
    console.log("Fetching:", url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    console.log("Fetched bytes:", buf.length);
    import("fs").then(fs => {
      fs.writeFileSync("public/samples/ir/musikvereinsaal.wav", buf);
      console.log("Saved public/samples/ir/musikvereinsaal.wav");
    });
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
run();
