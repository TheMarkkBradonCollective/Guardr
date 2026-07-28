import type { SessionUser } from '../types';
import type { SecurityGuard } from '../types';
import { isGuardUserStatusActive } from './accountStatus';
import { findGuardProfileForUser } from './guardDirectory';

/** True when the signed-in user is a guard who has not reached active account status yet. */
export function isInactiveGuardSession(
  user: Pick<SessionUser, 'id' | 'email' | 'role'> | null | undefined,
  guards: SecurityGuard[]
): boolean {
  if (!user || user.role !== 'guard') return false;
  const guard = findGuardProfileForUser(user, guards);
  if (!guard?.id || guard.isStaff) return false;
  return !isGuardUserStatusActive(guard);
}
