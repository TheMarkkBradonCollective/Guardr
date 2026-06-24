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
 * Split completed guard earnings by payment status and method.
 * Both Stripe and cash payouts require job completion — adjustments
 * (overtime, early-end refunds) must be settled before paying the guard.
 */
export function computeGuardEarningsBreakdown(jobs: GuardJobView[]): GuardEarningsBreakdown {
  let totalEarnings = 0;
  let cashPaid = 0;
  let stripePaid = 0;
  let onlineAvailable = 0;
  let cashAvailable = 0;

  for (const job of jobs) {
    if (job.status !== 'completed' || job.assignedGuardId == null) continue;
    if (job.payoutStatus == null) continue;

    const amount = shiftEarnings(job);
    totalEarnings += amount;

    if (job.payoutStatus === 'paid' && job.payoutMethod === 'cash') {
      cashPaid += amount;
      continue;
    }

    if (job.payoutStatus === 'paid' && job.payoutMethod === 'stripe') {
      stripePaid += amount;
      continue;
    }

    // Released by staff — guard can collect via Stripe or cash
    if (job.guardPayoutAvailable && job.payoutMethod !== 'cash') {
      onlineAvailable += amount;
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
