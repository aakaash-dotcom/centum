import assert from 'node:assert/strict';

// Import route handlers directly to test without requiring a running HTTP server
import { GET as getNotes } from '../../src/app/api/notes/route.ts';
import { GET as getDiagrams } from '../../src/app/api/diagrams/route.ts';
import { GET as getHandwritten } from '../../src/app/api/handwritten/route.ts';

console.log('===============================================================');
console.log('    TEST SUITE: PRO SHELF NEW SHEET-DRIVEN API ENDPOINTS       ');
console.log('===============================================================\n');

let failedTests = 0;

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failedTests++;
  }
}

async function run() {
  const endpoints = [
    { name: '/api/notes', handler: getNotes },
    { name: '/api/diagrams', handler: getDiagrams },
    { name: '/api/handwritten', handler: getHandwritten },
  ];

  for (const ep of endpoints) {
    console.log(`--- Testing Endpoint: ${ep.name} ---`);

    await runAsyncTest(`${ep.name} returns correct schema with defaults`, async () => {
      const req = new Request('http://localhost:3000' + ep.name);
      const res = await ep.handler(req);
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.ok, true);
      assert.equal(data.classLevel, '10th');
      assert.equal(data.subject, '');
      assert.equal(data.source, 'sheet');
      assert.equal(data.servedFrom, 'gas');
      assert.ok(Array.isArray(data.items));
    });

    await runAsyncTest(`${ep.name} accepts classLevel="12th" and subject="Physics"`, async () => {
      const req = new Request(`http://localhost:3000${ep.name}?classLevel=12th&subject=Physics`);
      const res = await ep.handler(req);
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.ok, true);
      assert.equal(data.classLevel, '12th');
      assert.equal(data.subject, 'Physics');
      assert.ok(Array.isArray(data.items));
    });

    await runAsyncTest(`${ep.name} accepts class alias "10" and normalizes to "10th"`, async () => {
      const req = new Request(`http://localhost:3000${ep.name}?class=10&subject=Maths`);
      const res = await ep.handler(req);
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.ok, true);
      assert.equal(data.classLevel, '10th');
      assert.equal(data.subject, 'Maths');
      assert.ok(Array.isArray(data.items));
    });

    await runAsyncTest(`${ep.name} accepts class alias "11th"`, async () => {
      const req = new Request(`http://localhost:3000${ep.name}?class=11th`);
      const res = await ep.handler(req);
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.ok, true);
      assert.equal(data.classLevel, '11th');
    });
  }

  console.log('\n===============================================================');
  if (failedTests === 0) {
    console.log('✅ ALL PRO SHELF ENDPOINTS VERIFIED (0 failures)');
    console.log('===============================================================\n');
    process.exit(0);
  } else {
    console.error(`❌ PRO SHELF ENDPOINT CHECKS FAILED: ${failedTests} failure(s)`);
    console.log('===============================================================\n');
    process.exit(1);
  }
}

run();
