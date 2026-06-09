import { GuardJobView } from './guardJobView';
import { getGuardShiftEarnings } from './guardJobView';

export interface GuardEarningsBreakdown {
  totalEarnings: number;
  cashPaid: number;
  stripePaid: number;
  onlineAvailable: number;
  cashPendingRequest: number;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function shiftEarnings(job: GuardJobView): number {
  return getGuardShiftEarnings(job);
}

/** Split completed shift earnings by cash vs online payout path */
export function computeGuardEarningsBreakdown(jobs: GuardJobView[]): GuardEarningsBreakdown {
  let totalEarnings = 0;
  let cashPaid = 0;
  let stripePaid = 0;
  let onlineAvailable = 0;
  let cashPendingRequest = 0;

  for (const job of jobs) {
    if (job.status !== 'completed' || job.assignedGuardId == null) continue;

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

    if (job.cashPayoutRequested) {
      cashPendingRequest += amount;
      continue;
    }

    if (job.payoutMethod !== 'cash') {
      onlineAvailable += amount;
    }
  }

  return {
    totalEarnings: roundMoney(totalEarnings),
    cashPaid: roundMoney(cashPaid),
    stripePaid: roundMoney(stripePaid),
    onlineAvailable: roundMoney(onlineAvailable),
    cashPendingRequest: roundMoney(cashPendingRequest),
  };
}
