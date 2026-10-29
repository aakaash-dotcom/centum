#!/usr/bin/env node

/**
 * scripts/tests/classroom-concept-gating.test.mjs
 * 
 * Verifies:
 * 1. Free user in classroom (/tests with type=concept):
 *    - Chapter 1 is PLAYABLE
 *    - Chapter 2 is PLAYABLE
 *    - Chapter 3 is PLAYABLE
 *    - Chapter 4+ is LOCKED
 * 2. Tapping Chapter 4+ locked opens Pro Upsell Modal with honest ledger & pricing (₹1,499)
 * 3. Pro user: all chapters playable
 */

import puppeteer from 'puppeteer-core';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('===============================================================');
console.log('   CLASSROOM CONCEPT QUIZ GATING TEST (Chapters 1-3 Free, 4+ Locked)');
console.log(`   Target: ${BASE_URL}`);
console.log('===============================================================');

let hasFailure = false;

async function runTests() {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });

    // Clear any existing pro state for free user test
    await page.goto(`${BASE_URL}/tests`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.removeItem('centum_plan');
      localStorage.removeItem('centum_student');
    });

    // Navigate to /tests?standard=10th&subject=Maths
    console.log('\n--- 1. Testing Classroom Free User (/tests) ---');
    await page.goto(`${BASE_URL}/tests?standard=10th&subject=Maths`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

    // Click on "Concept Quiz" filter button (Box 2)
    const conceptBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('concept'));
    });

    if (conceptBtn) {
      await conceptBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
      console.log('  ✓ Switched to Concept Quiz filter');
    }

    // Evaluate chapter statuses on page
    const chapterStatuses = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[data-chapter-status]'));
      return items.map((el) => ({
        number: parseInt(el.getAttribute('data-chapter-number') || '0', 10),
        status: el.getAttribute('data-chapter-status'),
        testid: el.getAttribute('data-testid'),
        text: el.textContent?.trim().slice(0, 50),
      }));
    });

    console.log(`  Found ${chapterStatuses.length} chapter cards rendered.`);
    chapterStatuses.slice(0, 6).forEach((ch) => {
      console.log(`    Ch ${ch.number}: status=${ch.status}, testid=${ch.testid}`);
    });

    // Check chapters 1, 2, 3 are playable
    const ch1 = chapterStatuses.find((c) => c.number === 1);
    const ch2 = chapterStatuses.find((c) => c.number === 2);
    const ch3 = chapterStatuses.find((c) => c.number === 3);
    const ch4 = chapterStatuses.find((c) => c.number === 4);

    if (ch1 && ch1.status === 'playable') {
      console.log('  ✓ PASS: Chapter 1 is playable for free visitor');
    } else {
      console.error('  ❌ FAIL: Chapter 1 is not playable!');
      hasFailure = true;
    }

    if (ch2 && ch2.status === 'playable') {
      console.log('  ✓ PASS: Chapter 2 is playable for free visitor');
    } else {
      console.error('  ❌ FAIL: Chapter 2 is not playable!');
      hasFailure = true;
    }

    if (ch3 && ch3.status === 'playable') {
      console.log('  ✓ PASS: Chapter 3 is playable for free visitor');
    } else {
      console.error('  ❌ FAIL: Chapter 3 is not playable!');
      hasFailure = true;
    }

    if (ch4 && ch4.status === 'locked') {
      console.log('  ✓ PASS: Chapter 4 is locked with Pro requirement for free visitor');
    } else if (chapterStatuses.length >= 4) {
      console.error('  ❌ FAIL: Chapter 4 should be locked for free visitor!');
      hasFailure = true;
    } else {
      console.log('  ℹ Note: fewer than 4 chapters available in current pool');
    }

    // Verify tapping locked chapter 4+ opens Pro Upsell Modal
    const lockedCard = await page.$('[data-chapter-status="locked"]');
    if (lockedCard) {
      console.log('  • Tapping locked chapter card to verify modal...');
      await lockedCard.click();
      await new Promise((r) => setTimeout(r, 600));

      const modal = await page.$('[data-testid="pro-upsell-modal"]');
      if (modal) {
        console.log('  ✓ PASS: Tapping locked chapter card opens ProUpsellModal');
        const modalText = await page.evaluate((el) => el.textContent, modal);
        if (modalText?.includes('1,499') || modalText?.includes('1499')) {
          console.log('  ✓ PASS: ProUpsellModal contains canonical ₹1,499 price');
        } else {
          console.error('  ❌ FAIL: ProUpsellModal missing canonical ₹1,499 price');
          hasFailure = true;
        }
      } else {
        console.error('  ❌ FAIL: ProUpsellModal did not open on tapping locked card');
        hasFailure = true;
      }
    }

    // -------------------------------------------------------------
    // Test 2: Pro User in Classroom -> All Chapters Playable
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Classroom Pro User (/tests) ---');
    await page.evaluate(() => {
      localStorage.setItem('centum_plan', 'pro');
      const student = { name: 'Demo Student', standard: '10th', plan: 'pro' };
      localStorage.setItem('centum_student', JSON.stringify(student));
    });

    await page.goto(`${BASE_URL}/tests?standard=10th&subject=Maths`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

    const proLockedCount = await page.$$eval('[data-chapter-status="locked"]', (els) => els.length);
    if (proLockedCount === 0) {
      console.log('  ✓ PASS: All chapter cards are playable for Pro user (0 locked cards)');
    } else {
      console.error(`  ❌ FAIL: Pro user sees ${proLockedCount} locked chapter cards!`);
      hasFailure = true;
    }

    await browser.close();
  } catch (err) {
    console.error('❌ Error executing classroom concept gating tests:', err);
    hasFailure = true;
    if (browser) await browser.close();
  }

  console.log('\n===============================================================');
  if (hasFailure) {
    console.error('❌ CLASSROOM CONCEPT GATING AUDIT FAILED');
    process.exit(1);
  } else {
    console.log('✅ ALL CLASSROOM CONCEPT GATING CHECKS PASSED');
    process.exit(0);
  }
}

runTests();
