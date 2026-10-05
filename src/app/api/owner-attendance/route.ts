import { NextResponse } from 'next/server';
import {
  getMockOwnerAttendance,
  saveMockOwnerAttendance,
} from '@/lib/server-mock-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || '';
  const ownerPhone = searchParams.get('ownerPhone') || '';
  const date = searchParams.get('date') || '';

  if (!code || !ownerPhone) {
    return NextResponse.json({ ok: false, error: 'code-and-ownerPhone-required' }, { status: 400 });
  }

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'ownerAttendance');
      externalUrl.searchParams.set('code', code);
      externalUrl.searchParams.set('ownerPhone', ownerPhone);
      if (date) externalUrl.searchParams.set('date', date);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn('Apps Script ownerAttendance GET failed, falling back to mock store', e);
    }
  }

  const result = getMockOwnerAttendance(code, ownerPhone, date);
  return NextResponse.json(result, {
    status: result.ok ? 200 : 403,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    if (scriptUrl && secretKey) {
      try {
        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, key: secretKey }),
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
      } catch (e) {
        console.warn('Apps Script ownerAttendance POST failed, falling back to mock store', e);
      }
    }

    const result = saveMockOwnerAttendance(body.code, body.ownerPhone, body.date, body.records || []);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
