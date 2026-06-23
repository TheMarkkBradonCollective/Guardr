import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scanAndNotifyMissedCheckins } from '../pushMissedCheckins';
import { getSupabaseAdmin } from '../pushShared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
      return res.status(401).json({ error: 'Unauthorized — cron secret required' });
    }

    const db = await getSupabaseAdmin();
    if (!db) {
      return res.status(503).json({ error: 'Database is not configured' });
    }

    const result = await scanAndNotifyMissedCheckins(db);
    return res.status(200).json({ ok: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Missed check-in cron failed';
    console.error('Missed check-in cron error:', message, err);
    return res.status(500).json({ error: message });
  }
}
