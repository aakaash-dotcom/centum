import { NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/phone';
import { earnMockCoins } from '@/lib/server-mock-store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone: rawPhone, reason, ref } = body || {};
    const phone = normalizePhone(rawPhone) || rawPhone;

    if (!phone || !reason) {
      return NextResponse.json(
        { ok: false, error: 'phone and reason are required' },
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
        const payload = {
          key: secretKey,
          type: 'coin-earn',
          phone,
          reason,
          ref: String(ref || ''),
        };

        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(
            { ...data, source: 'live' },
            {
              headers: {
                'Cache-Control': 'private, no-store',
                'x-data-source': 'live',
              },
            }
          );
        }
      } catch (err) {
        console.warn('Apps Script coin-earn failed, falling back to local simulation', err);
      }
    }

    const mockRes = earnMockCoins(phone, reason, String(ref || ''));
    return NextResponse.json(
      { ...mockRes, source: 'mock-fallback' },
      {
        headers: {
          'Cache-Control': 'private, no-store',
          'x-data-source': 'mock',
        },
      }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: 'coin-earn failed' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    );
  }
}
