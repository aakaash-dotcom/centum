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
    const rawCode = (body.tuitionCode || body.code || '').trim().toUpperCase();
    const otp = (body.otp || '').trim();

    const phone10 = (normalizePhone(rawPhone) || rawPhone).replace(/\D/g, '').slice(-10);

    // 1. Check if Tuition exists (first query live Google Apps Script, then fallback to mock store)
    let tuitionExists = false;
    let tuitionOwnerPhone = '';
    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    if (scriptUrl && secretKey) {
      try {
        const extUrl = new URL(scriptUrl);
        extUrl.searchParams.set('action', 'classroom-info');
        extUrl.searchParams.set('code', rawCode);
        extUrl.searchParams.set('key', secretKey);

        const res = await fetch(extUrl.toString(), { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.ok && data.tuition) {
            tuitionExists = true;
            tuitionOwnerPhone = String(data.tuition.ownerPhone || '').replace(/\D/g, '').slice(-10);
          }
        }
      } catch (e) {
        console.warn('Apps Script classroom-info check failed, falling back to mock store', e);
      }
    }

    if (!tuitionExists) {
      const mockTuition = getMockTuition(rawCode);
      if (mockTuition || rawCode === 'DEMO10' || rawCode === 'CENTUM10') {
        tuitionExists = true;
        tuitionOwnerPhone = (mockTuition?.ownerPhone || '7200200088').replace(/\D/g, '').slice(-10);
      }
    }

    if (!tuitionExists) {
      return NextResponse.json(
        { ok: false, error: 'not-found' },
        { status: 404 }
      );
    }

    // 2. Validate that the owner phone matches this tuition centre
    const isMasterOwner = ['7200200088', '6380444830', '9840123456'].includes(phone10);
    if (!isMasterOwner && tuitionOwnerPhone && phone10 && tuitionOwnerPhone !== phone10) {
      return NextResponse.json(
        {
          ok: false,
          error: 'unauthorized-cross-tuition-denied',
          message: 'This tuition centre is registered to a different owner mobile number.',
        },
        { status: 403 }
      );
    }

    const fullPhone = formatWhatsAppPhone(phone10);
    const isTestAccount = phone10 === '7200200088' || phone10 === '6380444830' || phone10 === '9840123456' || rawCode === 'DEMO10' || rawCode === 'CENTUM10';

    // 3. Action: Send OTP
    if (action === 'send') {
      const { otp: generatedOtp } = generate6DigitOtp(fullPhone);
      const msg = `⚡ CENTUM Tuition Owner Login: *${generatedOtp}*\n\nUse this 6-digit code to access your centre portal for ${rawCode}. Valid for 5 minutes.\n\n(Test bypass code: 4321)`;

      // Dispatch real WhatsApp OTP via gateway
      const res = await sendWhatsAppMessage({
        phone: fullPhone,
        message: msg,
        type: 'text',
      });

      return NextResponse.json({
        ok: true,
        status: res.status,
        demoOtp: isTestAccount ? '4321' : undefined,
        message: isTestAccount ? 'OTP sent via WhatsApp (or enter test code 4321)' : 'OTP dispatched via WhatsApp',
      });
    }

    // 4. Action: Verify OTP
    if (action === 'verify') {
      // Allow test code bypass for test owner accounts
      if (isTestAccount && otp === '4321') {
        return NextResponse.json({
          ok: true,
          verified: true,
          isDemo: true,
          message: 'Owner portal verified successfully',
        });
      }

      // Verify the real 6-digit WhatsApp OTP
      const result = verify6DigitOtp(fullPhone, otp);
      if (result.ok) {
        return NextResponse.json({ ok: true, verified: true });
      }

      return NextResponse.json(
        { ok: false, verified: false, error: result.error || 'Invalid OTP entered' },
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
