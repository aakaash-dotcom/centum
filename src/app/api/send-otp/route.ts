import { NextResponse } from 'next/server';
import {
  formatWhatsAppPhone,
  generate6DigitOtp,
  sendWhatsAppMessage,
  isOptedOut,
} from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawPhone = body.phone || body.mobile;

    if (!rawPhone) {
      return NextResponse.json(
        { ok: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const phone = formatWhatsAppPhone(rawPhone);
    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { ok: false, error: 'Please provide a valid 10-digit mobile number' },
        { status: 400 }
      );
    }

    // TASK 9: Demo-only OTP override (strictly sandboxed, NO WhatsApp dispatch)
    const normalized10 = phone.slice(-10);
    if (normalized10 === '9123456780' || normalized10 === '9840123456') {
      return NextResponse.json({
        ok: true,
        status: 'demo',
        demoOtp: '4321',
        expiresInSeconds: 300,
        recipient: `+${phone}`,
        message: 'Demo account OTP: 4321 (no WhatsApp dispatch)',
      });
    }

    if (isOptedOut(phone)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'This number has previously opted out of WhatsApp updates. Send START or contact support to re-enable.',
        },
        { status: 403 }
      );
    }

    // Generate 6-digit OTP with 5-minute TTL
    const { otp, expiresInSeconds } = generate6DigitOtp(phone);

    const otpMessage = `⚡ CENTUM Verification Code: *${otp}*\n\nYour one-time security code is valid for 5 minutes. Do not share this code with anyone.\n\nஉங்கள் சென்டம் சரிபார்ப்புக் குறியீடு: *${otp}* (5 நிமிடங்களுக்கு மட்டுமே செல்லுபடியாகும்).`;

    const sendRes = await sendWhatsAppMessage({
      phone,
      message: otpMessage,
      type: 'text',
    });

    if (!sendRes.ok && sendRes.status === 'failed') {
      return NextResponse.json(
        {
          ok: false,
          error: sendRes.error || 'Failed to deliver OTP via WhatsApp gateway',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      status: sendRes.status,
      messageId: sendRes.messageId,
      expiresInSeconds,
      recipient: `+${sendRes.recipient}`,
      message: 'OTP dispatched successfully via WhatsApp',
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Internal server error processing OTP' },
      { status: 500 }
    );
  }
}
