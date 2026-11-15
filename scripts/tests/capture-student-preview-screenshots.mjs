#!/usr/bin/env node

/**
 * scripts/tests/capture-student-preview-screenshots.mjs
 * 
 * Takes high-resolution screenshots for review before deployment:
 * 1. Tests page (Desktop & Mobile) - verifies no persistent banner
 * 2. News page (Desktop & Mobile) - verifies sample notice banner
 * 3. Leaderboard / Home (Desktop & Mobile) - verifies sample preview badge & notice
 * 4. Classroom (Light Theme Desktop & Mobile) - verifies light mode default, 3 tiles, Ravichandran, demo labels
 * 5. Classroom (Dark Theme Toggle Desktop & Mobile) - verifies dark mode toggle and styling
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const ARTIFACT_DIR = 'C:\\Users\\aakaa\\.gemini\\antigravity-ide\\brain\\24041e92-7ebc-4d78-b432-06b62cb179a9';

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

async function capture() {
  console.log('===============================================================');
  console.log('   CAPTURING STUDENT-FACING PREVIEW SCREENSHOTS');
  console.log('===============================================================\n');

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const localDocsDir = path.join(process.cwd(), 'docs', 'previews');
  if (!fs.existsSync(localDocsDir)) {
    fs.mkdirSync(localDocsDir, { recursive: true });
  }

  const executablePath = await findChromePath();
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  async function takeScreenshot(url, filename, isMobile = false, setupFn = null) {
    const width = isMobile ? 375 : 1280;
    const height = isMobile ? 812 : 900;
    await page.setViewport({ width, height, isMobile });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    if (setupFn) {
      await setupFn(page);
      await new Promise(r => setTimeout(r, 800));
    }

    const artifactPath = path.join(ARTIFACT_DIR, filename);
    const localPath = path.join(localDocsDir, filename);

    await page.screenshot({ path: artifactPath, fullPage: false });
    fs.copyFileSync(artifactPath, localPath);

    console.log(`  📸 Captured [${isMobile ? 'Mobile' : 'Desktop'}]: ${filename}`);
  }

  // 1. Tests Page
  console.log('--- 1. Tests Page Screenshots ---');
  await takeScreenshot(`${BASE_URL}/tests`, 'tests_desktop.png', false);
  await takeScreenshot(`${BASE_URL}/tests`, 'tests_mobile.png', true);

  // 2. News Page
  console.log('\n--- 2. News Page Screenshots ---');
  await takeScreenshot(`${BASE_URL}/news`, 'news_desktop.png', false);
  await takeScreenshot(`${BASE_URL}/news`, 'news_mobile.png', true);

  // 3. Leaderboard Box (on Home Page for Registered Student)
  console.log('\n--- 3. Leaderboard Screenshots ---');
  const setupRegisteredStudent = async (p) => {
    await p.evaluate(() => {
      localStorage.setItem('centum_student', JSON.stringify({
        name: 'Ananya',
        phone: '9876543210',
        standard: '10th',
        medium: 'english',
        district: 'Madurai',
        registeredAt: new Date().toISOString()
      }));
    });
    await p.reload({ waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));
    await p.evaluate(() => {
      const banner = document.querySelector('[data-testid="leaderboard-sample-banner"]');
      const badge = document.querySelector('[data-testid="leaderboard-sample-badge"]');
      const target = banner || badge;
      if (target) {
        target.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });
  };
  await takeScreenshot(`${BASE_URL}/`, 'leaderboard_desktop.png', false, setupRegisteredStudent);
  await takeScreenshot(`${BASE_URL}/`, 'leaderboard_mobile.png', true, setupRegisteredStudent);

  // 4. Classroom - Light Mode
  console.log('\n--- 4. Classroom (Light Theme Default) ---');
  const setupClassroomLight = async (p) => {
    await p.evaluate(() => {
      localStorage.setItem('centum_demo_theme', 'light');
    });
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find((b) => b.innerText.includes('Explore Demo') || b.innerText.includes('மாதிரி பார்க்க'));
      if (target) target.click();
    });
    await new Promise(r => setTimeout(r, 800));
  };
  await takeScreenshot(`${BASE_URL}/classroom`, 'classroom_light_desktop.png', false, setupClassroomLight);
  await takeScreenshot(`${BASE_URL}/classroom`, 'classroom_light_mobile.png', true, setupClassroomLight);

  // 5. Classroom - Dark Mode
  console.log('\n--- 5. Classroom (Dark Theme Toggle) ---');
  const setupClassroomDark = async (p) => {
    await p.evaluate(() => {
      localStorage.setItem('centum_demo_theme', 'dark');
    });
    await p.reload({ waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 800));
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find((b) => b.innerText.includes('Explore Demo') || b.innerText.includes('மாதிரி பார்க்க'));
      if (target) target.click();
    });
    await new Promise(r => setTimeout(r, 800));
  };
  await takeScreenshot(`${BASE_URL}/classroom`, 'classroom_dark_desktop.png', false, setupClassroomDark);
  await takeScreenshot(`${BASE_URL}/classroom`, 'classroom_dark_mobile.png', true, setupClassroomDark);

  await browser.close();
  console.log('\n✅ All preview screenshots captured successfully into artifacts and docs/previews!');
}

capture().catch((err) => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
