import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawCode = searchParams.get('code') || '';
  const code = rawCode.trim().toUpperCase();

  if (!code) {
    return NextResponse.json(
      { ok: true, valid: false },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60',
          'x-data-source': 'live',
        },
      }
    );
  }

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'coupon');
      externalUrl.searchParams.set('code', code);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), {
        next: { revalidate: 300 },
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(
          {
            ok: true,
            valid: Boolean(data.valid),
            discountPercent: data.discountPercent || 0,
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
      console.warn('Apps Script coupon fetch failed', e);
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

  // Built-in standard test coupons ONLY when env vars are missing entirely (dev only)
  if (code === 'FRIEND20') {
    return NextResponse.json(
      {
        ok: true,
        valid: true,
        discountPercent: 20,
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

  if (code === 'CENTUM10') {
    return NextResponse.json(
      {
        ok: true,
        valid: true,
        discountPercent: 10,
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

  return NextResponse.json(
    {
      ok: true,
      valid: false,
      discountPercent: 0,
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
