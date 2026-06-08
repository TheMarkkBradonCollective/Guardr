import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const configured = !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder';
  return res.status(200).json({
    configured,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
  });
}
