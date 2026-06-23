import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scanAndNotifyMissedCheckins } from '../_push/missedCheckins';
import { withPushHandler } from '../_push/vercelAdapter';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized — cron secret required' });
  }

  return withPushHandler(req, res, ['GET', 'POST'], async (db) => {
    const result = await scanAndNotifyMissedCheckins(db);
    return { status: 200, body: { ok: true, ...result } };
  });
}
