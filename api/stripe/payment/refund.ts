import type { VercelRequest, VercelResponse } from '@vercel/node';

async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === 'sk_test_placeholder') return null;
  const { default: StripeSdk } = await import('stripe');
  return new StripeSdk(key);
}

async function getSupabaseAdmin() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = await getStripe();
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

    const db = await getSupabaseAdmin();
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
