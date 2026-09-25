import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plan, coupon, phone } = body;

    // Validate plan (only 'pro' can be purchased currently; 'live' is waitlist-only)
    if (plan !== 'pro') {
      return NextResponse.json(
        { ok: false, error: 'Only Pro plan can be purchased at this time' },
        {
          status: 400,
          headers: { 'Cache-Control': 'private, no-store' },
        }
      );
    }

    const BASE_PRICE_RUPEES = 799;
    let discountPercent = 0;

    // Server-side coupon verification: client cannot tamper with the price
    if (coupon && typeof coupon === 'string') {
      const cleanCoupon = coupon.trim().toUpperCase();

      // Check coupon via Apps Script if configured
      const scriptUrl = process.env.APPS_SCRIPT_URL;
      const secretKey = process.env.APPS_SCRIPT_SECRET;
      let couponFound = false;

      if (scriptUrl && secretKey) {
        try {
          const externalUrl = new URL(scriptUrl);
          externalUrl.searchParams.set('action', 'coupon');
          externalUrl.searchParams.set('code', cleanCoupon);
          externalUrl.searchParams.set('key', secretKey);

          const res = await fetch(externalUrl.toString(), { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data.valid && data.discountPercent) {
              discountPercent = data.discountPercent;
              couponFound = true;
            }
          }
        } catch (err) {
          console.warn('Apps Script coupon verification failed', err);
        }
      }

      // Built-in standard test coupons fallback
      if (!couponFound) {
        if (cleanCoupon === 'FRIEND20') {
          discountPercent = 20;
        } else if (cleanCoupon === 'CENTUM10') {
          discountPercent = 10;
        } else if (cleanCoupon === 'CENTUM50') {
          discountPercent = 50;
        }
      }
    }

    // Compute discounted amount in Rupees and paise
    const finalPriceRupees = Math.round(BASE_PRICE_RUPEES * (1 - discountPercent / 100));
    const amountInPaise = finalPriceRupees * 100;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // If Razorpay keys are configured, create order via Razorpay REST API
    if (keyId && keySecret && !keyId.includes('YOUR_KEY_ID')) {
      try {
        const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;

        const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`,
            notes: {
              plan: 'pro',
              phone: phone || '',
              coupon: coupon || '',
            },
          }),
          cache: 'no-store',
        });

        if (rzpResponse.ok) {
          const rzpData = await rzpResponse.json();
          // Send keyId only, NEVER secret
          return NextResponse.json(
            {
              ok: true,
              orderId: rzpData.id,
              amount: rzpData.amount,
              keyId,
            },
            {
              headers: { 'Cache-Control': 'private, no-store' },
            }
          );
        } else {
          const errData = await rzpResponse.text();
          console.error('Razorpay order creation failed:', errData);
        }
      } catch (err) {
        console.error('Razorpay REST error:', err);
      }
    }

    // Fallback order ID for testing when keys are not active or in simulated test mode
    const simulationAllowed = process.env.ALLOW_PAYMENT_SIMULATION === 'true';
    if (!simulationAllowed) {
      return NextResponse.json(
        { ok: false, error: 'payments-not-live' },
        {
          status: 503,
          headers: { 'Cache-Control': 'private, no-store' },
        }
      );
    }

    const mockOrderId = `order_test_${Date.now()}`;
    return NextResponse.json(
      {
        ok: true,
        orderId: mockOrderId,
        amount: amountInPaise,
        keyId: keyId || 'rzp_test_centum_demo',
        isSimulated: true,
      },
      {
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Order creation failed' },
      {
        status: 500,
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  }
}
