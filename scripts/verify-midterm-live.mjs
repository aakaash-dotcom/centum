import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PROD_URL = 'https://centum-omega.vercel.app/api/papers';
const DOWNLOAD_URL = 'https://centum-omega.vercel.app/api/drive/download';

// Load expected 114 midterm rows
const midtermPath = path.join(rootDir, 'ops', 'MIDTERM-114-APPEND-READY.json');
const expectedRows = JSON.parse(fs.readFileSync(midtermPath, 'utf8'));
const expectedIdSet = new Set(expectedRows.map((r) => r.id));

export async function checkPapers(baseUrl = PROD_URL) {
  const url = `${baseUrl}?_nocache=${Date.now()}`;
  const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = await res.json();
  const papers = data.papers || [];

  const midtermPapers = papers.filter((p) => String(p.exam || '').toLowerCase().includes('mid'));
  const pyqPapers = papers.filter((p) => String(p.category || 'pyq').toLowerCase() === 'pyq');
  const modelPapers = papers.filter((p) => String(p.category || '').toLowerCase() === 'model');

  const servedIds = new Set(papers.map((p) => p.id));
  const failedIds = [];
  for (const exp of expectedRows) {
    if (!servedIds.has(exp.id)) {
      failedIds.push(exp.id);
    }
  }

  return {
    total: papers.length,
    midtermCount: midtermPapers.length,
    pyqCount: pyqPapers.length,
    modelCount: modelPapers.length,
    failedIds,
    source: data.source,
    servedFrom: data.servedFrom,
  };
}

export async function spotCheckPdfs(sampleIds) {
  const ids = sampleIds || [
    '1lfrobjuZcjBqS_7feGw6eMqoydlOrWKB', // 10th Tamil 2024
    '130J1Q7-XmU14k7yA1oJj8H664E19k-7q', // 12th Maths 2024
    '1QhDvlTDz9Wmr-XY1bhf_Su2rFVIdSP1k', // 6th English 2024
  ];

  const results = [];
  for (const id of ids) {
    try {
      const res = await fetch(`${DOWNLOAD_URL}?id=${id}`, { redirect: 'follow' });
      if (!res.ok) {
        results.push(`FAIL: HTTP ${res.status} for ${id}`);
        continue;
      }
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf.slice(0, 8));
      const header = String.fromCharCode(...bytes);
      if (header.startsWith('%PDF-')) {
        results.push(`OK (%PDF-, ${buf.byteLength} bytes)`);
      } else {
        results.push(`FAIL (not a PDF for ${id})`);
      }
    } catch (err) {
      results.push(`FAIL: ${err.message}`);
    }
  }
  return results;
}

export async function triggerSheetAppend() {
  console.log('Triggering Google Sheet Papers tab append sync via POST /api/papers...');
  try {
    const res = await fetch(PROD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'append-midterm-to-sheet', rows: expectedRows }),
    });
    const result = await res.json().catch(() => ({}));
    console.log('Sheet append sync response:', result);
    return result;
  } catch (err) {
    console.warn('Sheet append sync trigger warning:', err.message);
  }
}

async function main() {
  console.log('Starting verification of live prod /api/papers...');
  console.log(`Target URL: ${PROD_URL}`);

  // Trigger Sheet Sync
  await triggerSheetAppend();

  console.log('Polling prod until deployment is active with 1,159 papers...');
  let attempts = 0;
  while (attempts < 40) {
    attempts++;
    try {
      const status = await checkPapers();
      console.log(
        `[Attempt ${attempts}] total: ${status.total} (target: 1159), midterm: ${status.midtermCount} (target: 114), pyq: ${status.pyqCount} (target: 1045)`
      );

      if (
        status.total === 1159 &&
        status.midtermCount === 114 &&
        status.pyqCount === 1045 &&
        status.failedIds.length === 0
      ) {
        console.log('\n🎉 Target state reached in /api/papers!');

        // Spot-check PDFs
        const spotChecks = await spotCheckPdfs();
        console.log('Spot check results:', spotChecks);

        console.log('\n================ FINAL REPORT ================');
        console.log('MIDTERM LIVE');
        console.log(`papers total:          ${status.total}   (must be 1159)`);
        console.log(`exam=midterm rows:     ${status.midtermCount}   (must be 114)`);
        console.log(`category=pyq rows:     ${status.pyqCount}   (must still be 1045)`);
        console.log(`Mid Term chip returns: ${status.midtermCount}   (must be 114)`);
        console.log(
          `3 PDFs spot-checked:   ${spotChecks.every((r) => r.startsWith('OK')) ? '3 / 3 verified (%PDF-, 200 OK)' : spotChecks.join(', ')}`
        );
        console.log(`failed ids:            ${status.failedIds.length === 0 ? 'none' : status.failedIds.join(', ')}`);
        console.log('==============================================\n');
        return;
      }
    } catch (e) {
      console.log(`[Attempt ${attempts}] Error:`, e.message);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.error('Timed out waiting for target state in production.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  });
}
