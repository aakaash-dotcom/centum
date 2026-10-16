import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function main() {
  const expectedRows = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'ops', 'MIDTERM-114-APPEND-READY.json'), 'utf8')
  );

  console.log('Fetching /api/papers...');
  const resAll = await fetch('https://centum-omega.vercel.app/api/papers?_t=' + Date.now(), {
    headers: { 'Cache-Control': 'no-cache' },
  });
  const dataAll = await resAll.json();
  const papers = dataAll.papers || [];

  const midtermRows = papers.filter((p) => String(p.exam || '').toLowerCase().includes('mid'));
  const pyqRows = papers.filter((p) => String(p.category || 'pyq').toLowerCase() === 'pyq');
  const modelRows = papers.filter((p) => String(p.category || '').toLowerCase() === 'model');

  const servedIds = new Set(papers.map((p) => p.id));
  const failedIds = [];
  for (const exp of expectedRows) {
    if (!servedIds.has(exp.id)) {
      failedIds.push(exp.id);
    }
  }

  console.log('Fetching /api/papers?exam=midterm...');
  const resMid = await fetch('https://centum-omega.vercel.app/api/papers?exam=midterm&_t=' + Date.now(), {
    headers: { 'Cache-Control': 'no-cache' },
  });
  const dataMid = await resMid.json();
  const midChipCount = (dataMid.papers || []).length;

  console.log('Spot-checking 3 PDFs via /api/drive/download...');
  const sampleIds = [
    '1lfrobjuZcjBqS_7feGw6eMqoydlOrWKB', // Phase 1: 10th Tamil 2024
    '1ui3pAEj5ZlMksDnPMOZEnHd5ZFpjz_dv', // Phase 2: 12th Tamil 2024
    '1QhDvlTDz9Wmr-XY1bhf_Su2rFVIdSP1k', // Phase 3: 6th English 2024
  ];

  let spotChecksOk = true;
  for (const id of sampleIds) {
    const resPdf = await fetch('https://centum-omega.vercel.app/api/drive/download?id=' + id, {
      redirect: 'follow',
    });
    if (!resPdf.ok) {
      console.error(`PDF ${id} failed with HTTP ${resPdf.status}`);
      spotChecksOk = false;
      continue;
    }
    const buf = await resPdf.arrayBuffer();
    const bytes = new Uint8Array(buf.slice(0, 5));
    const header = String.fromCharCode(...bytes);
    if (!header.startsWith('%PDF-')) {
      console.error(`PDF ${id} is not valid PDF (header: ${header})`);
      spotChecksOk = false;
    } else {
      console.log(`PDF ${id}: OK (%PDF-, ${buf.byteLength} bytes)`);
    }
  }

  console.log('\nMIDTERM LIVE');
  console.log(`papers total:          ${papers.length}   (must be 1159)`);
  console.log(`exam=midterm rows:     ${midtermRows.length}   (must be 114)`);
  console.log(`category=pyq rows:     ${pyqRows.length}   (must still be 1045)`);
  console.log(`Mid Term chip returns: ${midChipCount}   (must be 114)`);
  console.log(
    `3 PDFs spot-checked:   ${spotChecksOk ? '3 / 3 verified (%PDF-, 200 OK)' : 'failed'}`
  );
  console.log(`failed ids:            ${failedIds.length === 0 ? 'none' : failedIds.join(', ')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
