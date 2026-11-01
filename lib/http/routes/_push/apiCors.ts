import type { VercelRequest, VercelResponse } from '../../types.ts';

const GUARDR_ORIGIN = /^https:\/\/([a-z0-9-]+\.)?guardr\.co$/i;
const WORKER_ORIGIN = /^https:\/\/guardr\.themarkkbrandoncollective-2d9\.workers\.dev$/i;
const CAPACITOR_ORIGIN = /^https:\/\/localhost(?::\d+)?$/i;

export function isAllowedApiOrigin(origin: string): boolean {
  return (
    GUARDR_ORIGIN.test(origin) ||
    WORKER_ORIGIN.test(origin) ||
    CAPACITOR_ORIGIN.test(origin) ||
    /^capacitor:\/\//i.test(origin)
  );
}

/** Apply CORS for Guardr web + Capacitor APK. Returns true if OPTIONS was handled. */
export function applyApiCors(req: VercelRequest, res: VercelResponse): boolean {
  const raw = req.headers.origin;
  const origin = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined;
  if (origin && isAllowedApiOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).end();
    return true;
  }

  return false;
}
