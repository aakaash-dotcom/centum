import { NextResponse } from 'next/server';
import { verifyMockAdmin, changeMockAdminPassword } from '@/lib/server-mock-store';
import { normalizePhone } from '@/lib/phone';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminPhone: rawPhone, oldPassword, newPassword } = body || {};
    const adminPhone = normalizePhone(rawPhone) || (typeof rawPhone === 'string' ? rawPhone.trim() : '');
    const cleanOldPassword = typeof oldPassword === 'string' ? oldPassword.trim() : '';
    const cleanNewPassword = typeof newPassword === 'string' ? newPassword.trim() : '';

    if (!adminPhone || !cleanOldPassword || !cleanNewPassword || cleanNewPassword.length < 6) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized or invalid password' },
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
        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'admin-password',
            key: secretKey,
            adminPhone,
            oldPassword: cleanOldPassword,
            newPassword: cleanNewPassword,
          }),
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            changeMockAdminPassword(adminPhone, cleanOldPassword, cleanNewPassword);
            return NextResponse.json(
              { ok: true },
              { headers: { 'Cache-Control': 'private, no-store' } }
            );
          }
          if (data.error === 'Unauthorized' || !data.ok) {
            return NextResponse.json(
              { ok: false, error: 'Unauthorized' },
              {
                status: 403,
                headers: { 'Cache-Control': 'private, no-store' },
              }
            );
          }
        }
        return NextResponse.json(
          { ok: false, error: 'backend-unreachable', source: 'live-failed' },
          {
            status: 503,
            headers: {
              'Cache-Control': 'private, no-store',
              'x-data-source': 'live-failed',
            },
          }
        );
      } catch (err) {
        return NextResponse.json(
          { ok: false, error: 'backend-unreachable', source: 'live-failed' },
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

    // Local Mock password change (only if env vars not configured)
    const isValid = verifyMockAdmin(adminPhone, cleanOldPassword);
    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        {
          status: 403,
          headers: { 'Cache-Control': 'private, no-store' },
        }
      );
    }

    const changed = changeMockAdminPassword(adminPhone, cleanOldPassword, cleanNewPassword);
    if (!changed) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        {
          status: 403,
          headers: { 'Cache-Control': 'private, no-store' },
        }
      );
    }

    return NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'private, no-store' } }
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
