import type { SecurityRequest } from '../types';
import { isWithinSiteRadius, type Coordinates } from './siteProximity';

export interface GeofenceLeaveEvent {
  requestId: string;
  guardId: string;
  leftAt: string;
  distanceMeters: number;
}

export function shouldNotifyGeofenceLeave(
  job: Pick<SecurityRequest, 'status' | 'checkInAudit' | 'latitude' | 'longitude'>,
  position: Coordinates
): boolean {
  if (job.status !== 'in-progress' || !job.checkInAudit?.checkedAt) return false;
  return !isWithinSiteRadius(position, job);
}
