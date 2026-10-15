import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const textbooksPath = path.join(rootDir, 'scripts', 'live-384-textbooks.json');
let textbooks = [];

if (fs.existsSync(textbooksPath)) {
  textbooks = JSON.parse(fs.readFileSync(textbooksPath, 'utf8'));
} else {
  console.log('Fetching live /api/textbooks ...');
  const res = await fetch('https://centum-omega.vercel.app/api/textbooks');
  const data = await res.json();
  textbooks = data.chapters || [];
  fs.writeFileSync(textbooksPath, JSON.stringify(textbooks, null, 2), 'utf8');
}

console.log(`Loaded ${textbooks.length} textbooks to verify.\n`);

const CONCURRENCY = 14;
const results = [];
let completed = 0;

async function checkViewerUrl(item) {
  const driveFileId = item.driveFileId;
  const viewerUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;
  try {
    const res = await fetch(viewerUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CENTUM-Textbook-Verifier/1.0',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (res.status !== 200) {
      return { pass: false, item, status: res.status, reason: `HTTP_${res.status}` };
    }

    const html = await res.text();
    const hasVirusWarning = html.includes('Virus scan warning') || html.includes('virus scan warning') || html.includes('Google Drive - Virus scan warning');
    if (hasVirusWarning) {
      return { pass: false, item, status: 200, reason: 'contains_virus_scan_warning' };
    }

    return { pass: true, item, status: 200 };
  } catch (err) {
    return { pass: false, item, status: 0, reason: err.message };
  }
}

async function main() {
  const startTime = Date.now();
  for (let i = 0; i < textbooks.length; i += CONCURRENCY) {
    const batch = textbooks.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(checkViewerUrl));
    results.push(...batchResults);
    completed += batch.length;
    const passedSoFar = results.filter((r) => r.pass).length;
    const failedSoFar = results.length - passedSoFar;
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    process.stdout.write(`Verified ${completed}/${textbooks.length} textbooks (${passedSoFar} passed, ${failedSoFar} failed) [${elapsed}s]...\r`);
  }

  console.log('\n\n===============================================================');
  console.log('             384 TEXTBOOKS VIEWER URL AUDIT SUMMARY           ');
  console.log('===============================================================');
  const passed = results.filter((r) => r.pass);
  const failed = results.filter((r) => !r.pass);

  console.log(`Total Textbooks Evaluated : ${results.length}`);
  console.log(`Passed (200 & No Warning) : ${passed.length}`);
  console.log(`Failed / Interstitial     : ${failed.length}`);

  if (failed.length > 0) {
    console.log('\nFailures:');
    failed.forEach((f) => {
      console.log(`  ❌ ${f.item.classLevel} ${f.item.subject} (${f.item.medium}) - ${f.item.driveFileId}: ${f.reason} (HTTP ${f.status})`);
    });
  }

  const report = {
    evaluatedAt: new Date().toISOString(),
    totalEvaluated: results.length,
    passedCount: passed.length,
    failedCount: failed.length,
    failures: failed.map((f) => ({ id: f.item.id, driveFileId: f.item.driveFileId, reason: f.reason })),
    results: results.map((r) => ({
      id: r.item.id,
      classLevel: r.item.classLevel,
      subject: r.item.subject,
      medium: r.item.medium,
      driveFileId: r.item.driveFileId,
      viewerUrl: `https://drive.google.com/file/d/${r.item.driveFileId}/preview`,
      pass: r.pass,
      status: r.status,
      reason: r.reason || null,
    })),
  };

  fs.writeFileSync(path.join(rootDir, 'scripts', 'textbooks-viewer-audit.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log('Audit saved to scripts/textbooks-viewer-audit.json\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch(console.error);
}
