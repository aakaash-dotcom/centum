import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = process.env.TARGET_URL || 'https://www.centumapp.in';

async function testPage(medium = 'english', plan = 'free') {
  console.log(`\n======================================================`);
  console.log(`TESTING TESTS PAGE: medium=${medium}, plan=${plan}`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`======================================================`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 414, height: 896, isMobile: true });

  const apiResponses = [];

  page.on('response', async res => {
    if (res.url().includes('/api/questions')) {
      try {
        const text = await res.text();
        const json = JSON.parse(text);
        apiResponses.push({
          url: res.url(),
          status: res.status(),
          servedFrom: json.servedFrom,
          count: json.questions ? json.questions.length : 0,
          lockedCount: json.lockedChapters ? json.lockedChapters.length : 0
        });
      } catch (e) {
        apiResponses.push({
          url: res.url(),
          status: res.status(),
          error: e.message
        });
      }
    }
  });

  // Pre-seed localStorage if needed (e.g. medium, plan)
  await page.goto(`${BASE_URL}/tests`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((m, p) => {
    localStorage.setItem('centum_medium', m);
    if (p === 'pro') {
      localStorage.setItem('centum_plan', 'pro');
      localStorage.setItem('centum_student', JSON.stringify({
        name: 'Pro Student',
        phone: '9876543211',
        standard: '12th',
        stream: 'Science (Maths-Bio)',
        plan: 'pro'
      }));
    } else {
      localStorage.removeItem('centum_plan');
      localStorage.setItem('centum_student', JSON.stringify({
        name: 'Free Student',
        phone: '9876543210',
        standard: '12th',
        stream: 'Science (Maths-Bio)',
        plan: 'free'
      }));
    }
  }, medium, plan);

  // Reload to apply profile
  await page.goto(`${BASE_URL}/tests`, { waitUntil: 'networkidle2' });

  // Select 12th standard if not already selected
  const std12Btn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.trim() === '12th');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Selected 12th standard:', std12Btn);
  await new Promise(r => setTimeout(r, 600));

  // Open Subject Selector & select Physics
  console.log('Opening Subject Selector...');
  const clickedTrigger = await page.evaluate(() => {
    const trigger = document.querySelector('button[data-testid="subject-select-trigger"]');
    if (trigger) {
      trigger.click();
      return true;
    }
    return false;
  });
  console.log('Clicked subject-select-trigger:', clickedTrigger);
  await new Promise(r => setTimeout(r, 500));

  const clickedPhysics = await page.evaluate(() => {
    const opt = document.querySelector('button[data-testid="subject-option-physics"]');
    if (opt) {
      opt.click();
      return true;
    }
    return false;
  });
  console.log('Clicked subject-option-physics:', clickedPhysics);
  await new Promise(r => setTimeout(r, 2000));

  console.log('\nCaptured API Responses for Physics:');
  console.log(JSON.stringify(apiResponses, null, 2));

  // Capture State for ALL (default: Merged)
  const defaultState = await page.evaluate(() => {
    const banner = document.querySelector('[data-testid="fallback-offline-banner"]');
    const cards = Array.from(document.querySelectorAll('.space-y-2 span'))
      .map(el => el.textContent.trim())
      .filter(t => t.includes('Practice') || t.includes('அனைத்து') || t.includes('Electrostatics') || t.includes('Q'));
    const missingContentHeading = document.querySelector('[data-testid="missing-content-heading"]');
    return {
      hasFallbackBanner: Boolean(banner),
      bannerText: banner ? banner.textContent.trim() : null,
      cards,
      missingContent: missingContentHeading ? missingContentHeading.textContent.trim() : null
    };
  });
  console.log('\nDefault (Merged all) Screen State:', defaultState);

  // Test Book-back tab
  console.log('\n--- Testing Book-back Tab ---');
  await page.evaluate(() => {
    const tab = document.querySelector('[data-testid="bookback-filter-tab"]');
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const bookbackState = await page.evaluate(() => {
    const banner = document.querySelector('[data-testid="fallback-offline-banner"]');
    const cards = Array.from(document.querySelectorAll('.space-y-2 span'))
      .map(el => el.textContent.trim())
      .filter(t => t.includes('Practice') || t.includes('Electrostatics') || t.includes('Q'));
    const missingContentHeading = document.querySelector('[data-testid="missing-content-heading"]');
    return {
      hasFallbackBanner: Boolean(banner),
      bannerText: banner ? banner.textContent.trim() : null,
      cards,
      missingContent: missingContentHeading ? missingContentHeading.textContent.trim() : null
    };
  });
  console.log('Book-back Screen State:', bookbackState);

  // Test Concept tab
  console.log('\n--- Testing Concept Tab ---');
  await page.evaluate(() => {
    const tab = document.querySelector('[data-testid="concept-filter-tab"]');
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const conceptState = await page.evaluate(() => {
    const banner = document.querySelector('[data-testid="fallback-offline-banner"]');
    const cards = Array.from(document.querySelectorAll('.space-y-2 span'))
      .map(el => el.textContent.trim())
      .filter(t => t.includes('Practice') || t.includes('Electrostatics') || t.includes('Q'));
    const missingContentHeading = document.querySelector('[data-testid="missing-content-heading"]');
    return {
      hasFallbackBanner: Boolean(banner),
      bannerText: banner ? banner.textContent.trim() : null,
      cards,
      missingContent: missingContentHeading ? missingContentHeading.textContent.trim() : null
    };
  });
  console.log('Concept Screen State:', conceptState);

  // Switch back to Book-back or Merged to test start quiz flow
  console.log('\n--- Testing Tap Chapter & Start Quiz Flow ---');
  await page.evaluate(() => {
    const tab = document.querySelector('[data-testid="bookback-filter-tab"]') || document.querySelector('[data-testid="all-filter-tab"]');
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const tapResult = await page.evaluate(() => {
    const card = document.querySelector('.space-y-2 div[class*="cursor-pointer"]');
    if (card) {
      card.click();
      return { clicked: true, text: card.textContent.trim() };
    }
    return { clicked: false };
  });
  console.log('Tapped card result:', tapResult);
  await new Promise(r => setTimeout(r, 800));

  const modalState = await page.evaluate(() => {
    const modal = document.querySelector('[data-testid="confirm-quiz-modal"]');
    const startBtn = document.querySelector('[data-testid="confirm-start-quiz-btn"]');
    const toasts = Array.from(document.querySelectorAll('div')).filter(d => {
      const t = d.textContent || '';
      return t.includes('தற்காலிகமாக') || t.includes('தரவு') || t.includes('Unavailable');
    }).map(d => d.textContent.trim());
    return {
      modalVisible: Boolean(modal),
      startBtnVisible: Boolean(startBtn),
      modalText: modal ? modal.textContent.trim().slice(0, 150) : null,
      toasts
    };
  });
  console.log('Modal state after tap:', modalState);

  if (modalState.startBtnVisible) {
    console.log('Clicking Start Quiz in modal...');
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="confirm-start-quiz-btn"]');
      if (btn) btn.click();
    });

    // Wait for client-side navigation to /test-runner and questions to render
    await page.waitForSelector('[data-testid="quiz-option-0"], h2', { timeout: 8000 }).catch(e => console.log('Wait for quiz-option-0 timeout:', e.message));
    await new Promise(r => setTimeout(r, 1000));

    const runnerState = await page.evaluate(() => {
      const currentUrl = window.location.href;
      const optionButtons = document.querySelectorAll('[data-testid^="quiz-option-"]');
      const questionText = document.querySelector('h2');
      const banner = document.querySelector('[data-testid="test-runner-offline-banner"]');
      const alerts = Array.from(document.querySelectorAll('[role="alert"], .bg-rose-500'))
        .map(a => a.textContent.trim());
      return {
        currentUrl,
        optionsCount: optionButtons.length,
        has4Options: optionButtons.length === 4,
        questionText: questionText ? questionText.textContent.trim() : null,
        offlineNotice: banner ? banner.textContent.trim() : null,
        alerts
      };
    });
    console.log('Test Runner State:', runnerState);
  }

  await browser.close();
}

async function main() {
  await testPage('english', 'free');
  await testPage('tamil', 'free');
}

main().catch(console.error);
