import { NextResponse } from 'next/server';
import { allPapers, detectBilingualPapers, deduplicateBilingualPapers } from '@/lib/data';

export const dynamic = 'force-dynamic';

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classLevel = searchParams.get('classLevel');
  const medium = searchParams.get('medium');

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
          let normalizedPapers = detectBilingualPapers(
            data.papers
              .filter((p: any) => {
                const cat = String(p.category || 'pyq').toLowerCase();
                if (cat === 'provisional') return false;
                const yr = Number(p.year);
                if (yr && (yr < 2022 || yr > 2025)) return false;
                return true;
              })
              .map((p: any) => ({
                ...p,
                classLevel: normClass(p.classLevel),
                medium: normMedium(p.medium),
                category: normCategory(p.category),
                plan: normPlan(p.plan),
                driveFileId: extractDriveId(p),
              }))
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

          normalizedPapers = deduplicateBilingualPapers(normalizedPapers);

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
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=240',
                'x-data-source': 'live',
                'x-served-from': 'gas',
                'x-cache-version': 'cdn-v2',
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
  let papers = detectBilingualPapers(
    (allPapers as any[]).map((p) => ({
      ...p,
      classLevel: normClass(p.classLevel),
      medium: normMedium(p.medium),
      category: normCategory(p.category),
      plan: normPlan(p.plan),
      driveFileId: extractDriveId(p),
    }))
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

  papers = deduplicateBilingualPapers(papers);

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
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=240',
        'x-data-source': 'catalog',
        'x-served-from': 'catalog-fallback',
        'x-cache-version': 'cdn-v2',
      },
    }
  );
}
