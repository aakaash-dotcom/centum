import { NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/phone';
import { getMockTuition } from '@/lib/server-mock-store';
import { formatWhatsAppPhone, generate6DigitOtp, verify6DigitOtp, sendWhatsAppMessage } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'send';
    const rawPhone = body.phone || body.mobile || '';
    const rawCode = (body.tuitionCode || '').trim().toUpperCase();
    const otp = (body.otp || '').trim();

    const phone10 = (normalizePhone(rawPhone) || rawPhone).replace(/\D/g, '').slice(-10);

    // 1. DEMO OWNER OVERRIDE (TASK 9)
    // If phone is 9840123456 and code is DEMO10, accept 4321 with NO real dispatch
    if (phone10 === '9840123456' || rawCode === 'DEMO10') {
      if (action === 'send') {
        return NextResponse.json({
          ok: true,
          status: 'demo',
          demoOtp: '4321',
          message: 'Demo owner OTP: 4321 (no WhatsApp dispatch)',
        });
      }

      if (action === 'verify') {
        if (otp === '4321') {
          return NextResponse.json({
            ok: true,
            verified: true,
            isDemo: true,
            message: 'Owner portal verified successfully',
          });
        }
        return NextResponse.json(
          { ok: false, verified: false, error: 'Invalid OTP entered' },
          { status: 400 }
        );
      }
    }

    // 2. Real Tuition Owner check against live or mock store
    const tuition = getMockTuition(rawCode);
    if (!tuition && rawCode !== 'DEMO10') {
      return NextResponse.json(
        { ok: false, error: 'not-found' },
        { status: 404 }
      );
    }

    const fullPhone = formatWhatsAppPhone(phone10);

    if (action === 'send') {
      const { otp: generatedOtp } = generate6DigitOtp(fullPhone);
      const msg = `⚡ CENTUM Tuition Owner Login: *${generatedOtp}*\n\nUse this 6-digit code to access your centre portal for ${rawCode}. Valid for 5 minutes.`;
      const res = await sendWhatsAppMessage({
        phone: fullPhone,
        message: msg,
        type: 'text',
      });
      return NextResponse.json({
        ok: true,
        status: res.status,
        message: 'OTP dispatched',
      });
    }

    if (action === 'verify') {
      const result = verify6DigitOtp(fullPhone, otp);
      if (result.ok) {
        return NextResponse.json({ ok: true, verified: true });
      }
      return NextResponse.json(
        { ok: false, verified: false, error: result.error || 'Invalid OTP' },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: false, error: 'invalid-action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
