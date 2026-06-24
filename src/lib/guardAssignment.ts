import { SecurityGuard, SecurityRequest } from '../types';
import { isCashClientPayment, isClientCashPaymentRequested } from './cashPayments';
import { isGuardTrusted } from './guardTrust';

/** Staff picked a guard — waiting for the client to confirm before the job is picked up. */
export function isAwaitingClientGuardApproval(
  req: Pick<SecurityRequest, 'status' | 'pendingGuardId' | 'assignedGuardId'>
): boolean {
  return req.status === 'open' && !!req.pendingGuardId && !req.assignedGuardId;
}

/** Direct hire — client already chose this guard from their profile. */
export function shouldSkipClientGuardApproval(
  req: Pick<SecurityRequest, 'requestType' | 'targetGuardId'>,
  guardId: string
): boolean {
  return req.requestType === 'direct' && !!req.targetGuardId && req.targetGuardId === guardId;
}

/**
 * Cash-funded jobs and cash payment requests always require Guardr staff confirmation.
 * Cash bypasses the trusted fast-path for mods, admins, and directors.
 */
export function jobRequiresCashStaffConfirmation(
  req: Pick<SecurityRequest, 'clientPaymentMethod' | 'clientCashPaymentRequested'>
): boolean {
  return isCashClientPayment(req) || isClientCashPaymentRequested(req);
}

/**
 * Trusted guards skip Guardr applicant review (moderators, administrators, directors)
 * on Stripe/card jobs — they go straight to client guard confirmation.
 * Cash jobs always use the full Guardr review path; cash payments must still be confirmed by staff.
 */
export function shouldSkipStaffGuardReviewForTrusted(
  guard: Pick<SecurityGuard, 'trusted'>,
  req: Pick<SecurityRequest, 'clientPaymentMethod' | 'clientCashPaymentRequested'>
): boolean {
  if (!isGuardTrusted(guard)) return false;
  if (jobRequiresCashStaffConfirmation(req)) return false;
  return true;
}

export function removeGuardFromApplicants(
  applicants: string[],
  guardId: string
): string[] {
  return applicants.filter((id) => id !== guardId);
}
