import { GuardPayoutInvoiceLine, SecurityGuard, SecurityRequest } from '../types';
import { guardPayoutAmount } from './cashPayments';
import { formatShiftRange } from './dates';

export type GuardPayoutMethod = 'cash' | 'stripe';

/**
 * Jobs a guard can include in a payout invoice (Stripe bank transfer or cash pickup).
 *
 * Both methods require the job to be complete — early-end refunds and overtime
 * adjustments must be settled before the guard is paid.
 */
export function getGuardPayoutEligibleJobs(
  guardId: string,
  requests: SecurityRequest[]
): SecurityRequest[] {
  return requests.filter(
    (r) =>
      r.assignedGuardId === guardId &&
      r.status === 'completed' &&
      ['paid', 'held'].includes(r.paymentStatus || '') &&
      r.guardPayoutMethod !== 'cash' &&
      !!r.guardPayoutAvailable
  );
}

/**
 * Jobs eligible for a Stripe bank transfer.
 * Requires job completion so any adjustments are settled first.
 */
export function getGuardStripePayoutEligibleJobs(
  guardId: string,
  requests: SecurityRequest[]
): SecurityRequest[] {
  return getGuardPayoutEligibleJobs(guardId, requests);
}

/**
 * Jobs eligible for a cash pickup.
 * Same rules — job must be complete and payout released by staff.
 */
export function getGuardCashPayoutEligibleJobs(
  guardId: string,
  requests: SecurityRequest[]
): SecurityRequest[] {
  return getGuardPayoutEligibleJobs(guardId, requests);
}

export function buildGuardPayoutInvoice(params: {
  guard: Pick<SecurityGuard, 'id' | 'name' | 'email'>;
  method: GuardPayoutMethod;
  jobs: SecurityRequest[];
  issuedAt?: Date;
}): {
  total: number;
  lines: GuardPayoutInvoiceLine[];
} {
  const lines = params.jobs.map((job) => ({
    jobId: job.id,
    title: job.title,
    clientName: job.clientName,
    amount: guardPayoutAmount(job),
    schedule: formatShiftRange(job.startDate, job.endDate),
  }));
  const total = Math.round(lines.reduce((sum, line) => sum + line.amount, 0) * 100) / 100;
  return { total, lines };
}
