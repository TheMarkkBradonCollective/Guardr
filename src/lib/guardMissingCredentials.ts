import { showAppConfirm, showAppPrompt } from '../components/ui/AppConfirm';
import { showAppToast } from '../components/ui/AppToast';
import { SecurityGuard } from '../types';
import {
  guardHasExpiredGuardCard,
  guardMeets32HourBlockListed,
  guardMeetsLevel1,
  guardMeetsPtaUofTrainingListed,
} from './guardQualification';

export const GUARD_MISSING_CREDENTIALS_BADGE_LABEL = 'Missing credentials';

export interface StaffActivationGraceChoice {
  proceed: boolean;
  graceHours?: number;
  missingLabels: string[];
}

export interface ActivateGuardAccountOptions {
  graceHours?: number;
}

/** Optional credentials completely absent — not listed and not on file. */
export function getGuardMissingGraceCredentialLabels(guard: SecurityGuard, _state = 'CA'): string[] {
  const missing: string[] = [];
  if (!guardMeetsPtaUofTrainingListed(guard)) {
    missing.push('PTA/UOF training');
  }
  if (!guardMeets32HourBlockListed(guard)) {
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

function formatMissingCredentialList(missing: string[]): string {
  if (missing.length === 1) return missing[0];
  if (missing.length === 2) return `${missing[0]} and ${missing[1]}`;
  return `${missing.slice(0, -1).join(', ')}, and ${missing[missing.length - 1]}`;
}

export function guardHasMissingWorkCredentials(guard: SecurityGuard, state = 'CA'): boolean {
  return getGuardMissingWorkCredentialLabels(guard, state).length > 0;
}

/** Staff sets grace hours when activating without optional credentials listed on profile. */
export async function promptStaffGuardActivationGrace(
  guard: SecurityGuard,
  state = 'CA'
): Promise<StaffActivationGraceChoice> {
  const missing = getGuardMissingGraceCredentialLabels(guard, state);
  if (missing.length === 0) {
    return { proceed: true, missingLabels: [] };
  }

  const list = formatMissingCredentialList(missing);
  const hoursInput = await showAppPrompt({
    title: 'Grace period required',
    message: `${list} is not listed or on file for this guard.\n\nEnter how many hours they have to upload before deactivation.`,
    placeholder: 'Hours (e.g. 24, 48, 72)',
    inputType: 'number',
    confirmLabel: 'Continue',
  });
  if (hoursInput === null) {
    return { proceed: false, missingLabels: missing };
  }

  const graceHours = Number.parseInt(hoursInput.trim(), 10);
  if (!Number.isFinite(graceHours) || graceHours <= 0) {
    showAppToast('Enter a valid number of hours (e.g. 24, 48, 72).', { tone: 'error' });
    return { proceed: false, missingLabels: missing };
  }

  const confirmed = await showAppConfirm({
    title: 'Confirm activation',
    message: `Activate with ${graceHours} hour${graceHours === 1 ? '' : 's'} for the guard to upload ${list}?`,
    confirmLabel: 'Activate account',
  });
  return {
    proceed: confirmed,
    graceHours: confirmed ? graceHours : undefined,
    missingLabels: missing,
  };
}

/** @deprecated Use promptStaffGuardActivationGrace */
export async function promptStaffGuardProfileApproval(guard: SecurityGuard, state = 'CA'): Promise<boolean> {
  return (await promptStaffGuardActivationGrace(guard, state)).proceed;
}
