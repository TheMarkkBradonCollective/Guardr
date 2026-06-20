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

export function canDirectorMarkClientPaidCash(req: SecurityRequest): boolean {
  return !req.paymentStatus || req.paymentStatus === 'unpaid';
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

export function canDirectorDepositCashToStripe(req: SecurityRequest): boolean {
  return isCashAwaitingStripeDeposit(req) && getRemainingStripeDeposit(req) > 0;
}

export function canDirectorMarkGuardPaidCash(req: SecurityRequest): boolean {
  return (
    req.status === 'completed' &&
    !!req.assignedGuardId &&
    ['paid', 'held'].includes(req.paymentStatus || '') &&
    req.paymentStatus !== 'released'
  );
}

/** Stripe Connect payout — never pay online for cash-paid or cash-requested jobs */
export function canStripePayGuard(req: SecurityRequest): boolean {
  if (isCashGuardPayout(req)) return false;
  return true;
}

export function stripeDepositLabel(req: SecurityRequest): string {
  const remaining = getRemainingStripeDeposit(req);
  if (remaining <= 0) return 'Paid into Stripe';
  if (isCashGuardPayout(req) || getRequiredStripeDeposit(req) < req.estimatedPayout) {
    if (isPlatformFeePaidCash(req)) {
      return `Pay $${remaining} with card`;
    }
    return `Pay $${remaining} platform fee (card)`;
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
    if (isCashAwaitingStripeDeposit(req)) {
      return isCashGuardPayout(req) ? 'Paid cash · fee deposit due' : 'Paid cash · card payment due';
    }
    return 'Paid cash · funded in Stripe';
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

export function platformFundsDisplay(req: SecurityRequest): string {
  if (!isCashClientPayment(req)) {
    if (!req.paymentStatus || req.paymentStatus === 'unpaid') return '—';
    return 'Stripe (card)';
  }
  if (isCashAwaitingStripeDeposit(req)) {
    if (isPlatformFeePaidCash(req)) {
      const remaining = getRemainingStripeDeposit(req);
      return remaining > 0
        ? `Manually deposited · $${remaining.toFixed(2)} card due`
        : 'Manually deposited';
    }
    return isCashGuardPayout(req) ? 'Guard paid cash · fee deposit due' : 'Cash in hand · pay card';
  }
  if (isPlatformFeePaidCash(req) && isCashGuardPayout(req)) {
    return 'Manually deposited';
  }
  return isCashGuardPayout(req) ? 'Fee in Stripe' : 'Funded in Stripe';
}

export function guardPayoutDisplay(req: SecurityRequest): string {
  if (req.paymentStatus !== 'released') {
    if (req.status === 'completed' && ['paid', 'held'].includes(req.paymentStatus || '')) {
      return 'Payout pending';
    }
    return '—';
  }
  return isCashGuardPayout(req) ? 'Paid cash' : 'Paid via Stripe';
}

export function guardPayoutAmount(req: SecurityRequest): number {
  return computeGuardEarnings(req.durationHours, req.hourlyRate);
}

export function parsePaymentMethod(value: unknown): PaymentMethod | undefined {
  return value === 'stripe' || value === 'cash' ? value : undefined;
}
