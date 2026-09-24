import { NextResponse } from 'next/server';
import { SAMPLE_NEWS } from '@/data/sampleData';

export async function GET() {
  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'news');
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), {
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.news)) {
          return NextResponse.json(data);
        }
      }
    } catch (e) {
      console.warn('Apps Script news fetch failed, serving sample data', e);
    }
  }

  // Fallback to bundled sample news
  return NextResponse.json({
    ok: true,
    news: SAMPLE_NEWS,
    source: 'sample_bundle',
  });
}
