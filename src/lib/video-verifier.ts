/**
 * Video Resource & Metadata Verifier for CENTUM Pro Videos
 * Ensures no placeholder, 404, or Rickroll fixture ever reaches status=live on production.
 */

export interface VideoValidationResult {
  ok: boolean;
  reason?: string;
  contentType?: string;
  status?: number;
}

/**
 * Validates video item metadata fields defensively.
 * Strictly excludes:
 *  - Rickroll YouTube embed ID (dQw4w9WgXcQ)
 *  - Placeholder sample IDs (BigBuckBunny, sample, invalid, test, placeholder)
 *  - Non-live status
 *  - Empty / missing streaming source
 */
export function isValidLiveVideoMeta(v: any): boolean {
  if (!v || typeof v !== 'object') return false;

  const status = String(v.status || '').trim().toLowerCase();
  if (status !== 'live') return false;

  const driveId = String(v.driveFileId || v.driveUrl || '').trim();
  const ytUrl = String(v.ytUrl || v.videoEmbedUrl || '').trim();
  const lowerDrive = driveId.toLowerCase();
  const lowerYt = ytUrl.toLowerCase();

  // Strict rejection of known placeholders and rickrolls
  if (lowerYt.includes('dqw4w9wgxcq')) return false;
  if (lowerDrive.includes('bigbuckbunny')) return false;
  if (lowerDrive.includes('sample')) return false;
  if (lowerDrive.includes('invalid')) return false;
  if (lowerDrive.includes('test')) return false;
  if (lowerDrive.includes('placeholder')) return false;

  // Must have at least a legitimate video URL or valid Drive file ID
  if (!driveId && !ytUrl) return false;
  if (driveId && driveId.length < 15 && !driveId.startsWith('http')) return false;

  return true;
}

/**
 * Filters an array of videos to only strictly valid live entries.
 */
export function filterValidLiveVideos<T = any>(videos: T[]): T[] {
  if (!Array.isArray(videos)) return [];
  return videos.filter((v) => isValidLiveVideoMeta(v));
}

/**
 * Verifies that a Drive file ID actually resolves to a live video with a valid content-type.
 * Used before marking any video row as status=live in the ledger or cache.
 * A 404 or HTML response must NEVER reach status=live.
 */
export async function verifyDriveVideoResource(driveFileId: string): Promise<VideoValidationResult> {
  const cleanId = String(driveFileId || '').trim();
  if (!cleanId || cleanId.length < 15) {
    return { ok: false, reason: 'invalid-id-format' };
  }

  // Reject known dummy tokens immediately without network request
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
    
    // If Drive serves HTML, it is an error page, virus scan warning, or access denied (not a playable direct video)
    if (contentType.includes('text/html')) {
      return {
        ok: false,
        status: res.status,
        contentType,
        reason: 'html-error-or-access-restricted',
      };
    }

    // Must be a recognized binary media type (video/mp4, video/webm, application/octet-stream)
    const isVideoType = contentType.includes('video/') || contentType.includes('application/octet-stream');
    if (!isVideoType) {
      return {
        ok: false,
        status: res.status,
        contentType,
        reason: 'not-video-content-type',
      };
    }

    return {
      ok: true,
      status: res.status,
      contentType,
    };
  } catch (err: any) {
    return {
      ok: false,
      reason: err?.message || 'fetch-network-error',
    };
  }
}
