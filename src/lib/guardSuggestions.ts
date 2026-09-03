import type { JobGuardSuggestion, SecurityRequest } from '../types';
import type { ScheduleJob } from './guardSchedule';
import { guardHasJobTeamAssociation, isMultiGuardJob, mergeJobSlots } from './guardTeams';
import { guardScheduleConflictError } from './guardSchedule';

function newSuggestionId(jobId: string, suggestedGuardId: string, suggestedAt: string): string {
  return `${jobId}-suggest-${suggestedGuardId}-${suggestedAt}`;
}

export function pendingGuardSuggestions(job: SecurityRequest): JobGuardSuggestion[] {
  return (job.guardSuggestions ?? []).filter((s) => s.status === 'pending');
}

export function suggestGuardForJob(
  job: SecurityRequest,
  suggesterGuardId: string,
  suggestedGuardId: string,
  allJobs: ScheduleJob[],
  suggestedGuardName?: string,
  now = new Date()
): { job: SecurityRequest; suggestion: JobGuardSuggestion } | { error: string } {
  if (job.status !== 'open') return { error: 'This job is not open for suggestions.' };
  if (suggesterGuardId === suggestedGuardId) {
    return { error: 'You cannot suggest yourself for this job.' };
  }
  const slots = mergeJobSlots(job, job.guardSlots);
  if (guardHasJobTeamAssociation(slots, suggestedGuardId)) {
    return { error: 'That guard is already tied to this job.' };
  }
  if (job.applicants.includes(suggestedGuardId)) {
    return { error: 'That guard has already applied for this job.' };
  }
  const scheduleBlocked = guardScheduleConflictError(suggestedGuardId, job, allJobs, {
    guardName: suggestedGuardName,
  });
  if (scheduleBlocked) return { error: scheduleBlocked };
  const existing = (job.guardSuggestions ?? []).find(
    (s) => s.suggestedGuardId === suggestedGuardId && s.status === 'pending'
  );
  if (existing) return { error: 'You already suggested this guard for this job.' };

  const suggestedAt = now.toISOString();
  const suggestion: JobGuardSuggestion = {
    id: newSuggestionId(job.id, suggestedGuardId, suggestedAt),
    suggestedGuardId,
    suggestedByGuardId: suggesterGuardId,
    suggestedAt,
    status: 'pending',
  };
  return {
    job: {
      ...job,
      guardSuggestions: [...(job.guardSuggestions ?? []), suggestion],
    },
    suggestion,
  };
}

export function dismissGuardSuggestion(
  job: SecurityRequest,
  suggestionId: string
): { job: SecurityRequest } | { error: string } {
  const suggestion = (job.guardSuggestions ?? []).find((s) => s.id === suggestionId);
  if (!suggestion) return { error: 'Suggestion not found.' };
  if (suggestion.status !== 'pending') return { error: 'This suggestion is no longer active.' };
  const nextSuggestions = (job.guardSuggestions ?? []).map((s) =>
    s.id === suggestionId ? { ...s, status: 'dismissed' as const } : s
  );
  return { job: { ...job, guardSuggestions: nextSuggestions } };
}

export function markGuardSuggestionPlaced(
  job: SecurityRequest,
  suggestedGuardId: string,
  now = new Date()
): SecurityRequest {
  const ts = now.toISOString();
  const nextSuggestions = (job.guardSuggestions ?? []).map((s) =>
    s.suggestedGuardId === suggestedGuardId && s.status === 'pending'
      ? { ...s, status: 'placed' as const, suggestedAt: ts }
      : s
  );
  return { ...job, guardSuggestions: nextSuggestions };
}

export function suggestionEligibleForJob(job: SecurityRequest): boolean {
  if (job.status !== 'open' || job.assignedGuardId) return false;
  if (isMultiGuardJob(job)) {
    const slots = mergeJobSlots(job, job.guardSlots);
    const openSlots = slots.filter((s) => s.status === 'open' && !s.guardId).length;
    return openSlots > 0;
  }
  return !job.pendingGuardId;
}
