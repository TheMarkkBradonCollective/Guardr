import { SecurityRequest } from '../types';

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

export function removeGuardFromApplicants(
  applicants: string[],
  guardId: string
): string[] {
  return applicants.filter((id) => id !== guardId);
}
