import type { VercelRequest, VercelResponse } from '../../../types.ts';
import { getStripe } from '../../../../stripeClient.ts';
import { PAYMENTS_NOT_CONFIGURED_BODY } from '../../../../stripeEnv.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = await getStripe();
  if (!stripe) {
    return res.status(503).json(PAYMENTS_NOT_CONFIGURED_BODY);
  }

  const { accountId, component } = (req.body ?? {}) as {
    accountId?: string;
    /** account_onboarding | account_management */
    component?: string;
  };

  if (!accountId) {
    return res.status(400).json({ error: 'accountId is required' });
  }

  const mode = component === 'account_management' ? 'account_management' : 'account_onboarding';

  try {
    const session = await stripe.accountSessions.create({
      account: accountId,
      components: {
        [mode]: { enabled: true },
      },
    });

    if (!session.client_secret) {
      return res.status(500).json({ error: 'Stripe did not return an account session secret' });
    }

    return res.status(200).json({ clientSecret: session.client_secret });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create Connect account session';
    console.error('Connect account session error:', message);
    return res.status(500).json({ error: message });
  }
}
