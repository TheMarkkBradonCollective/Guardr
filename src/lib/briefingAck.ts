import type { BriefingAcknowledgment, SecurityRequest } from '../types';
import { hasListingPostOrders } from './jobListing';

type BriefingJob = Pick<
  SecurityRequest,
  | 'briefingAcknowledgments'
  | 'siteInstructions'
  | 'uniformRequirements'
  | 'equipmentRequirements'
  | 'description'
  | 'operationalDetails'
  | 'parkingInstructions'
  | 'accessInstructions'
>;

export function guardAcknowledgedBriefing(job: BriefingJob, guardId: string): boolean {
  return (job.briefingAcknowledgments ?? []).some((a) => a.guardId === guardId);
}

export function appendBriefingAck(
  existing: BriefingAcknowledgment[] | undefined,
  guardId: string,
  now = new Date()
): BriefingAcknowledgment[] {
  if (existing?.some((a) => a.guardId === guardId)) return existing;
  return [...(existing ?? []), { guardId, acknowledgedAt: now.toISOString() }];
}

/** True when the job has site instructions worth acknowledging before arrival. */
export function jobHasBriefingContent(job: BriefingJob): boolean {
  if (hasListingPostOrders(job)) return true;
  const textFields = [
    job.description,
    job.siteInstructions,
    job.uniformRequirements,
    job.equipmentRequirements,
    job.parkingInstructions,
    job.accessInstructions,
  ];
  if (textFields.some((v) => typeof v === 'string' && v.trim().length > 0)) return true;
  const details = job.operationalDetails;
  if (!details) return false;
  return Object.values(details).some((v) => typeof v === 'string' && v.trim().length > 0);
}

export function guardMustAckBriefingOnSite(job: BriefingJob, guardId: string): boolean {
  return jobHasBriefingContent(job) && !guardAcknowledgedBriefing(job, guardId);
}
