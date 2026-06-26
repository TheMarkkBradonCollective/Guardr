import type { SessionUser } from '../types';
import type { SecurityGuard } from '../types';
import { isGuardAccountActive } from './accountStatus';
import { findGuardProfileForUser } from './guardDirectory';

/** True when the signed-in user is a guard who has not been activated for marketplace work. */
export function isInactiveGuardSession(
  user: Pick<SessionUser, 'id' | 'email' | 'role'> | null | undefined,
  guards: SecurityGuard[]
): boolean {
  if (!user || user.role !== 'guard') return false;
  const guard = findGuardProfileForUser(user, guards);
  return !!guard?.id && !isGuardAccountActive(guard);
}
