import { SecurityRequest } from '../types';
import { computeGuardEarnings } from './payments';

export type OvertimeStatus = 'none' | 'pending_guard' | 'pending_client' | 'awaiting_payment' | 'disputed' | 'paid' | 'waived';

/** @deprecated Use overtimeStatus === 'paid' */
export type OvertimePaymentStatus = 'none' | 'unpaid' | 'paid';

/** Milliseconds the guard clocked out after scheduled end. */
export function computeLateClockOutMs(checkOutAt: string, endDate: string): number {
  const lateMs = new Date(checkOutAt).getTime() - new Date(endDate).getTime();
  return Math.max(0, lateMs);
}

/** Hours billed for late clock-out (0 when on time or early). */
export function computeLateClockOutHours(checkOutAt: string, endDate: string): number {
  const lateMs = computeLateClockOutMs(checkOutAt, endDate);
  if (lateMs <= 0) return 0;
  return Math.round((lateMs / 3_600_000) * 100) / 100;
}

export interface DetectedOvertime {
  scheduledDurationHours: number;
  scheduledEstimatedPayout: number;
  overtimeHours: number;
  overtimeAmount: number;
  overtimeStatus: 'pending_client';
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeOvertimeAmount(
  overtimeHours: number,
  hourlyRate: number,
  guardsNeeded = 1
): number {
  return roundMoney(overtimeHours * hourlyRate * guardsNeeded);
}

/** Record overtime when the guard claimed it (I stayed, or departure time after scheduled end). */
export function detectLateClockOutOvertime(
  req: Pick<
    SecurityRequest,
    'durationHours' | 'estimatedPayout' | 'hourlyRate' | 'guardsNeeded' | 'endDate' | 'overtimeStatus'
  >,
  checkOutAt: string,
  options?: { guardClaimedOvertime?: boolean }
): DetectedOvertime | null {
  if (!options?.guardClaimedOvertime) return null;
  if (req.overtimeStatus && req.overtimeStatus !== 'none') return null;

  const overtimeHours = computeLateClockOutHours(checkOutAt, req.endDate);
  if (overtimeHours <= 0) return null;

  const guards = req.guardsNeeded ?? 1;
  const overtimeAmount = roundMoney(overtimeHours * req.hourlyRate * guards);

  return {
    scheduledDurationHours: req.durationHours,
    scheduledEstimatedPayout: req.estimatedPayout,
    overtimeHours,
    overtimeAmount,
    overtimeStatus: 'pending_client',
  };
}

/** Billable hours for client — subtracts unpaid break time used. */
export function billableDurationHours(
  req: Pick<SecurityRequest, 'durationHours' | 'breakMinutes' | 'breakPaid' | 'shiftBreaks'>
): number {
  const base = req.durationHours;
  if (req.breakPaid !== false || (req.breakMinutes ?? 0) <= 0) return base;
  let breakMs = 0;
  for (const brk of req.shiftBreaks ?? []) {
    if (!brk.endedAt) continue;
    const start = new Date(brk.startedAt).getTime();
    const end = new Date(brk.endedAt).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
      breakMs += end - start;
    }
  }
  const breakHours = breakMs / 3_600_000;
  return Math.max(0, roundMoney(base - breakHours));
}

export function guardClaimsOvertimeForClockOut(
  checkOutAt: string,
  endDate: string,
  options: { stayed?: boolean; leftEarlier?: boolean }
): boolean {
  if (options.stayed) return computeLateClockOutHours(checkOutAt, endDate) > 0;
  if (options.leftEarlier) {
    return new Date(checkOutAt).getTime() > new Date(endDate).getTime();
  }
  return false;
}

export function billableEstimatedPayout(
  req: Pick<
    SecurityRequest,
    'durationHours' | 'hourlyRate' | 'guardsNeeded' | 'breakMinutes' | 'breakPaid' | 'shiftBreaks' | 'estimatedPayout'
  >
): number {
  const hours = billableDurationHours(req);
  const guards = req.guardsNeeded ?? 1;
  return roundMoney(hours * req.hourlyRate * guards);
}

export function overtimeGuardEarnings(
  req: Pick<SecurityRequest, 'overtimeHours' | 'hourlyRate' | 'guardPay'>
): number {
  if (!req.overtimeHours || req.overtimeHours <= 0) return 0;
  return computeGuardEarnings(req.overtimeHours, req.hourlyRate, req.guardPay);
}

export function hasOvertime(req: Pick<SecurityRequest, 'overtimeStatus' | 'overtimeHours'>): boolean {
  return !!req.overtimeStatus && req.overtimeStatus !== 'none' && (req.overtimeHours ?? 0) > 0;
}

export function canGuardApproveOvertime(
  req: Pick<SecurityRequest, 'overtimeStatus' | 'overtimeHours'>
): boolean {
  return req.overtimeStatus === 'pending_guard' && (req.overtimeHours ?? 0) > 0;
}

export function canClientApproveOvertime(
  req: Pick<SecurityRequest, 'overtimeStatus'>
): boolean {
  return req.overtimeStatus === 'pending_client';
}

export function canClientDisputeOvertime(req: SecurityRequest): boolean {
  return canClientApproveOvertime(req) && (req.overtimeAmount ?? 0) > 0;
}

export interface OvertimeDisputeInput {
  reason: string;
  claimedClockOutAt: string;
}

/** Validate client-stated guard clock-out time during an overtime dispute. */
export function validateDisputeClaimedClockOut(
  claimedClockOutAt: string,
  req: Pick<SecurityRequest, 'startDate' | 'endDate' | 'checkInAudit' | 'checkOutAudit'>
): string | null {
  const claimedMs = new Date(claimedClockOutAt).getTime();
  if (Number.isNaN(claimedMs)) return 'Enter a valid clock-out time.';

  const minMs = new Date(req.checkInAudit?.checkedAt ?? req.startDate).getTime();
  const maxMs = new Date(req.checkOutAudit?.checkedAt ?? new Date().toISOString()).getTime();

  if (claimedMs < minMs) return 'Clock-out time cannot be before the guard checked in.';
  if (claimedMs > maxMs) return 'Clock-out time cannot be after the recorded clock-out.';
  return null;
}

export function isOvertimeDisputed(req: Pick<SecurityRequest, 'overtimeStatus'>): boolean {
  return req.overtimeStatus === 'disputed';
}

export function isOvertimeWaived(req: Pick<SecurityRequest, 'overtimeStatus'>): boolean {
  return req.overtimeStatus === 'waived';
}

export function canStaffResolveOvertimeDispute(
  req: Pick<SecurityRequest, 'overtimeStatus'>
): boolean {
  return req.overtimeStatus === 'disputed';
}

export function isOvertimeAwaitingClientPayment(req: SecurityRequest): boolean {
  return req.overtimeStatus === 'awaiting_payment';
}

export function isOvertimeCashPaymentPendingApproval(req: SecurityRequest): boolean {
  return (
    req.overtimeStatus === 'awaiting_payment' &&
    !!req.overtimeClientCashPaymentRequested &&
    req.overtimePaymentStatus !== 'paid'
  );
}

export function hasUnpaidOvertime(req: SecurityRequest): boolean {
  return isOvertimeAwaitingClientPayment(req) && !isOvertimeCashPaymentPendingApproval(req);
}

export function canClientPayOvertimeStripe(
  req: SecurityRequest,
  gates: { allowStripe: boolean }
): boolean {
  return hasUnpaidOvertime(req) && gates.allowStripe;
}

export function canClientRequestOvertimeCash(
  req: SecurityRequest,
  gates: { allowCash: boolean }
): boolean {
  return (
    hasUnpaidOvertime(req) &&
    gates.allowCash &&
    !req.overtimeClientCashPaymentRequested
  );
}

export function canStaffApproveOvertimeCashPayment(req: SecurityRequest): boolean {
  return isOvertimeCashPaymentPendingApproval(req);
}

export function canDirectorMarkOvertimePaidCash(req: SecurityRequest): boolean {
  return (
    isOvertimeAwaitingClientPayment(req) &&
    !req.overtimeClientCashPaymentRequested &&
    req.overtimePaymentStatus !== 'paid'
  );
}

export function isOvertimeClientPaid(req: SecurityRequest): boolean {
  return req.overtimeStatus === 'paid' || req.overtimePaymentStatus === 'paid';
}

export function canMakeOvertimeGuardPayoutAvailable(req: SecurityRequest): boolean {
  return (
    isOvertimeClientPaid(req) &&
    !req.overtimeGuardPayoutAvailable &&
    !req.overtimeGuardPayoutMethod &&
    !!req.assignedGuardId
  );
}

export function canDirectorPayOvertimeGuardCash(req: SecurityRequest): boolean {
  return (
    isOvertimeClientPaid(req) &&
    !req.overtimeGuardPayoutMethod &&
    !!req.assignedGuardId
  );
}

export function isOvertimeGuardPaid(req: SecurityRequest): boolean {
  return !!req.overtimeGuardPayoutMethod;
}

/** Apply billed totals once the client has paid overtime. */
export function applyOvertimePaidBilling(
  req: Pick<
    SecurityRequest,
    'scheduledDurationHours' | 'scheduledEstimatedPayout' | 'overtimeHours' | 'overtimeAmount' | 'durationHours' | 'estimatedPayout'
  >
): Pick<SecurityRequest, 'durationHours' | 'estimatedPayout' | 'overtimeStatus' | 'overtimePaymentStatus'> {
  const scheduledDurationHours = req.scheduledDurationHours ?? req.durationHours;
  const scheduledEstimatedPayout = req.scheduledEstimatedPayout ?? req.estimatedPayout;
  return {
    durationHours: roundMoney(scheduledDurationHours + (req.overtimeHours ?? 0)),
    estimatedPayout: roundMoney(scheduledEstimatedPayout + (req.overtimeAmount ?? 0)),
    overtimeStatus: 'paid',
    overtimePaymentStatus: 'paid',
  };
}

export function overtimeStatusLabel(status?: OvertimeStatus): string {
  switch (status) {
    case 'pending_guard':
      return 'Awaiting client approval';
    case 'pending_client':
      return 'Awaiting client approval';
    case 'disputed':
      return 'Dispute under staff review';
    case 'awaiting_payment':
      return 'Awaiting client payment';
    case 'waived':
      return 'Overtime waived';
    case 'paid':
      return 'Overtime paid';
    default:
      return '';
  }
}

export function overtimePaymentLabel(req: SecurityRequest): string | undefined {
  if (!hasOvertime(req) && !isOvertimeWaived(req)) return undefined;
  if (isOvertimeWaived(req)) {
    return 'Late clock-out overtime — waived after dispute';
  }
  const hoursLabel = req.overtimeHours ? `${req.overtimeHours}h` : 'extra time';
  if (isOvertimeClientPaid(req)) {
    return `Late clock-out (${hoursLabel}) — $${(req.overtimeAmount ?? 0).toFixed(2)} paid`;
  }
  if (isOvertimeDisputed(req)) {
    return `Late clock-out (${hoursLabel}) — disputed, staff reviewing`;
  }
  if (isOvertimeAwaitingClientPayment(req)) {
    return `Late clock-out (${hoursLabel}) — $${(req.overtimeAmount ?? 0).toFixed(2)} due`;
  }
  return `Late clock-out (${hoursLabel}) — pending approval`;
}
