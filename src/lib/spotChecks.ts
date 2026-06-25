import { SecurityRequest, StaffSpotCheck } from '../types';

/** Spot checks removed — platform does not supervise guards on site. */
export const NO_SPOT_CHECK_LABEL = 'No Spot Check';

export function spotCheckApplies(_req: SecurityRequest): boolean {
  return false;
}

export function hasSpotChecks(_req: Pick<SecurityRequest, 'spotChecks'>): boolean {
  return false;
}

export function canStaffAddSpotCheck(_req: SecurityRequest): boolean {
  return false;
}

export function isNoSpotCheckFlagged(_req: SecurityRequest): boolean {
  return false;
}

/** @deprecated Spot checks removed */
export function canStaffUploadSpotCheck(_req: SecurityRequest): boolean {
  return false;
}

export function shouldShowSpotCheckSection(_req: SecurityRequest): boolean {
  return false;
}

export function sortedSpotChecks(_req: Pick<SecurityRequest, 'spotChecks'>): StaffSpotCheck[] {
  return [];
}

export function isSpotCheckClientConfirmed(_check: StaffSpotCheck): boolean {
  return !!_check.clientConfirmedAt;
}

export function hasSpotChecksForClientReview(_req: SecurityRequest): boolean {
  return false;
}

export function getUnconfirmedSpotChecks(_req: SecurityRequest): StaffSpotCheck[] {
  return [];
}

export function canClientConfirmSpotCheck(_req: SecurityRequest, _spotCheckId: string): boolean {
  return false;
}

export function hasUnconfirmedSpotChecks(_req: SecurityRequest): boolean {
  return false;
}
