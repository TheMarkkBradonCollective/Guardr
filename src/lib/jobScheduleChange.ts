import type { SecurityRequest } from '../types';
import { computeDurationHours } from './dates';
import { jobRequiresCashStaffConfirmation } from './guardAssignment';
import { approvedTeamSlotGuardIds } from './guardSchedule';
import { isJobPaid } from './jobEditRules';

export type ScheduleChangeStatus =
  | 'none'
  | 'pending_staff'
  | 'pending_client'
  | 'awaiting_payment'
  | 'pending_staff_billing';

export type ScheduleChangeRequestedBy = 'client' | 'staff';

const RESCHEDULE_STATUSES: SecurityRequest['status'][] = ['open', 'accepted', 'in-progress'];

const ACTIVE_CREW_SLOT_STATUSES = new Set([
  'invited',
  'pending_staff',
  'crew_confirmed',
  'pending_client',
  'approved',
]);

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Hours the client already paid for — preserved when overtime billing adjusts duration. */
export function paidScheduleDurationHours(
  job: Pick<SecurityRequest, 'scheduledDurationHours' | 'durationHours'>
): number {
  return job.scheduledDurationHours ?? job.durationHours;
}

export function hasScheduleDateChange(
  existing: Pick<SecurityRequest, 'startDate' | 'endDate'>,
  startDate: string,
  endDate: string
): boolean {
  return existing.startDate !== startDate || existing.endDate !== endDate;
}

export function isDurationExtension(paidHours: number, newDurationHours: number): boolean {
  return newDurationHours > paidHours + 0.01;
}

/** Cash jobs always need staff approval when the client requests a change. */
export function scheduleChangeRequiresStaffApproval(
  job: Pick<
    SecurityRequest,
    'clientPaymentMethod' | 'clientCashPaymentRequested' | 'scheduledDurationHours' | 'durationHours'
  >,
  newDurationHours: number
): boolean {
  if (jobRequiresCashStaffConfirmation(job)) return true;
  return isDurationExtension(paidScheduleDurationHours(job), newDurationHours);
}

export function computeScheduleChangeExtraAmount(
  job: Pick<
    SecurityRequest,
    'estimatedPayout' | 'hourlyRate' | 'guardsNeeded' | 'scheduledDurationHours' | 'durationHours'
  >,
  newDurationHours: number,
  newEstimatedPayout?: number
): number {
  const paidHours = paidScheduleDurationHours(job);
  if (!isDurationExtension(paidHours, newDurationHours)) return 0;
  const guardsNeeded = job.guardsNeeded ?? 1;
  const nextPayout =
    newEstimatedPayout ??
    roundMoney(newDurationHours * job.hourlyRate * guardsNeeded);
  return Math.max(0, roundMoney(nextPayout - job.estimatedPayout));
}

export type ScheduleChangeResolution =
  | { action: 'apply' }
  | { action: 'awaiting_payment'; extraAmount: number }
  | { action: 'pending_staff_billing'; extraAmount: number };

/** What happens after staff or client approves a pending schedule change. */
export function resolveScheduleChangeAfterApproval(
  job: SecurityRequest,
  approver: 'staff' | 'client'
): ScheduleChangeResolution {
  const newDuration = job.pendingDurationHours ?? job.durationHours;
  const extraAmount = computeScheduleChangeExtraAmount(
    job,
    newDuration,
    job.pendingEstimatedPayout
  );
  const cashJob = jobRequiresCashStaffConfirmation(job);

  if (approver === 'staff' && job.scheduleChangeRequestedBy === 'client') {
    if (cashJob) return { action: 'apply' };
    if (extraAmount > 0) return { action: 'awaiting_payment', extraAmount };
    return { action: 'apply' };
  }

  if (approver === 'client' && job.scheduleChangeRequestedBy === 'staff') {
    if (cashJob) return { action: 'pending_staff_billing', extraAmount };
    if (extraAmount > 0) return { action: 'awaiting_payment', extraAmount };
    return { action: 'apply' };
  }

  return { action: 'apply' };
}

export function isScheduleChangePending(
  job: Pick<SecurityRequest, 'scheduleChangeStatus'>
): boolean {
  return !!job.scheduleChangeStatus && job.scheduleChangeStatus !== 'none';
}

export function canClientReschedulePaidSchedule(
  job: Pick<SecurityRequest, 'status' | 'paymentStatus' | 'scheduleChangeStatus'>
): boolean {
  return (
    isJobPaid(job) &&
    RESCHEDULE_STATUSES.includes(job.status) &&
    (!job.scheduleChangeStatus || job.scheduleChangeStatus === 'none')
  );
}

export function canStaffReschedulePaidSchedule(
  job: Pick<SecurityRequest, 'status' | 'paymentStatus' | 'scheduleChangeStatus'>
): boolean {
  return canClientReschedulePaidSchedule(job);
}

export function canClientApproveStaffScheduleChange(
  job: Pick<SecurityRequest, 'scheduleChangeStatus' | 'scheduleChangeRequestedBy'>
): boolean {
  return (
    job.scheduleChangeStatus === 'pending_client' && job.scheduleChangeRequestedBy === 'staff'
  );
}

export function canClientPayScheduleChangeExtension(
  job: Pick<SecurityRequest, 'scheduleChangeStatus' | 'scheduleChangeExtraAmount'>
): boolean {
  return (
    job.scheduleChangeStatus === 'awaiting_payment' &&
    (job.scheduleChangeExtraAmount ?? 0) > 0
  );
}

export function jobHasAssignedOrOnDutyGuards(job: SecurityRequest): boolean {
  if (job.status === 'accepted' || job.status === 'in-progress') return true;
  if (job.assignedGuardId || job.pendingGuardId) return true;
  return approvedTeamSlotGuardIds(job).length > 0;
}

/** Guards who should receive a direct schedule-change alert (assigned / on duty). */
export function guardsToNotifyForScheduleChange(job: SecurityRequest): string[] {
  const ids = new Set<string>();

  if (job.assignedGuardId) ids.add(job.assignedGuardId);
  if (job.pendingGuardId) ids.add(job.pendingGuardId);

  for (const guardId of approvedTeamSlotGuardIds(job)) {
    ids.add(guardId);
  }

  if (job.status === 'accepted' || job.status === 'in-progress') {
    for (const slot of job.guardSlots ?? []) {
      if (!slot.guardId) continue;
      if (ACTIVE_CREW_SLOT_STATUSES.has(slot.status)) {
        ids.add(slot.guardId);
      }
    }
  }

  return [...ids];
}

export function getPendingScheduleChangeApprovals(
  requests: SecurityRequest[]
): SecurityRequest[] {
  return [...requests]
    .filter(
      (r) =>
        r.scheduleChangeStatus === 'pending_staff' ||
        r.scheduleChangeStatus === 'pending_staff_billing'
    )
    .sort(
      (a, b) =>
        new Date(b.scheduleChangeRequestedAt ?? b.startDate).getTime() -
        new Date(a.scheduleChangeRequestedAt ?? a.startDate).getTime()
    );
}

export function getPendingStaffBillingScheduleChanges(
  requests: SecurityRequest[]
): SecurityRequest[] {
  return [...requests]
    .filter((r) => r.scheduleChangeStatus === 'pending_staff_billing')
    .sort(
      (a, b) =>
        new Date(b.scheduleChangeRequestedAt ?? b.startDate).getTime() -
        new Date(a.scheduleChangeRequestedAt ?? a.startDate).getTime()
    );
}

export interface ResolvedScheduleChange {
  startDate: string;
  endDate: string;
  durationHours: number;
  estimatedPayout?: number;
  guardPay?: number;
}

export function resolveScheduleChangeFromUpdate(
  existing: SecurityRequest,
  updates: Partial<SecurityRequest>
): ResolvedScheduleChange | null {
  const startDate = updates.startDate ?? existing.startDate;
  const endDate = updates.endDate ?? existing.endDate;
  if (!hasScheduleDateChange(existing, startDate, endDate)) return null;

  const durationHours =
    updates.durationHours ?? computeDurationHours(startDate, endDate);

  return {
    startDate,
    endDate,
    durationHours,
    estimatedPayout: updates.estimatedPayout,
    guardPay: updates.guardPay,
  };
}

export function pendingScheduleChangeFromJob(
  job: SecurityRequest
): ResolvedScheduleChange | null {
  if (!job.pendingStartDate || !job.pendingEndDate || job.pendingDurationHours == null) {
    return null;
  }
  return {
    startDate: job.pendingStartDate,
    endDate: job.pendingEndDate,
    durationHours: job.pendingDurationHours,
    estimatedPayout: job.pendingEstimatedPayout,
  };
}

export function scheduleChangePendingDbColumns(
  job: Pick<
    SecurityRequest,
    | 'pendingStartDate'
    | 'pendingEndDate'
    | 'pendingDurationHours'
    | 'pendingEstimatedPayout'
    | 'scheduleChangeStatus'
    | 'scheduleChangeRequestedAt'
    | 'scheduleChangeRequestedBy'
    | 'scheduleChangeExtraAmount'
  >
) {
  return {
    pending_start_date: job.pendingStartDate ?? null,
    pending_end_date: job.pendingEndDate ?? null,
    pending_duration_hours: job.pendingDurationHours ?? null,
    pending_estimated_payout: job.pendingEstimatedPayout ?? null,
    schedule_change_status: job.scheduleChangeStatus ?? 'none',
    schedule_change_requested_at: job.scheduleChangeRequestedAt ?? null,
    schedule_change_requested_by: job.scheduleChangeRequestedBy ?? null,
    schedule_change_extra_amount: job.scheduleChangeExtraAmount ?? null,
  };
}

export function clearScheduleChangePending(): {
  pendingStartDate: undefined;
  pendingEndDate: undefined;
  pendingDurationHours: undefined;
  pendingEstimatedPayout: undefined;
  scheduleChangeStatus: 'none';
  scheduleChangeRequestedAt: undefined;
  scheduleChangeRequestedBy: undefined;
  scheduleChangeExtraAmount: undefined;
} {
  return {
    pendingStartDate: undefined,
    pendingEndDate: undefined,
    pendingDurationHours: undefined,
    pendingEstimatedPayout: undefined,
    scheduleChangeStatus: 'none',
    scheduleChangeRequestedAt: undefined,
    scheduleChangeRequestedBy: undefined,
    scheduleChangeExtraAmount: undefined,
  };
}
