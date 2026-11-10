import { getSupabaseAdmin } from '../../../../db/adminClient.ts';
import type { VercelRequest, VercelResponse } from '../../../types.ts';
import { getStripe } from '../../../../stripeClient.ts';
import { PAYMENTS_NOT_CONFIGURED_BODY } from '../../../../stripeEnv.ts';
import { createBookingCheckoutSession } from '../../../../stripe/createBookingCheckout.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = await getStripe();
  if (!stripe) {
    return res.status(503).json(PAYMENTS_NOT_CONFIGURED_BODY);
  }

  const { jobId, clientEmail, jobTitle, amountCents } = (req.body ?? {}) as {
    jobId?: string;
    clientEmail?: string;
    jobTitle?: string;
    amountCents?: number;
  };

  try {
    const db = await getSupabaseAdmin();
    const result = await createBookingCheckoutSession(stripe, db, {
      jobId: jobId ?? '',
      clientEmail: clientEmail ?? '',
      jobTitle,
      amountCents: amountCents ?? 0,
    });
    if (result.ok === false) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(200).json({ sessionId: result.sessionId, url: result.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session';
    console.error('Checkout session error:', message);
    return res.status(500).json({ error: message });
  }
}
