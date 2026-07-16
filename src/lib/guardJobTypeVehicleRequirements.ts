import type { JobType, SecurityGuard } from '../types';
import { guardHasApprovedVehicle, guardVehicleAccessBlockedReason } from './guardVehicle';

/** Job types a guard cannot enable in Preferences without staff-approved vehicle. */
export const VEHICLE_REQUIRED_JOB_TYPES: JobType[] = ['vehicle-patrol', 'armed-escort', 'patrol'];

export function jobTypeRequiresVerifiedVehicle(jobType: JobType): boolean {
  return VEHICLE_REQUIRED_JOB_TYPES.includes(jobType);
}

export function guardCanEnableJobTypePreference(
  guard: Pick<SecurityGuard, 'vehicleProfile' | 'vehicleInsurancePolicy'>,
  jobType: JobType
): boolean {
  if (!jobTypeRequiresVerifiedVehicle(jobType)) return true;
  return guardHasApprovedVehicle(guard);
}

export function guardVehicleRequiredBlockMessage(
  guard: Pick<SecurityGuard, 'vehicleProfile' | 'vehicleInsurancePolicy'>,
  jobType: JobType
): string {
  const accessReason = guardVehicleAccessBlockedReason(guard);
  if (accessReason) return accessReason;
  if (jobType === 'armed-escort') {
    return 'An approved vehicle is required before you can enable armed escort alerts. Submit your vehicle for approval in the Vehicle tab.';
  }
  return 'An approved vehicle is required before you can enable vehicle patrol alerts. Submit your vehicle for approval in the Vehicle tab.';
}
