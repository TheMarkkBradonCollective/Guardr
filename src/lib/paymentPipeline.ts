import { SecurityRequest } from '../types';
import {
  clientPaymentDisplay,
  getRemainingStripeDeposit,
  guardPayoutDisplay,
  isCashAwaitingStripeDeposit,
  isCashClientPayment,
  isCashGuardPayout,
  isStripeDepositSatisfied,
} from './cashPayments';
import { computeGuardEarnings } from './payments';

/** Where a job sits in the client → guard money flow */
export type PaymentPipelineStage =
  | 'awaiting-client'
  | 'cash-deposit-pending'
  | 'client-paid-active'
  | 'awaiting-guard-payout'
  | 'settled'
  | 'closed';

export function getPaymentPipelineStage(req: SecurityRequest): PaymentPipelineStage {
  if (req.status === 'closed') return 'closed';
  if (!req.paymentStatus || req.paymentStatus === 'unpaid') return 'awaiting-client';
  // Fee deposit can still be owed after guard cash payout — check before "settled"
  if (isCashAwaitingStripeDeposit(req)) return 'cash-deposit-pending';
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
    description: 'Client has not paid. Director can record cash received on site.',
  },
  'cash-deposit-pending': {
    title: 'Deposit client cash to Stripe',
    description:
      'Client paid cash. Record deposits to Stripe for the ledger — full job amount if guard is paid via Connect (can be after payout), or platform fee only if guard was paid cash.',
  },
  'client-paid-active': {
    title: 'Paid — shift in progress',
    description: 'Funds are on file (card or cash already in Stripe). Guard is paid after shift completion.',
  },
  'awaiting-guard-payout': {
    title: 'Ready to pay guard',
    description:
      'Shift done. Pay via Stripe Connect or record cash handed to the guard (Director). Client cash can be deposited to Stripe later.',
  },
  settled: {
    title: 'Settled',
    description: 'Client paid and guard payout is recorded.',
  },
};

export function groupRequestsByPipeline(requests: SecurityRequest[]) {
  const awaitingClient: SecurityRequest[] = [];
  const cashDepositPending: SecurityRequest[] = [];
  const clientPaidActive: SecurityRequest[] = [];
  const awaitingGuardPayout: SecurityRequest[] = [];
  const settled: SecurityRequest[] = [];

  for (const req of requests) {
    switch (getPaymentPipelineStage(req)) {
      case 'awaiting-client':
        awaitingClient.push(req);
        break;
      case 'cash-deposit-pending':
        cashDepositPending.push(req);
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
  cashDepositPending.sort(byNewest);
  clientPaidActive.sort(byNewest);
  awaitingGuardPayout.sort(byNewest);
  settled.sort(byNewest);

  return { awaitingClient, cashDepositPending, clientPaidActive, awaitingGuardPayout, settled };
}

export function paymentPipelineSummary(requests: SecurityRequest[]) {
  const groups = groupRequestsByPipeline(requests);
  const awaitingClientTotal = groups.awaitingClient.reduce((s, r) => s + r.estimatedPayout, 0);
  const cashDepositTotal = groups.cashDepositPending.reduce((s, r) => s + getRemainingStripeDeposit(r), 0);
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
    cashDepositTotal: Math.round(cashDepositTotal * 100) / 100,
    guardPayoutDue: Math.round(guardPayoutDue * 100) / 100,
    settledGuardTotal: Math.round(settledGuardTotal * 100) / 100,
  };
}

export function clientPaymentBadgeClass(req: SecurityRequest): string {
  if (!req.paymentStatus || req.paymentStatus === 'unpaid') {
    return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
  }
  if (isCashAwaitingStripeDeposit(req)) {
    return 'text-orange-300 border-orange-500/40 bg-orange-500/10';
  }
  if (isCashClientPayment(req)) return 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10';
  return 'text-sky-300 border-sky-500/40 bg-sky-500/10';
}

export function platformFundsBadgeClass(req: SecurityRequest): string {
  if (isCashAwaitingStripeDeposit(req)) {
    return 'text-orange-300 border-orange-500/40 bg-orange-500/10';
  }
  if (isCashClientPayment(req) && isStripeDepositSatisfied(req)) {
    return 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10';
  }
  if (!isCashClientPayment(req) && req.paymentStatus && req.paymentStatus !== 'unpaid') {
    return 'text-sky-300 border-sky-500/40 bg-sky-500/10';
  }
  return 'text-brand-text-muted border-brand-border bg-white/5';
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
