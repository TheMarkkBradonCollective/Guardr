import type { JobGuardSlot, SecurityGuard, SecurityRequest } from '../types';
import type { ScheduleJob } from './guardSchedule';
import {
  computeInviteExpiresAt,
  findOpenSlot,
  guardHasJobTeamAssociation,
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

export function applyAsTeamLead(
  job: SecurityRequest,
  lead: SecurityGuard,
  allJobs: ScheduleJob[],
  now = new Date()
): { job: SecurityRequest; slots: JobGuardSlot[] } | { error: string } {
  if (!isMultiGuardJob(job)) return { error: 'This job only needs one guard.' };
  if (!isGuardTrusted(lead)) return { error: 'Only trusted guards can lead a team.' };
  if (job.status !== 'open') return { error: 'This job is not open for applications.' };
  if (job.teamLeadId && job.teamLeadId !== lead.id) {
    return { error: 'Another guard is already leading this team.' };
  }
  const blocked = scheduleError(lead.id, job, allJobs);
  if (blocked) return blocked;
  const slots = mergeJobSlots(job, job.guardSlots);
  if (guardHasJobTeamAssociation(slots, lead.id)) {
    return { error: 'You are already on a team for this job.' };
  }
  const ts = now.toISOString();
  const skipStaff = shouldSkipStaffGuardReviewForTrusted(lead, job);
  const leadStatus = skipStaff ? ('pending_client' as const) : ('pending_staff' as const);
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
      pendingGuardId: skipStaff ? lead.id : undefined,
      staffApprovedGuardAt: skipStaff ? ts : undefined,
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
  if (job.teamLeadId !== lead.id) return { error: 'Only the team lead can invite guards.' };
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
  const skipStaff = !jobRequiresCashStaffConfirmation(job);
  const nextStatus = skipStaff ? ('pending_client' as const) : ('pending_staff' as const);
  const nextSlots = slots.map((s) =>
    s.id === slot.id
      ? {
          ...s,
          status: nextStatus,
          staffApprovedAt: skipStaff ? ts : undefined,
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
      pendingGuardId: skipStaff ? guardId : job.pendingGuardId,
      staffApprovedGuardAt: skipStaff ? ts : job.staffApprovedGuardAt,
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
  const blocked = scheduleError(guardId, job, allJobs);
  if (blocked) return blocked;
  const slots = mergeJobSlots(job, job.guardSlots);
  if (guardHasJobTeamAssociation(slots, guardId)) {
    return { error: 'You are already on a team for this job.' };
  }
  const openSlot = findOpenSlot(slots);
  if (!openSlot) return { error: 'No open slots on this job.' };
  const ts = now.toISOString();
  const nextStatus = skipStaffReview ? ('pending_client' as const) : ('pending_staff' as const);
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
      pendingGuardId: skipStaffReview ? guardId : job.pendingGuardId,
      staffApprovedGuardAt: skipStaffReview ? ts : job.staffApprovedGuardAt,
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
    return { error: 'You are already the team lead for this job.' };
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
