import { getSupabaseAdmin } from '../../../../db/adminClient.ts';
import type { VercelRequest, VercelResponse } from '../../../types.ts';
import {
  computeGuardPayoutCents,
  LEGACY_PLATFORM_FEE_PER_HOUR,
} from '../../../../platformFees';

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

  const { jobId, guardConnectAccountId, hourlyRate, durationHours, force } = (req.body ?? {}) as {
    jobId?: string;
    guardConnectAccountId?: string;
    hourlyRate?: number;
    durationHours?: number;
    force?: boolean;
  };

  if (!jobId || !guardConnectAccountId) {
    return res.status(400).json({ error: 'jobId and guardConnectAccountId are required' });
  }

  const db = await getSupabaseAdmin();
  let platformFeePerHour: number | undefined;
  // Pay from the stored job, never from rates/hours sent by the app.
  let payRate = hourlyRate;
  let payHours = durationHours;
  if (db) {
    const { data: job } = await db
      .from('security_requests')
      .select(
        'status, payment_status, assigned_guard_id, guard_payout_method, guard_cash_payout_requested, platform_fee_per_hour, hourly_rate, duration_hours'
      )
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

    if (!['paid', 'held'].includes(String(job.payment_status ?? '')) && !force) {
      return res.status(400).json({ error: 'Job payment must be paid or held before payout' });
    }

    if (job.guard_payout_method === 'cash') {
      return res.status(400).json({ error: 'Guard payout for this job is already settled' });
    }

    if (job.guard_cash_payout_requested) {
      return res.status(400).json({ error: 'Guard payout for this job cannot be released via Stripe' });
    }

    if (job.platform_fee_per_hour != null) {
      platformFeePerHour = Number(job.platform_fee_per_hour);
    }
    payRate = Number(job.hourly_rate ?? 0);
    payHours = Number(job.duration_hours ?? 0);

    // The money goes only to the assigned guard's own Connect account.
    if (!job.assigned_guard_id) {
      return res.status(400).json({ error: 'Job has no assigned guard' });
    }
    const { data: guard } = await db
      .from('guards')
      .select('stripe_connect_account_id')
      .eq('id', String(job.assigned_guard_id))
      .maybeSingle();
    if (!guard?.stripe_connect_account_id || guard.stripe_connect_account_id !== guardConnectAccountId) {
      return res.status(400).json({ error: 'Payout account does not belong to the assigned guard' });
    }
  }

  if (payRate == null || payHours == null || !Number.isFinite(Number(payRate)) || !Number.isFinite(Number(payHours))) {
    return res.status(400).json({ error: 'Job has no pay rate or hours' });
  }

  const amountCents = computeGuardPayoutCents(
    Number(payRate),
    Number(payHours),
    platformFeePerHour ?? LEGACY_PLATFORM_FEE_PER_HOUR
  );
  if (amountCents <= 0) {
    return res.status(400).json({ error: 'Invalid payout amount' });
  }

  try {
    // One transfer per job: a double-click or retry reuses the same Stripe transfer.
    const transfer = await stripe.transfers.create(
      {
        amount: amountCents,
        currency: 'usd',
        destination: guardConnectAccountId,
        metadata: { job_id: jobId },
      },
      { idempotencyKey: `guardr-payout-${jobId}-${guardConnectAccountId}-${amountCents}` }
    );

    if (db) {
      await db
        .from('security_requests')
        .update({ payment_status: 'released', guard_payout_method: 'stripe' })
        .eq('id', jobId);
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
