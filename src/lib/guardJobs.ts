import { SecurityGuard, SecurityRequest, JobType } from '../types';
import { computeGuardEarnings, computeGuardPay } from './payments';
import { estimateJobDistanceMiles } from './geo';
import { formatDuration } from './dates';
import { stateLicenseRequirementLabel } from './guardLicenses';
import { requirementLabel } from './certCatalog';
import {
  guardHasCredentialOnFile,
  guardMeetsQualificationLevel,
  QUALIFICATION_LEVEL_DESCRIPTIONS,
  QUALIFICATION_LEVEL_LABELS,
} from './guardQualification';

export const JOB_CATEGORIES = [
  { id: 'event', label: 'Event Security' },
  { id: 'construction', label: 'Construction Security' },
  { id: 'fire-watch', label: 'Fire Watch' },
  { id: 'standing', label: 'Standing Guard' },
  { id: 'patrol', label: 'Patrol' },
  { id: 'concert', label: 'Concert Security' },
  { id: 'apartment', label: 'Apartment Security' },
] as const;

export type JobCategoryId = typeof JOB_CATEGORIES[number]['id'];

export type JobSortKey = 'distance' | 'pay' | 'startTime' | 'clientRating';

export interface RequirementCheck {
  label: string;
  met: boolean;
}

export function jobMatchesCategory(job: SecurityRequest, categoryId: JobCategoryId): boolean {
  switch (categoryId) {
    case 'event':
      return job.type === 'event';
    case 'construction':
      return job.type === 'long-term' || job.type === 'other' || job.title.toLowerCase().includes('construction');
    case 'fire-watch':
      return job.title.toLowerCase().includes('fire') || job.type === 'patrol';
    case 'standing':
      return job.type === 'bodyguard' || job.type === 'asset-protection';
    case 'patrol':
      return job.type === 'patrol';
    case 'concert':
      return job.type === 'event' && (job.title.toLowerCase().includes('concert') || job.title.toLowerCase().includes('festival') || job.title.toLowerCase().includes('music'));
    case 'apartment':
      return job.type === 'long-term' || job.title.toLowerCase().includes('apartment') || job.title.toLowerCase().includes('residential');
    default:
      return true;
  }
}

export function getJobDistance(job: SecurityRequest): number {
  return estimateJobDistanceMiles(job.location, job.id);
}

export function getGuardHourlyPay(job: SecurityRequest): number {
  return job.guardPay ?? computeGuardPay(job.hourlyRate);
}

export function getEstimatedGuardEarnings(job: SecurityRequest): number {
  return computeGuardEarnings(job.durationHours, job.hourlyRate);
}

export function checkJobRequirements(guard: SecurityGuard, job: SecurityRequest): { checks: RequirementCheck[]; canAccept: boolean } {
  const jobState = job.state ?? 'CA';
  const minLevel = job.minGuardQualification ?? 'pending';
  const stateLabel = stateLicenseRequirementLabel(job);

  const checks: RequirementCheck[] = [
    {
      label: stateLabel,
      met: guardHasCredentialOnFile(guard, 'bsis-guard-card', jobState),
    },
    {
      label: QUALIFICATION_LEVEL_LABELS.pending,
      met: guardMeetsQualificationLevel(guard, 'pending', jobState),
    },
  ];

  if (minLevel === 'active') {
    checks.push({
      label: QUALIFICATION_LEVEL_LABELS.active,
      met: guardMeetsQualificationLevel(guard, 'active', jobState),
    });
  }

  if (job.armedRequired) {
    checks.push({
      label: 'BSIS Exposed Firearm Permit (on file)',
      met: guardHasCredentialOnFile(guard, 'bsis-exposed-firearm', jobState),
    });
  }

  const seen = new Set<string>();
  for (const certId of job.requiredCertifications) {
    if (certId === 'bsis-guard-card' || seen.has(certId)) continue;
    seen.add(certId);
    if (job.armedRequired && certId === 'bsis-exposed-firearm') continue;
    checks.push({
      label: requirementLabel(certId),
      met: guardHasCredentialOnFile(guard, certId, jobState),
    });
  }

  return { checks, canAccept: checks.every((c) => c.met) };
}

export function minQualificationLabel(level: SecurityRequest['minGuardQualification']): string {
  const key = level ?? 'pending';
  return `${QUALIFICATION_LEVEL_LABELS[key]} — ${QUALIFICATION_LEVEL_DESCRIPTIONS[key]}`;
}

/** Open jobs visible on a guard's map/list */
export function guardCanViewJob(guard: SecurityGuard, job: SecurityRequest): boolean {
  if (job.status !== 'open') return false;
  if (job.requestType === 'direct' && job.targetGuardId !== guard.id) return false;
  return true;
}

export function sortJobs(jobs: SecurityRequest[], sortBy: JobSortKey): SecurityRequest[] {
  return [...jobs].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        return getJobDistance(a) - getJobDistance(b);
      case 'pay':
        return getGuardHourlyPay(b) - getGuardHourlyPay(a);
      case 'startTime':
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      case 'clientRating':
        return (b.clientRating ?? 0) - (a.clientRating ?? 0);
      default:
        return 0;
    }
  });
}

export function filterJobsByCategory(jobs: SecurityRequest[], categoryId: JobCategoryId | null): SecurityRequest[] {
  if (!categoryId) return jobs;
  return jobs.filter((j) => jobMatchesCategory(j, categoryId));
}

export function formatJobTimeRange(job: SecurityRequest): string {
  const start = new Date(job.startDate);
  const end = new Date(job.endDate);
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${start.toLocaleTimeString('en-US', timeOpts)} - ${end.toLocaleTimeString('en-US', timeOpts)}`;
}

export function formatJobDate(job: SecurityRequest): string {
  return new Date(job.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export interface EarningsSummary {
  today: number;
  week: number;
  month: number;
  lifetime: number;
}

export function computeEarningsSummary(completedJobs: SecurityRequest[]): EarningsSummary {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let today = 0;
  let week = 0;
  let month = 0;
  let lifetime = 0;

  for (const job of completedJobs) {
    const earned = getEstimatedGuardEarnings(job);
    const completedAt = new Date(job.endDate);
    lifetime += earned;
    if (completedAt >= startOfMonth) month += earned;
    if (completedAt >= startOfWeek) week += earned;
    if (completedAt >= startOfDay) today += earned;
  }

  return {
    today: Math.round(today * 100) / 100,
    week: Math.round(week * 100) / 100,
    month: Math.round(month * 100) / 100,
    lifetime: Math.round(lifetime * 100) / 100,
  };
}

export type ShiftPhase = 'upcoming' | 'arrived' | 'on-duty' | 'complete';

export function getShiftPhaseKey(guardId: string, jobId: string): string {
  return `guardr_shift_phase_${guardId}_${jobId}`;
}

export function loadShiftPhase(guardId: string, jobId: string): ShiftPhase {
  try {
    const v = localStorage.getItem(getShiftPhaseKey(guardId, jobId));
    if (v === 'upcoming' || v === 'arrived' || v === 'on-duty' || v === 'complete') return v;
  } catch { /* ignore */ }
  return 'upcoming';
}

export function saveShiftPhase(guardId: string, jobId: string, phase: ShiftPhase): void {
  try {
    localStorage.setItem(getShiftPhaseKey(guardId, jobId), phase);
  } catch { /* ignore */ }
}
