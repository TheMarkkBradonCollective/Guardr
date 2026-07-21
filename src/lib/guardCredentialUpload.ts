import { isGuardAccountPreActive } from './accountStatus';
import type { SecurityGuard } from '../types';

/** Guards upload activation credentials while pending or approved. Staff never upload for a guard. */
export function canUploadGuardCredentials(
  editing: boolean,
  staffMode: boolean,
  onAddCertification?: unknown,
  guard?: Pick<SecurityGuard, 'userStatus' | 'isStaff'>
): boolean {
  if (staffMode) return false;
  if (!Boolean(editing && onAddCertification)) return false;
  if (guard?.isStaff) return true;
  return isGuardAccountPreActive(guard ?? {});
}

export function staffCredentialUploadLabel(staffMode: boolean, itemLabel: string): string {
  return staffMode ? itemLabel : `Upload ${itemLabel}`;
}
