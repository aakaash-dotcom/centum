import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, paymentId, signature, plan, coupon, phone, amount } = body;

    if (!orderId || !paymentId) {
      return NextResponse.json(
        { ok: false, error: 'Missing payment parameters' },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Check if simulated test order
    const isSimulated = orderId.startsWith('order_test_') || !keySecret || keySecret.includes('YOUR_RAZORPAY_SECRET');

    if (!isSimulated) {
      // Real signature verification using HMAC-SHA256
      const payload = `${orderId}|${paymentId}`;
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(payload)
        .digest('hex');

      if (generatedSignature !== signature) {
        return NextResponse.json(
          { ok: false, error: 'Invalid payment signature' },
          { status: 400 }
        );
      }
    }

    // Forward verified payment to Apps Script backend
    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const appsSecret = process.env.APPS_SCRIPT_SECRET;

    if (scriptUrl && appsSecret) {
      try {
        const payload = {
          type: 'payment',
          key: appsSecret,
          phone: phone || '',
          plan: plan || 'pro',
          amount: amount || 799,
          paymentId,
          orderId,
          couponCode: coupon || '',
          timestamp: new Date().toISOString(),
        };

        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const resData = await res.json();
          return NextResponse.json({
            ok: true,
            verified: true,
            plan: 'pro',
            ...resData,
          });
        }
      } catch (err) {
        console.warn('Apps script payment logging failed, returning verified', err);
      }
    }

    return NextResponse.json({
      ok: true,
      verified: true,
      plan: 'pro',
      source: 'local_verified',
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
