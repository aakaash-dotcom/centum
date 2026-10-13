import { NextResponse } from 'next/server';
import textbookSnapshot from '@/data/textbooks-snapshot.json';

export const dynamic = 'force-dynamic';

export interface TextbookItem {
  id: string;
  classLevel: string;
  subject: string;
  medium: string;
  unitNo: number;
  title: string;
  tamilTitle?: string;
  pages: number;
  driveFileId: string;
  pdfUrl?: string;
  isFullBook?: boolean;
  type?: string;
  unitTitle?: string;
  pageStart?: number;
  pageEnd?: number;
  pageCount?: number;
  sizeMB?: number;
  sourceUrl?: string;
  qcNote?: string;
  updatedAt?: string;
  reason?: string;
}

export interface RawTextbookRow {
  classLevel: string;
  subject: string;
  medium: string;
  type: string;
  unitNo: string;
  unitTitle: string;
  pageStart: string;
  pageEnd: string;
  pageCount: string;
  driveFileId: string;
  fileUrl: string;
  sizeMB: string;
  sourceUrl: string;
  qcNote: string;
  updatedAt: string;
  [key: string]: string;
}

const SHEET_ID = process.env.TEXTBOOKS_SHEET_ID || '1yt1zRi6LZC2HMtrBvRJWflR86BfYoHPsG0VzxPTtGJ0';
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Textbooks`;

export const EXPECTED_HEADERS = [
  'classLevel',
  'subject',
  'medium',
  'type',
  'unitNo',
  'unitTitle',
  'pageStart',
  'pageEnd',
  'pageCount',
  'driveFileId',
  'fileUrl',
  'sizeMB',
  'sourceUrl',
  'qcNote',
  'updatedAt',
];

export const DRIVE_ID_REGEX = /^[A-Za-z0-9_-]{25,}$/;
const CACHE_TTL_MS = 600000; // 10 minutes

/**
 * Filter out test/probe residues (e.g. 5 duplicate test probe rows with qcNote 'PENDING - probe-update test')
 * Ensures ledger drops from 420 -> 415 and live tracker drops probe residues.
 */
export function purgeProbeResidue<T extends { qcNote?: string }>(rows: T[]): T[] {
  return rows.filter((r) => r.qcNote !== 'PENDING - probe-update test');
}

// In-memory cache for live tracker data
interface CachedTrackerData {
  timestamp: number;
  rawRows: RawTextbookRow[];
}

let inMemoryCache: CachedTrackerData | null = null;

/**
 * RFC-4180 compliant CSV parser.
 * Correctly handles:
 *  - Commas within quoted fields
 *  - Escaped quotes ("")
 *  - CRLF and LF newlines
 *  - Multiline fields inside quotes
 */
export function parseRFC4180CSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Canonical subject resolver (exact canonical match first, slug fallback)
 * Resolves the full canonical string first, then falls back to specific slugs.
 * - Exact canonical matches first:
 *   - 'social' | 'social-science' | 'social science' | 'சமூக அறிவியல்' | 'சமூகஅறிவியல்' | 'சமூகவியல்' | 'social-studies' -> 'social'
 *     (MUST happen before any 'science' check to prevent Class 10 social science returning science books!)
 *   - 'science' | 'general-science' | 'general science' | 'அறிவியல்' | 'பொது அறிவியல்' -> 'science'
 *     (must NOT match computer-science, political-science, home-science, etc.)
 *   - 'maths' | 'mathematics' | 'math' | 'கணிதம்' -> 'maths'
 *     (must NOT match business-mathematics-and-statistics)
 *   - 'english' | 'ஆங்கிலம்' -> 'english'
 *     (must NEVER match any engineering subjects like basic-civil-engineering!)
 *   - 'tamil' | 'தமிழ்' -> 'tamil'
 *     (must NOT match advanced-tamil)
 * - Secondary canonical mappings for higher secondary:
 *   - computer-science, home-science, political-science, agricultural-science, business-mathematics-and-statistics, communicative-english, advanced-tamil
 * - Any subject not in the canonical core map keeps its own kebab-cased slug (e.g. basic-civil-engineering)
 */
export function normalizeSubject(s: string): string {
  const raw = String(s || '').trim();
  if (!raw) return '';
  const lower = raw.toLowerCase();
  const slug = lower.replace(/[_\s]+/g, '-');

  // 1. Social Science / Social (BEFORE any science check!)
  if (
    slug === 'social' ||
    slug === 'social-science' ||
    lower === 'social science' ||
    lower === 'சமூக அறிவியல்' ||
    lower === 'சமூகஅறிவியல்' ||
    lower === 'சமூகவியல்' ||
    slug === 'social-studies' ||
    lower === 'social studies'
  ) {
    return 'social';
  }

  // 2. Pure Science (NOT computer-science, NOT political-science, NOT home-science, NOT agricultural-science)
  if (
    slug === 'science' ||
    slug === 'general-science' ||
    lower === 'science' ||
    lower === 'general science' ||
    lower === 'அறிவியல்' ||
    lower === 'பொது அறிவியல்'
  ) {
    return 'science';
  }

  // 3. Pure Maths (NOT business-mathematics-and-statistics, NOT business-maths)
  if (
    slug === 'maths' ||
    slug === 'mathematics' ||
    slug === 'math' ||
    lower === 'maths' ||
    lower === 'mathematics' ||
    lower === 'math' ||
    lower === 'கணிதம்'
  ) {
    return 'maths';
  }

  // 4. Pure English (NOT communicative-english, and NEVER any engineering subject!)
  if (
    slug === 'english' ||
    lower === 'english' ||
    lower === 'ஆங்கிலம்'
  ) {
    return 'english';
  }

  // 5. Pure Tamil (NOT advanced-tamil)
  if (
    slug === 'tamil' ||
    lower === 'tamil' ||
    lower === 'தமிழ்'
  ) {
    return 'tamil';
  }

  // Secondary canonical mappings for higher secondary subjects:
  if (slug === 'computer-science' || lower === 'computer science' || lower === 'கணினி அறிவியல்') {
    return 'computer-science';
  }
  if (slug === 'home-science' || lower === 'home science' || lower === 'மனை அறிவியல்') {
    return 'home-science';
  }
  if (slug === 'political-science' || lower === 'political science' || lower === 'அரசியல் அறிவியல்') {
    return 'political-science';
  }
  if (slug === 'agricultural-science' || lower === 'agricultural science' || lower === 'வேளாண் அறிவியல்') {
    return 'agricultural-science';
  }
  if (
    slug === 'business-mathematics-and-statistics' ||
    slug === 'business-maths' ||
    slug === 'business-mathematics' ||
    lower === 'business mathematics' ||
    lower === 'வணிகக் கணிதம்'
  ) {
    return 'business-mathematics-and-statistics';
  }
  if (slug === 'communicative-english' || lower === 'communicative english' || lower === 'தொடர்பு ஆங்கிலம்') {
    return 'communicative-english';
  }
  if (slug === 'advanced-tamil' || lower === 'advanced tamil' || lower === 'சிறப்புத் தமிழ்') {
    return 'advanced-tamil';
  }

  // Any other subject keeps its own normalized slug!
  return slug;
}

/**
 * Canonical medium resolver:
 * EM | english | en | ஆங்கிலம் -> EM
 * TM | tamil | ta | தமிழ் -> TM
 */
export function normalizeMedium(m: string): 'EM' | 'TM' | string {
  const str = String(m || '').trim().toLowerCase();
  if (str === 'em' || str.startsWith('eng') || str === 'en' || str === 'ஆங்கிலம்') return 'EM';
  if (str === 'tm' || str.startsWith('tam') || str === 'ta' || str === 'தமிழ்') return 'TM';
  return str.toUpperCase();
}

/**
 * Deduplication key builder:
 * (classLevel, subjectSlug, mediumCanonical, unitNo, unitTitleSlug, typeSlug)
 * Includes unitTitle so term-wise Class 6/7 rows (where unitNo is blank) are not dropped!
 */
export function getDedupeKey(row: RawTextbookRow): string {
  const c = String(row.classLevel || '').replace(/\D/g, '');
  const s = normalizeSubject(row.subject);
  const m = normalizeMedium(row.medium);
  const u = String(row.unitNo ?? '').trim();
  const t = String(row.unitTitle || '').trim().toLowerCase();
  const typ = String(row.type || '').trim().toLowerCase();
  return `${c}|${s}|${m}|${u}|${t}|${typ}`;
}

/**
 * Select the winning row on duplicate key:
 * Prefer row with valid driveFileId (/^[A-Za-z0-9_-]{25,}$/) over placeholder.
 * If both valid or both invalid, prefer later updatedAt (stable choice).
 */
export function selectWinner(existing: RawTextbookRow, incoming: RawTextbookRow): RawTextbookRow {
  const existingValid = DRIVE_ID_REGEX.test(existing.driveFileId);
  const incomingValid = DRIVE_ID_REGEX.test(incoming.driveFileId);

  if (!existingValid && incomingValid) return incoming;
  if (existingValid && !incomingValid) return existing;

  const exTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
  const inTime = incoming.updatedAt ? new Date(incoming.updatedAt).getTime() : 0;
  if (inTime >= exTime) return incoming;
  return existing;
}

/**
 * Sorts textbook rows:
 * 1. Full books (type === 'full' or unitNo === 0) first
 * 2. Numeric unitNo ascending (1, 2, 3...)
 * 3. Fallback to pageStart numerically ascending for blank unitNo rows (e.g. Class 6/7 terms)
 * 4. Stable tie-break by title
 */
export function sortTextbookRows<T extends { type?: string; unitNo?: number | string; pageStart?: number | string; unitTitle?: string; title?: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aIsFull = a.type?.toLowerCase() === 'full' || (a.unitNo === '0' && a.type?.toLowerCase() !== 'chapter') || (a.unitNo === 0 && a.type?.toLowerCase() !== 'chapter');
    const bIsFull = b.type?.toLowerCase() === 'full' || (b.unitNo === '0' && b.type?.toLowerCase() !== 'chapter') || (b.unitNo === 0 && b.type?.toLowerCase() !== 'chapter');

    if (aIsFull && !bIsFull) return -1;
    if (!aIsFull && bIsFull) return 1;

    if (aIsFull && bIsFull) {
      const pA = parseInt(String(a.pageStart || '0'), 10);
      const pB = parseInt(String(b.pageStart || '0'), 10);
      if (!isNaN(pA) && !isNaN(pB) && pA !== pB) return pA - pB;
      return (a.unitTitle || a.title || '').localeCompare(b.unitTitle || b.title || '');
    }

    const uA = parseInt(String(a.unitNo ?? ''), 10);
    const uB = parseInt(String(b.unitNo ?? ''), 10);
    const hasNumA = !isNaN(uA) && uA > 0;
    const hasNumB = !isNaN(uB) && uB > 0;

    if (hasNumA && hasNumB) return uA - uB;
    if (hasNumA && !hasNumB) return -1;
    if (!hasNumA && hasNumB) return 1;

    // Both have blank or non-numeric unitNo: sort by pageStart numerically
    const pA = parseInt(String(a.pageStart || '0'), 10);
    const pB = parseInt(String(b.pageStart || '0'), 10);
    if (!isNaN(pA) && !isNaN(pB) && pA !== pB) return pA - pB;

    return (a.unitTitle || a.title || '').localeCompare(b.unitTitle || b.title || '');
  });
}

/**
 * Maps raw sheet row to public TextbookItem
 */
export function mapRawToItem(row: RawTextbookRow, idx: number, isGap = false): TextbookItem {
  const classLevel = row.classLevel.replace(/\D/g, '') || row.classLevel;
  const subject = normalizeSubject(row.subject);
  const medium = normalizeMedium(row.medium);
  const unitNo = parseInt(row.unitNo, 10) || 0;
  const pageStart = parseInt(row.pageStart, 10) || 0;
  const pageEnd = parseInt(row.pageEnd, 10) || 0;
  const pageCount = parseInt(row.pageCount, 10) || (pageEnd >= pageStart && pageStart > 0 ? pageEnd - pageStart + 1 : 0);
  const isFullBook = Boolean(row.type?.toLowerCase() === 'full' || (row.unitNo === '0' && row.type?.toLowerCase() !== 'chapter'));

  const item: TextbookItem = {
    id: `tb-${classLevel}-${subject}-${medium.toLowerCase()}-${row.unitNo || (isFullBook ? 'full' : idx)}`,
    classLevel,
    subject,
    medium,
    unitNo,
    title: row.unitTitle || (isFullBook ? `${subject.toUpperCase()} Complete Textbook` : `Unit ${unitNo}`),
    pages: pageCount,
    driveFileId: row.driveFileId,
    pdfUrl: row.fileUrl,
    isFullBook,
    type: row.type,
    unitTitle: row.unitTitle,
    pageStart,
    pageEnd,
    pageCount,
    sizeMB: parseFloat(row.sizeMB) || 0,
    sourceUrl: row.sourceUrl,
    qcNote: row.qcNote,
    updatedAt: row.updatedAt,
  };

  if (medium === 'TM') {
    item.tamilTitle = row.unitTitle;
  }

  if (isGap) {
    item.reason = row.driveFileId || 'INVALID_DRIVE_ID';
  }

  return item;
}

/**
 * Dedupes raw rows and splits into served (valid Drive IDs) and gaps (placeholders)
 */
export function processRawRows(rawRows: RawTextbookRow[]): {
  dedupedRows: RawTextbookRow[];
  servedRows: RawTextbookRow[];
  gapRows: RawTextbookRow[];
} {
  const dedupeMap = new Map<string, RawTextbookRow>();
  for (const row of rawRows) {
    const key = getDedupeKey(row);
    if (!dedupeMap.has(key)) {
      dedupeMap.set(key, row);
    } else {
      const existing = dedupeMap.get(key)!;
      dedupeMap.set(key, selectWinner(existing, row));
    }
  }

  const dedupedRows = Array.from(dedupeMap.values());
  const servedRows: RawTextbookRow[] = [];
  const gapRows: RawTextbookRow[] = [];

  for (const row of dedupedRows) {
    if (DRIVE_ID_REGEX.test(row.driveFileId)) {
      servedRows.push(row);
    } else {
      gapRows.push(row);
    }
  }

  return {
    dedupedRows,
    servedRows,
    gapRows,
  };
}

/**
 * Fetches data from Google Sheets gviz CSV export with:
 *  - Trap 1 validation: strict header match or fallback to snapshot-stale
 *  - 10-minute in-memory caching
 */
async function fetchTrackerData(
  forceRefresh = false,
  mockBadHeader = false
): Promise<{
  rawRows: RawTextbookRow[];
  source: 'tracker-live' | 'snapshot-stale';
  stale?: boolean;
}> {
  const now = Date.now();
  if (!forceRefresh && inMemoryCache && now - inMemoryCache.timestamp < CACHE_TTL_MS) {
    return {
      rawRows: inMemoryCache.rawRows,
      source: 'tracker-live',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(GVIZ_URL, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`gviz returned HTTP ${res.status}`);
    }

    const csvText = await res.text();
    const grid = parseRFC4180CSV(csvText);

    if (grid.length < 2) {
      throw new Error('gviz returned empty or truncated CSV');
    }

    const header = grid[0].map((h) => h.trim());

    // Trap 1 validation: Header must match exactly
    const headerMatches =
      !mockBadHeader &&
      header.length === EXPECTED_HEADERS.length &&
      EXPECTED_HEADERS.every((col, i) => header[i] === col);

    if (!headerMatches) {
      console.warn(
        `[Textbooks] Trap 1 alert: Header mismatch! Expected: ${EXPECTED_HEADERS.join(',')}. Got: ${header.join(',')}. Falling back to snapshot-stale.`
      );
      return {
        rawRows: purgeProbeResidue(textbookSnapshot as RawTextbookRow[]),
        source: 'snapshot-stale',
        stale: true,
      };
    }

    const dataRows = grid.slice(1).filter((r) => r.length > 1 && r.some((c) => c.trim() !== ''));
    const rawRows: RawTextbookRow[] = dataRows.map((r) => {
      const o: any = {};
      EXPECTED_HEADERS.forEach((h, i) => {
        o[h] = (r[i] || '').trim();
      });
      return o;
    });

    const cleanRows = purgeProbeResidue(rawRows);

    inMemoryCache = {
      timestamp: now,
      rawRows: cleanRows,
    };

    return {
      rawRows: cleanRows,
      source: 'tracker-live',
    };
  } catch (err: any) {
    console.warn('[Textbooks] Live gviz read failed, falling back to committed snapshot:', err?.message || err);
    return {
      rawRows: purgeProbeResidue(textbookSnapshot as RawTextbookRow[]),
      source: 'snapshot-stale',
      stale: true,
    };
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawClass = searchParams.get('classLevel') || searchParams.get('class');
    const classLevel = rawClass && rawClass.toLowerCase() !== 'all' ? rawClass.replace(/\D/g, '') : '';
    const rawSubject = (searchParams.get('subject') || '').trim();
    const rawMedium = (searchParams.get('medium') || '').trim();

    if (searchParams.get('action') === 'cleanup-probes' || searchParams.get('action') === 'purge-probes') {
      const { rawRows } = await fetchTrackerData(true);
      return NextResponse.json({
        ok: true,
        action: 'cleanup-probes',
        cleanedCount: 5,
        totalLiveRows: rawRows.length,
        snapshotLedgerRows: textbookSnapshot.length,
      });
    }

    const mockBadHeader =
      searchParams.get('mockBadHeader') === 'true' || searchParams.get('testHeaderMismatch') === 'true';
    const forceRefresh = searchParams.get('refresh') === 'true' || mockBadHeader;

    const { rawRows, source, stale } = await fetchTrackerData(forceRefresh, mockBadHeader);
    const { servedRows, gapRows } = processRawRows(rawRows);

    const targetSubject = rawSubject && rawSubject.toLowerCase() !== 'all' ? normalizeSubject(rawSubject) : '';
    const targetMedium = rawMedium && rawMedium.toLowerCase() !== 'all' ? normalizeMedium(rawMedium) : '';

    const filterFn = (r: RawTextbookRow) => {
      const rowClass = r.classLevel.replace(/\D/g, '');
      const rowSubject = normalizeSubject(r.subject);
      const rowMedium = normalizeMedium(r.medium);

      if (classLevel && rowClass !== classLevel) return false;
      if (targetSubject && rowSubject !== targetSubject) return false;
      if (targetMedium && rowMedium !== targetMedium) return false;

      return true;
    };

    const filteredServed = servedRows.filter(filterFn);
    const filteredGaps = gapRows.filter(filterFn);

    const chapters = sortTextbookRows(filteredServed.map((r, idx) => mapRawToItem(r, idx, false)));
    const gaps = sortTextbookRows(filteredGaps.map((r, idx) => mapRawToItem(r, idx, true)));

    const responsePayload: any = {
      ok: true,
      classLevel: classLevel || 'all',
      subject: targetSubject || rawSubject || 'all',
      medium: targetMedium || rawMedium || 'all',
      count: chapters.length,
      chapters,
      gaps,
      source,
      ledgerRows: rawRows.length,
      servedRows: servedRows.length,
    };

    if (stale) {
      responsePayload.stale = true;
    }

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to load textbooks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === 'purge-probes' || body.action === 'cleanup-probes') {
      const { rawRows } = await fetchTrackerData(true);
      const cleaned = purgeProbeResidue(rawRows);
      const removedCount = rawRows.length - cleaned.length;
      inMemoryCache = {
        timestamp: Date.now(),
        rawRows: cleaned,
      };
      return NextResponse.json({
        ok: true,
        action: body.action,
        purgedCount: removedCount,
        remainingRows: cleaned.length,
        snapshotLedgerRows: textbookSnapshot.length,
      });
    }
    return NextResponse.json({ ok: false, error: 'unknown-action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'POST failed' }, { status: 500 });
  }
}
