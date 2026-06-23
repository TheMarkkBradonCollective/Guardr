import { SecurityRequest } from '../types';
import {
  clientPaymentDisplay,
  getRemainingStripeDeposit,
  guardPayoutDisplay,
  isCashAwaitingStripeDeposit,
  isCashClientPayment,
  isCashGuardPayout,
  isClientCashPaymentPendingApproval,
  isPlatformFeeOnlyDeposit,
  isStripeDepositSatisfied,
} from './cashPayments';
import { computeGuardEarnings } from './payments';

/** Where a job sits in the client → guard money flow */
export type PaymentPipelineStage =
  | 'awaiting-client'
  | 'cash-deposit-pending'
  | 'client-paid-active'
  | 'awaiting-guard-payout'
  | 'guard-collection-pending'
  | 'settled'
  | 'closed';

export function getPaymentPipelineStage(req: SecurityRequest): PaymentPipelineStage {
  if (req.status === 'closed') return 'closed';
  if (!req.paymentStatus || req.paymentStatus === 'unpaid') return 'awaiting-client';
  if (req.paymentStatus === 'released') return 'settled';
  if (req.guardPayoutAvailable && req.status === 'completed') return 'guard-collection-pending';
  // Fee deposit can still be owed after guard cash payout — check before "settled"
  if (isCashAwaitingStripeDeposit(req)) return 'cash-deposit-pending';
  if (req.status === 'completed' && ['paid', 'held'].includes(req.paymentStatus)) {
    return 'awaiting-guard-payout';
  }
  return 'client-paid-active';
}

export const PIPELINE_SECTION_META: Record<
  Exclude<PaymentPipelineStage, 'closed'>,
  { title: string; description: string }
> = {
  'awaiting-guard-payout': {
    title: 'Release guard pay',
    description:
      'These jobs are finished. Make funds available so the guard can collect from their Pay screen.',
  },
  'guard-collection-pending': {
    title: 'Waiting on guard',
    description:
      'Funds are available. The guard chooses bank transfer or cash pickup from Pay — you fulfill their invoice when they submit one.',
  },
  'cash-deposit-pending': {
    title: 'Platform fee / Stripe deposit pending',
    description:
      'The client paid in cash. Deposit the platform fee or remaining Stripe balance with card. Guard pay is released separately once the job is done.',
  },
  'awaiting-client': {
    title: 'Waiting on the client',
    description:
      'The client has not paid yet. Approve cash payment requests or mark cash received if they paid on site.',
  },
  'client-paid-active': {
    title: 'Paid — job in progress',
    description: 'Money is secured. Pay the guard after the job is marked complete.',
  },
  settled: {
    title: 'Done',
    description: 'Client paid and the guard has been paid. No action needed.',
  },
};

export function groupRequestsByPipeline(requests: SecurityRequest[]) {
  const awaitingClient: SecurityRequest[] = [];
  const cashDepositPending: SecurityRequest[] = [];
  const clientPaidActive: SecurityRequest[] = [];
  const awaitingGuardPayout: SecurityRequest[] = [];
  const guardCollectionPending: SecurityRequest[] = [];
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
      case 'guard-collection-pending':
        guardCollectionPending.push(req);
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
  guardCollectionPending.sort(byNewest);
  settled.sort(byNewest);

  return { awaitingClient, cashDepositPending, clientPaidActive, awaitingGuardPayout, guardCollectionPending, settled };
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

  const paymentsNeedingAction =
    groups.awaitingClient.length + groups.cashDepositPending.length + groups.awaitingGuardPayout.length;

  return {
    ...groups,
    awaitingClientTotal: Math.round(awaitingClientTotal * 100) / 100,
    cashDepositTotal: Math.round(cashDepositTotal * 100) / 100,
    guardPayoutDue: Math.round(guardPayoutDue * 100) / 100,
    settledGuardTotal: Math.round(settledGuardTotal * 100) / 100,
    settledCount: groups.settled.length,
    paymentsNeedingAction,
  };
}

/** Plain-language lines for overview / alerts — what is paid vs still owed */
export function paymentAttentionSummary(requests: SecurityRequest[]): {
  count: number;
  lines: string[];
} {
  const s = paymentPipelineSummary(requests);
  const lines: string[] = [];

  const pendingCashApprovals = s.awaitingClient.filter(isClientCashPaymentPendingApproval);
  if (pendingCashApprovals.length > 0) {
    const pendingTotal = pendingCashApprovals.reduce((sum, r) => sum + r.estimatedPayout, 0);
    lines.push(
      `${pendingCashApprovals.length} cash payment request${pendingCashApprovals.length === 1 ? '' : 's'} awaiting approval ($${pendingTotal.toFixed(2)})`
    );
  }
  const unpaidWithoutCashRequest = s.awaitingClient.filter((r) => !isClientCashPaymentPendingApproval(r));
  if (unpaidWithoutCashRequest.length > 0) {
    const unpaidTotal = unpaidWithoutCashRequest.reduce((sum, r) => sum + r.estimatedPayout, 0);
    lines.push(
      `${unpaidWithoutCashRequest.length} job${unpaidWithoutCashRequest.length === 1 ? '' : 's'}: client still owes $${unpaidTotal.toFixed(2)}`
    );
  }
  if (s.awaitingGuardPayout.length > 0) {
    lines.push(
      `${s.awaitingGuardPayout.length} job${s.awaitingGuardPayout.length === 1 ? '' : 's'}: release $${s.guardPayoutDue.toFixed(2)} for guard collection`
    );
  }
  if (s.guardCollectionPending.length > 0) {
    const guardCollectionTotal = s.guardCollectionPending.reduce(
      (sum, r) => sum + computeGuardEarnings(r.durationHours, r.hourlyRate),
      0
    );
    lines.push(
      `${s.guardCollectionPending.length} job${s.guardCollectionPending.length === 1 ? '' : 's'}: $${guardCollectionTotal.toFixed(2)} available — waiting on guard to collect`
    );
  }
  if (s.cashDepositPending.length > 0) {
    const platformFeeOnly = s.cashDepositPending.every((req) => isPlatformFeeOnlyDeposit(req));
    lines.push(
      `${s.cashDepositPending.length} job${s.cashDepositPending.length === 1 ? '' : 's'}: $${s.cashDepositTotal.toFixed(2)} ${
        platformFeeOnly ? 'platform fee' : 'Stripe card deposit'
      } still due`
    );
  }
  if (s.settled.length > 0) {
    lines.push(
      `${s.settled.length} job${s.settled.length === 1 ? '' : 's'} settled — $${s.settledGuardTotal.toFixed(2)} already paid to guards`
    );
  }

  return { count: s.paymentsNeedingAction, lines };
}

export function clientPaymentBadgeClass(req: SecurityRequest): string {
  if (!req.paymentStatus || req.paymentStatus === 'unpaid') {
    return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
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
  if (getPaymentPipelineStage(req) === 'guard-collection-pending') {
    return 'text-sky-300 border-sky-500/40 bg-sky-500/10';
  }
  return 'text-brand-text-muted border-brand-border bg-white/5';
}

export function paymentRowSubtitle(req: SecurityRequest): string {
  return `Client: ${clientPaymentDisplay(req)} · Guard: ${guardPayoutDisplay(req)}`;
}
