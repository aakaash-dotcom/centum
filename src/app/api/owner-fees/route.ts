import { NextResponse } from 'next/server';
import {
  getMockOwnerFees,
  saveMockOwnerFeeStatus,
  getTuitionByCode,
  findMockUser,
} from '@/lib/server-mock-store';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || '';
  const ownerPhone = searchParams.get('ownerPhone') || searchParams.get('phone') || '';
  const month = searchParams.get('month') || '';

  if (!code || !ownerPhone) {
    return NextResponse.json({ ok: false, error: 'code-and-ownerPhone-required' }, { status: 400 });
  }

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'ownerFees');
      externalUrl.searchParams.set('code', code);
      externalUrl.searchParams.set('ownerPhone', ownerPhone);
      if (month) externalUrl.searchParams.set('month', month);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn('Apps Script ownerFees GET failed, falling back to mock store', e);
    }
  }

  const result = getMockOwnerFees(code, ownerPhone, month);
  return NextResponse.json(result, {
    status: result.ok ? 200 : 403,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || '';

    // Action 1: Send Fee Reminder on WhatsApp to Parent
    if (action === 'sendReminder') {
      const { code, phone, studentName, amount, month, dueDate } = body;
      const tuition = getTuitionByCode(code);
      const tuitionName = tuition?.tuitionName || 'CENTUM Tuition Centre';

      const reminderMessage =
        `🔔 *CENTUM Tuition Fee Reminder*\n\n` +
        `Dear Parent of *${studentName || 'Student'}*,\n` +
        `This is a gentle reminder regarding the tuition fee for *${month || 'this month'}* at *${tuitionName}*.\n\n` +
        `💰 *Amount Due*: ₹${amount || '1,000'}\n` +
        `📅 *Due Date*: ${dueDate || '10th of this month'}\n\n` +
        `Please complete the payment via Cash or UPI at the centre at your earliest convenience. If you have already paid, kindly ignore this alert.\n\n` +
        `Thank you! 🙏\n_${tuitionName}_`;

      const sendRes = await sendWhatsAppMessage({
        phone,
        message: reminderMessage,
        type: 'text',
      });

      return NextResponse.json({
        ok: true,
        sent: sendRes.ok,
        status: sendRes.status,
        recipient: phone,
      });
    }

    // Action 2: Send Payment Receipt on WhatsApp to Parent
    if (action === 'sendReceipt') {
      const { code, phone, studentName, amount, month, paymentMode, date } = body;
      const tuition = getTuitionByCode(code);
      const tuitionName = tuition?.tuitionName || 'CENTUM Tuition Centre';
      const paidDate = date || new Date().toISOString().slice(0, 10);

      const receiptMessage =
        `🧾 *CENTUM Tuition Fee Payment Receipt*\n\n` +
        `Dear Parent of *${studentName || 'Student'}*,\n` +
        `We have received your tuition fee payment for *${month || 'this month'}*.\n\n` +
        `💰 *Amount Paid*: ₹${amount || '1,000'}\n` +
        `💳 *Payment Mode*: ${(paymentMode || 'Cash').toUpperCase()}\n` +
        `📅 *Date*: ${paidDate}\n` +
        `🏫 *Centre*: ${tuitionName}\n\n` +
        `Thank you for the prompt payment and supporting your ward's education! 🌟\n\n_${tuitionName}_`;

      const sendRes = await sendWhatsAppMessage({
        phone,
        message: receiptMessage,
        type: 'text',
      });

      return NextResponse.json({
        ok: true,
        sent: sendRes.ok,
        status: sendRes.status,
        recipient: phone,
      });
    }

    // Action 3: Save Fee Payment Status (Paid / Pending)
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
          return NextResponse.json(data);
        }
      } catch (e) {
        console.warn('Apps Script ownerFees POST failed, falling back to mock store', e);
      }
    }

    const result = saveMockOwnerFeeStatus(
      body.code,
      body.ownerPhone,
      body.id,
      body.status,
      body.paymentMode,
      body.note,
      body.amount
    );

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
