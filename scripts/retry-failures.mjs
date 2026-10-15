import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractAllTextFromPdfBuffer } from './verify-all-701-papers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const reportPath = path.join(rootDir, 'scripts', 'verification-results-701.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

console.log(`Retrying ${report.failures.length} files that had transient timeouts/503s...\n`);

const FORBIDDEN_TOKENS = ['padasalai', 'trbtnpsc', 'cbsetips', '@gmail.com'];

async function retryFile(f) {
  const url = `https://drive.google.com/uc?id=${f.newDriveFileId}&export=download`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CENTUM-Retry-Verifier/1.0',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return { pass: false, id: f.id, reason: `HTTP_${res.status}` };
    const buf = Buffer.from(await res.arrayBuffer());
    const isPdf = buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
    if (!isPdf) return { pass: false, id: f.id, reason: 'missing_pdf_magic_bytes' };

    const fullText = extractAllTextFromPdfBuffer(buf);
    const hasBrand = fullText.includes('ravi');
    if (!hasBrand) return { pass: false, id: f.id, reason: 'missing_ravi_brand' };

    const matchedForbidden = FORBIDDEN_TOKENS.filter((t) => fullText.includes(t));
    if (matchedForbidden.length > 0) return { pass: false, id: f.id, reason: `forbidden_${matchedForbidden.join('_')}` };

    return { pass: true, id: f.id, newDriveFileId: f.newDriveFileId };
  } catch (err) {
    return { pass: false, id: f.id, reason: err.message };
  }
}

async function main() {
  const newFailures = [];
  let recoveredCount = 0;

  for (const f of report.failures) {
    console.log(`Checking ${f.id} (${f.newDriveFileId})...`);
    const r = await retryFile(f);
    if (r.pass) {
      console.log(`  ✓ RECOVERED & PASSED: ${f.id}`);
      recoveredCount++;
      // Add to verifiedItems
      report.verifiedItems.push({ id: f.id, newId: f.newDriveFileId });
    } else {
      console.log(`  ❌ Still failed: ${f.id} (${r.reason})`);
      newFailures.push({ id: f.id, newDriveFileId: f.newDriveFileId, reason: r.reason });
    }
  }

  console.log(`\nRecovered: ${recoveredCount}, Still Failed: ${newFailures.length}`);
  report.passedCount += recoveredCount;
  report.failedCount = newFailures.length;
  report.failures = newFailures;

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`Updated verification report: ${report.passedCount} passed, ${report.failedCount} failed.`);
}

main().catch(console.error);
