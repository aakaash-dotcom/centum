import { SWAP_79_DATA } from './apply-79-swaps.mjs';

const PROD_URL = 'https://centum-omega.vercel.app/api/papers';
const DOWNLOAD_URL = 'https://centum-omega.vercel.app/api/drive/download';

async function checkProd() {
  const url = `${PROD_URL}?_nocache=${Date.now()}`;
  const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = await res.json();
  const papers = data.papers || [];
  const byId = new Map(papers.map((p) => [p.id, p]));

  let onOld = 0;
  let onNew = 0;
  const failedIds = [];

  for (const [id, info] of Object.entries(SWAP_79_DATA)) {
    const p = byId.get(id);
    if (!p) {
      failedIds.push(id);
    } else if (p.driveFileId === info.new) {
      onNew++;
    } else if (p.driveFileId === info.old) {
      onOld++;
      failedIds.push(id);
    } else {
      failedIds.push(id);
    }
  }

  return {
    total: papers.length,
    onOld,
    onNew,
    failedIds,
    source: data.source,
    servedFrom: data.servedFrom,
  };
}

async function spotCheckPdfs() {
  const sampleIds = [
    '15pobIS7p-mxUJs5LwNCWObH_9_l3gLSq',
    '1_S2YwqeJYtL7tIQgNHBDg-hF32Ct3NpR',
    '1ocVB0fv9o3eSQAsewQUovjezjh4OPB4D',
  ];

  const results = [];
  for (const id of sampleIds) {
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
      results.push(`FAIL (not a PDF)`);
    }
  }
  return results;
}

async function triggerSheetSync() {
  console.log('Triggering Google Sheet Papers tab batch swap sync...');
  try {
    const res = await fetch(PROD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ops-papers-batch-swap' }),
    });
    const result = await res.json();
    console.log('Sheet sync response:', result);
    return result;
  } catch (err) {
    console.warn('Sheet sync trigger warning:', err.message);
  }
}

async function main() {
  console.log('Polling prod until deployment is active...');
  let attempts = 0;
  while (attempts < 30) {
    attempts++;
    try {
      const status = await checkProd();
      console.log(`[Attempt ${attempts}] total: ${status.total}, onNew: ${status.onNew}, onOld: ${status.onOld}`);
      if (status.onNew === 79 && status.onOld === 0 && status.total === 1045) {
        console.log('🎉 Target state reached in /api/papers!');
        
        // Also trigger the upstream Google Sheet sync to permanently write to the Papers tab
        await triggerSheetSync();

        // Spot-check PDFs
        const spotChecks = await spotCheckPdfs();
        console.log('Spot check results:', spotChecks);

        console.log('\n================ FINAL REPORT ================');
        console.log(`79-SWAP DONE`);
        console.log(`rows updated:            ${status.onNew} / 79`);
        console.log(`still on old id:         ${status.onOld}   (must be 0)`);
        console.log(`now on new id:           ${status.onNew}   (must be 79)`);
        console.log(`/api/papers total:       ${status.total}   (must be 1045)`);
        console.log(`3 spot-checked PDFs:     ${spotChecks.every(r => r.startsWith('OK')) ? '3 / 3 verified (%PDF-, 200 OK)' : spotChecks.join(', ')}`);
        console.log(`failed ids:              ${status.failedIds.length === 0 ? 'none' : status.failedIds.join(', ')}`);
        console.log('==============================================\n');
        return;
      }
    } catch (e) {
      console.log(`[Attempt ${attempts}] Error:`, e.message);
    }
    await new Promise((r) => setTimeout(r, 6000));
  }
  console.error('Timed out waiting for production deployment.');
}

main().catch(console.error);
