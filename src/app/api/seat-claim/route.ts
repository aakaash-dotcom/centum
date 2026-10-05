import { NextResponse } from 'next/server';
import { claimMockSeat } from '@/lib/server-mock-store';
import { normalizePhone } from '@/lib/phone';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = body.phone || '';
    const seatCode = (body.seatCode || '').trim().toUpperCase();
    const cleanPhone = normalizePhone(rawPhone) || rawPhone;

    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json(
        { ok: false, error: 'valid-phone-required', message: 'A valid 10-digit mobile number is required.' },
        { status: 400 }
      );
    }

    if (!seatCode) {
      return NextResponse.json(
        { ok: false, error: 'seat-code-required', message: 'Seat code is required.' },
        { status: 400 }
      );
    }

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    if (scriptUrl && secretKey) {
      try {
        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'seat-claim',
            phone: cleanPhone,
            seatCode,
            key: secretKey,
          }),
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
      } catch (e) {
        console.warn('Apps Script seat-claim failed, falling back to mock store', e);
      }
    }

    const result = claimMockSeat(cleanPhone, seatCode);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
