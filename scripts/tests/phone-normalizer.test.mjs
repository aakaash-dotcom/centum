import assert from 'node:assert/strict';

// Import phone helper functions
import { normalizePhone, toLast10Phone } from '../../src/lib/phone.ts';
// Import pricing helper functions
import {
  PRO_PRICE,
  PRO_PRICE_STRUCK,
  PRO_PRICE_COUPON,
  calculatePayablePrice,
  getPricingPeriodCopy,
} from '../../src/lib/pricing.ts';
// Import chapter gating function
import { isChapterAllowed } from '../../src/lib/gating.ts';

console.log('===============================================================');
console.log('      UNIT & REGRESSION TEST SUITE: PHONE, PRICING, GATING     ');
console.log('===============================================================\n');

let failedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failedTests++;
  }
}

// -------------------------------------------------------------
// 1. Phone Normalizer Coercion Tests
// -------------------------------------------------------------
console.log('--- 1. Testing Phone Normalization & Coercion ---');

runTest('Coerces raw numeric phone to 10-digit string', () => {
  assert.equal(toLast10Phone(9840123456), '9840123456');
  assert.equal(normalizePhone(9840123456), '9840123456');
});

runTest('Normalizes formatted +91 string to 10 digits', () => {
  assert.equal(toLast10Phone('+91 98401 23456'), '9840123456');
  assert.equal(normalizePhone('+91 98401 23456'), '9840123456');
});

runTest('Strips leading zero from 11-digit phone', () => {
  assert.equal(toLast10Phone('09840123456'), '9840123456');
  assert.equal(normalizePhone('09840123456'), '9840123456');
});

runTest('Gracefully handles empty string', () => {
  assert.equal(toLast10Phone(''), '');
  assert.equal(normalizePhone(''), '');
});

runTest('Gracefully handles null and undefined without crashing', () => {
  assert.equal(toLast10Phone(null), '');
  assert.equal(normalizePhone(null), '');
  assert.equal(toLast10Phone(undefined), '');
  assert.equal(normalizePhone(undefined), '');
});

runTest('Returns empty string for non-phone string', () => {
  assert.equal(toLast10Phone('invalid-phone-string'), '');
  assert.equal(normalizePhone('abc'), '');
});

// -------------------------------------------------------------
// 2. Pricing & Coupon Calculation Tests
// -------------------------------------------------------------
console.log('\n--- 2. Testing Pricing & Coupon Calculations ---');

runTest('Standard base pricing values conform to canonical rules', () => {
  assert.equal(PRO_PRICE, 1499);
  assert.equal(PRO_PRICE_STRUCK, 2500);
  assert.equal(PRO_PRICE_COUPON, 999);
});

runTest('Calculates standard payable price when no coupon applied', () => {
  const price = calculatePayablePrice(PRO_PRICE, null);
  assert.equal(price, 1499);
});

runTest('Calculates coupon payable price when valid coupon applied', () => {
  const price = calculatePayablePrice(PRO_PRICE, { valid: true, code: 'CENTUM10' });
  assert.equal(price, 999);
});

runTest('Calculates percentage discount when discountPercent is provided', () => {
  const price = calculatePayablePrice(1000, { valid: true, discountPercent: 20 });
  assert.equal(price, 800);
});

runTest('Ignores invalid coupon and charges standard price', () => {
  const price = calculatePayablePrice(PRO_PRICE, { valid: false, code: 'INVALID' });
  assert.equal(price, 1499);
});

runTest('Returns English pricing period copy as "/ year"', () => {
  assert.equal(getPricingPeriodCopy(false), '/ year');
});

runTest('Returns Tamil pricing period copy as "/ முழு ஆண்டு"', () => {
  assert.equal(getPricingPeriodCopy(true), '/ முழு ஆண்டு');
});

// -------------------------------------------------------------
// 3. Chapter Gating Tests (Rule 5: Chapters 1–3 Free)
// -------------------------------------------------------------
console.log('\n--- 3. Testing Concept Quiz Chapter Gating ---');

runTest('Allows English Chapters 1, 2, and 3', () => {
  assert.equal(isChapterAllowed('Chapter 1'), true);
  assert.equal(isChapterAllowed('Chapter 2'), true);
  assert.equal(isChapterAllowed('Chapter 3'), true);
  assert.equal(isChapterAllowed('Unit 1'), true);
  assert.equal(isChapterAllowed('Unit 2 - Fractions'), true);
  assert.equal(isChapterAllowed('Unit 3'), true);
  assert.equal(isChapterAllowed('Ch 1'), true);
  assert.equal(isChapterAllowed('1. Relations and Functions'), true);
  assert.equal(isChapterAllowed('2. Numbers and Sequences'), true);
  assert.equal(isChapterAllowed('3. Algebra'), true);
});

runTest('Locks English Chapters 4+ and Chapter 10', () => {
  assert.equal(isChapterAllowed('Chapter 4'), false);
  assert.equal(isChapterAllowed('Chapter 5 - Coordinate Geometry'), false);
  assert.equal(isChapterAllowed('Chapter 10'), false);
  assert.equal(isChapterAllowed('Unit 8'), false);
  assert.equal(isChapterAllowed('4. Geometry'), false);
});

runTest('Allows Tamil Chapters 1, 2, and 3', () => {
  assert.equal(isChapterAllowed('அலகு 1'), true);
  assert.equal(isChapterAllowed('அலகு 2 - எண்களும் தொடர் வரிசைகளும்'), true);
  assert.equal(isChapterAllowed('அலகு 3'), true);
  assert.equal(isChapterAllowed('பாடம் 1'), true);
  assert.equal(isChapterAllowed('பாடம் 2'), true);
  assert.equal(isChapterAllowed('பாடம் 3'), true);
});

runTest('Locks Tamil Chapters 4+ and Chapter 10', () => {
  assert.equal(isChapterAllowed('அலகு 4'), false);
  assert.equal(isChapterAllowed('அலகு 5'), false);
  assert.equal(isChapterAllowed('அலகு 10'), false);
  assert.equal(isChapterAllowed('பாடம் 4'), false);
  assert.equal(isChapterAllowed('பாடம் 8'), false);
});

console.log('\n===============================================================');
if (failedTests === 0) {
  console.log('✅ ALL UNIT & REGRESSION CHECKS PASSED (0 failures)');
  console.log('===============================================================\n');
  process.exit(0);
} else {
  console.error(`❌ UNIT & REGRESSION CHECKS FAILED: ${failedTests} failure(s)`);
  console.log('===============================================================\n');
  process.exit(1);
}
