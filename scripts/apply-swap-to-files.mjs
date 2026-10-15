#!/usr/bin/env node

/**
 * scripts/apply-swap-to-files.mjs
 * 
 * Applies the 701 verified paper swaps to:
 * 1. src/data/papers.json (static fallback & client bundle chunk)
 * 2. src/data/paper-swaps.json (overlay map for live API route)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const mapPath = path.join(rootDir, 'scripts', 'PHASE1_APP_SWAP_MAP.json');
const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

const verificationPath = path.join(rootDir, 'scripts', 'verification-results-701.json');
const verification = JSON.parse(fs.readFileSync(verificationPath, 'utf8'));

const verifiedSet = new Set(verification.verifiedItems.map((v) => v.id));
console.log(`Verified passing set count: ${verifiedSet.size}`);

// Build mapping table: appId -> { oldDriveFileId, newDriveFileId }
const swapMap = {};
let okCount = 0;
let skipCount = 0;
let failCount = 0;

for (const f of mapData.files) {
  if (f.status === 'ok' && verifiedSet.has(f.id)) {
    swapMap[f.id] = f.newDriveFileId;
    okCount++;
  } else if (f.status === 'skip') {
    skipCount++;
  } else if (f.status === 'fail') {
    failCount++;
  }
}

console.log(`Prepared swap table: ${okCount} swaps to apply, ${skipCount} skips, ${failCount} fails.`);

// Write src/data/paper-swaps.json
const swapsJsonPath = path.join(rootDir, 'src', 'data', 'paper-swaps.json');
fs.writeFileSync(swapsJsonPath, JSON.stringify(swapMap, null, 2) + '\n', 'utf8');
console.log(`Saved ${Object.keys(swapMap).length} swaps to src/data/paper-swaps.json.`);

// Update src/data/papers.json
const papersJsonPath = path.join(rootDir, 'src', 'data', 'papers.json');
const papers = JSON.parse(fs.readFileSync(papersJsonPath, 'utf8'));

let updatedCount = 0;
let unchangedCount = 0;

const updatedPapers = papers.map((p) => {
  const newDriveId = swapMap[p.id];
  if (newDriveId) {
    updatedCount++;
    return {
      ...p,
      driveFileId: newDriveId,
      pdfUrl: `https://drive.google.com/uc?id=${newDriveId}&export=download`,
    };
  } else {
    unchangedCount++;
    return p;
  }
});

fs.writeFileSync(papersJsonPath, JSON.stringify(updatedPapers, null, 2) + '\n', 'utf8');
console.log(`\nUpdated src/data/papers.json:`);
console.log(`  • Total papers     : ${updatedPapers.length}`);
console.log(`  • Swapped papers   : ${updatedCount}`);
console.log(`  • Unchanged papers : ${unchangedCount} (${skipCount} skip + ${failCount} fail)`);
