import type { JobGuardSlot, JobGuardSlotStatus, SecurityRequest } from '../types';

/** Normalize legacy coordinated slot statuses from older data. */
export function normalizeLegacySlotStatus(status: JobGuardSlotStatus): JobGuardSlotStatus {
  if (status === 'crew_confirmed') return 'pending_client';
  return status;
}

export const MIN_INVITE_TTL_MS = 60 * 60 * 1000;

const ACTIVE_SLOT_STATUSES: JobGuardSlotStatus[] = [
  'invited',
  'pending_staff',
  'pending_client',
  'approved',
];

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
    const existingSlot = byIndex.get(slotIndex);
    if (existingSlot) {
      return {
        ...existingSlot,
        status: normalizeLegacySlotStatus(existingSlot.status),
      };
    }
    return {
      id: newSlotId(job.id, slotIndex),
      jobId: job.id,
      slotIndex,
      guardId: null,
      isLead: slotIndex === 1,
      status: 'open' as JobGuardSlotStatus,
    };
  });
}

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
  return ACTIVE_SLOT_STATUSES.includes(normalizeLegacySlotStatus(slot.status));
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
  const approved = merged.filter((s) => s.status === 'approved');
  const open = merged.filter((s) => s.status === 'open').length;
  const pending = merged.filter((s) =>
    ['invited', 'pending_staff', 'pending_client'].includes(s.status)
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

export function jobUsesTeamSlots(job: Pick<SecurityRequest, 'guardsNeeded' | 'guardSlots'>): boolean {
  return isMultiGuardJob(job) || (job.guardSlots?.length ?? 0) > 0;
}

export function slotsForJob(
  slots: JobGuardSlot[] | undefined,
  guardsNeeded: number
): JobGuardSlot[] {
  return mergeJobSlots({ id: '', guardsNeeded }, slots).filter((s) => s.slotIndex <= guardsNeeded);
}

export function hasIndependentSlotsPendingClient(
  job: Pick<SecurityRequest, 'guardsNeeded' | 'guardSlots'>
): boolean {
  if (!isMultiGuardJob(job)) return false;
  return (job.guardSlots ?? []).some((s) => s.status === 'pending_client' && !!s.guardId);
}

export function independentPendingClientSlots(
  job: Pick<SecurityRequest, 'guardSlots' | 'guardsNeeded'>
): JobGuardSlot[] {
  return (job.guardSlots ?? []).filter((s) => s.status === 'pending_client' && !!s.guardId);
}

export function countApprovedIndependentSlots(
  slots: JobGuardSlot[] | undefined,
  guardsNeeded: number
): number {
  return slotsForJob(slots, guardsNeeded).filter((s) => s.status === 'approved' && !!s.guardId).length;
}

export function isIndependentGuardPendingForClient(
  job: Pick<SecurityRequest, 'status' | 'pendingGuardId' | 'assignedGuardId' | 'guardSlots' | 'guardsNeeded'>
): boolean {
  if (job.status !== 'open' || job.assignedGuardId) return false;
  if (!isMultiGuardJob(job)) {
    return !!job.pendingGuardId;
  }
  if (hasIndependentSlotsPendingClient(job)) return true;
  if (!job.pendingGuardId) return false;
  const onActiveSlot = (job.guardSlots ?? []).some(
    (s) =>
      s.guardId === job.pendingGuardId &&
      ACTIVE_SLOT_STATUSES.includes(normalizeLegacySlotStatus(s.status))
  );
  return !onActiveSlot;
}

export function slotFromDbRow(row: Record<string, unknown>): JobGuardSlot {
  const status = normalizeLegacySlotStatus(row.status as JobGuardSlotStatus);
  return {
    id: String(row.id),
    jobId: String(row.job_id),
    slotIndex: Number(row.slot_index),
    guardId: (row.guard_id as string | null) ?? null,
    isLead: row.is_lead === true,
    status,
    invitedByGuardId: (row.invited_by_guard_id as string | null) ?? undefined,
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
