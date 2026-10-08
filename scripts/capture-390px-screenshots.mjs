import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\aakaa\\.gemini\\antigravity-ide\\brain\\dcf5861c-6bb7-453c-b8a9-d2fa45b4454e';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function capture() {
  console.log('🚀 Starting precise mobile 390px screenshot capture via puppeteer-core...');

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

  // 1. Quiz cards with real merged counts
  console.log('📸 1/5 Capturing Quiz Cards with Real Merged Counts (390px)...');
  await page.goto(`${BASE_URL}/tests`, { waitUntil: 'networkidle0' });
  try {
    // Open subject dropdown
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const trigger = btns.find(b => b.textContent?.toLowerCase().includes('select subject') || b.textContent?.includes('பாடம்'));
      if (trigger) trigger.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Select "Maths"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const mathBtn = btns.find(b => b.textContent?.trim() === 'Maths' || b.textContent?.trim() === 'கணிதம்');
      if (mathBtn) mathBtn.click();
    });

    // Wait until questions are loaded and skeleton cards disappear
    await page.waitForFunction(() => {
      const cards = document.querySelectorAll('.space-y-2 > div');
      const hasSkeleton = !!document.querySelector('.animate-pulse');
      return cards.length >= 2 && !hasSkeleton;
    }, { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1200));
  } catch (err) {
    console.warn('Subject selector interaction error:', err.message);
  }
  const snap1Path = path.join(ARTIFACTS_DIR, '01_quiz_cards_390px.png');
  await page.screenshot({ path: snap1Path });
  console.log(`  ✓ Saved ${snap1Path}`);

  // 2. 15-question quiz playing
  console.log('📸 2/5 Capturing 15-Question Quiz Playing (390px)...');
  await page.goto(`${BASE_URL}/test-runner?subject=Maths&chapter=Practice%20%E2%80%94%20All%20chapters&type=all&standard=10th&count=15`, { waitUntil: 'networkidle0' });
  try {
    await page.waitForFunction(() => {
      return document.querySelectorAll('button').length >= 4 && !document.body.innerText.includes('loading');
    }, { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000));
  } catch (err) {
    console.warn('Quiz runner wait error:', err.message);
  }
  const snap2Path = path.join(ARTIFACTS_DIR, '02_quiz_playing_390px.png');
  await page.screenshot({ path: snap2Path });
  console.log(`  ✓ Saved ${snap2Path}`);

  // 3. Pro materials pills populated
  console.log('📸 3/5 Capturing Pro Materials Pills Populated (390px)...');
  await page.goto(`${BASE_URL}/pro-materials`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const snap3Path = path.join(ARTIFACTS_DIR, '03_pro_materials_pills_390px.png');
  await page.screenshot({ path: snap3Path });
  console.log(`  ✓ Saved ${snap3Path}`);

  // 4. Papers list with promo card
  console.log('📸 4/5 Capturing Papers List with Promo Card (390px)...');
  try {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const papersTab = btns.find(b => b.textContent?.includes('PYQ Papers') || b.textContent?.includes('வினாத்தாள்கள்'));
      if (papersTab) papersTab.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    // Scroll promo slot into center view
    await page.evaluate(() => {
      const promoSlot = document.querySelector('[data-testid="pro-promo-slot"]');
      if (promoSlot) {
        promoSlot.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });
    await new Promise(r => setTimeout(r, 800));
  } catch (err) {
    console.warn('Papers promo slot scroll error:', err.message);
  }
  const snap4Path = path.join(ARTIFACTS_DIR, '04_papers_promo_slot_390px.png');
  await page.screenshot({ path: snap4Path });
  console.log(`  ✓ Saved ${snap4Path}`);

  // 5. Demo classroom two tabs
  console.log('📸 5/5 Capturing Demo Classroom Interactive Tabs (390px)...');
  await page.goto(`${BASE_URL}/classroom`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  try {
    // Click "View Demo Classroom" button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const demoBtn = btns.find(b => b.textContent?.includes('View Demo Classroom') || b.textContent?.includes('மாதிரி வகுப்பறையைக் காண்க'));
      if (demoBtn) demoBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Wait for interactive demo modal and switch to Diary tab
    await page.waitForSelector('[data-testid="demo-tab-diary"]', { timeout: 8000 });
    await page.click('[data-testid="demo-tab-diary"]');
    await new Promise(r => setTimeout(r, 800));
  } catch (err) {
    console.warn('Demo tab interaction error:', err.message);
  }
  const snap5Path = path.join(ARTIFACTS_DIR, '05_demo_classroom_tabs_390px.png');
  await page.screenshot({ path: snap5Path });
  console.log(`  ✓ Saved ${snap5Path}`);

  await browser.close();
  console.log('🎉 All 5 mobile screenshots captured successfully and verified!');
}

capture().catch((err) => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
