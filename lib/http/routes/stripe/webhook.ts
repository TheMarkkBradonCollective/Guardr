import { getSupabaseAdmin } from '../../../db/adminClient.ts';
import type { VercelRequest, VercelResponse } from '../../types.ts';
import type Stripe from 'stripe';
import { getStripe } from '../../../stripeClient.ts';
import {
  PAYMENTS_NOT_CONFIGURED_BODY,
  readStripeWebhookSecrets,
} from '../../../stripeEnv.ts';
import { verifyStripeWebhookEvent } from '../../../stripe/verifyWebhookEvent.ts';

export const config = {
  api: {
    bodyParser: false,
  },
};


async function readRawBody(req: VercelRequest): Promise<Buffer> {
  if (typeof req.rawBody === 'string') return Buffer.from(req.rawBody, 'utf8');
  if (typeof req.body === 'string') return Buffer.from(req.body, 'utf8');
  if (req.body instanceof Uint8Array) return Buffer.from(req.body);
  return Buffer.from('');
}

async function markJobPaid(
  jobId: string,
  paymentIntentId: string | null,
  sessionId: string,
  amountCents: number
) {
  const db = await getSupabaseAdmin();
  if (!db) return;

  const amount = amountCents / 100;

  await db
    .from('security_requests')
    .update({
      payment_status: 'paid',
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq('id', jobId);

  const { data: existing } = await db
    .from('payments')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (existing?.id) {
    await db
      .from('payments')
      .update({
        status: 'paid',
        stripe_payment_intent_id: paymentIntentId,
        amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await db.from('payments').insert({
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      job_id: jobId,
      amount,
      stripe_session_id: sessionId,
      stripe_payment_intent_id: paymentIntentId,
      status: 'paid',
    });
  }

  try {
    const { notifyStripePaymentComplete, notifyJobOpenToGuards } = await import('../../../push/paymentNotifications');
    const { data: jobRow } = await db
      .from('security_requests')
      .select('title, location, status, guards_needed, type, state, start_date, end_date, hourly_rate, guard_pay, team_lead_id')
      .eq('id', jobId)
      .maybeSingle();
    await notifyStripePaymentComplete(db, {
      requestId: jobId,
      body: `Client card payment received for "${jobRow?.title ?? 'job'}" — $${amount.toFixed(2)}`,
    });
    if (jobRow?.status === 'open') {
      await notifyJobOpenToGuards(db, {
        requestId: jobId,
        title: String(jobRow.title ?? 'job'),
        location: jobRow.location != null ? String(jobRow.location) : undefined,
        guardsNeeded: Number(jobRow.guards_needed ?? 1),
        hourlyRate: jobRow.hourly_rate != null ? Number(jobRow.hourly_rate) : undefined,
        guardPay: jobRow.guard_pay != null ? Number(jobRow.guard_pay) : undefined,
        type: String(jobRow.type ?? 'other'),
        state: jobRow.state != null ? String(jobRow.state) : undefined,
        startDate: String(jobRow.start_date ?? ''),
        endDate: String(jobRow.end_date ?? ''),
        body: `"${jobRow.title ?? 'job'}" is paid and open on the map.`,
      });
    }
  } catch (err) {
    console.warn('Payment push notification failed:', err);
  }
}

const PLATFORM_FEE_PER_HOUR = 5;

function computeRequiredCashDeposit(job: {
  estimated_payout: number;
  duration_hours: number;
  platform_fee_per_hour?: number | null;
  guard_payout_method?: string | null;
}): number {
  const feePerHour = job.platform_fee_per_hour ?? PLATFORM_FEE_PER_HOUR;
  if (job.guard_payout_method === 'cash') {
    return Math.round(job.duration_hours * feePerHour * 100) / 100;
  }
  return Number(job.estimated_payout);
}

async function markCashDeposit(
  jobId: string,
  paymentIntentId: string | null,
  sessionId: string,
  amountCents: number,
  eventId: string
) {
  const db = await getSupabaseAdmin();
  if (!db) return;

  const { data: job } = await db
    .from('security_requests')
    .select(
      'estimated_payout, duration_hours, platform_fee_per_hour, guard_payout_method, cash_deposited_amount, client_payment_method'
    )
    .eq('id', jobId)
    .maybeSingle();

  if (!job || job.client_payment_method !== 'cash') return;

  const depositAmount = amountCents / 100;
  const depositedAt = new Date().toISOString();

  // The job total is incremented only if this exact Stripe event has not already
  // been applied. The marker and amount update happen in one PostgreSQL statement.
  const applied = await db.query(
    `UPDATE public.security_requests
     SET cash_deposited_amount = ROUND((COALESCE(cash_deposited_amount, 0) + $1)::numeric, 2),
         cash_deposited_to_stripe = (
           COALESCE(cash_deposited_amount, 0) + $1 >=
           CASE
             WHEN guard_payout_method = 'cash'
               THEN COALESCE(duration_hours, 0) * COALESCE(platform_fee_per_hour, 5)
             ELSE COALESCE(estimated_payout, 0)
           END - 0.01
         ),
         cash_deposited_at = $3,
         cash_deposit_stripe_event_ids =
           COALESCE(cash_deposit_stripe_event_ids, '[]'::jsonb) || jsonb_build_array($2)
     WHERE id = $4
       AND client_payment_method = 'cash'
       AND NOT (COALESCE(cash_deposit_stripe_event_ids, '[]'::jsonb) @> jsonb_build_array($2))
     RETURNING cash_deposited_amount, cash_deposited_to_stripe`,
    [depositAmount, eventId, depositedAt, jobId]
  );
  if (applied.error) throw new Error(applied.error.message);

  const { data: existing } = await db
    .from('payments')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (existing?.id) {
    const updated = await db
      .from('payments')
      .update({
        status: 'paid',
        stripe_payment_intent_id: paymentIntentId,
        amount: depositAmount,
        payment_method: 'stripe',
        updated_at: depositedAt,
      })
      .eq('id', existing.id);
    if (updated.error) throw new Error(updated.error.message);
  } else {
    const inserted = await db.from('payments').insert({
      id: `pay-deposit-${sessionId}`,
      job_id: jobId,
      amount: depositAmount,
      stripe_session_id: sessionId,
      stripe_payment_intent_id: paymentIntentId,
      status: 'paid',
      payment_method: 'stripe',
    });
    if (inserted.error) throw new Error(inserted.error.message);
  }

  const fullyDeposited = Boolean(applied.data?.[0]?.cash_deposited_to_stripe);
  if (applied.data?.length && fullyDeposited) {
    try {
      const { notifyPaymentAttention } = await import('../../../push/paymentNotifications');
      const newDeposited = Number(applied.data[0].cash_deposited_amount ?? 0);
      await notifyPaymentAttention(db, {
        requestId: jobId,
        body: `Cash deposit completed for job — $${newDeposited.toFixed(2)} received via Stripe`,
      });
    } catch (err) {
      console.warn('Cash deposit push notification failed:', err);
    }
  }
}

async function applyPaidScheduleChange(
  jobId: string,
  paymentIntentId: string | null,
  sessionId: string,
  amountCents: number
) {
  const db = await getSupabaseAdmin();
  if (!db) return;

  const amount = amountCents / 100;
  const paidAt = new Date().toISOString();

  const { data: job } = await db
    .from('security_requests')
    .select(
      'pending_start_date, pending_end_date, pending_duration_hours, pending_estimated_payout, hourly_rate, guards_needed, guard_pay'
    )
    .eq('id', jobId)
    .maybeSingle();

  if (!job?.pending_start_date || !job.pending_end_date || job.pending_duration_hours == null) {
    const existingPayment = await db
      .from('payments')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();
    if (existingPayment.data?.id) {
      const finalized = await db
        .from('payments')
        .update({
          status: 'paid',
          stripe_payment_intent_id: paymentIntentId,
          amount,
          payment_method: 'stripe',
          updated_at: paidAt,
        })
        .eq('id', existingPayment.data.id);
      if (finalized.error) throw new Error(finalized.error.message);
    }
    return;
  }

  const guardsNeeded = Number(job.guards_needed ?? 1);
  const durationHours = Number(job.pending_duration_hours);
  const estimatedPayout =
    job.pending_estimated_payout != null
      ? Number(job.pending_estimated_payout)
      : Math.round(durationHours * Number(job.hourly_rate) * guardsNeeded * 100) / 100;

  await db
    .from('security_requests')
    .update({
      start_date: job.pending_start_date,
      end_date: job.pending_end_date,
      duration_hours: durationHours,
      estimated_payout: estimatedPayout,
      guard_pay: job.guard_pay,
      pending_start_date: null,
      pending_end_date: null,
      pending_duration_hours: null,
      pending_estimated_payout: null,
      schedule_change_status: 'none',
      schedule_change_requested_at: null,
      schedule_change_requested_by: null,
      schedule_change_extra_amount: null,
    })
    .eq('id', jobId);

  const { data: existing } = await db
    .from('payments')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (existing?.id) {
    await db
      .from('payments')
      .update({
        status: 'paid',
        stripe_payment_intent_id: paymentIntentId,
        amount,
        payment_method: 'stripe',
        updated_at: paidAt,
      })
      .eq('id', existing.id);
  } else {
    await db.from('payments').insert({
      id: `pay-schedule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      job_id: jobId,
      amount,
      stripe_session_id: sessionId,
      stripe_payment_intent_id: paymentIntentId,
      status: 'paid',
      payment_method: 'stripe',
    });
  }

  try {
    const { notifyPaymentAttention } = await import('../../../push/paymentNotifications');
    await notifyPaymentAttention(db, {
      requestId: jobId,
      body: `Schedule extension paid — $${amount.toFixed(2)}. Shift times are now live.`,
    });
  } catch (err) {
    console.warn('Schedule change payment push notification failed:', err);
  }
}

async function markOvertimePaid(
  jobId: string,
  paymentIntentId: string | null,
  sessionId: string,
  amountCents: number
) {
  const db = await getSupabaseAdmin();
  if (!db) return;

  const amount = amountCents / 100;
  const paidAt = new Date().toISOString();

  const { data: job } = await db
    .from('security_requests')
    .select(
      'scheduled_duration_hours, scheduled_estimated_payout, overtime_hours, overtime_amount, duration_hours, estimated_payout, overtime_payment_status'
    )
    .eq('id', jobId)
    .maybeSingle();

  if (job?.overtime_payment_status !== 'paid') {
    const scheduledDuration = Number(job?.scheduled_duration_hours ?? job?.duration_hours ?? 0);
    const scheduledPayout = Number(job?.scheduled_estimated_payout ?? job?.estimated_payout ?? 0);
    const overtimeHours = Number(job?.overtime_hours ?? 0);
    const overtimeAmount = Number(job?.overtime_amount ?? 0);

    const applied = await db
      .from('security_requests')
      .update({
        overtime_payment_status: 'paid',
        overtime_status: 'paid',
        overtime_client_payment_method: 'stripe',
        overtime_client_cash_payment_requested: false,
        overtime_client_cash_payment_requested_at: null,
        duration_hours: Math.round((scheduledDuration + overtimeHours) * 100) / 100,
        estimated_payout: Math.round((scheduledPayout + overtimeAmount) * 100) / 100,
      })
      .eq('id', jobId);
    if (applied.error) throw new Error(applied.error.message);
  }

  const { data: existing } = await db
    .from('payments')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (existing?.id) {
    await db
      .from('payments')
      .update({
        status: 'paid',
        stripe_payment_intent_id: paymentIntentId,
        amount,
        payment_method: 'stripe',
        updated_at: paidAt,
      })
      .eq('id', existing.id);
  } else {
    await db.from('payments').insert({
      id: `pay-overtime-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      job_id: jobId,
      amount,
      stripe_session_id: sessionId,
      stripe_payment_intent_id: paymentIntentId,
      status: 'paid',
      payment_method: 'stripe',
    });
  }

  try {
    const { notifyPaymentAttention } = await import('../../../push/paymentNotifications');
    await notifyPaymentAttention(db, {
      requestId: jobId,
      body: `Overtime payment received — $${amount.toFixed(2)}`,
    });
  } catch (err) {
    console.warn('Overtime payment push notification failed:', err);
  }
}

async function markTipPaid(
  jobId: string,
  paymentIntentId: string | null,
  sessionId: string,
  amountCents: number
) {
  const db = await getSupabaseAdmin();
  if (!db) return;

  const amount = amountCents / 100;
  const paidAt = new Date().toISOString();

  const { data: job } = await db
    .from('security_requests')
    .select('assigned_guard_id')
    .eq('id', jobId)
    .maybeSingle();

  const guardId = typeof job?.assigned_guard_id === 'string' ? job.assigned_guard_id : null;
  let connectAccountId: string | null = null;
  if (guardId) {
    const { data: guard } = await db
      .from('guards')
      .select('stripe_connect_account_id')
      .eq('id', guardId)
      .maybeSingle();
    connectAccountId =
      typeof guard?.stripe_connect_account_id === 'string' ? guard.stripe_connect_account_id : null;
  }

  const { data: existing } = await db
    .from('payments')
    .select('id, stripe_transfer_id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (existing?.id) {
    const updated = await db
      .from('payments')
      .update({
        status: 'paid',
        stripe_payment_intent_id: paymentIntentId,
        amount,
        payment_method: 'stripe',
        updated_at: paidAt,
      })
      .eq('id', existing.id);
    if (updated.error) throw new Error(updated.error.message);
  } else {
    const inserted = await db.from('payments').insert({
      id: `pay-tip-${sessionId}`,
      job_id: jobId,
      amount,
      stripe_session_id: sessionId,
      stripe_payment_intent_id: paymentIntentId,
      status: 'paid',
      payment_method: 'stripe',
    });
    if (inserted.error) throw new Error(inserted.error.message);
  }

  await db
    .from('security_requests')
    .update({
      tip_amount: amount,
      tip_payment_status: 'paid',
      tip_stripe_session_id: sessionId,
      tip_stripe_payment_intent_id: paymentIntentId,
      tip_paid_at: paidAt,
    })
    .eq('id', jobId);

  // Stripe's idempotency key protects the guard transfer if the webhook is
  // retried after Stripe created the transfer but before Neon stored its ID.
  if (connectAccountId && amountCents > 0 && !existing?.stripe_transfer_id) {
    const stripe = await getStripe();
    if (!stripe) throw new Error('Stripe is unavailable while releasing the tip');
    const transfer = await stripe.transfers.create(
      {
        amount: amountCents,
        currency: 'usd',
        destination: connectAccountId,
        metadata: { job_id: jobId, checkout_type: 'tip', checkout_session_id: sessionId },
      },
      { idempotencyKey: `guardr-tip-transfer-${sessionId}` }
    );
    const transferUpdate = await db
      .from('payments')
      .update({
        stripe_transfer_id: transfer.id,
        status: 'released',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_session_id', sessionId);
    if (transferUpdate.error) throw new Error(transferUpdate.error.message);
  }

  try {
    const { notifyPaymentAttention } = await import('../../../push/paymentNotifications');
    await notifyPaymentAttention(db, {
      requestId: jobId,
      body: `Tip received — $${amount.toFixed(2)}`,
    });
  } catch (err) {
    console.warn('Tip payment push notification failed:', err);
  }

  if (guardId) {
    try {
      const { dispatchPushNotification } = await import('../../../push/delivery');
      const { data: request } = await db
        .from('security_requests')
        .select('title')
        .eq('id', jobId)
        .maybeSingle();
      await dispatchPushNotification(db, {
        userId: guardId,
        title: 'You received a tip',
        body: `A client left a $${amount.toFixed(2)} tip on "${request?.title ?? 'your shift'}".`,
        type: 'payout_ready',
        requestId: jobId,
      });
    } catch (err) {
      console.warn('Tip guard notification failed:', err);
    }
  }
}

async function markJobReleased(jobId: string, transferId: string) {
  const db = await getSupabaseAdmin();
  if (!db) return;

  await db
    .from('security_requests')
    .update({ payment_status: 'released', guard_payout_method: 'stripe' })
    .eq('id', jobId);
  await db
    .from('payments')
    .update({
      status: 'released',
      stripe_transfer_id: transferId,
      updated_at: new Date().toISOString(),
    })
    .eq('job_id', jobId);

  try {
    const { notifyPaymentAttention } = await import('../../../push/paymentNotifications');
    await notifyPaymentAttention(db, {
      requestId: jobId,
      body: 'Guard payout released via Stripe',
    });
  } catch (err) {
    console.warn('Payout release push notification failed:', err);
  }
}

async function processStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
        break;
      }
      const jobId = session.metadata?.job_id;
      if (!jobId) break;

      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      if (session.metadata?.checkout_type === 'cash_deposit') {
        await markCashDeposit(jobId, paymentIntentId, session.id, session.amount_total ?? 0, event.id);
      } else if (session.metadata?.checkout_type === 'overtime') {
        await markOvertimePaid(jobId, paymentIntentId, session.id, session.amount_total ?? 0);
      } else if (session.metadata?.checkout_type === 'schedule_change') {
        await applyPaidScheduleChange(jobId, paymentIntentId, session.id, session.amount_total ?? 0);
      } else if (session.metadata?.checkout_type === 'tip') {
        await markTipPaid(jobId, paymentIntentId, session.id, session.amount_total ?? 0);
      } else {
        await markJobPaid(jobId, paymentIntentId, session.id, session.amount_total ?? 0);
      }
      break;
    }

    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent;
      const jobId = intent.metadata?.job_id;
      if (!jobId) break;
      // These payment types are finalized by checkout.session.completed, which
      // has the canonical Checkout Session ID used by the pending payment row.
      // Handling them here can create duplicate rows or apply overtime twice.
      if (['cash_deposit', 'overtime', 'schedule_change', 'tip'].includes(String(intent.metadata?.checkout_type ?? ''))) {
        break;
      }

      if (intent.metadata?.checkout_type === 'cash_deposit') {
        const db = await getSupabaseAdmin();
        if (db) {
          await db
            .from('payments')
            .update({
              status: 'paid',
              stripe_payment_intent_id: intent.id,
              amount: (intent.amount_received ?? intent.amount) / 100,
              payment_method: 'stripe',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', intent.id);
        }
        break;
      }

      if (intent.metadata?.checkout_type === 'overtime') {
        // Checkout Session completion applies the overtime schedule change.
        // This event only confirms payment, preventing the same hours being added twice.
        const db = await getSupabaseAdmin();
        if (db) {
          await db
            .from('payments')
            .update({
              status: 'paid',
              stripe_payment_intent_id: intent.id,
              amount: (intent.amount_received ?? intent.amount) / 100,
              payment_method: 'stripe',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', intent.id);
        }
        break;
      }

      if (intent.metadata?.checkout_type === 'schedule_change') {
        await applyPaidScheduleChange(
          jobId,
          intent.id,
          intent.id,
          intent.amount_received ?? intent.amount
        );
        break;
      }

      if (intent.metadata?.checkout_type === 'tip') {
        const db = await getSupabaseAdmin();
        if (db) {
          await markTipPaid(jobId, intent.id, intent.id, intent.amount_received ?? intent.amount);
        }
        break;
      }

      const db = await getSupabaseAdmin();
      if (db) {
        await db
          .from('security_requests')
          .update({
            payment_status: 'paid',
            stripe_payment_intent_id: intent.id,
          })
          .eq('id', jobId);

        await db
          .from('payments')
          .update({
            status: 'paid',
            stripe_payment_intent_id: intent.id,
            amount: (intent.amount_received ?? intent.amount) / 100,
            updated_at: new Date().toISOString(),
          })
          .eq('job_id', jobId);
      }
      break;
    }

    case 'transfer.created':
    case 'transfer.updated': {
      const transfer = event.data.object as Stripe.Transfer;
      const jobId = transfer.metadata?.job_id;
      if (jobId && transfer.metadata?.checkout_type !== 'tip' && !transfer.reversed) {
        await markJobReleased(jobId, transfer.id);
      }
      break;
    }

    case 'transfer.reversed': {
      const transfer = event.data.object as Stripe.Transfer;
      const jobId = transfer.metadata?.job_id;
      const db = await getSupabaseAdmin();
      if (db && jobId && transfer.metadata?.checkout_type === 'tip') {
        await db
          .from('payments')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('stripe_transfer_id', transfer.id);
      } else if (db && jobId) {
        await db
          .from('payments')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('job_id', jobId);
      }
      console.error('Stripe transfer reversed:', transfer.id, jobId);
      break;
    }

    default:
      break;
  }
}

async function recordStripeReceipt(
  db: Awaited<ReturnType<typeof getSupabaseAdmin>>,
  event: Stripe.Event
): Promise<void> {
  if (!db) throw new Error('Billing database is unavailable');

  let objectId: string;
  let paymentIntentId: string | null;
  let sessionId: string | null = null;
  let jobId: string | null;
  let amountMinor: number;
  let currency: string;
  let checkoutType = 'job_payment';

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') return;
    objectId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? session.id;
    paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;
    sessionId = session.id;
    jobId = session.metadata?.job_id ?? null;
    amountMinor = session.amount_total ?? 0;
    currency = session.currency ?? 'usd';
    checkoutType = session.metadata?.checkout_type ?? 'job_payment';
  } else if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;
    checkoutType = intent.metadata?.checkout_type ?? 'job_payment';
    // Checkout-specific handlers use the canonical session event to avoid
    // recording the same underlying payment before its payment row is linked.
    if (['cash_deposit', 'overtime', 'schedule_change', 'tip'].includes(checkoutType)) return;
    objectId = intent.id;
    paymentIntentId = intent.id;
    jobId = intent.metadata?.job_id ?? null;
    amountMinor = intent.amount_received ?? intent.amount;
    currency = intent.currency ?? 'usd';
  } else {
    return;
  }

  if (!jobId || !Number.isSafeInteger(amountMinor) || amountMinor <= 0) return;

  const payment = await db.query(
    `SELECT id, status FROM public.payments
     WHERE ($1::text IS NOT NULL AND stripe_session_id = $1)
        OR ($2::text IS NOT NULL AND stripe_payment_intent_id = $2)
     ORDER BY created_at DESC LIMIT 1`,
    [sessionId, paymentIntentId]
  );
  if (payment.error || !payment.data?.length) {
    throw new Error(payment.error?.message ?? 'Paid Stripe transaction has no linked payment record');
  }

  const job = await db.query(
    `SELECT client_id, assigned_guard_id FROM public.security_requests WHERE id = $1 LIMIT 1`,
    [jobId]
  );
  if (job.error || !job.data?.length) {
    throw new Error(job.error?.message ?? 'Paid Stripe transaction references an unknown job');
  }

  const entryType = checkoutType === 'tip' ? 'pass_through' : 'client_charge';
  const ledger = await db.query(
    `INSERT INTO public.financial_ledger_entries (
       id, job_id, payment_id, guard_id, client_id, stripe_event_id,
       stripe_object_id, entry_type, direction, amount_minor, currency,
       idempotency_key, metadata
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'credit', $9, $10, $11, $12::jsonb)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING id`,
    [
      `ledger-${event.id}`,
      jobId,
      payment.data[0].id,
      job.data[0].assigned_guard_id ?? null,
      job.data[0].client_id ?? null,
      event.id,
      objectId,
      entryType,
      amountMinor,
      currency.toUpperCase(),
      `stripe-receipt:${objectId}`,
      JSON.stringify({
        stripe_event_type: event.type,
        checkout_type: checkoutType,
        stripe_session_id: sessionId,
        stripe_payment_intent_id: paymentIntentId,
        allocation_status: 'gross_receipt_recorded',
      }),
    ]
  );
  if (ledger.error) throw new Error(ledger.error.message);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = await getStripe();
  const webhookSecrets = readStripeWebhookSecrets();

  if (!stripe || webhookSecrets.length === 0) {
    return res.status(503).json(PAYMENTS_NOT_CONFIGURED_BODY);
  }

  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await readRawBody(req);
    event = await verifyStripeWebhookEvent(stripe, rawBody, signature, webhookSecrets);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return res.status(400).json({ error: `Webhook Error: ${message}` });
  }

  const db = await getSupabaseAdmin();
  if (!db) {
    return res.status(503).json({ error: 'Billing database is unavailable' });
  }

  // Claim each Stripe event atomically before any payment or payout side effects.
  // Duplicate deliveries are acknowledged without running the handler twice.
  const claim = await db.query(
    `INSERT INTO public.stripe_webhook_events (
       event_id, event_type, livemode, event_created_at, processing_status,
       attempt_count, payload, last_attempt_at
     ) VALUES ($1, $2, $3, to_timestamp($4), 'processing', 1, $5::jsonb, NOW())
     ON CONFLICT (event_id) DO UPDATE SET
       processing_status = 'processing',
       attempt_count = public.stripe_webhook_events.attempt_count + 1,
       last_error = NULL,
       last_attempt_at = NOW()
     WHERE public.stripe_webhook_events.processing_status IN ('received', 'failed')
        OR (
          public.stripe_webhook_events.processing_status = 'processing'
          AND public.stripe_webhook_events.last_attempt_at < NOW() - INTERVAL '10 minutes'
        )
     RETURNING event_id`,
    [
      event.id,
      event.type,
      event.livemode,
      event.created,
      JSON.stringify(event),
    ]
  );

  if (claim.error) {
    console.error('Stripe webhook inbox claim failed:', claim.error.message);
    return res.status(500).json({ error: 'Unable to record Stripe event' });
  }

  if (!claim.data?.length) {
    return res.status(200).json({ received: true, duplicate: true });
  }

  try {
    await processStripeWebhookEvent(event);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
        const paymentIntentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? null;
        const verified = await db.query(
          `SELECT id, status FROM public.payments
           WHERE stripe_session_id = $1
              OR ($2::text IS NOT NULL AND stripe_payment_intent_id = $2)
           ORDER BY created_at DESC LIMIT 1`,
          [session.id, paymentIntentId]
        );
        if (verified.error || !verified.data?.length || !['paid', 'released'].includes(String(verified.data[0].status))) {
          throw new Error(verified.error?.message ?? 'Stripe Checkout payment was not durably recorded');
        }
      }
    } else if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const checkoutType = String(intent.metadata?.checkout_type ?? '');
      if (intent.metadata?.job_id && !['cash_deposit', 'overtime', 'schedule_change', 'tip'].includes(checkoutType)) {
        const verified = await db.query(
          `SELECT id, status FROM public.payments
           WHERE stripe_payment_intent_id = $1
           ORDER BY created_at DESC LIMIT 1`,
          [intent.id]
        );
        if (verified.error || !verified.data?.length || !['paid', 'released'].includes(String(verified.data[0].status))) {
          throw new Error(verified.error?.message ?? 'Stripe PaymentIntent was not durably recorded');
        }
      }
    }

    await recordStripeReceipt(db, event);

    const completed = await db.query(
      `UPDATE public.stripe_webhook_events
       SET processing_status = 'processed', processed_at = NOW(), last_error = NULL
       WHERE event_id = $1 AND processing_status = 'processing'`,
      [event.id]
    );
    if (completed.error) throw new Error(completed.error.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook handler failed';
    await db.query(
      `UPDATE public.stripe_webhook_events
       SET processing_status = 'failed', last_error = $2, last_attempt_at = NOW()
       WHERE event_id = $1 AND processing_status = 'processing'`,
      [event.id, message.slice(0, 4000)]
    );
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }

  return res.status(200).json({ received: true });
}
