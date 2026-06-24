import type { JobGuardSlot, SecurityGuard, SecurityRequest } from '../types';
import type { ScheduleJob } from './guardSchedule';
import {
  allCrewSlotsInternallyConfirmed,
  computeInviteExpiresAt,
  findOpenSlot,
  guardHasJobTeamAssociation,
  isFullCrewAwaitingClientApproval,
  isMultiGuardJob,
  mergeJobSlots,
  newSlotId,
} from './guardTeams';
import { isGuardTrusted } from './guardTrust';
import { jobRequiresCashStaffConfirmation, shouldSkipStaffGuardReviewForTrusted } from './guardAssignment';
import { guardScheduleConflictError } from './guardSchedule';
import { findOpenTeamJobByCode, generateUniqueTeamCode } from './teamCode';

function scheduleError(
  guardId: string,
  job: SecurityRequest,
  allJobs: ScheduleJob[],
  guardName?: string
): { error: string } | null {
  const message = guardScheduleConflictError(guardId, job, allJobs, { guardName });
  return message ? { error: message } : null;
}

function internalCrewSlotStatus(
  skipStaff: boolean
): 'crew_confirmed' | 'pending_staff' {
  return skipStaff ? 'crew_confirmed' : 'pending_staff';
}

export function applyAsTeamLead(
  job: SecurityRequest,
  lead: SecurityGuard,
  allJobs: ScheduleJob[],
  now = new Date()
): { job: SecurityRequest; slots: JobGuardSlot[] } | { error: string } {
  if (!isMultiGuardJob(job)) return { error: 'This job only needs one guard.' };
  if (!isGuardTrusted(lead)) return { error: 'Only trusted guards can coordinate a crew.' };
  if (job.status !== 'open') return { error: 'This job is not open for applications.' };
  if (job.teamLeadId && job.teamLeadId !== lead.id) {
    return { error: 'Another guard is already coordinating this crew.' };
  }
  const blocked = scheduleError(lead.id, job, allJobs);
  if (blocked) return blocked;
  const slots = mergeJobSlots(job, job.guardSlots);
  if (guardHasJobTeamAssociation(slots, lead.id)) {
    return { error: 'You are already on a team for this job.' };
  }
  const ts = now.toISOString();
  const skipStaff = shouldSkipStaffGuardReviewForTrusted(lead, job);
  const leadStatus = internalCrewSlotStatus(skipStaff);
  const nextSlots = slots.map((slot) => {
    if (slot.slotIndex !== 1) return slot;
    return {
      ...slot,
      guardId: lead.id,
      isLead: true,
      status: leadStatus,
      staffApprovedAt: skipStaff ? ts : undefined,
      updatedAt: ts,
    };
  });
  const nextApplicants = [...new Set([...job.applicants, lead.id])];
  return {
    job: {
      ...job,
      teamLeadId: lead.id,
      teamCode: job.teamCode ?? generateUniqueTeamCode(allJobs),
      guardSlots: nextSlots,
      applicants: nextApplicants,
    },
    slots: nextSlots,
  };
}

export function inviteGuardToTeam(
  job: SecurityRequest,
  lead: SecurityGuard,
  inviteeId: string,
  allJobs: ScheduleJob[],
  inviteeName?: string,
  now = new Date()
): { job: SecurityRequest; slots: JobGuardSlot[] } | { error: string } {
  if (!isMultiGuardJob(job)) return { error: 'This job only needs one guard.' };
  if (job.teamLeadId !== lead.id) return { error: 'Only the crew coordinator can invite guards.' };
  const blocked = scheduleError(inviteeId, job, allJobs, inviteeName);
  if (blocked) return blocked;
  const slots = mergeJobSlots(job, job.guardSlots);
  if (guardHasJobTeamAssociation(slots, inviteeId)) {
    return { error: 'That guard is already tied to this job.' };
  }
  const openSlot = findOpenSlot(slots);
  if (!openSlot) return { error: 'No open slots left on this team.' };
  const postedAt = job.openedAt ?? job.startDate;
  const invitedAt = now.toISOString();
  const inviteExpiresAt = computeInviteExpiresAt(postedAt, job.startDate, invitedAt);
  const ts = invitedAt;
  const nextSlots = slots.map((slot) =>
    slot.slotIndex === openSlot.slotIndex
      ? {
          ...slot,
          guardId: inviteeId,
          status: 'invited' as const,
          invitedByGuardId: lead.id,
          invitedAt,
          inviteExpiresAt,
          updatedAt: ts,
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
    return { error: 'You are already on a team for this job.' };
  }
  const ts = now.toISOString();
  const requiresStaff = jobRequiresCashStaffConfirmation(job);
  const nextStatus = internalCrewSlotStatus(!requiresStaff);
  const nextSlots = slots.map((s) =>
    s.id === slot.id
      ? {
          ...s,
          status: nextStatus,
          staffApprovedAt: requiresStaff ? undefined : ts,
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

export function applyToOpenTeamSlot(
  job: SecurityRequest,
  guardId: string,
  skipStaffReview: boolean,
  allJobs: ScheduleJob[],
  now = new Date()
): { job: SecurityRequest; slots: JobGuardSlot[] } | { error: string } {
  if (!isMultiGuardJob(job)) return { error: 'Use the standard apply flow for this job.' };
  if (!job.teamLeadId) {
    return { error: 'Apply independently for this job — no crew coordinator yet.' };
  }
  const blocked = scheduleError(guardId, job, allJobs);
  if (blocked) return blocked;
  const slots = mergeJobSlots(job, job.guardSlots);
  if (guardHasJobTeamAssociation(slots, guardId)) {
    return { error: 'You are already on a team for this job.' };
  }
  const openSlot = findOpenSlot(slots);
  if (!openSlot) return { error: 'No open slots on this job.' };
  const ts = now.toISOString();
  const nextStatus = internalCrewSlotStatus(skipStaffReview);
  const nextSlots = slots.map((s) =>
    s.slotIndex === openSlot.slotIndex
      ? {
          ...s,
          guardId,
          status: nextStatus,
          staffApprovedAt: skipStaffReview ? ts : undefined,
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
    },
    slots: nextSlots,
  };
}

export function joinTeamWithCode(
  rawCode: string,
  guardId: string,
  allJobs: SecurityRequest[],
  skipStaffReview: boolean,
  now = new Date()
): { job: SecurityRequest; slots: JobGuardSlot[] } | { error: string } {
  const job = findOpenTeamJobByCode(rawCode, allJobs);
  if (!job) {
    return { error: 'Team code not found or this crew is no longer accepting members.' };
  }
  if (job.teamLeadId === guardId) {
    return { error: 'You are already the crew coordinator for this job.' };
  }
  return applyToOpenTeamSlot(job, guardId, skipStaffReview, allJobs, now);
}

export function staffApproveTeamSlot(
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
      ? { ...s, status: 'crew_confirmed' as const, staffApprovedAt: ts, updatedAt: ts }
      : s
  );
  return {
    job: {
      ...job,
      guardSlots: nextSlots,
    },
    slots: nextSlots,
  };
}

/** When every crew slot is internally confirmed, expose the full roster to the client at once. */
export function promoteFullCrewToClientIfReady(
  job: SecurityRequest,
  slots: JobGuardSlot[],
  now = new Date()
): { job: SecurityRequest; slots: JobGuardSlot[]; promoted: boolean } {
  if (!job.teamLeadId || !isMultiGuardJob(job)) {
    return { job, slots, promoted: false };
  }
  const needed = job.guardsNeeded ?? 1;
  if (!allCrewSlotsInternallyConfirmed(slots, needed)) {
    return { job, slots, promoted: false };
  }
  if (isFullCrewAwaitingClientApproval({ ...job, guardSlots: slots })) {
    return { job, slots, promoted: false };
  }
  const ts = now.toISOString();
  const nextSlots = slots.map((s) =>
    s.status === 'crew_confirmed'
      ? { ...s, status: 'pending_client' as const, updatedAt: ts }
      : s
  );
  return {
    job: { ...job, guardSlots: nextSlots },
    slots: nextSlots,
    promoted: true,
  };
}

export function clientApproveFullTeam(
  job: SecurityRequest,
  now = new Date()
): { job: SecurityRequest; slots: JobGuardSlot[] } | { error: string } {
  if (!isFullCrewAwaitingClientApproval(job)) {
    return { error: 'This coordinated crew is not ready for your approval yet.' };
  }
  const slots = mergeJobSlots(job, job.guardSlots);
  const ts = now.toISOString();
  const nextSlots = slots.map((s) =>
    s.status === 'pending_client'
      ? { ...s, status: 'approved' as const, clientApprovedAt: ts, updatedAt: ts }
      : s
  );
  return {
    job: {
      ...job,
      guardSlots: nextSlots,
      pendingGuardId: undefined,
      staffApprovedGuardAt: undefined,
    },
    slots: nextSlots,
  };
}

export function clientDenyFullTeam(
  job: SecurityRequest,
  now = new Date()
): { job: SecurityRequest; slots: JobGuardSlot[] } | { error: string } {
  if (!isFullCrewAwaitingClientApproval(job)) {
    return { error: 'This coordinated crew is not awaiting your approval.' };
  }
  const slots = mergeJobSlots(job, job.guardSlots);
  const ts = now.toISOString();
  const removedGuardIds = new Set<string>();
  const nextSlots = slots.map((s) => {
    if (s.status !== 'pending_client' || !s.guardId) return s;
    removedGuardIds.add(s.guardId);
    return {
      ...s,
      status: 'open' as const,
      guardId: null,
      invitedByGuardId: null,
      invitedAt: undefined,
      inviteExpiresAt: undefined,
      staffApprovedAt: undefined,
      clientApprovedAt: undefined,
      updatedAt: ts,
    };
  });
  const nextApplicants = job.applicants.filter((id) => !removedGuardIds.has(id));
  return {
    job: {
      ...job,
      guardSlots: nextSlots,
      applicants: nextApplicants,
      teamLeadId: undefined,
      teamCode: undefined,
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
      teamLeadId: slot.isLead ? undefined : job.teamLeadId,
    },
    slots: nextSlots,
  };
}

export function revokeLeadIfNeeded(job: SecurityRequest, slots: JobGuardSlot[]): SecurityRequest {
  const leadSlot = slots.find((s) => s.isLead);
  if (leadSlot && leadSlot.status === 'open' && !leadSlot.guardId) {
    return { ...job, teamLeadId: undefined };
  }
  return job;
}

export function ensureSlotIds(job: SecurityRequest, slots: JobGuardSlot[]): JobGuardSlot[] {
  return slots.map((s) => ({
    ...s,
    id: s.id || newSlotId(job.id, s.slotIndex),
    jobId: job.id,
  }));
}
