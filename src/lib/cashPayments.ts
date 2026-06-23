import { PaymentMethod, SecurityRequest } from '../types';
import { computeGuardEarnings, PLATFORM_FEE_PER_HOUR } from './payments';

export function isCashClientPayment(req: Pick<SecurityRequest, 'clientPaymentMethod'>): boolean {
  return req.clientPaymentMethod === 'cash';
}

export function isCashGuardPayout(req: Pick<SecurityRequest, 'guardPayoutMethod'>): boolean {
  return req.guardPayoutMethod === 'cash';
}

export function getPlatformFeeAmount(req: SecurityRequest): number {
  const feePerHour = req.platformFeePerHour ?? PLATFORM_FEE_PER_HOUR;
  return Math.round(req.durationHours * feePerHour * 100) / 100;
}

/**
 * Client paid cash → how much must eventually be recorded in Stripe:
 * - Guard paid via Stripe Connect: full client payment (can be deposited after guard payout)
 * - Guard paid in cash: platform fee only
 */
export function getRequiredStripeDeposit(req: SecurityRequest): number {
  if (!isCashClientPayment(req)) return 0;
  if (isCashGuardPayout(req)) {
    return getPlatformFeeAmount(req);
  }
  return req.estimatedPayout;
}

/** Cash jobs where the Stripe/card deposit is only the platform fee (guard was paid cash). */
export function isPlatformFeeOnlyDeposit(req: SecurityRequest): boolean {
  if (!isCashClientPayment(req)) return false;
  return getRequiredStripeDeposit(req) < req.estimatedPayout;
}

export function getCashDepositedAmount(req: SecurityRequest): number {
  if (req.cashDepositedAmount != null && req.cashDepositedAmount > 0) {
    return req.cashDepositedAmount;
  }
  if (req.cashDepositedToStripe) {
    return req.estimatedPayout;
  }
  return 0;
}

export function getRemainingStripeDeposit(req: SecurityRequest): number {
  const remaining = getRequiredStripeDeposit(req) - getCashDepositedAmount(req);
  return Math.max(0, Math.round(remaining * 100) / 100);
}

export function isStripeDepositSatisfied(req: SecurityRequest): boolean {
  if (!isCashClientPayment(req)) return true;
  return getRemainingStripeDeposit(req) <= 0;
}

export function isCashAwaitingStripeDeposit(req: SecurityRequest): boolean {
  return (
    isCashClientPayment(req) &&
    !!req.paymentStatus &&
    req.paymentStatus !== 'unpaid' &&
    !isStripeDepositSatisfied(req)
  );
}

export function isClientCashPaymentRequested(
  req: Pick<SecurityRequest, 'clientCashPaymentRequested'>
): boolean {
  return !!req.clientCashPaymentRequested;
}

export function isClientCashPaymentPendingApproval(req: SecurityRequest): boolean {
  return (
    (!req.paymentStatus || req.paymentStatus === 'unpaid') && isClientCashPaymentRequested(req)
  );
}

export function canDirectorMarkClientPaidCash(req: SecurityRequest): boolean {
  return (!req.paymentStatus || req.paymentStatus === 'unpaid') && !isClientCashPaymentRequested(req);
}

export function canStaffApproveClientCashPayment(req: SecurityRequest): boolean {
  return isClientCashPaymentPendingApproval(req);
}

export function isPlatformFeePaidCash(req: Pick<SecurityRequest, 'platformFeePaidCash'>): boolean {
  return !!req.platformFeePaidCash;
}

export function getPlatformFeeCashDue(req: SecurityRequest): number {
  if (!isCashAwaitingStripeDeposit(req) || isPlatformFeePaidCash(req)) return 0;
  return getPlatformFeeAmount(req);
}

export function canDirectorMarkPlatformFeePaidCash(req: SecurityRequest): boolean {
  return getPlatformFeeCashDue(req) > 0;
}

/** Remaining cash-client balance staff can record without a card checkout */
export function getManualCashDepositDue(req: SecurityRequest): number {
  if (!isCashAwaitingStripeDeposit(req)) return 0;
  const remaining = getRemainingStripeDeposit(req);
  if (remaining <= 0) return 0;
  if (isPlatformFeeOnlyDeposit(req) && !isPlatformFeeCollected(req)) return 0;
  return remaining;
}

export function canDirectorMarkCashDepositManually(req: SecurityRequest): boolean {
  return getManualCashDepositDue(req) > 0;
}

export function canDirectorDepositCashToStripe(req: SecurityRequest): boolean {
  return isCashAwaitingStripeDeposit(req) && getRemainingStripeDeposit(req) > 0;
}

export function canDirectorPayGuardCash(req: SecurityRequest): boolean {
  if (!req.assignedGuardId) return false;
  if (!req.paymentStatus || req.paymentStatus === 'unpaid' || req.paymentStatus === 'released') return false;
  if (isCashGuardPayout(req)) return false;

  if (isCashClientPayment(req)) {
    if (req.guardPayoutAvailable) return false;
    return req.status === 'completed' && ['paid', 'held'].includes(req.paymentStatus);
  }

  return req.status === 'completed' && ['paid', 'held'].includes(req.paymentStatus);
}

/** Staff releases pay so the guard can choose bank transfer or cash pickup from Pay */
export function canMakeGuardPayoutAvailable(req: SecurityRequest): boolean {
  if (!req.assignedGuardId) return false;
  if (req.guardPayoutAvailable) return false;
  if (!req.paymentStatus || req.paymentStatus === 'unpaid' || req.paymentStatus === 'released') return false;
  if (isCashGuardPayout(req)) return false;
  return req.status === 'completed';
}

/** @deprecated Use canDirectorPayGuardCash */
export function canDirectorMarkGuardPaidCash(req: SecurityRequest): boolean {
  return canDirectorPayGuardCash(req);
}

/** Stripe Connect payout — never pay online for cash-paid or cash-requested jobs */
export function canStripePayGuard(req: SecurityRequest): boolean {
  if (isCashGuardPayout(req)) return false;
  return true;
}

/** Platform fee already recorded (manual deposit or partial Stripe deposit). */
export function isPlatformFeeCollected(req: SecurityRequest): boolean {
  if (!isCashClientPayment(req)) {
    return !!req.paymentStatus && req.paymentStatus !== 'unpaid';
  }
  if (isPlatformFeePaidCash(req)) return true;
  return getCashDepositedAmount(req) >= getPlatformFeeAmount(req) - 0.001;
}

export function stripeDepositLabel(req: SecurityRequest): string {
  const remaining = getRemainingStripeDeposit(req);
  if (remaining <= 0) return 'Paid into Stripe';
  if (isPlatformFeeOnlyDeposit(req)) {
    if (isPlatformFeePaidCash(req)) {
      return `Pay $${remaining} with card`;
    }
    return `Pay $${remaining} platform fee (card)`;
  }
  if (isPlatformFeeCollected(req)) {
    return `Deposit $${remaining} to Stripe`;
  }
  return `Pay $${remaining} with card`;
}

export function stripeDepositDescription(req: SecurityRequest): string {
  if (isCashGuardPayout(req)) {
    return 'Guard was paid cash — manually deposit the platform fee or pay with your card.';
  }
  return 'Client paid cash — pay the job amount with your own card to fund Stripe (can be after guard payout).';
}

export function clientPaymentDisplay(req: SecurityRequest): string {
  if (!req.paymentStatus || req.paymentStatus === 'unpaid') return 'Unpaid';
  if (isCashClientPayment(req)) {
    return 'Paid cash';
  }
  switch (req.paymentStatus) {
    case 'paid':
      return 'Paid (card)';
    case 'held':
      return 'Held';
    case 'released':
      return 'Released';
    default:
      return req.paymentStatus;
  }
}

export function stripeDepositLedgerLabel(req: SecurityRequest): string {
  if (!isCashClientPayment(req)) return '—';

  const remaining = getRemainingStripeDeposit(req);
  const deposited = getCashDepositedAmount(req);

  if (isStripeDepositSatisfied(req)) {
    if (req.cashDepositedManually || (isPlatformFeePaidCash(req) && isCashGuardPayout(req))) {
      return 'Manually deposited';
    }
    return 'Deposited via card';
  }

  if (deposited > 0) {
    return `$${deposited.toFixed(2)} deposited · $${remaining.toFixed(2)} remaining`;
  }

  return 'Not deposited yet';
}

export function platformFeeLedgerLabel(req: SecurityRequest): string {
  const clientUnpaid = !req.paymentStatus || req.paymentStatus === 'unpaid';
  if (clientUnpaid) return '—';

  if (!isCashClientPayment(req)) {
    return 'Included in client payment';
  }

  if (!isStripeDepositSatisfied(req)) {
    if (isCashGuardPayout(req)) {
      if (isPlatformFeePaidCash(req)) {
        return `$${getRemainingStripeDeposit(req).toFixed(2)} card deposit due`;
      }
      return `Manually deposit or card — $${getPlatformFeeAmount(req).toFixed(2)}`;
    }
    if (isPlatformFeeCollected(req)) {
      return 'Collected via Stripe';
    }
    return 'Awaiting Stripe deposit';
  }

  if (isPlatformFeePaidCash(req)) {
    return 'Manually deposited';
  }

  return 'Collected via Stripe';
}

export function platformFundsDisplay(req: SecurityRequest): string {
  if (!isCashClientPayment(req)) {
    if (!req.paymentStatus || req.paymentStatus === 'unpaid') return '—';
    return 'Stripe (card)';
  }
  if (!req.paymentStatus || req.paymentStatus === 'unpaid') return '—';
  if (!isStripeDepositSatisfied(req)) {
    return stripeDepositLedgerLabel(req);
  }
  return platformFeeLedgerLabel(req);
}

export function guardPayoutDisplay(req: SecurityRequest): string {
  if (req.paymentStatus === 'released') {
    return isCashGuardPayout(req) ? 'Paid cash' : 'Paid via Stripe';
  }
  if (req.guardPayoutAvailable && req.status === 'completed') {
    return 'Available to collect';
  }
  if (req.status === 'completed' && ['paid', 'held'].includes(req.paymentStatus || '')) {
    return 'Awaiting release';
  }
  return '—';
}

export function guardPayoutAmount(req: SecurityRequest): number {
  return computeGuardEarnings(req.durationHours, req.hourlyRate);
}

export function parsePaymentMethod(value: unknown): PaymentMethod | undefined {
  return value === 'stripe' || value === 'cash' ? value : undefined;
}
