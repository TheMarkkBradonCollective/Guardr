import type { JobGuardSlot, JobGuardSlotStatus, SecurityRequest } from '../types';
import type { ScheduleJob } from './guardSchedule';
import {
  computeInviteExpiresAt,
  emptySlotsForJob,
  findOpenSlot,
  guardHasJobTeamAssociation,
  isMultiGuardJob,
  mergeJobSlots,
  newSlotId,
  reopenExpiredSlot,
} from './guardTeams';
import { guardScheduleConflictError } from './guardSchedule';

function scheduleError(
  guardId: string,
  job: SecurityRequest,
  allJobs: ScheduleJob[],
  guardName?: string
): { error: string } | null {
  const message = guardScheduleConflictError(guardId, job, allJobs, { guardName });
  return message ? { error: message } : null;
}

function slotStatusAfterStaffReview(skipStaff: boolean): JobGuardSlotStatus {
  return skipStaff ? 'pending_client' : 'pending_staff';
}

export function guardHasApprovedTeamSlot(
  slots: JobGuardSlot[] | undefined,
  guardId: string
): boolean {
  return (slots ?? []).some((s) => s.guardId === guardId && s.status === 'approved');
}

/** Approved roster member invites another guard into the next open slot. */
export function inviteGuardToTeamSlot(
  job: SecurityRequest,
  inviterGuardId: string,
  inviteeId: string,
  allJobs: ScheduleJob[],
  inviteeName?: string,
  now = new Date()
): { job: SecurityRequest; slots: JobGuardSlot[] } | { error: string } {
  if (!isMultiGuardJob(job)) return { error: 'This job only needs one guard.' };
  if (job.status !== 'open') return { error: 'This job is not open for invitations.' };
  if (inviterGuardId === inviteeId) return { error: 'You cannot invite yourself.' };
  const slots = mergeJobSlots(job, job.guardSlots);
  if (!guardHasApprovedTeamSlot(slots, inviterGuardId)) {
    return { error: 'You must be approved on this job before inviting other guards.' };
  }
  const blocked = scheduleError(inviteeId, job, allJobs, inviteeName);
  if (blocked) return blocked;
  if (guardHasJobTeamAssociation(slots, inviteeId)) {
    return { error: 'That guard is already tied to this job.' };
  }
  const openSlot = findOpenSlot(slots);
  if (!openSlot) return { error: 'No open slots left on this job.' };
  const invitedAt = now.toISOString();
  const inviteExpiresAt = computeInviteExpiresAt(
    job.openedAt ?? job.startDate,
    job.startDate,
    invitedAt
  );
  const nextSlots = slots.map((slot) =>
    slot.slotIndex === openSlot.slotIndex
      ? {
          ...slot,
          guardId: inviteeId,
          status: 'invited' as const,
          invitedByGuardId: inviterGuardId,
          invitedAt,
          inviteExpiresAt,
          updatedAt: invitedAt,
        }
      : slot
  );
  return { job: { ...job, guardSlots: nextSlots }, slots: nextSlots };
}

export function acceptTeamInvite(
  job: SecurityRequest,
  guardId: string,
  allJobs: ScheduleJob[],
  now = new Date()
): { job: SecurityRequest; slots: JobGuardSlot[] } | { error: string } {
  const blocked = scheduleError(guardId, job, allJobs);
  if (blocked) return blocked;
  const slots = mergeJobSlots(job, job.guardSlots);
  const slot = slots.find((s) => s.guardId === guardId && s.status === 'invited');
  if (!slot) return { error: 'No pending invitation found for this job.' };
  if (slot.inviteExpiresAt && new Date(slot.inviteExpiresAt).getTime() < now.getTime()) {
    return { error: 'This invitation has expired.' };
  }
  if (guardHasJobTeamAssociation(slots.filter((s) => s.id !== slot.id), guardId)) {
    return { error: 'You are already tied to this job.' };
  }
  const ts = now.toISOString();
  const nextSlots = slots.map((s) =>
    s.id === slot.id
      ? {
          ...s,
          status: 'pending_client' as const,
          staffApprovedAt: ts,
          invitedByGuardId: s.invitedByGuardId,
          updatedAt: ts,
        }
      : s
  );
  const nextApplicants = [...new Set([...job.applicants, guardId])];
  return {
    job: {
      ...job,
      guardSlots: nextSlots,
      applicants: nextApplicants,
      pendingGuardId: guardId,
      staffApprovedGuardAt: ts,
    },
    slots: nextSlots,
  };
}

export function declineTeamInvite(
  job: SecurityRequest,
  guardId: string,
  now = new Date()
): { job: SecurityRequest; slots: JobGuardSlot[] } | { error: string } {
  const slots = mergeJobSlots(job, job.guardSlots);
  const slot = slots.find((s) => s.guardId === guardId && s.status === 'invited');
  if (!slot) return { error: 'No pending invitation found.' };
  const ts = now.toISOString();
  const nextSlots = slots.map((s) =>
    s.id === slot.id
      ? {
          ...s,
          status: 'open' as const,
          guardId: null,
          invitedByGuardId: null,
          invitedAt: undefined,
          inviteExpiresAt: undefined,
          updatedAt: ts,
        }
      : s
  );
  return { job: { ...job, guardSlots: nextSlots }, slots: nextSlots };
}

const INVITER_REMOVABLE_STATUSES: JobGuardSlotStatus[] = ['invited'];

export function removeInvitedGuardFromTeam(
  job: SecurityRequest,
  inviterGuardId: string,
  targetGuardId: string,
  now = new Date()
): { job: SecurityRequest; slots: JobGuardSlot[] } | { error: string } {
  if (job.status !== 'open') return { error: 'This job is no longer open for roster changes.' };
  const slots = mergeJobSlots(job, job.guardSlots);
  if (!guardHasApprovedTeamSlot(slots, inviterGuardId)) {
    return { error: 'Only approved roster members can remove pending invites.' };
  }
  const slot = slots.find((s) => s.guardId === targetGuardId);
  if (!slot) return { error: 'That guard is not on this roster.' };
  if (slot.invitedByGuardId !== inviterGuardId) {
    return { error: 'You can only remove guards you invited.' };
  }
  if (!INVITER_REMOVABLE_STATUSES.includes(slot.status)) {
    return { error: 'This guard can no longer be removed from the roster.' };
  }
  return reopenMemberSlot(job, slots, slot, targetGuardId, now.toISOString());
}

/** Place an independent applicant into the next open slot for client review. */
export function proposeIndependentGuardToClient(
  job: SecurityRequest,
  guardId: string,
  skipStaffReview: boolean,
  allJobs: ScheduleJob[],
  now = new Date()
): { job: SecurityRequest; slots: JobGuardSlot[] } | { error: string } {
  if (!isMultiGuardJob(job)) return { error: 'Use the standard single-guard approval flow.' };
  if (job.status !== 'open') return { error: 'This job is not open for applications.' };
  const blocked = scheduleError(guardId, job, allJobs);
  if (blocked) return blocked;
  const slots = mergeJobSlots(job, job.guardSlots);
  const existing = slots.find((s) => s.guardId === guardId);
  if (existing && existing.status === 'pending_client') {
    return { error: 'This guard is already waiting for client approval.' };
  }
  if (existing && ['pending_staff', 'approved'].includes(existing.status)) {
    return { error: 'This guard is already tied to this job.' };
  }
  if (guardHasJobTeamAssociation(slots, guardId)) {
    return { error: 'This guard is already tied to this job.' };
  }
  const openSlot = findOpenSlot(slots);
  if (!openSlot) return { error: 'No open slots left on this job.' };
  const ts = now.toISOString();
  const nextStatus = slotStatusAfterStaffReview(skipStaffReview);
  const nextSlots = slots.map((s) =>
    s.slotIndex === openSlot.slotIndex
      ? {
          ...s,
          guardId,
          isLead: false,
          status: nextStatus,
          staffApprovedAt: skipStaffReview ? ts : undefined,
          invitedByGuardId: null,
          invitedAt: undefined,
          inviteExpiresAt: undefined,
          updatedAt: ts,
        }
      : s
  );
  const nextApplicants = [...new Set([...job.applicants, guardId])];
  return {
    job: {
      ...job,
      guardSlots: nextSlots,
      applicants: nextApplicants,
      pendingGuardId: skipStaffReview ? guardId : job.pendingGuardId,
      staffApprovedGuardAt: skipStaffReview ? ts : job.staffApprovedGuardAt,
    },
    slots: nextSlots,
  };
}

export function staffApproveIndependentSlot(
  job: SecurityRequest,
  guardId: string,
  now = new Date()
): { job: SecurityRequest; slots: JobGuardSlot[] } | { error: string } {
  const slots = mergeJobSlots(job, job.guardSlots);
  const slot = slots.find((s) => s.guardId === guardId && s.status === 'pending_staff');
  if (!slot) return { error: 'This guard is not awaiting staff review on this job.' };
  const ts = now.toISOString();
  const nextSlots = slots.map((s) =>
    s.id === slot.id
      ? { ...s, status: 'pending_client' as const, staffApprovedAt: ts, updatedAt: ts }
      : s
  );
  return {
    job: {
      ...job,
      guardSlots: nextSlots,
      pendingGuardId: guardId,
      staffApprovedGuardAt: ts,
    },
    slots: nextSlots,
  };
}

export function clientApproveTeamSlot(
  job: SecurityRequest,
  slotId: string,
  now = new Date()
): { job: SecurityRequest; slots: JobGuardSlot[] } | { error: string } {
  const slots = mergeJobSlots(job, job.guardSlots);
  const slot = slots.find((s) => s.id === slotId);
  if (!slot || !slot.guardId) return { error: 'Slot not found.' };
  if (slot.status !== 'pending_client') return { error: 'This guard is not awaiting your approval.' };
  const ts = now.toISOString();
  const nextSlots = slots.map((s) =>
    s.id === slotId
      ? { ...s, status: 'approved' as const, clientApprovedAt: ts, updatedAt: ts }
      : s
  );
  const pending = nextSlots.find((s) => s.status === 'pending_client');
  return {
    job: {
      ...job,
      guardSlots: nextSlots,
      pendingGuardId: pending?.guardId ?? undefined,
      staffApprovedGuardAt: pending ? job.staffApprovedGuardAt : undefined,
    },
    slots: nextSlots,
  };
}

export function clientDenyTeamSlot(
  job: SecurityRequest,
  slotId: string,
  now = new Date()
): { job: SecurityRequest; slots: JobGuardSlot[] } | { error: string } {
  const slots = mergeJobSlots(job, job.guardSlots);
  const slot = slots.find((s) => s.id === slotId);
  if (!slot || !slot.guardId) return { error: 'Slot not found.' };
  const deniedGuardId = slot.guardId;
  const ts = now.toISOString();
  const nextSlots = slots.map((s) =>
    s.id === slotId
      ? {
          ...s,
          status: 'open' as const,
          guardId: null,
          invitedByGuardId: null,
          invitedAt: undefined,
          inviteExpiresAt: undefined,
          staffApprovedAt: undefined,
          clientApprovedAt: undefined,
          updatedAt: ts,
        }
      : s
  );
  const nextApplicants = job.applicants.filter((id) => id !== deniedGuardId);
  const wasPending = job.pendingGuardId === deniedGuardId;
  const nextPending = wasPending
    ? nextSlots.find((s) => s.status === 'pending_client')?.guardId
    : job.pendingGuardId;
  return {
    job: {
      ...job,
      guardSlots: nextSlots,
      applicants: nextApplicants,
      pendingGuardId: nextPending ?? undefined,
    },
    slots: nextSlots,
  };
}

const TRUSTED_REVOCATION_SLOT_STATUSES: JobGuardSlotStatus[] = [
  'invited',
  'pending_staff',
  'pending_client',
  'approved',
];

export type TrustedRevocationJobUpdate = {
  job: SecurityRequest;
  slots: JobGuardSlot[];
  removedGuardIds: string[];
  relisted: boolean;
};

export function jobAffectedByTrustedRevocation(
  guardId: string,
  job: SecurityRequest
): boolean {
  if (!['open', 'accepted'].includes(job.status)) return false;
  if (job.assignedGuardId === guardId) return true;
  return (job.guardSlots ?? []).some(
    (s) => s.guardId === guardId && TRUSTED_REVOCATION_SLOT_STATUSES.includes(s.status)
  );
}

function relistJobToMarketplace(
  job: SecurityRequest,
  now = new Date()
): TrustedRevocationJobUpdate {
  const ts = now.toISOString();
  const removedGuardIds = new Set<string>();
  if (job.assignedGuardId) removedGuardIds.add(job.assignedGuardId);
  if (job.pendingGuardId) removedGuardIds.add(job.pendingGuardId);
  for (const slot of job.guardSlots ?? []) {
    if (slot.guardId) removedGuardIds.add(slot.guardId);
  }

  const slots = isMultiGuardJob(job)
    ? emptySlotsForJob(job).map((s) => ({ ...s, updatedAt: ts }))
    : [];
  const nextApplicants = job.applicants.filter((id) => !removedGuardIds.has(id));

  return {
    job: {
      ...job,
      status: 'open',
      assignedGuardId: null,
      pendingGuardId: undefined,
      staffApprovedGuardAt: undefined,
      guardSlots: isMultiGuardJob(job) ? slots : undefined,
      applicants: nextApplicants,
    },
    slots,
    removedGuardIds: [...removedGuardIds],
    relisted: true,
  };
}

function reopenMemberSlot(
  job: SecurityRequest,
  slots: JobGuardSlot[],
  slot: JobGuardSlot,
  guardId: string,
  ts: string
): { job: SecurityRequest; slots: JobGuardSlot[] } {
  const nextSlots = slots.map((s) =>
    s.id === slot.id
      ? {
          ...s,
          status: 'open' as const,
          guardId: null,
          invitedByGuardId: null,
          invitedAt: undefined,
          inviteExpiresAt: undefined,
          staffApprovedAt: undefined,
          clientApprovedAt: undefined,
          updatedAt: ts,
        }
      : s
  );
  const nextApplicants = job.applicants.filter((id) => id !== guardId);
  const nextPending =
    job.pendingGuardId === guardId
      ? nextSlots.find((s) => s.status === 'pending_client')?.guardId
      : job.pendingGuardId;
  return {
    job: {
      ...job,
      guardSlots: nextSlots,
      applicants: nextApplicants,
      pendingGuardId: nextPending ?? undefined,
    },
    slots: nextSlots,
  };
}

export function applyTrustedRevocationToJob(
  job: SecurityRequest,
  guardId: string,
  now = new Date()
): TrustedRevocationJobUpdate | null {
  if (!jobAffectedByTrustedRevocation(guardId, job)) return null;

  const isAssigned = job.assignedGuardId === guardId;
  const onActiveSlot = (job.guardSlots ?? []).some(
    (s) => s.guardId === guardId && TRUSTED_REVOCATION_SLOT_STATUSES.includes(s.status)
  );

  if (job.status === 'accepted' || isAssigned) {
    return relistJobToMarketplace(job, now);
  }

  if (onActiveSlot) {
    const slots = mergeJobSlots(job, job.guardSlots);
    const slot = slots.find((s) => s.guardId === guardId);
    if (!slot) return null;
    const reopened = reopenMemberSlot(job, slots, slot, guardId, now.toISOString());
    return {
      job: reopened.job,
      slots: reopened.slots,
      removedGuardIds: [guardId],
      relisted: false,
    };
  }

  if (job.applicants.includes(guardId)) {
    return {
      job: { ...job, applicants: job.applicants.filter((id) => id !== guardId) },
      slots: mergeJobSlots(job, job.guardSlots),
      removedGuardIds: [guardId],
      relisted: false,
    };
  }

  return null;
}

export function applyTrustedRevocationToJobs(
  guardId: string,
  jobs: SecurityRequest[],
  now = new Date()
): TrustedRevocationJobUpdate[] {
  const updates: TrustedRevocationJobUpdate[] = [];
  for (const job of jobs) {
    const update = applyTrustedRevocationToJob(job, guardId, now);
    if (update) updates.push(update);
  }
  return updates;
}

export function ensureSlotIds(job: SecurityRequest, slots: JobGuardSlot[]): JobGuardSlot[] {
  return slots.map((s) => ({
    ...s,
    id: s.id || newSlotId(job.id, s.slotIndex),
    jobId: job.id,
  }));
}

