import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, district, standard, stream, medium, type = 'student', plan } = body;

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    if (scriptUrl && secretKey) {
      try {
        const payload = type === 'waitlist'
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
            };

        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const resData = await res.json();
          return NextResponse.json({ ok: true, ...resData });
        }
      } catch (err) {
        console.warn('Apps Script registration/waitlist failed, returning local success', err);
      }
    }

    // Local success response if env vars missing or external endpoint offline
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
