import type { JobGuardSlot, SecurityRequest } from '../types';
import { formatJobDate, formatJobTimeRange } from './guardJobs';
import { isMultiGuardJob, slotBlocksGuardAssociation } from './guardTeams';

export type ScheduleJob = Pick<
  SecurityRequest,
  | 'id'
  | 'title'
  | 'startDate'
  | 'endDate'
  | 'status'
  | 'assignedGuardId'
  | 'pendingGuardId'
  | 'applicants'
  | 'guardSlots'
  | 'guardsNeeded'
  | 'teamLeadId'
>;

const ACTIVE_STATUSES = new Set<SecurityRequest['status']>(['open', 'accepted', 'in-progress']);

export function shiftWindowsOverlap(
  a: Pick<ScheduleJob, 'startDate' | 'endDate'>,
  b: Pick<ScheduleJob, 'startDate' | 'endDate'>
): boolean {
  const aStart = new Date(a.startDate).getTime();
  const aEnd = new Date(a.endDate).getTime();
  const bStart = new Date(b.startDate).getTime();
  const bEnd = new Date(b.endDate).getTime();
  if (![aStart, aEnd, bStart, bEnd].every(Number.isFinite)) return false;
  return aStart < bEnd && bStart < aEnd;
}

/** Guard is committed to this job in a way that should block overlapping work. */
export function guardHasScheduleCommitment(guardId: string, job: ScheduleJob): boolean {
  if (!ACTIVE_STATUSES.has(job.status)) return false;

  if (
    job.assignedGuardId === guardId &&
    (job.status === 'accepted' || job.status === 'in-progress')
  ) {
    return true;
  }

  if ((job.guardSlots ?? []).some((slot) => slotBlocksGuardAssociation(slot, guardId))) {
    return true;
  }

  if (job.status !== 'open') return false;

  if (job.pendingGuardId === guardId) return true;

  if (!isMultiGuardJob(job) && job.applicants.includes(guardId)) {
    return true;
  }

  return false;
}

export function findGuardScheduleConflict(
  guardId: string,
  targetJob: Pick<ScheduleJob, 'id' | 'startDate' | 'endDate'>,
  allJobs: ScheduleJob[],
  options?: { excludeJobId?: string }
): ScheduleJob | null {
  for (const job of allJobs) {
    if (job.id === targetJob.id || job.id === options?.excludeJobId) continue;
    if (!guardHasScheduleCommitment(guardId, job)) continue;
    if (shiftWindowsOverlap(targetJob, job)) return job;
  }
  return null;
}

export function formatGuardScheduleConflictMessage(
  conflict: Pick<ScheduleJob, 'title' | 'startDate' | 'endDate'>,
  options?: { guardName?: string }
): string {
  const when = `${formatJobDate(conflict)} · ${formatJobTimeRange(conflict)}`;
  if (options?.guardName) {
    return `${options.guardName} is already scheduled for "${conflict.title}" (${when}). Shifts cannot overlap.`;
  }
  return `You are already scheduled for "${conflict.title}" (${when}). Shifts cannot overlap.`;
}

export function guardScheduleConflictError(
  guardId: string,
  targetJob: ScheduleJob,
  allJobs: ScheduleJob[],
  options?: { excludeJobId?: string; guardName?: string }
): string | null {
  const conflict = findGuardScheduleConflict(guardId, targetJob, allJobs, options);
  if (!conflict) return null;
  return formatGuardScheduleConflictMessage(conflict, { guardName: options?.guardName });
}

/** Approved crew on accepted/in-progress team jobs (lead may only be on assignedGuardId). */
export function approvedTeamSlotGuardIds(job: Pick<SecurityRequest, 'guardSlots' | 'status'>): string[] {
  if (job.status !== 'accepted' && job.status !== 'in-progress') return [];
  return (job.guardSlots ?? [])
    .filter((slot: JobGuardSlot) => slot.status === 'approved' && !!slot.guardId)
    .map((slot) => slot.guardId as string);
}
