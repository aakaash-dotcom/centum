import { NextResponse } from 'next/server';
import { registerMockUser, joinMockTuition } from '@/lib/server-mock-store';
import { normalizePhone } from '@/lib/phone';
import { recordOptIn } from '@/lib/whatsapp';
import { normClass, resolveCanonicalMedium } from '@/app/api/papers/route';

export const dynamic = 'force-dynamic';

const VALID_CLASSES = new Set([6, 7, 8, 9, 10, 11, 12]);

export async function purgeBlankStudentRows(): Promise<{ found: number; cleaned: number }> {
  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;
  if (!scriptUrl || !secretKey) return { found: 0, cleaned: 0 };

  try {
    const rowsUrl = new URL(scriptUrl);
    rowsUrl.searchParams.set('action', 'ops-rows');
    rowsUrl.searchParams.set('tab', 'Students');
    rowsUrl.searchParams.set('key', secretKey);

    const res = await fetch(rowsUrl.toString(), { cache: 'no-store' });
    if (!res.ok) return { found: 0, cleaned: 0 };
    const data = await res.json();
    if (!data || !data.ok || !Array.isArray(data.rows)) return { found: 0, cleaned: 0 };

    const rows = data.rows;
    let found = 0;
    let cleaned = 0;

    // Check for blank or undefined rows
    const blankPhones = new Set<string>();
    for (const r of rows) {
      const name = String(r.name ?? '').trim();
      const phone = String(r.phone ?? '').trim();
      if (!name || name === 'undefined' || !phone || phone === 'undefined' || phone === 'null') {
        found++;
        blankPhones.add(phone);
      }
    }

    if (found > 0) {
      for (const badPhone of blankPhones) {
        const delUrl = new URL(scriptUrl);
        delUrl.searchParams.set('action', 'ops-delete');
        delUrl.searchParams.set('tab', 'Students');
        delUrl.searchParams.set('col', 'phone');
        delUrl.searchParams.set('value', badPhone);
        delUrl.searchParams.set('all', '1');
        delUrl.searchParams.set('key', secretKey);

        const delRes = await fetch(delUrl.toString(), { cache: 'no-store' });
        if (delRes.ok) {
          const delData = await delRes.json();
          cleaned += Number(delData.deleted) || 0;
        }
      }
    }

    return { found, cleaned };
  } catch (err) {
    console.warn('[purgeBlankStudentRows] Error cleaning blank rows:', err);
    return { found: 0, cleaned: 0 };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('clean') === '1' || searchParams.get('action') === 'clean') {
    const result = await purgeBlankStudentRows();
    return NextResponse.json({ ok: true, ...result });
  }

  return NextResponse.json({ ok: true, status: 'ready' });
}

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Empty or invalid request body' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Request body cannot be empty' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const {
      name: rawName,
      phone: rawPhone,
      classLevel: rawClassLevel,
      standard: rawStandard,
      medium: rawMedium,
      stream: rawStream,
      district: rawDistrict,
      password: rawPassword,
      type = 'student',
      plan = 'free',
      refCode,
      tuitionCode,
      source,
      waOptIn,
    } = body;

    // 1. Validate Name
    const name = String(rawName || '').trim();
    if (!name || name.length < 2) {
      return NextResponse.json(
        { ok: false, error: 'Valid student name is required (minimum 2 characters)' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // 2. Validate Phone
    const cleanPhone = normalizePhone(rawPhone);
    const phoneDigits = String(rawPhone || '').replace(/\D/g, '');
    if (!cleanPhone || phoneDigits.length < 10) {
      return NextResponse.json(
        { ok: false, error: 'Valid 10-digit mobile phone number is required' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // 3. Validate Class
    const classInput = rawClassLevel || rawStandard;
    const classDigits = parseInt(String(classInput || '').replace(/\D/g, ''), 10);
    if (!VALID_CLASSES.has(classDigits)) {
      return NextResponse.json(
        { ok: false, error: 'Unknown class level. Class must be between 6th and 12th' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    const standard = `${classDigits}th`;

    // 4. Validate Medium
    const canonMedium = resolveCanonicalMedium(rawMedium);
    if (!canonMedium) {
      return NextResponse.json(
        { ok: false, error: 'Medium must be either English or Tamil' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    const medium = canonMedium;

    // 5. Validate Stream (required for 11th and 12th, ignored below that)
    let stream = '';
    if (classDigits === 11 || classDigits === 12) {
      const cleanStream = String(rawStream || '').trim();
      if (!cleanStream) {
        return NextResponse.json(
          { ok: false, error: 'Stream is required for class 11 and 12 (e.g. Science — Maths, Commerce, Arts)' },
          { status: 400, headers: { 'Cache-Control': 'no-store' } }
        );
      }
      stream = cleanStream;
    }

    // Optional fields
    const district = String(rawDistrict || 'Chennai').trim();
    const cleanPassword = typeof rawPassword === 'string' ? rawPassword.trim() : '';
    const cleanTuitionCode = (tuitionCode || '').trim().toUpperCase();
    const referralSource = cleanTuitionCode
      ? `tuition:${cleanTuitionCode}`
      : refCode
      ? `ref:${refCode}`
      : source || 'app';

    if (waOptIn !== false) {
      recordOptIn(cleanPhone);
    }

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    if (scriptUrl && secretKey) {
      try {
        const payload = {
          type: 'student',
          key: secretKey,
          name,
          phone: cleanPhone,
          district,
          standard,
          stream,
          medium,
          password: cleanPassword,
          tuitionCode: cleanTuitionCode || undefined,
          source: referralSource,
          ref: refCode || '',
          plan,
        };

        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          cache: 'no-store',
        });

        if (res.ok) {
          const resData = await res.json();
          registerMockUser({
            phone: cleanPhone,
            name,
            district,
            standard,
            stream,
            medium,
            password: cleanPassword,
          });
          if (cleanTuitionCode) {
            joinMockTuition(cleanPhone, cleanTuitionCode);
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
        console.warn('Apps Script registration failed, falling back to local store', err);
      }
    }

    // Local Mock Store registration
    registerMockUser({
      phone: cleanPhone,
      name,
      district,
      standard,
      stream,
      medium,
      password: cleanPassword,
    });
    if (cleanTuitionCode) {
      joinMockTuition(cleanPhone, cleanTuitionCode);
    }

    return NextResponse.json(
      {
        ok: true,
        registered: true,
        source: 'mock-fallback',
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
          'x-data-source': 'mock',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Registration failed' },
      {
        status: 400,
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  }
}
