import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyApiCors } from '../_push/apiCors';

const APK_COOKIE = 'guardr_apk';
const PWA_COOKIE = 'guardr_pwa';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function cookieValue(version: string, versionCode?: string): string {
  return versionCode ? `${version}|${versionCode}` : version;
}

function setCookie(res: VercelResponse, name: string, value: string): void {
  res.setHeader(
    'Set-Cookie',
    `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax; Secure`
  );
}

/** Record APK/PWA install version in a first-party cookie for the download page. */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (applyApiCors(req, res)) return;

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const surface = String(req.query.surface ?? '').trim();
  const version = String(req.query.version ?? '').trim();
  const versionCode = String(req.query.versionCode ?? '').trim();

  if (!surface || !version) {
    return res.status(400).json({ error: 'surface and version are required' });
  }
  if (surface !== 'apk' && surface !== 'pwa') {
    return res.status(400).json({ error: 'surface must be apk or pwa' });
  }

  const value = cookieValue(version, versionCode || undefined);

  if (surface === 'apk') {
    setCookie(res, APK_COOKIE, value);
    // APK replaces a mistaken PWA record on shared devices.
    res.setHeader('Set-Cookie', `${PWA_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure`);
  } else {
    setCookie(res, PWA_COOKIE, value);
  }

  return res.status(200).json({ ok: true, surface, version });
}
