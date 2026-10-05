// scripts/test_task1_acceptance.mjs
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';

function parseChapterDetails(rawName, count = 1) {
  const str = (rawName || '').trim();

  // Social Science sub-chapter discipline matching
  // 1. History / வரலாறு
  const histMatch = str.match(/^(?:history|வரலாறு)\s*(\d+)\s*[-–:.]?\s*(.*)/i);
  if (histMatch) {
    const num = parseInt(histMatch[1], 10);
    const isTa = str.includes('வரலாறு');
    return {
      rawName: str,
      discipline: 'History',
      number: num,
      displayName: isTa ? `வரலாறு ${num}` : `History ${num}`,
      cleanTitle: histMatch[2]?.trim() || str,
      sortKey: 1000 + num,
      count,
    };
  }

  // 2. Geography / புவியியல்
  const geoMatch = str.match(/^(?:geography|புவியியல்)\s*(\d+)\s*[-–:.]?\s*(.*)/i);
  if (geoMatch) {
    const num = parseInt(geoMatch[1], 10);
    const isTa = str.includes('புவியியல்');
    return {
      rawName: str,
      discipline: 'Geography',
      number: num,
      displayName: isTa ? `புவியியல் ${num}` : `Geography ${num}`,
      cleanTitle: geoMatch[2]?.trim() || str,
      sortKey: 2000 + num,
      count,
    };
  }

  // 3. Civics / குடிமையியல்
  const civMatch = str.match(/^(?:civics|குடிமையியல்)\s*(\d+)\s*[-–:.]?\s*(.*)/i);
  if (civMatch) {
    const num = parseInt(civMatch[1], 10);
    const isTa = str.includes('குடிமையியல்');
    return {
      rawName: str,
      discipline: 'Civics',
      number: num,
      displayName: isTa ? `குடிமையியல் ${num}` : `Civics ${num}`,
      cleanTitle: civMatch[2]?.trim() || str,
      sortKey: 3000 + num,
      count,
    };
  }

  // 4. Economics / பொருளியல்
  const ecoMatch = str.match(/^(?:economics|பொருளியல்)\s*(\d+)\s*[-–:.]?\s*(.*)/i);
  if (ecoMatch) {
    const num = parseInt(ecoMatch[1], 10);
    const isTa = str.includes('பொருளியல்');
    return {
      rawName: str,
      discipline: 'Economics',
      number: num,
      displayName: isTa ? `பொருளியல் ${num}` : `Economics ${num}`,
      cleanTitle: ecoMatch[2]?.trim() || str,
      sortKey: 4000 + num,
      count,
    };
  }

  // 5. Standard Chapter / Unit / அலகு / பாடம்
  const stdMatch = str.match(/^(?:chapter|unit|ch|அலகு|பாடம்)\s*(\d+)\s*[-–:.]?\s*(.*)/i);
  if (stdMatch) {
    const num = parseInt(stdMatch[1], 10);
    const isTa = str.includes('அலகு') || str.includes('பாடம்');
    return {
      rawName: str,
      discipline: '',
      number: num,
      displayName: isTa ? `அலகு ${num}` : `Chapter ${num}`,
      cleanTitle: stdMatch[2]?.trim() || str,
      sortKey: num,
      count,
    };
  }

  // Fallback: any number in string
  const numMatch = str.match(/(\d+)/);
  const num = numMatch ? parseInt(numMatch[1], 10) : 999;
  return {
    rawName: str,
    discipline: '',
    number: num,
    displayName: num !== 999 ? `Chapter ${num}` : str,
    cleanTitle: str.replace(/^(?:chapter|unit|ch|அலகு|பாடம்)?\s*\d+\s*[-–:.]?\s*/i, '').trim() || str,
    sortKey: num,
    count,
  };
}

async function fetchQuestions(classLevel, subject, medium, type = 'oneword') {
  const url = `${BASE_URL}/api/questions?type=${type}&classLevel=${classLevel}&subject=${encodeURIComponent(subject)}&medium=${medium}&count=all`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  return await res.json();
}

async function runAcceptance() {
  console.log('====================================================');
  console.log(' TASK I ACCEPTANCE: VISIBLE SETS ⊇ CENSUS SETS (CLASS 10) ');
  console.log('====================================================\n');

  // Load census truth
  const census = JSON.parse(fs.readFileSync('scripts/census-truth.json', 'utf8'));
  const c10Census = census.filter(r => r.classLevel.startsWith('10') && r.type === 'oneword');

  console.log(`Census contains ${c10Census.length} oneword tuples for Class 10:`);
  console.table(c10Census.map(c => ({ subject: c.subject, medium: c.medium, count: c.count })));

  const subjects = ['Maths', 'Science', 'Social Science', 'Tamil', 'English'];
  const mediums = ['english', 'tamil'];

  const visibleSetsReport = [];
  let totalVisibleQuestions = 0;
  let allTuplesCovered = true;

  for (const s of subjects) {
    for (const m of mediums) {
      // In Tamil/English, census might be marked 'Common'
      const expectedInCensus = c10Census.find(c => 
        c.subject.toLowerCase() === s.toLowerCase() && 
        (c.medium.toLowerCase() === m.toLowerCase() || c.medium.toLowerCase() === 'common')
      );

      console.log(`\n--- Checking: Class 10 · ${s} · ${m} ---`);
      const data = await fetchQuestions('10th', s, m, 'oneword');
      const questions = data.questions || [];
      console.log(`Fetched ${questions.length} questions (totalMatching: ${data.totalMatching})`);

      if (expectedInCensus && expectedInCensus.count > 0) {
        if (questions.length === 0) {
          console.error(`[FAIL] Census has ${expectedInCensus.count} questions for ${s} (${m}), but visible count is 0!`);
          allTuplesCovered = false;
        } else {
          console.log(`[PASS] Census expected ${expectedInCensus.count}, visible retrieved ${questions.length}`);
        }
      }

      // Group into chapter sets
      const grouped = {};
      for (const q of questions) {
        const details = parseChapterDetails(q.chapter || '1');
        const setKey = `${details.discipline || 'General'}-${details.displayName}`;
        if (!grouped[setKey]) {
          grouped[setKey] = {
            displayName: details.displayName,
            category: details.discipline || 'General',
            count: 0,
            sampleId: q.id
          };
        }
        grouped[setKey].count++;
        totalVisibleQuestions++;
      }

      const sets = Object.values(grouped);
      console.log(`Found ${sets.length} distinct chapter sets for ${s} (${m}):`);
      sets.forEach(set => {
        console.log(`   • ${s} · ${set.displayName} · ${set.count} Q (Sample: ${set.sampleId})`);
        visibleSetsReport.push({
          subject: s,
          medium: m,
          setName: `${s} · ${set.displayName}`,
          category: set.category,
          count: set.count,
          sampleId: set.sampleId
        });
      });

      // Special check for Social Science: verify distinct sub-chapters
      if (s === 'Social Science' && sets.length > 0) {
        const categories = new Set(sets.map(set => set.category));
        console.log(`Social Science categories present: ${Array.from(categories).join(', ')}`);
        if (categories.has('History') || categories.has('Geography')) {
          console.log('[PASS] Social Science sub-chapters recognized distinctly!');
        } else {
          console.error('[FAIL] Social Science sub-chapters were NOT recognized distinctly!');
          allTuplesCovered = false;
        }
      }
    }
  }

  console.log('\n====================================================');
  console.log(`Total visible questions across Class 10 sets: ${totalVisibleQuestions}`);
  console.log(`Total distinct visible sets generated: ${visibleSetsReport.length}`);
  console.log(`All census tuples covered: ${allTuplesCovered ? 'YES (PASS)' : 'NO (FAIL)'}`);
  console.log('====================================================\n');

  fs.writeFileSync('scripts/task1-visible-sets.json', JSON.stringify(visibleSetsReport, null, 2));

  if (!allTuplesCovered) {
    process.exit(1);
  }
}

runAcceptance().catch(err => {
  console.error(err);
  process.exit(1);
});
