// scripts/capture_screenshots.mjs
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;
const SCREENSHOT_DIR = 'F:\\ai\\screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('Starting headless Chrome on port', DEBUG_PORT);
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--user-data-dir=F:\\ai\\scratch\\chrome_user_dir',
    '--window-size=390,844',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
  ]);

  let connected = false;
  let targetWsUrl = null;

  // Poll for debugger URL
  for (let i = 0; i < 20; i++) {
    await delay(500);
    try {
      const res = await fetch(`http://localhost:${DEBUG_PORT}/json/list`);
      if (res.ok) {
        const targets = await res.json();
        if (targets.length > 0 && targets[0].webSocketDebuggerUrl) {
          targetWsUrl = targets[0].webSocketDebuggerUrl;
          connected = true;
          break;
        }
      }
    } catch (e) {
      // Waiting for chrome to start
    }
  }

  if (!connected || !targetWsUrl) {
    console.error('Failed to connect to Chrome debugger');
    chromeProcess.kill();
    process.exit(1);
  }

  console.log('Connected to Chrome target:', targetWsUrl);
  const ws = new WebSocket(targetWsUrl);

  let id = 1;
  const pending = new Map();

  ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  });

  if (ws.readyState !== 1 /* WebSocket.OPEN */) {
    await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
  }

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  // Set viewport to mobile standard 390x844 with DPR 3
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  async function capture(filename) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`[SAVED] ${outPath} (${buffer.length} bytes)`);
  }

  try {
    // ----------------------------------------------------
    // STEP 1: TASK IV - Home page without Pro box
    // ----------------------------------------------------
    console.log('\n--- Step 1: Home page (Task IV) ---');
    await send('Page.navigate', { url: 'http://localhost:3000/' });
    await delay(1500);

    // Set student in localStorage so greeting hero displays
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('centum_student', JSON.stringify({
          name: 'Kavitha',
          standard: '10th',
          medium: 'english',
          stream: ''
        }));
      `,
    });
    await send('Page.navigate', { url: 'http://localhost:3000/' });
    await delay(2000);
    await capture('task4_home_pro_removed_390px.png');

    // ----------------------------------------------------
    // STEP 2: TASK V - Pro Materials PYQ Papers compact list
    // ----------------------------------------------------
    console.log('\n--- Step 2: Pro Materials PYQ Papers (Task V) ---');
    await send('Page.navigate', { url: 'http://localhost:3000/pro-materials?classLevel=10' });
    await delay(2000);

    // Click "Papers" type button
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const papersBtn = btns.find(b => b.innerText.includes('Papers') || b.innerText.includes('வினாத்தாள்கள்'));
          if (papersBtn) papersBtn.click();
        })()
      `,
    });
    await delay(1500);
    await capture('task5_pro_materials_pyq_compact_390px.png');

    // ----------------------------------------------------
    // STEP 3: TASK VI & VII - Classroom instant unjoined & View Demo Classroom modal
    // ----------------------------------------------------
    console.log('\n--- Step 3: Classroom Instant & Demo Modal (Tasks VI & VII) ---');
    await send('Page.navigate', { url: 'http://localhost:3000/classroom' });
    await delay(1000);
    await capture('task6_classroom_instant_unjoined_390px.png');

    // Click "View Demo Classroom ✨"
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const demoBtn = btns.find(b => b.innerText.includes('View Demo Classroom') || b.innerText.includes('மாதிரி வகுப்பறை'));
          if (demoBtn) demoBtn.click();
        })()
      `,
    });
    await delay(1500);
    await capture('task7_demo_classroom_modal_390px.png');

    // ----------------------------------------------------
    // STEP 4: TASK I - Tests Flow: Subject -> Grouped Chapters -> Modal -> Playable Question
    // ----------------------------------------------------
    console.log('\n--- Step 4: Tests Flow (Task I) ---');
    await send('Page.navigate', { url: 'http://localhost:3000/tests' });
    await delay(2000);

    // 1. Open "select subject" dropdown
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const selectBtn = btns.find(b => b.innerText.includes('select subject') || b.innerText.includes('பாடத்தை') || b.innerText.includes('▾'));
          if (selectBtn) selectBtn.click();
        })()
      `,
    });
    await delay(800);

    // 2. Select Maths from the dropdown
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const mathsBtn = btns.find(b => b.innerText.trim() === 'Maths' || b.innerText.trim() === 'கணிதம்');
          if (mathsBtn) mathsBtn.click();
        })()
      `,
    });
    await delay(3000);
    await capture('task1_tests_grouped_chapters_390px.png');

    // 3. Click the first chapter card
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cards = Array.from(document.querySelectorAll('div[class*="cursor-pointer"]'));
          const chCard = cards.find(c => c.innerText.includes('Chapter 1') || c.innerText.includes('Relations and Functions') || c.innerText.includes('பாடம் 1'));
          if (chCard) chCard.click();
        })()
      `,
    });
    await delay(1200);
    await capture('task1_test_confirm_modal_390px.png');

    // 4. Click "start →" in modal to begin test
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const modal = document.querySelector('div[role="dialog"]');
          if (modal) {
            const startBtn = modal.querySelector('button[class*="bg-[#A3E635]"]') || Array.from(modal.querySelectorAll('button')).find(b => b.innerText.includes('start') || b.innerText.includes('தொடங்கு'));
            if (startBtn) startBtn.click();
          }
        })()
      `,
    });
    await delay(3500);
    await capture('task1_test_runner_playable_390px.png');

    console.log('\n================ ALL SCREENSHOTS CAPTURED! ================');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    ws.close();
    chromeProcess.kill();
  }
}

main().catch(console.error);
