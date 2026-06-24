import { GuardPayoutInvoiceLine, SecurityGuard, SecurityRequest } from '../types';
import { guardPayoutAmount, isStripeDepositSatisfied } from './cashPayments';
import { formatShiftRange } from './dates';

export type GuardPayoutMethod = 'cash' | 'stripe';

/** Base filter: job complete, payout released, not yet paid out. */
function basePayoutEligible(guardId: string, req: SecurityRequest): boolean {
  return (
    req.assignedGuardId === guardId &&
    req.status === 'completed' &&
    ['paid', 'held'].includes(req.paymentStatus || '') &&
    req.guardPayoutMethod !== 'cash' &&
    !!req.guardPayoutAvailable
  );
}

/**
 * Jobs eligible for a Stripe bank transfer.
 * Money must be in Guardr's Stripe account — if client paid cash and it hasn't
 * been deposited yet, Stripe payout is unavailable (only cash pickup applies).
 */
export function getGuardStripePayoutEligibleJobs(
  guardId: string,
  requests: SecurityRequest[]
): SecurityRequest[] {
  return requests.filter(
    (r) => basePayoutEligible(guardId, r) && isStripeDepositSatisfied(r)
  );
}

/**
 * Jobs eligible for a cash pickup.
 * Available regardless of Stripe deposit status — Guardr pays from their own funds.
 */
export function getGuardCashPayoutEligibleJobs(
  guardId: string,
  requests: SecurityRequest[]
): SecurityRequest[] {
  return requests.filter((r) => basePayoutEligible(guardId, r));
}

/** All payout-eligible jobs (used for general checks). */
export function getGuardPayoutEligibleJobs(
  guardId: string,
  requests: SecurityRequest[]
): SecurityRequest[] {
  return getGuardCashPayoutEligibleJobs(guardId, requests);
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
