import type { AppDb } from '../db/adminClient.ts';
import type { ClientPaymentIntentKind } from './clientPaymentKinds.ts';

export type ValidatePaymentInput = {
  kind: ClientPaymentIntentKind;
  jobId: string;
  clientEmail: string;
  amountCents: number;
};

export type ValidatePaymentResult = { ok: true } | { ok: false; status: number; error: string };

async function assertStripeEnabled(db: AppDb): Promise<ValidatePaymentResult | null> {
  const { data: settings } = await db
    .from('platform_settings')
    .select('payment_stripe_enabled')
    .eq('id', 'default')
    .maybeSingle();
  if (settings && settings.payment_stripe_enabled === false) {
    return { ok: false, status: 400, error: 'Online card payments are not enabled on this platform' };
  }
  return null;
}

export async function validateClientPaymentIntent(
  db: AppDb | null,
  input: ValidatePaymentInput
): Promise<ValidatePaymentResult> {
  const { kind, jobId, clientEmail, amountCents } = input;

  if (!jobId || !clientEmail) {
    return { ok: false, status: 400, error: 'jobId and clientEmail are required' };
  }

  if (!amountCents || amountCents < 50) {
    return { ok: false, status: 400, error: 'amountCents must be at least 50' };
  }

  if (kind === 'tip' && amountCents < 100) {
    return { ok: false, status: 400, error: 'Tip amount must be at least $1.00' };
  }

  if (!db) return { ok: true };

  const stripeOff = await assertStripeEnabled(db);
  if (stripeOff) return stripeOff;

  const { data: job } = await db
    .from('security_requests')
    .select(
      [
        'payment_status',
        'status',
        'overtime_status',
        'overtime_amount',
        'overtime_guard_approved_at',
        'overtime_client_approved_at',
        'schedule_change_status',
        'schedule_change_extra_amount',
        'pending_start_date',
        'pending_end_date',
        'assigned_guard_id',
        'tip_payment_status',
        'rating_given',
      ].join(', ')
    )
    .eq('id', jobId)
    .maybeSingle();

  if (!job) {
    return { ok: false, status: 404, error: 'Job not found' };
  }

  switch (kind) {
    case 'job_payment': {
      if (job.status !== 'open') {
        return { ok: false, status: 400, error: 'This job must be approved by staff before payment' };
      }
      if (job.payment_status && job.payment_status !== 'unpaid') {
        return { ok: false, status: 400, error: 'This job already has a payment on file' };
      }
      return { ok: true };
    }
    case 'overtime': {
      if (job.status !== 'completed' && job.status !== 'closed') {
        return { ok: false, status: 400, error: 'Overtime can only be paid after the shift is complete' };
      }
      if (job.overtime_status !== 'awaiting_payment') {
        return { ok: false, status: 400, error: 'Overtime must be approved by guard and client before payment' };
      }
      if (!job.overtime_guard_approved_at || !job.overtime_client_approved_at) {
        return { ok: false, status: 400, error: 'Guard and client must approve overtime before payment' };
      }
      const expectedCents = Math.round(Number(job.overtime_amount ?? 0) * 100);
      if (expectedCents > 0 && amountCents !== expectedCents) {
        return { ok: false, status: 400, error: 'Amount does not match the overtime balance due' };
      }
      return { ok: true };
    }
    case 'schedule_change': {
      if (job.schedule_change_status !== 'awaiting_payment') {
        return { ok: false, status: 400, error: 'Schedule extension must be approved before payment' };
      }
      if (!job.pending_start_date || !job.pending_end_date) {
        return { ok: false, status: 400, error: 'Pending schedule change is incomplete' };
      }
      const expectedCents = Math.round(Number(job.schedule_change_extra_amount ?? 0) * 100);
      if (expectedCents > 0 && amountCents !== expectedCents) {
        return { ok: false, status: 400, error: 'Amount does not match the schedule extension due' };
      }
      return { ok: true };
    }
    case 'tip': {
      if (job.status !== 'completed' && job.status !== 'closed') {
        return { ok: false, status: 400, error: 'Tips can only be left after the shift is complete' };
      }
      if (!job.assigned_guard_id) {
        return { ok: false, status: 400, error: 'No guard is assigned to this job' };
      }
      if (job.tip_payment_status === 'paid') {
        return { ok: false, status: 400, error: 'A tip has already been paid for this job' };
      }
      if (!job.rating_given) {
        return { ok: false, status: 400, error: 'Submit your guard review before leaving a tip' };
      }
      const { data: guard } = await db
        .from('guards')
        .select('stripe_connect_account_id')
        .eq('id', job.assigned_guard_id)
        .maybeSingle();
      if (!guard?.stripe_connect_account_id) {
        return { ok: false, status: 400, error: 'This guard cannot receive card tips yet' };
      }
      return { ok: true };
    }
    default:
      return { ok: false, status: 400, error: 'Unknown payment kind' };
  }
}

export function paymentIntentDescription(kind: ClientPaymentIntentKind, jobTitle: string | undefined, jobId: string): string {
  switch (kind) {
    case 'job_payment':
      return jobTitle ? `Security services — ${jobTitle}` : `Guardr job ${jobId}`;
    case 'overtime':
      return jobTitle ? `Late clock-out — ${jobTitle}` : `Late clock-out — ${jobId}`;
    case 'schedule_change':
      return jobTitle ? `Schedule extension — ${jobTitle}` : `Schedule extension — ${jobId}`;
    case 'tip':
      return jobTitle ? `Tip — ${jobTitle}` : `Tip — ${jobId}`;
  }
}

export function pendingPaymentIdPrefix(kind: ClientPaymentIntentKind): string {
  switch (kind) {
    case 'job_payment':
      return 'pay';
    case 'overtime':
      return 'pay-overtime';
    case 'schedule_change':
      return 'pay-schedule';
    case 'tip':
      return 'pay-tip';
  }
}
