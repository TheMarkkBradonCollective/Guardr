import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { handleMissedCheckins } = await import('../pushRuntime');
    return await handleMissedCheckins(req, res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Missed check-in cron failed to start';
    console.error('Cron bootstrap error:', message, err);
    return res.status(500).json({ error: message });
  }
}
