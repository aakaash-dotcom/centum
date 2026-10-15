import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/drive/download?id=<DRIVE_FILE_ID>
 * 
 * Secure download endpoint for Google Drive resources:
 *  - For files <= 100 MB: Redirects directly to Google Drive uc?export=download
 *  - For files > 100 MB (which trigger Google Drive's "Virus scan warning" interstitial):
 *    Fetches the confirmation token (confirm + uuid) from the warning form and automatically
 *    redirects to the confirmed download endpoint at drive.usercontent.google.com, ensuring
 *    the student directly downloads the PDF without getting a broken HTML page.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id || !/^[A-Za-z0-9_-]{25,}$/.test(id)) {
    return NextResponse.json({ ok: false, error: 'invalid-id' }, { status: 400 });
  }

  const directUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(directUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CENTUM-Downloader/1.0',
      },
    });
    clearTimeout(timeout);

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
      return NextResponse.redirect(directUrl);
    }

    // Read interstitial HTML and extract confirmation tokens (id + confirm + uuid)
    const html = await res.text();
    const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/i);
    const confirmMatch = html.match(/name="confirm"\s+value="([^"]+)"/i);

    if (uuidMatch && confirmMatch) {
      const confirmedUrl = `${directUrl}&confirm=${encodeURIComponent(confirmMatch[1])}&uuid=${encodeURIComponent(uuidMatch[1])}`;
      return NextResponse.redirect(confirmedUrl);
    }

    return NextResponse.redirect(directUrl);
  } catch (err: any) {
    console.warn(`[DriveDownload] Error handling confirm-token for ${id}:`, err?.message || err);
    return NextResponse.redirect(directUrl);
  }
}
