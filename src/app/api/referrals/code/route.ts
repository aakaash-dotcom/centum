import { NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/phone';
import { getOrCreateMockReferralCode } from '@/lib/server-mock-store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone: rawPhone, name } = body || {};
    const phone = normalizePhone(rawPhone) || rawPhone;

    if (!phone) {
      return NextResponse.json(
        { ok: false, error: 'phone is required' },
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
          type: 'referral-code',
          phone,
          name: name || '',
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
            { ok: Boolean(data.ok), code: data.code, source: 'live' },
            {
              headers: {
                'Cache-Control': 'private, no-store',
                'x-data-source': 'live',
              },
            }
          );
        }
      } catch (err) {
        console.warn('Apps Script referral-code failed, falling back to local simulation', err);
      }
    }

    const mockRes = getOrCreateMockReferralCode(phone, name);
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
      { ok: false, error: 'referral-code generation failed' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    );
  }
}
