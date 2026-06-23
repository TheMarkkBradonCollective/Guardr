import type { Express, Request, Response } from 'express';
import { scanAndNotifyMissedCheckins } from '../lib/push/missedCheckins';
import { getSupabaseAdmin } from './supabaseAdmin';

function isCronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.authorization;
  return auth === `Bearer ${secret}`;
}

export function registerCronRoutes(app: Express): void {
  app.get('/api/cron/missed-checkins', async (req: Request, res: Response) => {
    if (!isCronAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized — cron secret required' });
    }

    try {
      const db = getSupabaseAdmin();
      if (!db) {
        return res.status(503).json({ error: 'Database is not configured' });
      }

      const result = await scanAndNotifyMissedCheckins(db);
      return res.status(200).json({ ok: true, ...result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Missed check-in scan failed';
      console.error('Cron missed-checkins error:', message);
      return res.status(500).json({ error: message });
    }
  });
}
