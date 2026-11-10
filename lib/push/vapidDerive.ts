/**
 * Derive the VAPID public key from VAPID_PRIVATE_KEY (base64url, raw 32-byte P-256 scalar)
 * when VAPID_PUBLIC_KEY is not set. Uses WebCrypto: import as PKCS#8 without a public
 * key, then export as JWK to read x/y.
 */
let derived: string | null | undefined;

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function deriveVapidPublicKey(privateKeyB64url: string): Promise<string> {
  const d = b64urlToBytes(privateKeyB64url.trim());
  if (d.length !== 32) throw new Error('VAPID private key must be 32 bytes');
  const prefix = Uint8Array.from([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01,
    0x01, 0x04, 0x20,
  ]);
  const der = new Uint8Array(prefix.length + 32);
  der.set(prefix);
  der.set(d, prefix.length);
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
  const jwk = (await crypto.subtle.exportKey('jwk', key)) as JsonWebKey;
  if (!jwk.x || !jwk.y) throw new Error('Could not derive VAPID public key');
  const out = new Uint8Array(65);
  out[0] = 0x04;
  out.set(b64urlToBytes(jwk.x), 1);
  out.set(b64urlToBytes(jwk.y), 33);
  return bytesToB64url(out);
}

/** Fill process.env.VAPID_PUBLIC_KEY from the private key when it is missing. */
export async function ensureVapidPublicKey(): Promise<void> {
  if (process.env.VAPID_PUBLIC_KEY?.trim()) return;
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!priv) return;
  if (derived === undefined) {
    try {
      derived = await deriveVapidPublicKey(priv);
    } catch (err) {
      console.error('VAPID public key derivation failed', err instanceof Error ? err.message : err);
      derived = null;
    }
  }
  if (derived) process.env.VAPID_PUBLIC_KEY = derived;
}
