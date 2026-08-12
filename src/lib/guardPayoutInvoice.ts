import { GuardPayoutInvoiceLine, SecurityGuard, SecurityRequest } from '../types';
import { guardPayoutAmount, isStripeDepositSatisfied } from './cashPayments';
import { formatShiftRange } from './dates';

/** Stripe is the only guard payout method. Legacy 'cash' may appear in stored invoices. */
export type GuardPayoutMethod = 'stripe' | 'cash';

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
 * Stripe deposit is always satisfied on the Stripe-only product path.
 */
export function getGuardStripePayoutEligibleJobs(
  guardId: string,
  requests: SecurityRequest[]
): SecurityRequest[] {
  return requests.filter(
    (r) => basePayoutEligible(guardId, r) && isStripeDepositSatisfied(r)
  );
}

/** @deprecated Cash pickup removed — always empty. */
export function getGuardCashPayoutEligibleJobs(
  _guardId: string,
  _requests: SecurityRequest[]
): SecurityRequest[] {
  return [];
}

/** All payout-eligible jobs (Stripe bank transfer only). */
export function getGuardPayoutEligibleJobs(
  guardId: string,
  requests: SecurityRequest[]
): SecurityRequest[] {
  return getGuardStripePayoutEligibleJobs(guardId, requests);
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
