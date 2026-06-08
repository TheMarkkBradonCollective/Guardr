import type { VercelRequest, VercelResponse } from '@vercel/node';

const GUARD_PAY_PLATFORM_FEE = 5;

function computeGuardPayoutCents(hourlyRate: number, durationHours: number): number {
  const guardPay = Math.max(0, hourlyRate - GUARD_PAY_PLATFORM_FEE);
  return Math.round(durationHours * guardPay * 100);
}

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

  const { jobId, guardConnectAccountId, hourlyRate, durationHours, force } = (req.body ?? {}) as {
    jobId?: string;
    guardConnectAccountId?: string;
    hourlyRate?: number;
    durationHours?: number;
    force?: boolean;
  };

  if (!jobId || !guardConnectAccountId || hourlyRate == null || durationHours == null) {
    return res.status(400).json({
      error: 'jobId, guardConnectAccountId, hourlyRate, and durationHours are required',
    });
  }

  const db = await getSupabaseAdmin();
  if (db) {
    const { data: job } = await db
      .from('security_requests')
      .select('status, payment_status, assigned_guard_id')
      .eq('id', jobId)
      .maybeSingle();

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'completed' && !force) {
      return res.status(400).json({ error: 'Job must be completed before payout release' });
    }

    if (job.payment_status === 'released') {
      return res.status(400).json({ error: 'Payout already released for this job' });
    }

    if (!['paid', 'held'].includes(job.payment_status ?? '') && !force) {
      return res.status(400).json({ error: 'Job payment must be paid or held before payout' });
    }
  }

  const amountCents = computeGuardPayoutCents(hourlyRate, durationHours);
  if (amountCents <= 0) {
    return res.status(400).json({ error: 'Invalid payout amount' });
  }

  try {
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'usd',
      destination: guardConnectAccountId,
      metadata: { job_id: jobId },
    });

    if (db) {
      await db.from('security_requests').update({ payment_status: 'released' }).eq('id', jobId);
      await db
        .from('payments')
        .update({
          status: 'released',
          stripe_transfer_id: transfer.id,
          updated_at: new Date().toISOString(),
        })
        .eq('job_id', jobId);
    }

    return res.status(200).json({
      transferId: transfer.id,
      amountCents,
      status: 'released',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Transfer failed';
    console.error('Payout release error:', message);

    if (db) {
      await db
        .from('payments')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('job_id', jobId);
    }

    return res.status(500).json({ error: message });
  }
}
