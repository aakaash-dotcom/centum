import { NextResponse } from 'next/server';
import { listMockProVideos } from '@/lib/server-mock-store';

export const dynamic = 'force-dynamic';

export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classLevel = searchParams.get('classLevel') || '10';
  const subject = searchParams.get('subject') || '';
  const chapter = searchParams.get('chapter') || '';

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    try {
      const externalUrl = new URL(scriptUrl);
      externalUrl.searchParams.set('action', 'proVideos');
      externalUrl.searchParams.set('classLevel', classLevel);
      externalUrl.searchParams.set('subject', subject);
      if (chapter) externalUrl.searchParams.set('chapter', chapter);
      externalUrl.searchParams.set('key', secretKey);

      const res = await fetch(externalUrl.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.videos) && data.videos.length > 0) {
          return NextResponse.json({
            ...data,
            source: 'live',
            servedFrom: 'gas',
            totalLiveVideos: data.videos.length,
          });
        }
      }
    } catch (e) {
      console.warn('Apps Script proVideos GET failed, falling back to mock store', e);
    }
  }

  const videos = listMockProVideos(classLevel, subject, chapter);
  return NextResponse.json(
    {
      ok: true,
      classLevel,
      subject,
      chapter,
      videos,
      source: 'mock-fallback',
      servedFrom: 'mock-store',
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=60',
        'x-data-source': 'mock-fallback',
        'x-served-from': 'mock-store',
      },
    }
  );
}
