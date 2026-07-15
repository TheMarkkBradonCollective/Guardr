import { SecurityGuard } from '../types';
import { isGuardAccountApproved } from './accountStatus';
import { guardAccountActivationBlockers } from './guardAccountActivation';

/** Approved guard with all five activation credentials staff-verified. */
export function guardReadyForAutoActivation(guard: SecurityGuard, state = 'CA'): boolean {
  if (guard.isStaff) return false;
  if (!isGuardAccountApproved(guard)) return false;
  return guardAccountActivationBlockers(guard, state).length === 0;
}

/** Promote an approved guard to active once all five credentials are verified. */
export function buildAutoGuardActivationPatch(
  guard: SecurityGuard,
  state = 'CA'
): SecurityGuard | null {
  if (!guardReadyForAutoActivation(guard, state)) return null;
  return {
    ...guard,
    userStatus: 'active',
    verified: true,
    credentialGraceDeadline: undefined,
    credentialGraceMissing: undefined,
    credentialGraceHours: undefined,
  };
}

export function withAutoGuardActivation(guard: SecurityGuard, state = 'CA'): SecurityGuard {
  return buildAutoGuardActivationPatch(guard, state) ?? guard;
}

export function guardAutoActivated(before: SecurityGuard, after: SecurityGuard): boolean {
  return before.userStatus !== 'active' && after.userStatus === 'active' && after.verified === true;
}

export function guardAutoActivationRowPatch(
  before: SecurityGuard,
  after: SecurityGuard
): Record<string, unknown> | null {
  if (!guardAutoActivated(before, after)) return null;
  return {
    user_status: 'active',
    verified: true,
    credential_grace_deadline: null,
    credential_grace_missing: null,
    credential_grace_hours: null,
  };
}
