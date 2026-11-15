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
        cache: 'no-store',
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
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=240',
                'x-data-source': 'live',
                'x-cache-version': 'cdn-v1',
              },
            }
          );
        }
      }

      console.warn('Apps Script news returned non-200 or invalid payload, falling back to committed news');
    } catch (e) {
      console.warn('Apps Script news fetch failed, falling back to committed news', e);
    }
  }

  // Graceful fallback to verified news catalog when upstream is unavailable
  return NextResponse.json(
    {
      ok: true,
      news: SAMPLE_NEWS,
      source: 'fallback',
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=240',
        'x-data-source': 'fallback',
        'x-cache-version': 'cdn-v1',
      },
    }
  );
}
