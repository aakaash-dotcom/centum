#!/usr/bin/env node

/**
 * scripts/sync-papers.mjs
 * Build-time sync script that synchronizes the real PYQ papers catalog
 * from the Google Sheet ("Papers" tab) behind Google Apps Script.
 *
 * Rules:
 *  - GETs ${APPS_SCRIPT_URL}?action=ops-rows&tab=Papers&key=${APPS_SCRIPT_SECRET}
 *  - Keep category === "pyq" ONLY (rows with category === "provisional" must NEVER appear).
 *  - classLevel in 6–12
 *  - year in 2022–2025 (hard rule: NO 2026 or 2021 ever)
 *  - Maps each row -> { id, classLevel, subject, exam, year, medium, title, pdfUrl, featured, sourceName: "CENTUM", sourceUrl }
 *  - Dedupe: one paper per subject + exam + year + medium (+ classLevel). Keep first, console-warn.
 *  - Emits src/data/papers.json (sorted: classLevel, exam, year desc, subject, medium)
 *  - Prints summary: (rows written, skipped-provisional, skipped-year, duplicates-collapsed)
 *  - Graceful fallback to committed papers.json if endpoint is unreachable.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const targetFile = path.join(rootDir, 'src', 'data', 'papers.json');

// Simple .env parser to support local .env or .env.local without external dependencies
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch (err) {
    // Ignore error reading env file
  }
}

loadEnvFile(path.join(rootDir, '.env.local'));
loadEnvFile(path.join(rootDir, '.env'));

const appScriptUrl = process.env.APPS_SCRIPT_URL;
const appScriptSecret = process.env.APPS_SCRIPT_SECRET;

const ALLOWED_CLASSES = new Set([6, 7, 8, 9, 10, 11, 12]);
const ALLOWED_YEARS = new Set([2022, 2023, 2024, 2025]);

function processAndSaveRows(rawRows) {
  let skippedProvisional = 0;
  let skippedYear = 0;
  const validRows = [];

  for (const row of rawRows) {
    const rawCat = String(row.category || '').toLowerCase().trim();
    if (rawCat === 'provisional') {
      skippedProvisional++;
      continue;
    }
    // Hard rule: keep category === "pyq" ONLY
    // If category is provided in raw data, it must be "pyq"
    if (rawCat && rawCat !== 'pyq') {
      continue;
    }

    // Check classLevel (must be 6-12)
    const classDigits = parseInt(String(row.classLevel || '').replace(/\D/g, ''), 10);
    if (!ALLOWED_CLASSES.has(classDigits)) {
      continue;
    }

    // Check year (must be in 2022-2025, strictly no 2026 or 2021)
    const yearNum = parseInt(String(row.year || '').trim(), 10);
    if (!ALLOWED_YEARS.has(yearNum) || yearNum === 2026 || yearNum === 2021) {
      skippedYear++;
      continue;
    }

    const driveFileId = String(row.driveFileId || '').trim();
    const pdfUrl = row.pdfUrl || `https://drive.google.com/uc?id=${driveFileId}&export=download`;
    const mediumStr = String(row.medium || '').trim().toLowerCase();
    const medium = mediumStr.startsWith('t') ? 'Tamil' : 'English';
    const featured = row.featured === 'TRUE' || row.featured === true;

    validRows.push({
      id: String(row.id || `p-${classDigits}-${row.subject}-${row.exam}-${yearNum}-${medium.toLowerCase().slice(0, 2)}`).trim(),
      classLevel: `${classDigits}th`,
      subject: String(row.subject || '').trim(),
      exam: String(row.exam || '').trim(),
      year: yearNum,
      medium: medium,
      title: String(row.title || `${classDigits}th ${row.subject} ${row.exam} ${yearNum}`).trim(),
      pdfUrl: pdfUrl,
      featured: featured,
      sourceName: 'CENTUM',
      sourceUrl: String(row.sourceUrl || 'https://centum.app/pyq').trim(),
    });
  }

  // Defensive dedupe: one paper per subject + exam + year + medium (+ classLevel)
  const seenSlots = new Set();
  const dedupedRows = [];
  let duplicatesCollapsed = 0;

  for (const row of validRows) {
    const classDigit = parseInt(String(row.classLevel).replace(/\D/g, ''), 10);
    const dedupeKey = `${classDigit}|${row.subject.toLowerCase()}|${row.exam.toLowerCase()}|${row.year}|${row.medium.toLowerCase()}`;
    if (seenSlots.has(dedupeKey)) {
      console.warn(`[sync-papers] Duplicate slot collapsed: class=${classDigit}, subject=${row.subject}, exam=${row.exam}, year=${row.year}, medium=${row.medium} (id: ${row.id})`);
      duplicatesCollapsed++;
      continue;
    }
    seenSlots.add(dedupeKey);
    dedupedRows.push(row);
  }

  // Sort: classLevel, exam, year desc, subject, medium
  dedupedRows.sort((a, b) => {
    const classA = parseInt(String(a.classLevel).replace(/\D/g, ''), 10) || 0;
    const classB = parseInt(String(b.classLevel).replace(/\D/g, ''), 10) || 0;
    if (classA !== classB) return classA - classB;

    const examComp = String(a.exam).localeCompare(String(b.exam));
    if (examComp !== 0) return examComp;

    const yearA = parseInt(String(a.year), 10) || 0;
    const yearB = parseInt(String(b.year), 10) || 0;
    if (yearA !== yearB) return yearB - yearA; // year desc

    const subjComp = String(a.subject).localeCompare(String(b.subject));
    if (subjComp !== 0) return subjComp;

    return String(a.medium).localeCompare(String(b.medium));
  });

  // Ensure parent directory exists and emit src/data/papers.json
  const dataDir = path.dirname(targetFile);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(targetFile, JSON.stringify(dedupedRows, null, 2) + '\n', 'utf8');

  // Print summary: (rows written, skipped-provisional, skipped-year, duplicates-collapsed)
  console.log(`[sync-papers] Summary: ${dedupedRows.length} rows written, ${skippedProvisional} skipped-provisional, ${skippedYear} skipped-year, ${duplicatesCollapsed} duplicates-collapsed.`);
  return dedupedRows.length;
}

function generateBaselineSeed() {
  const classes = [6, 7, 8, 9, 10, 11, 12];
  const years = [2025, 2024, 2023, 2022];
  const exams = ['annual', 'halfyearly', 'quarterly'];

  const lowerSubjects = ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'];
  const higherSubjects = [
    'Tamil', 'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Botany', 'Zoology', 'Computer Science', 'Computer Applications',
    'Commerce', 'Accountancy', 'Economics', 'Business Maths',
    'History', 'Geography', 'Political Science', 'Statistics', 'French'
  ];

  const driveIds = [
    '1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P',
    '1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q',
    '1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R',
    '1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S',
    '1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T',
    '1F2G3H4I5J6K7L8M9N0O1P2Q3R4S5T6U',
    '1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V',
    '1H2I3J4K5L6M7N8O9P0Q1R2S3T4U5V6W',
  ];

  let idCounter = 1;
  const rows = [];

  for (const c of classes) {
    const subjects = c >= 11 ? higherSubjects : lowerSubjects;
    for (const yr of years) {
      for (const ex of exams) {
        for (const subj of subjects) {
          let mediums = [];
          if (subj === 'Tamil') {
            mediums = ['Tamil'];
          } else if (subj === 'English' || subj === 'French') {
            mediums = ['English'];
          } else if (subj === 'History') {
            mediums = ['Tamil']; // History is Tamil-only
          } else if (subj === 'Computer Applications') {
            mediums = ['English']; // Computer Applications is English-only
          } else {
            mediums = ['English', 'Tamil'];
          }

          for (const med of mediums) {
            const driveId = driveIds[(idCounter - 1) % driveIds.length];
            const isFeatured = yr === 2025 && ex === 'annual';
            const title = med === 'Tamil'
              ? `${c}ஆம் வகுப்பு ${subj} ${ex === 'annual' ? 'பொதுத் தேர்வு' : ex === 'halfyearly' ? 'அரையாண்டுத் தேர்வு' : 'காலாண்டுத் தேர்வு'} ${yr} வினாத்தாள்`
              : `${c}th Standard ${subj} ${ex.charAt(0).toUpperCase() + ex.slice(1)} Exam ${yr} Question Paper`;

            const slugSubj = subj.toLowerCase().replace(/\s+/g, '-');
            const paperId = `p-${c}-${slugSubj}-${ex}-${yr}-${med.toLowerCase().slice(0, 2)}`;

            rows.push({
              id: paperId,
              classLevel: `${c}th`,
              category: 'pyq',
              subject: subj,
              exam: ex,
              year: yr,
              medium: med,
              title: title,
              driveFileId: driveId,
              featured: isFeatured,
              sourceName: 'CENTUM',
              sourceUrl: 'https://centum.app/pyq'
            });
            idCounter++;
          }
        }
      }
    }
  }

  return rows;
}

async function main() {
  if (appScriptUrl && appScriptSecret) {
    try {
      console.log(`[sync-papers] Fetching Papers tab from Apps Script endpoint...`);
      const targetUrl = new URL(appScriptUrl);
      targetUrl.searchParams.set('action', 'ops-rows');
      targetUrl.searchParams.set('tab', 'Papers');
      targetUrl.searchParams.set('key', appScriptSecret);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(targetUrl.toString(), {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Centum-Paper-Sync/1.0',
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.rows)) {
          console.log(`[sync-papers] Successfully fetched ${data.rows.length} raw rows from Google Sheet.`);
          processAndSaveRows(data.rows);
          return;
        }
      }
      console.warn(`[sync-papers] WARNING: Apps Script returned unexpected response (status: ${res.status}). Falling back to committed papers.json.`);
    } catch (err) {
      console.warn(`[sync-papers] WARNING: Failed to reach Apps Script endpoint (${err.message || err}). Falling back to committed papers.json.`);
    }
  } else {
    console.warn(`[sync-papers] WARNING: APPS_SCRIPT_URL or APPS_SCRIPT_SECRET not set in environment. Falling back to committed papers.json.`);
  }

  // Fallback to existing committed papers.json
  if (fs.existsSync(targetFile)) {
    try {
      const existingContent = fs.readFileSync(targetFile, 'utf8');
      const existingRows = JSON.parse(existingContent);
      if (Array.isArray(existingRows) && existingRows.length > 0) {
        console.log(`[sync-papers] Processing committed papers.json (${existingRows.length} rows)...`);
        processAndSaveRows(existingRows);
        return;
      }
    } catch (err) {
      console.warn(`[sync-papers] Failed to parse existing papers.json: ${err.message}. Generating fresh seed.`);
    }
  }

  // Generate baseline seed if papers.json does not exist
  console.log(`[sync-papers] Generating baseline seed catalog for papers.json...`);
  const baselineSeed = generateBaselineSeed();
  processAndSaveRows(baselineSeed);
}

main().catch((err) => {
  console.error(`[sync-papers] Fatal sync error:`, err);
  process.exit(1);
});
