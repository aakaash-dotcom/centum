import { NextResponse } from 'next/server';
import { getMockTuition } from '@/lib/server-mock-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawCode = searchParams.get('code') || '';
  const code = rawCode.trim().toUpperCase();

  if (!code) {
    return NextResponse.json(
      { ok: false, valid: false, error: 'code-required' },
      { status: 400 }
    );
  }

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'classroom-info');
      externalUrl.searchParams.set('code', code);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), {
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn('Apps Script classroom-info fetch failed, falling back to mock store', e);
    }
  }

  // Fallback to local server mock store
  const mockTuition = getMockTuition(code);
  if (!mockTuition) {
    return NextResponse.json(
      { ok: false, valid: false, error: 'tuition-not-found' },
      { status: 404 }
    );
  }

  if (!mockTuition.active) {
    return NextResponse.json(
      { ok: false, valid: false, error: 'tuition-inactive', tuitionName: mockTuition.tuitionName },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    valid: true,
    tuition: {
      code: mockTuition.code,
      tuitionName: mockTuition.tuitionName,
      ownerName: mockTuition.ownerName,
      district: mockTuition.district || '',
      mode: mockTuition.mode || 'coupon',
      discountPercent: mockTuition.discountPercent || 0,
      seatsTotal: mockTuition.seatsTotal || 0,
      active: true,
    },
    source: 'mock',
  });
}
