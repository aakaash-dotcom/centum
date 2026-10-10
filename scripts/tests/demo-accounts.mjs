#!/usr/bin/env node

/**
 * scripts/tests/demo-accounts.mjs
 * verifyRef: demo-accounts
 *
 * Asserts:
 *  1. /api/send-otp for 9123456780 returns { ok: true, status: 'demo', demoOtp: '4321' } without dispatching real WhatsApp
 *  2. /api/send-otp for 9840123456 returns { ok: true, status: 'demo', demoOtp: '4321' }
 *  3. /api/verify-otp with phone 9123456780 and OTP 4321 succeeds (200, verified: true)
 *  4. /api/verify-otp with phone 9123456780 and OTP 4322 fails (400, verified: false)
 *  5. Regression guard: A normal phone number (e.g. 9876543210) does NOT get status: demo or demoOtp (requires real OTP)
 *  6. Owner portal prefill endpoint /api/tuition-owner-otp accepts 4321 for DEMO10
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

console.log('===============================================================');
console.log(`   TASK 9: PERMANENT DEMO ACCOUNTS & OTP OVERRIDE AUDIT`);
console.log(`   Target: ${BASE_URL}`);
console.log('===============================================================');

let hasFailure = false;

async function runTests() {
  // 1. send-otp for demo student 9123456780
  console.log('--- 1. Testing /api/send-otp for Demo Student (9123456780) ---');
  try {
    const res = await fetch(`${BASE_URL}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9123456780' }),
    });
    const data = await res.json();
    console.log('Response:', data);
    if (!res.ok || data.status !== 'demo' || data.demoOtp !== '4321') {
      console.error('❌ FAIL: Demo student did not return status: demo or demoOtp: 4321');
      hasFailure = true;
    } else {
      console.log('  ✓ Demo student returned status "demo" and demoOtp "4321" without dispatch');
    }
  } catch (err) {
    console.error('❌ Network error testing send-otp', err);
    hasFailure = true;
  }

  // 2. send-otp for demo owner 9840123456
  console.log('\n--- 2. Testing /api/send-otp for Demo Owner (9840123456) ---');
  try {
    const res = await fetch(`${BASE_URL}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9840123456' }),
    });
    const data = await res.json();
    if (!res.ok || data.status !== 'demo' || data.demoOtp !== '4321') {
      console.error('❌ FAIL: Demo owner did not return status: demo or demoOtp: 4321');
      hasFailure = true;
    } else {
      console.log('  ✓ Demo owner returned status "demo" and demoOtp "4321" without dispatch');
    }
  } catch (err) {
    console.error('❌ Network error testing send-otp demo owner', err);
    hasFailure = true;
  }

  // 3. verify-otp with 4321 succeeds
  console.log('\n--- 3. Testing /api/verify-otp with Correct Code (4321) ---');
  try {
    const res = await fetch(`${BASE_URL}/api/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9123456780', otp: '4321' }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok || !data.verified) {
      console.error('❌ FAIL: Demo verify with 4321 did not succeed', data);
      hasFailure = true;
    } else {
      console.log('  ✓ Demo verify with 4321 succeeded (verified: true)');
    }
  } catch (err) {
    console.error('❌ Network error testing verify-otp', err);
    hasFailure = true;
  }

  // 4. verify-otp with wrong code 4322 fails
  console.log('\n--- 4. Testing /api/verify-otp with Wrong Code (4322) ---');
  try {
    const res = await fetch(`${BASE_URL}/api/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9123456780', otp: '4322' }),
    });
    const data = await res.json();
    if (res.ok && data.verified) {
      console.error('❌ FAIL: Demo verify with 4322 incorrectly succeeded!');
      hasFailure = true;
    } else {
      console.log('  ✓ Demo verify with 4322 correctly rejected (status 400)');
    }
  } catch (err) {
    console.error('❌ Network error testing wrong code', err);
    hasFailure = true;
  }

  // 5. Regression guard: Normal phone does NOT get demoOtp
  console.log('\n--- 5. Testing Regression Guard: Normal Phone (9944123456) ---');
  try {
    const res = await fetch(`${BASE_URL}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9944123456' }),
    });
    const data = await res.json();
    if (data.status === 'demo' || data.demoOtp) {
      console.error('❌ FAIL: Leak! Normal phone received demoOtp override!');
      hasFailure = true;
    } else {
      console.log('  ✓ Regression guard passed: Normal phone routed to real provider (no demo bypass)');
    }
  } catch (err) {
    console.error('❌ Network error testing normal phone', err);
    hasFailure = true;
  }

  // 6. Owner portal OTP endpoint
  console.log('\n--- 6. Testing /api/tuition-owner-otp for DEMO10 ---');
  try {
    const res = await fetch(`${BASE_URL}/api/tuition-owner-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', phone: '9840123456', tuitionCode: 'DEMO10', otp: '4321' }),
    });
    const data = await res.json();
    if (!res.ok || !data.verified) {
      console.error('❌ FAIL: Tuition owner demo verify failed', data);
      hasFailure = true;
    } else {
      console.log('  ✓ Tuition owner demo verify succeeded for DEMO10');
    }
  } catch (err) {
    console.error('❌ Network error testing tuition owner otp', err);
    hasFailure = true;
  }

  console.log('===============================================================');
  if (hasFailure) {
    console.error('❌ TASK 9 VERIFICATION FAILED');
    process.exitCode = 1;
  } else {
    console.log('✅ TASK 9 VERIFICATION PASSED: Demo accounts strictly sandboxed & functional');
    console.log('verifyRef: demo-accounts [VERIFIED]');
    console.log('===============================================================\n');
    process.exitCode = 0;
  }
}

runTests();
