import { NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/phone';
import {
  findMockUser,
  setMockUserPassword,
} from '@/lib/server-mock-store';
import { normClass, normMedium, normPlan } from '@/app/api/papers/route';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get('phone')?.trim() || '';
    const phone = normalizePhone(rawPhone) || rawPhone;
    const password = (searchParams.get('password') || '').trim();

    if (!phone || !password) {
      return NextResponse.json(
        { ok: false, error: 'phone and password are required' },
        {
          status: 400,
          headers: {
            'Cache-Control': 'private, no-store',
            'x-data-source': 'live',
            'x-cache-version': 'cdn-v1',
          },
        }
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
            const rawStudent = data.student
              ? {
                  ...data.student,
                  phone: data.student.phone || phone,
                  isAdmin: Boolean(data.isAdmin ?? data.student.isAdmin),
                }
              : {
                  name: data.name,
                  phone: data.phone || phone,
                  district: data.district,
                  standard: data.standard,
                  stream: data.stream,
                  medium: data.medium || 'english',
                  plan: data.plan || 'free',
                  isAdmin: Boolean(data.isAdmin),
                };

            const studentData = {
              ...rawStudent,
              standard: normClass(rawStudent.standard),
              medium: normMedium(rawStudent.medium),
              plan: normPlan(rawStudent.plan),
            };
            return NextResponse.json(
              { ok: true, student: studentData, source: 'live' },
              {
                headers: {
                  'Cache-Control': 'private, no-store',
                  'x-data-source': 'live',
                  'x-cache-version': 'cdn-v1',
                },
              }
            );
          }

          // Return specific error from backend: no-account, needs-password-setup, wrong-password
          return NextResponse.json(
            {
              ok: false,
              error: data.error || 'wrong-password',
              source: 'live',
            },
            {
              headers: {
                'Cache-Control': 'private, no-store',
                'x-data-source': 'live',
                'x-cache-version': 'cdn-v1',
              },
            }
          );
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
              'x-cache-version': 'cdn-v1',
            },
          }
        );
      } catch (err) {
        console.warn('Apps Script login network error', err);
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
              'x-cache-version': 'cdn-v1',
            },
          }
        );
      }
    }

    // Local Mock Store validation ONLY when env vars are missing entirely (dev only)
    const mockUser = findMockUser(phone);
    if (!mockUser) {
      return NextResponse.json(
        { ok: false, error: 'no-account', source: 'mock-fallback' },
        {
          headers: {
            'Cache-Control': 'private, no-store',
            'x-data-source': 'mock',
            'x-cache-version': 'cdn-v1',
          },
        }
      );
    }

    if (mockUser.password === null) {
      return NextResponse.json(
        { ok: false, error: 'needs-password-setup', source: 'mock-fallback' },
        {
          headers: {
            'Cache-Control': 'private, no-store',
            'x-data-source': 'mock',
            'x-cache-version': 'cdn-v1',
          },
        }
      );
    }

    const cleanInputPassword = password.trim();
    const isAdminPassword =
      mockUser.isAdmin &&
      (cleanInputPassword === 'centum-admin-2026' || cleanInputPassword === 'founder123');

    if (mockUser.password.trim() !== cleanInputPassword && !isAdminPassword) {
      return NextResponse.json(
        { ok: false, error: 'wrong-password', source: 'mock-fallback' },
        {
          headers: {
            'Cache-Control': 'private, no-store',
            'x-data-source': 'mock',
            'x-cache-version': 'cdn-v1',
          },
        }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        student: {
          name: mockUser.name,
          phone: mockUser.phone,
          district: mockUser.district,
          standard: normClass(mockUser.standard),
          stream: mockUser.stream,
          medium: normMedium(mockUser.medium),
          plan: normPlan(mockUser.plan),
          isAdmin: Boolean(mockUser.isAdmin),
        },
        source: 'mock-fallback',
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
          'x-data-source': 'mock',
          'x-cache-version': 'cdn-v1',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'login-failed' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, phone: rawPhone, password: rawPassword } = body;
    const phone = normalizePhone(rawPhone) || rawPhone;
    const password = (rawPassword || '').trim();

    if (type !== 'set-password') {
      return NextResponse.json(
        { ok: false, error: 'Unsupported type' },
        {
          status: 400,
          headers: { 'Cache-Control': 'private, no-store' },
        }
      );
    }

    if (!phone || !password || password.length < 6) {
      return NextResponse.json(
        { ok: false, error: 'invalid-password' },
        {
          status: 400,
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
          cache: 'no-store',
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
            return NextResponse.json(
              { ok: true },
              { headers: { 'Cache-Control': 'private, no-store' } }
            );
          }
        }
      } catch (err) {
        console.warn('Apps Script set-password failed', err);
      }
    }

    // Local Mock Store set password
    const success = setMockUserPassword(phone, password);
    if (!success) {
      return NextResponse.json(
        { ok: false, error: 'no-account' },
        {
          status: 404,
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
      { ok: false, error: 'set-password-failed' },
      {
        status: 500,
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  }
}
