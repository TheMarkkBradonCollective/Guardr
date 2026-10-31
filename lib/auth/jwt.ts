import { createHmac, timingSafeEqual } from 'node:crypto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  profileKind: 'guard' | 'client' | 'staff';
  profileId: string;
  exp: number;
  iat: number;
}

const DEFAULT_TTL_SEC = 60 * 60 * 24 * 7;

function b64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64url');
}

function fromB64url(input: string): Buffer {
  return Buffer.from(input, 'base64url');
}

export function signJwt(payload: Omit<JwtPayload, 'exp' | 'iat'>, secret: string, ttlSec = DEFAULT_TTL_SEC): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(
    JSON.stringify({
      ...payload,
      iat: now,
      exp: now + ttlSec,
    } satisfies JwtPayload)
  );
  const data = `${header}.${body}`;
  const sig = createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyJwt(token: string, secret: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = createHmac('sha256', secret).update(`${header}.${body}`).digest();
  const actual = fromB64url(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(fromB64url(body).toString('utf8')) as JwtPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Web Crypto variant for Cloudflare Workers (no node:crypto). */
export async function signJwtWeb(
  payload: Omit<JwtPayload, 'exp' | 'iat'>,
  secret: string,
  ttlSec = DEFAULT_TTL_SEC
): Promise<string> {
  const enc = new TextEncoder();
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(
    JSON.stringify({
      ...payload,
      iat: now,
      exp: now + ttlSec,
    })
  );
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const sig = b64url(Buffer.from(sigBuf));
  return `${data}.${sig}`;
}

export async function verifyJwtWeb(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const data = `${header}.${body}`;
  const sigBytes = fromB64url(sig);
  const ok = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(data));
  if (!ok) return null;
  try {
    const payload = JSON.parse(fromB64url(body).toString('utf8')) as JwtPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
