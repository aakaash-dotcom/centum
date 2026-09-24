import { NextResponse } from 'next/server';
import { verifyMockAdmin, changeMockAdminPassword } from '@/lib/server-mock-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminPhone, oldPassword, newPassword } = body || {};

    if (!adminPhone || !oldPassword || !newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized or invalid password' },
        { status: 403 }
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
            oldPassword,
            newPassword,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            changeMockAdminPassword(adminPhone, oldPassword, newPassword);
            return NextResponse.json({ ok: true });
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

    // Local Mock password change
    const isValid = verifyMockAdmin(adminPhone, oldPassword);
    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const changed = changeMockAdminPassword(adminPhone, oldPassword, newPassword);
    if (!changed) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 403 }
    );
  }
}
