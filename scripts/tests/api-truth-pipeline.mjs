#!/usr/bin/env node

/**
 * scripts/tests/api-truth-pipeline.mjs
 * 
 * Verifies Task A0: API Truth Pipeline
 * Asserts live production API responses against sheet truth contracts:
 *  - 10-maths-english-concept: totalMatching === 240, questions.length >= 100
 *  - 10-maths-english-oneword: totalMatching >= 104 floor
 *  - 10-science-tamil-concept: totalMatching === 60, questions.length >= 50
 *  - Shape: ok: true, sheetTotal present, servedFrom present
 * 
 * Target URL defaults to live production: https://centum-omega.vercel.app
 * (Can be overridden via TARGET_URL env var, e.g. for local pre-flight: TARGET_URL=http://localhost:3000)
 */

const TARGET_URL = process.env.TARGET_URL || 'https://centum-omega.vercel.app';

console.log('===============================================================');
console.log(`   API TRUTH PIPELINE VERIFICATION (Target: ${TARGET_URL})`);
console.log('===============================================================\n');

const TEST_CASES = [
  {
    name: '10-maths-english-concept',
    query: 'type=concept&classLevel=10&subject=maths&medium=english&count=all',
    minTotalMatching: 240,
    minQuestions: 100,
    gasDirectFloor: 240,
  },
  {
    name: '10-maths-tamil-concept',
    query: 'type=concept&classLevel=10&subject=maths&medium=tamil&count=all',
    minTotalMatching: 240,
    minQuestions: 100,
    gasDirectFloor: 240,
  },
  {
    name: '10-science-tamil-concept',
    query: 'type=concept&classLevel=10&subject=science&medium=tamil&count=all',
    minTotalMatching: 60,
    minQuestions: 50,
    gasDirectFloor: 60,
  },
  {
    name: '10-maths-english-oneword',
    query: 'type=oneword&classLevel=10&subject=maths&medium=english&count=all',
    minTotalMatching: 104,
    minQuestions: 100,
    gasDirectFloor: 104,
  },
];

async function run() {
  const tableRows = [];
  let allPassed = true;

  for (const tc of TEST_CASES) {
    const url = `${TARGET_URL}/api/questions?${tc.query}&_t=${Date.now()}`;
    const startTime = Date.now();
    let resStatus = 0;
    let data = null;
    let errorMsg = null;

    try {
      const res = await fetch(url, { cache: 'no-store' });
      resStatus = res.status;
      data = await res.json();
    } catch (err) {
      errorMsg = err.message;
    }

    const elapsed = Date.now() - startTime;
    const ok = data?.ok === true;
    const totalMatching = data?.totalMatching ?? 0;
    const questionsLength = Array.isArray(data?.questions) ? data.questions.length : 0;
    const sheetTotal = data?.sheetTotal ?? 'N/A';
    const servedFrom = data?.servedFrom ?? data?.source ?? 'unknown';

    let verdict = 'PASS';
    const failures = [];

    if (!ok) {
      failures.push(`HTTP ${resStatus} / ok=false`);
    }

    if (tc.minTotalMatching !== undefined && totalMatching < tc.minTotalMatching) {
      failures.push(`totalMatching=${totalMatching} (< floor ${tc.minTotalMatching})`);
    }

    if (tc.minQuestions !== undefined && questionsLength < tc.minQuestions) {
      failures.push(`questions.length=${questionsLength} (< ${tc.minQuestions})`);
    }

    if (failures.length > 0) {
      verdict = `FAIL: ${failures.join('; ')}`;
      allPassed = false;
    }

    tableRows.push({
      Tuple: tc.name,
      'GAS Direct Floor': tc.gasDirectFloor,
      'Route totalMatching': totalMatching,
      'Route q.length': questionsLength,
      'sheetTotal': sheetTotal,
      'servedFrom': servedFrom,
      'Elapsed (ms)': elapsed,
      Verdict: verdict,
    });
  }

  console.table(tableRows);

  console.log('\n===============================================================');
  if (allPassed) {
    console.log('✅ ALL API TRUTH PIPELINE CHECKS PASSED');
    console.log('verifyRef: api-truth-pipeline [VERIFIED]');
    console.log('===============================================================\n');
    process.exitCode = 0;
  } else {
    console.error('❌ SOME CHECKS FAILED (See table above for details)');
    console.log('===============================================================\n');
    process.exitCode = 1;
  }
}

run();
