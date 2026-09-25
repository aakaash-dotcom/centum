import { NextResponse } from 'next/server';
import { SAMPLE_NEWS } from '@/data/sampleData';

export const dynamic = 'force-dynamic';

export async function GET() {
  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'news');
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), {
        next: { revalidate: 300 },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.news)) {
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
      console.warn('Apps Script news fetch failed', e);
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

  // Fallback to bundled sample news ONLY when env vars are missing entirely (dev only)
  return NextResponse.json(
    {
      ok: true,
      news: SAMPLE_NEWS,
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
