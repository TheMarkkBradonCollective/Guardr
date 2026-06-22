import { SecurityGuard } from '../types';
import { guardMeets32HourBlock, guardMeetsPtaUofTraining } from './guardQualification';

export const GUARD_MISSING_CREDENTIALS_BADGE_LABEL = 'Missing credentials';

/** Work-pathway credentials beyond verified ID + guard card — staff may approve profile without these. */
export function getGuardMissingWorkCredentialLabels(guard: SecurityGuard, _state = 'CA'): string[] {
  const missing: string[] = [];
  if (!guardMeetsPtaUofTraining(guard)) {
    missing.push('PTA/UOF training');
  }
  if (!guardMeets32HourBlock(guard)) {
    missing.push('32-hour BSIS training');
  }
  return missing;
}

export function guardHasMissingWorkCredentials(guard: SecurityGuard, state = 'CA'): boolean {
  return getGuardMissingWorkCredentialLabels(guard, state).length > 0;
}

/** Staff-only confirm when approving a profile before all work credentials are on file. */
export function promptStaffGuardProfileApproval(guard: SecurityGuard, state = 'CA'): boolean {
  const missing = getGuardMissingWorkCredentialLabels(guard, state);
  if (missing.length === 0) return true;

  const list =
    missing.length === 1
      ? missing[0]
      : missing.length === 2
        ? `${missing[0]} and ${missing[1]}`
        : `${missing.slice(0, -1).join(', ')}, and ${missing[missing.length - 1]}`;

  return window.confirm(
    `This guard is missing ${list}. They cannot work field jobs until these are on file.\n\nStill approve profile?`
  );
}
