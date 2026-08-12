import { PaymentMethod, SecurityRequest } from '../types';
import { computeGuardEarnings, PLATFORM_FEE_PER_HOUR } from './payments';

/** Legacy rows may still say cash; treat as non-cash for all product paths. */
export function isCashClientPayment(_req: Pick<SecurityRequest, 'clientPaymentMethod'>): boolean {
  return false;
}

/** Legacy rows may still say cash; treat as non-cash for all product paths. */
export function isCashGuardPayout(_req: Pick<SecurityRequest, 'guardPayoutMethod'>): boolean {
  return false;
}

export function getPlatformFeeAmount(req: SecurityRequest): number {
  const feePerHour = req.platformFeePerHour ?? PLATFORM_FEE_PER_HOUR;
  return Math.round(req.durationHours * feePerHour * 100) / 100;
}

/** @deprecated Cash deposits removed — always 0. */
export function getRequiredStripeDeposit(_req: SecurityRequest): number {
  return 0;
}

/** @deprecated Cash deposits removed. */
export function isPlatformFeeOnlyDeposit(_req: SecurityRequest): boolean {
  return false;
}

/** @deprecated Cash deposits removed. */
export function getCashDepositedAmount(_req: SecurityRequest): number {
  return 0;
}

/** @deprecated Cash deposits removed. */
export function getRemainingStripeDeposit(_req: SecurityRequest): number {
  return 0;
}

/** Stripe is the only payment rail — deposit is always satisfied. */
export function isStripeDepositSatisfied(_req: SecurityRequest): boolean {
  return true;
}

/** @deprecated Cash client deposits removed. */
export function isCashAwaitingStripeDeposit(_req: SecurityRequest): boolean {
  return false;
}

export function isClientCashPaymentRequested(
  _req: Pick<SecurityRequest, 'clientCashPaymentRequested'>
): boolean {
  return false;
}

export function isClientCashPaymentPendingApproval(_req: SecurityRequest): boolean {
  return false;
}

export function canDirectorMarkClientPaidCash(_req: SecurityRequest): boolean {
  return false;
}

export function canStaffApproveClientCashPayment(_req: SecurityRequest): boolean {
  return false;
}

export function isPlatformFeePaidCash(_req: Pick<SecurityRequest, 'platformFeePaidCash'>): boolean {
  return false;
}

export function getPlatformFeeCashDue(_req: SecurityRequest): number {
  return 0;
}

export function canDirectorMarkPlatformFeePaidCash(_req: SecurityRequest): boolean {
  return false;
}

/** @deprecated Cash deposits removed. */
export function getManualCashDepositDue(_req: SecurityRequest): number {
  return 0;
}

export function canDirectorMarkCashDepositManually(_req: SecurityRequest): boolean {
  return false;
}

export function canDirectorDepositCashToStripe(_req: SecurityRequest): boolean {
  return false;
}

/** @deprecated Cash guard payouts removed. */
export function canDirectorPayGuardCash(_req: SecurityRequest): boolean {
  return false;
}

/**
 * Guard pay can only be released once:
 * 1. Job is complete
 * 2. All overtime is settled (client paid OR waived — not pending or awaiting payment)
 * 3. Any early clock-out refund has been returned to the client (not pending)
 */
export function canMakeGuardPayoutAvailable(req: SecurityRequest): boolean {
  if (!req.assignedGuardId) return false;
  if (req.guardPayoutAvailable) return false;
  if (!req.paymentStatus || req.paymentStatus === 'unpaid' || req.paymentStatus === 'released') return false;
  if (req.status !== 'completed') return false;

  const ot = req.overtimeStatus;
  if (ot && ot !== 'none' && ot !== 'paid' && ot !== 'waived') {
    return false;
  }

  if ((req.earlyClockOutRefundAmount ?? 0) > 0 && req.earlyClockOutRefundStatus === 'pending') {
    return false;
  }

  return true;
}

/** Staff manual payout release — only when automatic release is on dispute hold. */
export function canStaffManuallyReleaseGuardPayout(req: SecurityRequest): boolean {
  if (!canMakeGuardPayoutAvailable(req)) return false;
  return req.overtimeStatus === 'disputed';
}

/** Reason why guard pay cannot be released yet (for UI hints). */
export function guardPayoutBlockedReason(req: SecurityRequest): string | null {
  if (req.status !== 'completed') return 'Job must be complete before releasing guard pay.';

  const ot = req.overtimeStatus;
  if (ot === 'pending_client' || ot === 'pending_guard') {
    return 'Overtime is pending client approval. Wait for the client to confirm before releasing guard pay.';
  }
  if (ot === 'awaiting_payment') {
    return 'Client approved overtime but has not paid yet. Guard pay releases after overtime is collected.';
  }
  if (ot === 'disputed') {
    return 'Overtime is under dispute. Resolve the dispute before releasing guard pay.';
  }

  if ((req.earlyClockOutRefundAmount ?? 0) > 0 && req.earlyClockOutRefundStatus === 'pending') {
    return `Client refund of $${(req.earlyClockOutRefundAmount ?? 0).toFixed(2)} is pending. Return the refund to the client before releasing guard pay.`;
  }

  return null;
}

/** @deprecated Use canDirectorPayGuardCash (always false). */
export function canDirectorMarkGuardPaidCash(req: SecurityRequest): boolean {
  return canDirectorPayGuardCash(req);
}

/** Stripe is the only guard payout rail. */
export function canStripePayGuard(req: SecurityRequest): boolean {
  if (req.paymentStatus === 'released') return false;
  return true;
}

export function isPlatformFeeCollected(req: SecurityRequest): boolean {
  return !!req.paymentStatus && req.paymentStatus !== 'unpaid';
}

export function stripeDepositLabel(_req: SecurityRequest): string {
  return 'Paid into Stripe';
}

export function stripeDepositDescription(_req: SecurityRequest): string {
  return 'Client payments are collected via Stripe.';
}

export function clientPaymentDisplay(req: SecurityRequest): string {
  if (!req.paymentStatus || req.paymentStatus === 'unpaid') return 'Unpaid';
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

export function stripeDepositLedgerLabel(_req: SecurityRequest): string {
  return '—';
}

export function platformFeeLedgerLabel(req: SecurityRequest): string {
  const clientUnpaid = !req.paymentStatus || req.paymentStatus === 'unpaid';
  if (clientUnpaid) return '—';
  return 'Included in client payment';
}

export function platformFundsDisplay(req: SecurityRequest): string {
  if (!req.paymentStatus || req.paymentStatus === 'unpaid') return '—';
  return 'Stripe (card)';
}

export function guardPayoutDisplay(req: SecurityRequest): string {
  if (req.paymentStatus === 'released') {
    return 'Paid via Stripe';
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

export {
  canClientPayOvertimeStripe,
  canClientRequestOvertimeCash,
  canDirectorMarkOvertimePaidCash,
  canDirectorPayOvertimeGuardCash,
  canMakeOvertimeGuardPayoutAvailable,
  canStaffApproveOvertimeCashPayment,
  isOvertimeCashPaymentPendingApproval,
  isOvertimeClientPaid,
  overtimeGuardEarnings,
} from './shiftBilling';

/** Only Stripe is a valid payment method going forward. */
export function parsePaymentMethod(value: unknown): PaymentMethod | undefined {
  return value === 'stripe' ? 'stripe' : undefined;
}
