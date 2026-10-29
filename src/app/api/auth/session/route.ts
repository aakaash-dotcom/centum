import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('centum_session')?.value;

    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'no-session' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const payload = verifySessionToken(token);
    if (!payload || !payload.student) {
      return NextResponse.json(
        { ok: false, error: 'invalid-session' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const s = payload.student as any;
    const student = {
      ...s,
      name: String(s.name || 'Student'),
      phone: s.phone != null ? String(s.phone) : '',
      standard: String(s.standard || '10th'),
      medium: String(s.medium || 'english'),
      district: s.district != null ? String(s.district) : '',
      stream: s.stream != null ? String(s.stream) : undefined,
      plan: String(s.plan || 'free'),
      isAdmin: Boolean(s.isAdmin),
    };

    return NextResponse.json(
      { ok: true, student },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'session-error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
