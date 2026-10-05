import { NextResponse } from 'next/server';
import { verifyMockAdmin, generateMockSeats } from '@/lib/server-mock-store';
import { normalizePhone } from '@/lib/phone';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminPhone: rawPhone, adminPassword: rawPassword, tuitionCode, count = 20 } = body || {};
    const adminPhone = normalizePhone(rawPhone) || rawPhone;
    const adminPassword = (rawPassword || '').trim();

    if (!adminPhone || !adminPassword) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (!tuitionCode) {
      return NextResponse.json({ ok: false, error: 'tuitionCode required' }, { status: 400 });
    }

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    if (scriptUrl && secretKey) {
      try {
        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ops-seat-generate',
            adminPhone,
            adminPassword,
            key: secretKey,
            tuitionCode,
            count: Number(count) || 20,
          }),
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
      } catch (e) {
        console.warn('Apps Script ops-seat-generate failed, falling back', e);
      }
    }

    if (!verifyMockAdmin(adminPhone, adminPassword)) {
      return NextResponse.json({ ok: false, error: 'Invalid admin credentials' }, { status: 403 });
    }

    const result = generateMockSeats(tuitionCode, Number(count) || 20);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
