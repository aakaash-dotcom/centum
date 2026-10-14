/**
 * Video Resource & Metadata Verifier for CENTUM Pro Videos
 * Re-exports core verification functions from resource-verifier.ts for backward compatibility.
 */

export * from './resource-verifier';

export async function verifyDriveVideoResource(driveFileId: string) {
  const cleanId = String(driveFileId || '').trim();
  if (!cleanId || cleanId.length < 15) {
    return { ok: false, reason: 'invalid-id-format' };
  }

  const lower = cleanId.toLowerCase();
  if (lower.includes('sample') || lower.includes('invalid') || lower.includes('bigbuckbunny') || lower.includes('test')) {
    return { ok: false, reason: 'placeholder-token-detected' };
  }

  try {
    const testUrl = `https://drive.google.com/uc?id=${encodeURIComponent(cleanId)}&export=download`;
    const res = await fetch(testUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CENTUM-Video-Verifier/1.0',
      },
    });

    if (!res.ok) {
      return { ok: false, status: res.status, reason: `http-${res.status}` };
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('text/html')) {
      return {
        ok: false,
        status: res.status,
        contentType,
        reason: 'html-error-or-access-restricted',
      };
    }

    const isVideoType = contentType.includes('video/') || contentType.includes('application/octet-stream');
    if (!isVideoType) {
      return {
        ok: false,
        status: res.status,
        contentType,
        reason: 'not-video-content-type',
      };
    }

    return { ok: true, status: res.status, contentType };
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'fetch-network-error' };
  }
}
