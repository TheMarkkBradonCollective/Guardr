import type { SecurityGuard, SecurityRequest, JobType } from '../types';
import { isJobPaid } from './jobEditRules';
import { GuardJobView } from './guardJobView';
import { findGuardScheduleConflict, type ScheduleJob } from './guardSchedule';
import {
  guardAvailabilityBlockReason,
  guardIsAvailableForJob,
} from './guardAvailability';
import { estimateJobDistanceMiles } from './geo';
import { hasJobCoordinates } from './jobLocation';
import { formatDuration } from './dates';
import { stateLicenseRequirementLabel } from './guardLicenses';
import { resolveJobLicenseState } from './californiaCities';
import { requirementLabel } from './certCatalog';
import { guardGraceWaivesTrainingCredential } from './guardCredentialGrace';
import { guardHasValidInsurance, guardInsuranceBlockedMessage } from './guardInsurance';
import { guardMeetsRateRequirement } from './guardMarketplace';
import { guardCanAcceptJobType, guardMatchesJobPreferences, jobTypePreferenceLabel } from './guardJobPreferences';
import { isJobTypeOnboarded } from './guardJobTypeOnboarding';
import {
  guardCanEnableJobTypePreference,
  guardVehicleRequiredBlockMessage,
  jobTypeRequiresVerifiedVehicle,
} from './guardJobTypeVehicleRequirements';
import { isGuardUserStatusActive } from './accountStatus';
import {
  guardCanWorkFieldJobs,
  guardHasCredentialOnFile,
  getGuardQualificationLevel,
  guardMeetsContinuingEducation,
  guardMeetsMandatoryTraining,
  GUARD_PATHWAY_STATUS_DESCRIPTIONS,
  GUARD_PATHWAY_STATUS_LABELS,
} from './guardQualification';

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  'nightclub-bar': 'Nightclub & bar',
  'event-wedding': 'Event venue — wedding',
  'event-concert': 'Event venue — concert',
  'event-festival': 'Event venue — festival',
  'event-corporate': 'Event venue — corporate',
  'event-private': 'Event venue — private party',
  event: 'Event security',
  'foot-patrol': 'Foot patrol',
  'vehicle-patrol': 'Vehicle patrol',
  patrol: 'Patrol',
  construction: 'Construction site',
  'fire-watch': 'Fire watch',
  'standing-guard': 'Standing guard',
  'armed-escort': 'Armed escort',
  bodyguard: 'Executive protection',
  'asset-protection': 'Property security',
  other: 'Custom request',
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
      return (
        job.type === 'event' ||
        job.type === 'event-wedding' ||
        job.type === 'event-corporate' ||
        job.type === 'event-private'
      );
    case 'construction':
      return job.type === 'construction' || job.title.toLowerCase().includes('construction');
    case 'fire-watch':
      return job.type === 'fire-watch' || job.title.toLowerCase().includes('fire');
    case 'standing':
      return job.type === 'standing-guard' || job.type === 'bodyguard' || job.type === 'asset-protection';
    case 'patrol':
      return (
        job.type === 'patrol' ||
        job.type === 'foot-patrol' ||
        job.type === 'vehicle-patrol'
      );
    case 'concert':
      return (
        job.type === 'event-concert' ||
        job.type === 'event-festival' ||
        (job.type === 'event' &&
          (job.title.toLowerCase().includes('concert') ||
            job.title.toLowerCase().includes('festival') ||
            job.title.toLowerCase().includes('music')))
      );
    case 'apartment':
      return job.title.toLowerCase().includes('apartment') || job.title.toLowerCase().includes('residential');
    default:
      return true;
  }
}

export function getJobDistance(
  job: Pick<GuardJobLike, 'location' | 'id'> & { latitude?: number; longitude?: number }
): number | null {
  if (!hasJobCoordinates(job)) return null;
  return estimateJobDistanceMiles(job.location, job.id, undefined, {
    lat: job.latitude!,
    lng: job.longitude!,
  });
}

export function getGuardHourlyPay(job: Pick<GuardJobView, 'guardPay'>): number {
  return job.guardPay;
}

export function getEstimatedGuardEarnings(job: Pick<GuardJobView, 'guardPay' | 'durationHours'>): number {
  return Math.round(job.durationHours * job.guardPay * 100) / 100;
}

export function checkJobRequirements(
  guard: SecurityGuard,
  job: GuardJobView,
  allRequests?: ScheduleJob[]
): { checks: RequirementCheck[]; canAccept: boolean } {
  const jobCity = job.state ?? 'CA';
  const licenseState = resolveJobLicenseState(jobCity);
  const minLevel = job.minGuardQualification ?? 'pending';
  const stateLabel = stateLicenseRequirementLabel(job);

  if (!guardCanWorkFieldJobs(guard, licenseState)) {
    return {
      checks: [{ label: stateLabel, met: false }],
      canAccept: false,
    };
  }

  const checks: RequirementCheck[] = [
    {
      label: stateLabel,
      met: guardHasCredentialOnFile(guard, 'bsis-guard-card', licenseState),
    },
  ];

  if (minLevel === 'active') {
    checks.push({
      label: `Client prefers ${GUARD_PATHWAY_STATUS_LABELS.active} guard (full BSIS training on file)`,
      met: getGuardQualificationLevel(guard, licenseState) === 'active',
      recommended: true,
    });
  }

  const minYears = job.minYearsExperience ?? 0;
  if (minYears > 0) {
    const years = guard.yearsExperience ?? 0;
    checks.push({
      label: `${minYears}+ years experience required`,
      met: years >= minYears,
    });
  }

  checks.push(
    {
      label: 'Mandatory training (PTA/UOF)',
      met:
        guardMeetsMandatoryTraining(guard) ||
        guardGraceWaivesTrainingCredential(guard, 'mandatory-training', licenseState),
    },
    {
      label: 'Continuing Education (4 BSIS mandatory courses)',
      met:
        guardMeetsContinuingEducation(guard) ||
        isGuardUserStatusActive(guard) ||
        guardGraceWaivesTrainingCredential(guard, 'ce', licenseState),
    }
  );

  if (job.armedRequired) {
    checks.push({
      label: 'BSIS Exposed Firearm Permit (on file)',
      met: guardHasCredentialOnFile(guard, 'bsis-exposed-firearm'),
    });
  }

  const seen = new Set<string>();
  for (const certId of job.requiredCertifications) {
    if (certId === 'bsis-guard-card' || seen.has(certId)) continue;
    seen.add(certId);
    if (job.armedRequired && certId === 'bsis-exposed-firearm') continue;
    checks.push({
      label: requirementLabel(certId),
      met: guardHasCredentialOnFile(guard, certId),
    });
  }

  const blockingChecks = checks.filter((c) => !c.recommended);
  let canAccept = blockingChecks.every((c) => c.met);

  const guardPay = getGuardHourlyPay(job);
  if (!guardMeetsRateRequirement(guard, guardPay)) {
    const minimum = guard.hourlyRateRequirement ?? 0;
    checks.push({
      label: `Meets your minimum rate ($${minimum.toFixed(2)}/hr)`,
      met: false,
    });
    canAccept = false;
  }

  if (!guardHasValidInsurance(guard)) {
    const insuranceMessage = guardInsuranceBlockedMessage(guard);
    checks.push({
      label: insuranceMessage ?? 'Verified general liability insurance on file',
      met: false,
    });
    canAccept = false;
  }

  const onboardedForType = guardCanAcceptJobType(guard, job.type);
  checks.push({
    label: `${jobTypePreferenceLabel(job.type)} onboarding completed`,
    met: isJobTypeOnboarded(guard, job.type),
  });
  if (!onboardedForType) {
    if (
      isJobTypeOnboarded(guard, job.type) &&
      jobTypeRequiresVerifiedVehicle(job.type) &&
      !guardCanEnableJobTypePreference(guard, job.type)
    ) {
      checks.push({
        label: guardVehicleRequiredBlockMessage(guard, job.type),
        met: false,
      });
    }
    canAccept = false;
  }

  const availabilityReason = guardAvailabilityBlockReason(guard.id, job);
  if (availabilityReason) {
    checks.push({
      label: availabilityReason,
      met: false,
    });
    canAccept = false;
  }

  if (canAccept && allRequests) {
    const conflict = findGuardScheduleConflict(guard.id, job, allRequests);
    if (conflict) {
      checks.push({
        label: `No overlapping shifts (${conflict.title})`,
        met: false,
      });
      canAccept = false;
    }
  }

  return { checks, canAccept };
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
  | 'startDate'
  | 'endDate'
  | 'type'
  | 'minGuardQualification'
  | 'requiredCertifications'
  | 'armedRequired'
>;

/** Marketplace browse requires client payment; direct hires may be visible earlier. */
export function openMarketplaceJobIsGuardVisible(
  job: Pick<SecurityRequest, 'paymentStatus' | 'requestType'>
): boolean {
  if (job.requestType === 'direct') return true;
  return isJobPaid(job);
}

/** Open jobs visible on a guard's map/list — silently filtered by preferences and availability. */
export function guardCanViewJob(
  guard: SecurityGuard,
  job: GuardJobVisibility & Pick<SecurityRequest, 'paymentStatus'>
): boolean {
  const licenseState = resolveJobLicenseState(job.state);
  if (!guardCanWorkFieldJobs(guard, licenseState)) return false;
  if (job.status !== 'open') return false;
  if (!openMarketplaceJobIsGuardVisible(job)) return false;
  if (job.requestType === 'direct' && job.targetGuardId && job.targetGuardId !== guard.id) return false;

  const isDirectToMe = job.requestType === 'direct' && job.targetGuardId === guard.id;
  if (!isDirectToMe) {
    if (!guardMatchesJobPreferences(guard, job)) return false;
    if (!guardIsAvailableForJob(guard.id, job)) return false;
  }

  return true;
}

/** Whether a guard meets all requirements to apply to an open job offer */
export function guardCanApplyToJob(
  guard: SecurityGuard,
  job: GuardJobVisibility & Pick<SecurityRequest, 'paymentStatus'>,
  allRequests?: ScheduleJob[]
): boolean {
  if (job.status !== 'open') return false;
  if (!openMarketplaceJobIsGuardVisible(job)) return false;
  if (job.requestType === 'direct' && job.targetGuardId && job.targetGuardId !== guard.id) return false;
  return checkJobRequirements(guard, job as GuardJobView, allRequests).canAccept;
}

export function sortJobs<T extends GuardJobLike>(jobs: T[], sortBy: JobSortKey): T[] {
  return [...jobs].sort((a, b) => {
    switch (sortBy) {
      case 'distance': {
        const da = getJobDistance(a);
        const db = getJobDistance(b);
        if (da == null && db == null) return 0;
        if (da == null) return 1;
        if (db == null) return -1;
        return da - db;
      }
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

export type ShiftPhase = 'upcoming' | 'en-route' | 'arrived' | 'on-duty' | 'complete';

export function getShiftPhaseKey(guardId: string, jobId: string): string {
  return `guardr_shift_phase_${guardId}_${jobId}`;
}

export function loadShiftPhase(guardId: string, jobId: string): ShiftPhase {
  try {
    const v = localStorage.getItem(getShiftPhaseKey(guardId, jobId));
    if (
      v === 'upcoming' ||
      v === 'en-route' ||
      v === 'arrived' ||
      v === 'on-duty' ||
      v === 'complete'
    ) {
      return v;
    }
  } catch { /* ignore */ }
  return 'upcoming';
}

export function saveShiftPhase(guardId: string, jobId: string, phase: ShiftPhase): void {
  try {
    localStorage.setItem(getShiftPhaseKey(guardId, jobId), phase);
  } catch { /* ignore */ }
}
