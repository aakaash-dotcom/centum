import { NextResponse } from 'next/server';
import { registerMockUser, joinMockTuition } from '@/lib/server-mock-store';
import { normalizePhone } from '@/lib/phone';
import { recordOptIn } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

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
      refCode,
      tuitionCode,
      source,
      waOptIn,
    } = body;

    const phone = normalizePhone(rawPhone) || rawPhone;
    if (waOptIn !== false && phone) {
      recordOptIn(phone);
    }
    const cleanPassword = typeof password === 'string' ? password.trim() : password;
    const cleanTuitionCode = (tuitionCode || '').trim().toUpperCase();
    const referralSource = cleanTuitionCode ? `tuition:${cleanTuitionCode}` : (refCode ? `ref:${refCode}` : (source || 'app'));

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
                password: cleanPassword, // forwarded to Apps Script
                tuitionCode: cleanTuitionCode || undefined,
                source: referralSource,
                ref: refCode || '',
              };

        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          cache: 'no-store',
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
              password: cleanPassword,
            });
            if (cleanTuitionCode) {
              joinMockTuition(phone, cleanTuitionCode);
            }
          }
          return NextResponse.json(
            { ok: true, source: 'live', ...resData },
            {
              headers: {
                'Cache-Control': 'private, no-store',
                'x-data-source': 'live',
              },
            }
          );
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
        password: cleanPassword,
      });
      if (cleanTuitionCode) {
        joinMockTuition(phone, cleanTuitionCode);
      }
    }

    return NextResponse.json(
      {
        ok: true,
        registered: type === 'student',
        waitlist: type === 'waitlist',
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
      { ok: false, error: 'Registration failed' },
      {
        status: 400,
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  }
}
