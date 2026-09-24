import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone') || '';

  if (!phone) {
    return NextResponse.json({ ok: true, plan: 'free' });
  }

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'plan');
      externalUrl.searchParams.set('phone', phone);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), {
        next: { revalidate: 15 },
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({
          ok: true,
          plan: data.plan || 'free',
        });
      }
    } catch (e) {
      console.warn('Apps Script plan fetch failed, falling back to free', e);
    }
  }

  return NextResponse.json({
    ok: true,
    plan: 'free',
    source: 'default',
  });
}
