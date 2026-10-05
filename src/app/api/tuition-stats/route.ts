import { NextResponse } from 'next/server';
import { getMockTuitionStats, verifyMockAdmin } from '@/lib/server-mock-store';
import { normalizePhone } from '@/lib/phone';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get('code') || '').trim().toUpperCase();
  const ownerPhone = searchParams.get('ownerPhone') || '';
  const adminPhone = searchParams.get('adminPhone') || '';
  const adminPassword = searchParams.get('adminPassword') || '';

  if (!code) {
    return NextResponse.json({ ok: false, error: 'code-required' }, { status: 400 });
  }

  const cleanOwner = normalizePhone(ownerPhone) || ownerPhone;
  const isAdmin = Boolean(adminPhone && adminPassword && verifyMockAdmin(adminPhone, adminPassword));

  if (!isAdmin && (!cleanOwner || cleanOwner.length < 10)) {
    return NextResponse.json(
      { ok: false, error: 'owner-phone-required', message: 'Owner phone verification required' },
      { status: 401 }
    );
  }

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'tuition-stats');
      externalUrl.searchParams.set('code', code);
      if (cleanOwner) externalUrl.searchParams.set('ownerPhone', cleanOwner);
      if (adminPhone) externalUrl.searchParams.set('adminPhone', adminPhone);
      if (adminPassword) externalUrl.searchParams.set('adminPassword', adminPassword);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), {
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn('Apps Script tuition-stats fetch failed, falling back to mock store', e);
    }
  }

  const result = getMockTuitionStats(code, cleanOwner, isAdmin);
  if (!result.ok) {
    const status = result.error === 'unauthorized-cross-tuition-denied' ? 403 : 404;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
