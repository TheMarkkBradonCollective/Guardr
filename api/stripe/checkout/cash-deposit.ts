import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Cash payments removed — Stripe is the only payment rail. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return res.status(410).json({
    error: 'Cash deposits are no longer supported. Client payments and guard payouts use Stripe only.',
  });
}
