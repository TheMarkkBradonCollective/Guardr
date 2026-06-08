import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripe } from '../../../server/stripeShared';
import { getSupabaseAdmin } from '../../../server/supabaseAdmin';
import { getSiteUrl } from '../../../server/siteConfig';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured' });
  }

  const { jobId, clientEmail, jobTitle, amountCents } = (req.body ?? {}) as {
    jobId?: string;
    clientEmail?: string;
    jobTitle?: string;
    amountCents?: number;
  };

  if (!jobId || !clientEmail || !amountCents) {
    return res.status(400).json({ error: 'jobId, clientEmail, and amountCents are required' });
  }

  try {
    const base = getSiteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: clientEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: jobTitle || `Guardr Job ${jobId}`,
              description: 'Security services payment — funds held by Guardr until shift completion.',
            },
          },
        },
      ],
      payment_intent_data: {
        metadata: { job_id: jobId },
      },
      metadata: { job_id: jobId },
      success_url: `${base}/?payment=success&job_id=${jobId}`,
      cancel_url: `${base}/?payment=cancelled&job_id=${jobId}`,
    });

    const db = getSupabaseAdmin();
    if (db) {
      await db.from('payments').insert({
        id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        job_id: jobId,
        amount: amountCents / 100,
        stripe_session_id: session.id,
        status: 'pending',
      });
    }

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session';
    console.error('Checkout session error:', message);
    return res.status(500).json({ error: message });
  }
}
