#!/usr/bin/env node

/**
 * scripts/verify-all-701-papers.mjs
 * 
 * Comprehensive pre-ship verification for all 701 candidate swapped papers:
 * 1. HTTP 200
 * 2. Body starts with %PDF-
 * 3. The Ravi's Tuition brand is present in the extracted text or vector layer
 * 4. No padasalai, trbtnpsc, cbsetips, or @gmail.com anywhere in the file
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const swapMapPath = path.join(rootDir, 'scripts', 'PHASE1_APP_SWAP_MAP.json');
const mapData = JSON.parse(fs.readFileSync(swapMapPath, 'utf8'));

const candidateFiles = mapData.files.filter((f) => f.status === 'ok');
console.log(`Starting rigorous verification of all ${candidateFiles.length} candidate swapped files...\n`);

const FORBIDDEN_TOKENS = ['padasalai', 'trbtnpsc', 'cbsetips', '@gmail.com'];

export function extractAllTextFromPdfBuffer(buf) {
  let text = '';
  let start = 0;
  while ((start = buf.indexOf('stream', start)) !== -1) {
    start += 6;
    if (buf[start] === 13) start++;
    if (buf[start] === 10) start++;
    const end = buf.indexOf('endstream', start);
    if (end === -1) break;
    let streamBuf = buf.subarray(start, end);
    if (streamBuf[streamBuf.length - 1] === 10) streamBuf = streamBuf.subarray(0, streamBuf.length - 1);
    if (streamBuf[streamBuf.length - 1] === 13) streamBuf = streamBuf.subarray(0, streamBuf.length - 1);

    let decoded = '';
    try {
      decoded = zlib.inflateSync(streamBuf).toString('latin1');
    } catch {
      try {
        decoded = zlib.inflateRawSync(streamBuf).toString('latin1');
      } catch {
        decoded = streamBuf.toString('latin1');
      }
    }

    // Decode hex strings like <52415649...>
    const hexDecoded = decoded.replace(/<([0-9a-fA-F\s]+)>/g, (_, hex) => {
      const cleanHex = hex.replace(/\s+/g, '');
      if (cleanHex.length % 2 !== 0) return '';
      return Buffer.from(cleanHex, 'hex').toString('latin1');
    });

    text += '\n' + decoded + '\n' + hexDecoded;
    start = end + 9;
  }
  text += '\n' + buf.toString('latin1');
  return text.toLowerCase();
}

async function verifySingleFile(item, index, total) {
  const newId = item.newDriveFileId;
  const url = `https://drive.google.com/uc?id=${newId}&export=download`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CENTUM-Swap-Verifier/1.0',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      return { pass: false, reason: `HTTP_${res.status}`, item };
    }

    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);

    // 1. Magic bytes check (%PDF-)
    const isPdf = buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
    if (!isPdf) {
      return { pass: false, reason: 'missing_pdf_magic_bytes', item };
    }

    // 2. Text layer extraction
    const fullText = extractAllTextFromPdfBuffer(buf);

    // 3. Brand presence check
    const hasBrand = fullText.includes('ravi');
    if (!hasBrand) {
      return { pass: false, reason: 'missing_ravi_brand', item };
    }

    // 4. Forbidden watermark check
    const matchedForbidden = FORBIDDEN_TOKENS.filter((t) => fullText.includes(t));
    if (matchedForbidden.length > 0) {
      return { pass: false, reason: `forbidden_token_${matchedForbidden.join('_')}`, item };
    }

    return { pass: true, item, sizeBytes: buf.length };
  } catch (err) {
    return { pass: false, reason: err?.message || 'fetch_error', item };
  }
}

async function main() {
  const CONCURRENCY = 14;
  const results = [];
  let passedCount = 0;
  let failedCount = 0;
  const failures = [];

  const startTime = Date.now();

  for (let i = 0; i < candidateFiles.length; i += CONCURRENCY) {
    const chunk = candidateFiles.slice(i, i + CONCURRENCY);
    const chunkPromises = chunk.map((item, idx) => verifySingleFile(item, i + idx + 1, candidateFiles.length));
    const chunkResults = await Promise.all(chunkPromises);

    for (const r of chunkResults) {
      results.push(r);
      if (r.pass) {
        passedCount++;
      } else {
        failedCount++;
        failures.push(r);
        console.warn(`❌ Verification FAILED for ${r.item.id} (${r.item.newDriveFileId}): ${r.reason}`);
      }
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    process.stdout.write(`Verified ${results.length}/${candidateFiles.length} files (${passedCount} passed, ${failedCount} failed) [${elapsed}s]...\r`);
  }

  console.log('\n\n===============================================================');
  console.log('             701 CANDIDATE PAPERS VERIFICATION SUMMARY         ');
  console.log('===============================================================');
  console.log(`Total Candidates Evaluated : ${candidateFiles.length}`);
  console.log(`Passed All 4 Criteria      : ${passedCount}`);
  console.log(`Failed Any Criterion       : ${failedCount}`);

  // Breakdown by class
  const classBreakdown = {};
  for (const r of results) {
    const cls = r.item.classLevel || 'unknown';
    if (!classBreakdown[cls]) classBreakdown[cls] = { total: 0, passed: 0, failed: 0 };
    classBreakdown[cls].total++;
    if (r.pass) classBreakdown[cls].passed++;
    else classBreakdown[cls].failed++;
  }

  console.log('\nBreakdown by Class:');
  for (const [cls, counts] of Object.entries(classBreakdown)) {
    console.log(`  • Class ${cls.padEnd(5)}: ${counts.passed}/${counts.total} passed (${counts.failed} failed)`);
  }

  const resultReport = {
    evaluatedAt: new Date().toISOString(),
    totalEvaluated: candidateFiles.length,
    passedCount,
    failedCount,
    classBreakdown,
    failures: failures.map((f) => ({ id: f.item.id, newDriveFileId: f.item.newDriveFileId, reason: f.reason })),
    verifiedItems: results.filter((r) => r.pass).map((r) => ({ id: r.item.id, oldId: r.item.oldDriveFileId, newId: r.item.newDriveFileId, classLevel: r.item.classLevel })),
  };

  fs.writeFileSync(path.join(rootDir, 'scripts', 'verification-results-701.json'), JSON.stringify(resultReport, null, 2), 'utf8');
  console.log('\nVerification report saved to scripts/verification-results-701.json');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch(console.error);
}
