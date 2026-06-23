import { SecurityGuard, SecurityRequest, JobType } from '../types';
import { GuardJobView } from './guardJobView';
import { estimateJobDistanceMiles, jobCoords } from './geo';
import { formatDuration } from './dates';
import { stateLicenseRequirementLabel } from './guardLicenses';
import { requirementLabel } from './certCatalog';
import { guardGraceWaivesTrainingCredential } from './guardCredentialGrace';
import {
  guardCanWorkFieldJobs,
  guardHasCredentialOnFile,
  getGuardQualificationLevel,
  guardMeets32HourBlock,
  guardMeetsPtaUofTraining,
  GUARD_PATHWAY_STATUS_DESCRIPTIONS,
  GUARD_PATHWAY_STATUS_LABELS,
} from './guardQualification';

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  event: 'Event security',
  patrol: 'Patrol',
  'armed-escort': 'Armed escort',
  bodyguard: 'Bodyguard / close protection',
  'asset-protection': 'Asset protection',
  'long-term': 'Long-term post',
  other: 'Other',
};

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
  /** Informational only — does not block apply/accept when false. */
  recommended?: boolean;
}

type GuardJobLike = Pick<
  GuardJobView,
  'type' | 'title' | 'status' | 'requestType' | 'targetGuardId' | 'location' | 'id' | 'guardPay' | 'durationHours' | 'startDate' | 'clientRating' | 'endDate'
>;

export function jobMatchesCategory(job: GuardJobLike, categoryId: JobCategoryId): boolean {
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

export function getJobDistance(
  job: Pick<GuardJobLike, 'location' | 'id'> & { latitude?: number; longitude?: number }
): number {
  return estimateJobDistanceMiles(job.location, job.id, undefined, jobCoords(job));
}

export function getGuardHourlyPay(job: Pick<GuardJobView, 'guardPay'>): number {
  return job.guardPay;
}

export function getEstimatedGuardEarnings(job: Pick<GuardJobView, 'guardPay' | 'durationHours'>): number {
  return Math.round(job.durationHours * job.guardPay * 100) / 100;
}

export function checkJobRequirements(guard: SecurityGuard, job: GuardJobView): { checks: RequirementCheck[]; canAccept: boolean } {
  const jobState = job.state ?? 'CA';
  const minLevel = job.minGuardQualification ?? 'pending';
  const stateLabel = stateLicenseRequirementLabel(job);

  if (!guardCanWorkFieldJobs(guard, jobState)) {
    return {
      checks: [{ label: stateLabel, met: false }],
      canAccept: false,
    };
  }

  const checks: RequirementCheck[] = [
    {
      label: stateLabel,
      met: guardHasCredentialOnFile(guard, 'bsis-guard-card', jobState),
    },
  ];

  if (minLevel === 'active') {
    checks.push({
      label: `Client prefers ${GUARD_PATHWAY_STATUS_LABELS.active} guard (full BSIS training on file)`,
      met: getGuardQualificationLevel(guard, jobState) === 'active',
      recommended: true,
    });
  }

  checks.push(
    {
      label: '8-hour PTA & UOF (combined cert or separate PTA + UOF)',
      met:
        guardMeetsPtaUofTraining(guard) ||
        guardGraceWaivesTrainingCredential(guard, 'pta-uof', jobState),
    },
    {
      label: requirementLabel('bsis-32-hour-completed'),
      met:
        guardMeets32HourBlock(guard) ||
        guardGraceWaivesTrainingCredential(guard, '32-hour', jobState),
    }
  );

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

  const blockingChecks = checks.filter((c) => !c.recommended);
  return { checks, canAccept: blockingChecks.every((c) => c.met) };
}

export function minQualificationLabel(level: SecurityRequest['minGuardQualification']): string {
  const key = level ?? 'pending';
  return `${GUARD_PATHWAY_STATUS_LABELS[key]} — ${GUARD_PATHWAY_STATUS_DESCRIPTIONS[key]}`;
}

/** Guard job detail — minimum guard status label */
export function guardJobMinQualificationLabel(level: SecurityRequest['minGuardQualification']): string {
  const key = level ?? 'pending';
  return GUARD_PATHWAY_STATUS_LABELS[key];
}

/** Credential names listed on guard job detail — separate from pathway tier label */
export function getJobRequiredCredentialLabels(
  job: Pick<GuardJobView, 'minGuardQualification' | 'requiredCertifications' | 'armedRequired'>
): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();

  const add = (catalogId: string) => {
    const label = requirementLabel(catalogId);
    if (seen.has(label)) return;
    seen.add(label);
    labels.push(label);
  };

  add('bsis-guard-card');

  for (const certId of job.requiredCertifications) {
    if (certId === 'bsis-guard-card') continue;
    add(certId);
  }

  if (job.armedRequired) {
    add('bsis-exposed-firearm');
  }

  return labels;
}

type GuardJobVisibility = Pick<
  GuardJobView,
  | 'status'
  | 'requestType'
  | 'targetGuardId'
  | 'state'
  | 'minGuardQualification'
  | 'requiredCertifications'
  | 'armedRequired'
>;

/** Open jobs visible on a guard's map/list — guards need a valid guard card to browse marketplace offers */
export function guardCanViewJob(guard: SecurityGuard, job: GuardJobVisibility): boolean {
  const jobState = job.state ?? 'CA';
  if (!guardCanWorkFieldJobs(guard, jobState)) return false;
  if (job.status !== 'open') return false;
  if (job.requestType === 'direct' && job.targetGuardId !== guard.id) return false;
  if (job.requestType === 'direct' && job.targetGuardId === guard.id) return true;
  return checkJobRequirements(guard, job as GuardJobView).canAccept;
}

/** Whether a guard meets all requirements to apply to an open job offer */
export function guardCanApplyToJob(guard: SecurityGuard, job: GuardJobVisibility): boolean {
  if (job.status !== 'open') return false;
  if (job.requestType === 'direct' && job.targetGuardId && job.targetGuardId !== guard.id) return false;
  return checkJobRequirements(guard, job as GuardJobView).canAccept;
}

export function sortJobs<T extends GuardJobLike>(jobs: T[], sortBy: JobSortKey): T[] {
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

export function filterJobsByCategory<T extends GuardJobLike>(jobs: T[], categoryId: JobCategoryId | null): T[] {
  if (!categoryId) return jobs;
  return jobs.filter((j) => jobMatchesCategory(j, categoryId));
}

export function formatJobTimeRange(job: Pick<GuardJobLike, 'startDate' | 'endDate'>): string {
  const start = new Date(job.startDate);
  const end = new Date(job.endDate);
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${start.toLocaleTimeString('en-US', timeOpts)} - ${end.toLocaleTimeString('en-US', timeOpts)}`;
}

export function formatJobDate(job: Pick<GuardJobLike, 'startDate'>): string {
  return new Date(job.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export interface EarningsSummary {
  today: number;
  week: number;
  month: number;
  lifetime: number;
}

export function computeEarningsSummary(completedJobs: GuardJobView[]): EarningsSummary {
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
