import type { SecurityGuard, SecurityRequest, ReplacementRequest, ReplacementReason } from '../types';
import { rankGuardsForJob } from './guardQualificationMatching';
import { guardCanApplyToJob } from './guardJobs';
import { toGuardJobView } from './guardJobView';

export type { ReplacementRequest } from '../types';

const OFFER_EXPIRY_MS = 30 * 60 * 1000;
const MAX_OFFERS = 8;

export function createReplacementRequest(
  job: SecurityRequest,
  options: {
    requestedBy: 'client' | 'system';
    reason: ReplacementReason;
    reasonNote?: string;
    previousGuardId?: string;
  }
): ReplacementRequest {
  return {
    id: `repl-${job.id}-${Date.now()}`,
    requestedAt: new Date().toISOString(),
    requestedBy: options.requestedBy,
    reason: options.reason,
    reasonNote: options.reasonNote,
    status: 'searching',
    offeredGuardIds: [],
    previousGuardId: options.previousGuardId ?? job.assignedGuardId ?? undefined,
    expiresAt: new Date(Date.now() + OFFER_EXPIRY_MS).toISOString(),
  };
}

export function findReplacementCandidates(
  job: SecurityRequest,
  guards: SecurityGuard[],
  allRequests: SecurityRequest[],
  excludeGuardIds: string[] = []
): SecurityGuard[] {
  const exclude = new Set([
    ...excludeGuardIds,
    job.assignedGuardId,
    job.replacementRequest?.previousGuardId,
    ...(job.replacementRequest?.offeredGuardIds ?? []),
  ].filter(Boolean) as string[]);

  const ranked = rankGuardsForJob(job, guards, {
    applicantsOnly: false,
    allRequests,
    limit: MAX_OFFERS * 2,
  });

  return ranked
    .filter(
      ({ guard, meetsRequirements }) =>
        meetsRequirements &&
        !exclude.has(guard.id) &&
        guardCanApplyToJob(guard, toGuardJobView(job, guard.id), allRequests)
    )
    .slice(0, MAX_OFFERS)
    .map((s) => s.guard);
}

export function startReplacementOffers(
  job: SecurityRequest,
  candidates: SecurityGuard[]
): ReplacementRequest | null {
  const current = job.replacementRequest;
  if (!current || current.status === 'filled' || current.status === 'cancelled') return null;

  const guardIds = candidates.map((g) => g.id);
  if (!guardIds.length) {
    return { ...current, status: 'failed' };
  }

  return {
    ...current,
    status: 'offering',
    offeredGuardIds: guardIds,
    expiresAt: new Date(Date.now() + OFFER_EXPIRY_MS).toISOString(),
  };
}

export function acceptReplacementOffer(
  job: SecurityRequest,
  guardId: string
): { replacement: ReplacementRequest; patch: Partial<SecurityRequest> } | null {
  const repl = job.replacementRequest;
  if (!repl || repl.status !== 'offering') return null;
  if (!repl.offeredGuardIds.includes(guardId)) return null;
  if (repl.expiresAt && new Date(repl.expiresAt).getTime() < Date.now()) return null;

  const now = new Date().toISOString();
  const updatedReplacement: ReplacementRequest = {
    ...repl,
    status: 'filled',
    acceptedGuardId: guardId,
    acceptedAt: now,
  };

  return {
    replacement: updatedReplacement,
    patch: {
      replacementRequest: updatedReplacement,
      assignedGuardId: guardId,
      status: 'accepted',
      pendingGuardId: undefined,
      staffApprovedGuardAt: undefined,
      enRouteAt: undefined,
      arrivedAt: undefined,
      guardLiveLocation: undefined,
      applicants: [...new Set([...job.applicants, guardId])],
    },
  };
}

export function guardHasReplacementOffer(job: SecurityRequest, guardId: string): boolean {
  const repl = job.replacementRequest;
  if (!repl || repl.status !== 'offering') return false;
  if (repl.expiresAt && new Date(repl.expiresAt).getTime() < Date.now()) return false;
  return repl.offeredGuardIds.includes(guardId);
}

export function activeReplacementOffers(
  requests: SecurityRequest[],
  guardId: string
): SecurityRequest[] {
  return requests.filter((r) => guardHasReplacementOffer(r, guardId));
}
