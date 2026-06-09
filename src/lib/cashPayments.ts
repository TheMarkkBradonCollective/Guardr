import { PaymentMethod, SecurityRequest } from '../types';
import { computeGuardEarnings } from './payments';

export function isCashClientPayment(req: Pick<SecurityRequest, 'clientPaymentMethod'>): boolean {
  return req.clientPaymentMethod === 'cash';
}

export function isCashGuardPayout(req: Pick<SecurityRequest, 'guardPayoutMethod'>): boolean {
  return req.guardPayoutMethod === 'cash';
}

export function isCashAwaitingStripeDeposit(req: SecurityRequest): boolean {
  return (
    isCashClientPayment(req) &&
    !!req.paymentStatus &&
    req.paymentStatus !== 'unpaid' &&
    !req.cashDepositedToStripe
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

/** Stripe Connect guard payout requires cash client funds to be recorded in Stripe first */
export function canStripePayGuard(req: SecurityRequest): boolean {
  if (!isCashClientPayment(req)) return true;
  return !!req.cashDepositedToStripe;
}

export function clientPaymentDisplay(req: SecurityRequest): string {
  if (!req.paymentStatus || req.paymentStatus === 'unpaid') return 'Unpaid';
  if (isCashClientPayment(req)) {
    if (isCashAwaitingStripeDeposit(req)) return 'Paid cash · deposit pending';
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
  if (isCashAwaitingStripeDeposit(req)) return 'Cash in hand';
  return 'Cash in Stripe';
}

export function guardPayoutDisplay(req: SecurityRequest): string {
  if (req.paymentStatus !== 'released') {
    if (req.status === 'completed' && ['paid', 'held'].includes(req.paymentStatus || '')) {
      if (isCashClientPayment(req) && !req.cashDepositedToStripe) {
        return 'Awaiting Stripe deposit';
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
