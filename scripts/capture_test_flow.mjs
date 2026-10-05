// scripts/capture_test_flow.mjs
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;
const SCREENSHOT_DIR = 'F:\\ai\\screenshots';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('Starting headless Chrome for test flow...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--user-data-dir=F:\\ai\\scratch\\chrome_test_dir',
    '--window-size=390,844',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
  ]);

  let targetWsUrl = null;
  for (let i = 0; i < 20; i++) {
    await delay(500);
    try {
      const res = await fetch(`http://localhost:${DEBUG_PORT}/json/list`);
      if (res.ok) {
        const targets = await res.json();
        if (targets.length > 0 && targets[0].webSocketDebuggerUrl) {
          targetWsUrl = targets[0].webSocketDebuggerUrl;
          break;
        }
      }
    } catch (e) {}
  }

  if (!targetWsUrl) {
    console.error('Failed to connect');
    chromeProcess.kill();
    process.exit(1);
  }

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

  if (ws.readyState !== 1) {
    await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
  }

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

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
    console.log('\n--- 1. Navigating to /tests ---');
    await send('Page.navigate', { url: 'http://localhost:3000/tests' });
    await delay(1000);

    // Set registered student so gates pass directly to confirmation modal
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('centum_student', JSON.stringify({
          name: 'Kavitha',
          phone: '9876543210',
          standard: '10th',
          medium: 'english',
          stream: ''
        }));
      `,
    });
    await send('Page.navigate', { url: 'http://localhost:3000/tests' });
    await delay(2000);

    // Click "select subject ▾"
    console.log('--- 2. Opening subject dropdown ---');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const selectBtn = btns.find(b => b.innerText.includes('select subject') || b.innerText.includes('பாடத்தை') || b.innerText.includes('▾'));
          if (selectBtn) selectBtn.click();
        })()
      `,
    });
    await delay(1000);

    // Select Maths
    console.log('--- 3. Picking Maths ---');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const mathsBtn = btns.find(b => b.innerText.trim() === 'Maths' || b.innerText.trim() === 'கணிதம்');
          if (mathsBtn) mathsBtn.click();
        })()
      `,
    });

    // Poll until chapter cards are in DOM
    console.log('--- 4. Waiting for chapter cards ---');
    for (let i = 0; i < 20; i++) {
      await delay(500);
      const evalRes = await send('Runtime.evaluate', {
        expression: `document.querySelectorAll('h4').length`,
      });
      if (evalRes.result?.value > 0) {
        console.log(`Found ${evalRes.result.value} chapter cards in DOM`);
        break;
      }
    }
    await delay(1000);
    await capture('task1_tests_grouped_chapters_390px.png');

    // Click on Chapter 1
    console.log('--- 5. Clicking Chapter 1 ---');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const headings = Array.from(document.querySelectorAll('h4'));
          const ch1Heading = headings.find(h => h.innerText.includes('Relations') || h.parentElement.innerText.includes('Chapter 1'));
          if (ch1Heading) {
            ch1Heading.closest('div[class*="cursor-pointer"]').click();
          } else {
            const cards = Array.from(document.querySelectorAll('div[class*="cursor-pointer"]'));
            if (cards.length > 0) cards[0].click();
          }
        })()
      `,
    });

    // Poll for modal
    console.log('--- 6. Waiting for start modal ---');
    for (let i = 0; i < 15; i++) {
      await delay(300);
      const evalRes = await send('Runtime.evaluate', {
        expression: `!!document.querySelector('div[role="dialog"]')`,
      });
      if (evalRes.result?.value) break;
    }
    await delay(600);
    await capture('task1_test_confirm_modal_390px.png');

    // Click Start Test
    console.log('--- 7. Clicking Start in modal ---');
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

    // Wait for test runner to load question
    console.log('--- 8. Waiting for test runner ---');
    for (let i = 0; i < 20; i++) {
      await delay(500);
      const evalRes = await send('Runtime.evaluate', {
        expression: `document.querySelectorAll('button').length > 4`,
      });
      if (evalRes.result?.value) break;
    }
    await delay(1500);
    await capture('task1_test_runner_playable_390px.png');

    console.log('Test flow capture finished successfully!');
  } catch (err) {
    console.error('Error in test flow:', err);
  } finally {
    ws.close();
    chromeProcess.kill();
  }
}

main().catch(console.error);
