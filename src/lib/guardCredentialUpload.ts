import { isGuardAccountApproved } from './accountStatus';
import type { SecurityGuard } from '../types';

/** Guards upload credentials after staff approves their application; staff can always upload on behalf. */
export function canUploadGuardCredentials(
  editing: boolean,
  staffMode: boolean,
  onAddCertification?: unknown,
  guard?: Pick<SecurityGuard, 'userStatus' | 'isStaff'>
): boolean {
  if (!Boolean((editing || staffMode) && onAddCertification)) return false;
  if (staffMode) return true;
  if (guard?.isStaff) return true;
  return isGuardAccountApproved(guard ?? {});
}

export function staffCredentialUploadLabel(staffMode: boolean, itemLabel: string): string {
  return staffMode ? `Upload ${itemLabel} for guard` : `Upload ${itemLabel}`;
}
