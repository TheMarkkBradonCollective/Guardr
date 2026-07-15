import type { VercelRequest, VercelResponse } from '@vercel/node';

const GUARDR_ORIGIN = /^https:\/\/([a-z0-9-]+\.)?guardr\.co$/i;
const CAPACITOR_ORIGIN = /^https:\/\/localhost(?::\d+)?$/i;

export function isAllowedApiOrigin(origin: string): boolean {
  return GUARDR_ORIGIN.test(origin) || CAPACITOR_ORIGIN.test(origin) || /^capacitor:\/\//i.test(origin);
}

/** Apply CORS for Guardr web + Capacitor APK (https://localhost). Returns true if OPTIONS was handled. */
export function applyApiCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin;
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
