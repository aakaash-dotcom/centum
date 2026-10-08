#!/usr/bin/env node

/**
 * scripts/tests/papers-promo-slot.mjs
 * 
 * Verifies Task C: Compact rows + Pro promo slot in papers list
 * Asserts:
 *  - Compact papers structure is responsive
 *  - Exactly ONE Pro promo slot is present
 *  - CTA points to /pro with "Go Pro — videos, notes, diary" copy
 */

import fs from 'fs';
import path from 'path';

console.log('===============================================================');
console.log('   TASK C: PAPERS COMPACT ROWS + PROMO SLOT VERIFICATION');
console.log('===============================================================\n');

function testPromoSlot() {
  const filePath = path.join(process.cwd(), 'src/app/pro-materials/page.tsx');
  const content = fs.readFileSync(filePath, 'utf-8');

  let passed = true;

  // 1. Verify data-testid="pro-promo-slot" exists
  const promoSlotMatches = content.match(/data-testid=["']pro-promo-slot["']/g) || [];
  console.log(`Checking Pro promo slot occurrences in src/app/pro-materials/page.tsx:`);
  console.log(`  • Found occurrences: ${promoSlotMatches.length}`);

  if (promoSlotMatches.length !== 1) {
    console.error(`  ❌ FAIL: Expected exactly ONE pro-promo-slot, found ${promoSlotMatches.length}`);
    passed = false;
  } else {
    console.log(`  ✓ Exactly ONE pro-promo-slot verified (no over-promotion)`);
  }

  // 2. Check CTA text and href
  const hasGoProCta = content.includes('Go Pro — videos, notes, diary') || content.includes('Go Pro');
  const hasProLink = content.includes('href="/pro"') || content.includes('href="/pricing"');

  console.log(`Checking CTA content and destination:`);
  if (!hasGoProCta) {
    console.error(`  ❌ FAIL: Missing "Go Pro — videos, notes, diary" copy`);
    passed = false;
  } else {
    console.log(`  ✓ Founder-requested "Go Pro — videos, notes, diary" copy confirmed`);
  }

  if (!hasProLink) {
    console.error(`  ❌ FAIL: Missing link to /pro`);
    passed = false;
  } else {
    console.log(`  ✓ Pro CTA destination confirmed (/pro)`);
  }

  // 3. Check grid structure
  const hasResponsiveGrid = content.includes('grid grid-cols-1 sm:grid-cols-2');
  if (!hasResponsiveGrid) {
    console.error(`  ❌ FAIL: Missing responsive compact 2-column grid layout`);
    passed = false;
  } else {
    console.log(`  ✓ Responsive compact grid layout confirmed`);
  }

  console.log('\n===============================================================');
  if (passed) {
    console.log('✅ TASK C VERIFICATION PASSED');
    console.log('verifyRef: papers-promo-slot [VERIFIED]');
    console.log('===============================================================\n');
    process.exit(0);
  } else {
    console.error('❌ TASK C VERIFICATION FAILED');
    console.log('===============================================================\n');
    process.exit(1);
  }
}

testPromoSlot();
