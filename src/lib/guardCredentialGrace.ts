import { SecurityGuard } from '../types';
import {
  GRACE_CREDENTIAL_32_HOUR_LABEL,
  GRACE_CREDENTIAL_PTA_UOF_LABEL,
  getGuardMissingGraceCredentialLabels,
} from './guardMissingCredentials';

/** Hours of self-serve work grace when optional credentials are missing at marketplace eligibility. */
export const CREDENTIAL_GRACE_PERIOD_HOURS = 48;

export const CREDENTIAL_GRACE_PERIOD_MS = CREDENTIAL_GRACE_PERIOD_HOURS * 60 * 60 * 1000;

export function guardCredentialGraceDeadline(guard: SecurityGuard): Date | null {
  const raw = guard.credentialGraceDeadline;
  if (!raw?.trim()) return null;
  const deadline = new Date(raw);
  return Number.isNaN(deadline.getTime()) ? null : deadline;
}

export function guardHasActiveCredentialGrace(guard: SecurityGuard): boolean {
  const deadline = guardCredentialGraceDeadline(guard);
  if (!deadline) return false;
  return deadline.getTime() > Date.now();
}

export function guardCredentialGraceExpired(guard: SecurityGuard): boolean {
  const deadline = guardCredentialGraceDeadline(guard);
  if (!deadline) return false;
  return deadline.getTime() <= Date.now();
}

export function guardCredentialGraceMsRemaining(guard: SecurityGuard): number {
  const deadline = guardCredentialGraceDeadline(guard);
  if (!deadline) return 0;
  return Math.max(0, deadline.getTime() - Date.now());
}

export function formatCredentialGraceTimeRemaining(ms: number): string {
  if (ms <= 0) return '0 hours';
  const totalHours = Math.ceil(ms / (60 * 60 * 1000));
  if (totalHours < 24) {
    return `${totalHours} hour${totalHours === 1 ? '' : 's'}`;
  }
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (hours === 0) return `${days} day${days === 1 ? '' : 's'}`;
  return `${days} day${days === 1 ? '' : 's'} ${hours} hour${hours === 1 ? '' : 's'}`;
}

export function buildCredentialGraceDeadline(fromMs = Date.now()): string {
  return buildCredentialGraceDeadlineFromHours(CREDENTIAL_GRACE_PERIOD_HOURS, fromMs);
}

export function buildCredentialGraceDeadlineFromHours(
  hours: number,
  fromMs = Date.now()
): string {
  const safeHours = Number.isFinite(hours) && hours > 0 ? hours : CREDENTIAL_GRACE_PERIOD_HOURS;
  return new Date(fromMs + safeHours * 60 * 60 * 1000).toISOString();
}

export function guardCredentialGraceFieldsCleared(): Pick<
  SecurityGuard,
  'credentialGraceDeadline' | 'credentialGraceMissing' | 'credentialGraceHours'
> {
  return {
    credentialGraceDeadline: undefined,
    credentialGraceMissing: undefined,
    credentialGraceHours: undefined,
  };
}

export function guardGraceCredentialsStillMissing(guard: SecurityGuard, state = 'CA'): string[] {
  const stored = guard.credentialGraceMissing ?? [];
  const current = getGuardMissingGraceCredentialLabels(guard, state);
  if (stored.length === 0) return current;
  return stored.filter((label) => current.includes(label));
}

export type GraceTrainingCredential = 'pta-uof' | '32-hour';

function graceLabelFor(kind: GraceTrainingCredential): string {
  return kind === 'pta-uof' ? GRACE_CREDENTIAL_PTA_UOF_LABEL : GRACE_CREDENTIAL_32_HOUR_LABEL;
}

/** During active grace, missing training covered by self-serve eligibility grace does not block work. */
export function guardGraceWaivesTrainingCredential(
  guard: SecurityGuard,
  kind: GraceTrainingCredential,
  state = 'CA'
): boolean {
  if (!guardHasActiveCredentialGrace(guard)) return false;
  return guardGraceCredentialsStillMissing(guard, state).includes(graceLabelFor(kind));
}

export function guardIsTempActiveOnGrace(guard: SecurityGuard, state = 'CA'): boolean {
  return (
    guardHasActiveCredentialGrace(guard) &&
    guardGraceCredentialsStillMissing(guard, state).length > 0
  );
}

export function guardShouldClearCredentialGrace(guard: SecurityGuard, state = 'CA'): boolean {
  return getGuardMissingGraceCredentialLabels(guard, state).length === 0;
}

export function applyExpiredCredentialGrace(guard: SecurityGuard, state = 'CA'): SecurityGuard {
  if (!guardCredentialGraceExpired(guard)) return guard;
  if (guardShouldClearCredentialGrace(guard, state)) {
    return { ...guard, ...guardCredentialGraceFieldsCleared() };
  }
  return {
    ...guard,
    userStatus: 'approved',
    ...guardCredentialGraceFieldsCleared(),
  };
}

export function processGuardCredentialGraceBatch(
  guards: SecurityGuard[],
  state = 'CA'
): SecurityGuard[] {
  return guards.map((guard) => applyExpiredCredentialGrace(guard, state));
}

export function guardCredentialGracePatchForActivation(
  guard: SecurityGuard,
  state = 'CA',
  graceHours?: number
): Pick<SecurityGuard, 'credentialGraceDeadline' | 'credentialGraceMissing' | 'credentialGraceHours'> {
  const missing = getGuardMissingGraceCredentialLabels(guard, state);
  if (missing.length === 0) return guardCredentialGraceFieldsCleared();
  const hours = graceHours ?? CREDENTIAL_GRACE_PERIOD_HOURS;
  return {
    credentialGraceDeadline: buildCredentialGraceDeadlineFromHours(hours),
    credentialGraceMissing: missing,
    credentialGraceHours: hours,
  };
}

/** @deprecated Use guardCredentialGracePatchForActivation */
export const guardCredentialGracePatchForApproval = guardCredentialGracePatchForActivation;

export function guardCredentialGracePatchAfterCredentialChange(
  guard: SecurityGuard,
  state = 'CA'
): Pick<SecurityGuard, 'credentialGraceDeadline' | 'credentialGraceMissing'> | null {
  if (!guard.credentialGraceDeadline) return null;
  if (!guardShouldClearCredentialGrace(guard, state)) return null;
  return guardCredentialGraceFieldsCleared();
}

export function syncGuardCredentialGraceState(guard: SecurityGuard, state = 'CA'): SecurityGuard {
  let next = applyExpiredCredentialGrace(guard, state);
  const clearPatch = guardCredentialGracePatchAfterCredentialChange(next, state);
  if (clearPatch) next = { ...next, ...clearPatch };
  return next;
}

export function guardCredentialGraceNotice(
  guard: SecurityGuard,
  state = 'CA'
): {
  missing: string[];
  deadline: Date;
  timeRemainingLabel: string;
  periodHours: number;
  elapsedLabel: string;
} | null {
  if (!guardHasActiveCredentialGrace(guard)) return null;
  const missing = getGuardMissingGraceCredentialLabels(guard, state);
  if (missing.length === 0) return null;
  const deadline = guardCredentialGraceDeadline(guard);
  if (!deadline) return null;
  const periodHours = guard.credentialGraceHours ?? CREDENTIAL_GRACE_PERIOD_HOURS;
  const remainingMs = guardCredentialGraceMsRemaining(guard);
  const elapsedMs = Math.max(0, periodHours * 60 * 60 * 1000 - remainingMs);
  return {
    missing,
    deadline,
    timeRemainingLabel: formatCredentialGraceTimeRemaining(remainingMs),
    periodHours,
    elapsedLabel: formatCredentialGraceTimeRemaining(elapsedMs),
  };
}
