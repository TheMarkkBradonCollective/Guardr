import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scanAndNotifyMissedCheckins } from '../../lib/push/missedCheckins';
import { getSupabaseAdmin } from '../../lib/push/vercelAdapter';

function isCronAuthorized(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.authorization;
  return auth === `Bearer ${secret}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isCronAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized — cron secret required' });
  }

  try {
    const db = await getSupabaseAdmin();
    if (!db) {
      return res.status(503).json({ error: 'Database is not configured' });
    }

    const result = await scanAndNotifyMissedCheckins(db);
    return res.status(200).json({ ok: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Missed check-in scan failed';
    console.error('Cron missed-checkins error:', message, err);
    return res.status(500).json({ error: message });
  }
}
