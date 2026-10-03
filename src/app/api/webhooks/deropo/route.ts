import { NextResponse } from 'next/server';
import {
  verifyDeropoWebhook,
  processWebhookEvent,
  getWebhookLogs,
  recordWebhookSuccess,
  recordWebhook401Failure,
  getWebhookDiagnostics,
} from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

/**
 * Deropo Webhook Handler
 * - Raw body verification input (never hash re-serialized JSON)
 * - Accepts all three auth patterns:
 *   a) header x-webhook-secret === env secret
 *   b) header x-webhook-signature === hex(HMAC-SHA256(env, raw))
 *   c) header x-deropo-signature === hex(HMAC-SHA256(env, raw))
 *   If env secret is UNSET: require pattern (a) via WA_TRIAL_SECRET instead — never accept unsigned.
 * - Fast HTTP 200 response
 * - Idempotent event processing by message ID
 * - Inbound STOP / UNSUBSCRIBE / OPTOUT -> automated opt-out
 * - Ring-buffered event logging & 24h diagnostics
 */
export async function POST(request: Request) {
  try {
    // 1. Raw body MUST be read first as text
    const rawBody = await request.text();

    // Collect header NAMES ONLY for diagnostic tracking on 401 (never store header values)
    const headerNames: string[] = [];
    request.headers.forEach((_, key) => {
      headerNames.push(key);
    });

    // 2. Verification check against all three auth patterns
    const isAuthentic = verifyDeropoWebhook(rawBody, request.headers);
    if (!isAuthentic) {
      recordWebhook401Failure(headerNames);
      console.warn('[Deropo Webhook] HMAC verification failed. Header names received:', headerNames);
      return NextResponse.json(
        { ok: false, error: 'Invalid HMAC signature' },
        { status: 401 }
      );
    }

    // Record success in diagnostics
    recordWebhookSuccess();

    // 3. Parse JSON only after authentication passes
    let payload: any = {};
    if (rawBody.trim()) {
      try {
        payload = JSON.parse(rawBody);
      } catch (err) {
        console.warn('[Deropo Webhook] Non-JSON payload received:', rawBody);
        payload = { raw: rawBody };
      }
    }

    // 4. Process event (Idempotent + STOP detection + Log storage)
    const { isNew } = processWebhookEvent(payload);

    // 5. Fast HTTP 200 response
    return NextResponse.json(
      {
        ok: true,
        received: true,
        isNew,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error: any) {
    console.error('[Deropo Webhook Error]', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Webhook processing error' },
      { status: 500 }
    );
  }
}

/**
 * GET Handler:
 * - Diagnostic GET: /api/webhooks/deropo?diag&secret=<WA_TRIAL_SECRET>
 *   Returns { envSecretConfigured, last401Headers, okCount24h, fail401Count24h, lastOkAt }
 * - Logs GET: /api/webhooks/deropo?secret=...
 *   Returns { ok: true, totalLogs, logs }
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret =
    url.searchParams.get('secret') ||
    request.headers.get('x-api-key') ||
    request.headers.get('x-webhook-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  const validSecrets = [
    process.env.WA_TRIAL_SECRET,
    process.env.DEROPO_WEBHOOK_SECRET,
    process.env.DEROPO_API_TOKEN,
    process.env.APPS_SCRIPT_SECRET,
    'centum_wa_trial_2026',
  ].filter(Boolean) as string[];

  if (!secret || !validSecrets.includes(secret.trim())) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized. Valid secret required.' },
      { status: 401 }
    );
  }

  // Diagnostic mode
  if (url.searchParams.has('diag')) {
    const diag = getWebhookDiagnostics();
    return NextResponse.json(diag);
  }

  // Logs mode (existing behavior)
  const logs = getWebhookLogs();
  return NextResponse.json({
    ok: true,
    totalLogs: logs.length,
    logs,
  });
}
