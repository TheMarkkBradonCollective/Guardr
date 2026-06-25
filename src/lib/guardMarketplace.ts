import type { SecurityGuard, SecurityRequest } from '../types';
import { isGuardAccountActive } from './accountStatus';
import { jobRequiresCashStaffConfirmation } from './guardAssignment';
import { guardHasValidInsurance } from './guardInsurance';
import { isGuardProfileApproved, isGuardTrusted } from './guardTrust';

/**
 * Verified active guards with valid insurance may apply directly to clients on card jobs,
 * bypassing staff applicant review. Cash jobs always require staff confirmation.
 */
export function shouldSkipStaffGuardReview(
  guard: SecurityGuard,
  req: Pick<SecurityRequest, 'clientPaymentMethod' | 'clientCashPaymentRequested'>,
  options?: { verifiedSelfServeEnabled?: boolean }
): boolean {
  if (jobRequiresCashStaffConfirmation(req)) return false;
  if (isGuardTrusted(guard)) return true;
  if (options?.verifiedSelfServeEnabled === false) return false;
  if (!isGuardAccountActive(guard)) return false;
  if (!isGuardProfileApproved(guard)) return false;
  return guardHasValidInsurance(guard);
}

/** @deprecated Use shouldSkipStaffGuardReview */
export function shouldSkipStaffGuardReviewForTrusted(
  guard: Pick<SecurityGuard, 'trusted'>,
  req: Pick<SecurityRequest, 'clientPaymentMethod' | 'clientCashPaymentRequested'>
): boolean {
  if (jobRequiresCashStaffConfirmation(req)) return false;
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
