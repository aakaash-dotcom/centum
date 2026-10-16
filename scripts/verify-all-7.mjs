import crypto from 'crypto';

const SESSION_SECRET = process.env.APPS_SCRIPT_SECRET || 'centum_session_secret_2026';

function createSessionToken(student) {
  const iat = Date.now();
  const exp = iat + 365 * 24 * 60 * 60 * 1000;
  const payload = { student, iat, exp };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');
  return `${data}.${signature}`;
}

const BASE_URL = 'https://centum-omega.vercel.app';

async function verify() {
  console.log('Polling until deployment is active with paywall fix and midterm chips...');

  let attempts = 0;
  while (attempts < 30) {
    attempts++;
    try {
      const t = Date.now();

      // 1. Anonymous /api/questions?count=all
      const anonRes = await fetch(`${BASE_URL}/api/questions?count=all&_t=${t}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      const anonData = await anonRes.json();
      const anonQuestions = anonData.questions || [];
      const anonProCount = anonQuestions.filter(
        (q) => q.plan && String(q.plan).toLowerCase() !== 'free'
      ).length;
      const inspectedAbsent = anonData.inspectedQuestion === undefined;

      // 2. Authenticated pro caller
      const demoProStudent = {
        name: 'Demo Student 12',
        phone: '9840123456',
        district: 'Chennai',
        standard: '12th',
        stream: 'Science — Biology',
        medium: 'english',
        plan: 'pro',
        isAdmin: false,
      };
      const proToken = createSessionToken(demoProStudent);
      const proRes = await fetch(`${BASE_URL}/api/questions?count=all&_t=${t}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${proToken}`,
          'Cookie': `centum_session=${proToken}`,
          'x-user-plan': 'pro',
        },
      });
      const proData = await proRes.json();
      const proQuestions = proData.questions || [];
      const proProCount = proQuestions.filter(
        (q) => q.plan && String(q.plan).toLowerCase() !== 'free'
      ).length;

      // 3. /api/papers
      const papersRes = await fetch(`${BASE_URL}/api/papers?_t=${t}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      const papersData = await papersRes.json();
      const papers = papersData.papers || [];
      const totalPapers = papers.length;
      const midtermRows = papers.filter((p) =>
        String(p.exam || '').toLowerCase().includes('mid')
      ).length;
      const pyqRows = papers.filter(
        (p) => String(p.category || 'pyq').toLowerCase() === 'pyq'
      ).length;

      // 4. Mid Term chip query
      const chipRes = await fetch(`${BASE_URL}/api/papers?exam=midterm&_t=${t}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      const chipData = await chipRes.json();
      const midChipCount = (chipData.papers || []).length;

      console.log(
        `[Attempt ${attempts}] anonProCount=${anonProCount}, proProCount=${proProCount}, inspectedAbsent=${inspectedAbsent}, papers=${totalPapers}, midterm=${midtermRows}, pyq=${pyqRows}, chip=${midChipCount}`
      );

      if (
        anonProCount === 0 &&
        proProCount > 0 &&
        inspectedAbsent &&
        totalPapers === 1159 &&
        midtermRows === 114 &&
        pyqRows === 1045 &&
        midChipCount === 114
      ) {
        console.log('\n================ FINAL RESULTS ================');
        console.log(`anonymous /api/questions?count=all pro rows:  ${anonProCount}`);
        console.log(`authenticated pro caller still gets pro rows: ${proProCount}`);
        console.log(`inspectedQuestion in response:                absent`);
        console.log(`/api/papers total:                            ${totalPapers}`);
        console.log(`exam=midterm rows:                            ${midtermRows}`);
        console.log(`category=pyq rows:                            ${pyqRows}`);
        console.log(`Mid Term chip returns:                        ${midChipCount}`);
        console.log('===============================================\n');
        return;
      }
    } catch (err) {
      console.log(`[Attempt ${attempts}] Error:`, err.message);
    }
    await new Promise((r) => setTimeout(r, 4000));
  }
}

verify().catch((e) => {
  console.error(e);
  process.exit(1);
});
