import { SecurityRequest } from '../types';
import { SHIFT_LATE_CLOCKOUT_MINUTES } from './shiftWindow';

export type OvertimePaymentStatus = 'none' | 'unpaid' | 'paid';

/** Milliseconds the guard clocked out after scheduled end (capped at late window). */
export function computeLateClockOutMs(checkOutAt: string, endDate: string): number {
  const lateMs = new Date(checkOutAt).getTime() - new Date(endDate).getTime();
  if (lateMs <= 0) return 0;
  const maxLateMs = SHIFT_LATE_CLOCKOUT_MINUTES * 60_000;
  return Math.min(lateMs, maxLateMs);
}

/** Hours billed for late clock-out (0 when on time or early). */
export function computeLateClockOutHours(checkOutAt: string, endDate: string): number {
  const lateMs = computeLateClockOutMs(checkOutAt, endDate);
  if (lateMs <= 0) return 0;
  return Math.round((lateMs / 3_600_000) * 100) / 100;
}

export interface LateClockOutBilling {
  scheduledDurationHours: number;
  scheduledEstimatedPayout: number;
  overtimeHours: number;
  overtimeAmount: number;
  durationHours: number;
  estimatedPayout: number;
  overtimePaymentStatus: OvertimePaymentStatus;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Compute billing adjustment when a guard clocks out after scheduled end. */
export function computeLateClockOutBilling(
  req: Pick<
    SecurityRequest,
    | 'durationHours'
    | 'estimatedPayout'
    | 'hourlyRate'
    | 'guardsNeeded'
    | 'endDate'
    | 'scheduledDurationHours'
    | 'scheduledEstimatedPayout'
    | 'overtimePaymentStatus'
  >,
  checkOutAt: string
): LateClockOutBilling | null {
  const overtimeHours = computeLateClockOutHours(checkOutAt, req.endDate);
  if (overtimeHours <= 0) return null;

  const guards = req.guardsNeeded ?? 1;
  const overtimeAmount = roundMoney(overtimeHours * req.hourlyRate * guards);
  const scheduledDurationHours = req.scheduledDurationHours ?? req.durationHours;
  const scheduledEstimatedPayout = req.scheduledEstimatedPayout ?? req.estimatedPayout;

  return {
    scheduledDurationHours,
    scheduledEstimatedPayout,
    overtimeHours,
    overtimeAmount,
    durationHours: roundMoney(scheduledDurationHours + overtimeHours),
    estimatedPayout: roundMoney(scheduledEstimatedPayout + overtimeAmount),
    overtimePaymentStatus:
      req.overtimePaymentStatus === 'paid' ? 'paid' : overtimeAmount > 0 ? 'unpaid' : 'none',
  };
}

export function hasUnpaidOvertime(
  req: Pick<SecurityRequest, 'overtimePaymentStatus' | 'overtimeAmount'>
): boolean {
  return req.overtimePaymentStatus === 'unpaid' && (req.overtimeAmount ?? 0) > 0;
}

export function overtimePaymentLabel(
  req: Pick<SecurityRequest, 'overtimePaymentStatus' | 'overtimeAmount' | 'overtimeHours'>
): string | undefined {
  if (!req.overtimeAmount || req.overtimeAmount <= 0) return undefined;
  const hoursLabel = req.overtimeHours ? `${req.overtimeHours}h` : 'extra time';
  if (req.overtimePaymentStatus === 'paid') {
    return `Late clock-out (${hoursLabel}) — $${req.overtimeAmount.toFixed(2)} paid`;
  }
  if (req.overtimePaymentStatus === 'unpaid') {
    return `Late clock-out (${hoursLabel}) — $${req.overtimeAmount.toFixed(2)} due`;
  }
  return undefined;
}
