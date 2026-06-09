import { PaymentMethod, SecurityRequest } from '../types';
import { computeGuardEarnings } from './payments';

export function isCashClientPayment(req: Pick<SecurityRequest, 'clientPaymentMethod'>): boolean {
  return req.clientPaymentMethod === 'cash';
}

export function isCashGuardPayout(req: Pick<SecurityRequest, 'guardPayoutMethod'>): boolean {
  return req.guardPayoutMethod === 'cash';
}

export function canDirectorMarkClientPaidCash(req: SecurityRequest): boolean {
  return !req.paymentStatus || req.paymentStatus === 'unpaid';
}

export function canDirectorMarkGuardPaidCash(req: SecurityRequest): boolean {
  return (
    req.status === 'completed' &&
    !!req.assignedGuardId &&
    ['paid', 'held'].includes(req.paymentStatus || '') &&
    req.paymentStatus !== 'released'
  );
}

export function clientPaymentDisplay(req: SecurityRequest): string {
  if (!req.paymentStatus || req.paymentStatus === 'unpaid') return 'Unpaid';
  if (isCashClientPayment(req)) return 'Paid (Cash)';
  switch (req.paymentStatus) {
    case 'paid':
      return 'Paid';
    case 'held':
      return 'Held';
    case 'released':
      return 'Released';
    default:
      return req.paymentStatus;
  }
}

export function guardPayoutDisplay(req: SecurityRequest): string {
  if (req.paymentStatus !== 'released') {
    if (req.status === 'completed' && ['paid', 'held'].includes(req.paymentStatus || '')) {
      return 'Payout pending';
    }
    return '—';
  }
  return isCashGuardPayout(req) ? 'Paid cash' : 'Released (Stripe)';
}

export function guardPayoutAmount(req: SecurityRequest): number {
  return computeGuardEarnings(req.durationHours, req.hourlyRate);
}

export function parsePaymentMethod(value: unknown): PaymentMethod | undefined {
  return value === 'stripe' || value === 'cash' ? value : undefined;
}
