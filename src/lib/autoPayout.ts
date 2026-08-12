import type { PlatformSettings } from './platformSettings';
import type { SecurityRequest } from '../types';

export function shouldScheduleAutoStripePayout(
  job: Pick<
    SecurityRequest,
    | 'paymentStatus'
    | 'clientPaymentMethod'
    | 'guardPayoutMethod'
    | 'guardCashPayoutRequested'
    | 'overtimeStatus'
    | 'assignedGuardId'
  >
): boolean {
  if (!job.assignedGuardId) return false;
  // Cash product path removed — legacy cash client / cash-request markers do not block auto payout.
  if (job.guardPayoutMethod) return false;
  if (!['paid', 'held'].includes(job.paymentStatus ?? '')) return false;
  if (job.overtimeStatus && !['none', 'paid', 'waived'].includes(job.overtimeStatus)) return false;
  return true;
}

export function computeAutoPayoutScheduledAt(
  completedAt: string,
  settings: Pick<PlatformSettings, 'autoStripePayoutDelayHours'> | PlatformSettings
): string {
  const delayHours = settings.autoStripePayoutDelayHours ?? 48;
  const scheduled = new Date(completedAt);
  scheduled.setHours(scheduled.getHours() + delayHours);
  return scheduled.toISOString();
}

export function isAutoPayoutDue(
  scheduledAt: string | undefined,
  now = Date.now()
): boolean {
  if (!scheduledAt) return false;
  const due = new Date(scheduledAt).getTime();
  return !Number.isNaN(due) && due <= now;
}
