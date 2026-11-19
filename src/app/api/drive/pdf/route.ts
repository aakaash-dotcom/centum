import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/drive/pdf?id=<DRIVE_FILE_ID>
 * 
 * Streams PDF documents directly from Google Drive under the same origin.
 * Resolves CORS limitations so that client-side PDF viewers (PDF.js) can
 * load, render, zoom, and navigate pages smoothly.
 * 
 * Handles Google Drive's interstitial virus scan confirmations for larger files.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id || !/^[A-Za-z0-9_-]{25,64}$/.test(id)) {
    return NextResponse.json({ ok: false, error: 'invalid-id' }, { status: 400 });
  }

  const directUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download`;

  try {
    const forwardHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CENTUM-Viewer/1.0',
    };

    // Forward range header if requested by PDF.js
    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
      forwardHeaders['Range'] = rangeHeader;
    }

    let driveRes = await fetch(directUrl, {
      headers: forwardHeaders,
      redirect: 'follow',
    });

    const contentType = driveRes.headers.get('content-type') || '';

    // If Google Drive returns HTML instead of PDF bytes, it may be the virus-scan interstitial
    if (contentType.includes('text/html')) {
      const html = await driveRes.text();
      const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/i);
      const confirmMatch = html.match(/name="confirm"\s+value="([^"]+)"/i);

      if (uuidMatch && confirmMatch) {
        const confirmedUrl = `${directUrl}&confirm=${encodeURIComponent(confirmMatch[1])}&uuid=${encodeURIComponent(uuidMatch[1])}`;
        driveRes = await fetch(confirmedUrl, {
          headers: forwardHeaders,
          redirect: 'follow',
        });
      } else {
        // Fallback to drive.google.com uc export
        const fallbackUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
        driveRes = await fetch(fallbackUrl, {
          headers: forwardHeaders,
          redirect: 'follow',
        });
      }
    }

    if (!driveRes.ok || !driveRes.body) {
      return NextResponse.json(
        { ok: false, error: `drive-error-${driveRes.status}` },
        { status: driveRes.status || 502 }
      );
    }

    // Build response headers
    const isImage = contentType.startsWith('image/');
    const mimeType = isImage ? contentType : 'application/pdf';
    const ext = isImage ? (contentType.split('/')[1]?.split(';')[0] || 'png') : 'pdf';

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', mimeType);
    responseHeaders.set('X-Document-Type', isImage ? 'image' : 'pdf');
    responseHeaders.set('Content-Disposition', `inline; filename="centum-${id}.${ext}"`);
    responseHeaders.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    responseHeaders.set('Accept-Ranges', 'bytes');

    const contentLength = driveRes.headers.get('content-length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    const contentRange = driveRes.headers.get('content-range');
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    return new Response(driveRes.body, {
      status: driveRes.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(`[DrivePdfProxy] Error streaming PDF for ${id}:`, err?.message || err);
    return NextResponse.json({ ok: false, error: 'fetch-failed' }, { status: 500 });
  }
}
