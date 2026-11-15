#!/usr/bin/env node

/**
 * scripts/tests/puppeteer-student-preview.mjs
 * 
 * End-to-end browser verification of:
 * 1. Tests notice removal on /tests
 * 2. News and Leaderboard loading without ghost errors
 * 3. Student Demo Classroom redesign (theme toggle, compact 3 tiles, enrolled card, diary, performance)
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';

async function findChromePath() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.CHROME_BIN,
  ];
  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) return p;
  }
  throw new Error('Chrome executable not found');
}

async function runPreviewSuite() {
  console.log('===============================================================');
  console.log('   PUPPETEER BROWSER PREVIEW VERIFICATION');
  console.log('===============================================================\n');

  const executablePath = await findChromePath();
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  let allPassed = true;

  try {
    // ------------------------------------------------------------------------
    // 1. Verify /tests
    // ------------------------------------------------------------------------
    console.log('1. Checking /tests screen...');
    await page.goto(`${BASE_URL}/tests`, { waitUntil: 'domcontentloaded' });

    const offlineBanner = await page.$('[data-testid="fallback-offline-banner"]');
    if (offlineBanner) {
      console.error('  ❌ FAIL: Persistent offline banner found on /tests');
      allPassed = false;
    } else {
      console.log('  ✓ No persistent offline/saved bank banner on /tests');
    }

    const testHeading = await page.evaluate(() => document.body.innerText.includes('தேர்வுகள்') || document.body.innerText.includes('Tests'));
    if (!testHeading) {
      console.error('  ❌ FAIL: Tests page did not render expected heading');
      allPassed = false;
    } else {
      console.log('  ✓ Tests screen loaded and usable');
    }

    // ------------------------------------------------------------------------
    // 2. Verify /news and /api/news & /api/leaderboard
    // ------------------------------------------------------------------------
    console.log('\n2. Checking News and Leaderboard endpoints and UI...');
    const newsApiRes = await page.evaluate(async (url) => {
      const res = await fetch(`${url}/api/news`);
      const json = await res.json();
      return { status: res.status, ok: res.ok, count: json.news?.length, source: json.source };
    }, BASE_URL);

    console.log(`  • /api/news result: HTTP ${newsApiRes.status}, count: ${newsApiRes.count}, source: ${newsApiRes.source}`);
    if (newsApiRes.status !== 200 || !newsApiRes.count) {
      console.error('  ❌ FAIL: /api/news did not return 200 with news data');
      allPassed = false;
    } else {
      console.log('  ✓ /api/news returned 200 with fallback news data');
    }

    const lbApiRes = await page.evaluate(async (url) => {
      const res = await fetch(`${url}/api/leaderboard?standard=10th`);
      const json = await res.json();
      return { status: res.status, ok: res.ok, count: json.leaderboard?.length, source: json.source };
    }, BASE_URL);

    console.log(`  • /api/leaderboard result: HTTP ${lbApiRes.status}, count: ${lbApiRes.count}, source: ${lbApiRes.source}`);
    if (lbApiRes.status !== 200 || !lbApiRes.count) {
      console.error('  ❌ FAIL: /api/leaderboard did not return 200 with leaderboard data');
      allPassed = false;
    } else {
      console.log('  ✓ /api/leaderboard returned 200 with fallback leaderboard data');
    }

    await page.goto(`${BASE_URL}/news`, { waitUntil: 'domcontentloaded' });
    const hasGhostSlang = await page.evaluate(() => document.body.innerText.includes('signal ghost'));
    const hasGhostEmoji = await page.evaluate(() => document.body.innerText.includes('👻'));

    if (hasGhostSlang || hasGhostEmoji) {
      console.error('  ❌ FAIL: News page still displays ghost slang or emoji');
      allPassed = false;
    } else {
      console.log('  ✓ News page loads cleanly without ghost slang or error trap');
    }

    // ------------------------------------------------------------------------
    // 3. Verify /classroom Demo modal
    // ------------------------------------------------------------------------
    console.log('\n3. Checking Student Demo Classroom on /classroom...');
    await page.goto(`${BASE_URL}/classroom`, { waitUntil: 'domcontentloaded' });

    // Click "Explore Demo" button
    const demoButton = await page.$('button[type="button"]');
    const demoButtonFound = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find((b) => b.innerText.includes('Explore Demo') || b.innerText.includes('மாதிரி பார்க்க'));
      if (target) {
        target.click();
        return true;
      }
      return false;
    });

    if (!demoButtonFound) {
      console.error('  ❌ FAIL: Could not find Explore Demo button');
      allPassed = false;
    } else {
      console.log('  ✓ Clicked Explore Demo button');
    }

    await new Promise((r) => setTimeout(r, 600));

    // Check modal dialog
    const modal = await page.$('div[role="dialog"]');
    if (!modal) {
      console.error('  ❌ FAIL: Demo dialog modal did not open');
      allPassed = false;
    } else {
      console.log('  ✓ Demo modal opened');
    }

    // Check Theme Toggle
    const themeBtn = await page.$('[data-testid="demo-theme-toggle"]');
    const initialThemeText = await page.evaluate((el) => el?.innerText, themeBtn);
    console.log(`  • Initial theme toggle text: "${initialThemeText?.trim()}"`);
    if (!initialThemeText?.includes('Light')) {
      console.error('  ❌ FAIL: Default theme should be Light');
      allPassed = false;
    } else {
      console.log('  ✓ Light theme is the default');
    }

    // Toggle to Dark
    await themeBtn.click();
    await new Promise((r) => setTimeout(r, 200));
    const savedTheme = await page.evaluate(() => localStorage.getItem('centum_demo_theme'));
    console.log(`  • localStorage centum_demo_theme after toggle: "${savedTheme}"`);
    if (savedTheme !== 'dark') {
      console.error('  ❌ FAIL: Theme selection not saved to localStorage as "dark"');
      allPassed = false;
    } else {
      console.log('  ✓ Toggled to dark theme and remembered in localStorage');
    }

    // Toggle back to Light
    await themeBtn.click();
    await new Promise((r) => setTimeout(r, 200));
    const restoredTheme = await page.evaluate(() => localStorage.getItem('centum_demo_theme'));
    if (restoredTheme !== 'light') {
      console.error('  ❌ FAIL: Theme selection not restored to "light"');
      allPassed = false;
    } else {
      console.log('  ✓ Toggled back to light theme and remembered');
    }

    // Check Enrolled Classroom Card (only classroom name and teacher name)
    const cardText = await page.evaluate(() => {
      const card = document.querySelector('[data-testid="demo-enrolled-card"]');
      return card ? card.innerText : '';
    });
    console.log(`  • Enrolled Card Content:\n${cardText.split('\n').map(l => '      ' + l).join('\n')}`);

    const hasNameAndTeacher =
      cardText.includes("Ravi's Tuition Centre") &&
      cardText.includes('Dr. Ravi');
    const hasNoCodeOrBatch =
      !cardText.includes('DEMO10') &&
      !cardText.includes('Batch Details') &&
      !cardText.includes('Timings & Days');

    if (!hasNameAndTeacher || !hasNoCodeOrBatch) {
      console.error('  ❌ FAIL: Enrolled card must show ONLY classroom name and teacher name, without access code or batch details');
      allPassed = false;
    } else {
      console.log('  ✓ Enrolled card displays ONLY classroom name and teacher name (code & batch box removed)');
    }

    // Check 3 Compact Tiles
    const tilesFound = await page.evaluate(() => {
      const att = document.querySelector('[data-testid="demo-tile-attendance"]');
      const diary = document.querySelector('[data-testid="demo-tile-diary"]');
      const perf = document.querySelector('[data-testid="demo-tile-performance"]');
      return {
        att: att ? att.innerText.replace(/\n+/g, ' ') : null,
        diary: diary ? diary.innerText.replace(/\n+/g, ' ') : null,
        perf: perf ? perf.innerText.replace(/\n+/g, ' ') : null,
      };
    });

    console.log('  • First Dashboard Compact Tiles:');
    console.log(`      Attendance:  ${tilesFound.att}`);
    console.log(`      Diary:       ${tilesFound.diary}`);
    console.log(`      Performance: ${tilesFound.perf}`);

    if (!tilesFound.att || !tilesFound.diary || !tilesFound.perf) {
      console.error('  ❌ FAIL: Missing one or more of the 3 compact tiles');
      allPassed = false;
    } else {
      console.log('  ✓ 3 compact tiles verified on first dashboard');
    }

    // Test Diary Tile click -> opens teacher notes
    await page.click('[data-testid="demo-tile-diary"]');
    await new Promise((r) => setTimeout(r, 200));
    const diaryPageText = await page.evaluate(() => document.querySelector('div[role="dialog"]')?.innerText || '');
    if (!diaryPageText.includes("Teacher's Notes") && !diaryPageText.includes('Maths Chapter 1')) {
      console.error("  ❌ FAIL: Diary tile did not open teacher's notes");
      allPassed = false;
    } else {
      console.log("  ✓ Diary tile opened teacher's notes feed with real notes");
    }

    // Click Back to Dashboard
    await page.click('[data-testid="demo-back-dashboard"]');
    await new Promise((r) => setTimeout(r, 200));

    // Test Performance Tile click -> opens individual student stats only
    await page.click('[data-testid="demo-tile-performance"]');
    await new Promise((r) => setTimeout(r, 200));
    const perfPageText = await page.evaluate(() => document.querySelector('div[role="dialog"]')?.innerText || '');
    const hasBatchStats =
      perfPageText.includes('Class Average') ||
      perfPageText.includes('Class Rank') ||
      perfPageText.includes('Academy Seat Capacity');

    if (hasBatchStats) {
      console.error('  ❌ FAIL: Performance view still includes batch-wide stats');
      allPassed = false;
    } else {
      console.log('  ✓ Performance view displays individual student stats only (never batch-wide stats)');
    }

  } catch (err) {
    console.error('Unexpected error during browser preview:', err);
    allPassed = false;
  } finally {
    await browser.close();
  }

  console.log('\n===============================================================');
  if (allPassed) {
    console.log('🎉 ALL BROWSER PREVIEW TESTS PASSED SUCCESSFULLY!');
    console.log('===============================================================\n');
    process.exit(0);
  } else {
    console.error('💥 BROWSER PREVIEW TESTS FAILED.');
    console.log('===============================================================\n');
    process.exit(1);
  }
}

runPreviewSuite();
