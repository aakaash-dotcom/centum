import { NextResponse } from 'next/server';
import { getMockClassroomView } from '@/lib/server-mock-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone') || '';

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'classroom');
      externalUrl.searchParams.set('phone', phone);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn('Apps Script classroom GET failed, falling back to mock store', e);
    }
  }

  const result = getMockClassroomView(phone);
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'private, no-store', 'x-data-source': 'mock' },
  });
}
