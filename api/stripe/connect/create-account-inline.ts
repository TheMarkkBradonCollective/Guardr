import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { guardId, email } = (req.body ?? {}) as { guardId?: string; email?: string };
  if (!guardId || !email) {
    return res.status(400).json({ error: 'guardId and email are required' });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === 'sk_test_placeholder') {
    return res.status(503).json({ error: 'Stripe is not configured' });
  }

  try {
    const { default: StripeSdk } = await import('stripe');
    const stripe = new StripeSdk(key);
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      metadata: { guard_id: guardId },
      capabilities: { transfers: { requested: true } },
      business_type: 'individual',
    });
    return res.status(200).json({ accountId: account.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create Connect account';
    return res.status(500).json({ error: message });
  }
}
