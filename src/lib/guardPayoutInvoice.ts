import { GuardPayoutInvoiceLine, SecurityGuard, SecurityRequest } from '../types';
import { guardPayoutAmount } from './cashPayments';
import { formatShiftRange } from './dates';

export type GuardPayoutMethod = 'cash' | 'stripe';

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
