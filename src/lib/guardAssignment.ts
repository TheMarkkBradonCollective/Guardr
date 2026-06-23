import { SecurityGuard, SecurityRequest } from '../types';

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
 * Trusted guards skip client confirmation when placed on non-cash jobs.
 * Cash jobs always require the full approval + cash-connection workflow regardless of trust.
 */
export function shouldSkipClientGuardApprovalForTrusted(
  guard: Pick<SecurityGuard, 'trusted'>,
  req: Pick<SecurityRequest, 'clientPaymentMethod'>
): boolean {
  if (!guard.trusted) return false;
  return req.clientPaymentMethod !== 'cash';
}

export function removeGuardFromApplicants(
  applicants: string[],
  guardId: string
): string[] {
  return applicants.filter((id) => id !== guardId);
}
