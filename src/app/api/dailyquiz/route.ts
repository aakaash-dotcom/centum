import { NextResponse } from 'next/server';
import { SAMPLE_DAILY_QUIZZES } from '@/data/sampleData';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classLevel = searchParams.get('classLevel') || '10th';
  const stream = searchParams.get('stream');
  const medium = searchParams.get('medium') || 'english';

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'dailyquiz');
      externalUrl.searchParams.set('classLevel', classLevel);
      if (stream) externalUrl.searchParams.set('stream', stream);
      externalUrl.searchParams.set('medium', medium);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), {
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.ok) {
          return NextResponse.json(
            {
              ...data,
              source: 'live',
            },
            {
              headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=90',
                'x-data-source': 'live',
                'x-cache-version': 'cdn-v1',
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
            'x-cache-version': 'cdn-v1',
          },
        }
      );
    } catch (e) {
      console.warn('Apps Script dailyquiz fetch failed', e);
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

  // Fallback sample data ONLY when env vars are missing entirely (dev only)
  const found = SAMPLE_DAILY_QUIZZES.find((q) => {
    const matchClass = String(q.classLevel || '').toLowerCase() === classLevel.toLowerCase();
    const matchMedium = q.medium === medium;
    const matchStream = !stream || !q.stream || q.stream.toLowerCase() === stream.toLowerCase();
    return matchClass && matchMedium && matchStream;
  });

  return NextResponse.json(
    {
      ok: true,
      quiz: found || null,
      source: 'mock-fallback',
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=90',
        'x-data-source': 'mock',
        'x-cache-version': 'cdn-v1',
      },
    }
  );
}
