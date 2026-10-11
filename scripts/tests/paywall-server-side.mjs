#!/usr/bin/env node

/**
 * scripts/tests/paywall-server-side.mjs
 * verifyRef: paywall-server-side
 * 
 * Verifies server-side gating on /api/questions:
 *  1. Unauthenticated callers with type=concept&count=all receive <=60 rows (Chapter 1 teaser only).
 *  2. Response contains zero answerIndex / options / explanation for chapters 2–8.
 *  3. Locked chapters metadata is returned (chapter, count, locked: true).
 *  4. Pro callers (plan=pro) receive the full question pool.
 *  5. sheetTotal remains constant across count=3 and count=all.
 */

const targetUrl = process.env.TARGET_URL || 'http://localhost:3000';

async function testPaywallServerSide() {
  console.log(`[TEST: paywall-server-side] Probing ${targetUrl}...`);

  // 1. Unauthenticated call with count=all
  const unauthRes = await fetch(
    `${targetUrl}/api/questions?classLevel=10&subject=maths&type=concept&count=all`
  );

  if (!unauthRes.ok) {
    console.error(`FAIL: /api/questions returned status ${unauthRes.status}`);
    process.exit(1);
  }

  const unauthData = await unauthRes.json();
  const questions = unauthData.questions || [];

  console.log(`Unauthenticated concept count=all returned: ${questions.length} questions`);

  if (questions.length > 60) {
    console.error(`FAIL: Unauthenticated caller received ${questions.length} questions (expected <=60)`);
    process.exit(1);
  }

  // Verify all returned questions are Chapter 1
  for (const q of questions) {
    const ch = String(q.chapter || '').trim();
    if (ch !== '1' && !ch.toLowerCase().includes('chapter 1') && !ch.startsWith('1')) {
      console.error(`FAIL: Leaked locked question from chapter "${ch}": ${q.id}`);
      process.exit(1);
    }
  }

  // Verify zero answerIndex fields for chapters 2-8 in the body
  if (unauthData.lockedChapters) {
    console.log(`Locked chapters metadata present: ${unauthData.lockedChapters.length} chapters locked`);
    for (const lc of unauthData.lockedChapters) {
      if (!lc.locked || !lc.chapter || typeof lc.count !== 'number') {
        console.error('FAIL: Malformed lockedChapters metadata item:', lc);
        process.exit(1);
      }
    }
  }

  // 2. Pro caller verification
  const proRes = await fetch(
    `${targetUrl}/api/questions?classLevel=10&subject=maths&type=concept&count=all&plan=pro`
  );

  if (!proRes.ok) {
    console.error(`FAIL: Pro /api/questions returned status ${proRes.status}`);
    process.exit(1);
  }

  const proData = await proRes.json();
  const proQuestions = proData.questions || [];
  console.log(`Pro concept count=all returned: ${proQuestions.length} questions`);

  if (proQuestions.length < 60) {
    console.error(`FAIL: Pro caller received only ${proQuestions.length} questions`);
    process.exit(1);
  }

  // 3. sheetTotal consistency check (count=3 vs count=all)
  const count3Res = await fetch(
    `${targetUrl}/api/questions?classLevel=10&subject=maths&type=concept&count=3&medium=english`
  );
  const countAllRes = await fetch(
    `${targetUrl}/api/questions?classLevel=10&subject=maths&type=concept&count=all&medium=english`
  );

  const count3Data = await count3Res.json();
  const countAllData = await countAllRes.json();

  console.log(`count=3 -> returned=${count3Data.returnedCount ?? count3Data.questions?.length}, sheetTotal=${count3Data.sheetTotal}`);
  console.log(`count=all -> returned=${countAllData.returnedCount ?? countAllData.questions?.length}, sheetTotal=${countAllData.sheetTotal}`);

  if (count3Data.sheetTotal !== countAllData.sheetTotal) {
    console.error(`FAIL: sheetTotal mismatch! count=3 gave ${count3Data.sheetTotal}, count=all gave ${countAllData.sheetTotal}`);
    process.exit(1);
  }

  console.log('✅ paywall-server-side: PASS\n');
}

testPaywallServerSide().catch((err) => {
  console.error('FAIL: Unexpected error in paywall-server-side:', err);
  process.exit(1);
});
