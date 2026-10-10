import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\aakaa\\.gemini\\antigravity-ide\\brain\\dcf5861c-6bb7-453c-b8a9-d2fa45b4454e';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function captureDemoScreenshots() {
  console.log('🚀 Starting Demo Accounts Specific 390px Screenshot Capture...');

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

  // 1. Student demo home with persistent slim demo banner
  console.log('📸 Capturing Student Demo Home with Demo Banner...');
  await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('centum_phone', '9123456780');
    localStorage.setItem('centum_student', JSON.stringify({
      phone: '9123456780',
      name: 'Demo Student (Kavin)',
      standard: '10th',
      medium: 'english',
      plan: 'pro',
      streak: 4,
      coins: 450,
      tuitionCode: 'DEMO10',
    }));
    window.location.reload();
  });
  await new Promise((r) => setTimeout(r, 1200));
  const snap1Path = path.join(ARTIFACTS_DIR, '07_demo_banner_student_home_390px.png');
  await page.screenshot({ path: snap1Path });
  console.log(`  ✓ Saved ${snap1Path}`);

  // 2. Demo owner portal prefilled DEMO10
  console.log('📸 Capturing Demo Owner Portal with Prefilled DEMO10...');
  await page.goto(`${BASE_URL}/owner`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('centum_phone', '9840123456');
    const input = document.querySelector('input[placeholder*="DEMO10"]');
    if (input) {
      input.value = 'DEMO10';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await new Promise((r) => setTimeout(r, 1200));
  const snap2Path = path.join(ARTIFACTS_DIR, '08_demo_owner_portal_prefilled_390px.png');
  await page.screenshot({ path: snap2Path });
  console.log(`  ✓ Saved ${snap2Path}`);

  await browser.close();
  console.log('🎉 Demo screenshots captured!');
  process.exitCode = 0;
}

captureDemoScreenshots().catch((err) => {
  console.error('Fatal demo capture error:', err);
  process.exit(1);
});
