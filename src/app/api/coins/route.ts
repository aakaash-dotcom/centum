import { NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/phone';
import { getMockCoins } from '@/lib/server-mock-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get('phone') || '';
    const phone = normalizePhone(rawPhone) || rawPhone;

    if (!phone) {
      return NextResponse.json(
        { ok: false, error: 'phone required', balance: 0, recent: [] },
        {
          status: 400,
          headers: {
            'Cache-Control': 'private, no-store',
          },
        }
      );
    }

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    if (scriptUrl && secretKey) {
      try {
        const externalUrl = new URL(scriptUrl);
        externalUrl.searchParams.set('action', 'coins');
        externalUrl.searchParams.set('phone', phone);
        externalUrl.searchParams.set('key', secretKey);

        const res = await fetch(externalUrl.toString(), {
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(
            {
              ok: Boolean(data.ok),
              balance: Number(data.balance ?? 0),
              recent: Array.isArray(data.recent) ? data.recent : [],
              source: 'live',
            },
            {
              headers: {
                'Cache-Control': 'private, no-store',
                'x-data-source': 'live',
              },
            }
          );
        }
      } catch (err) {
        console.warn('Apps Script coins fetch failed, falling back to local info', err);
      }
    }

    const mock = getMockCoins(phone);
    return NextResponse.json(
      {
        ok: true,
        balance: mock.balance,
        recent: mock.recent,
        source: 'mock-fallback',
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
          'x-data-source': 'mock',
        },
      }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: 'failed to fetch coins', balance: 0, recent: [] },
      {
        status: 500,
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    );
  }
}
