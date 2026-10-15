import fs from 'fs';

const map = JSON.parse(fs.readFileSync('scripts/PHASE1_APP_SWAP_MAP.json', 'utf8'));
const mapById = new Map(map.files.map((f) => [f.id, f]));

async function checkProd() {
  console.log('Fetching live /api/papers from https://centum-omega.vercel.app/api/papers ...');
  try {
    const res = await fetch('https://centum-omega.vercel.app/api/papers?ts=' + Date.now(), {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) {
      console.log('Prod returned HTTP status:', res.status);
      return;
    }
    const data = await res.json();
    const papers = data.papers || [];
    console.log(`Live total papers count: ${papers.length}`);

    let okMatch = 0;
    let oldOkMatch = 0;
    let skipMatch = 0;
    let failMatch = 0;

    for (const p of papers) {
      const f = mapById.get(p.id);
      if (!f) continue;
      if (f.status === 'ok') {
        if (p.driveFileId === f.newDriveFileId) okMatch++;
        else if (p.driveFileId === f.oldDriveFileId) oldOkMatch++;
      } else if (f.status === 'skip') {
        if (p.driveFileId === f.oldDriveFileId) skipMatch++;
      } else if (f.status === 'fail') {
        if (p.driveFileId === f.oldDriveFileId) failMatch++;
      }
    }

    console.log({
      totalPapers: papers.length,
      okSwappedCount: okMatch,
      okPendingOldCount: oldOkMatch,
      skipCount: skipMatch,
      failCount: failMatch,
      servedFrom: data.servedFrom,
      source: data.source,
    });

    // Sample inspect Class 6 paper
    const sampleC6 = papers.find((p) => p.id === 'cls6-english-2025-annual-em');
    if (sampleC6) {
      const expected = mapById.get(sampleC6.id);
      console.log('\nSample Class 6 Paper Audit (cls6-english-2025-annual-em):');
      console.log(`  • Served driveFileId : ${sampleC6.driveFileId}`);
      console.log(`  • Target newDriveFileId: ${expected?.newDriveFileId}`);
      console.log(`  • Status match       : ${sampleC6.driveFileId === expected?.newDriveFileId ? '✓ SWAPPED' : '⏳ OLD'}`);
    }
  } catch (err) {
    console.error('Error fetching prod:', err.message);
  }
}

checkProd();
