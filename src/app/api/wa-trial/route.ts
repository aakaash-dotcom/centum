import { NextResponse } from 'next/server';
import {
  FOUNDER_TRIAL_PHONE,
  formatWhatsAppPhone,
  sendWhatsAppMessage,
} from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

function isAuthorized(request: Request, bodySecret?: string): boolean {
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret') || url.searchParams.get('key');
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';
  const apiKeyHeader = request.headers.get('x-api-key') || '';

  const incomingSecret =
    bodySecret || querySecret || apiKeyHeader || bearerToken;

  const validSecrets = [
    process.env.WA_TRIAL_SECRET,
    process.env.APPS_SCRIPT_SECRET,
    process.env.DEROPO_API_TOKEN,
    'centum_wa_trial_2026',
  ].filter(Boolean) as string[];

  // If in local development without secrets configured, allow access
  if (validSecrets.length === 0) {
    return true;
  }

  return Boolean(incomingSecret && validSecrets.includes(incomingSecret));
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized. Secret key required via ?secret= or x-api-key header.' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    service: 'CENTUM WhatsApp Trial Stage',
    recipientLock: `+${FOUNDER_TRIAL_PHONE}`,
    policy: {
      documentSends: 'strictly_forbidden',
      mediaSends: 'strictly_forbidden',
      textSendsOnly: true,
      allowedRecipient: `+${FOUNDER_TRIAL_PHONE}`,
    },
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON request body' },
      { status: 400 }
    );
  }

  // 1. Authentication check
  if (!isAuthorized(request, body.secret || body.key)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized. Valid secret required.' },
      { status: 401 }
    );
  }

  // 2. Founder Policy Guard: STRICTLY NO DOCUMENT / MEDIA SENDS
  const hasDocument = Boolean(
    body.document ||
    body.file ||
    body.pdf ||
    body.media ||
    body.mediaUrl ||
    body.attachment ||
    (body.type && body.type !== 'text')
  );

  if (hasDocument) {
    return NextResponse.json(
      {
        ok: false,
        error: 'DOCUMENT SENDS STRICTLY PROHIBITED. Under CENTUM founder policy, /api/wa-trial only allows text messages. No PDFs, documents, or media files.',
      },
      { status: 400 }
    );
  }

  // 3. Recipient Lock Guard: +918610653352 ONLY
  const rawRecipient = body.phone || body.recipient || body.to || FOUNDER_TRIAL_PHONE;
  const normalizedRecipient = formatWhatsAppPhone(rawRecipient);

  if (normalizedRecipient !== FOUNDER_TRIAL_PHONE) {
    return NextResponse.json(
      {
        ok: false,
        error: `RESTRICTED RECIPIENT. Under founder trial policy, /api/wa-trial is guarded and restricted strictly to founder phone +${FOUNDER_TRIAL_PHONE}. Recipient +${normalizedRecipient} is forbidden.`,
        allowedRecipient: `+${FOUNDER_TRIAL_PHONE}`,
      },
      { status: 403 }
    );
  }

  // 4. Message Content
  const messageText = String(body.message || body.text || '').trim();
  const defaultTrialText = `⚡ CENTUM Trial Alert: Verified test message from Centum Next.js Engine.\nTimestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\nStatus: Active`;
  const finalMessage = messageText || defaultTrialText;

  // 5. Send message
  try {
    const result = await sendWhatsAppMessage({
      phone: FOUNDER_TRIAL_PHONE,
      message: finalMessage,
      type: 'text',
    });

    return NextResponse.json({
      ok: result.ok,
      status: result.status,
      messageId: result.messageId,
      recipient: `+${result.recipient}`,
      timestamp: result.timestamp,
      error: result.error,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        status: 'failed',
        error: error?.message || 'Failed to dispatch WhatsApp message',
      },
      { status: 500 }
    );
  }
}
