import type { JobType, SecurityGuard, SecurityRequest } from '../types';
import { isJobTypeOnboarded } from './guardJobTypeOnboarding';

export interface JobTypePreferenceOption {
  type: JobType;
  label: string;
  description: string;
}

export const ALL_JOB_TYPES: JobType[] = [
  'nightclub-bar',
  'event-wedding',
  'event-concert',
  'event-festival',
  'event-corporate',
  'event-private',
  'event',
  'patrol',
  'construction',
  'fire-watch',
  'standing-guard',
  'bodyguard',
  'armed-escort',
  'asset-protection',
  'other',
];

export const ALL_JOB_TYPE_PREFERENCES = ALL_JOB_TYPES;

export const JOB_TYPE_PREFERENCE_OPTIONS: JobTypePreferenceOption[] = [
  {
    type: 'nightclub-bar',
    label: 'Nightclub & bar',
    description: 'Light hospitality security for nightlife venues, ID checks, and crowd flow.',
  },
  {
    type: 'event-wedding',
    label: 'Event venue — wedding',
    description: 'Ceremonies, receptions, and private celebration coverage.',
  },
  {
    type: 'event-concert',
    label: 'Event venue — concert',
    description: 'Live music, stage perimeter, and concert crowd management.',
  },
  {
    type: 'event-festival',
    label: 'Event venue — festival',
    description: 'Outdoor festivals, fairs, and multi-zone public events.',
  },
  {
    type: 'event-corporate',
    label: 'Event venue — corporate',
    description: 'Conferences, galas, and professional functions.',
  },
  {
    type: 'event-private',
    label: 'Event venue — private party',
    description: 'Invite-only parties, estates, and residence events.',
  },
  {
    type: 'event',
    label: 'Other events',
    description: 'General event posts when the venue type is not listed above.',
  },
  {
    type: 'patrol',
    label: 'Patrol',
    description: 'Mobile perimeter checks and scheduled site rounds.',
  },
  {
    type: 'construction',
    label: 'Construction site',
    description: 'Job-site access control and after-hours equipment protection.',
  },
  {
    type: 'fire-watch',
    label: 'Fire watch',
    description: 'Compliance posts for hot work and impaired fire systems.',
  },
  {
    type: 'standing-guard',
    label: 'Standing guard',
    description: 'Fixed-post coverage at doors, desks, and lobbies.',
  },
  {
    type: 'bodyguard',
    label: 'Executive protection',
    description: 'VIP and close-protection assignments.',
  },
  {
    type: 'armed-escort',
    label: 'Armed escort',
    description: 'Armed transport and high-risk movement security.',
  },
  {
    type: 'asset-protection',
    label: 'Property security',
    description: 'Buildings, retail, and facility asset protection.',
  },
  {
    type: 'other',
    label: 'Custom request',
    description: 'Non-standard jobs that need extra review before accepting.',
  },
];

const JOB_TYPE_LABEL_MAP = Object.fromEntries(
  JOB_TYPE_PREFERENCE_OPTIONS.map((option) => [option.type, option.label])
) as Record<JobType, string>;

export function isJobType(value: string): value is JobType {
  return ALL_JOB_TYPES.includes(value as JobType);
}

/** Empty or missing preferences mean all job types are off until the guard opts in. */
export function normalizeJobTypePreferences(values: string[] | undefined): JobType[] {
  if (!values?.length) return [];
  const allowed = new Set(ALL_JOB_TYPES);
  return values.filter((v): v is JobType => allowed.has(v as JobType));
}

export function guardWantsJobType(guard: Pick<SecurityGuard, 'jobTypePreferences'>, jobType: JobType): boolean {
  const prefs = normalizeJobTypePreferences(guard.jobTypePreferences);
  return prefs.includes(jobType);
}

export function guardMatchesJobPreferences(
  guard: Pick<SecurityGuard, 'jobTypePreferences'>,
  job: Pick<SecurityRequest, 'type'>
): boolean {
  return guardWantsJobType(guard, job.type);
}

export function guardCanAcceptJobType(
  guard: Pick<SecurityGuard, 'jobTypeOnboarding'>,
  jobType: JobType
): boolean {
  return isJobTypeOnboarded(guard, jobType);
}

export function jobTypePreferenceLabel(type: JobType): string {
  return JOB_TYPE_LABEL_MAP[type] ?? type;
}

export function jobTypePreferenceDescription(type: JobType): string {
  return JOB_TYPE_PREFERENCE_OPTIONS.find((option) => option.type === type)?.description ?? '';
}
