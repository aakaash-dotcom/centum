import { NextResponse } from 'next/server';
import { registerMockUser } from '@/lib/server-mock-store';
import { normalizePhone } from '@/lib/phone';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      phone: rawPhone,
      district,
      standard,
      stream,
      medium,
      password,
      type = 'student',
      plan,
    } = body;

    const phone = normalizePhone(rawPhone) || rawPhone;

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    if (scriptUrl && secretKey) {
      try {
        const payload =
          type === 'waitlist'
            ? {
                type: 'waitlist',
                key: secretKey,
                name: name || '',
                phone: phone || '',
                plan: plan || 'Pro',
              }
            : {
                type: 'student',
                key: secretKey,
                name,
                phone,
                district,
                standard,
                stream,
                medium,
                password, // forwarded to Apps Script
              };

        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const resData = await res.json();
          if (type === 'student' && phone) {
            registerMockUser({
              phone,
              name,
              district,
              standard,
              stream,
              medium,
              password,
            });
          }
          return NextResponse.json({ ok: true, ...resData });
        }
      } catch (err) {
        console.warn('Apps Script registration/waitlist failed, returning local success');
      }
    }

    // Register in local mock store if student
    if (type === 'student' && phone) {
      registerMockUser({
        phone,
        name,
        district,
        standard,
        stream,
        medium,
        password,
      });
    }

    return NextResponse.json({
      ok: true,
      registered: type === 'student',
      waitlist: type === 'waitlist',
      source: 'local_mock',
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Registration failed' },
      { status: 400 }
    );
  }
}
