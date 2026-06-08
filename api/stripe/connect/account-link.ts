import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripe } from '../../_lib/stripeClient';
import { getSiteUrl } from '../../_lib/siteConfig';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured' });
  }

  const { accountId } = (req.body ?? {}) as { accountId?: string };
  if (!accountId) {
    return res.status(400).json({ error: 'accountId is required' });
  }

  try {
    const base = getSiteUrl();
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${base}/?stripe_connect=refresh`,
      return_url: `${base}/?stripe_connect=success`,
      type: 'account_onboarding',
    });
    return res.status(200).json({ url: link.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create account link';
    return res.status(500).json({ error: message });
  }
}
