import { NextResponse } from 'next/server';
import { verifyMockAdmin, getMockFounderStats } from '@/lib/server-mock-store';
import { normalizePhone } from '@/lib/phone';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPhone = searchParams.get('adminPhone') || searchParams.get('phone') || '';
  const adminPassword = (searchParams.get('adminPassword') || searchParams.get('password') || '').trim();
  const adminPhone = normalizePhone(rawPhone) || rawPhone;

  if (!adminPhone || !adminPassword) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 403, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'founderStats');
      externalUrl.searchParams.set('adminPhone', adminPhone);
      externalUrl.searchParams.set('adminPassword', adminPassword);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn('Apps Script founderStats GET failed, falling back to mock store', e);
    }
  }

  if (!verifyMockAdmin(adminPhone, adminPassword)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid admin credentials' },
      { status: 403, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  return NextResponse.json(getMockFounderStats(), {
    headers: { 'Cache-Control': 'private, no-store', 'x-data-source': 'mock' },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = body.adminPhone || body.phone || '';
    const adminPassword = (body.adminPassword || body.password || '').trim();
    const adminPhone = normalizePhone(rawPhone) || rawPhone;

    if (!adminPhone || !adminPassword) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    if (scriptUrl && secretKey) {
      try {
        const externalUrl = new URL(scriptUrl);
        externalUrl.searchParams.set('action', 'founderStats');
        externalUrl.searchParams.set('adminPhone', adminPhone);
        externalUrl.searchParams.set('adminPassword', adminPassword);
        externalUrl.searchParams.set('key', secretKey);

        const res = await fetch(externalUrl.toString(), { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
      } catch (e) {
        console.warn('Apps Script founderStats POST failed, falling back to mock store', e);
      }
    }

    if (!verifyMockAdmin(adminPhone, adminPassword)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid admin credentials' },
        { status: 403, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    return NextResponse.json(getMockFounderStats(), {
      headers: { 'Cache-Control': 'private, no-store', 'x-data-source': 'mock' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
