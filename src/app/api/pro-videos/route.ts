import { NextResponse } from 'next/server';
import { filterValidLiveVideos } from '@/lib/video-verifier';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalizeVideo(v: any, index: number) {
  if (!v || typeof v !== 'object') return null;

  // Flexible column mapping for Google Sheets user entries
  const id = String(v.id || v.videoId || `v-${index + 1}`).trim();
  const classLevel = String(v.classLevel || v.standard || v.class || '10').replace(/\D/g, '') || '10';
  const subject = String(v.subject || '').trim().toLowerCase();
  const chapterNo = Number(String(v.chapterNo || v.chapter || '1').replace(/\D/g, '')) || 1;
  const topic = String(v.topic || v.title || v.name || '').trim();
  const videoType = String(v.videoType || 'concept-explainer').trim();
  const targetSec = Number(v.targetSec || v.duration || 600) || 600;
  const order = Number(v.order || index + 1) || index + 1;
  const lang = String(v.lang || v.language || 'ta').trim();
  let driveFileId = String(v.driveFileId || v.driveUrl || v.drive || v.fileId || '').trim();
  let ytUrl = String(v.ytUrl || v.youtube || v.youtubeUrl || v.videoUrl || v.url || v.link || '').trim();
  const status = String(v.status || 'live').trim().toLowerCase();
  const aspectRatio = String(v.aspectRatio || '16:9').trim();

  // If a YouTube URL was accidentally pasted into the driveFileId column
  if (!ytUrl && (driveFileId.includes('youtube.com') || driveFileId.includes('youtu.be'))) {
    ytUrl = driveFileId;
    driveFileId = '';
  }
  // If a Google Drive URL was accidentally pasted into the ytUrl column
  if (!driveFileId && ytUrl.includes('drive.google.com')) {
    driveFileId = ytUrl;
    ytUrl = '';
  }

  // Reject explicitly disabled or draft rows
  if (status === 'draft' || status === 'archived' || status === 'disabled' || status === 'hidden') {
    return null;
  }

  // A valid video must have at least a topic and one link (Drive or YouTube)
  if (!topic || (!driveFileId && !ytUrl)) {
    return null;
  }

  return {
    id,
    classLevel,
    subject,
    chapterNo,
    topic,
    videoType,
    targetSec,
    order,
    lang,
    driveFileId,
    ytUrl,
    status: 'live',
    aspectRatio,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classLevel = (searchParams.get('classLevel') || '10').replace(/\D/g, '') || '10';
  const subject = (searchParams.get('subject') || '').trim().toLowerCase();
  const chapter = searchParams.get('chapter') || '';
  const numChapter = chapter ? Number(String(chapter).replace(/\D/g, '')) : 0;

  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && secretKey) {
    // Actions to try against Google Apps Script
    const actionsToTry = ['proVideos', 'videos', 'ops-rows'];

    for (const action of actionsToTry) {
      try {
        const externalUrl = new URL(scriptUrl);
        externalUrl.searchParams.set('action', action);
        if (action === 'ops-rows') {
          externalUrl.searchParams.set('tab', 'Videos');
        } else {
          externalUrl.searchParams.set('classLevel', classLevel);
          if (subject) externalUrl.searchParams.set('subject', subject);
          if (chapter) externalUrl.searchParams.set('chapter', chapter);
        }
        externalUrl.searchParams.set('key', secretKey);

        const res = await fetch(externalUrl.toString(), { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const rawList = Array.isArray(data.videos)
            ? data.videos
            : Array.isArray(data.rows)
            ? data.rows
            : [];

          if (rawList.length > 0) {
            const normalized = rawList
              .map((row: any, idx: number) => normalizeVideo(row, idx))
              .filter(Boolean);

            const filteredByScope = normalized.filter((v: any) => {
              if (v.classLevel !== classLevel) return false;
              if (subject && !v.subject.toLowerCase().includes(subject) && !subject.includes(v.subject.toLowerCase())) {
                return false;
              }
              if (numChapter && v.chapterNo !== numChapter) return false;
              return true;
            });

            const verifiedVideos = filterValidLiveVideos(filteredByScope);

            return NextResponse.json({
              ok: true,
              classLevel,
              subject,
              chapter,
              videos: verifiedVideos,
              source: 'live',
              servedFrom: 'gas',
              totalLiveVideos: verifiedVideos.length,
            });
          } else if (data.ok && Array.isArray(data.videos)) {
            // Tab exists and returned empty array
            return NextResponse.json({
              ok: true,
              classLevel,
              subject,
              chapter,
              videos: [],
              source: 'live',
              servedFrom: 'gas',
              totalLiveVideos: 0,
            });
          }
        }
      } catch (e) {
        console.warn(`Apps Script ${action} attempt failed:`, e);
      }
    }
  }

  // When no remote videos are found, return clean empty list with zero mock demo videos
  return NextResponse.json(
    {
      ok: true,
      classLevel,
      subject,
      chapter,
      videos: [],
      totalLiveVideos: 0,
      source: 'live',
      servedFrom: 'empty-state',
      note: 'No live videos published yet in CENTUM DB for this subject.',
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
