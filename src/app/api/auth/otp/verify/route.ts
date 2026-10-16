import { NextResponse } from 'next/server';
import {
  normalizeOtpPhone,
  isDemoPhone,
  DEMO_OTP,
  hashCode,
  getLatestUnusedOtp,
  updateOtpRecord,
} from '@/lib/otp-store';
import { createSessionToken } from '@/lib/session';
import { normClass, normMedium, normPlan } from '@/app/api/papers/route';

export const dynamic = 'force-dynamic';

async function fetchStudentFromSheet(phone: string): Promise<any | null> {
  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;
  const phone10 = phone.slice(-10);

  if (scriptUrl && secretKey) {
    try {
      const rowsUrl = new URL(scriptUrl);
      rowsUrl.searchParams.set('action', 'ops-rows');
      rowsUrl.searchParams.set('tab', 'Students');
      rowsUrl.searchParams.set('key', secretKey);

      const res = await fetch(rowsUrl.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.rows)) {
          // Search backwards for the latest record matching phone
          for (let i = data.rows.length - 1; i >= 0; i--) {
            const s = data.rows[i];
            const sPhone = String(s.phone || '').replace(/\D/g, '');
            if (sPhone === phone || sPhone === phone10 || sPhone.endsWith(phone10)) {
              return {
                name: s.name || 'Student',
                phone: s.phone || phone10,
                district: s.district || '',
                standard: normClass(s.standard || '10th'),
                stream: s.stream || '',
                medium: normMedium(s.medium || 'english'),
                plan: normPlan(s.plan || 'free'),
                password: s.password || '',
                isAdmin: Boolean(s.isAdmin),
              };
            }
          }
        }
      }
    } catch (err) {
      console.warn('[fetchStudentFromSheet] Error fetching from sheet:', err);
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawPhone = body?.phone || body?.mobile;
    const rawCode = body?.code || body?.otp;

    if (!rawPhone || !rawCode) {
      return NextResponse.json(
        { ok: false, error: 'Phone and code are required' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const phone = normalizeOtpPhone(rawPhone);
    const code = String(rawCode).trim();
    const phone10 = phone.slice(-10);

    // 1. Check Demo Accounts: fixed OTP 4321 (and legacy DEMO10 password support)
    const isDemo = isDemoPhone(phone);
    if (isDemo) {
      if (code === DEMO_OTP || code === 'DEMO10') {
        const isC12 = phone10 === '9840123456';
        const demoStudent = {
          name: isC12 ? 'Demo Student 12' : 'Demo Student 10',
          phone: phone10,
          district: 'Chennai',
          standard: isC12 ? '12th' : '10th',
          stream: isC12 ? 'Science — Biology' : '',
          medium: 'english',
          plan: isC12 ? 'pro' : 'free',
          isAdmin: false,
        };

        const sessionToken = createSessionToken(demoStudent);
        const response = NextResponse.json(
          { ok: true, student: demoStudent },
          { headers: { 'Cache-Control': 'no-store' } }
        );

        // 1-year httpOnly cookie
        response.cookies.set('centum_session', sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 365 * 24 * 60 * 60,
          path: '/',
        });

        // Client readable plan cookie
        response.cookies.set('centum_plan', demoStudent.plan, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 365 * 24 * 60 * 60,
          path: '/',
        });

        return response;
      } else {
        return NextResponse.json(
          { ok: false, error: 'Invalid verification code' },
          { status: 400, headers: { 'Cache-Control': 'no-store' } }
        );
      }
    }

    // Look up student from Students sheet
    const existingStudent = await fetchStudentFromSheet(phone);

    // Existing password users support: if entered code matches their registered password
    if (existingStudent && existingStudent.password && code === String(existingStudent.password).trim()) {
      const student = {
        name: existingStudent.name || 'Student',
        phone: existingStudent.phone || phone10,
        district: existingStudent.district || '',
        standard: existingStudent.standard || '10th',
        stream: existingStudent.stream || '',
        medium: existingStudent.medium || 'english',
        plan: existingStudent.plan || 'free',
        isAdmin: Boolean(existingStudent.isAdmin),
      };

      const sessionToken = createSessionToken(student);
      const response = NextResponse.json(
        { ok: true, student },
        { headers: { 'Cache-Control': 'no-store' } }
      );

      response.cookies.set('centum_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60,
        path: '/',
      });

      response.cookies.set('centum_plan', student.plan || 'free', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    // 2. Load the newest unused record
    const record = await getLatestUnusedOtp(phone);
    if (!record) {
      return NextResponse.json(
        { ok: false, error: 'No active verification code found. Please request a new code.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Check lock: lock the phone after 5 failures
    if (record.attempts >= 5) {
      return NextResponse.json(
        { ok: false, error: 'Phone locked due to 5 failed attempts. Please request a new code.' },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Check expiration (+5min)
    const now = Date.now();
    const expiresAt = new Date(record.expiresAt).getTime();
    if (now > expiresAt) {
      return NextResponse.json(
        { ok: false, error: 'Verification code has expired. Please request a new code.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // 3. Verify code match
    const inputHash = hashCode(code);
    if (inputHash !== record.codeHash) {
      // attempts++
      const newAttempts = record.attempts + 1;
      await updateOtpRecord(phone, { attempts: newAttempts });

      const remaining = 5 - newAttempts;
      return NextResponse.json(
        {
          ok: false,
          error:
            remaining > 0
              ? `Invalid code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`
              : 'Phone locked due to 5 failed attempts. Please request a new code.',
        },
        { status: remaining > 0 ? 400 : 403, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // On match: set used=TRUE, issue the session
    await updateOtpRecord(phone, { used: true });

    // Look up student from Students sheet
    const student = existingStudent || {
      name: 'Student',
      phone: phone10,
      district: '',
      standard: '10th',
      medium: 'english',
      plan: 'free',
      isAdmin: false,
    };

    const sessionToken = createSessionToken(student);
    const response = NextResponse.json(
      { ok: true, student },
      { headers: { 'Cache-Control': 'no-store' } }
    );

    // httpOnly cookie, ~1 year
    response.cookies.set('centum_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
    });

    response.cookies.set('centum_plan', student.plan || 'free', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Verification failed' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
