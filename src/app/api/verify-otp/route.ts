import { NextResponse } from 'next/server';
import { formatWhatsAppPhone, verify6DigitOtp } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawPhone = body.phone || body.mobile;
    const rawOtp = body.otp || body.code;

    if (!rawPhone) {
      return NextResponse.json(
        { ok: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!rawOtp) {
      return NextResponse.json(
        { ok: false, error: '6-digit OTP code is required' },
        { status: 400 }
      );
    }

    const phone = formatWhatsAppPhone(rawPhone);
    const cleanOtp = String(rawOtp).trim();

    // TASK 9: Demo-only OTP verify override (fixed OTP 4321)
    const normalized10 = phone.slice(-10);
    if (normalized10 === '9123456780' || normalized10 === '9840123456') {
      if (cleanOtp === '4321') {
        return NextResponse.json({
          ok: true,
          verified: true,
          isDemo: true,
          phone: `+${phone}`,
          verifiedAt: new Date().toISOString(),
          message: 'Demo OTP verified successfully',
        });
      } else {
        return NextResponse.json(
          { ok: false, verified: false, error: 'Invalid verification code' },
          { status: 400 }
        );
      }
    }

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json(
        { ok: false, error: 'OTP must be exactly 6 digits' },
        { status: 400 }
      );
    }

    const result = verify6DigitOtp(phone, cleanOtp);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, verified: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      verified: true,
      phone: `+${phone}`,
      verifiedAt: new Date().toISOString(),
      message: 'OTP verified successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Internal server error verifying OTP' },
      { status: 500 }
    );
  }
}
