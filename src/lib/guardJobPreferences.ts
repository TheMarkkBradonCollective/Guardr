import type { JobType, SecurityGuard, SecurityRequest } from '../types';
import { JOB_TYPE_LABELS } from './guardJobs';

export const ALL_JOB_TYPE_PREFERENCES: JobType[] = [
  'event',
  'patrol',
  'armed-escort',
  'bodyguard',
  'asset-protection',
  'long-term',
  'other',
];

export function normalizeJobTypePreferences(values: string[] | undefined): JobType[] {
  if (!values?.length) return [...ALL_JOB_TYPE_PREFERENCES];
  const allowed = new Set(ALL_JOB_TYPE_PREFERENCES);
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

export function jobTypePreferenceLabel(type: JobType): string {
  return JOB_TYPE_LABELS[type] ?? type;
}
