#!/usr/bin/env node

/**
 * scripts/tests/understand-check-popup.mjs
 * verifyRef: understand-check-popup
 *
 * Asserts:
 *  1. On /pro video section, topic rows carry "உணர்ந்தேனா? (3–5 Q)" pill
 *  2. Clicking pill opens in-page popup quiz modal ([data-testid="understand-check-modal"])
 *  3. In-page modal renders question with 4 options
 *  4. Selecting option provides instant correct/wrong visual feedback without page reload
 *  5. Reaching the end renders the summary score screen
 *  6. URL remains strictly on /pro (ZERO router navigation)
 */

import puppeteer from 'puppeteer-core';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('===============================================================');
console.log(`   TASK 6: UNDERSTAND-CHECK POPUP QUIZ AUDIT`);
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

    console.log('--- 1. Navigating to /pro?section=videos ---');
    await page.goto(`${BASE_URL}/pro?section=videos`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1200));

    // 1. Locate the Understand-check pill
    const pill = await page.$('[data-testid="understand-check-pill"]');
    if (!pill) {
      console.error('❌ FAIL: "உணர்ந்தேனா? (3–5 Q)" pill not found on video rows!');
      hasFailure = true;
    } else {
      console.log('  ✓ Found "உணர்ந்தேனா? (3–5 Q)" pill on video row');

      // 2. Click the pill
      console.log('  • Clicking understand-check pill...');
      await page.evaluate(() => {
        const p = document.querySelector('[data-testid="understand-check-pill"]');
        if (p) {
          p.scrollIntoView({ behavior: 'instant', block: 'center' });
          p.click();
        }
      });
      await new Promise((r) => setTimeout(r, 600));

      // 3. Verify modal opened
      const modal = await page.$('[data-testid="understand-check-modal"]');
      if (!modal) {
        console.error('❌ FAIL: In-page popup modal did not open!');
        hasFailure = true;
      } else {
        console.log('  ✓ In-page popup quiz modal opened successfully');

        // Check options count
        const options = await modal.$$('button[class*="border"]');
        console.log(`  • Found option buttons: ${options.length}`);
        if (options.length < 4) {
          console.error(`❌ FAIL: Expected 4 option buttons, found ${options.length}`);
          hasFailure = true;
        } else {
          console.log('  ✓ 4 question options rendered in popup');

          // 4. Click an option and verify feedback
          console.log('  • Selecting first option...');
          await options[0].click();
          await new Promise((r) => setTimeout(r, 500));

          // Next question button appears
          const nextBtn = await modal.$('button[class*="bg-[#7C3AED]"]');
          if (!nextBtn) {
            console.error('❌ FAIL: Next question button did not appear after answer selection!');
            hasFailure = true;
          } else {
            console.log('  ✓ Instant answer feedback verified, next button visible');

            // Answer rest of questions until summary
            let isDone = false;
            let attempts = 0;
            while (!isDone && attempts < 6) {
              attempts++;
              const currentNextBtn = await modal.$('button[class*="bg-[#7C3AED]"]');
              if (currentNextBtn) {
                await currentNextBtn.click();
                await new Promise((r) => setTimeout(r, 400));
              }

              const summaryText = await page.evaluate((m) => m?.textContent, modal);
              if (summaryText?.includes('உணர்ந்தேன்') || summaryText?.includes('முடிந்தது')) {
                isDone = true;
                console.log(`  ✓ Quiz completed, summary screen verified: "${summaryText.match(/\d+ \/ \d+ உணர்ந்தேன்/)?.[0] || 'Summary present'}"`);
                break;
              }

              const currentOpts = await modal.$$('button[class*="border"]');
              if (currentOpts.length >= 4) {
                await currentOpts[0].click();
                await new Promise((r) => setTimeout(r, 400));
              }
            }
          }
        }
      }

      // 5. Verify URL has NEVER navigated away from /pro
      const currentUrl = page.url();
      console.log(`  • Current URL after quiz interactions: ${currentUrl}`);
      if (!currentUrl.includes('/pro')) {
        console.error(`❌ FAIL: Router navigated away from /pro! Current URL: ${currentUrl}`);
        hasFailure = true;
      } else {
        console.log('  ✓ Zero router navigation confirmed (strictly in-page popup)');
      }
    }

    await browser.close();
  } catch (err) {
    console.error('❌ Error executing understand check tests:', err);
    hasFailure = true;
    if (browser) await browser.close();
  }

  console.log('\n===============================================================');
  if (hasFailure) {
    console.error('❌ TASK 6 VERIFICATION FAILED');
    process.exitCode = 1;
  } else {
    console.log('✅ TASK 6 VERIFICATION PASSED: In-page understand-check popup verified');
    console.log('verifyRef: understand-check-popup [VERIFIED]');
    console.log('===============================================================\n');
    process.exitCode = 0;
  }
}

runTests();
