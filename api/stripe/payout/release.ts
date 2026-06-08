import type { VercelRequest, VercelResponse } from '@vercel/node';
import { computeGuardPayoutCents, getStripe } from '../../_lib/stripeClient';
import { markJobReleased } from '../../_lib/stripeShared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = getStripe();
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

  const { getSupabaseAdmin } = await import('../../_lib/supabaseAdmin');
  const db = getSupabaseAdmin();
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

    await markJobReleased(jobId, transfer.id);

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
