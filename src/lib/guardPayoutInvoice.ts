import { SecurityGuard, SecurityRequest, SupportTicket } from '../types';
import { guardPayoutAmount } from './cashPayments';
import { formatShiftRange } from './dates';

export type GuardPayoutMethod = 'cash' | 'stripe';

export interface GuardPayoutInvoiceLine {
  jobId: string;
  title: string;
  clientName: string;
  amount: number;
  schedule: string;
}

export function getGuardPayoutEligibleJobs(
  guardId: string,
  requests: SecurityRequest[]
): SecurityRequest[] {
  return requests.filter(
    (r) =>
      r.assignedGuardId === guardId &&
      r.status === 'completed' &&
      ['paid', 'held'].includes(r.paymentStatus || '') &&
      r.guardPayoutMethod !== 'cash'
  );
}

function invoiceSubject(method: GuardPayoutMethod, total: number): string {
  const label = method === 'cash' ? 'Cash pickup' : 'Bank transfer';
  return `${label} payout invoice — $${total.toFixed(2)}`;
}

export function buildGuardPayoutInvoice(params: {
  guard: Pick<SecurityGuard, 'id' | 'name' | 'email'>;
  method: GuardPayoutMethod;
  jobs: SecurityRequest[];
  issuedAt?: Date;
}): {
  subject: string;
  body: string;
  total: number;
  lines: GuardPayoutInvoiceLine[];
} {
  const issuedAt = params.issuedAt ?? new Date();
  const lines = params.jobs.map((job) => ({
    jobId: job.id,
    title: job.title,
    clientName: job.clientName,
    amount: guardPayoutAmount(job),
    schedule: formatShiftRange(job.startDate, job.endDate),
  }));
  const total = Math.round(lines.reduce((sum, line) => sum + line.amount, 0) * 100) / 100;
  const methodLabel = params.method === 'cash' ? 'Cash pickup in person' : 'Stripe Connect bank transfer';

  const lineItems = lines
    .map(
      (line, index) =>
        `${index + 1}. ${line.title} (${line.jobId})\n` +
        `   Client: ${line.clientName}\n` +
        `   Schedule: ${line.schedule}\n` +
        `   Guard pay: $${line.amount.toFixed(2)}`
    )
    .join('\n\n');

  const body = [
    `Guard payout invoice`,
    ``,
    `Guard: ${params.guard.name} (${params.guard.email})`,
    `Guard ID: ${params.guard.id}`,
    `Issued: ${issuedAt.toLocaleString()}`,
    `Payment method: ${methodLabel}`,
    ``,
    `Line items (${lines.length} completed job${lines.length === 1 ? '' : 's'}):`,
    ``,
    lineItems,
    ``,
    `Total due to guard: $${total.toFixed(2)}`,
    ``,
    params.method === 'cash'
      ? `Staff: hand cash to the guard, then mark each job paid in Payments.`
      : `Staff: release Stripe payout for each listed job after verifying the guard's connected account.`,
  ].join('\n');

  return {
    subject: invoiceSubject(params.method, total),
    body,
    total,
    lines,
  };
}

export function isGuardPayoutInvoiceTicket(
  ticket: SupportTicket,
  method?: GuardPayoutMethod
): boolean {
  if (ticket.category !== 'payment' || ticket.kind !== 'report') return false;
  const subject = ticket.subject.toLowerCase();
  const matchesCash = subject.includes('cash pickup') && subject.includes('payout invoice');
  const matchesStripe =
    (subject.includes('bank transfer') || subject.includes('stripe')) && subject.includes('payout invoice');
  if (method === 'cash') return matchesCash;
  if (method === 'stripe') return matchesStripe;
  return matchesCash || matchesStripe;
}

export function openGuardPayoutInvoices(
  tickets: SupportTicket[],
  userId: string,
  method?: GuardPayoutMethod
): SupportTicket[] {
  return tickets.filter(
    (ticket) =>
      ticket.userId === userId &&
      ticket.status !== 'resolved' &&
      isGuardPayoutInvoiceTicket(ticket, method)
  );
}
