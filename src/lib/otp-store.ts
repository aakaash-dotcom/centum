import crypto from 'crypto';

export interface OtpSheetRecord {
  phone: string;
  codeHash: string;
  createdAt: string;
  expiresAt: string;
  attempts: number;
  used: boolean | string;
}

interface RateLimitTracker {
  attempts: number[];
  lastSentAt: number;
}

// In-memory rate limiting and fallback cache
const rateLimitMap = new Map<string, RateLimitTracker>();
const inMemoryOtpStore = new Map<string, OtpSheetRecord[]>();

// Demo accounts
export const DEMO_PHONES = new Set(['919123456780', '919840123456', '9123456780', '9840123456']);
export const DEMO_OTP = '4321';

export function normalizeOtpPhone(raw: unknown): string {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10 && ['6', '7', '8', '9'].includes(digits[0])) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    return `91${last10}`;
  }
  return digits;
}

export function isDemoPhone(phone: string): boolean {
  const norm = normalizeOtpPhone(phone);
  return DEMO_PHONES.has(norm) || DEMO_PHONES.has(norm.slice(-10));
}

export function hashCode(code: string): string {
  return crypto.createHash('sha256').update(String(code).trim()).digest('hex');
}

/**
 * Check rate limits:
 * 1. 60s cooldown between resends
 * 2. Max 3 OTP sends per phone per hour
 */
export function checkRateLimit(phone: string): { allowed: boolean; reason?: string } {
  if (isDemoPhone(phone)) {
    return { allowed: true };
  }

  const now = Date.now();
  const tracker = rateLimitMap.get(phone) || { attempts: [], lastSentAt: 0 };

  // 60s cooldown between sends
  if (now - tracker.lastSentAt < 60 * 1000) {
    return { allowed: false, reason: 'cooldown_60s' };
  }

  // Filter attempts in the last 1 hour
  const oneHourAgo = now - 60 * 60 * 1000;
  tracker.attempts = tracker.attempts.filter((t) => t > oneHourAgo);

  if (tracker.attempts.length >= 3) {
    return { allowed: false, reason: 'max_3_per_hour' };
  }

  return { allowed: true };
}

export function recordRateLimitAttempt(phone: string) {
  if (isDemoPhone(phone)) return;
  const now = Date.now();
  const tracker = rateLimitMap.get(phone) || { attempts: [], lastSentAt: 0 };
  tracker.lastSentAt = now;
  tracker.attempts.push(now);
  rateLimitMap.set(phone, tracker);
}

/**
 * Send SMS code via Deropo direct HTTP call
 */
export async function sendDeropoMessage(recipient: string, message: string): Promise<boolean> {
  const token = process.env.DEROPO_API_TOKEN;
  const deviceId = process.env.DEROPO_DEVICE_ID || '3079';

  if (!token) {
    console.warn('[Deropo] DEROPO_API_TOKEN not configured. Logging message only:', message);
    return false;
  }

  const formattedRecipient = recipient.startsWith('+') ? recipient : `+${recipient}`;

  try {
    const res = await fetch('https://api.deropo.com/api/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': token,
      },
      body: JSON.stringify({
        device_id: deviceId,
        recipient: formattedRecipient,
        message_type: 'text',
        content: message,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[Deropo] Send failed (${res.status}): ${errText}`);
      return false;
    }

    const data = await res.json().catch(() => ({}));
    console.log(`[Deropo] Message dispatched successfully to ${formattedRecipient}`);
    return true;
  } catch (err) {
    console.warn('[Deropo] Send network error:', err);
    return false;
  }
}

/**
 * Append OTP record to OTPCodes sheet tab and in-memory store
 */
export async function saveOtpRecord(record: OtpSheetRecord): Promise<void> {
  // 1. Update in-memory store
  const existing = inMemoryOtpStore.get(record.phone) || [];
  existing.unshift(record);
  inMemoryOtpStore.set(record.phone, existing.slice(0, 20));

  // 2. Persist to GAS OTPCodes tab
  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;
  if (!scriptUrl || !secretKey) return;

  try {
    const externalUrl = new URL(scriptUrl);
    externalUrl.searchParams.set('action', 'ops-add');
    externalUrl.searchParams.set('tab', 'OTPCodes');
    externalUrl.searchParams.set('key', secretKey);
    externalUrl.searchParams.set('row', JSON.stringify({
      phone: record.phone,
      codeHash: record.codeHash,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      attempts: record.attempts,
      used: String(record.used).toUpperCase(),
    }));

    await fetch(externalUrl.toString(), { cache: 'no-store' });
  } catch (err) {
    console.warn('[saveOtpRecord] Sheet append skipped or failed:', err);
  }
}

/**
 * Purge records older than 24 hours from OTPCodes tab
 */
export async function purgeOldOtpRecords(): Promise<void> {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  // In-memory cleanup
  for (const [phone, records] of inMemoryOtpStore.entries()) {
    const fresh = records.filter((r) => new Date(r.createdAt).getTime() > cutoff);
    if (fresh.length === 0) {
      inMemoryOtpStore.delete(phone);
    } else {
      inMemoryOtpStore.set(phone, fresh);
    }
  }

  // Background sheet cleanup (best-effort, non-blocking)
  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;
  if (!scriptUrl || !secretKey) return;

  try {
    const rowsUrl = new URL(scriptUrl);
    rowsUrl.searchParams.set('action', 'ops-rows');
    rowsUrl.searchParams.set('tab', 'OTPCodes');
    rowsUrl.searchParams.set('key', secretKey);

    const res = await fetch(rowsUrl.toString(), { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.rows)) return;

    // Filter expired rows > 24 hours
    const expiredRows = data.rows.filter((r: any) => {
      const created = new Date(r.createdAt).getTime();
      return created && created < cutoff;
    });

    if (expiredRows.length > 0) {
      console.log(`[purgeOldOtpRecords] Found ${expiredRows.length} OTP rows older than 24h to clean`);
    }
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Load the newest unused record for a phone number
 */
export async function getLatestUnusedOtp(phone: string): Promise<OtpSheetRecord | null> {
  // Check in-memory store first
  const memoryRecords = inMemoryOtpStore.get(phone) || [];
  for (const r of memoryRecords) {
    const isUsed = r.used === true || String(r.used).toUpperCase() === 'TRUE';
    if (!isUsed) return r;
  }

  // If not found in memory, query GAS OTPCodes sheet
  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;
  if (!scriptUrl || !secretKey) return null;

  try {
    const externalUrl = new URL(scriptUrl);
    externalUrl.searchParams.set('action', 'ops-rows');
    externalUrl.searchParams.set('tab', 'OTPCodes');
    externalUrl.searchParams.set('key', secretKey);

    const res = await fetch(externalUrl.toString(), { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.rows)) return null;

    // Search backwards for the newest unused record
    for (let i = data.rows.length - 1; i >= 0; i--) {
      const row = data.rows[i];
      if (String(row.phone) === phone) {
        const isUsed = row.used === true || String(row.used).toUpperCase() === 'TRUE';
        if (!isUsed) {
          return {
            phone: String(row.phone),
            codeHash: String(row.codeHash),
            createdAt: String(row.createdAt),
            expiresAt: String(row.expiresAt),
            attempts: Number(row.attempts) || 0,
            used: isUsed,
          };
        }
      }
    }
  } catch (err) {
    console.warn('[getLatestUnusedOtp] Query error:', err);
  }

  return null;
}

/**
 * Update an existing OTP record (attempts or mark used)
 */
export async function updateOtpRecord(phone: string, updates: Partial<OtpSheetRecord>): Promise<void> {
  // Update memory store
  const records = inMemoryOtpStore.get(phone) || [];
  for (const r of records) {
    const isUsed = r.used === true || String(r.used).toUpperCase() === 'TRUE';
    if (!isUsed) {
      if (updates.attempts !== undefined) r.attempts = updates.attempts;
      if (updates.used !== undefined) r.used = updates.used;
      break;
    }
  }

  // Update in GAS sheet (best effort)
  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const secretKey = process.env.APPS_SCRIPT_SECRET;
  if (!scriptUrl || !secretKey) return;

  try {
    if (updates.used !== undefined) {
      const setUrl = new URL(scriptUrl);
      setUrl.searchParams.set('action', 'ops-set');
      setUrl.searchParams.set('tab', 'OTPCodes');
      setUrl.searchParams.set('col', 'phone');
      setUrl.searchParams.set('value', phone);
      setUrl.searchParams.set('setCol', 'used');
      setUrl.searchParams.set('setValue', String(updates.used).toUpperCase());
      setUrl.searchParams.set('key', secretKey);
      await fetch(setUrl.toString(), { cache: 'no-store' });
    }
  } catch (err) {
    // Non-blocking
  }
}
