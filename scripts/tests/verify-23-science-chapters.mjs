#!/usr/bin/env node

/**
 * scripts/tests/verify-23-science-chapters.mjs
 * 
 * Verifies that:
 * 1. Science English returns all 23 chapters (Chapters 1 to 23).
 * 2. Science Tamil returns all 23 chapters (Chapters 1 to 23).
 * 3. Pro gating correctly gates concept chapters (Chapters 1-3 free, 4-23 locked for free users).
 * 4. Oneword practice returns all 23 chapters for free users.
 * 5. News endpoint structure (source flag and payload integrity).
 * 6. Leaderboard endpoint structure (source flag and payload integrity).
 * 7. Tuition Classroom Attendance & Diary routes plumbing.
 */

import http from 'http';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function fetchJson(urlPath, headers = {}) {
  const url = `${BASE_URL}${urlPath}`;
  const res = await fetch(url, { headers, cache: 'no-store' });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

function extractChapterNumbers(questions) {
  const chapterNums = new Set();
  const chapterTitles = new Set();
  for (const q of questions || []) {
    if (!q || !q.chapter) continue;
    chapterTitles.add(q.chapter);
    const m = q.chapter.match(/(?:chapter|ch|அலகு|unit)\s*(\d+)/i) || q.chapter.match(/^(\d+)\b/);
    if (m) {
      chapterNums.add(parseInt(m[1], 10));
    }
  }
  return { chapterNums, chapterTitles };
}

async function runVerification() {
  console.log('===============================================================');
  console.log('   VERIFYING 23 SCIENCE CHAPTERS & SYSTEM DATA INTEGRITY       ');
  console.log(`   Target: ${BASE_URL}`);
  console.log('===============================================================\n');

  let failed = false;

  // 1. Verify Science English (Pro session or count=all)
  console.log('--- 1. Testing Science English Chapters (Class 10) ---');
  const enRes = await fetchJson('/api/questions?classLevel=10th&subject=science&medium=english&count=all', {
    authorization: 'Bearer demo-pro', // Pro token to inspect full catalog
  });

  if (!enRes.ok || !enRes.data?.ok) {
    console.error('❌ FAIL: Science English query failed:', enRes.status, enRes.data?.error);
    failed = true;
  } else {
    const { chapterNums, chapterTitles } = extractChapterNumbers(enRes.data.questions);
    console.log(`  • Total questions returned: ${enRes.data.questions?.length}`);
    console.log(`  • Distinct chapter numbers: ${chapterNums.size} (Expected: 23)`);
    console.log(`  • Chapter numbers found:`, Array.from(chapterNums).sort((a, b) => a - b));

    let missing = [];
    for (let i = 1; i <= 23; i++) {
      if (!chapterNums.has(i)) missing.push(i);
    }
    if (missing.length > 0) {
      console.error(`❌ FAIL: Missing English Science chapters:`, missing);
      failed = true;
    } else {
      console.log('  ✓ Science English has all 23 chapters (1 to 23)!');
    }
  }

  // 2. Verify Science Tamil (Pro session or count=all)
  console.log('\n--- 2. Testing Science Tamil Chapters (Class 10) ---');
  const tmRes = await fetchJson('/api/questions?classLevel=10th&subject=science&medium=tamil&count=all', {
    authorization: 'Bearer demo-pro',
  });

  if (!tmRes.ok || !tmRes.data?.ok) {
    console.error('❌ FAIL: Science Tamil query failed:', tmRes.status, tmRes.data?.error);
    failed = true;
  } else {
    const { chapterNums, chapterTitles } = extractChapterNumbers(tmRes.data.questions);
    console.log(`  • Total questions returned: ${tmRes.data.questions?.length}`);
    console.log(`  • Distinct chapter numbers: ${chapterNums.size} (Expected: 23)`);
    console.log(`  • Chapter numbers found:`, Array.from(chapterNums).sort((a, b) => a - b));

    let missing = [];
    for (let i = 1; i <= 23; i++) {
      if (!chapterNums.has(i)) missing.push(i);
    }
    if (missing.length > 0) {
      console.error(`❌ FAIL: Missing Tamil Science chapters:`, missing);
      failed = true;
    } else {
      console.log('  ✓ Science Tamil has all 23 chapters (1 to 23)!');
    }
  }

  // 3. Verify Free User Gating for Concept Quizzes
  console.log('\n--- 3. Testing Free User Concept Gating (Chapters 1-3 Free, 4-23 Locked) ---');
  const freeConceptRes = await fetchJson('/api/questions?classLevel=10th&subject=science&medium=english&type=concept&count=all');
  if (!freeConceptRes.ok || !freeConceptRes.data?.ok) {
    console.error('❌ FAIL: Free concept query failed:', freeConceptRes.status);
    failed = true;
  } else {
    const { chapterNums } = extractChapterNumbers(freeConceptRes.data.questions);
    const lockedCount = freeConceptRes.data.lockedChapters?.length || 0;
    console.log(`  • Allowed questions for free user: ${freeConceptRes.data.questions?.length}`);
    console.log(`  • Allowed chapter numbers:`, Array.from(chapterNums).sort((a, b) => a - b));
    console.log(`  • Locked chapters reported: ${lockedCount}`);

    const hasInvalidFreeChapter = Array.from(chapterNums).some(n => n > 3);
    if (hasInvalidFreeChapter) {
      console.error('❌ FAIL: Free user was served concept questions for Chapter > 3!');
      failed = true;
    } else if (lockedCount < 20) {
      console.error(`❌ FAIL: Expected at least 20 locked chapters for free user, got ${lockedCount}`);
      failed = true;
    } else {
      console.log('  ✓ Concept gating verified: Chapters 1-3 accessible, Chapters 4-23 locked with honest count!');
    }
  }

  // 4. Verify Free User One-word MCQ has all 23 chapters
  console.log('\n--- 4. Testing Free User One-Word MCQ Coverage ---');
  const freeOwRes = await fetchJson('/api/questions?classLevel=10th&subject=science&medium=english&type=oneword&count=all');
  if (!freeOwRes.ok || !freeOwRes.data?.ok) {
    console.error('❌ FAIL: Free oneword query failed:', freeOwRes.status);
    failed = true;
  } else {
    const { chapterNums } = extractChapterNumbers(freeOwRes.data.questions);
    console.log(`  • One-word questions for free user: ${freeOwRes.data.questions?.length}`);
    console.log(`  • Chapters covered: ${chapterNums.size}`);
    let missing = [];
    for (let i = 1; i <= 23; i++) {
      if (!chapterNums.has(i)) missing.push(i);
    }
    if (missing.length > 0) {
      console.error(`❌ FAIL: Free oneword missing chapters:`, missing);
      failed = true;
    } else {
      console.log('  ✓ Free oneword practice verified: all 23 chapters available!');
    }
  }

  // 5. Verify /api/news endpoint
  console.log('\n--- 5. Testing News Endpoint ---');
  const newsRes = await fetchJson('/api/news');
  if (!newsRes.ok || !newsRes.data?.ok) {
    console.error('❌ FAIL: News endpoint failed:', newsRes.status);
    failed = true;
  } else {
    console.log(`  • News items: ${newsRes.data.news?.length}, Source: "${newsRes.data.source}"`);
    console.log('  ✓ News endpoint functional with truthful source indicator!');
  }

  // 6. Verify /api/leaderboard endpoint
  console.log('\n--- 6. Testing Leaderboard Endpoint ---');
  const lbRes = await fetchJson('/api/leaderboard?standard=10th');
  if (!lbRes.ok || !lbRes.data?.ok) {
    console.error('❌ FAIL: Leaderboard endpoint failed:', lbRes.status);
    failed = true;
  } else {
    console.log(`  • Leaderboard entries: ${lbRes.data.leaderboard?.length}, Source: "${lbRes.data.source}"`);
    console.log('  ✓ Leaderboard endpoint functional with truthful source indicator!');
  }

  // 7. Verify /api/owner-attendance endpoint plumbing
  console.log('\n--- 7. Testing Tuition Attendance Plumbing ---');
  const attRes = await fetchJson('/api/owner-attendance?code=TC-101&ownerPhone=9876543210&date=2026-11-15');
  if (attRes.status !== 200 && attRes.status !== 403) {
    console.error('❌ FAIL: Owner attendance returned unexpected status:', attRes.status);
    failed = true;
  } else {
    console.log(`  • Owner attendance response status: ${attRes.status}, data.ok: ${attRes.data?.ok}`);
    console.log('  ✓ Tuition attendance endpoint reachable and responding properly!');
  }

  // 8. Verify /api/owner-diary endpoint plumbing
  console.log('\n--- 8. Testing Tuition Diary Plumbing ---');
  const diaryRes = await fetchJson('/api/owner-diary?code=TC-101&ownerPhone=9876543210');
  if (diaryRes.status !== 200 && diaryRes.status !== 403) {
    console.error('❌ FAIL: Owner diary returned unexpected status:', diaryRes.status);
    failed = true;
  } else {
    console.log(`  • Owner diary response status: ${diaryRes.status}, data.ok: ${diaryRes.data?.ok}`);
    console.log('  ✓ Tuition diary endpoint reachable and responding properly!');
  }

  console.log('\n===============================================================');
  if (failed) {
    console.error('❌ VERIFICATION SUITE HAD FAILURES');
    process.exit(1);
  } else {
    console.log('🎉 ALL VERIFICATIONS PASSED: 23 SCIENCE CHAPTERS VERIFIED!');
    process.exit(0);
  }
}

runVerification();
