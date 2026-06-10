import { SecurityRequest } from '../types';

export const NO_SPOT_CHECK_LABEL = 'No Spot Check';

const SPOT_CHECK_UPLOAD_STATUSES: SecurityRequest['status'][] = ['accepted', 'in-progress', 'completed'];

/** Guard is on site or shift has ended — staff presence check applies */
export function spotCheckApplies(req: SecurityRequest): boolean {
  if (!req.assignedGuardId) return false;
  if (req.status === 'in-progress') return true;
  if (req.status === 'completed' && req.checkInAudit?.checkedAt) return true;
  return false;
}

export function hasSpotChecks(req: Pick<SecurityRequest, 'spotChecks'>): boolean {
  return (req.spotChecks?.length ?? 0) > 0;
}

/** Optional for staff, but flagged until at least one spot-check photo is saved */
export function isNoSpotCheckFlagged(req: SecurityRequest): boolean {
  return spotCheckApplies(req) && !hasSpotChecks(req);
}

export function canStaffUploadSpotCheck(req: SecurityRequest): boolean {
  if (!req.assignedGuardId) return false;
  return SPOT_CHECK_UPLOAD_STATUSES.includes(req.status);
}

export function shouldShowSpotCheckSection(req: SecurityRequest): boolean {
  return canStaffUploadSpotCheck(req) || hasSpotChecks(req) || isNoSpotCheckFlagged(req);
}

export function sortedSpotChecks(req: Pick<SecurityRequest, 'spotChecks'>) {
  return [...(req.spotChecks ?? [])].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}
