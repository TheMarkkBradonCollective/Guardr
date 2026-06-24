import { GuardJobView } from './guardJobView';
import { getGuardShiftEarnings } from './guardJobView';

export interface GuardEarningsBreakdown {
  totalEarnings: number;
  cashPaid: number;
  stripePaid: number;
  /** Stripe bank transfer: available as soon as Guardr releases (any job status). */
  onlineAvailable: number;
  /** Cash pickup: only available on completed jobs — Guardr pays from their Stripe balance. */
  cashAvailable: number;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function shiftEarnings(job: GuardJobView): number {
  return getGuardShiftEarnings(job);
}

/**
 * Split guard earnings by payment status and method.
 *
 * Stripe payout (onlineAvailable): tracks any job where Guardr has released
 * funds, even if the job is still in progress — the guard can bank transfer
 * at any time.
 *
 * Cash pickup (cashAvailable): only tracks completed jobs — Guardr pays cash
 * from their own Stripe balance once the shift is done.
 */
export function computeGuardEarningsBreakdown(jobs: GuardJobView[]): GuardEarningsBreakdown {
  let totalEarnings = 0;
  let cashPaid = 0;
  let stripePaid = 0;
  let onlineAvailable = 0;
  let cashAvailable = 0;

  for (const job of jobs) {
    if (job.assignedGuardId == null) continue;
    if (job.payoutStatus == null) continue;

    const amount = shiftEarnings(job);

    // Already paid
    if (job.payoutStatus === 'paid' && job.payoutMethod === 'cash') {
      if (job.status === 'completed') totalEarnings += amount;
      cashPaid += amount;
      continue;
    }

    if (job.payoutStatus === 'paid' && job.payoutMethod === 'stripe') {
      if (job.status === 'completed') totalEarnings += amount;
      stripePaid += amount;
      continue;
    }

    // Count total earnings for completed jobs only
    if (job.status === 'completed') totalEarnings += amount;

    // Stripe payout available: any status where Guardr released funds
    if (job.guardPayoutAvailable && job.payoutMethod !== 'cash') {
      onlineAvailable += amount;
    }

    // Cash pickup available: only for completed jobs
    if (job.guardPayoutAvailable && job.payoutMethod !== 'cash' && job.status === 'completed') {
      cashAvailable += amount;
    }
  }

  return {
    totalEarnings: roundMoney(totalEarnings),
    cashPaid: roundMoney(cashPaid),
    stripePaid: roundMoney(stripePaid),
    onlineAvailable: roundMoney(onlineAvailable),
    cashAvailable: roundMoney(cashAvailable),
  };
}
