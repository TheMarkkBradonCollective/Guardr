import { GuardJobView } from './guardJobView';
import { getGuardShiftEarnings } from './guardJobView';

export interface GuardEarningsBreakdown {
  totalEarnings: number;
  /** @deprecated Cash payouts removed — always 0. Kept for call-site compatibility. */
  cashPaid: number;
  stripePaid: number;
  /** Stripe bank transfer available once staff releases pay. */
  onlineAvailable: number;
  /** @deprecated Cash pickup removed — always 0. Kept for call-site compatibility. */
  cashAvailable: number;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function shiftEarnings(job: GuardJobView): number {
  return getGuardShiftEarnings(job);
}

/**
 * Split completed guard earnings by Stripe payment status.
 * Cash pickup is removed — released pay is always collectible via bank transfer.
 */
export function computeGuardEarningsBreakdown(jobs: GuardJobView[]): GuardEarningsBreakdown {
  let totalEarnings = 0;
  let stripePaid = 0;
  let onlineAvailable = 0;

  for (const job of jobs) {
    if (job.status !== 'completed' || job.assignedGuardId == null) continue;
    if (job.payoutStatus == null) continue;

    const amount = shiftEarnings(job);
    totalEarnings += amount;

    if (job.payoutStatus === 'paid') {
      stripePaid += amount;
      continue;
    }

    if (job.guardPayoutAvailable) {
      onlineAvailable += amount;
    }
  }

  return {
    totalEarnings: roundMoney(totalEarnings),
    cashPaid: 0,
    stripePaid: roundMoney(stripePaid),
    onlineAvailable: roundMoney(onlineAvailable),
    cashAvailable: 0,
  };
}
