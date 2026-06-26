import type { SecurityGuard, SecurityRequest } from '../types';
import { isGuardAccountActive } from './guardAccountActivation';
import { guardHasValidInsurance } from './guardInsurance';
import { isGuardProfileApproved, isGuardTrusted } from './guardTrust';

/**
 * Guards self-select jobs and apply directly to clients.
 * Staff review is reserved for disputes and safety exceptions only.
 */
export function shouldSkipStaffGuardReview(
  guard: SecurityGuard,
  req: Pick<SecurityRequest, 'clientPaymentMethod' | 'clientCashPaymentRequested'>,
  options?: { verifiedSelfServeEnabled?: boolean }
): boolean {
  if (isGuardTrusted(guard)) return true;
  if (req.clientCashPaymentRequested) return false;
  if (options?.verifiedSelfServeEnabled === false) return false;
  if (!isGuardAccountActive(guard)) return false;
  if (!isGuardProfileApproved(guard)) return false;
  return guardHasValidInsurance(guard);
}

/** @deprecated Use shouldSkipStaffGuardReview */
export function shouldSkipStaffGuardReviewForTrusted(
  guard: Pick<SecurityGuard, 'trusted'>,
  _req: Pick<SecurityRequest, 'clientPaymentMethod' | 'clientCashPaymentRequested'>
): boolean {
  return isGuardTrusted(guard);
}

/** Whether the job hourly guard pay meets the guard's stated minimum. */
export function guardMeetsRateRequirement(
  guard: Pick<SecurityGuard, 'hourlyRateRequirement'>,
  guardPayPerHour: number
): boolean {
  const minimum = guard.hourlyRateRequirement;
  if (minimum == null || minimum <= 0) return true;
  return guardPayPerHour >= minimum;
}

export function guardRateRequirementLabel(
  guard: Pick<SecurityGuard, 'hourlyRateRequirement'>
): string | null {
  const minimum = guard.hourlyRateRequirement;
  if (minimum == null || minimum <= 0) return null;
  return `Minimum rate $${minimum.toFixed(2)}/hr`;
}
