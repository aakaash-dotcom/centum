import { NextResponse } from 'next/server';
import { verifyMockAdmin, getMockStudents } from '@/lib/server-mock-store';
import { normalizePhone } from '@/lib/phone';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminPhone: rawPhone, adminPassword: rawPassword } = body || {};
    const adminPhone = normalizePhone(rawPhone) || rawPhone;
    const adminPassword = (rawPassword || '').trim();

    if (!adminPhone || !adminPassword) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        {
          status: 403,
          headers: { 'Cache-Control': 'private, no-store' },
        }
      );
    }

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    if (scriptUrl && secretKey) {
      try {
        const externalUrl = new URL(scriptUrl);
        externalUrl.searchParams.set('action', 'adminstudents');
        externalUrl.searchParams.set('phone', adminPhone);
        externalUrl.searchParams.set('password', adminPassword);
        externalUrl.searchParams.set('key', secretKey);

        const res = await fetch(externalUrl.toString(), {
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            // Ensure any returned students have masked phone numbers
            const sanitizedStudents = (data.students || []).map((s: Record<string, unknown>) => {
              const rawPhone = String(s.phone || '');
              const masked =
                rawPhone.startsWith('xxxxx')
                  ? rawPhone
                  : rawPhone.length >= 10
                  ? 'xxxxx' + rawPhone.slice(-4)
                  : 'xxxxx';
              return {
                joined: s.joined || s.timestamp || 'Recent',
                name: s.name,
                phone: masked,
                standard: s.standard,
                stream: s.stream || '—',
                medium: s.medium || 'english',
                plan: s.plan || 'free',
              };
            });

            return NextResponse.json(
              {
                ok: true,
                students: sanitizedStudents,
                source: 'live',
              },
              {
                headers: {
                  'Cache-Control': 'private, no-store',
                  'x-data-source': 'live',
                },
              }
            );
          }
          if (data.error === 'Unauthorized' || !data.ok) {
            return NextResponse.json(
              { ok: false, error: 'Unauthorized' },
              {
                status: 403,
                headers: {
                  'Cache-Control': 'private, no-store',
                  'x-data-source': 'live',
                },
              }
            );
          }
        }

        return NextResponse.json(
          {
            ok: false,
            error: 'backend-unreachable',
            source: 'live-failed',
          },
          {
            status: 503,
            headers: {
              'Cache-Control': 'private, no-store',
              'x-data-source': 'live-failed',
            },
          }
        );
      } catch (err) {
        console.warn('Apps Script admin students fetch failed', err);
        return NextResponse.json(
          {
            ok: false,
            error: 'backend-unreachable',
            source: 'live-failed',
          },
          {
            status: 503,
            headers: {
              'Cache-Control': 'private, no-store',
              'x-data-source': 'live-failed',
            },
          }
        );
      }
    }

    // Local Mock verification ONLY when env vars are missing entirely (dev only)
    const isValid = verifyMockAdmin(adminPhone, adminPassword);
    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        {
          status: 403,
          headers: {
            'Cache-Control': 'private, no-store',
            'x-data-source': 'mock',
          },
        }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        students: getMockStudents(),
        source: 'mock-fallback',
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
          'x-data-source': 'mock',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      {
        status: 403,
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  }
}
