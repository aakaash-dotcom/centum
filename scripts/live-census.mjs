// scripts/live-census.mjs
import fs from 'fs';

const BASE_URL = 'https://centum-omega.vercel.app/api/questions';

const CLASSES = ['6', '7', '8', '9', '10', '11', '12'];
const TYPES = ['oneword', 'concept', 'bookback'];
const MEDIUMS = ['english', 'tamil'];

const SUBJECTS_BY_CLASS = {
  lower: ['maths', 'science', 'social', 'tamil', 'english'],
  higher: [
    'maths', 'physics', 'chemistry', 'biology', 'botany', 'zoology',
    'computer science', 'accountancy', 'commerce', 'economics', 'business maths',
    'computer applications', 'tamil', 'english'
  ]
};

async function query(classLevel, subject, medium, type) {
  const url = `${BASE_URL}?type=${type}&classLevel=${classLevel}&subject=${encodeURIComponent(subject)}&medium=${medium}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { total: 0, sample: null, error: res.status };
    const data = await res.json();
    return {
      total: data.totalMatching || 0,
      sample: data.questions?.[0]?.id || null,
      source: data.source
    };
  } catch (err) {
    return { total: 0, sample: null, error: err.message };
  }
}

async function runCensus() {
  console.log('Starting full LIVE sheet census probe...');
  const results = [];

  for (const c of CLASSES) {
    const subjects = parseInt(c, 10) >= 11 ? SUBJECTS_BY_CLASS.higher : SUBJECTS_BY_CLASS.lower;
    for (const s of subjects) {
      for (const m of MEDIUMS) {
        for (const t of TYPES) {
          const res = await query(c, s, m, t);
          if (res.total > 0) {
            results.push({
              classLevel: `${c}th`,
              subject: s,
              medium: m,
              type: t,
              count: res.total,
              sampleId: res.sample,
              source: res.source
            });
            console.log(`[FOUND] Class ${c} | ${s} | ${m} | ${t} -> COUNT: ${res.total} (sample: ${res.sample})`);
          }
        }
      }
    }
  }

  console.log('\n================ CENSUS COMPLETE ================');
  console.log(`Total distinct populated tuples: ${results.length}`);
  console.table(results);

  fs.writeFileSync('scripts/census-results.json', JSON.stringify(results, null, 2));
}

runCensus().catch(console.error);
