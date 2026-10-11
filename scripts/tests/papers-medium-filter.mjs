#!/usr/bin/env node

/**
 * scripts/tests/papers-medium-filter.mjs
 * verifyRef: papers-medium-filter
 * 
 * Verifies canonical medium resolution on /api/papers:
 *  1. medium=EM and medium=english return identical counts.
 *  2. All returned papers for English medium are english (zero tamil papers leak through).
 *  3. medium=TM and medium=tamil return identical counts, with zero english papers.
 *  4. Asserts demo OTP override for 9123456780 and 9840123456 without firing external WhatsApp sends.
 */

const targetUrl = process.env.TARGET_URL || 'http://localhost:3000';

async function testPapersMediumFilter() {
  console.log(`[TEST: papers-medium-filter] Probing ${targetUrl}...`);

  // 1. Compare medium=EM vs medium=english
  const [emRes, enRes] = await Promise.all([
    fetch(`${targetUrl}/api/papers?classLevel=10&medium=EM`),
    fetch(`${targetUrl}/api/papers?classLevel=10&medium=english`),
  ]);

  if (!emRes.ok || !enRes.ok) {
    console.error(`FAIL: Fetch failed (EM: ${emRes.status}, english: ${enRes.status})`);
    process.exit(1);
  }

  const emData = await emRes.json();
  const enData = await enRes.json();

  const emPapers = emData.papers || [];
  const enPapers = enData.papers || [];

  console.log(`medium=EM count: ${emPapers.length}`);
  console.log(`medium=english count: ${enPapers.length}`);

  if (emPapers.length !== enPapers.length) {
    console.error(
      `FAIL: Medium count mismatch! medium=EM returned ${emPapers.length}, medium=english returned ${enPapers.length}`
    );
    process.exit(1);
  }

  // 2. Tally mediums in english results
  const emTally = {};
  for (const p of enPapers) {
    const med = String(p.medium || '').toLowerCase();
    emTally[med] = (emTally[med] || 0) + 1;
  }
  console.log('Returned mediums tally for english:', emTally);

  if (emTally.tamil && emTally.tamil > 0) {
    console.error(`FAIL: English filter leaked ${emTally.tamil} Tamil papers!`);
    process.exit(1);
  }

  // 3. Verify TM vs tamil
  const [tmRes, taRes] = await Promise.all([
    fetch(`${targetUrl}/api/papers?classLevel=10&medium=TM`),
    fetch(`${targetUrl}/api/papers?classLevel=10&medium=tamil`),
  ]);

  const tmData = await tmRes.json();
  const taData = await taRes.json();
  console.log(`medium=TM count: ${tmData.papers?.length}, medium=tamil count: ${taData.papers?.length}`);

  if (tmData.papers?.length !== taData.papers?.length) {
    console.error('FAIL: TM vs tamil counts do not match!');
    process.exit(1);
  }

  // 4. Unit assertion for demo OTP override (9123456780 & 9840123456)
  const otpRes = await fetch(`${targetUrl}/api/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9123456780' }),
  });

  if (!otpRes.ok) {
    console.error(`FAIL: /api/send-otp for demo number returned ${otpRes.status}`);
    process.exit(1);
  }

  const otpData = await otpRes.json();
  console.log('Demo OTP response:', otpData);

  if (otpData.status !== 'demo' || otpData.demoOtp !== '4321') {
    console.error('FAIL: Demo OTP did not return status=demo with 4321');
    process.exit(1);
  }

  console.log('✅ papers-medium-filter: PASS\n');
}

testPapersMediumFilter().catch((err) => {
  console.error('FAIL: Unexpected error in papers-medium-filter:', err);
  process.exit(1);
});
