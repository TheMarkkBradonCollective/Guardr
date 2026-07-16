import type { SecurityGuard, SecurityRequest } from '../types';
import type { ClientPaymentGates } from './platformSettings';

export const TIP_PRESET_CENTS = [500, 1000, 2000] as const;

export const TIP_MIN_CENTS = 100;

export function canClientLeaveTip(
  req: SecurityRequest,
  paymentGates: ClientPaymentGates,
  guard?: SecurityGuard | null
): boolean {
  return (
    paymentGates.allowStripe &&
    !!guard?.stripeConnectAccountId &&
    req.status === 'completed' &&
    req.tipPaymentStatus !== 'paid'
  );
}

export function parseTipDollarsToCents(input: string): number | null {
  const normalized = input.trim().replace(/^\$/, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100);
}

export function formatTipAmountDollars(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatTipAmountCents(amountCents: number): string {
  return formatTipAmountDollars(amountCents / 100);
}

export function isValidTipCents(amountCents: number): boolean {
  return Number.isInteger(amountCents) && amountCents >= TIP_MIN_CENTS;
}
