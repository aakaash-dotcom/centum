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
          return NextResponse.json({
            ...data,
            videos: verifiedVideos,
            source: 'live',
            servedFrom: 'gas',
            totalLiveVideos: verifiedVideos.length,
          });
        }
      }
    } catch (e) {
      console.warn('Apps Script proVideos GET failed, falling back to safe empty state', e);
    }
  }

  // Gate fixture rows strictly behind an environment flag.
  // In production (or when flag is unset/false), return an honest empty state with 0 videos.
  const allowFixtures = process.env.ENABLE_FIXTURE_VIDEOS === 'true';
  const rawMockVideos = allowFixtures ? listMockProVideos(classLevel, subject, chapter) : [];
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
      servedFrom: allowFixtures && videos.length > 0 ? 'fixture-store' : 'empty-state',
      note: videos.length === 0 ? 'No live videos currently published. Real verified videos coming.' : undefined,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=60',
        'x-data-source': allowFixtures && videos.length > 0 ? 'fixture-store' : 'empty-state',
        'x-served-from': allowFixtures && videos.length > 0 ? 'fixture-store' : 'empty-state',
      },
    }
  );
}
