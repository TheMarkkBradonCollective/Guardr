import type { VercelRequest, VercelResponse } from '@vercel/node';

function getSiteUrl(): string {
  const configured = process.env.APP_URL?.trim().replace(/\/$/, '');
  if (configured) return configured;
  return process.env.VERCEL ? 'https://www.guardr.co' : 'http://localhost:3000';
}

async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === 'sk_test_placeholder') return null;
  const { default: StripeSdk } = await import('stripe');
  return new StripeSdk(key);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = await getStripe();
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
