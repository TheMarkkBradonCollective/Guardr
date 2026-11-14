/**
 * Session tokens carry `pwv`, a keyed fingerprint of the login's password hash.
 * Changing the password changes the hash, so every token issued before the change
 * stops verifying. The fingerprint is an HMAC, so the token reveals nothing about the hash.
 */
function b64url(bytes: ArrayBuffer): string {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function passwordVersion(secret: string, passwordHash: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(`pwv:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(passwordHash));
  return b64url(sig).slice(0, 22);
}

/** Constant-time-ish comparison for short strings. */
export function sameVersion(a: unknown, b: string): boolean {
  if (typeof a !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
