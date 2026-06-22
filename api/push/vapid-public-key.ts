import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Public VAPID key — no database required. */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  if (!publicKey) {
    return res.status(503).json({ error: 'VAPID public key is not configured' });
  }

  return res.status(200).json({ publicKey });
}
