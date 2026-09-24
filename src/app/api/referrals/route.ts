import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone') || '';

  if (!phone) {
    return NextResponse.json({
      ok: true,
      couponCode: null,
      discountPercent: 20,
      share: 150,
      earnings: { total: 0, pending: 0, paid: 0 },
      referrals: [],
    });
  }

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'referrals');
      externalUrl.searchParams.set('phone', phone);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), {
        next: { revalidate: 30 },
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn('Apps Script referrals fetch failed, falling back to local info', e);
    }
  }

  // Fallback demo student referral info
  // Generate coupon code from phone or first name e.g. CENTUM20
  const hasReferralCode = phone.length >= 4;
  const couponCode = hasReferralCode ? `CENTUM${phone.slice(-4)}` : null;

  return NextResponse.json({
    ok: true,
    couponCode,
    discountPercent: 20,
    share: 150,
    earnings: hasReferralCode
      ? { total: 450, pending: 150, paid: 300 }
      : { total: 0, pending: 0, paid: 0 },
    referrals: hasReferralCode
      ? [
          {
            id: 'ref-1',
            date: 'Sep 21, 2026',
            maskedPhone: '98****4120',
            amount: 639,
            share: 150,
            status: 'paid',
          },
          {
            id: 'ref-2',
            date: 'Sep 19, 2026',
            maskedPhone: '94****8831',
            amount: 639,
            share: 150,
            status: 'paid',
          },
          {
            id: 'ref-3',
            date: 'Yesterday',
            maskedPhone: '97****5219',
            amount: 639,
            share: 150,
            status: 'pending',
          },
        ]
      : [],
    source: 'sample_bundle',
  });
}
