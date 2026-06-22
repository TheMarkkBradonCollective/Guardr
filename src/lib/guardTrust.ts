import { SecurityGuard } from '../types';

/** Client-facing badge when Guardr staff has activated a guard account. */
export const GUARD_TRUSTED_BADGE_LABEL = 'Trusted';

export function isGuardTrusted(guard: Pick<SecurityGuard, 'verified'>): boolean {
  return guard.verified;
}
