import { SecurityGuard } from '../types';
import { getGuardMissingGraceCredentialLabels } from './guardMissingCredentials';

/** Hours staff-granted work grace when optional credentials are missing at activation. */
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
  return new Date(fromMs + CREDENTIAL_GRACE_PERIOD_MS).toISOString();
}

export function guardCredentialGraceFieldsCleared(): Pick<
  SecurityGuard,
  'credentialGraceDeadline' | 'credentialGraceMissing'
> {
  return {
    credentialGraceDeadline: undefined,
    credentialGraceMissing: undefined,
  };
}

export function guardGraceCredentialsStillMissing(guard: SecurityGuard, state = 'CA'): string[] {
  const stored = guard.credentialGraceMissing ?? [];
  const current = getGuardMissingGraceCredentialLabels(guard, state);
  if (stored.length === 0) return current;
  return stored.filter((label) => current.includes(label));
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
  state = 'CA'
): Pick<SecurityGuard, 'credentialGraceDeadline' | 'credentialGraceMissing'> {
  const missing = getGuardMissingGraceCredentialLabels(guard, state);
  if (missing.length === 0) return guardCredentialGraceFieldsCleared();
  return {
    credentialGraceDeadline: buildCredentialGraceDeadline(),
    credentialGraceMissing: missing,
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
): { missing: string[]; deadline: Date; timeRemainingLabel: string } | null {
  if (!guardHasActiveCredentialGrace(guard)) return null;
  const missing = getGuardMissingGraceCredentialLabels(guard, state);
  if (missing.length === 0) return null;
  const deadline = guardCredentialGraceDeadline(guard);
  if (!deadline) return null;
  return {
    missing,
    deadline,
    timeRemainingLabel: formatCredentialGraceTimeRemaining(guardCredentialGraceMsRemaining(guard)),
  };
}
