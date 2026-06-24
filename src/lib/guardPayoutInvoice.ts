import { GuardPayoutInvoiceLine, SecurityGuard, SecurityRequest } from '../types';
import { guardPayoutAmount } from './cashPayments';
import { formatShiftRange } from './dates';

export type GuardPayoutMethod = 'cash' | 'stripe';

/**
 * Jobs a guard can include in a payout invoice.
 *
 * Stripe bank transfer: available as soon as Guardr releases the funds
 *   (guardPayoutAvailable), regardless of whether the job is complete.
 *
 * Cash pickup: only available once the job is marked complete — Guardr
 *   hands over cash from their Stripe balance and records it here.
 */
export function getGuardPayoutEligibleJobs(
  guardId: string,
  requests: SecurityRequest[],
  method?: 'stripe' | 'cash'
): SecurityRequest[] {
  return requests.filter((r) => {
    if (r.assignedGuardId !== guardId) return false;
    if (!['paid', 'held'].includes(r.paymentStatus || '')) return false;
    if (r.guardPayoutMethod === 'cash') return false; // already paid cash
    if (!r.guardPayoutAvailable) return false;

    if (method === 'cash') {
      // Cash only once shift is done
      return r.status === 'completed';
    }
    if (method === 'stripe') {
      // Stripe: any time after payout is released
      return true;
    }
    // Default (no method specified): allow if job is completed for backward compat
    return r.status === 'completed';
  });
}

/**
 * Jobs eligible for a Stripe bank transfer — funds can be collected
 * at any time after Guardr releases them, even mid-shift.
 */
export function getGuardStripePayoutEligibleJobs(
  guardId: string,
  requests: SecurityRequest[]
): SecurityRequest[] {
  return getGuardPayoutEligibleJobs(guardId, requests, 'stripe');
}

/**
 * Jobs eligible for a cash pickup — requires the shift to be complete
 * since Guardr pays cash from their Stripe balance.
 */
export function getGuardCashPayoutEligibleJobs(
  guardId: string,
  requests: SecurityRequest[]
): SecurityRequest[] {
  return getGuardPayoutEligibleJobs(guardId, requests, 'cash');
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
