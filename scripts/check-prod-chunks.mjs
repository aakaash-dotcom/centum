async function run() {
  const html = await fetch('https://centum-omega.vercel.app/papers').then(r => r.text());
  const regex = /src=["']([^"']+\.js)["']/g;
  let m;
  const scripts = [];
  while ((m = regex.exec(html)) !== null) {
    scripts.push(m[1]);
  }
  console.log('Scripts found:', scripts.length);

  for (const s of scripts) {
    const url = s.startsWith('http') ? s : 'https://centum-omega.vercel.app' + s;
    const txt = await fetch(url).then(r => r.text());
    const hasNew = txt.includes('1CJkg0vp7LZ0PzJU5Z1sol8WIqD7QJakQ');
    const hasOld = txt.includes('1_3wjCxeG3FRDf-qhufhmg4v54x6P_U5r');
    if (hasNew || hasOld) {
      console.log(`Chunk ${s}: hasNew=${hasNew}, hasOld=${hasOld}, length=${txt.length}`);
    }
  }
}
run().catch(console.error);
