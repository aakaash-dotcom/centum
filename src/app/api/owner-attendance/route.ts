import { NextResponse } from 'next/server';
import {
  getMockOwnerAttendance,
  saveMockOwnerAttendance,
  getTuitionByCode,
  findMockUser,
} from '@/lib/server-mock-store';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || '';
  const ownerPhone = searchParams.get('ownerPhone') || '';
  const date = searchParams.get('date') || '';

  if (!code || !ownerPhone) {
    return NextResponse.json({ ok: false, error: 'code-and-ownerPhone-required' }, { status: 400 });
  }

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'ownerAttendance');
      externalUrl.searchParams.set('code', code);
      externalUrl.searchParams.set('ownerPhone', ownerPhone);
      if (date) externalUrl.searchParams.set('date', date);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn('Apps Script ownerAttendance GET failed, falling back to mock store', e);
    }
  }

  const result = getMockOwnerAttendance(code, ownerPhone, date);
  return NextResponse.json(result, {
    status: result.ok ? 200 : 403,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    if (scriptUrl && secretKey) {
      try {
        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, key: secretKey }),
        });
        if (res.ok) {
          const data = await res.json();
          // Also trigger notifications if requested
          if (body.notifyParents !== false && Array.isArray(body.records)) {
            dispatchAttendanceAlerts(body.code, body.date, body.records).catch((e) =>
              console.warn('Attendance WhatsApp notification error', e)
            );
          }
          return NextResponse.json(data);
        }
      } catch (e) {
        console.warn('Apps Script ownerAttendance POST failed, falling back to mock store', e);
      }
    }

    const result = saveMockOwnerAttendance(body.code, body.ownerPhone, body.date, body.records || []);

    // Dispatch WhatsApp notifications to parents
    if (result.ok && body.notifyParents !== false && Array.isArray(body.records)) {
      dispatchAttendanceAlerts(body.code, body.date, body.records).catch((e) =>
        console.warn('Attendance WhatsApp notification error', e)
      );
    }

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

async function dispatchAttendanceAlerts(
  code: string,
  date: string,
  records: Array<{ phone: string; status: 'P' | 'A'; note?: string }>
) {
  const tuition = getTuitionByCode(code);
  const tuitionName = tuition?.tuitionName || 'CENTUM Tuition Centre';
  const targetDate = date || new Date().toISOString().slice(0, 10);

  for (const record of records) {
    const user = findMockUser(record.phone);
    const studentName = user?.name || `Student ${record.phone.slice(-4)}`;

    let message = '';
    if (record.status === 'P') {
      message =
        `✅ *CENTUM Tuition Attendance Update*\n\n` +
        `Dear Parent, your ward *${studentName}* was marked *PRESENT* today (${targetDate}) at *${tuitionName}*.\n\n` +
        `Keep up the regular attendance for great board results! 🌟\n\n_${tuitionName}_`;
    } else {
      message =
        `⚠️ *CENTUM Tuition Attendance Alert*\n\n` +
        `Dear Parent, your ward *${studentName}* was marked *ABSENT* today (${targetDate}) at *${tuitionName}*.\n\n` +
        `Please ensure regular attendance for consistent academic progress. 🙏\n\n_${tuitionName}_`;
    }

    try {
      await sendWhatsAppMessage({
        phone: record.phone,
        message,
        type: 'text',
      });
    } catch (e) {
      console.warn(`Failed to dispatch attendance WhatsApp to ${record.phone}`, e);
    }
  }
}

