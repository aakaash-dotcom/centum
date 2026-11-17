import { NextResponse } from 'next/server';
import {
  normalizeOtpPhone,
  checkRateLimit,
  recordRateLimitAttempt,
  isDemoPhone,
  DEMO_OTP,
  hashCode,
  saveOtpRecord,
  sendDeropoMessage,
  purgeOldOtpRecords,
} from '@/lib/otp-store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawPhone = body?.phone || body?.mobile;

    if (!rawPhone) {
      // Prompt requirement: "never reveal whether a code was actually sent" -> { ok: true }
      return NextResponse.json(
        { ok: true },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // 1. Normalise to 91XXXXXXXXXX
    const phone = normalizeOtpPhone(rawPhone);
    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { ok: true },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // 2. Rate limit: max 3 per phone per hour, 60s between resends
    const rateCheck = checkRateLimit(phone);
    if (!rateCheck.allowed) {
      // Quietly return { ok: true } without sending
      return NextResponse.json(
        { ok: true },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    recordRateLimitAttempt(phone);

    // 3. Generate 6-digit code
    const isDemo = isDemoPhone(phone);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const codeHash = hashCode(code);
    const now = Date.now();
    const createdAt = new Date(now).toISOString();
    const expiresAt = new Date(now + 5 * 60 * 1000).toISOString(); // +5 min

    // 4. Append to the OTPCodes sheet tab:
    // phone · codeHash · createdAt · expiresAt(+5min) · attempts(0) · used(FALSE)
    await saveOtpRecord({
      phone,
      codeHash,
      createdAt,
      expiresAt,
      attempts: 0,
      used: 'FALSE',
    });

    // Clean expired rows >24h on every send
    purgeOldOtpRecords().catch(() => {});

    // 5. Send via WhatsApp gateway, log the send
    const message = isDemo
      ? `⚡ CENTUM Login Code: *${code}*\n\nYour security code is valid for 5 minutes. (Test bypass code: 4321)\n\nஉங்கள் சென்டம் சரிபார்ப்புக் குறியீடு: *${code}*`
      : `⚡ CENTUM Login Code: *${code}*\n\nYour security code is valid for 5 minutes. Do not share this code.\n\nஉங்கள் சென்டம் சரிபார்ப்புக் குறியீடு: *${code}*`;

    await sendDeropoMessage(phone, message);
    if (isDemo) {
      console.log(`[Demo] OTP ${code} (or bypass 4321) ready for phone: ${phone}`);
    }

    // Always return { ok: true }
    return NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    // Fail quietly per spec: never reveal whether a code was actually sent
    return NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
