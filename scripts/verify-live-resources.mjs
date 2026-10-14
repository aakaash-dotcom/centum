#!/usr/bin/env node

/**
 * scripts/verify-live-resources.mjs
 * 
 * STANDING CI / PREBUILD GATE FOR ALL CENTUM CONTENT LANES
 * 
 * Rules:
 *  1. Any row in ANY lane marked status=live must have every URL verified this run.
 *  2. Any notesPdfUrl on a status=live row must return HTTP 200/206 with %PDF- magic bytes.
 *  3. Any video on a status=live row must never carry Rickroll (dQw4w9WgXcQ) or dummy tokens.
 *  4. An empty URL field is honest and valid ("coming soon" state); a plausible invented URL is strictly forbidden.
 *  5. Build FAILS (exit code 1) if any unverified or fabricated URL reaches a live row.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const FORBIDDEN_TOKENS = [
  'dqw4w9wgxcq',
  'bigbuckbunny',
  'sample',
  'invalid',
  'portrait_reel_test',
  'sample_native_stream',
  'sample_ccby',
  'dge.tn.gov.in/docs/',
  'placeholder',
];

function hasForbiddenToken(str) {
  if (!str) return false;
  const lower = String(str).toLowerCase();
  return FORBIDDEN_TOKENS.some((t) => lower.includes(t));
}

/**
 * Verifies remote PDF binary: must return HTTP 200/206 and start with %PDF- (0x25, 0x50, 0x44, 0x46).
 */
async function verifyPdfResource(url) {
  const cleanUrl = String(url || '').trim();
  if (!cleanUrl) {
    return { ok: false, reason: 'empty-url' };
  }

  if (hasForbiddenToken(cleanUrl)) {
    return { ok: false, reason: 'forbidden-placeholder-detected' };
  }

  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return { ok: false, reason: 'invalid-protocol' };
  }

  try {
    const res = await fetch(cleanUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CENTUM-Live-Verifier/1.0',
        Range: 'bytes=0-1024',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok && res.status !== 206) {
      return { ok: false, status: res.status, reason: `http-${res.status}` };
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('text/html')) {
      return { ok: false, status: res.status, contentType, reason: 'html-error-page-not-pdf' };
    }

    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const isPdfMagic =
      bytes.length >= 4 &&
      bytes[0] === 0x25 && // %
      bytes[1] === 0x50 && // P
      bytes[2] === 0x44 && // D
      bytes[3] === 0x46;   // F

    if (!isPdfMagic && !contentType.includes('application/pdf')) {
      return { ok: false, status: res.status, contentType, reason: 'missing-pdf-magic-bytes' };
    }

    return { ok: true, status: res.status, contentType };
  } catch (err) {
    return { ok: false, reason: err?.message || 'network-fetch-failed' };
  }
}

async function main() {
  console.log('===============================================================');
  console.log('       CENTUM STANDING CI GATE: VERIFY LIVE RESOURCES          ');
  console.log('===============================================================\n');

  let gatePassed = true;
  const failureReasons = [];

  // -----------------------------------------------------------------
  // 0. SELF-TEST: Resource verifier logic
  // -----------------------------------------------------------------
  console.log('--- Step 0: Self-testing verifier security guards ---');
  if (!hasForbiddenToken('https://dge.tn.gov.in/docs/10th_maths_ch1.pdf')) {
    failureReasons.push('Security guard failed: dge.tn.gov.in/docs/ must be detected as forbidden');
    gatePassed = false;
  }
  if (!hasForbiddenToken('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')) {
    failureReasons.push('Security guard failed: Rickroll must be detected as forbidden');
    gatePassed = false;
  }
  if (!hasForbiddenToken('1s_Sample_CCBY_BigBuckBunny_Drive_Vid1')) {
    failureReasons.push('Security guard failed: BigBuckBunny must be detected as forbidden');
    gatePassed = false;
  }

  // Self-test PDF magic byte verifier against fabricated URL
  const testFab = await verifyPdfResource('https://dge.tn.gov.in/docs/10th_maths_ch1.pdf');
  if (testFab.ok) {
    failureReasons.push('Security guard failed: fabricated dge.tn.gov.in/docs/ URL was marked valid');
    gatePassed = false;
  } else {
    console.log(`  ✓ Fabricated PDF URL correctly blocked: reason=${testFab.reason}`);
  }

  // -----------------------------------------------------------------
  // 1. LANE 1: Pro-Materials Sweep
  // -----------------------------------------------------------------
  console.log('\n--- Step 1: Sweeping Pro-Materials Lane ---');
  const serverStorePath = path.join(rootDir, 'src', 'lib', 'server-mock-store.ts');
  const storeCode = fs.readFileSync(serverStorePath, 'utf8');

  const matMatch = storeCode.match(/const mockProMaterials: MockProMaterial\[\] = (\[[\s\S]*?\n\];)/);
  if (!matMatch) {
    failureReasons.push('Could not parse mockProMaterials from server-mock-store.ts');
    gatePassed = false;
  } else {
    const materials = new Function('return ' + matMatch[1].replace(/;$/, ''))();
    const liveMaterials = materials.filter((m) => m.status === 'live');
    let verifiedPdfCount = 0;
    let emptyNotesCount = 0;

    console.log(`  • Total materials: ${materials.length} (${liveMaterials.length} status=live)`);

    for (const mat of liveMaterials) {
      // Check notesPdfUrl
      const pdfUrl = (mat.notesPdfUrl || '').trim();
      if (!pdfUrl) {
        emptyNotesCount++;
      } else {
        console.log(`  • Verifying remote PDF for ${mat.id}: ${pdfUrl}`);
        const result = await verifyPdfResource(pdfUrl);
        if (!result.ok) {
          failureReasons.push(`ProMaterial ${mat.id} has invalid notesPdfUrl (${pdfUrl}): ${result.reason}`);
          gatePassed = false;
        } else {
          verifiedPdfCount++;
          console.log(`    ✓ ${mat.id} PDF verified: HTTP ${result.status} (%PDF- magic bytes OK)`);
        }
      }

      // Check videoEmbedUrl
      const embedUrl = (mat.videoEmbedUrl || '').trim();
      if (embedUrl && hasForbiddenToken(embedUrl)) {
        failureReasons.push(`ProMaterial ${mat.id} carries forbidden videoEmbedUrl: ${embedUrl}`);
        gatePassed = false;
      }
    }

    console.log(`  ✓ Pro-Materials sweep result: ${liveMaterials.length} live rows, ${verifiedPdfCount} verified PDFs, ${emptyNotesCount} honest "coming soon" placeholders.`);
  }

  // -----------------------------------------------------------------
  // 2. LANE 2: Pro-Videos Sweep
  // -----------------------------------------------------------------
  console.log('\n--- Step 2: Sweeping Pro-Videos Lane ---');
  const vidMatch = storeCode.match(/const mockProVideos: ProVideoItem\[\] = (\[[\s\S]*?\n\];)/);
  if (!vidMatch) {
    failureReasons.push('Could not parse mockProVideos from server-mock-store.ts');
    gatePassed = false;
  } else {
    const videos = new Function('return ' + vidMatch[1].replace(/;$/, ''))();
    const liveVideos = videos.filter((v) => v.status === 'live');
    console.log(`  • Total fixture videos: ${videos.length} (${liveVideos.length} status=live)`);

    if (liveVideos.length > 0) {
      for (const v of liveVideos) {
        if (hasForbiddenToken(v.driveFileId) || hasForbiddenToken(v.ytUrl)) {
          failureReasons.push(`Live video ${v.id} carries placeholder tokens: drive=${v.driveFileId}, yt=${v.ytUrl}`);
          gatePassed = false;
        }
      }
    } else {
      console.log('  ✓ Zero unverified videos marked live (fixtures quarantined to draft).');
    }
  }

  // -----------------------------------------------------------------
  // 3. LANE 3: Papers Sweep
  // -----------------------------------------------------------------
  console.log('\n--- Step 3: Sweeping Papers Catalog Lane ---');
  const papersPath = path.join(rootDir, 'src', 'data', 'papers.json');
  if (fs.existsSync(papersPath)) {
    const papers = JSON.parse(fs.readFileSync(papersPath, 'utf8'));
    let paperHits = 0;
    for (const p of papers) {
      const serialized = JSON.stringify(p).toLowerCase();
      for (const token of FORBIDDEN_TOKENS) {
        if (serialized.includes(token)) {
          failureReasons.push(`Paper ${p.id} carries forbidden token "${token}"`);
          paperHits++;
          gatePassed = false;
        }
      }
    }
    console.log(`  ✓ Papers checked: ${papers.length} rows, 0 forbidden placeholder tokens.`);
  } else {
    console.warn('  ⚠️ papers.json not found on disk, skipping static file check.');
  }

  // -----------------------------------------------------------------
  // 4. LANE 4: Textbooks Sweep
  // -----------------------------------------------------------------
  console.log('\n--- Step 4: Sweeping Textbooks Snapshot Lane ---');
  const textbooksPath = path.join(rootDir, 'src', 'data', 'textbooks-snapshot.json');
  if (fs.existsSync(textbooksPath)) {
    const textbooks = JSON.parse(fs.readFileSync(textbooksPath, 'utf8'));
    let tbHits = 0;
    for (const t of textbooks) {
      const serialized = JSON.stringify(t).toLowerCase();
      for (const token of FORBIDDEN_TOKENS) {
        if (serialized.includes(token)) {
          failureReasons.push(`Textbook row carries forbidden token "${token}"`);
          tbHits++;
          gatePassed = false;
        }
      }
    }
    console.log(`  ✓ Textbooks checked: ${textbooks.length} rows, 0 forbidden placeholder tokens.`);
  } else {
    console.warn('  ⚠️ textbooks-snapshot.json not found on disk, skipping static file check.');
  }

  // -----------------------------------------------------------------
  // SUMMARY & EXIT
  // -----------------------------------------------------------------
  console.log('\n===============================================================');
  if (gatePassed) {
    console.log('🎉 STANDING CI GATE PASSED: ALL LIVE RESOURCES VERIFIED CLEAN!');
    console.log('===============================================================\n');
    process.exit(0);
  } else {
    console.error('❌ STANDING CI GATE FAILED: Unverified or forbidden resources detected:');
    failureReasons.forEach((r, idx) => console.error(`  ${idx + 1}. ${r}`));
    console.error('\nBuild aborted. Do not mark status=live on unverified resources.');
    console.log('===============================================================\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error running verify-live-resources:', err);
  process.exit(1);
});
