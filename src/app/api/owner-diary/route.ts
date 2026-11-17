import { NextResponse } from 'next/server';
import {
  getMockOwnerDiary,
  saveMockOwnerDiary,
  deleteMockOwnerDiary,
  getTuitionByCode,
  findMockUser,
} from '@/lib/server-mock-store';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || '';
  const ownerPhone = searchParams.get('ownerPhone') || '';

  if (!code || !ownerPhone) {
    return NextResponse.json({ ok: false, error: 'code-and-ownerPhone-required' }, { status: 400 });
  }

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'ownerDiary');
      externalUrl.searchParams.set('code', code);
      externalUrl.searchParams.set('ownerPhone', ownerPhone);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn('Apps Script ownerDiary GET failed, falling back to mock store', e);
    }
  }

  const result = getMockOwnerDiary(code, ownerPhone);
  return NextResponse.json(result, {
    status: result.ok ? 200 : 403,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || body.type;

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
          if (body.notifyParents !== false && Array.isArray(body.targetPhones)) {
            dispatchDiaryWhatsApp(body).catch((e) => console.warn('Diary WhatsApp error', e));
          }
          return NextResponse.json(data);
        }
      } catch (e) {
        console.warn('Apps Script ownerDiary POST failed, falling back to mock store', e);
      }
    }

    if (action === 'ownerDiaryDelete' || action === 'delete') {
      const result = deleteMockOwnerDiary(body.code, body.ownerPhone, body.id);
      return NextResponse.json(result, { status: result.ok ? 200 : 403 });
    }

    // Default: ownerDiarySave
    const textToSave = body.text || formatDiaryText(body.subjects, body.homework);
    const result = saveMockOwnerDiary(body.code, body.ownerPhone, body.date, body.tag, textToSave);

    // If targeted student phones are provided, dispatch WhatsApp to selected present students' parents
    if (result.ok && body.notifyParents !== false && Array.isArray(body.targetPhones) && body.targetPhones.length > 0) {
      dispatchDiaryWhatsApp(body).catch((e) => console.warn('Diary WhatsApp error', e));
    }

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

function formatDiaryText(
  subjects?: Array<{ subject: string; topic: string }>,
  homework?: string
): string {
  if (Array.isArray(subjects) && subjects.length > 0) {
    const parts = subjects.map((s) => `[${s.subject}] ${s.topic}`);
    if (homework) parts.push(`[HW] ${homework}`);
    return parts.join(' | ');
  }
  return '';
}

async function dispatchDiaryWhatsApp(body: any) {
  const { code, date, targetPhones, subjects, homework, text } = body;
  const tuition = getTuitionByCode(code);
  const tuitionName = tuition?.tuitionName || 'CENTUM Tuition Centre';
  const targetDate = date || new Date().toISOString().slice(0, 10);

  const subjectLines = Array.isArray(subjects) && subjects.length > 0
    ? subjects.map((s: any) => `📚 *${s.subject}*: ${s.topic}`).join('\n')
    : `📝 ${text}`;

  for (const phone of targetPhones) {
    const user = findMockUser(phone);
    const studentName = user?.name || `Student ${phone.slice(-4)}`;

    const message =
      `📖 *CENTUM Tuition Daily Study Log*\n\n` +
      `Dear Parent of *${studentName}*,\n` +
      `Here is what was covered in tuition today (${targetDate}) at *${tuitionName}*:\n\n` +
      `${subjectLines}\n` +
      (homework ? `\n✏️ *Homework/Note*: ${homework}\n` : '') +
      `\nPlease ensure your ward completes the revision tonight. 🌟\n\n_${tuitionName}_`;

    try {
      await sendWhatsAppMessage({
        phone,
        message,
        type: 'text',
      });
    } catch (e) {
      console.warn(`Failed to dispatch diary WhatsApp to ${phone}`, e);
    }
  }
}

