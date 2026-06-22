import { SecurityGuard } from '../types';
import { guardHasExpiredGuardCard, guardMeets32HourBlock, guardMeetsLevel1, guardMeetsPtaUofTraining } from './guardQualification';

export const GUARD_MISSING_CREDENTIALS_BADGE_LABEL = 'Missing credentials';

/** Credentials missing for work eligibility — staff may approve profile with verified ID only. */
export function getGuardMissingWorkCredentialLabels(guard: SecurityGuard, state = 'CA'): string[] {
  const missing: string[] = [];
  if (!guardMeetsLevel1(guard, state)) {
    if (guardHasExpiredGuardCard(guard, state)) {
      missing.push('BSIS Guard Card (expired)');
    } else {
      missing.push('BSIS Guard Card');
    }
  }
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

function formatMissingCredentialList(missing: string[]): string {
  if (missing.length === 1) return missing[0];
  if (missing.length === 2) return `${missing[0]} and ${missing[1]}`;
  return `${missing.slice(0, -1).join(', ')}, and ${missing[missing.length - 1]}`;
}

/** Staff-only confirm when approving before all work credentials are on file. */
export function promptStaffGuardProfileApproval(guard: SecurityGuard, state = 'CA'): boolean {
  const missing = getGuardMissingWorkCredentialLabels(guard, state);
  if (missing.length === 0) return true;

  const list = formatMissingCredentialList(missing);
  return window.confirm(
    `This guard is missing ${list}. They cannot work field jobs until these are on file.\n\nStill approve profile?`
  );
}
