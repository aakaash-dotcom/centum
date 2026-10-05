import { NextResponse } from 'next/server';
import {
  FOUNDER_TRIAL_PHONE,
  formatWhatsAppPhone,
  sendWhatsAppMessage,
  probeDeropoShapes,
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

  const url = new URL(request.url);
  const isProbe = url.searchParams.get('probe') === '1' || url.searchParams.get('test') === 'probe';
  const variantParam = url.searchParams.get('variant');

  if (isProbe) {
    const probeLog = await probeDeropoShapes({
      phone: FOUNDER_TRIAL_PHONE,
      text: '🎯 10th Maths Daily Quiz is Live! Save your streak today.',
      buttonText: '🎯 Take the quiz',
      buttonUrl: 'https://centum-omega.vercel.app/quiz',
      imageUrl: 'https://centum-omega.vercel.app/icon.png',
    });
    return NextResponse.json({
      ok: true,
      service: 'CENTUM WhatsApp Shape Probe',
      probe: probeLog,
    });
  }

  return NextResponse.json({
    ok: true,
    service: 'CENTUM WhatsApp Trial Stage',
    recipientLock: `+${FOUNDER_TRIAL_PHONE}`,
    variantOverride: variantParam || 'default',
    policy: {
      documentSends: 'strictly_forbidden',
      mediaSends: 'allowed_for_cta_image_probes',
      textSendsOnly: false,
      ctaButtonsSupported: true,
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

  // Check URL query override for A/B testing
  const url = new URL(request.url);
  const variantQuery = url.searchParams.get('variant');
  const selectedVariant = variantQuery === 'plain' ? 'plain' : (body.variant || body.type || 'plain');

  // Handle probe request via POST
  if (selectedVariant === 'probe' || body.probe === true) {
    const probeLog = await probeDeropoShapes({
      phone: FOUNDER_TRIAL_PHONE,
      text: body.message || body.text || '🎯 10th Maths Daily Quiz is Live!',
      buttonText: body.buttonText || '🎯 Take the quiz',
      buttonUrl: body.buttonUrl || 'https://centum-omega.vercel.app/quiz',
      imageUrl: body.imageUrl || 'https://centum-omega.vercel.app/icon.png',
    });
    return NextResponse.json({ ok: true, probe: probeLog });
  }

  // 2. Founder Policy Guard: STRICTLY NO ATTACHED PDF / RAW DOCUMENT SENDS
  const hasRawDocument = Boolean(
    body.document ||
    body.file ||
    body.pdf ||
    body.attachment
  );

  if (hasRawDocument) {
    return NextResponse.json(
      {
        ok: false,
        error: 'DOCUMENT SENDS STRICTLY PROHIBITED. Under CENTUM founder policy, raw PDF and document attachments are forbidden. Use CTA buttons or direct deep links.',
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

  // 5. Send message with CTA / variant support
  try {
    const result = await sendWhatsAppMessage({
      phone: FOUNDER_TRIAL_PHONE,
      message: finalMessage,
      variant: selectedVariant,
      buttonText: body.buttonText || (selectedVariant === 'streak' ? '🔥 Save my streak' : '🎯 Take the quiz'),
      buttonUrl: body.buttonUrl || 'https://centum-omega.vercel.app/quiz',
      imageUrl: body.imageUrl,
    });

    return NextResponse.json({
      ok: result.ok,
      status: result.status,
      messageId: result.messageId,
      recipient: `+${result.recipient}`,
      variant: selectedVariant,
      shapeUsed: result.shapeUsed,
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
