import { NextResponse } from 'next/server';
import { verifyMockAdmin, listMockTuitions, addMockTuition } from '@/lib/server-mock-store';
import { normalizePhone } from '@/lib/phone';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPhone = searchParams.get('adminPhone') || '';
  const adminPassword = (searchParams.get('adminPassword') || '').trim();
  const adminPhone = normalizePhone(rawPhone) || rawPhone;

  if (!adminPhone || !adminPassword) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
  }

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'ops-classrooms-list');
      externalUrl.searchParams.set('adminPhone', adminPhone);
      externalUrl.searchParams.set('adminPassword', adminPassword);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn('Apps Script ops-classrooms-list failed, falling back to mock store', e);
    }
  }

  if (!verifyMockAdmin(adminPhone, adminPassword)) {
    return NextResponse.json({ ok: false, error: 'Invalid admin credentials' }, { status: 403 });
  }

  const tuitions = listMockTuitions(true);
  return NextResponse.json({ ok: true, tuitions });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminPhone: rawPhone, adminPassword: rawPassword, action = 'add' } = body || {};
    const adminPhone = normalizePhone(rawPhone) || rawPhone;
    const adminPassword = (rawPassword || '').trim();

    if (!adminPhone || !adminPassword) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    if (action === 'list') {
      if (scriptUrl && secretKey) {
        try {
          const externalUrl = new URL(scriptUrl);
          externalUrl.searchParams.set('action', 'ops-classrooms-list');
          externalUrl.searchParams.set('adminPhone', adminPhone);
          externalUrl.searchParams.set('adminPassword', adminPassword);
          externalUrl.searchParams.set('key', secretKey);

          const res = await fetch(externalUrl.toString(), { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            return NextResponse.json(data);
          }
        } catch (e) {
          console.warn('Apps Script ops-classrooms-list POST failed, falling back', e);
        }
      }

      if (!verifyMockAdmin(adminPhone, adminPassword)) {
        return NextResponse.json({ ok: false, error: 'Invalid admin credentials' }, { status: 403 });
      }

      const tuitions = listMockTuitions(true);
      return NextResponse.json({ ok: true, tuitions });
    }

    // Action: 'add'
    if (scriptUrl && secretKey) {
      try {
        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ops-classroom-add',
            adminPhone,
            adminPassword,
            key: secretKey,
            ...body,
          }),
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
      } catch (e) {
        console.warn('Apps Script ops-classroom-add failed, falling back', e);
      }
    }

    if (!verifyMockAdmin(adminPhone, adminPassword)) {
      return NextResponse.json({ ok: false, error: 'Invalid admin credentials' }, { status: 403 });
    }

    const result = addMockTuition(body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
