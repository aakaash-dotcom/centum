import { NextResponse } from 'next/server';
import { joinMockTuition } from '@/lib/server-mock-store';
import { normalizePhone } from '@/lib/phone';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = body.phone || '';
    const code = (body.code || '').trim().toUpperCase();
    const cleanPhone = normalizePhone(rawPhone) || rawPhone;

    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json(
        { ok: false, error: 'valid-phone-required', message: 'A valid 10-digit mobile number is required.' },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { ok: false, error: 'code-required', message: 'Tuition centre code is required.' },
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
            action: 'classroom-join',
            phone: cleanPhone,
            code,
            key: secretKey,
          }),
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
      } catch (e) {
        console.warn('Apps Script classroom-join failed, falling back to mock store', e);
      }
    }

    const result = joinMockTuition(cleanPhone, code);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
