import { NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/phone';
import { spendMockCoins } from '@/lib/server-mock-store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone: rawPhone, reason, ref, amount } = body || {};
    const phone = normalizePhone(rawPhone) || rawPhone;
    const numAmount = Number(amount);

    if (!phone || !reason || isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { ok: false, error: 'valid phone, reason, and amount are required' },
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
          type: 'coin-spend',
          phone,
          reason,
          ref: String(ref || ''),
          amount: numAmount,
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
        console.warn('Apps Script coin-spend failed, falling back to local simulation', err);
      }
    }

    const mockRes = spendMockCoins(phone, reason, String(ref || ''), numAmount);
    return NextResponse.json(
      { ...mockRes, source: 'mock-fallback' },
      {
        status: mockRes.ok ? 200 : 400,
        headers: {
          'Cache-Control': 'private, no-store',
          'x-data-source': 'mock',
        },
      }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: 'coin-spend failed' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    );
  }
}
