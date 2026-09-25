import { NextResponse } from 'next/server';
import { SAMPLE_PAPERS } from '@/data/sampleData';

export const dynamic = 'force-dynamic';

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
        next: { revalidate: 300 },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.papers)) {
          return NextResponse.json(
            {
              ...data,
              source: 'live',
            },
            {
              headers: {
                'Cache-Control': 'public, s-maxage=60',
                'x-data-source': 'live',
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
          },
        }
      );
    }
  }

  // Fallback to bundled sample data ONLY when env vars are missing entirely (dev only)
  let papers = SAMPLE_PAPERS;
  if (classLevel) {
    papers = papers.filter(
      (p) => p.classLevel.toLowerCase() === classLevel.toLowerCase()
    );
  }
  if (medium) {
    papers = papers.filter((p) => p.medium === medium);
  }

  return NextResponse.json(
    {
      ok: true,
      papers,
      source: 'mock-fallback',
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60',
        'x-data-source': 'mock',
      },
    }
  );
}
