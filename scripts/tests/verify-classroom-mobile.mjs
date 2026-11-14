import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = process.env.TARGET_URL || 'http://localhost:3000';
const WIDTHS = [320, 360, 375, 390, 414];
const OUT_DIR = 'C:\\Users\\aakaa\\.gemini\\antigravity-ide\\brain\\24041e92-7ebc-4d78-b432-06b62cb179a9\\scratch';

async function main() {
  console.log('=====================================================');
  console.log('VERIFYING TUITION PAGE MOBILE OVERFLOW & FORM ACTIONS');
  console.log('=====================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });

  let allPassed = true;

  for (const w of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: 800, isMobile: true });
    await page.goto(`${BASE_URL}/classroom`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1200));

    const check = await page.evaluate((width) => {
      const docScrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      const windowInnerWidth = window.innerWidth;
      const hasHorizontalScroll = docScrollWidth > windowInnerWidth || bodyScrollWidth > windowInnerWidth;

      const overflowingElements = [];
      document.querySelectorAll('*').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > windowInnerWidth + 1 || rect.left < -1) {
          overflowingElements.push({
            tag: el.tagName,
            className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '',
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            text: (el.innerText || '').slice(0, 30).replace(/\n/g, ' ')
          });
        }
      });

      return {
        width,
        windowInnerWidth,
        docScrollWidth,
        bodyScrollWidth,
        hasHorizontalScroll,
        overflowingElements
      };
    }, w);

    console.log(`\nWidth ${w}px:`);
    console.log(`  Window innerWidth: ${check.windowInnerWidth}px, docScrollWidth: ${check.docScrollWidth}px, bodyScrollWidth: ${check.bodyScrollWidth}px`);
    console.log(`  Horizontal scroll: ${check.hasHorizontalScroll}`);

    if (check.hasHorizontalScroll) {
      console.log(`  FAILED! Excess width: ${check.docScrollWidth - check.windowInnerWidth}px`);
      check.overflowingElements.slice(0, 5).forEach((el, idx) => {
        console.log(`    [${idx+1}] <${el.tag} class="${el.className}"> right: ${el.right}px, width: ${el.width}px ("${el.text}")`);
      });
      allPassed = false;
    } else {
      console.log(`  PASSED! No horizontal overflow.`);
    }

    // Save AFTER screenshot
    const afterPic = path.join(OUT_DIR, `tuition-after-${w}px.png`);
    await page.screenshot({ path: afterPic, fullPage: true });
    console.log(`  Saved screenshot: ${afterPic}`);

    await page.close();
  }

  // Interactive check: Test claim form input and button on 320px
  console.log('\nTesting Claim Form & Interactive Buttons on 320px...');
  const testPage = await browser.newPage();
  await testPage.setViewport({ width: 320, height: 800, isMobile: true });
  await testPage.goto(`${BASE_URL}/classroom`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  const inputSelector = 'input[placeholder*="APEX10-S01"]';
  await testPage.waitForSelector(inputSelector);
  await testPage.type(inputSelector, 'TEST10-S01');

  const claimBtn = await testPage.$('button[type="submit"]');
  const isBtnDisabled = await testPage.evaluate(btn => btn.disabled, claimBtn);
  console.log(`  Seat code entered. Claim button enabled: ${!isBtnDisabled}`);

  // Test Demo modal opening
  const exploreDemoBtn = await testPage.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Explore Demo') || b.innerText.includes('மாதிரி பார்க்க'));
  });

  if (exploreDemoBtn) {
    await exploreDemoBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const modalVisible = await testPage.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return false;
      const hasOverflow = dialog.scrollWidth > window.innerWidth;
      return { visible: true, scrollWidth: dialog.scrollWidth, windowWidth: window.innerWidth, hasOverflow };
    });
    console.log(`  Demo modal open check:`, modalVisible);
    const demoPic = path.join(OUT_DIR, `tuition-demo-modal-320px.png`);
    await testPage.screenshot({ path: demoPic });
    console.log(`  Saved demo modal screenshot: ${demoPic}`);
  }

  await testPage.close();
  await browser.close();

  if (!allPassed) {
    console.error('\nOVERFLOW CHECK FAILED ON ONE OR MORE VIEWPORTS');
    process.exit(1);
  } else {
    console.log('\nALL VIEWPORTS (320, 360, 375, 390, 414 px) PASSED WITH ZERO HORIZONTAL OVERFLOW!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
