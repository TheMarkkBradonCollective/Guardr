import type { PostOrdersAcknowledgment, SecurityRequest } from '../types';
import { hasListingPostOrders } from './jobListing';

export function guardAcknowledgedPostOrders(
  job: Pick<SecurityRequest, 'postOrdersAcknowledgments'>,
  guardId: string
): boolean {
  return (job.postOrdersAcknowledgments ?? []).some((a) => a.guardId === guardId);
}

export function jobRequiresPostOrdersAck(
  job: Pick<
    SecurityRequest,
    'siteInstructions' | 'uniformRequirements' | 'equipmentRequirements' | 'postOrdersAcknowledgments'
  >,
  guardId: string
): boolean {
  if (!hasListingPostOrders(job)) return false;
  return !guardAcknowledgedPostOrders(job, guardId);
}

export function appendPostOrdersAck(
  existing: PostOrdersAcknowledgment[] | undefined,
  guardId: string,
  now = new Date()
): PostOrdersAcknowledgment[] {
  if (existing?.some((a) => a.guardId === guardId)) return existing;
  return [...(existing ?? []), { guardId, acknowledgedAt: now.toISOString() }];
}
