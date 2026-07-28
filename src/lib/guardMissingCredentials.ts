import { showAppConfirm, showAppPrompt } from '../components/ui/AppConfirm';
import { showAppToast } from '../components/ui/AppToast';
import { SecurityGuard } from '../types';
import {
  guardMeetsContinuingEducationListed,
  guardMeetsLevel1,
  guardMeetsMandatoryTrainingListed,
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

/** Labels stored on guard.credentialGraceMissing when staff grants activation grace. */
export const GRACE_CREDENTIAL_MANDATORY_TRAINING_LABEL = 'Mandatory training (PTA/UOF)';
export const GRACE_CREDENTIAL_CE_LABEL = 'Continued Education';
/** @deprecated Use GRACE_CREDENTIAL_MANDATORY_TRAINING_LABEL */
export const GRACE_CREDENTIAL_PTA_UOF_LABEL = GRACE_CREDENTIAL_MANDATORY_TRAINING_LABEL;
/** @deprecated Use GRACE_CREDENTIAL_CE_LABEL */
export const GRACE_CREDENTIAL_32_HOUR_LABEL = GRACE_CREDENTIAL_CE_LABEL;

/** Optional credentials completely absent — not listed and not on file. */
export function getGuardMissingGraceCredentialLabels(guard: SecurityGuard, _state = 'CA'): string[] {
  const missing: string[] = [];
  if (!guardMeetsMandatoryTrainingListed(guard)) {
    missing.push(GRACE_CREDENTIAL_MANDATORY_TRAINING_LABEL);
  }
  if (!guardMeetsContinuingEducationListed(guard)) {
    missing.push(GRACE_CREDENTIAL_CE_LABEL);
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
    missing.push('BSIS Guard Card');
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
