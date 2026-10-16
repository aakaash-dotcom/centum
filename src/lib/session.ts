import crypto from 'crypto';

export interface SessionStudent {
  name: string;
  phone: string;
  standard: string;
  medium: string;
  stream?: string;
  district?: string;
  plan?: string;
  isAdmin?: boolean;
}

export interface SessionPayload {
  student: SessionStudent;
  iat: number;
  exp: number;
}

const SESSION_SECRET = process.env.APPS_SCRIPT_SECRET || 'centum_session_secret_2026';

export function createSessionToken(student: SessionStudent): string {
  const iat = Date.now();
  const exp = iat + 365 * 24 * 60 * 60 * 1000; // ~1 year
  const payload: SessionPayload = { student, iat, exp };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');
  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as SessionPayload;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
