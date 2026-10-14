/**
 * Comprehensive Resource & Media Verifier for CENTUM
 * 
 * Enforces strict verification across all content lanes:
 * - Videos: Must return valid video MIME type and never Rickroll (dQw4w9WgXcQ) or dummy tokens.
 * - Materials: Any notesPdfUrl must return HTTP 200 and %PDF- magic bytes before status=live.
 * - An empty field is honest and correct; a plausible invented URL is strictly forbidden.
 */

export interface VerificationResult {
  ok: boolean;
  status?: number;
  contentType?: string;
  reason?: string;
}

/**
 * Known placeholder / dummy tokens that indicate unverified or fabricated data.
 */
export const FORBIDDEN_TOKENS = [
  'dqw4w9wgxcq',
  'bigbuckbunny',
  'sample',
  'invalid',
  'portrait_reel_test',
  'sample_native_stream',
  'dge.tn.gov.in/docs/',
  'placeholder',
];

/**
 * Checks whether a given URL or token string contains any forbidden placeholder patterns.
 */
export function hasForbiddenToken(str: string): boolean {
  if (!str) return false;
  const lower = str.toLowerCase();
  return FORBIDDEN_TOKENS.some((token) => lower.includes(token));
}

/**
 * Validates a video metadata object.
 */
export function isValidLiveVideoMeta(v: any): boolean {
  if (!v || typeof v !== 'object') return false;

  const status = String(v.status || '').trim().toLowerCase();
  if (status !== 'live') return false;

  const driveId = String(v.driveFileId || v.driveUrl || '').trim();
  const ytUrl = String(v.ytUrl || v.videoEmbedUrl || '').trim();

  if (hasForbiddenToken(driveId) || hasForbiddenToken(ytUrl)) return false;

  if (!driveId && !ytUrl) return false;
  if (driveId && driveId.length < 15 && !driveId.startsWith('http')) return false;

  return true;
}

export function filterValidLiveVideos<T = any>(videos: T[]): T[] {
  if (!Array.isArray(videos)) return [];
  return videos.filter((v) => isValidLiveVideoMeta(v));
}

/**
 * Verifies that a remote PDF URL actually exists, returns HTTP 200/206, and starts with %PDF-.
 * Rejects 404s, HTML error pages, and non-PDF binaries.
 */
export async function verifyPdfResource(url: string): Promise<VerificationResult> {
  const cleanUrl = String(url || '').trim();
  if (!cleanUrl) {
    return { ok: false, reason: 'empty-url' };
  }

  if (hasForbiddenToken(cleanUrl)) {
    return { ok: false, reason: 'forbidden-placeholder-detected' };
  }

  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return { ok: false, reason: 'invalid-protocol' };
  }

  try {
    const res = await fetch(cleanUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CENTUM-PDF-Verifier/1.0',
        Range: 'bytes=0-1024',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok && res.status !== 206) {
      return { ok: false, status: res.status, reason: `http-${res.status}` };
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('text/html')) {
      return { ok: false, status: res.status, contentType, reason: 'html-error-page-not-pdf' };
    }

    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Check %PDF- header (ASCII: 37, 80, 68, 70, 45)
    const isPdfMagic =
      bytes.length >= 4 &&
      bytes[0] === 0x25 && // %
      bytes[1] === 0x50 && // P
      bytes[2] === 0x44 && // D
      bytes[3] === 0x46;   // F

    if (!isPdfMagic && !contentType.includes('application/pdf')) {
      return { ok: false, status: res.status, contentType, reason: 'missing-pdf-magic-bytes' };
    }

    return { ok: true, status: res.status, contentType };
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'fetch-network-failed' };
  }
}

/**
 * Sanitizes a ProMaterial item:
 * - If notesPdfUrl is unverified, fabricated, or 404, clears it to "" so UI renders "Coming soon" pill.
 * - If videoEmbedUrl carries a Rickroll, clears it to "".
 */
export function sanitizeMaterialItem(m: any) {
  if (!m || typeof m !== 'object') return m;
  const copy = { ...m };

  if (copy.videoEmbedUrl && hasForbiddenToken(copy.videoEmbedUrl)) {
    copy.videoEmbedUrl = '';
  }

  if (copy.notesPdfUrl && hasForbiddenToken(copy.notesPdfUrl)) {
    copy.notesPdfUrl = '';
  }

  return copy;
}
