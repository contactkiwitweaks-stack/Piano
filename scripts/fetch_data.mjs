async function run() {
  try {
    for (const name of ["PP.txt", "MP.txt", "MF.txt", "FF.txt", "Res.txt"]) {
      const url = `https://raw.githubusercontent.com/sfzinstruments/SplendidGrandPiano/master/Data/${name}`;
      const res = await fetch(url);
      const text = await res.text();
      console.log(`${name}: ${text.split('\n').length} lines`);
      import("fs").then(fs => {
        fs.writeFileSync(`scripts/${name}`, text);
      });
    }
  } catch (err) {
    console.error(err);
  }
}
run();
