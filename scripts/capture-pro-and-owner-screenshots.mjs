import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:\\Users\\aakaa\\.gemini\\antigravity-ide\\brain\\0a04389d-d547-4171-b5d0-524d92578d4c';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function capture() {
  console.log('🚀 Starting Screenshot Capture for Pro Screen and Owner Account...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();

  // -------------------------------------------------------------
  // 1. PRO SCREEN UNLOCKED (Desktop - 1280x800)
  // -------------------------------------------------------------
  console.log('📸 1. Capturing Pro Screen Unlocked (Desktop)...');
  await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}`, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Set Pro Student in localStorage and cookie
  await page.evaluate(() => {
    const studentObj = {
      phone: '7200200088',
      name: 'Centum Pro Student',
      standard: '10th',
      medium: 'english',
      plan: 'pro',
      district: 'Chennai',
      streak: 5,
      coins: 600,
      tuitionCode: 'DEMO10',
    };
    localStorage.setItem('centum_phone', '7200200088');
    localStorage.setItem('centum_student', JSON.stringify(studentObj));
    localStorage.setItem('centum_plan', 'pro');
  });

  await page.goto(`${BASE_URL}/pro?class=10&subject=Maths`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2000));

  const proDesktopPath = path.join(ARTIFACTS_DIR, '01_pro_screen_unlocked_desktop.png');
  await page.screenshot({ path: proDesktopPath, fullPage: false });
  console.log(`  ✓ Saved ${proDesktopPath}`);

  // -------------------------------------------------------------
  // 2. PRO SCREEN UNLOCKED (Mobile - 390x844)
  // -------------------------------------------------------------
  console.log('📸 2. Capturing Pro Screen Unlocked (Mobile 390px)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(`${BASE_URL}/pro?class=10&subject=Maths`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2000));

  const proMobilePath = path.join(ARTIFACTS_DIR, '02_pro_screen_unlocked_mobile.png');
  await page.screenshot({ path: proMobilePath, fullPage: false });
  console.log(`  ✓ Saved ${proMobilePath}`);

  // -------------------------------------------------------------
  // 3. TUITION OWNER PORTAL (Desktop - 1280x850) - Overview & Roster
  // -------------------------------------------------------------
  console.log('📸 3. Capturing Tuition Owner Portal - Roster & Stats (Desktop)...');
  await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/owner`, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Authenticate owner session
  await page.evaluate(() => {
    sessionStorage.setItem('centum_owner_session', JSON.stringify({
      ownerPhone: '7200200088',
      tuitionCode: 'DEMO10',
    }));
    window.location.reload();
  });
  await new Promise((r) => setTimeout(r, 2000));

  const ownerRosterPath = path.join(ARTIFACTS_DIR, '03_owner_portal_roster_desktop.png');
  await page.screenshot({ path: ownerRosterPath, fullPage: false });
  console.log(`  ✓ Saved ${ownerRosterPath}`);

  // -------------------------------------------------------------
  // 4. TUITION OWNER PORTAL - Attendance Tab (Desktop)
  // -------------------------------------------------------------
  console.log('📸 4. Capturing Tuition Owner Portal - Attendance Tab...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const attBtn = btns.find((b) => b.textContent && (b.textContent.includes('Attendance') || b.textContent.includes('வருகை')));
    if (attBtn) attBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const ownerAttendancePath = path.join(ARTIFACTS_DIR, '04_owner_portal_attendance_desktop.png');
  await page.screenshot({ path: ownerAttendancePath, fullPage: false });
  console.log(`  ✓ Saved ${ownerAttendancePath}`);

  // -------------------------------------------------------------
  // 5. TUITION OWNER PORTAL - Diary Tab (Desktop)
  // -------------------------------------------------------------
  console.log('📸 5. Capturing Tuition Owner Portal - Diary Tab...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const diaryBtn = btns.find((b) => b.textContent && (b.textContent.includes('Diary') || b.textContent.includes('நாட்குறிப்பு')));
    if (diaryBtn) diaryBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const ownerDiaryPath = path.join(ARTIFACTS_DIR, '05_owner_portal_diary_desktop.png');
  await page.screenshot({ path: ownerDiaryPath, fullPage: false });
  console.log(`  ✓ Saved ${ownerDiaryPath}`);

  // -------------------------------------------------------------
  // 6. TUITION OWNER PORTAL (Mobile - 390x844)
  // -------------------------------------------------------------
  console.log('📸 6. Capturing Tuition Owner Portal (Mobile)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(`${BASE_URL}/owner`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2000));

  const ownerMobilePath = path.join(ARTIFACTS_DIR, '06_owner_portal_mobile.png');
  await page.screenshot({ path: ownerMobilePath, fullPage: false });
  console.log(`  ✓ Saved ${ownerMobilePath}`);

  await browser.close();
  console.log('🎉 All screenshots captured successfully in artifacts directory!');
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
