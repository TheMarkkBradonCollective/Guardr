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

/** Guard paid cash → only platform fee goes to Stripe; otherwise deposit full client payment */
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

export function canDirectorDepositCashToStripe(req: SecurityRequest): boolean {
  return isCashAwaitingStripeDeposit(req);
}

export function canDirectorMarkGuardPaidCash(req: SecurityRequest): boolean {
  return (
    req.status === 'completed' &&
    !!req.assignedGuardId &&
    ['paid', 'held'].includes(req.paymentStatus || '') &&
    req.paymentStatus !== 'released'
  );
}

/** Stripe Connect guard payout requires the full client cash amount in Stripe */
export function canStripePayGuard(req: SecurityRequest): boolean {
  if (!isCashClientPayment(req)) return true;
  if (isCashGuardPayout(req)) return false;
  return isStripeDepositSatisfied(req) && getRequiredStripeDeposit(req) >= req.estimatedPayout - 0.01;
}

export function stripeDepositLabel(req: SecurityRequest): string {
  const remaining = getRemainingStripeDeposit(req);
  if (remaining <= 0) return 'Deposited to Stripe';
  if (isCashGuardPayout(req) || getRequiredStripeDeposit(req) < req.estimatedPayout) {
    return `Deposit $${remaining} platform fee`;
  }
  return `Deposit $${remaining} full amount`;
}

export function stripeDepositDescription(req: SecurityRequest): string {
  if (isCashGuardPayout(req)) {
    return 'Guard was paid cash — deposit only the platform fee to Stripe.';
  }
  return 'Deposit the full client payment before paying the guard via Stripe Connect.';
}

export function clientPaymentDisplay(req: SecurityRequest): string {
  if (!req.paymentStatus || req.paymentStatus === 'unpaid') return 'Unpaid';
  if (isCashClientPayment(req)) {
    if (isCashAwaitingStripeDeposit(req)) {
      return isCashGuardPayout(req) ? 'Paid cash · fee deposit pending' : 'Paid cash · deposit pending';
    }
    return 'Paid cash · in Stripe';
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
    return isCashGuardPayout(req) ? 'Guard cash · fee due' : 'Cash in hand';
  }
  return isCashGuardPayout(req) ? 'Fee in Stripe' : 'Cash in Stripe';
}

export function guardPayoutDisplay(req: SecurityRequest): string {
  if (req.paymentStatus !== 'released') {
    if (req.status === 'completed' && ['paid', 'held'].includes(req.paymentStatus || '')) {
      if (isCashClientPayment(req) && !canStripePayGuard(req) && !isCashGuardPayout(req)) {
        return 'Awaiting full Stripe deposit';
      }
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
