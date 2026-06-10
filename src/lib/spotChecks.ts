import { SecurityRequest } from '../types';

const SPOT_CHECK_STATUSES: SecurityRequest['status'][] = ['accepted', 'in-progress', 'completed'];

export function canStaffUploadSpotCheck(req: SecurityRequest): boolean {
  if (!req.assignedGuardId) return false;
  return SPOT_CHECK_STATUSES.includes(req.status);
}

export function hasSpotChecks(req: Pick<SecurityRequest, 'spotChecks'>): boolean {
  return (req.spotChecks?.length ?? 0) > 0;
}

export function shouldShowSpotCheckSection(req: SecurityRequest): boolean {
  return canStaffUploadSpotCheck(req) || hasSpotChecks(req);
}

export function sortedSpotChecks(req: Pick<SecurityRequest, 'spotChecks'>) {
  return [...(req.spotChecks ?? [])].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}
