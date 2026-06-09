import { SecurityRequest } from '../types';
import { clientPaymentDisplay, guardPayoutDisplay, isCashClientPayment, isCashGuardPayout } from './cashPayments';
import { computeGuardEarnings } from './payments';

/** Where a job sits in the client → guard money flow */
export type PaymentPipelineStage =
  | 'awaiting-client'
  | 'client-paid-active'
  | 'awaiting-guard-payout'
  | 'settled'
  | 'closed';

export function getPaymentPipelineStage(req: SecurityRequest): PaymentPipelineStage {
  if (req.status === 'closed') return 'closed';
  if (!req.paymentStatus || req.paymentStatus === 'unpaid') return 'awaiting-client';
  if (req.paymentStatus === 'released') return 'settled';
  if (req.status === 'completed' && ['paid', 'held'].includes(req.paymentStatus)) {
    return 'awaiting-guard-payout';
  }
  return 'client-paid-active';
}

export const PIPELINE_SECTION_META: Record<
  Exclude<PaymentPipelineStage, 'closed'>,
  { title: string; description: string }
> = {
  'awaiting-client': {
    title: 'Awaiting client payment',
    description: 'Job is posted but the client has not paid yet. Director can record cash.',
  },
  'client-paid-active': {
    title: 'Paid — shift in progress',
    description: 'Client payment is on file. Guard payout happens after the shift is completed.',
  },
  'awaiting-guard-payout': {
    title: 'Ready to pay guard',
    description: 'Shift completed. Release via Stripe or record cash paid to the guard (Director).',
  },
  settled: {
    title: 'Settled',
    description: 'Client paid and guard payout is recorded.',
  },
};

export function groupRequestsByPipeline(requests: SecurityRequest[]) {
  const awaitingClient: SecurityRequest[] = [];
  const clientPaidActive: SecurityRequest[] = [];
  const awaitingGuardPayout: SecurityRequest[] = [];
  const settled: SecurityRequest[] = [];

  for (const req of requests) {
    switch (getPaymentPipelineStage(req)) {
      case 'awaiting-client':
        awaitingClient.push(req);
        break;
      case 'client-paid-active':
        clientPaidActive.push(req);
        break;
      case 'awaiting-guard-payout':
        awaitingGuardPayout.push(req);
        break;
      case 'settled':
        settled.push(req);
        break;
      default:
        break;
    }
  }

  const byNewest = (a: SecurityRequest, b: SecurityRequest) =>
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime();

  awaitingClient.sort(byNewest);
  clientPaidActive.sort(byNewest);
  awaitingGuardPayout.sort(byNewest);
  settled.sort(byNewest);

  return { awaitingClient, clientPaidActive, awaitingGuardPayout, settled };
}

export function paymentPipelineSummary(requests: SecurityRequest[]) {
  const groups = groupRequestsByPipeline(requests);
  const awaitingClientTotal = groups.awaitingClient.reduce((s, r) => s + r.estimatedPayout, 0);
  const guardPayoutDue = groups.awaitingGuardPayout.reduce(
    (s, r) => s + computeGuardEarnings(r.durationHours, r.hourlyRate),
    0
  );
  const settledGuardTotal = groups.settled.reduce(
    (s, r) => s + computeGuardEarnings(r.durationHours, r.hourlyRate),
    0
  );

  return {
    ...groups,
    awaitingClientTotal: Math.round(awaitingClientTotal * 100) / 100,
    guardPayoutDue: Math.round(guardPayoutDue * 100) / 100,
    settledGuardTotal: Math.round(settledGuardTotal * 100) / 100,
  };
}

export function clientPaymentBadgeClass(req: SecurityRequest): string {
  if (!req.paymentStatus || req.paymentStatus === 'unpaid') return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
  if (isCashClientPayment(req)) return 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10';
  return 'text-sky-300 border-sky-500/40 bg-sky-500/10';
}

export function guardPayoutBadgeClass(req: SecurityRequest): string {
  if (req.paymentStatus === 'released') {
    return isCashGuardPayout(req)
      ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
      : 'text-sky-300 border-sky-500/40 bg-sky-500/10';
  }
  if (getPaymentPipelineStage(req) === 'awaiting-guard-payout') {
    return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
  }
  return 'text-brand-text-muted border-brand-border bg-white/5';
}

export function paymentRowSubtitle(req: SecurityRequest): string {
  return `Client: ${clientPaymentDisplay(req)} · Guard: ${guardPayoutDisplay(req)}`;
}
