#!/usr/bin/env node

/**
 * scripts/tests/run-all-tests.mjs
 * 
 * Runs all verifyRef regression tests for R8 & R9:
 *  1. scripts/tests/api-truth-pipeline.mjs
 *  2. scripts/tests/quiz-sets-pooled.mjs
 *  3. scripts/tests/pro-materials-pills.mjs
 *  4. scripts/tests/papers-promo-slot.mjs
 *  5. scripts/tests/demo-classroom.mjs
 *  6. scripts/tests/viewer-internal.mjs (R9 Task 1)
 *  7. scripts/tests/demo-accounts.mjs (R9 Task 9)
 *  8. scripts/tests/concept-gating.mjs (R9 Task 3)
 *  9. scripts/tests/understand-check-popup.mjs (R9 Task 6)
 *  10. scripts/tests/textbooks-section.mjs (R9 Task 8)
 */

import { spawn } from 'child_process';
import path from 'path';

const testFiles = [
  { ref: 'api-truth-pipeline', script: 'api-truth-pipeline.mjs' },
  { ref: 'quiz-sets-pooled', script: 'quiz-sets-pooled.mjs' },
  { ref: 'pro-materials-pills', script: 'pro-materials-pills.mjs' },
  { ref: 'papers-promo-slot', script: 'papers-promo-slot.mjs' },
  { ref: 'demo-classroom', script: 'demo-classroom.mjs' },
  { ref: 'viewer-internal', script: 'viewer-internal.mjs' },
  { ref: 'demo-accounts', script: 'demo-accounts.mjs' },
  { ref: 'concept-gating', script: 'concept-gating.mjs' },
  { ref: 'understand-check-popup', script: 'understand-check-popup.mjs' },
  { ref: 'textbooks-section', script: 'textbooks-section.mjs' },
  { ref: 'paywall-server-side', script: 'paywall-server-side.mjs' },
  { ref: 'papers-medium-filter', script: 'papers-medium-filter.mjs' },
];

async function runTest(test) {
  return new Promise((resolve) => {
    const fullPath = path.join(process.cwd(), 'scripts', 'tests', test.script);
    const child = spawn(process.execPath, [fullPath], {
      env: {
        ...process.env,
        TARGET_URL: process.env.TARGET_URL || 'http://localhost:3000',
      },
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      resolve({ ref: test.ref, code });
    });
  });
}

async function main() {
  console.log('🚀 Running Full CENTUM R8 & R9 Verification Test Suite...\n');
  const results = [];

  for (const test of testFiles) {
    const res = await runTest(test);
    results.push(res);
  }

  console.log('\n===============================================================');
  console.log('                 CENTUM VERIFY-REF TEST SUMMARY                ');
  console.log('===============================================================');
  
  let allPassed = true;
  for (const r of results) {
    if (r.code === 0) {
      console.log(`  ✓ verifyRef: ${r.ref.padEnd(26)} [PASS]`);
    } else {
      console.log(`  ❌ verifyRef: ${r.ref.padEnd(26)} [FAIL (exit ${r.code})]`);
      allPassed = false;
    }
  }
  console.log('===============================================================\n');

  if (allPassed) {
    console.log('🎉 ALL R8 & R9 VERIFY-REF SUITES GREEN AND VERIFIED.\n');
    process.exitCode = 0;
  } else {
    console.error('💥 SOME TESTS FAILED.\n');
    process.exitCode = 1;
  }
}

main();
