import { NextResponse } from 'next/server';
import { allPapers, detectBilingualPapers, deduplicateBilingualPapers, normalizeSubjectName } from '@/lib/data';
import fs from 'fs';
import path from 'path';
import paperSwaps from '@/data/paper-swaps.json';
import midtermCatalog from '@/data/midterm-114.json';

export const dynamic = 'force-dynamic';

export function getVerifiedSwaps(): Record<string, string> {
  const merged: Record<string, string> = { ...(paperSwaps as Record<string, string>) };

  const candidatePaths = [
    path.join(process.cwd(), 'ops', 'SWAP-79-VERIFIED.json'),
    path.join(process.cwd(), 'centum', 'ops', 'SWAP-79-VERIFIED.json'),
    path.join(process.cwd(), '..', 'centum', 'ops', 'SWAP-79-VERIFIED.json'),
    path.join(process.cwd(), '..', 'ops', 'SWAP-79-VERIFIED.json'),
    path.join(process.cwd(), 'scripts', 'SWAP-79-VERIFIED.json'),
    'C:/centum/ops/SWAP-79-VERIFIED.json',
  ];

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
        const raw = JSON.parse(fs.readFileSync(/*turbopackIgnore: true*/ p, 'utf8'));
        if (typeof raw === 'object' && raw !== null) {
          for (const [id, val] of Object.entries(raw)) {
            if (val && typeof val === 'object' && (val as any).swapTo) {
              merged[id] = (val as any).swapTo;
            } else if (typeof val === 'string') {
              merged[id] = val;
            }
          }
        }
      }
    } catch {}
  }

  try {
    const envVal = process.env.SWAP_79_VERIFIED || process.env.SWAP_79_VERIFIED_JSON;
    if (envVal) {
      const parsed = JSON.parse(envVal);
      if (typeof parsed === 'object' && parsed !== null) {
        for (const [id, val] of Object.entries(parsed)) {
          if (val && typeof val === 'object' && (val as any).swapTo) {
            merged[id] = (val as any).swapTo;
          } else if (typeof val === 'string') {
            merged[id] = val;
          }
        }
      }
    }
  } catch {}

  return merged;
}

export function getMidtermAppendRows(): any[] {
  if (Array.isArray(midtermCatalog) && midtermCatalog.length > 0) {
    return midtermCatalog;
  }
  const candidatePaths = [
    path.join(process.cwd(), 'centum', 'ops', 'MIDTERM-114-APPEND-READY.json'),
    path.join(process.cwd(), 'ops', 'MIDTERM-114-APPEND-READY.json'),
    path.join(process.cwd(), '..', 'centum', 'ops', 'MIDTERM-114-APPEND-READY.json'),
    path.join(process.cwd(), '..', 'ops', 'MIDTERM-114-APPEND-READY.json'),
    path.join(process.cwd(), 'scripts', 'MIDTERM-114-APPEND-READY.json'),
    'C:/centum/ops/MIDTERM-114-APPEND-READY.json',
  ];

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
        const raw = JSON.parse(fs.readFileSync(/*turbopackIgnore: true*/ p, 'utf8'));
        if (Array.isArray(raw) && raw.length > 0) {
          return raw;
        }
      }
    } catch {}
  }
  return [];
}

export const normClass = (v: unknown) => {
  const s = String(v ?? '').trim().toLowerCase();
  const digits = s.replace(/\D/g, '');
  if (['6', '7', '8', '9', '10', '11', '12'].includes(digits)) {
    return `${digits}th`;
  }
  return s;
};

export function resolveCanonicalMedium(val: unknown): 'english' | 'tamil' | null {
  if (!val) return null;
  const s = String(val).trim().toLowerCase();
  if (['em', 'english', 'en', 'இங்கிலீஷ்', 'ஆங்கிலம்'].includes(s)) {
    return 'english';
  }
  if (['tm', 'tamil', 'ta', 'தமிழ்'].includes(s)) {
    return 'tamil';
  }
  return null;
}

export const normMedium = (v: unknown) => {
  const canon = resolveCanonicalMedium(v);
  return canon || String(v ?? '').trim().toLowerCase();
};

export const normCategory = (v: unknown) => {
  const s = String(v ?? '').trim().toLowerCase();
  return s || 'pyq';
};

export const normPlan = (v: unknown) => {
  const s = String(v ?? '').trim().toLowerCase();
  return s === 'pro' || s === 'live' ? s : 'free';
};

function extractDriveId(p: any): string {
  if (p.driveFileId && p.driveFileId !== 'REPLACE_DRIVE_ID') return p.driveFileId;
  if (p.pdfUrl) {
    const m = String(p.pdfUrl).match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
  }
  return p.driveFileId || '';
}

export const DROPPED_BILINGUAL_DUPLICATE_IDS = new Set([
  'sslc-mathematics-2022-annual-tm',
  'sslc-science-2022-annual-tm',
  'sslc-social-science-2022-annual-tm',
  'hsc-accountancy-2022-annual-tm',
  'hsc-biology-2022-annual-tm',
  'hsc-botany-2022-annual-tm',
  'hsc-business-maths-2022-annual-tm',
  'hsc-chemistry-2022-annual-tm',
  'hsc-commerce-2022-annual-tm',
  'hsc-computer-science-2022-annual-tm',
  'hsc-economics-2022-annual-tm',
  'hsc-history-2022-annual-tm',
  'hsc-mathematics-2022-annual-tm',
  'hsc-mathematics-2024-annual-tm',
  'hsc-mathematics-2025-annual-tm',
  'hsc-physics-2022-annual-tm',
  'hsc-political-science-2022-annual-tm',
  'hsc-political-science-2024-annual-tm',
  'hsc-political-science-2025-annual-tm',
  'hsc-statistics-2022-annual-tm',
  'hsc-statistics-2024-annual-tm',
  'hsc-statistics-2025-annual-tm',
  'hsc-zoology-2022-annual-tm',
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classLevel = searchParams.get('classLevel');
  const medium = searchParams.get('medium');
  const subject = searchParams.get('subject');
  const exam = searchParams.get('exam');
  const category = searchParams.get('category');

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'papers');
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), {
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.papers)) {
          const midtermRows = getMidtermAppendRows();
          const existingIds = new Set(data.papers.map((p: any) => p.id));
          const combinedRawPapers = [...data.papers];
          for (const m of midtermRows) {
            if (!existingIds.has(m.id)) {
              combinedRawPapers.push(m);
              existingIds.add(m.id);
            }
          }

          let normalizedPapers = detectBilingualPapers(
            combinedRawPapers
              .filter((p: any) => {
                if (DROPPED_BILINGUAL_DUPLICATE_IDS.has(p.id)) return false;
                const cat = String(p.category || 'pyq').toLowerCase();
                if (cat === 'provisional') return false;
                const isModelOrMidterm = cat === 'model' || String(p.exam || '').toLowerCase().includes('mid');
                const yr = Number(p.year);
                if (!isModelOrMidterm && yr && (yr < 2022 || yr > 2025)) return false;
                if (isModelOrMidterm && yr && (yr < 2022 || yr > 2026)) return false;
                return true;
              })
              .map((p: any) => {
                const verifiedSwaps = getVerifiedSwaps();
                const swapDriveId = verifiedSwaps[p.id];
                const resolvedDriveId = swapDriveId || extractDriveId(p);
                return {
                  ...p,
                  classLevel: normClass(p.classLevel),
                  medium: normMedium(p.medium),
                  category: normCategory(p.category),
                  plan: normPlan(p.plan),
                  driveFileId: resolvedDriveId,
                  pdfUrl: swapDriveId
                    ? `https://drive.google.com/uc?id=${swapDriveId}&export=download`
                    : (p.pdfUrl || (resolvedDriveId ? `https://drive.google.com/uc?id=${resolvedDriveId}&export=download` : '')),
                };
              })
          );

          if (classLevel) {
            const targetDigit = classLevel.replace(/\D/g, '');
            normalizedPapers = normalizedPapers.filter(
              (p: any) => String(p.classLevel || '').replace(/\D/g, '') === targetDigit
            );
          }

          // BUG 3 Fix: Canonical medium filtering without leaking other language papers
          if (medium && medium.toLowerCase() !== 'all') {
            const targetMedium = resolveCanonicalMedium(medium);
            if (targetMedium) {
              normalizedPapers = normalizedPapers.filter((p: any) => {
                const paperMed = resolveCanonicalMedium(p.medium);
                return paperMed === targetMedium;
              });
            } else {
              normalizedPapers = [];
            }
          }

          // R9.3: Filter by subject when supplied
          if (subject && subject.toLowerCase() !== 'all') {
            const targetSubj = normalizeSubjectName(subject).toLowerCase();
            normalizedPapers = normalizedPapers.filter((p: any) => {
              const pSubj = normalizeSubjectName(String(p.subject || '')).toLowerCase();
              return pSubj === targetSubj;
            });
          }

          if (exam && exam.toLowerCase() !== 'all') {
            const targetExam = exam.trim().toLowerCase();
            normalizedPapers = normalizedPapers.filter((p: any) => {
              const pExam = String(p.exam || '').trim().toLowerCase();
              return pExam === targetExam || (targetExam === 'midterm' && pExam.includes('mid'));
            });
          }

          if (category && category.toLowerCase() !== 'all') {
            const targetCat = category.trim().toLowerCase();
            normalizedPapers = normalizedPapers.filter((p: any) => {
              const pCat = String(p.category || 'pyq').trim().toLowerCase();
              return pCat === targetCat;
            });
          }

          if (searchParams.get('dedup') === 'true') {
            normalizedPapers = deduplicateBilingualPapers(normalizedPapers);
          }

          return NextResponse.json(
            {
              ...data,
              papers: normalizedPapers,
              totalCount: normalizedPapers.length,
              source: 'live',
              servedFrom: 'gas',
            },
            {
              headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
                'x-data-source': 'live',
                'x-served-from': 'gas',
                'x-cache-version': 'cdn-v3',
              },
            }
          );
        }
      }

      // Upstream responded with error status or malformed data
      return NextResponse.json(
        {
          ok: false,
          error: 'backend-unreachable',
          source: 'live-failed',
          servedFrom: 'none',
        },
        {
          status: 503,
          headers: {
            'Cache-Control': 'no-store',
            'x-data-source': 'live-failed',
            'x-cache-version': 'cdn-v2',
          },
        }
      );
    } catch (e) {
      console.warn('Apps Script papers fetch failed, falling back to committed catalog', e);
    }
  }

  // Fallback to committed catalog in papers.json when env vars are missing or upstream is unreachable
  const verifiedSwaps = getVerifiedSwaps();
  const midtermRows = getMidtermAppendRows();
  const existingFallbackIds = new Set((allPapers as any[]).map((p) => p.id));
  const combinedFallback = [...(allPapers as any[])];
  for (const m of midtermRows) {
    if (!existingFallbackIds.has(m.id)) {
      combinedFallback.push(m);
      existingFallbackIds.add(m.id);
    }
  }

  let papers = detectBilingualPapers(
    combinedFallback
      .filter((p: any) => {
        if (DROPPED_BILINGUAL_DUPLICATE_IDS.has(p.id)) return false;
        const cat = String(p.category || 'pyq').toLowerCase();
        if (cat === 'provisional') return false;
        const isModelOrMidterm = cat === 'model' || String(p.exam || '').toLowerCase().includes('mid');
        const yr = Number(p.year);
        if (!isModelOrMidterm && yr && (yr < 2022 || yr > 2025)) return false;
        if (isModelOrMidterm && yr && (yr < 2022 || yr > 2026)) return false;
        return true;
      })
      .map((p) => {
        const swapDriveId = verifiedSwaps[p.id];
        const resolvedDriveId = swapDriveId || extractDriveId(p);
        return {
          ...p,
          classLevel: normClass(p.classLevel),
          medium: normMedium(p.medium),
          category: normCategory(p.category),
          plan: normPlan(p.plan),
          driveFileId: resolvedDriveId,
          pdfUrl: swapDriveId
            ? `https://drive.google.com/uc?id=${swapDriveId}&export=download`
            : (p.pdfUrl || (resolvedDriveId ? `https://drive.google.com/uc?id=${resolvedDriveId}&export=download` : '')),
        };
      })
  );

  if (classLevel) {
    const targetDigit = classLevel.replace(/\D/g, '');
    papers = papers.filter(
      (p) => String(p.classLevel || '').replace(/\D/g, '') === targetDigit
    );
  }

  if (medium && medium.toLowerCase() !== 'all') {
    const targetMedium = resolveCanonicalMedium(medium);
    if (targetMedium) {
      papers = papers.filter((p: any) => {
        const paperMed = resolveCanonicalMedium(p.medium);
        return paperMed === targetMedium;
      });
    } else {
      papers = [];
    }
  }

  // R9.3: Filter by subject when supplied
  if (subject && subject.toLowerCase() !== 'all') {
    const targetSubj = normalizeSubjectName(subject).toLowerCase();
    papers = papers.filter((p: any) => {
      const pSubj = normalizeSubjectName(String(p.subject || '')).toLowerCase();
      return pSubj === targetSubj;
    });
  }

  if (exam && exam.toLowerCase() !== 'all') {
    const targetExam = exam.trim().toLowerCase();
    papers = papers.filter((p: any) => {
      const pExam = String(p.exam || '').trim().toLowerCase();
      return pExam === targetExam || (targetExam === 'midterm' && pExam.includes('mid'));
    });
  }

  if (category && category.toLowerCase() !== 'all') {
    const targetCat = category.trim().toLowerCase();
    papers = papers.filter((p: any) => {
      const pCat = String(p.category || 'pyq').trim().toLowerCase();
      return pCat === targetCat;
    });
  }

  if (searchParams.get('dedup') === 'true') {
    papers = deduplicateBilingualPapers(papers);
  }

  return NextResponse.json(
    {
      ok: true,
      papers,
      totalCount: papers.length,
      source: 'catalog',
      servedFrom: 'catalog-fallback',
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        'x-data-source': 'catalog',
        'x-served-from': 'catalog-fallback',
        'x-cache-version': 'cdn-v3',
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    if (!scriptUrl || !secretKey) {
      return NextResponse.json({ ok: false, error: 'bridge-not-configured' }, { status: 503 });
    }

    if (body.action === 'sync-sheet-swaps' || body.action === 'ops-papers-batch-swap') {
      const res = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ops-papers-batch-swap',
          key: secretKey,
          swaps: body.swaps || getVerifiedSwaps(),
        }),
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (body.action === 'append-midterm-to-sheet' || body.action === 'ops-papers-batch-append') {
      const rowsToAppend = body.rows || getMidtermAppendRows();

      // First try batch append on GAS
      try {
        const batchRes = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ops-papers-batch-append',
            key: secretKey,
            rows: rowsToAppend,
          }),
        });
        const batchData = await batchRes.json().catch(() => null);
        if (batchData && batchData.ok) {
          return NextResponse.json(batchData);
        }
      } catch {}

      // Fallback: append row-by-row via ops-add
      let added = 0;
      const errors: any[] = [];
      for (const row of rowsToAppend) {
        try {
          const res = await fetch(scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'ops-add',
              key: secretKey,
              tab: 'Papers',
              row,
            }),
          });
          const d = await res.json().catch(() => null);
          if (d && d.ok) added++;
          else errors.push({ id: row.id, error: d?.error || 'failed' });
        } catch (err: any) {
          errors.push({ id: row.id, error: err?.message || 'fetch-failed' });
        }
      }

      return NextResponse.json({
        ok: true,
        method: 'ops-add-loop',
        added,
        total: rowsToAppend.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    if (body.action === 'gas-proxy') {
      const res = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(body.payload || {}),
          key: secretKey,
        }),
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ ok: false, error: 'unknown-action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'POST failed' }, { status: 500 });
  }
}
