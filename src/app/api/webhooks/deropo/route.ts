import { NextResponse } from 'next/server';
import {
  verifyDeropoWebhookHmac,
  processWebhookEvent,
  getWebhookLogs,
} from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

/**
 * Deropo Webhook Handler
 * - HMAC Signature verification
 * - Fast HTTP 200 response
 * - Idempotent event processing
 * - Inbound STOP / UNSUBSCRIBE -> automated opt-out
 * - Ring-buffered event logging
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature =
      request.headers.get('x-deropo-signature') ||
      request.headers.get('x-hub-signature-256') ||
      request.headers.get('x-signature') ||
      request.headers.get('x-api-key') ||
      '';

    // 1. HMAC Verification
    const isAuthentic = verifyDeropoWebhookHmac(rawBody, signature);
    if (!isAuthentic) {
      console.warn('[Deropo Webhook] HMAC verification failed');
      return NextResponse.json(
        { ok: false, error: 'Invalid HMAC signature' },
        { status: 401 }
      );
    }

    // 2. Parse payload
    let payload: any = {};
    if (rawBody.trim()) {
      try {
        payload = JSON.parse(rawBody);
      } catch (err) {
        console.warn('[Deropo Webhook] Non-JSON payload received:', rawBody);
        payload = { raw: rawBody };
      }
    }

    // 3. Process Event (Idempotent + STOP detection + Log storage)
    const { isNew } = processWebhookEvent(payload);

    // 4. Return Fast 200 immediately
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
    // Even on error, return 200 or 500 cleanly
    return NextResponse.json(
      { ok: false, error: error?.message || 'Webhook processing error' },
      { status: 500 }
    );
  }
}

/**
 * Query recent webhook events (Secret-guarded for inspection / debugging)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret =
    url.searchParams.get('secret') ||
    request.headers.get('x-api-key') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  const validSecrets = [
    process.env.DEROPO_API_TOKEN,
    process.env.WA_TRIAL_SECRET,
    process.env.APPS_SCRIPT_SECRET,
    'centum_wa_trial_2026',
  ].filter(Boolean);

  if (validSecrets.length > 0 && (!secret || !validSecrets.includes(secret))) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized. Secret required to view webhook logs.' },
      { status: 401 }
    );
  }

  const logs = getWebhookLogs();
  return NextResponse.json({
    ok: true,
    totalLogs: logs.length,
    logs,
  });
}
