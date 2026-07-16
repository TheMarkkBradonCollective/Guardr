import type { JobType } from '../types';

export type WorkModality = 'standing' | 'driving';

export const STANDING_JOB_TYPES: JobType[] = [
  'standing-guard',
  'construction',
  'fire-watch',
  'asset-protection',
  'bodyguard',
];

export const DRIVING_JOB_TYPES: JobType[] = ['patrol', 'armed-escort'];

export const PERFORMANCE_MODALITIES: WorkModality[] = ['standing', 'driving'];

export function jobTypesForModality(modality: WorkModality): JobType[] {
  return modality === 'standing' ? STANDING_JOB_TYPES : DRIVING_JOB_TYPES;
}

export function workModalityForJobType(jobType: JobType): WorkModality | null {
  if (STANDING_JOB_TYPES.includes(jobType)) return 'standing';
  if (DRIVING_JOB_TYPES.includes(jobType)) return 'driving';
  return null;
}

export function jobMatchesWorkModality(jobType: JobType, modality: WorkModality): boolean {
  return jobTypesForModality(modality).includes(jobType);
}

export function workModalityLabel(modality: WorkModality): string {
  return modality === 'standing' ? 'Standing' : 'Driving';
}

export function workModalitySubtitle(modality: WorkModality): string {
  return modality === 'standing'
    ? 'Priority for standing shifts'
    : 'Priority for driving jobs';
}

export function representativeJobTypeForModality(modality: WorkModality): JobType {
  return modality === 'standing' ? 'standing-guard' : 'patrol';
}
