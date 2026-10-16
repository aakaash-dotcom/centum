import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PHASES = [
  { name: 'Phase 1 (Class 10)', id: '1E-KP1xq88ldOhN_NCoV3XmcXgar-zkBh', expected: 24 },
  { name: 'Phase 2 (Class 12)', id: '1ccjCzQzeSAXTKehPPQx0IdLQH_QkPqA3', expected: 30 },
  { name: 'Phase 3 (Class 6-9)', id: '16DFnz5sYbQnWzVW4Co6DmcUPJtG7vvkd', expected: 60 },
];

const PREFIX_MAP = {
  '6th': 'cls6',
  '7th': 'cls7',
  '8th': 'cls8',
  '9th': 'cls9',
  '10th': 'sslc',
  '12th': 'hsc',
};

const SLUG_MAP = {
  'social science': 'social',
  'computer science': 'computer',
};

async function fetchPhaseRows(phase) {
  const url = `https://drive.google.com/uc?id=${phase.id}&export=download`;
  console.log(`Fetching ${phase.name} from ${url}...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${phase.name}: HTTP ${res.status}`);
  }
  const data = await res.json();
  const rows = data.rows || data.papers || data;
  if (!Array.isArray(rows) || rows.length !== phase.expected) {
    throw new Error(`Expected ${phase.expected} rows for ${phase.name}, got ${rows?.length}`);
  }
  console.log(`✓ Fetched ${rows.length} rows for ${phase.name}`);
  return rows;
}

export async function buildMidterm114Rows() {
  const allRaw = [];
  for (const p of PHASES) {
    const rows = await fetchPhaseRows(p);
    allRaw.push(...rows);
  }

  if (allRaw.length !== 114) {
    throw new Error(`Expected 114 total rows, got ${allRaw.length}`);
  }

  const completedRows = allRaw.map((r) => {
    const classLevel = String(r.classLevel || '').trim();
    const prefix = PREFIX_MAP[classLevel] || classLevel.toLowerCase();
    const subject = String(r.subject || '').trim();
    const sLower = subject.toLowerCase();
    const subjSlug = SLUG_MAP[sLower] || sLower.replace(/\s+/g, '-');
    const year = Number(r.year);
    const rawMed = String(r.medium || '').trim().toLowerCase();
    const medSlug = rawMed.startsWith('t') ? 'tm' : 'em';
    const id = `${prefix}-${subjSlug}-${year}-midterm-${medSlug}`;

    const driveFileId = String(r.driveFileId || '').trim();
    const pdfUrl = `https://drive.google.com/uc?id=${driveFileId}&export=download`;

    return {
      id,
      classLevel,
      category: 'model',
      subject,
      exam: 'midterm',
      year,
      medium: rawMed,
      title: String(r.title || '').trim(),
      driveFileId,
      featured: '',
      plan: 'free',
      isBilingual: false,
      pdfUrl,
    };
  });

  // Verification checks on completedRows
  const ids = new Set();
  for (const r of completedRows) {
    if (ids.has(r.id)) {
      throw new Error(`Duplicate id generated: ${r.id}`);
    }
    ids.add(r.id);

    if (r.category !== 'model') {
      throw new Error(`Row ${r.id} has category ${r.category}, expected 'model'`);
    }
    if (r.exam !== 'midterm') {
      throw new Error(`Row ${r.id} has exam ${r.exam}, expected 'midterm'`);
    }
    if (r.plan !== 'free') {
      throw new Error(`Row ${r.id} has plan ${r.plan}, expected 'free'`);
    }
    if (r.featured !== '') {
      throw new Error(`Row ${r.id} has featured ${r.featured}, expected ''`);
    }
    if (r.isBilingual !== false) {
      throw new Error(`Row ${r.id} has isBilingual ${r.isBilingual}, expected false`);
    }
    if (!r.pdfUrl.startsWith('https://drive.google.com/uc?id=') || !r.pdfUrl.endsWith('&export=download')) {
      throw new Error(`Row ${r.id} has invalid pdfUrl: ${r.pdfUrl}`);
    }
    if (!r.driveFileId || r.driveFileId.length < 20) {
      throw new Error(`Row ${r.id} has invalid driveFileId: ${r.driveFileId}`);
    }
  }

  // Check worked example
  const worked = completedRows.find((r) => r.id === 'sslc-tamil-2024-midterm-tm');
  if (!worked) {
    throw new Error(`Worked example 'sslc-tamil-2024-midterm-tm' not found in completed rows!`);
  }
  if (
    worked.classLevel !== '10th' ||
    worked.category !== 'model' ||
    worked.subject !== 'Tamil' ||
    worked.exam !== 'midterm' ||
    worked.year !== 2024 ||
    worked.medium !== 'tamil' ||
    worked.title !== '10th Tamil 2nd Midterm Model Question Paper 2024' ||
    worked.driveFileId !== '1lfrobjuZcjBqS_7feGw6eMqoydlOrWKB' ||
    worked.featured !== '' ||
    worked.plan !== 'free' ||
    worked.isBilingual !== false ||
    worked.pdfUrl !== 'https://drive.google.com/uc?id=1lfrobjuZcjBqS_7feGw6eMqoydlOrWKB&export=download'
  ) {
    throw new Error(`Worked example row mismatch! ${JSON.stringify(worked, null, 2)}`);
  }

  return completedRows;
}

async function main() {
  console.log('Building 114 Midterm Append-Ready rows...');
  const rows = await buildMidterm114Rows();

  // 1. Write ops/MIDTERM-114-APPEND-READY.json
  const opsDir = path.join(rootDir, 'ops');
  if (!fs.existsSync(opsDir)) fs.mkdirSync(opsDir, { recursive: true });
  fs.writeFileSync(
    path.join(opsDir, 'MIDTERM-114-APPEND-READY.json'),
    JSON.stringify(rows, null, 2),
    'utf8'
  );
  console.log(`✓ Written ${rows.length} rows to ops/MIDTERM-114-APPEND-READY.json`);

  // 2. Write centum/ops/MIDTERM-114-APPEND-READY.json
  const centumOpsDir = path.join(rootDir, 'centum', 'ops');
  if (!fs.existsSync(centumOpsDir)) fs.mkdirSync(centumOpsDir, { recursive: true });
  fs.writeFileSync(
    path.join(centumOpsDir, 'MIDTERM-114-APPEND-READY.json'),
    JSON.stringify(rows, null, 2),
    'utf8'
  );
  console.log(`✓ Written ${rows.length} rows to centum/ops/MIDTERM-114-APPEND-READY.json`);

  // 3. Update src/data/papers.json
  const papersJsonPath = path.join(rootDir, 'src', 'data', 'papers.json');
  if (fs.existsSync(papersJsonPath)) {
    const existingPapers = JSON.parse(fs.readFileSync(papersJsonPath, 'utf8'));
    const existingIds = new Set(existingPapers.map((p) => p.id));
    let addedCount = 0;
    const updatedCatalog = [...existingPapers];
    for (const r of rows) {
      if (!existingIds.has(r.id)) {
        updatedCatalog.push(r);
        existingIds.add(r.id);
        addedCount++;
      }
    }
    fs.writeFileSync(papersJsonPath, JSON.stringify(updatedCatalog, null, 2) + '\n', 'utf8');
    console.log(
      `✓ Updated src/data/papers.json: added ${addedCount} midterm rows, total papers now ${updatedCatalog.length}`
    );
  }

  console.log('\nVerification complete: All 114 rows generated and written successfully.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
  });
}
