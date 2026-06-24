import type { JobGuardSlot, JobGuardSlotStatus, SecurityGuard, SecurityRequest } from '../types';
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

const COORDINATOR_REMOVABLE_STATUSES: JobGuardSlotStatus[] = [
  'invited',
  'pending_staff',
  'crew_confirmed',
];

function reopenCrewMemberSlot(
  job: SecurityRequest,
  slots: JobGuardSlot[],
  slot: JobGuardSlot,
  targetGuardId: string,
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
  const nextApplicants = job.applicants.filter((id) => id !== targetGuardId);
  const nextPending =
    job.pendingGuardId === targetGuardId
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

export function removeGuardFromTeam(
  job: SecurityRequest,
  leadId: string,
  targetGuardId: string,
  now = new Date()
): { job: SecurityRequest; slots: JobGuardSlot[] } | { error: string } {
  if (job.teamLeadId !== leadId) return { error: 'Only the crew coordinator can remove members.' };
  if (job.status !== 'open') return { error: 'This crew is no longer open for roster changes.' };
  if (targetGuardId === leadId) return { error: 'You cannot remove yourself as coordinator.' };
  const slots = mergeJobSlots(job, job.guardSlots);
  const slot = slots.find((s) => s.guardId === targetGuardId);
  if (!slot) return { error: 'That guard is not on this crew.' };
  if (slot.isLead) return { error: 'You cannot remove the crew coordinator slot.' };
  if (!COORDINATOR_REMOVABLE_STATUSES.includes(slot.status)) {
    return { error: 'This guard cannot be removed — they are already in client review or approved.' };
  }
  return reopenCrewMemberSlot(job, slots, slot, targetGuardId, now.toISOString());
}

const STAFF_CREW_MANAGE_STATUSES: JobGuardSlotStatus[] = [
  'invited',
  'pending_staff',
  'crew_confirmed',
];

export function staffRemoveGuardFromTeam(
  job: SecurityRequest,
  targetGuardId: string,
  now = new Date()
): { job: SecurityRequest; slots: JobGuardSlot[] } | { error: string } {
  if (job.status !== 'open') return { error: 'This crew is no longer open for roster changes.' };
  if (job.teamLeadId === targetGuardId) {
    return { error: 'Staff cannot remove the crew coordinator — reassign the lead first.' };
  }
  const slots = mergeJobSlots(job, job.guardSlots);
  const slot = slots.find((s) => s.guardId === targetGuardId);
  if (!slot) return { error: 'That guard is not on this crew.' };
  if (slot.isLead) return { error: 'You cannot remove the crew coordinator slot.' };
  if (!STAFF_CREW_MANAGE_STATUSES.includes(slot.status)) {
    return { error: 'This guard cannot be removed — they are already in client review or approved.' };
  }
  return reopenCrewMemberSlot(job, slots, slot, targetGuardId, now.toISOString());
}

export function staffDenyCrewSlot(
  job: SecurityRequest,
  guardId: string,
  now = new Date()
): { job: SecurityRequest; slots: JobGuardSlot[] } | { error: string } {
  if (job.status !== 'open') return { error: 'This crew is no longer open for changes.' };
  const slots = mergeJobSlots(job, job.guardSlots);
  const slot = slots.find((s) => s.guardId === guardId);
  if (!slot) return { error: 'That guard is not on this crew.' };
  if (!['pending_staff', 'invited', 'crew_confirmed'].includes(slot.status)) {
    return { error: 'This guard cannot be declined at their current stage.' };
  }
  if (job.teamLeadId === guardId) {
    return { error: 'Staff cannot decline the crew coordinator slot.' };
  }
  return reopenCrewMemberSlot(job, slots, slot, guardId, now.toISOString());
}

export function updateCrewProfile(
  job: SecurityRequest,
  leadId: string,
  patch: { crewName?: string | null; crewDescription?: string | null }
): { job: SecurityRequest } | { error: string } {
  if (job.teamLeadId !== leadId) return { error: 'Only the crew coordinator can edit crew details.' };
  if (job.status !== 'open') return { error: 'Crew details can only be edited while the job is open.' };
  const crewName =
    patch.crewName !== undefined ? patch.crewName?.trim() || null : job.crewName ?? null;
  const crewDescription =
    patch.crewDescription !== undefined
      ? patch.crewDescription?.trim() || null
      : job.crewDescription ?? null;
  if (crewName && crewName.length > 80) {
    return { error: 'Crew name must be 80 characters or fewer.' };
  }
  if (crewDescription && crewDescription.length > 500) {
    return { error: 'Crew description must be 500 characters or fewer.' };
  }
  return { job: { ...job, crewName, crewDescription } };
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
    return { error: 'No coordinated crew on this job yet — apply independently instead.' };
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
    return {
      error:
        'Crew code not found. Codes only work for joining an existing coordinated crew with open slots.',
    };
  }
  if (job.teamLeadId === guardId) {
    return { error: 'You are already the crew coordinator for this job.' };
  }
  return applyToOpenTeamSlot(job, guardId, skipStaffReview, allJobs, now);
}

/** Staff- or trusted-guard path: place an independent applicant into the next open slot for client review. */
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
  if (
    existing &&
    ['pending_staff', 'crew_confirmed', 'approved'].includes(existing.status)
  ) {
    return { error: 'This guard is already tied to this job.' };
  }
  if (guardHasJobTeamAssociation(slots, guardId)) {
    return { error: 'This guard is already tied to this job.' };
  }
  const openSlot = findOpenSlot(slots);
  if (!openSlot) return { error: 'No open slots left on this job.' };
  const ts = now.toISOString();
  const nextStatus = internalCrewSlotStatus(skipStaffReview);
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
