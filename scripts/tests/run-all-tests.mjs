#!/usr/bin/env node

/**
 * scripts/tests/run-all-tests.mjs
 * 
 * Runs all verifyRef regression tests:
 *  - scripts/tests/api-truth-pipeline.mjs
 *  - scripts/tests/quiz-sets-pooled.mjs
 *  - scripts/tests/pro-materials-pills.mjs
 *  - scripts/tests/papers-promo-slot.mjs
 *  - scripts/tests/demo-classroom.mjs
 */

import { spawn } from 'child_process';
import path from 'path';

const testFiles = [
  { ref: 'api-truth-pipeline', script: 'api-truth-pipeline.mjs' },
  { ref: 'quiz-sets-pooled', script: 'quiz-sets-pooled.mjs' },
  { ref: 'pro-materials-pills', script: 'pro-materials-pills.mjs' },
  { ref: 'papers-promo-slot', script: 'papers-promo-slot.mjs' },
  { ref: 'demo-classroom', script: 'demo-classroom.mjs' },
];

async function runTest(test) {
  return new Promise((resolve) => {
    const fullPath = path.join(process.cwd(), 'scripts', 'tests', test.script);
    const child = spawn(process.execPath, [fullPath], {
      env: process.env,
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      resolve({ ref: test.ref, code });
    });
  });
}

async function main() {
  console.log('🚀 Running R8 Verification Test Suite...\n');
  const results = [];

  for (const test of testFiles) {
    const res = await runTest(test);
    results.push(res);
  }

  console.log('\n===============================================================');
  console.log('                 R8 VERIFY-REF TEST SUMMARY                    ');
  console.log('===============================================================');
  
  let allPassed = true;
  for (const r of results) {
    if (r.code === 0) {
      console.log(`  ✓ verifyRef: ${r.ref.padEnd(24)} [PASS]`);
    } else {
      console.log(`  ❌ verifyRef: ${r.ref.padEnd(24)} [FAIL (exit ${r.code})]`);
      allPassed = false;
    }
  }
  console.log('===============================================================\n');

  if (allPassed) {
    console.log('🎉 ALL R8 REGRESSION SUITES GREEN AND VERIFIED.\n');
    process.exitCode = 0;
  } else {
    console.error('💥 SOME TESTS FAILED.\n');
    process.exitCode = 1;
  }
}

main();
