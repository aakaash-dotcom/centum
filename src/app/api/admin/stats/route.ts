import { NextResponse } from 'next/server';
import { verifyMockAdmin, getMockStats } from '@/lib/server-mock-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminPhone, adminPassword } = body || {};

    if (!adminPhone || !adminPassword) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    if (scriptUrl && secretKey) {
      try {
        const externalUrl = new URL(scriptUrl);
        externalUrl.searchParams.set('action', 'stats');
        externalUrl.searchParams.set('phone', adminPhone);
        externalUrl.searchParams.set('password', adminPassword);
        externalUrl.searchParams.set('key', secretKey);

        const res = await fetch(externalUrl.toString(), {
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            return NextResponse.json({
              ok: true,
              stats: data.stats || {
                studentsTotal: data.studentsTotal ?? 0,
                proTotal: data.proTotal ?? 0,
                liveTotal: data.liveTotal ?? 0,
                testsTaken: data.testsTaken ?? 0,
                revenueTotal: data.revenueTotal ?? 0,
                revenueThisMonth: data.revenueThisMonth ?? 0,
                paymentsCount: data.paymentsCount ?? 0,
                couponsUsed: data.couponsUsed ?? 0,
              },
            });
          }
          if (data.error === 'Unauthorized' || !data.ok) {
            return NextResponse.json(
              { ok: false, error: 'Unauthorized' },
              { status: 403 }
            );
          }
        }
      } catch (err) {
        // Fall back to local mock store
      }
    }

    // Local Mock verification
    const isValid = verifyMockAdmin(adminPhone, adminPassword);
    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      stats: getMockStats(),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 403 }
    );
  }
}
