import { NextResponse } from 'next/server';
import { SAMPLE_PAPERS } from '@/data/sampleData';

export const dynamic = 'force-dynamic';

export const normClass = (v: unknown) => {
  const s = String(v ?? '').trim().toLowerCase();
  if (s === '10' || s === '10th') return '10th';
  if (s === '12' || s === '12th') return '12th';
  return s; // 6th–9th, 11th pass through text-normalized
};

export const normMedium = (v: unknown) => String(v ?? '').trim().toLowerCase(); // 'english' | 'tamil'
export const normCategory = (v: unknown) => String(v ?? '').trim().toLowerCase(); // 'pyq' | 'model' | 'important' | 'book'
export const normPlan = (v: unknown) => {
  const s = String(v ?? '').trim().toLowerCase();
  return s === 'pro' || s === 'live' ? s : 'free';
};

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
          const normalizedPapers = data.papers.map((p: any) => ({
            ...p,
            classLevel: normClass(p.classLevel),
            medium: normMedium(p.medium),
            category: normCategory(p.category),
            plan: normPlan(p.plan),
          }));
          return NextResponse.json(
            {
              ...data,
              papers: normalizedPapers,
              source: 'live',
            },
            {
              headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=240',
                'x-data-source': 'live',
                'x-cache-version': 'cdn-v1',
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
        },
        {
          status: 503,
          headers: {
            'Cache-Control': 'no-store',
            'x-data-source': 'live-failed',
            'x-cache-version': 'cdn-v1',
          },
        }
      );
    } catch (e) {
      console.warn('Apps Script papers fetch failed', e);
      return NextResponse.json(
        {
          ok: false,
          error: 'backend-unreachable',
          source: 'live-failed',
        },
        {
          status: 503,
          headers: {
            'Cache-Control': 'no-store',
            'x-data-source': 'live-failed',
            'x-cache-version': 'cdn-v1',
          },
        }
      );
    }
  }

  // Fallback to bundled sample data ONLY when env vars are missing entirely (dev only)
  let papers = SAMPLE_PAPERS.map((p) => ({
    ...p,
    classLevel: normClass(p.classLevel),
    medium: normMedium(p.medium),
    category: normCategory(p.category),
    plan: normPlan(p.plan),
  }));

  if (classLevel) {
    papers = papers.filter(
      (p) => String(p.classLevel || '').toLowerCase() === classLevel.toLowerCase()
    );
  }
  if (medium) {
    papers = papers.filter(
      (p) => String(p.medium || '').toLowerCase() === medium.toLowerCase()
    );
  }

  return NextResponse.json(
    {
      ok: true,
      papers,
      source: 'mock-fallback',
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=240',
        'x-data-source': 'mock',
        'x-cache-version': 'cdn-v1',
      },
    }
  );
}
