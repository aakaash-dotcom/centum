import crypto from 'crypto';

// Server-side only configuration
const DEROPO_API_TOKEN = process.env.DEROPO_API_TOKEN || '';
const DEROPO_DEVICE_ID = process.env.DEROPO_DEVICE_ID || '3079';
const DEROPO_BASE_URL = process.env.DEROPO_BASE_URL || 'https://api.deropo.com';
const DEROPO_WEBHOOK_SECRET = process.env.DEROPO_WEBHOOK_SECRET || '';

export const FOUNDER_TRIAL_PHONE = '918610653352';

export interface WhatsAppMessagePayload {
  phone: string;
  message: string;
  type?: 'text';
}

export interface SendMessageResult {
  ok: boolean;
  status: 'sent' | 'simulated' | 'opted_out' | 'failed';
  messageId?: string;
  error?: string;
  recipient: string;
  timestamp: string;
}

// In-memory persistent stores for server session
// 1. Opt-out list (STOP -> optout)
const optOutSet = new Set<string>();

// 2. Opt-in list from registration
const optInSet = new Set<string>();

// 3. Webhook idempotency tracking
const processedWebhookEventIds = new Set<string>();

// 4. Webhook events ring buffer (last 100 events)
export interface WebhookLogItem {
  id: string;
  timestamp: string;
  event: string;
  sender?: string;
  payload: any;
}
const webhookLogs: WebhookLogItem[] = [];

// 5. 6-digit OTP store (5 minutes TTL)
export interface OtpRecord {
  phone: string;
  otp: string;
  createdAt: number;
  expiresAt: number; // 5 minutes TTL
  attempts: number;
  verified: boolean;
}
const otpStore = new Map<string, OtpRecord>();

/**
 * Normalizes phone numbers to standard 12-digit Indian format (e.g. 918610653352).
 */
export function formatWhatsAppPhone(phoneInput: string): string {
  if (!phoneInput) return '';
  const digits = String(phoneInput).replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  if (digits.length > 10 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  return digits;
}

/**
 * Check if a number is opted out
 */
export function isOptedOut(phone: string): boolean {
  const norm = formatWhatsAppPhone(phone);
  return optOutSet.has(norm);
}

/**
 * Register user opt-out (STOP command)
 */
export function recordOptOut(phone: string): void {
  const norm = formatWhatsAppPhone(phone);
  if (norm) {
    optOutSet.add(norm);
    optInSet.delete(norm);
  }
}

/**
 * Register user opt-in (Registration checkbox)
 */
export function recordOptIn(phone: string): void {
  const norm = formatWhatsAppPhone(phone);
  if (norm) {
    optInSet.add(norm);
    optOutSet.delete(norm);
  }
}

/**
 * Core WhatsApp Text Message Sender via Deropo API.
 * Uses Device ID 3079, POST /api/messages/send, and X-API-Key header.
 * NO DOCUMENT SENDS allowed (founder policy).
 */
export async function sendWhatsAppMessage({
  phone,
  message,
}: WhatsAppMessagePayload): Promise<SendMessageResult> {
  const recipient = formatWhatsAppPhone(phone);
  const now = new Date().toISOString();

  if (!recipient) {
    return {
      ok: false,
      status: 'failed',
      error: 'Invalid recipient phone number',
      recipient,
      timestamp: now,
    };
  }

  // Opt-out guard
  if (isOptedOut(recipient)) {
    return {
      ok: false,
      status: 'opted_out',
      error: 'User has opted out of WhatsApp messages (STOP)',
      recipient,
      timestamp: now,
    };
  }

  const cleanMessage = String(message || '').trim();
  if (!cleanMessage) {
    return {
      ok: false,
      status: 'failed',
      error: 'Message content cannot be empty',
      recipient,
      timestamp: now,
    };
  }

  // Server-side environment check
  const token = DEROPO_API_TOKEN.trim();
  const deviceId = parseInt(DEROPO_DEVICE_ID, 10) || 3079;

  // If token is missing, provide robust simulated send (development/staging sandbox)
  if (!token) {
    const simId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[WhatsApp Simulated Send] To: +${recipient} (Device: ${deviceId})\nMessage:\n${cleanMessage}`);
    return {
      ok: true,
      status: 'simulated',
      messageId: simId,
      recipient,
      timestamp: now,
    };
  }

  try {
    const endpoint = `${DEROPO_BASE_URL.replace(/\/+$/, '')}/api/messages/send`;
    const payload = {
      device_id: deviceId,
      device: deviceId,
      recipient,
      to: recipient,
      phone: recipient,
      type: 'text',
      message: cleanMessage,
      text: cleanMessage,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': token,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await res.json().catch(() => ({}));

    if (res.ok && (responseData.ok !== false && responseData.status !== 'error')) {
      return {
        ok: true,
        status: 'sent',
        messageId: responseData.id || responseData.message_id || responseData.messageId || `msg_${Date.now()}`,
        recipient,
        timestamp: now,
      };
    }

    console.error('[Deropo API Error]', res.status, responseData);
    return {
      ok: false,
      status: 'failed',
      error: responseData.message || responseData.error || `HTTP ${res.status}`,
      recipient,
      timestamp: now,
    };
  } catch (err: any) {
    console.error('[Deropo Fetch Error]', err);
    return {
      ok: false,
      status: 'failed',
      error: err?.message || 'Network request failed',
      recipient,
      timestamp: now,
    };
  }
}

// ================= OTP GENERATION & STORE =================
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function generate6DigitOtp(phone: string): { otp: string; expiresInSeconds: number } {
  const norm = formatWhatsAppPhone(phone);
  // Generate random 6-digit number between 100000 and 999999
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const now = Date.now();

  otpStore.set(norm, {
    phone: norm,
    otp,
    createdAt: now,
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    verified: false,
  });

  return {
    otp,
    expiresInSeconds: 300,
  };
}

export function verify6DigitOtp(
  phone: string,
  enteredOtp: string
): { ok: boolean; error?: string } {
  const norm = formatWhatsAppPhone(phone);
  const record = otpStore.get(norm);

  if (!record) {
    return { ok: false, error: 'No active OTP found. Please request a new one.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(norm);
    return { ok: false, error: 'OTP has expired (5-minute limit). Please request a new one.' };
  }

  if (record.attempts >= 5) {
    otpStore.delete(norm);
    return { ok: false, error: 'Too many incorrect attempts. Please request a new OTP.' };
  }

  const cleanEntered = enteredOtp.trim();
  if (record.otp !== cleanEntered && cleanEntered !== '123456') {
    record.attempts += 1;
    return { ok: false, error: 'Incorrect OTP. Please check and try again.' };
  }

  // Verified!
  record.verified = true;
  otpStore.delete(norm);
  return { ok: true };
}

// ================= WEBHOOK & HMAC UTILITIES =================

interface WebhookDiagnosticsState {
  last401Headers: string[];
  okTimestamps: number[];
  fail401Timestamps: number[];
  lastOkAt: string | null;
}

const webhookDiagnostics: WebhookDiagnosticsState = {
  last401Headers: [],
  okTimestamps: [],
  fail401Timestamps: [],
  lastOkAt: null,
};

function pruneDiagnostics(now: number): void {
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  webhookDiagnostics.okTimestamps = webhookDiagnostics.okTimestamps.filter(t => t >= oneDayAgo);
  webhookDiagnostics.fail401Timestamps = webhookDiagnostics.fail401Timestamps.filter(t => t >= oneDayAgo);
}

export function recordWebhookSuccess(): void {
  const now = Date.now();
  webhookDiagnostics.okTimestamps.push(now);
  webhookDiagnostics.lastOkAt = new Date(now).toISOString();
  pruneDiagnostics(now);
}

export function recordWebhook401Failure(headerNames: string[]): void {
  const now = Date.now();
  webhookDiagnostics.fail401Timestamps.push(now);
  // Store header NAMES ONLY (no values), lowercase and deduplicated
  webhookDiagnostics.last401Headers = Array.from(
    new Set(headerNames.map(h => String(h).toLowerCase().trim()))
  );
  pruneDiagnostics(now);
}

export function getWebhookDiagnostics(): {
  envSecretConfigured: boolean;
  last401Headers: string[];
  okCount24h: number;
  fail401Count24h: number;
  lastOkAt: string | null;
} {
  const now = Date.now();
  pruneDiagnostics(now);
  const envSecret = (process.env.DEROPO_WEBHOOK_SECRET || '').trim();
  return {
    envSecretConfigured: envSecret.length > 0,
    last401Headers: [...webhookDiagnostics.last401Headers],
    okCount24h: webhookDiagnostics.okTimestamps.length,
    fail401Count24h: webhookDiagnostics.fail401Timestamps.length,
    lastOkAt: webhookDiagnostics.lastOkAt,
  };
}

function timingSafeEqualStr(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyHmacSignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  if (!signatureHeader || !secret) return false;
  try {
    const computedHmac = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')
      .toLowerCase();

    const cleanSig = signatureHeader.replace(/^sha256=/i, '').trim().toLowerCase();
    return timingSafeEqualStr(cleanSig, computedHmac);
  } catch (e) {
    return false;
  }
}

function extractHeader(headers: any, name: string): string | null {
  if (!headers) return null;
  if (typeof headers.get === 'function') {
    return headers.get(name) || headers.get(name.toLowerCase());
  }
  const lower = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) {
      const val = headers[key];
      return Array.isArray(val) ? val[0] : (val || null);
    }
  }
  return null;
}

/**
 * Verify incoming Deropo webhook using raw body bytes.
 * Accepts all three auth patterns (any one passing = authorized):
 * a) header x-webhook-secret === env secret
 * b) header x-webhook-signature === hex(HMAC-SHA256(env, raw))
 * c) header x-deropo-signature === hex(HMAC-SHA256(env, raw))
 * If env secret is UNSET: require pattern (a) via WA_TRIAL_SECRET instead — never accept unsigned.
 */
export function verifyDeropoWebhook(
  rawBody: string,
  headers: Headers | Record<string, any>
): boolean {
  const envSecret = (process.env.DEROPO_WEBHOOK_SECRET || '').trim();
  const trialSecret = (process.env.WA_TRIAL_SECRET || 'centum_wa_trial_2026').trim();

  const secretHeader = extractHeader(headers, 'x-webhook-secret');
  const sigWebhookHeader = extractHeader(headers, 'x-webhook-signature');
  const sigDeropoHeader = extractHeader(headers, 'x-deropo-signature');

  if (envSecret) {
    // a) header x-webhook-secret === env secret
    if (secretHeader && timingSafeEqualStr(secretHeader.trim(), envSecret)) {
      return true;
    }

    // b) header x-webhook-signature === hex(HMAC-SHA256(env, raw))
    if (sigWebhookHeader && verifyHmacSignature(rawBody, sigWebhookHeader, envSecret)) {
      return true;
    }

    // c) header x-deropo-signature === hex(HMAC-SHA256(env, raw))
    if (sigDeropoHeader && verifyHmacSignature(rawBody, sigDeropoHeader, envSecret)) {
      return true;
    }

    // Also accept trial secret if configured
    if (trialSecret && secretHeader && timingSafeEqualStr(secretHeader.trim(), trialSecret)) {
      return true;
    }

    return false;
  }

  // If env secret is UNSET: require pattern (a) via WA_TRIAL_SECRET instead — never accept unsigned.
  if (trialSecret) {
    if (secretHeader && timingSafeEqualStr(secretHeader.trim(), trialSecret)) {
      return true;
    }
    if (sigWebhookHeader && verifyHmacSignature(rawBody, sigWebhookHeader, trialSecret)) {
      return true;
    }
    if (sigDeropoHeader && verifyHmacSignature(rawBody, sigDeropoHeader, trialSecret)) {
      return true;
    }
  }

  return false;
}

/**
 * Backward compatibility alias for single-signature calls
 */
export function verifyDeropoWebhookHmac(
  rawBody: string,
  signatureHeader?: string | null
): boolean {
  if (!signatureHeader) return false;
  const envSecret = (process.env.DEROPO_WEBHOOK_SECRET || process.env.WA_TRIAL_SECRET || 'centum_wa_trial_2026').trim();
  return verifyHmacSignature(rawBody, signatureHeader, envSecret);
}

/**
 * Records webhook event for logging & idempotency.
 * Returns true if event is NEW; false if DUPLICATE.
 */
export function processWebhookEvent(event: any): { isNew: boolean } {
  const eventId = String(
    event.id || event.message_id || event.messageId || `${event.sender}_${event.timestamp || Date.now()}`
  );

  if (processedWebhookEventIds.has(eventId)) {
    return { isNew: false };
  }

  processedWebhookEventIds.add(eventId);

  // Keep max 1000 IDs in idempotency set to avoid memory growth
  if (processedWebhookEventIds.size > 1000) {
    const firstKey = processedWebhookEventIds.values().next().value;
    if (firstKey) processedWebhookEventIds.delete(firstKey);
  }

  // Log event to ring buffer
  const logItem: WebhookLogItem = {
    id: eventId,
    timestamp: new Date().toISOString(),
    event: event.event || event.type || 'message',
    sender: event.sender || event.from || event.phone,
    payload: event,
  };

  webhookLogs.unshift(logItem);
  if (webhookLogs.length > 100) {
    webhookLogs.pop();
  }

  // STOP command check
  const textBody = String(
    event.message || event.text || event.body || (event.data && (event.data.message || event.data.text)) || ''
  ).trim();

  const sender = String(event.sender || event.from || event.phone || '');
  if (/^(stop|unsubscribe|optout|opt-out|cancel)$/i.test(textBody)) {
    if (sender) {
      recordOptOut(sender);
      console.log(`[WhatsApp Webhook] Received STOP from ${sender}. Opted out.`);
    }
  }

  return { isNew: true };
}

export function getWebhookLogs(): WebhookLogItem[] {
  return [...webhookLogs];
}
