import type { JobGuardSlot, SecurityRequest } from '../types';
import { slotToDbRow } from './guardTeams';
import { allRequiredSlotsApproved } from './guardTeams';

export async function persistJobGuardSlots(
  supabase: { from: (table: string) => any },
  slots: JobGuardSlot[]
): Promise<void> {
  if (slots.length === 0) return;
  const rows = slots.map(slotToDbRow);
  const { error } = await supabase.from('job_guard_slots').upsert(rows);
  if (error) throw error;
}

export async function persistJobTeamMeta(
  supabase: { from: (table: string) => any },
  jobId: string,
  patch: Partial<Pick<SecurityRequest, 'teamLeadId' | 'pendingGuardId' | 'staffApprovedGuardAt' | 'applicants' | 'status' | 'assignedGuardId'>>
): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.teamLeadId !== undefined) dbPatch.team_lead_id = patch.teamLeadId;
  if (patch.pendingGuardId !== undefined) dbPatch.pending_guard_id = patch.pendingGuardId;
  if (patch.staffApprovedGuardAt !== undefined) dbPatch.staff_approved_guard_at = patch.staffApprovedGuardAt;
  if (patch.applicants !== undefined) dbPatch.applicants = patch.applicants;
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.assignedGuardId !== undefined) dbPatch.assigned_guard_id = patch.assignedGuardId;
  if (Object.keys(dbPatch).length === 0) return;
  const { error } = await supabase.from('security_requests').update(dbPatch).eq('id', jobId);
  if (error) throw error;
}

export function teamJobReadyForAcceptance(
  job: SecurityRequest,
  slots: JobGuardSlot[]
): boolean {
  const needed = job.guardsNeeded ?? 1;
  if (needed <= 1) return false;
  return allRequiredSlotsApproved(slots, needed);
}
