import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone') || '';

  if (!phone) {
    return NextResponse.json(
      { ok: true, plan: 'free', source: 'live' },
      {
        headers: {
          'Cache-Control': 'private, no-store',
          'x-data-source': 'live',
          'x-cache-version': 'cdn-v1',
        },
      }
    );
  }

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'plan');
      externalUrl.searchParams.set('phone', phone);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), {
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(
          {
            ok: true,
            plan: data.plan || 'free',
            source: 'live',
          },
          {
            headers: {
              'Cache-Control': 'private, no-store',
              'x-data-source': 'live',
              'x-cache-version': 'cdn-v1',
            },
          }
        );
      }
    } catch (e) {
      console.warn('Apps Script plan fetch failed', e);
    }
  }

  return NextResponse.json(
    {
      ok: true,
      plan: 'free',
      source: 'mock-fallback',
    },
    {
      headers: {
        'Cache-Control': 'private, no-store',
        'x-data-source': 'mock',
        'x-cache-version': 'cdn-v1',
      },
    }
  );
}
