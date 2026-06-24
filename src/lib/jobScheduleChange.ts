import type { SecurityRequest } from '../types';
import { computeDurationHours } from './dates';
import { jobRequiresCashStaffConfirmation } from './guardAssignment';
import { approvedTeamSlotGuardIds } from './guardSchedule';
import { isJobPaid } from './jobEditRules';

export type ScheduleChangeStatus = 'none' | 'pending_staff';

const RESCHEDULE_STATUSES: SecurityRequest['status'][] = ['open', 'accepted', 'in-progress'];

const ACTIVE_CREW_SLOT_STATUSES = new Set([
  'invited',
  'pending_staff',
  'crew_confirmed',
  'pending_client',
  'approved',
]);

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

/** Cash jobs always need staff approval; longer shifts always need staff approval. */
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

export function canClientReschedulePaidJob(
  job: Pick<SecurityRequest, 'status' | 'paymentStatus'>
): boolean {
  return isJobPaid(job) && RESCHEDULE_STATUSES.includes(job.status);
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

export function isScheduleChangePending(
  job: Pick<SecurityRequest, 'scheduleChangeStatus'>
): boolean {
  return job.scheduleChangeStatus === 'pending_staff';
}

export function getPendingScheduleChangeApprovals(
  requests: SecurityRequest[]
): SecurityRequest[] {
  return [...requests]
    .filter((r) => r.scheduleChangeStatus === 'pending_staff')
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

export function scheduleChangePendingDbColumns(
  job: Pick<
    SecurityRequest,
    | 'pendingStartDate'
    | 'pendingEndDate'
    | 'pendingDurationHours'
    | 'pendingEstimatedPayout'
    | 'scheduleChangeStatus'
    | 'scheduleChangeRequestedAt'
  >
) {
  return {
    pending_start_date: job.pendingStartDate ?? null,
    pending_end_date: job.pendingEndDate ?? null,
    pending_duration_hours: job.pendingDurationHours ?? null,
    pending_estimated_payout: job.pendingEstimatedPayout ?? null,
    schedule_change_status: job.scheduleChangeStatus ?? 'none',
    schedule_change_requested_at: job.scheduleChangeRequestedAt ?? null,
  };
}

export function clearScheduleChangePending(): {
  pendingStartDate: undefined;
  pendingEndDate: undefined;
  pendingDurationHours: undefined;
  pendingEstimatedPayout: undefined;
  scheduleChangeStatus: 'none';
  scheduleChangeRequestedAt: undefined;
} {
  return {
    pendingStartDate: undefined,
    pendingEndDate: undefined,
    pendingDurationHours: undefined,
    pendingEstimatedPayout: undefined,
    scheduleChangeStatus: 'none',
    scheduleChangeRequestedAt: undefined,
  };
}
