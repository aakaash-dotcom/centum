import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawCode = searchParams.get('code') || '';
  const code = rawCode.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ ok: true, valid: false });
  }

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'coupon');
      externalUrl.searchParams.set('code', code);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), {
        next: { revalidate: 10 },
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({
          ok: true,
          valid: Boolean(data.valid),
          discountPercent: data.discountPercent || 0,
        });
      }
    } catch (e) {
      console.warn('Apps Script coupon fetch failed, checking standard fallback', e);
    }
  }

  // Built-in standard test coupons (e.g. FRIEND20 = 20% discount)
  if (code === 'FRIEND20') {
    return NextResponse.json({
      ok: true,
      valid: true,
      discountPercent: 20,
      source: 'built_in',
    });
  }

  if (code === 'CENTUM10') {
    return NextResponse.json({
      ok: true,
      valid: true,
      discountPercent: 10,
      source: 'built_in',
    });
  }

  return NextResponse.json({
    ok: true,
    valid: false,
    discountPercent: 0,
  });
}
