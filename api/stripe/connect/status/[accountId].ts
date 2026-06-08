import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripe } from '../../../_lib/stripeClient';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = await getStripe();
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured' });
  }

  const accountId = req.query.accountId as string;
  if (!accountId) {
    return res.status(400).json({ error: 'accountId is required' });
  }

  try {
    const account = await stripe.accounts.retrieve(accountId);
    return res.status(200).json({
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve account';
    return res.status(500).json({ error: message });
  }
}
