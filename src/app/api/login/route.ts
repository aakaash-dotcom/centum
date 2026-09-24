import { NextResponse } from 'next/server';
import {
  findMockUser,
  setMockUserPassword,
} from '@/lib/server-mock-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone')?.trim() || '';
    const password = searchParams.get('password') || '';

    if (!phone || !password) {
      return NextResponse.json(
        { ok: false, error: 'phone and password are required' },
        { status: 400 }
      );
    }

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    if (scriptUrl && secretKey) {
      try {
        const externalUrl = new URL(scriptUrl);
        externalUrl.searchParams.set('action', 'login');
        externalUrl.searchParams.set('phone', phone);
        externalUrl.searchParams.set('password', password);
        externalUrl.searchParams.set('key', secretKey);

        const res = await fetch(externalUrl.toString(), {
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            const studentData = data.student || {
              name: data.name,
              phone: data.phone || phone,
              district: data.district,
              standard: data.standard,
              stream: data.stream,
              medium: data.medium || 'english',
              plan: data.plan || 'free',
              isAdmin: Boolean(data.isAdmin),
            };
            return NextResponse.json({ ok: true, student: studentData });
          }

          // Return specific error from backend: no-account, needs-password-setup, wrong-password
          return NextResponse.json({
            ok: false,
            error: data.error || 'wrong-password',
          });
        }
      } catch (err) {
        // Fall back to local mock store when Apps Script network request fails
      }
    }

    // Local Mock Store validation
    const mockUser = findMockUser(phone);
    if (!mockUser) {
      return NextResponse.json({ ok: false, error: 'no-account' });
    }

    if (mockUser.password === null) {
      return NextResponse.json({ ok: false, error: 'needs-password-setup' });
    }

    if (mockUser.password !== password) {
      return NextResponse.json({ ok: false, error: 'wrong-password' });
    }

    return NextResponse.json({
      ok: true,
      student: {
        name: mockUser.name,
        phone: mockUser.phone,
        district: mockUser.district,
        standard: mockUser.standard,
        stream: mockUser.stream,
        medium: mockUser.medium,
        plan: mockUser.plan,
        isAdmin: Boolean(mockUser.isAdmin),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'login-failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, phone, password } = body;

    if (type !== 'set-password') {
      return NextResponse.json(
        { ok: false, error: 'Unsupported type' },
        { status: 400 }
      );
    }

    if (!phone || !password || password.length < 6) {
      return NextResponse.json(
        { ok: false, error: 'invalid-password' },
        { status: 400 }
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
            type: 'set-password',
            key: secretKey,
            phone,
            password,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            setMockUserPassword(phone, password);
            return NextResponse.json({ ok: true });
          }
        }
      } catch (err) {
        // Fall back to local mock store
      }
    }

    // Local Mock Store set password
    const success = setMockUserPassword(phone, password);
    if (!success) {
      return NextResponse.json(
        { ok: false, error: 'no-account' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'set-password-failed' },
      { status: 500 }
    );
  }
}
