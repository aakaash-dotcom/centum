import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\aakaa\\.gemini\\antigravity-ide\\brain\\dcf5861c-6bb7-453c-b8a9-d2fa45b4454e';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function capture() {
  console.log('🚀 Starting R9 Mobile (390px) Screenshot Capture...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  // 1. /pro hero with real live counts
  console.log('📸 1/6 Capturing /pro Hero with Live Counts...');
  await page.goto(`${BASE_URL}/pro`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1200));
  const snap1Path = path.join(ARTIFACTS_DIR, '01_pro_hero_counts_390px.png');
  await page.screenshot({ path: snap1Path });
  console.log(`  ✓ Saved ${snap1Path}`);

  // 2. /pro?section=concept pre-opened
  console.log('📸 2/6 Capturing /pro?section=concept Pre-Opened...');
  await page.goto(`${BASE_URL}/pro?section=concept`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));
  const snap2Path = path.join(ARTIFACTS_DIR, '02_pro_concept_preopened_390px.png');
  await page.screenshot({ path: snap2Path });
  console.log(`  ✓ Saved ${snap2Path}`);

  // 3. Paper tap -> /viewer showing embedded PDF
  console.log('📸 3/6 Capturing /viewer with Embedded PDF & CENTUM Header...');
  await page.goto(`${BASE_URL}/viewer?page=papers&id=1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q&title=10th%20Maths%20Annual%20Exam%202024%20(English%20Medium)&subject=Maths&year=2024`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));
  const snap3Path = path.join(ARTIFACTS_DIR, '03_viewer_embedded_pdf_390px.png');
  await page.screenshot({ path: snap3Path });
  console.log(`  ✓ Saved ${snap3Path}`);

  // 4. Locked chapter row with 🔒 + Pro chip and counts
  console.log('📸 4/6 Capturing Locked Chapter Row with 🔒 + Counts...');
  // Ensure free plan
  await page.evaluate(() => {
    localStorage.setItem('centum_plan', 'free');
    localStorage.removeItem('centum_student');
  });
  await page.goto(`${BASE_URL}/pro?section=concept`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1200));
  // Scroll to Chapter 2 locked row
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="concept-ch2-locked"]');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise((r) => setTimeout(r, 600));
  const snap4Path = path.join(ARTIFACTS_DIR, '04_locked_chapter_row_390px.png');
  await page.screenshot({ path: snap4Path });
  console.log(`  ✓ Saved ${snap4Path}`);

  // 5. Upsell modal with honest counts & coupon field
  console.log('📸 5/6 Capturing ProUpsellModal with Honest Counts & Pricing...');
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="concept-ch2-locked"]');
    if (el) el.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  const snap5Path = path.join(ARTIFACTS_DIR, '05_upsell_modal_honest_counts_390px.png');
  await page.screenshot({ path: snap5Path });
  console.log(`  ✓ Saved ${snap5Path}`);

  // 6. Understand-check popup mid-answer
  console.log('📸 6/6 Capturing Understand-Check Popup Mid-Answer...');
  await page.goto(`${BASE_URL}/pro?section=videos`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));
  // Click understand check pill
  await page.evaluate(() => {
    const pill = document.querySelector('[data-testid="understand-check-pill"]');
    if (pill) {
      pill.scrollIntoView({ behavior: 'instant', block: 'center' });
      pill.click();
    }
  });
  await new Promise((r) => setTimeout(r, 800));
  // Select first option to be mid-answer
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="understand-check-modal"] button[data-testid^="option-btn-"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  const snap6Path = path.join(ARTIFACTS_DIR, '06_understand_check_popup_390px.png');
  await page.screenshot({ path: snap6Path });
  console.log(`  ✓ Saved ${snap6Path}`);

  await browser.close();
  console.log('🎉 All 6 R9 screenshots captured successfully!');
  process.exitCode = 0;
}

capture().catch((err) => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
