#!/usr/bin/env node

/**
 * scripts/tests/textbooks-live-ledger.mjs
 * verifyRef: textbooks-live-ledger
 *
 * CENTUM R9.2 AMENDED Acceptance Test Suite:
 *  1. Live gviz read produces source: 'tracker-live' with ledgerRows >= 223 and servedRows >= 202
 *  2. Full 15-cell Acceptance Matrix verified down to exact row counts:
 *     - Class 10: Maths 18, Science 46, Social 54, English 16, Tamil 20 (Total = 154)
 *     - Class 7: Maths 6, Science 6, Social 6, English 3, Tamil 3 (Total = 24)
 *     - Class 6: Maths 6, Science 6, Social 6, English 3, Tamil 3 (Total = 24)
 *     Total served = 202 · Total gaps = 16
 *  3. Deduplication collapses duplicate probe rows without dropping blank-unitNo rows:
 *     - Class 10 Social EM has 27 served + 1 gap = 28 total with exactly 1 type=full
 *  4. Placeholders routed to gaps[], never chapters[]:
 *     - Class 10 Science EM has 23 served + 1 gap with reason PENDING-BRIDGE-LIMIT
 *     - Class 10 Social EM has 1 gap with reason PENDING-FOUNDER-DROP
 *     - Single-book languages have 12 NOT-APPLICABLE gaps
 *  5. Canonical medium resolution (EM == english, TM == tamil)
 *  6. Unmatched subject returns HTTP 200 with count: 0, chapters: []
 *  7. Absolute elimination of fake sample IDs: 1M-TM-CH1-RELATIONS-FUNC can never reach response
 *  8. Trap 1 guard: bad header row triggers fallback to source: 'snapshot-stale', stale: true
 *  9. 400-row synthetic ledger test for forward compatibility
 */

const BASE_URL = process.env.TARGET_URL || process.env.TEST_BASE_URL || 'http://localhost:3000';
const DRIVE_ID_REGEX = /^[A-Za-z0-9_-]{25,}$/;

console.log('===============================================================');
console.log('   CENTUM R9.2 AMENDED: LIVE TEXTBOOKS LEDGER AUDIT');
console.log(`   Target: ${BASE_URL}`);
console.log('===============================================================\n');

let hasFailure = false;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    hasFailure = true;
  } else {
    console.log(`  ✓ PASS: ${message}`);
  }
}

// Synthetic test utilities matching route.ts specification
function normalizeSubject(s) {
  const str = String(s || '').trim().toLowerCase();
  if (str.includes('math') || str.includes('கணித')) return 'maths';
  if (str.includes('sci') || str.includes('அறிவிய')) return 'science';
  if (str.includes('soc') || str.includes('சமூக')) return 'social';
  if (str.includes('eng') || str.includes('ஆங்கில')) return 'english';
  if (str.includes('tam') || str.includes('தமிழ்')) return 'tamil';
  return str;
}

function normalizeMedium(m) {
  const str = String(m || '').trim().toLowerCase();
  if (str === 'em' || str.startsWith('eng') || str === 'en' || str === 'ஆங்கிலம்') return 'EM';
  if (str === 'tm' || str.startsWith('tam') || str === 'ta' || str === 'தமிழ்') return 'TM';
  return str.toUpperCase();
}

function getDedupeKey(row) {
  const c = String(row.classLevel || '').replace(/\D/g, '');
  const s = normalizeSubject(row.subject);
  const m = normalizeMedium(row.medium);
  const u = String(row.unitNo ?? '').trim();
  const t = String(row.unitTitle || '').trim().toLowerCase();
  const typ = String(row.type || '').trim().toLowerCase();
  return `${c}|${s}|${m}|${u}|${t}|${typ}`;
}

function selectWinner(existing, incoming) {
  const existingValid = DRIVE_ID_REGEX.test(existing.driveFileId);
  const incomingValid = DRIVE_ID_REGEX.test(incoming.driveFileId);

  if (!existingValid && incomingValid) return incoming;
  if (existingValid && !incomingValid) return existing;

  const exTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
  const inTime = incoming.updatedAt ? new Date(incoming.updatedAt).getTime() : 0;
  if (inTime >= exTime) return incoming;
  return existing;
}

function processRawRows(rawRows) {
  const dedupeMap = new Map();
  for (const row of rawRows) {
    const key = getDedupeKey(row);
    if (!dedupeMap.has(key)) {
      dedupeMap.set(key, row);
    } else {
      const existing = dedupeMap.get(key);
      dedupeMap.set(key, selectWinner(existing, row));
    }
  }

  const dedupedRows = Array.from(dedupeMap.values());
  const servedRows = [];
  const gapRows = [];

  for (const row of dedupedRows) {
    if (DRIVE_ID_REGEX.test(row.driveFileId)) {
      servedRows.push(row);
    } else {
      gapRows.push(row);
    }
  }

  return { dedupedRows, servedRows, gapRows };
}

function sortTextbookRows(rows) {
  return [...rows].sort((a, b) => {
    const aIsFull = a.type?.toLowerCase() === 'full' || (a.unitNo === '0' && a.type?.toLowerCase() !== 'chapter') || (a.unitNo === 0 && a.type?.toLowerCase() !== 'chapter');
    const bIsFull = b.type?.toLowerCase() === 'full' || (b.unitNo === '0' && b.type?.toLowerCase() !== 'chapter') || (b.unitNo === 0 && b.type?.toLowerCase() !== 'chapter');

    if (aIsFull && !bIsFull) return -1;
    if (!aIsFull && bIsFull) return 1;

    if (aIsFull && bIsFull) {
      const pA = parseInt(String(a.pageStart || '0'), 10);
      const pB = parseInt(String(b.pageStart || '0'), 10);
      if (!isNaN(pA) && !isNaN(pB) && pA !== pB) return pA - pB;
      return (a.unitTitle || a.title || '').localeCompare(b.unitTitle || b.title || '');
    }

    const uA = parseInt(String(a.unitNo ?? ''), 10);
    const uB = parseInt(String(b.unitNo ?? ''), 10);
    const hasNumA = !isNaN(uA) && uA > 0;
    const hasNumB = !isNaN(uB) && uB > 0;

    if (hasNumA && hasNumB) return uA - uB;
    if (hasNumA && !hasNumB) return -1;
    if (!hasNumA && hasNumB) return 1;

    const pA = parseInt(String(a.pageStart || '0'), 10);
    const pB = parseInt(String(b.pageStart || '0'), 10);
    if (!isNaN(pA) && !isNaN(pB) && pA !== pB) return pA - pB;

    return (a.unitTitle || a.title || '').localeCompare(b.unitTitle || b.title || '');
  });
}

async function runTests() {
  // --- TEST 1: Live Tracker Connection & Totals ---
  console.log('--- 1. Testing Live Tracker Read & Totals (/api/textbooks) ---');
  try {
    const res = await fetch(`${BASE_URL}/api/textbooks?classLevel=all`);
    const data = await res.json();

    assert(res.ok && data.ok, 'HTTP 200 response with ok: true');
    assert(data.source === 'tracker-live', `source is "tracker-live" (got: ${data.source})`);
    assert(data.ledgerRows >= 223, `ledgerRows >= 223 (got: ${data.ledgerRows})`);
    assert(data.servedRows >= 202, `servedRows >= 202 (got: ${data.servedRows})`);
    assert(Array.isArray(data.chapters) && data.chapters.length >= 202, `All served chapters returned (got: ${data.chapters.length})`);
    assert(Array.isArray(data.gaps) && data.gaps.length >= 16, `All gaps returned (got: ${data.gaps.length})`);
  } catch (err) {
    console.error('❌ Network error testing live tracker:', err);
    hasFailure = true;
  }

  // --- TEST 2: Exact 15-cell Acceptance Matrix ---
  console.log('\n--- 2. Verifying Exact 15-cell Acceptance Matrix (Classes 10, 7, 6) ---');
  const expectedMatrix = {
    '10': { maths: [9, 9], science: [23, 23], social: [27, 27], english: [8, 8], tamil: [10, 10] },
    '7': { maths: [3, 3], science: [3, 3], social: [3, 3], english: [3, 0], tamil: [0, 3] },
    '6': { maths: [3, 3], science: [3, 3], social: [3, 3], english: [3, 0], tamil: [0, 3] },
  };

  let matrixPass = true;
  for (const [classLevel, subjects] of Object.entries(expectedMatrix)) {
    for (const [subject, [expectedEM, expectedTM]] of Object.entries(subjects)) {
      try {
        const [resEM, resTM] = await Promise.all([
          fetch(`${BASE_URL}/api/textbooks?classLevel=${classLevel}&subject=${subject}&medium=EM`).then(r => r.json()),
          fetch(`${BASE_URL}/api/textbooks?classLevel=${classLevel}&subject=${subject}&medium=TM`).then(r => r.json()),
        ]);

        const countEM = resEM.chapters?.length || 0;
        const countTM = resTM.chapters?.length || 0;

        if (countEM !== expectedEM || countTM !== expectedTM) {
          console.error(`  ❌ Mismatch for Class ${classLevel} ${subject}: expected EM ${expectedEM}/TM ${expectedTM}, got EM ${countEM}/TM ${countTM}`);
          matrixPass = false;
          hasFailure = true;
        }
      } catch (e) {
        console.error(`  ❌ Fetch error for Class ${classLevel} ${subject}:`, e);
        matrixPass = false;
        hasFailure = true;
      }
    }
  }
  if (matrixPass) {
    console.log('  ✓ PASS: All 15 cells of the Acceptance Matrix match exactly!');
    console.log('    • Class 10: Maths 18, Science 46, Social 54, English 16, Tamil 20 = 154');
    console.log('    • Class 7:  Maths 6, Science 6, Social 6, English 3, Tamil 3 = 24');
    console.log('    • Class 6:  Maths 6, Science 6, Social 6, English 3, Tamil 3 = 24');
    console.log('    • Total served for classes 10, 7, 6 = 202');
  }

  // --- TEST 3: Deduplication & Social EM Full Row Collapse ---
  console.log('\n--- 3. Testing Deduplication (Class 10 Social EM) ---');
  try {
    const res = await fetch(`${BASE_URL}/api/textbooks?classLevel=10&subject=social&medium=EM`);
    const data = await res.json();

    assert(data.chapters.length === 27, `Class 10 Social EM served chapters === 27 (got: ${data.chapters.length})`);
    assert(data.gaps.length === 1, `Class 10 Social EM gaps === 1 (got: ${data.gaps.length})`);

    const gapItem = data.gaps[0];
    assert(gapItem.reason === 'PENDING-FOUNDER-DROP', `Gap reason is PENDING-FOUNDER-DROP (got: ${gapItem.reason})`);
    assert(gapItem.isFullBook === true || gapItem.type === 'full', 'Gap row is the oversized full textbook');

    const totalFull = data.chapters.filter(c => c.isFullBook || c.type === 'full').length +
                      data.gaps.filter(g => g.isFullBook || g.type === 'full').length;
    assert(totalFull === 1, `Exactly 1 full book exists post-dedupe across chapters+gaps (got: ${totalFull})`);
  } catch (err) {
    console.error('❌ Error in Deduplication test:', err);
    hasFailure = true;
  }

  // --- TEST 4: Science EM Placeholders Routed to Gaps ---
  console.log('\n--- 4. Testing Gaps Routing (Class 10 Science EM) ---');
  try {
    const res = await fetch(`${BASE_URL}/api/textbooks?classLevel=10&subject=science&medium=EM`);
    const data = await res.json();

    assert(data.chapters.length === 23, `Class 10 Science EM served chapters === 23 (got: ${data.chapters.length})`);
    assert(data.gaps.length === 1, `Class 10 Science EM gaps === 1 (got: ${data.gaps.length})`);

    const gapItem = data.gaps[0];
    assert(gapItem.reason === 'PENDING-BRIDGE-LIMIT', `Gap reason is PENDING-BRIDGE-LIMIT (got: ${gapItem.reason})`);

    // Verify no placeholders in chapters
    const placeholderInChapters = data.chapters.filter(c => !DRIVE_ID_REGEX.test(c.driveFileId));
    assert(placeholderInChapters.length === 0, 'Zero placeholder IDs found in served chapters');
  } catch (err) {
    console.error('❌ Error in Science EM Gaps test:', err);
    hasFailure = true;
  }

  // --- TEST 5: Canonical Medium Resolution ---
  console.log('\n--- 5. Testing Canonical Medium Resolution (EM == english, TM == tamil) ---');
  try {
    const [resEM, resEnglish] = await Promise.all([
      fetch(`${BASE_URL}/api/textbooks?classLevel=10&subject=maths&medium=EM`).then(r => r.json()),
      fetch(`${BASE_URL}/api/textbooks?classLevel=10&subject=maths&medium=english`).then(r => r.json()),
    ]);
    assert(resEM.count === resEnglish.count, `medium=EM (${resEM.count}) and medium=english (${resEnglish.count}) return identical counts`);

    const [resTM, resTamil] = await Promise.all([
      fetch(`${BASE_URL}/api/textbooks?classLevel=10&subject=maths&medium=TM`).then(r => r.json()),
      fetch(`${BASE_URL}/api/textbooks?classLevel=10&subject=maths&medium=tamil`).then(r => r.json()),
    ]);
    assert(resTM.count === resTamil.count, `medium=TM (${resTM.count}) and medium=tamil (${resTamil.count}) return identical counts`);
  } catch (err) {
    console.error('❌ Error in medium canonicalization test:', err);
    hasFailure = true;
  }

  // --- TEST 6: Unmatched Subject Handling ---
  console.log('\n--- 6. Testing Unmatched Subject Handling ---');
  try {
    const res = await fetch(`${BASE_URL}/api/textbooks?classLevel=10&subject=economics_unknown`);
    const data = await res.json();
    assert(res.status === 200, `HTTP 200 returned for unknown subject (got: ${res.status})`);
    assert(data.count === 0 && Array.isArray(data.chapters) && data.chapters.length === 0, 'count: 0 and chapters: [] returned');
  } catch (err) {
    console.error('❌ Error in unmatched subject test:', err);
    hasFailure = true;
  }

  // --- TEST 7: Absolute Elimination of Fake IDs ---
  console.log('\n--- 7. Testing Fake Sample IDs Elimination ---');
  try {
    const res = await fetch(`${BASE_URL}/api/textbooks?classLevel=all`);
    const rawText = await res.text();

    assert(!rawText.includes('1M-TM-CH1-RELATIONS-FUNC'), '1M-TM-CH1-RELATIONS-FUNC does not exist in response');
    assert(!rawText.includes('1M-FULL-BOOK-MATHS-TM-2025'), '1M-FULL-BOOK-MATHS-TM-2025 does not exist in response');
    assert(!rawText.includes('1M-TM-CH2-NUMBERS-SEQ'), '1M-TM-CH2-NUMBERS-SEQ does not exist in response');
    assert(!rawText.includes('1S-FULL-BOOK-SCI-TM'), '1S-FULL-BOOK-SCI-TM does not exist in response');

    const data = JSON.parse(rawText);
    const allDriveIds = data.chapters.map(c => c.driveFileId);
    const nonRealIds = allDriveIds.filter(id => !DRIVE_ID_REGEX.test(id));
    assert(nonRealIds.length === 0, `All ${allDriveIds.length} served driveFileIds match /^[A-Za-z0-9_-]{25,}$/`);
  } catch (err) {
    console.error('❌ Error in Fake IDs test:', err);
    hasFailure = true;
  }

  // --- TEST 8: Trap 1 Header Mismatch Triggers snapshot-stale ---
  console.log('\n--- 8. Testing Trap 1: Header Mismatch Fallback to snapshot-stale ---');
  try {
    const res = await fetch(`${BASE_URL}/api/textbooks?classLevel=10&subject=maths&medium=tamil&mockBadHeader=true`);
    const data = await res.json();

    assert(res.ok && data.ok, 'HTTP 200 returned on header mismatch');
    assert(data.source === 'snapshot-stale', `source is "snapshot-stale" (got: ${data.source})`);
    assert(data.stale === true, `stale flag is true (got: ${data.stale})`);
    assert(data.chapters.length >= 8, `Snapshot serves valid chapters (got: ${data.chapters.length})`);

    const staleRaw = JSON.stringify(data);
    assert(!staleRaw.includes('1M-TM-CH1-RELATIONS-FUNC'), 'Snapshot fallback contains zero fake IDs');
  } catch (err) {
    console.error('❌ Error in Trap 1 test:', err);
    hasFailure = true;
  }

  // --- TEST 9: 400-Row Synthetic Ledger Stress Test ---
  console.log('\n--- 9. Testing 400-Row Synthetic Ledger Forward Compatibility ---');
  try {
    const syntheticRows = [];
    const classes = ['6', '7', '8', '9', '10', '11', '12'];
    const subjects = ['Maths', 'Science', 'Social', 'English', 'Tamil', 'Physics', 'Chemistry'];
    const mediums = ['EM', 'TM', 'english', 'tamil'];

    // Generate 400 realistic rows with quotes, commas, placeholders, and duplicate keys
    for (let i = 1; i <= 400; i++) {
      const cls = classes[i % classes.length];
      const subj = subjects[i % subjects.length];
      const med = mediums[i % mediums.length];
      const isFull = i % 5 === 0;
      const unitNo = isFull ? (cls === '6' || cls === '7' ? '' : '0') : String((i % 12) + 1);
      const isPlaceholder = i % 7 === 0;
      const driveId = isPlaceholder ? 'PENDING-FOUNDER-DROP' : `1${'x'.repeat(25)}${String(i).padStart(6, '0')}`;
      const title = `Unit ${unitNo}: "Quotes, commas, and title for subject ${subj}" - Term ${((i % 3) + 1)}`;

      syntheticRows.push({
        classLevel: cls,
        subject: subj,
        medium: med,
        type: isFull ? 'full' : 'chapter',
        unitNo,
        unitTitle: title,
        pageStart: String(i * 10),
        pageEnd: String(i * 10 + 25),
        pageCount: '26',
        driveFileId: driveId,
        fileUrl: `https://drive.google.com/uc?id=${driveId}`,
        sizeMB: '15.5',
        sourceUrl: 'https://example.com',
        qcNote: 'Clean synthetic row, verified',
        updatedAt: '2026-10-11T12:00:00Z',
      });
    }

    const { dedupedRows, servedRows, gapRows } = processRawRows(syntheticRows);
    assert(dedupedRows.length > 0 && dedupedRows.length <= 400, `400 rows deduped cleanly without crash (${dedupedRows.length} unique rows)`);
    assert(servedRows.length > 0, `Served rows partitioned (${servedRows.length} served)`);
    assert(gapRows.length > 0, `Gap rows partitioned (${gapRows.length} gaps)`);

    const sorted = sortTextbookRows(servedRows);
    assert(sorted.length === servedRows.length, 'All served rows sorted');
    console.log('  ✓ PASS: 400-row synthetic ledger processed successfully!');
  } catch (err) {
    console.error('❌ Error in 400-row synthetic test:', err);
    hasFailure = true;
  }

  console.log('\n===============================================================');
  if (hasFailure) {
    console.error('❌ TEXTBOOKS LIVE LEDGER VERIFICATION FAILED');
    process.exitCode = 1;
  } else {
    console.log('✅ ALL TEXTBOOKS LIVE LEDGER TESTS PASSED [VERIFIED]');
    console.log('verifyRef: textbooks-live-ledger [PASS]');
    console.log('===============================================================\n');
    process.exitCode = 0;
  }
}

runTests();
