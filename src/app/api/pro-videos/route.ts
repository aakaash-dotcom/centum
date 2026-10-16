import { NextResponse } from 'next/server';
import { listMockProVideos } from '@/lib/server-mock-store';
import { filterValidLiveVideos } from '@/lib/video-verifier';

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
        if (data && data.ok && Array.isArray(data.videos)) {
          // Strictly reject any dummy/sample/rickroll/invalid video entries
          const verifiedVideos = filterValidLiveVideos(data.videos);
          // If upstream sheet has not populated videos yet, include verified live fixtures (e.g. 10th Maths Ch 1)
          const fixtureVideos = filterValidLiveVideos(listMockProVideos(classLevel, subject, chapter));
          const combinedVideos = verifiedVideos.length > 0 ? verifiedVideos : fixtureVideos;
          return NextResponse.json({
            ...data,
            videos: combinedVideos,
            source: 'live',
            servedFrom: verifiedVideos.length > 0 ? 'gas' : (combinedVideos.length > 0 ? 'fixture-store' : 'gas'),
            totalLiveVideos: combinedVideos.length,
          });
        }
      }
    } catch (e) {
      console.warn('Apps Script proVideos GET failed, falling back to safe empty state', e);
    }
  }

  // Filter through filterValidLiveVideos: only videos with status='live' and verified URL are served
  const rawMockVideos = listMockProVideos(classLevel, subject, chapter);
  const videos = filterValidLiveVideos(rawMockVideos);

  return NextResponse.json(
    {
      ok: true,
      classLevel,
      subject,
      chapter,
      videos,
      totalLiveVideos: videos.length,
      source: 'live',
      servedFrom: videos.length > 0 ? 'fixture-store' : 'empty-state',
      note: videos.length === 0 ? 'No live videos currently published. Real verified videos coming.' : undefined,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=60',
        'x-data-source': videos.length > 0 ? 'fixture-store' : 'empty-state',
        'x-served-from': videos.length > 0 ? 'fixture-store' : 'empty-state',
      },
    }
  );
}
