import assert from 'node:assert';
import http from 'node:http';
import {
  getCanonicalSubjects,
  isSubjectAllowedForClassStream,
  normalizeSubject,
  isLanguageSubject
} from '../src/data/canonicalSubjects.ts';

// Helper to make local HTTP requests to next.js dev server
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, error: e.message });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('=== TEST SUITE: TASK A, B, C, D REGRESSION & VERIFICATION ===\n');

  // --- UNIT TEST 1: Canonical Subject Map ---
  console.log('Test 1: Canonical Subject Map unit assertions...');
  const c10Subs = getCanonicalSubjects(10).map(s => s.toLowerCase());
  assert(c10Subs.includes('maths') && c10Subs.includes('science') && c10Subs.includes('tamil') && c10Subs.includes('english'), 'Class 10 subjects mismatch');
  
  const c6Subs = getCanonicalSubjects(6).map(s => s.toLowerCase());
  assert(c6Subs.includes('maths') && c6Subs.includes('science'), 'Class 6 subjects mismatch');

  const c12BioSubs = getCanonicalSubjects(12, 'biology').map(s => s.toLowerCase());
  assert(c12BioSubs.includes('physics') && c12BioSubs.includes('chemistry') && c12BioSubs.includes('botany') && c12BioSubs.includes('zoology'), '12 Bio missing core subjects');
  assert(!c12BioSubs.includes('maths'), '12 Bio must NOT include maths');
  assert(!c12BioSubs.includes('accountancy'), '12 Bio must NOT include accountancy');

  const c12MathsSubs = getCanonicalSubjects(12, 'maths').map(s => s.toLowerCase());
  assert(c12MathsSubs.includes('maths') && c12MathsSubs.includes('physics') && c12MathsSubs.includes('chemistry'), '12 Maths missing core subjects');
  assert(!c12MathsSubs.includes('botany'), '12 Maths must NOT include botany');

  const c12CommSubs = getCanonicalSubjects(12, 'commerce').map(s => s.toLowerCase());
  assert(c12CommSubs.includes('accountancy') && c12CommSubs.includes('commerce') && c12CommSubs.includes('economics'), '12 Commerce missing core subjects');
  assert(!c12CommSubs.includes('physics'), '12 Commerce must NOT include physics');

  // Stream/class boundary checks: (classLevel, subject, stream)
  assert(isSubjectAllowedForClassStream(10, 'maths'));
  assert(isSubjectAllowedForClassStream(10, 'science'));
  assert(!isSubjectAllowedForClassStream(10, 'physics'), '10th student must NOT access physics');
  assert(!isSubjectAllowedForClassStream(10, 'botany'), '10th student must NOT access botany');
  assert(!isSubjectAllowedForClassStream(10, 'accountancy'), '10th student must NOT access accountancy');

  assert(!isSubjectAllowedForClassStream(12, 'maths', 'biology'), '12th bio must not access maths');
  assert(isSubjectAllowedForClassStream(12, 'botany', 'biology'), '12th bio must access botany');
  assert(isSubjectAllowedForClassStream(12, 'tamil', 'biology'), '12th bio must access tamil');
  assert(isSubjectAllowedForClassStream(12, 'english', 'biology'), '12th bio must access english');

  console.log('✓ Canonical Subject Map tests passed.\n');

  // --- API TESTS against localhost:3000 ---
  const baseUrl = 'http://localhost:3000';

  console.log('Test 2: Concept sessions (Task A acceptance)...');
  // 10·maths(EM)
  const res10MathsEM = await fetchJson(`${baseUrl}/api/questions?classLevel=10&subject=maths&medium=EM&type=concept`);
  assert.strictEqual(res10MathsEM.status, 200, '10 maths EM should return 200');
  const q10mEM = res10MathsEM.data.questions || [];
  assert(q10mEM.length >= 10, `10 maths EM should have >= 10 questions, got ${q10mEM.length}`);
  for (const q of q10mEM) {
    assert.strictEqual(q.options.length, 4, `Question ${q.id} must have exactly 4 options`);
    q.options.forEach(opt => assert(opt && opt.trim().length > 0, `Option in ${q.id} must not be empty`));
    assert(q.answerIndex >= 0 && q.answerIndex < 4, `Answer index ${q.answerIndex} out of range in ${q.id}`);
  }
  console.log(`✓ 10·maths(EM) returned ${q10mEM.length} valid 4-option questions`);

  // 10·maths(TM)
  const res10MathsTM = await fetchJson(`${baseUrl}/api/questions?classLevel=10&subject=maths&medium=TM&type=concept`);
  assert.strictEqual(res10MathsTM.status, 200, '10 maths TM should return 200');
  const q10mTM = res10MathsTM.data.questions || [];
  assert(q10mTM.length >= 10, `10 maths TM should have >= 10 questions, got ${q10mTM.length}`);
  for (const q of q10mTM) {
    assert.strictEqual(q.options.length, 4, `Question ${q.id} must have exactly 4 options`);
    q.options.forEach(opt => assert(opt && opt.trim().length > 0, `Option in ${q.id} must not be empty`));
    assert(q.answerIndex >= 0 && q.answerIndex < 4, `Answer index ${q.answerIndex} out of range in ${q.id}`);
    const m = (q.medium || '').toUpperCase();
    assert(m === 'TM' || m === 'TAMIL' || m === 'BOTH', `Question ${q.id} medium must be TM, tamil, or both, got ${q.medium}`);
  }
  console.log(`✓ 10·maths(TM) returned ${q10mTM.length} valid 4-option questions`);

  // 10·science(TM)
  const res10SciTM = await fetchJson(`${baseUrl}/api/questions?classLevel=10&subject=science&medium=TM&type=concept`);
  assert.strictEqual(res10SciTM.status, 200, '10 science TM should return 200');
  const q10sTM = res10SciTM.data.questions || [];
  assert(q10sTM.length >= 10, `10 science TM should have >= 10 questions, got ${q10sTM.length}`);
  for (const q of q10sTM) {
    assert.strictEqual(q.options.length, 4, `Question ${q.id} must have exactly 4 options`);
    q.options.forEach(opt => assert(opt && opt.trim().length > 0, `Option in ${q.id} must not be empty`));
    assert(q.answerIndex >= 0 && q.answerIndex < 4, `Answer index ${q.answerIndex} out of range in ${q.id}`);
    const m = (q.medium || '').toUpperCase();
    assert(m === 'TM' || m === 'TAMIL' || m === 'BOTH', `Question ${q.id} medium must be TM, tamil, or both, got ${q.medium}`);
  }
  console.log(`✓ 10·science(TM) returned ${q10sTM.length} valid 4-option questions`);
  console.log('✓ Task A acceptance verified.\n');

  // --- TEST 3: Subject & Stream Server Enforcement (Task B acceptance) ---
  console.log('Test 3: Server-side subject & stream enforcement...');
  // 10th student asking for physics
  const res10Phys = await fetchJson(`${baseUrl}/api/questions?classLevel=10&subject=physics`);
  const q10Phys = res10Phys.data.questions || [];
  assert.strictEqual(q10Phys.length, 0, 'Class 10 student requesting physics must return 0 questions');

  // 10th student asking for accountancy
  const res10Acc = await fetchJson(`${baseUrl}/api/questions?classLevel=10&subject=accountancy`);
  const q10Acc = res10Acc.data.questions || [];
  assert.strictEqual(q10Acc.length, 0, 'Class 10 student requesting accountancy must return 0 questions');

  // 12th Bio student requesting maths
  const res12BioMaths = await fetchJson(`${baseUrl}/api/questions?classLevel=12&stream=biology&subject=maths`);
  const q12BioMaths = res12BioMaths.data.questions || [];
  assert.strictEqual(q12BioMaths.length, 0, 'Class 12 Bio student requesting maths must return 0 questions');

  // Cross medium leakage test
  const res10SciEM = await fetchJson(`${baseUrl}/api/questions?classLevel=10&subject=science&medium=EM&type=concept`);
  const q10sEM = res10SciEM.data.questions || [];
  for (const q of q10sEM) {
    const m = (q.medium || '').toUpperCase();
    assert(m === 'EM' || m === 'ENGLISH' || m === 'BOTH', `Leakage: question ${q.id} has medium ${q.medium} in EM query`);
  }
  console.log('✓ Task B acceptance verified.\n');

  // --- TEST 4: /pro-materials and /pro-videos (Task C & D acceptance) ---
  console.log('Test 4: Pro-materials and Pro-videos class scoping and demo content...');
  // Pro materials class 10 scoping
  const resMat10 = await fetchJson(`${baseUrl}/api/pro-materials?classLevel=10`);
  assert.strictEqual(resMat10.status, 200);
  const mats10 = resMat10.data.materials || [];
  assert(mats10.length > 0, 'Should have class 10 materials');
  for (const m of mats10) {
    assert.strictEqual(Number(m.classLevel), 10, `Material ${m.id} has classLevel ${m.classLevel}, expected 10`);
  }
  // Check for Maths ch1 notes demo and Science ch1 paper demo
  const hasMathsNotesDemo = mats10.some(m => m.subject.toLowerCase() === 'maths' && m.chapterNo === 1 && m.type === 'notes');
  const hasSciPaperDemo = mats10.some(m => m.subject.toLowerCase() === 'science' && m.chapterNo === 1 && m.type === 'papers');
  assert(hasMathsNotesDemo, 'Must have Maths ch1 notes demo');
  assert(hasSciPaperDemo, 'Must have Science ch1 PDF paper demo');
  console.log('✓ Pro-materials class-10 scoping and demo notes/papers verified');

  // Pro videos class 10 Science ch 1 demo videos
  const resVid10 = await fetchJson(`${baseUrl}/api/pro-videos?classLevel=10&subject=science&chapter=1`);
  assert.strictEqual(resVid10.status, 200);
  const vids10 = resVid10.data.videos || [];
  assert(vids10.length >= 6, `Expected at least 6 demo videos for Class 10 Science Ch 1, got ${vids10.length}`);
  let hasLandscape = false;
  for (const v of vids10) {
    assert.strictEqual(Number(v.classLevel), 10, `Video ${v.id} has classLevel ${v.classLevel}`);
    assert.strictEqual(v.subject.toLowerCase(), 'science');
    assert.strictEqual(Number(v.chapterNo), 1);
    const driveLink = v.driveFileId || v.driveUrl;
    assert(driveLink && driveLink.includes('drive.google.com/uc?id='), `Video ${v.id} must have drive.uc?id= URL, got ${driveLink}`);
    assert(v.ytUrl && v.ytUrl.length > 0, `Video ${v.id} must have fallback ytUrl`);
    if (v.isPortrait === false || v.aspectRatio === '16:9') hasLandscape = true;
  }
  assert(hasLandscape, 'At least one video must deliberately have portrait=false / landscape=true');
  console.log(`✓ Pro-videos verified: ${vids10.length} demo videos found for 10 Science Ch 1 with drive.uc?id= and landscape`);

  console.log('\n=== ALL REGRESSION AND ACCEPTANCE TESTS PASSED! ===');
}

runTests().catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
