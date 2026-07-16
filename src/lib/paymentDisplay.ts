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
import { hasOvertime, hasUnpaidOvertime, isOvertimeCashPaymentPendingApproval, isOvertimeDisputed, isOvertimeWaived, overtimeStatusLabel } from './shiftBilling';
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
  else if (stage === 'awaiting-guard-payout' || stage === 'guard-collection-pending') guardStatus = 'owed';
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

  if ((req.overtimeAmount ?? 0) > 0 || isOvertimeWaived(req) || isOvertimeDisputed(req)) {
    let overtimeLedgerStatus: PaymentLedgerStatus = 'waiting';
    if (req.overtimeStatus === 'paid') overtimeLedgerStatus = 'paid';
    else if (isOvertimeWaived(req)) overtimeLedgerStatus = 'na';
    else if (isOvertimeDisputed(req)) overtimeLedgerStatus = 'waiting';
    else if (hasUnpaidOvertime(req) || isOvertimeCashPaymentPendingApproval(req)) overtimeLedgerStatus = 'owed';
    lines.push({
      party: 'client',
      label: 'Late clock-out',
      amount: isOvertimeWaived(req) ? req.overtimeOriginalAmount ?? 0 : req.overtimeAmount ?? 0,
      status: overtimeLedgerStatus,
      statusLabel:
        req.overtimeStatus === 'paid'
          ? 'Overtime paid'
          : isOvertimeWaived(req)
            ? 'Waived after dispute'
            : isOvertimeCashPaymentPendingApproval(req)
              ? 'Cash pending approval'
              : overtimeStatusLabel(req.overtimeStatus) || 'Pending',
    });
  }

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
  req?: Pick<
    SecurityRequest,
    | 'clientCashPaymentRequested'
    | 'paymentStatus'
    | 'overtimePaymentStatus'
    | 'overtimeAmount'
    | 'overtimeStatus'
  >
): string {
  if (req && isClientCashPaymentPendingApproval(req as SecurityRequest)) {
    return 'Cash pending';
  }
  if (req?.overtimeStatus === 'pending_guard') return 'Overtime pending guard';
  if (req?.overtimeStatus === 'pending_client') return 'Overtime pending approval';
  if (req?.overtimeStatus === 'disputed') return 'Overtime disputed';
  if (req?.overtimeStatus === 'waived') return 'Overtime waived';
  if (req && hasUnpaidOvertime(req as SecurityRequest)) {
    return 'Overtime due';
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
  req?: Pick<
    SecurityRequest,
    | 'clientCashPaymentRequested'
    | 'paymentStatus'
    | 'overtimePaymentStatus'
    | 'overtimeAmount'
    | 'overtimeStatus'
  >,
  gates?: { allowStripe: boolean; allowSquare: boolean }
): string | undefined {
  if (req?.overtimeStatus === 'pending_guard') {
    return 'Your guard must confirm the late clock-out before you can approve overtime.';
  }
  if (req?.overtimeStatus === 'pending_client') {
    return `Approve the $${(req.overtimeAmount ?? 0).toFixed(2)} overtime charge, or dispute it if the hours are wrong.`;
  }
  if (req?.overtimeStatus === 'disputed') {
    return 'Staff is reviewing your dispute. You will be notified when the charge is updated.';
  }
  if (req?.overtimeStatus === 'waived') {
    return 'Late clock-out overtime was waived after your dispute.';
  }
  if (req && hasUnpaidOvertime(req as SecurityRequest)) {
    return `Overtime approved — pay $${(req.overtimeAmount ?? 0).toFixed(2)} by card.`;
  }
  if (!status || status === 'unpaid') {
    if (jobStatus === 'pending-review') {
      return 'Staff must approve this job offer before you can pay.';
    }
    if (gates?.allowStripe && gates?.allowSquare) {
      return 'Pay by card (Stripe or Square) to unlock hiring a guard for this job.';
    }
    if (gates?.allowStripe || gates?.allowSquare) {
      return 'Pay by card to unlock hiring a guard for this job.';
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

  if (req.overtimeStatus === 'disputed') {
    return {
      headline: 'Late clock-out — dispute open',
      detail: `Client disputed $${(req.overtimeOriginalAmount ?? req.overtimeAmount ?? 0).toFixed(2)}. Review evidence in Disputes.`,
    };
  }

  if (req.overtimeStatus === 'waived') {
    return {
      headline: 'Late clock-out — overtime waived',
      detail: req.overtimeDisputeResolution || 'Staff waived the overtime charge after a client dispute.',
    };
  }

  if (hasUnpaidOvertime(req)) {
    return {
      headline: 'Late clock-out — overtime due',
      detail: `Collect $${(req.overtimeAmount ?? 0).toFixed(2)} from the client after guard and client approval.`,
    };
  }

  if (isOvertimeCashPaymentPendingApproval(req)) {
    return {
      headline: 'Overtime cash payment pending',
      detail: `Approve $${(req.overtimeAmount ?? 0).toFixed(2)} overtime cash from the client.`,
    };
  }

  if (req.overtimeStatus === 'pending_guard' || req.overtimeStatus === 'pending_client') {
    return {
      headline: 'Late clock-out — approvals pending',
      detail: overtimeStatusLabel(req.overtimeStatus),
    };
  }

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
          headline: 'Client paid cash · guard pay ready to release',
          detail: `Platform fee deposited — pay $${guardPay.toFixed(2)} in cash or deposit for the guard to collect via Stripe.`,
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
      return {
        headline: 'Job done · pay the guard',
        detail: isCashClientPayment(req)
          ? `Deposit $${guardPay.toFixed(2)} for Stripe payout, or pay $${guardPay.toFixed(2)} in cash on site.`
          : `Make $${guardPay.toFixed(2)} available so the guard can collect from Pay.`,
      };
    case 'guard-collection-pending':
      return {
        headline: 'Funds available · waiting on guard',
        detail: `$${guardPay.toFixed(2)} is ready for the guard to request bank transfer or cash pickup.`,
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
  { step: 3, label: 'Guard collects pay', description: 'Staff releases funds; the guard chooses bank transfer or cash pickup' },
] as const;

export function pipelineStageUrgency(stage: PaymentPipelineStage): number {
  switch (stage) {
    case 'awaiting-guard-payout':
      return 0;
    case 'cash-deposit-pending':
      return 1;
    case 'guard-collection-pending':
      return 2;
    case 'awaiting-client':
      return 3;
    case 'client-paid-active':
      return 3;
    case 'settled':
      return 4;
    default:
      return 5;
  }
}
