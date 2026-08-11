import type { SecurityGuard } from '../types';
import { staffReadyForAutoActivation } from './staffAccountActivation';

export function buildAutoStaffActivationPatch(
  member: SecurityGuard,
  options?: { stripePayoutsEnabled?: boolean },
): SecurityGuard | null {
  if (!staffReadyForAutoActivation(member, options)) return null;
  return {
    ...member,
    userStatus: 'active',
    verified: true,
  };
}

export function withAutoStaffActivation(
  member: SecurityGuard,
  options?: { stripePayoutsEnabled?: boolean },
): SecurityGuard {
  return buildAutoStaffActivationPatch(member, options) ?? member;
}

export function staffAutoActivated(before: SecurityGuard, after: SecurityGuard): boolean {
  return (
    before.isStaff &&
    before.userStatus !== 'active' &&
    after.userStatus === 'active' &&
    after.verified === true
  );
}

export function staffAutoActivationRowPatch(
  before: SecurityGuard,
  after: SecurityGuard,
): Record<string, unknown> | null {
  if (!staffAutoActivated(before, after)) return null;
  return {
    user_status: 'active',
  };
}
