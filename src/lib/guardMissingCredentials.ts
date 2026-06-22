import { SecurityGuard } from '../types';
import { CREDENTIAL_GRACE_PERIOD_HOURS } from './guardCredentialGrace';
import { guardHasExpiredGuardCard, guardMeets32HourBlock, guardMeetsLevel1, guardMeetsPtaUofTraining } from './guardQualification';

export const GUARD_MISSING_CREDENTIALS_BADGE_LABEL = 'Missing credentials';

/** Optional credentials that may be waived temporarily with a staff-granted grace period. */
export function getGuardMissingGraceCredentialLabels(guard: SecurityGuard, _state = 'CA'): string[] {
  const missing: string[] = [];
  if (!guardMeetsPtaUofTraining(guard)) {
    missing.push('PTA/UOF training');
  }
  if (!guardMeets32HourBlock(guard)) {
    missing.push('32-hour BSIS training');
  }
  return missing;
}

export function guardHasMissingGraceCredentials(guard: SecurityGuard, state = 'CA'): boolean {
  return getGuardMissingGraceCredentialLabels(guard, state).length > 0;
}

/** All credentials missing for work — includes mandatory guard card (no grace). */
export function getGuardMissingWorkCredentialLabels(guard: SecurityGuard, state = 'CA'): string[] {
  const missing: string[] = [];
  if (!guardMeetsLevel1(guard, state)) {
    if (guardHasExpiredGuardCard(guard, state)) {
      missing.push('BSIS Guard Card (expired)');
    } else {
      missing.push('BSIS Guard Card');
    }
  }
  missing.push(...getGuardMissingGraceCredentialLabels(guard, state));
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

/** Staff-only confirm when activating without optional credentials (guard card is mandatory). */
export function promptStaffGuardProfileApproval(guard: SecurityGuard, state = 'CA'): boolean {
  const missing = getGuardMissingGraceCredentialLabels(guard, state);
  if (missing.length === 0) return true;

  const list = formatMissingCredentialList(missing);
  return window.confirm(
    `This guard is missing ${list}.\n\nThey can work for ${CREDENTIAL_GRACE_PERIOD_HOURS} hours, but must upload these credentials or their account will be deactivated.\n\nStill activate?`
  );
}
