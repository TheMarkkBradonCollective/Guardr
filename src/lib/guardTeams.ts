import type {
  GuardStandingCrewMember,
  JobGuardSlot,
  JobGuardSlotStatus,
  SecurityGuard,
  SecurityRequest,
} from '../types';
import { isGuardTrusted } from './guardTrust';

export const MIN_INVITE_TTL_MS = 60 * 60 * 1000;

export function isMultiGuardJob(
  job: Pick<SecurityRequest, 'guardsNeeded'>
): boolean {
  return (job.guardsNeeded ?? 1) > 1;
}

export function newSlotId(jobId: string, slotIndex: number): string {
  return `${jobId}-slot-${slotIndex}`;
}

export function emptySlotsForJob(
  job: Pick<SecurityRequest, 'id' | 'guardsNeeded'>
): JobGuardSlot[] {
  const count = job.guardsNeeded ?? 1;
  return Array.from({ length: count }, (_, i) => ({
    id: newSlotId(job.id, i + 1),
    jobId: job.id,
    slotIndex: i + 1,
    guardId: null,
    isLead: i === 0,
    status: 'open' as JobGuardSlotStatus,
  }));
}

export function mergeJobSlots(
  job: Pick<SecurityRequest, 'id' | 'guardsNeeded'>,
  existing: JobGuardSlot[] | undefined
): JobGuardSlot[] {
  const needed = job.guardsNeeded ?? 1;
  const byIndex = new Map((existing ?? []).map((s) => [s.slotIndex, s]));
  return Array.from({ length: needed }, (_, i) => {
    const slotIndex = i + 1;
    return (
      byIndex.get(slotIndex) ?? {
        id: newSlotId(job.id, slotIndex),
        jobId: job.id,
        slotIndex,
        guardId: null,
        isLead: slotIndex === 1,
        status: 'open' as JobGuardSlotStatus,
      }
    );
  });
}

/** 25% of posting → shift window from invite send, capped at shift start, minimum 1 hour. */
export function computeInviteExpiresAt(
  jobPostedAt: string,
  scheduledStart: string,
  inviteSentAt: string
): string {
  const postedMs = new Date(jobPostedAt).getTime();
  const startMs = new Date(scheduledStart).getTime();
  const sentMs = new Date(inviteSentAt).getTime();
  const windowMs = Math.max(0, startMs - postedMs);
  const ttlMs = Math.max(MIN_INVITE_TTL_MS, windowMs * 0.25);
  const expiresMs = Math.min(sentMs + ttlMs, startMs);
  return new Date(expiresMs).toISOString();
}

export function slotBlocksGuardAssociation(
  slot: JobGuardSlot,
  guardId: string
): boolean {
  if (slot.guardId !== guardId) return false;
  return ['invited', 'pending_staff', 'crew_confirmed', 'pending_client', 'approved'].includes(
    slot.status
  );
}

export function guardHasJobTeamAssociation(
  slots: JobGuardSlot[] | undefined,
  guardId: string
): boolean {
  return (slots ?? []).some((s) => slotBlocksGuardAssociation(s, guardId));
}

export function findOpenSlot(slots: JobGuardSlot[]): JobGuardSlot | undefined {
  return slots.find((s) => s.status === 'open' && !s.guardId);
}

export function slotsPendingClient(slots: JobGuardSlot[]): JobGuardSlot[] {
  return slots.filter((s) => s.status === 'pending_client' && !!s.guardId);
}

export function countApprovedCrewExcludingLead(
  slots: JobGuardSlot[],
  leadId?: string | null
): number {
  return slots.filter(
    (s) =>
      s.status === 'approved' &&
      !!s.guardId &&
      !s.isLead &&
      s.guardId !== leadId
  ).length;
}

export function countClientApprovedCrew(
  slots: JobGuardSlot[],
  leadId?: string | null
): number {
  return slots.filter(
    (s) => s.status === 'approved' && !!s.guardId && s.guardId !== leadId && !s.isLead
  ).length;
}

export function allRequiredSlotsApproved(
  slots: JobGuardSlot[],
  guardsNeeded: number
): boolean {
  const merged = slots.filter((s) => s.slotIndex <= guardsNeeded);
  if (merged.length < guardsNeeded) return false;
  return merged.every((s) => s.status === 'approved' && !!s.guardId);
}

export function teamRosterSummary(
  slots: JobGuardSlot[] | undefined,
  guardsNeeded: number
): { filled: number; open: number; pending: number; total: number } {
  const merged = mergeJobSlots({ id: '', guardsNeeded }, slots);
  const active = merged.filter((s) =>
    ['invited', 'pending_staff', 'crew_confirmed', 'pending_client', 'approved'].includes(s.status)
  );
  const approved = merged.filter((s) => s.status === 'approved');
  const open = merged.filter((s) => s.status === 'open').length;
  const pending = merged.filter((s) =>
    ['invited', 'pending_staff', 'crew_confirmed', 'pending_client'].includes(s.status)
  ).length;
  return {
    filled: approved.length,
    open,
    pending,
    total: guardsNeeded,
  };
}

export function expireStaleInvites(
  slots: JobGuardSlot[],
  now = new Date()
): JobGuardSlot[] {
  const nowMs = now.getTime();
  return slots.map((slot) => {
    if (slot.status !== 'invited' || !slot.inviteExpiresAt) return slot;
    if (new Date(slot.inviteExpiresAt).getTime() > nowMs) return slot;
    return {
      ...slot,
      status: 'expired',
      guardId: null,
      invitedByGuardId: null,
      invitedAt: undefined,
      inviteExpiresAt: undefined,
      updatedAt: now.toISOString(),
    };
  });
}

export function reopenExpiredSlot(slot: JobGuardSlot): JobGuardSlot {
  if (slot.status !== 'expired' && slot.status !== 'declined' && slot.status !== 'withdrawn') {
    return slot;
  }
  return {
    ...slot,
    status: 'open',
    guardId: null,
    invitedByGuardId: null,
    invitedAt: undefined,
    inviteExpiresAt: undefined,
    staffApprovedAt: undefined,
    clientApprovedAt: undefined,
  };
}

export function normalizeSlotsAfterExpiry(slots: JobGuardSlot[]): JobGuardSlot[] {
  return expireStaleInvites(slots).map((slot) =>
    slot.status === 'expired' ? reopenExpiredSlot(slot) : slot
  );
}

export function jobUsesTeamSlots(job: Pick<SecurityRequest, 'guardsNeeded' | 'guardSlots' | 'teamLeadId'>): boolean {
  return isMultiGuardJob(job) || (job.guardSlots?.length ?? 0) > 0 || !!job.teamLeadId;
}

export function coordinatedTeamStarted(
  job: Pick<SecurityRequest, 'teamLeadId' | 'guardSlots'>
): boolean {
  return !!job.teamLeadId;
}

export function crewSlotsForJob(
  slots: JobGuardSlot[] | undefined,
  guardsNeeded: number
): JobGuardSlot[] {
  return mergeJobSlots({ id: '', guardsNeeded }, slots).filter((s) => s.slotIndex <= guardsNeeded);
}

/** Every required slot has a guard who accepted and passed staff review (if required). */
export function allCrewSlotsInternallyConfirmed(
  slots: JobGuardSlot[] | undefined,
  guardsNeeded: number
): boolean {
  const merged = crewSlotsForJob(slots, guardsNeeded);
  if (merged.length < guardsNeeded) return false;
  return merged.every((s) => !!s.guardId && s.status === 'crew_confirmed');
}

/** Full coordinated crew is waiting for a single client decision. */
export function isFullCrewAwaitingClientApproval(
  job: Pick<SecurityRequest, 'guardsNeeded' | 'guardSlots' | 'teamLeadId'>
): boolean {
  if (!job.teamLeadId || !isMultiGuardJob(job)) return false;
  const needed = job.guardsNeeded ?? 1;
  const merged = crewSlotsForJob(job.guardSlots, needed);
  return (
    merged.length >= needed &&
    merged.every((s) => !!s.guardId && s.status === 'pending_client')
  );
}

/** Independent guard(s) sent to the client one-by-one (not a coordinated full-crew batch). */
export function hasIndependentSlotsPendingClient(
  job: Pick<SecurityRequest, 'guardsNeeded' | 'guardSlots' | 'teamLeadId'>
): boolean {
  if (!isMultiGuardJob(job) || isFullCrewAwaitingClientApproval(job)) return false;
  return (job.guardSlots ?? []).some((s) => s.status === 'pending_client' && !!s.guardId);
}

export function independentPendingClientSlots(
  job: Pick<SecurityRequest, 'guardSlots' | 'teamLeadId' | 'guardsNeeded'>
): JobGuardSlot[] {
  if (isFullCrewAwaitingClientApproval(job as SecurityRequest)) return [];
  return (job.guardSlots ?? []).filter((s) => s.status === 'pending_client' && !!s.guardId);
}

export function countApprovedIndependentSlots(
  slots: JobGuardSlot[] | undefined,
  guardsNeeded: number
): number {
  return crewSlotsForJob(slots, guardsNeeded).filter((s) => s.status === 'approved' && !!s.guardId).length;
}

/** Client-facing independent guard proposal (legacy single pendingGuardId or slot-based). */
export function isIndependentGuardPendingForClient(
  job: Pick<SecurityRequest, 'status' | 'pendingGuardId' | 'assignedGuardId' | 'teamLeadId' | 'guardSlots' | 'guardsNeeded'>
): boolean {
  if (job.status !== 'open' || job.assignedGuardId) return false;
  if (!isMultiGuardJob(job)) {
    return !!job.pendingGuardId;
  }
  if (hasIndependentSlotsPendingClient(job)) return true;
  if (!job.pendingGuardId) return false;
  const onActiveCrew = (job.guardSlots ?? []).some(
    (s) =>
      s.guardId === job.pendingGuardId &&
      ['invited', 'pending_staff', 'crew_confirmed', 'pending_client', 'approved'].includes(s.status)
  );
  return !onActiveCrew;
}

export function slotFromDbRow(row: Record<string, unknown>): JobGuardSlot {
  return {
    id: String(row.id),
    jobId: String(row.job_id),
    slotIndex: Number(row.slot_index),
    guardId: (row.guard_id as string | null) ?? null,
    isLead: row.is_lead === true,
    status: row.status as JobGuardSlotStatus,
    invitedByGuardId: (row.invited_by_guard_id as string | null) ?? null,
    invitedAt: (row.invited_at as string | null) ?? undefined,
    inviteExpiresAt: (row.invite_expires_at as string | null) ?? undefined,
    staffApprovedAt: (row.staff_approved_at as string | null) ?? undefined,
    clientApprovedAt: (row.client_approved_at as string | null) ?? undefined,
    updatedAt: (row.updated_at as string | null) ?? undefined,
  };
}

export function slotToDbRow(slot: JobGuardSlot) {
  return {
    id: slot.id,
    job_id: slot.jobId,
    slot_index: slot.slotIndex,
    guard_id: slot.guardId,
    is_lead: slot.isLead,
    status: slot.status,
    invited_by_guard_id: slot.invitedByGuardId ?? null,
    invited_at: slot.invitedAt ?? null,
    invite_expires_at: slot.inviteExpiresAt ?? null,
    staff_approved_at: slot.staffApprovedAt ?? null,
    client_approved_at: slot.clientApprovedAt ?? null,
    updated_at: slot.updatedAt ?? new Date().toISOString(),
  };
}

type CrewJobSummary = Pick<SecurityRequest, 'guardsNeeded' | 'teamLeadId' | 'status' | 'startDate'>;

export function getCoordinatingCrewJobs<T extends CrewJobSummary>(
  guardId: string,
  jobs: T[]
): T[] {
  return jobs
    .filter(
      (j) =>
        isMultiGuardJob(j) &&
        j.teamLeadId === guardId &&
        (j.status === 'open' || j.status === 'accepted' || j.status === 'in-progress')
    )
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

export function getOpenCrewLeadOpportunities<T extends CrewJobSummary>(jobs: T[]): T[] {
  return jobs
    .filter((j) => j.status === 'open' && isMultiGuardJob(j) && !j.teamLeadId)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

export type ClientCrewListing = {
  listingId: string;
  kind: 'job' | 'standing';
  crewName: string;
  crewDescription?: string;
  coordinatorId: string;
  coordinatorName: string;
  memberCount: number;
  /** Present for job-based listings */
  jobId?: string;
  guardsNeeded?: number;
  jobTitle?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  armedRequired?: boolean;
};

export function getStandingCrewDisplayName(
  guard: Pick<SecurityGuard, 'name' | 'standingCrewName'>
): string {
  const custom = guard.standingCrewName?.trim();
  if (custom) return custom;
  return `${guard.name}'s crew`;
}

export function getCrewDisplayName(
  job: Pick<SecurityRequest, 'crewName' | 'title'>,
  coordinatorName?: string,
  standingCrewName?: string | null
): string {
  const custom = job.crewName?.trim();
  if (custom) return custom;
  const standing = standingCrewName?.trim();
  if (standing) return standing;
  if (coordinatorName) return `${coordinatorName}'s crew`;
  return job.title;
}

type BrowsableGuard = Pick<
  SecurityGuard,
  'id' | 'name' | 'trusted' | 'standingCrewName' | 'standingCrewDescription' | 'userStatus' | 'verified'
>;

export function getBrowsableClientCrews(
  jobs: SecurityRequest[],
  guards: BrowsableGuard[],
  standingCrewMembers: GuardStandingCrewMember[] = []
): ClientCrewListing[] {
  const byId = new Map(guards.map((g) => [g.id, g]));
  const jobListings: ClientCrewListing[] = jobs
    .filter((j) => j.status === 'open' && isMultiGuardJob(j) && !!j.teamLeadId)
    .map((job) => {
      const coordinator = byId.get(job.teamLeadId!);
      const memberCount = (job.guardSlots ?? []).filter(
        (s) => s.guardId && s.status !== 'open' && s.status !== 'declined' && s.status !== 'expired'
      ).length;
      return {
        listingId: job.id,
        kind: 'job' as const,
        jobId: job.id,
        crewName: getCrewDisplayName(job, coordinator?.name, coordinator?.standingCrewName),
        crewDescription:
          job.crewDescription?.trim() ||
          coordinator?.standingCrewDescription?.trim() ||
          undefined,
        coordinatorId: job.teamLeadId!,
        coordinatorName: coordinator?.name ?? 'Crew coordinator',
        memberCount,
        guardsNeeded: job.guardsNeeded ?? 1,
        jobTitle: job.title,
        location: job.siteName || job.location,
        startDate: job.startDate,
        endDate: job.endDate,
        armedRequired: job.armedRequired,
      };
    });

  const coordinatorsWithOpenJobs = new Set(jobListings.map((l) => l.coordinatorId));

  const standingListings: ClientCrewListing[] = guards
    .filter((g) => isGuardTrusted(g) && !coordinatorsWithOpenJobs.has(g.id))
    .map((guard) => {
      const activeMembers = standingCrewMembers.filter(
        (m) => m.leadGuardId === guard.id && m.status === 'active'
      ).length;
      return {
        listingId: `standing:${guard.id}`,
        kind: 'standing' as const,
        crewName: getStandingCrewDisplayName(guard),
        crewDescription: guard.standingCrewDescription?.trim() || undefined,
        coordinatorId: guard.id,
        coordinatorName: guard.name,
        memberCount: 1 + activeMembers,
      };
    });

  return [...jobListings, ...standingListings].sort((a, b) => {
    if (a.kind === 'job' && b.kind === 'job') {
      return new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime();
    }
    if (a.kind === 'job') return -1;
    if (b.kind === 'job') return 1;
    return a.crewName.localeCompare(b.crewName);
  });
}

export type StaffCrewPhase =
  | 'recruiting'
  | 'needs_review'
  | 'awaiting_client'
  | 'confirmed'
  | 'active';

export type StaffCrewListing = {
  jobId: string;
  crewName: string;
  crewDescription?: string;
  coordinatorId: string | null;
  coordinatorName: string;
  clientName: string;
  jobTitle: string;
  location: string;
  startDate: string;
  endDate: string;
  jobStatus: SecurityRequest['status'];
  guardsNeeded: number;
  memberCount: number;
  pendingStaffCount: number;
  openSlots: number;
  phase: StaffCrewPhase;
};

const ACTIVE_CREW_SLOT_STATUSES: JobGuardSlotStatus[] = [
  'invited',
  'pending_staff',
  'crew_confirmed',
  'pending_client',
  'approved',
];

/** Multi-guard job with a coordinated crew roster in play (not independent slot-only flows). */
export function jobHasActiveCrewCoordination(
  job: Pick<SecurityRequest, 'guardsNeeded' | 'teamLeadId' | 'guardSlots'>
): boolean {
  if (!isMultiGuardJob(job)) return false;
  if (job.teamLeadId) return true;
  return (job.guardSlots ?? []).some((s) => ACTIVE_CREW_SLOT_STATUSES.includes(s.status));
}

export function getStaffManagedCrewJobs(jobs: SecurityRequest[]): SecurityRequest[] {
  return jobs
    .filter(
      (j) =>
        jobHasActiveCrewCoordination(j) &&
        ['open', 'accepted', 'in-progress'].includes(j.status)
    )
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

export function countStaffCrewsNeedingReview(jobs: SecurityRequest[]): number {
  return getStaffManagedCrewJobs(jobs).filter((j) =>
    (j.guardSlots ?? []).some((s) => s.status === 'pending_staff')
  ).length;
}

export function resolveStaffCrewPhase(job: SecurityRequest): StaffCrewPhase {
  if (job.status === 'accepted' || job.status === 'in-progress') return 'active';
  if (isFullCrewAwaitingClientApproval(job)) return 'awaiting_client';
  const needed = job.guardsNeeded ?? 1;
  const slots = job.guardSlots ?? [];
  if (slots.some((s) => s.status === 'pending_staff')) return 'needs_review';
  if (allCrewSlotsInternallyConfirmed(slots, needed)) return 'confirmed';
  return 'recruiting';
}

export function buildStaffCrewListing(
  job: SecurityRequest,
  guards: Pick<SecurityGuard, 'id' | 'name' | 'standingCrewName' | 'standingCrewDescription'>[]
): StaffCrewListing {
  const byId = new Map(guards.map((g) => [g.id, g]));
  const coordinator = job.teamLeadId ? byId.get(job.teamLeadId) : undefined;
  const summary = teamRosterSummary(job.guardSlots, job.guardsNeeded ?? 1);
  const memberCount = (job.guardSlots ?? []).filter(
    (s) => s.guardId && ACTIVE_CREW_SLOT_STATUSES.includes(s.status)
  ).length;
  const pendingStaffCount = (job.guardSlots ?? []).filter((s) => s.status === 'pending_staff').length;

  return {
    jobId: job.id,
    crewName: getCrewDisplayName(job, coordinator?.name, coordinator?.standingCrewName),
    crewDescription:
      job.crewDescription?.trim() || coordinator?.standingCrewDescription?.trim() || undefined,
    coordinatorId: job.teamLeadId ?? null,
    coordinatorName: coordinator?.name ?? 'No coordinator yet',
    clientName: job.clientName,
    jobTitle: job.title,
    location: job.siteName || job.location,
    startDate: job.startDate,
    endDate: job.endDate,
    jobStatus: job.status,
    guardsNeeded: job.guardsNeeded ?? 1,
    memberCount,
    pendingStaffCount,
    openSlots: summary.open,
    phase: resolveStaffCrewPhase(job),
  };
}

export function getStaffCrewListings(
  jobs: SecurityRequest[],
  guards: Pick<SecurityGuard, 'id' | 'name'>[]
): StaffCrewListing[] {
  return getStaffManagedCrewJobs(jobs).map((job) => buildStaffCrewListing(job, guards));
}

export function attachSlotsToRequests(
  requests: SecurityRequest[],
  slots: JobGuardSlot[]
): SecurityRequest[] {
  const byJob = new Map<string, JobGuardSlot[]>();
  for (const slot of slots) {
    const list = byJob.get(slot.jobId) ?? [];
    list.push(slot);
    byJob.set(slot.jobId, list);
  }
  return requests.map((req) => {
    const jobSlots = normalizeSlotsAfterExpiry(
      mergeJobSlots(req, byJob.get(req.id))
    );
    if (!isMultiGuardJob(req) && jobSlots.every((s) => s.status === 'open')) {
      return req;
    }
    return { ...req, guardSlots: jobSlots };
  });
}
