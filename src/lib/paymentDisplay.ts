import { SecurityRequest } from '../types';
import {
  clientPaymentDisplay,
  getCashDepositedAmount,
  getPlatformFeeAmount,
  getRemainingStripeDeposit,
  getRequiredStripeDeposit,
  guardPayoutAmount,
  guardPayoutDisplay,
  isCashClientPayment,
  isCashGuardPayout,
  isClientCashPaymentPendingApproval,
  isPlatformFeeCollected,
  isPlatformFeeOnlyDeposit,
  isPlatformFeePaidCash,
  isStripeDepositSatisfied,
  platformFeeLedgerLabel,
  stripeDepositLedgerLabel,
} from './cashPayments';
import { getPaymentPipelineStage, PaymentPipelineStage } from './paymentPipeline';

export type PaymentLedgerStatus = 'paid' | 'owed' | 'waiting' | 'na';

export interface JobPaymentLedgerLine {
  party: 'client' | 'stripe' | 'guard' | 'platform';
  label: string;
  amount: number;
  status: PaymentLedgerStatus;
  statusLabel: string;
}

/** Who has paid what on a single job — staff-facing ledger rows */
export function jobPaymentLedger(req: SecurityRequest): JobPaymentLedgerLine[] {
  const guardPay = guardPayoutAmount(req);
  const platformFee = getPlatformFeeAmount(req);
  const stage = getPaymentPipelineStage(req);
  const clientUnpaid = !req.paymentStatus || req.paymentStatus === 'unpaid';

  let clientStatus: PaymentLedgerStatus = 'paid';
  if (clientUnpaid) clientStatus = 'owed';

  let guardStatus: PaymentLedgerStatus = 'waiting';
  if (req.paymentStatus === 'released') guardStatus = 'paid';
  else if (stage === 'awaiting-guard-payout') guardStatus = 'owed';
  else if (clientUnpaid || stage === 'awaiting-client') guardStatus = 'na';

  let platformStatus: PaymentLedgerStatus = 'na';
  if (isCashClientPayment(req) && !clientUnpaid) {
    platformStatus =
      isStripeDepositSatisfied(req) || isPlatformFeeCollected(req)
        ? 'paid'
        : isCashGuardPayout(req)
          ? 'owed'
          : 'waiting';
  } else if (!clientUnpaid) {
    platformStatus = 'paid';
  }

  const lines: JobPaymentLedgerLine[] = [
    {
      party: 'client',
      label: 'Client bill',
      amount: req.estimatedPayout,
      status: clientStatus,
      statusLabel: clientPaymentDisplay(req),
    },
  ];

  if (isCashClientPayment(req) && !clientUnpaid && !isPlatformFeeOnlyDeposit(req)) {
    const stripeSatisfied = isStripeDepositSatisfied(req);
    const stripeAmount = stripeSatisfied
      ? getCashDepositedAmount(req) || getRequiredStripeDeposit(req)
      : getRemainingStripeDeposit(req);

    lines.push({
      party: 'stripe',
      label: 'Stripe deposit',
      amount: stripeAmount,
      status: stripeSatisfied ? 'paid' : 'owed',
      statusLabel: stripeDepositLedgerLabel(req),
    });
  }

  lines.push(
    {
      party: 'guard',
      label: 'Guard pay',
      amount: guardPay,
      status: guardStatus,
      statusLabel: guardPayoutDisplay(req),
    },
    {
      party: 'platform',
      label: 'Platform fee',
      amount: platformFee,
      status: platformStatus,
      statusLabel: platformFeeLedgerLabel(req),
    }
  );

  return lines;
}

/** Client-facing payment status — no internal ledger jargon */
export function clientPaymentStatusLabel(
  status?: SecurityRequest['paymentStatus'],
  req?: Pick<SecurityRequest, 'clientCashPaymentRequested' | 'paymentStatus'>
): string {
  if (req && isClientCashPaymentPendingApproval(req as SecurityRequest)) {
    return 'Cash pending';
  }
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
  jobStatus?: SecurityRequest['status'],
  req?: Pick<SecurityRequest, 'clientCashPaymentRequested' | 'paymentStatus'>,
  gates?: { allowStripe: boolean; allowCash: boolean }
): string | undefined {
  if (req && isClientCashPaymentPendingApproval(req as SecurityRequest)) {
    return 'Staff will confirm once your cash payment is received.';
  }
  if (!status || status === 'unpaid') {
    if (jobStatus === 'pending-review') {
      return 'Staff must approve this job offer before you can pay.';
    }
    if (gates?.allowStripe && !gates?.allowCash) {
      return 'Pay by card to unlock hiring a guard for this job.';
    }
    if (gates?.allowCash && !gates?.allowStripe) {
      return 'Request cash payment — staff will confirm when received.';
    }
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
      if (isClientCashPaymentPendingApproval(req)) {
        return {
          headline: 'Client requested to pay in cash',
          detail: `Confirm $${clientBill.toFixed(2)} was received before assigning a guard.`,
        };
      }
      return {
        headline: 'Client has not paid yet',
        detail: `Client owes $${clientBill.toFixed(2)} before the job can proceed.`,
      };
    case 'cash-deposit-pending': {
      const due = getRemainingStripeDeposit(req);
      if (isPlatformFeeOnlyDeposit(req)) {
        return {
          headline: isPlatformFeePaidCash(req)
            ? 'Client paid cash · guard paid cash'
            : 'Client paid cash · platform fee due',
          detail: isPlatformFeePaidCash(req)
            ? `$${due.toFixed(2)} still needs to be deposited with card.`
            : `Manually deposit $${getPlatformFeeAmount(req).toFixed(2)} platform fee or pay via card.`,
        };
      }
      if (isPlatformFeeCollected(req)) {
        return {
          headline: 'Client paid cash · guard pay due',
          detail: `Platform fee deposited — pay guard $${due.toFixed(2)} with card or hand cash on site.`,
        };
      }
      return {
        headline: 'Client paid cash · Stripe deposit pending',
        detail: `$${due.toFixed(2)} not deposited to Stripe yet (can be after paying the guard).`,
      };
    }
    case 'client-paid-active':
      return {
        headline: isCashClientPayment(req) ? 'Client paid cash · job running' : 'Client paid by card · job running',
        detail: `Guard earns $${guardPay.toFixed(2)} after the job is marked complete.`,
      };
    case 'awaiting-guard-payout':
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
  { step: 1, label: 'Client pays', description: 'Card checkout, cash request, or staff records cash on site' },
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
