import { NextResponse } from 'next/server';
import {
  getMockOwnerDiary,
  saveMockOwnerDiary,
  deleteMockOwnerDiary,
} from '@/lib/server-mock-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || '';
  const ownerPhone = searchParams.get('ownerPhone') || '';

  if (!code || !ownerPhone) {
    return NextResponse.json({ ok: false, error: 'code-and-ownerPhone-required' }, { status: 400 });
  }

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'ownerDiary');
      externalUrl.searchParams.set('code', code);
      externalUrl.searchParams.set('ownerPhone', ownerPhone);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn('Apps Script ownerDiary GET failed, falling back to mock store', e);
    }
  }

  const result = getMockOwnerDiary(code, ownerPhone);
  return NextResponse.json(result, {
    status: result.ok ? 200 : 403,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || body.type;

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const secretKey = process.env.APPS_SCRIPT_SECRET;

    if (scriptUrl && secretKey) {
      try {
        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, key: secretKey }),
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
      } catch (e) {
        console.warn('Apps Script ownerDiary POST failed, falling back to mock store', e);
      }
    }

    if (action === 'ownerDiaryDelete' || action === 'delete') {
      const result = deleteMockOwnerDiary(body.code, body.ownerPhone, body.id);
      return NextResponse.json(result, { status: result.ok ? 200 : 403 });
    }

    // Default: ownerDiarySave
    const result = saveMockOwnerDiary(body.code, body.ownerPhone, body.date, body.tag, body.text);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
