import type { SecurityGuard, SecurityRequest } from '../types';
import { guardServesJobCity } from './californiaCities';
import { guardMatchesJobPreferences } from './guardJobPreferences';
import { guardIsAvailableForJob, type GuardAvailabilitySchedule } from './guardAvailability';

export type OpenJobNotifyJob = Pick<SecurityRequest, 'type' | 'state' | 'startDate' | 'endDate'>;
export type OpenJobNotifyGuard = Pick<
  SecurityGuard,
  'id' | 'serviceAreas' | 'jobTypePreferences'
>;

/** Whether a job's work city is in the guard's advertised service areas. */
export function guardJobInServiceArea(
  guard: Pick<SecurityGuard, 'serviceAreas'>,
  job: Pick<SecurityRequest, 'state'>
): boolean {
  return guardServesJobCity(guard.serviceAreas, job.state);
}

/** Push alerts: job type preferences + service area + weekly availability. */
export function guardShouldNotifyForOpenJob(
  guard: OpenJobNotifyGuard,
  job: OpenJobNotifyJob,
  schedule?: GuardAvailabilitySchedule
): boolean {
  if (!guardMatchesJobPreferences(guard, job)) return false;
  if (!guardJobInServiceArea(guard, job)) return false;
  if (!guardIsAvailableForJob(guard.id, job, schedule)) return false;
  return true;
}
