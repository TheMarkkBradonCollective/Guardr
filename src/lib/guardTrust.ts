import { SecurityGuard } from '../types';

/** Badge shown on guard directory/profile when their account has been staff-approved. */
export const GUARD_APPROVED_BADGE_LABEL = 'Approved';

/** Returns true when a guard's profile has been staff-approved (guards.verified). */
export function isGuardProfileApproved(guard: Pick<SecurityGuard, 'verified'>): boolean {
  return guard.verified;
}

/**
 * Badge shown when a Director or Owner has explicitly marked a guard as trusted.
 * Trusted guards skip Guardr applicant review on Stripe jobs (mods, admins, directors)
 * and may coordinate multi-guard crews. Cash jobs always require full Guardr review and cash confirmation.
 */
export const GUARD_TRUSTED_BADGE_LABEL = 'Trusted';

/** Returns true when a Director/Owner has explicitly marked this guard as trusted. */
export function isGuardTrusted(guard: Pick<SecurityGuard, 'trusted'>): boolean {
  return guard.trusted === true;
}
