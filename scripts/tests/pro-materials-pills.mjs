#!/usr/bin/env node

/**
 * scripts/tests/pro-materials-pills.mjs
 * 
 * Verifies Task B: Pro materials pills are never dead taps
 * Asserts:
 *  - Study materials exist for Class 10 across all 5 canonical subjects
 *  - PYQ papers exist for Class 10 across both mediums
 *  - Zero empty panels for Class 10
 */

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000';

console.log('===============================================================');
console.log(`   TASK B: PRO MATERIALS PILLS VERIFICATION (Target: ${TARGET_URL})`);
console.log('===============================================================\n');

const SUBJECTS = ['Maths', 'Science', 'Social Science', 'Tamil', 'English'];

async function testProMaterials() {
  let passed = true;

  console.log('--- Auditing Study Materials (Notes/Formulas) ---');
  for (const subj of SUBJECTS) {
    const res = await fetch(`${TARGET_URL}/api/pro-materials?classLevel=10&subject=${encodeURIComponent(subj)}`);
    const data = await res.json();
    const count = data.materials?.length || 0;
    console.log(`  • ${subj}: ${count} study materials found`);
    if (count === 0) {
      console.error(`  ❌ FAIL: ${subj} has 0 study materials!`);
      passed = false;
    } else {
      console.log(`  ✓ ${subj} populated`);
    }
  }

  console.log('\n--- Auditing PYQ Papers Catalog ---');
  for (const medium of ['english', 'tamil']) {
    const res = await fetch(`${TARGET_URL}/api/papers?classLevel=10&medium=${medium}`);
    const data = await res.json();
    const count = data.papers?.length || 0;
    console.log(`  • Class 10 (${medium} medium): ${count} past papers found`);
    if (count === 0) {
      console.error(`  ❌ FAIL: 0 papers found for ${medium} medium!`);
      passed = false;
    } else {
      console.log(`  ✓ ${medium} papers populated`);
    }
  }

  console.log('\n===============================================================');
  if (passed) {
    console.log('✅ TASK B VERIFICATION PASSED: Zero empty panels for Class 10');
    console.log('verifyRef: pro-materials-pills [VERIFIED]');
    console.log('===============================================================\n');
    process.exit(0);
  } else {
    console.error('❌ TASK B VERIFICATION FAILED');
    console.log('===============================================================\n');
    process.exit(1);
  }
}

testProMaterials();
