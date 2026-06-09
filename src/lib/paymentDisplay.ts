import { SecurityRequest } from '../types';
import {
  getRemainingStripeDeposit,
  guardPayoutAmount,
  isCashClientPayment,
  isCashGuardPayout,
} from './cashPayments';
import { getPaymentPipelineStage, PaymentPipelineStage } from './paymentPipeline';

/** Client-facing payment status — no internal ledger jargon */
export function clientPaymentStatusLabel(status?: SecurityRequest['paymentStatus']): string {
  switch (status) {
    case 'paid':
      return 'Paid';
    case 'held':
      return 'Secured';
    case 'released':
      return 'Complete';
    default:
      return 'Not paid';
  }
}

export function clientPaymentStatusHint(
  status?: SecurityRequest['paymentStatus'],
  jobStatus?: SecurityRequest['status']
): string | undefined {
  if (!status || status === 'unpaid') {
    return 'Pay to unlock hiring a guard for this job.';
  }
  if (status === 'paid' && jobStatus === 'open') {
    return 'Funds received — you can hire a guard.';
  }
  if (status === 'held') {
    return 'Your payment is held while the job runs.';
  }
  if (status === 'released') {
    return 'Job finished and the guard has been paid.';
  }
  return undefined;
}

/** Staff summary for a single job's money state */
export function staffJobMoneySummary(req: SecurityRequest): { headline: string; detail: string } {
  const stage = getPaymentPipelineStage(req);
  const guardPay = guardPayoutAmount(req);
  const clientBill = req.estimatedPayout;

  switch (stage) {
    case 'awaiting-client':
      return {
        headline: 'Client has not paid yet',
        detail: `Client owes $${clientBill.toFixed(2)} before the job can proceed.`,
      };
    case 'cash-deposit-pending': {
      const due = getRemainingStripeDeposit(req);
      if (isCashGuardPayout(req)) {
        return {
          headline: 'Client paid cash · platform fee needs card deposit',
          detail: `Deposit $${due.toFixed(2)} platform fee to Stripe. Guard was or will be paid in cash.`,
        };
      }
      return {
        headline: 'Client paid cash · job amount needs card deposit',
        detail: `Deposit $${due.toFixed(2)} to Stripe (can be after paying the guard).`,
      };
    }
    case 'client-paid-active':
      return {
        headline: isCashClientPayment(req) ? 'Client paid cash · job running' : 'Client paid by card · job running',
        detail: `Guard earns $${guardPay.toFixed(2)} after the job is marked complete.`,
      };
    case 'awaiting-guard-payout':
      if (req.guardCashPayoutRequested) {
        return {
          headline: 'Job done · guard wants cash',
          detail: `Hand $${guardPay.toFixed(2)} to the guard in person, then mark paid.`,
        };
      }
      if (isCashGuardPayout(req)) {
        return {
          headline: 'Job done · pay guard in cash',
          detail: `Hand $${guardPay.toFixed(2)} to the guard and mark paid.`,
        };
      }
      return {
        headline: 'Job done · send guard pay via Stripe',
        detail: `$${guardPay.toFixed(2)} ready to transfer to the guard's connected account.`,
      };
    case 'settled':
      return {
        headline: isCashGuardPayout(req) ? 'All paid · guard received cash' : 'All paid · guard paid on Stripe',
        detail: `Client bill $${clientBill.toFixed(2)} · guard received $${guardPay.toFixed(2)}.`,
      };
    default:
      return { headline: 'Closed', detail: '' };
  }
}

export const PIPELINE_FLOW_STEPS = [
  { step: 1, label: 'Client pays', description: 'Card checkout or staff records cash on site' },
  { step: 2, label: 'Job in progress', description: 'Funds stay secured until the job is complete' },
  { step: 3, label: 'Guard gets paid', description: 'Stripe transfer or staff hands cash to the guard' },
] as const;

export function pipelineStageUrgency(stage: PaymentPipelineStage): number {
  switch (stage) {
    case 'awaiting-guard-payout':
      return 0;
    case 'cash-deposit-pending':
      return 1;
    case 'awaiting-client':
      return 2;
    case 'client-paid-active':
      return 3;
    case 'settled':
      return 4;
    default:
      return 5;
  }
}
