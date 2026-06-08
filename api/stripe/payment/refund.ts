import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripe } from '../../../server/stripeShared';
import { getSupabaseAdmin } from '../../../server/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured' });
  }

  const { paymentIntentId, jobId } = (req.body ?? {}) as {
    paymentIntentId?: string;
    jobId?: string;
  };

  if (!paymentIntentId) {
    return res.status(400).json({ error: 'paymentIntentId is required' });
  }

  try {
    const refund = await stripe.refunds.create({ payment_intent: paymentIntentId });

    const db = getSupabaseAdmin();
    if (db && jobId) {
      await db.from('security_requests').update({ payment_status: 'unpaid' }).eq('id', jobId);
      await db
        .from('payments')
        .update({ status: 'refunded', updated_at: new Date().toISOString() })
        .eq('job_id', jobId);
    }

    return res.status(200).json({ refundId: refund.id, status: refund.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Refund failed';
    return res.status(500).json({ error: message });
  }
}
