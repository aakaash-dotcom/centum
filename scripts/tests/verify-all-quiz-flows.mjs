import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = process.env.TARGET_URL || 'http://localhost:3000';

const TEST_FLOWS = [
  {
    name: 'Class 10 Maths English Concept Ch1',
    classLevel: '10th',
    subject: 'Maths',
    medium: 'english',
    type: 'concept',
    chapter: 'Relations and Functions',
    count: '10',
    expectQuestions: true
  },
  {
    name: 'Class 10 Science English Concept Ch1',
    classLevel: '10th',
    subject: 'Science',
    medium: 'english',
    type: 'concept',
    chapter: 'Laws of Motion',
    count: '10',
    expectQuestions: true
  },
  {
    name: 'Class 10 Social Science English Concept Ch1',
    classLevel: '10th',
    subject: 'Social Science',
    medium: 'english',
    type: 'concept',
    chapter: 'History 1 - Outbreak of World War I and Its Aftermath',
    count: '10',
    expectQuestions: true
  },
  {
    name: 'Class 10 Maths English Oneword Ch1',
    classLevel: '10th',
    subject: 'Maths',
    medium: 'english',
    type: 'oneword',
    chapter: 'Relations and Functions',
    count: '15',
    expectQuestions: true
  },
  {
    name: 'Class 10 Maths Tamil Concept Ch1',
    classLevel: '10th',
    subject: 'Maths',
    medium: 'tamil',
    type: 'concept',
    chapter: 'உறவுகளும் சார்புகளும்',
    count: '10',
    expectQuestions: true
  },
  {
    name: 'Class 12 Physics English Oneword Ch1',
    classLevel: '12th',
    subject: 'Physics',
    medium: 'english',
    type: 'oneword',
    chapter: 'Electrostatics',
    count: '15',
    expectQuestions: true
  },
  {
    name: 'Class 11 Maths English Concept Ch1 (Empty subject/content in bank)',
    classLevel: '11th',
    subject: 'Maths',
    medium: 'english',
    type: 'concept',
    chapter: 'Sets, Relations and Functions',
    count: '10',
    expectQuestions: false
  }
];

async function main() {
  console.log('======================================================================');
  console.log('ISOLATED VERIFICATION OF ALL STUDENT FLOWS (PORT 3001)');
  console.log('======================================================================\n');

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: false,
      args: ['--no-sandbox', '--window-size=480,920', '--window-position=50,50']
    });
  } catch (err) {
    console.log('Visible launch failed, using headless:', err.message);
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--window-size=480,920']
    });
  }

  const results = [];

  for (const flow of TEST_FLOWS) {
    console.log(`\n----------------------------------------------------------------------`);
    console.log(`TESTING FLOW: ${flow.name}`);
    console.log(`----------------------------------------------------------------------`);

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });

    let capturedReq = null;
    page.on('response', async res => {
      if (res.url().includes('/api/questions') && res.request().method() === 'GET') {
        const ct = res.headers()['content-type'] || '';
        let body = null;
        if (ct.includes('application/json')) body = await res.json().catch(() => null);
        capturedReq = {
          url: res.url(),
          status: res.status(),
          servedFrom: body?.servedFrom || res.headers()['x-served-from'],
          count: body?.questions ? body.questions.length : 0,
          ok: body?.ok
        };
      }
    });

    const p = new URLSearchParams({
      standard: flow.classLevel,
      subject: flow.subject,
      chapter: flow.chapter,
      type: flow.type,
      medium: flow.medium,
      count: flow.count
    });

    const runnerUrl = `${BASE_URL}/test-runner?${p.toString()}`;
    await page.goto(runnerUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    // Wait for either quiz options or error screen to render
    await page.waitForSelector('[data-testid^="quiz-option-"], [role="status"], h2', { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));


    const text = await page.evaluate(() => document.body.innerText || '');
    const hasTamilBanner = text.includes('தரவு இணைப்பு தற்காலிகமாக இல்லை');
    const hasEnglishBanner = text.includes('Connection Temporarily Unavailable');
    const optionCount = await page.evaluate(() => document.querySelectorAll('[data-testid^="quiz-option-"]').length);
    const h2Prompt = await page.evaluate(() => document.querySelector('h2')?.innerText || '');

    console.log('  • URL:', runnerUrl);
    console.log('  • Browser-initiated GET /api/questions:');
    console.log('      Status:     ', capturedReq?.status);
    console.log('      servedFrom: ', capturedReq?.servedFrom);
    console.log('      Count:      ', capturedReq?.count);
    console.log('  • Screen State:');
    console.log('      Tamil Error Banner:   ', hasTamilBanner);
    console.log('      English Error Banner: ', hasEnglishBanner);
    console.log('      Option Count:         ', optionCount);
    console.log('      H2 Text:              ', JSON.stringify(h2Prompt.slice(0, 60)));

    let pass = false;
    if (flow.expectQuestions) {
      if (optionCount === 4 && !hasTamilBanner && !hasEnglishBanner) {
        pass = true;
        console.log('  ✓ PASS: Quiz rendered cleanly with 4 options and ZERO error banner.');
      } else {
        console.error('  ❌ FAIL: Expected active quiz, but got banner or missing options!');
      }
    } else {
      // Empty bank (e.g. Class 11 has no questions in fallback catalog)
      // Must NOT display Tamil banner for English student!
      if (flow.medium === 'english' && !hasTamilBanner && hasEnglishBanner) {
        pass = true;
        console.log('  ✓ PASS: Honest English empty state displayed (no Tamil banner for English student).');
      } else if (flow.medium === 'tamil' && hasTamilBanner) {
        pass = true;
        console.log('  ✓ PASS: Honest Tamil empty state displayed.');
      } else {
        console.error('  ❌ FAIL: Banner language did not match requested medium!');
      }
    }

    results.push({ flow: flow.name, pass, capturedReq, optionCount, hasTamilBanner, hasEnglishBanner });
    await page.close();
  }

  await browser.close();

  console.log('\n======================================================================');
  console.log('ALL FLOWS SUMMARY:');
  console.log('======================================================================');
  let allPassed = true;
  for (const r of results) {
    console.log(`${r.pass ? '✓ PASS' : '❌ FAIL'}: ${r.flow}`);
    if (!r.pass) allPassed = false;
  }
  console.log('======================================================================\n');

  if (!allPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
