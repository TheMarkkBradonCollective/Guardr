import { SecurityGuard, SecurityRequest } from '../types';
import { checkJobRequirements, guardCanApplyToJob } from './guardJobs';
import { toGuardJobView } from './guardJobView';

export { guardCanApplyToJob };

export function guardHasApplied(job: Pick<SecurityRequest, 'applicants'>, guardId: string): boolean {
  return (job.applicants ?? []).includes(guardId);
}

export function getOpenJobsWithApplications(requests: SecurityRequest[]): SecurityRequest[] {
  return requests
    .filter((r) => r.status === 'open' && !r.assignedGuardId && (r.applicants?.length ?? 0) > 0)
    .sort(
      (a, b) =>
        (b.applicants?.length ?? 0) - (a.applicants?.length ?? 0) ||
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
}

/** Open jobs where staff still picks an applicant (not awaiting client or already sent). */
export function jobNeedsStaffApplicationReview(request: SecurityRequest): boolean {
  return (
    request.status === 'open' &&
    !request.assignedGuardId &&
    !request.pendingGuardId &&
    !request.staffApprovedGuardAt &&
    (request.applicants?.length ?? 0) > 0
  );
}

export function getJobsNeedingStaffApplicationReview(requests: SecurityRequest[]): SecurityRequest[] {
  return requests
    .filter(jobNeedsStaffApplicationReview)
    .sort(
      (a, b) =>
        (b.applicants?.length ?? 0) - (a.applicants?.length ?? 0) ||
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
}

export function countPendingGuardApplications(requests: SecurityRequest[]): number {
  return getJobsNeedingStaffApplicationReview(requests).reduce(
    (sum, job) => sum + (job.applicants?.length ?? 0),
    0
  );
}

export function guardMeetsJobRequirements(guard: SecurityGuard, job: SecurityRequest): boolean {
  return guardCanApplyToJob(guard, toGuardJobView(job));
}

/** Sort applicants — verified/active credentials first, then rating, then experience */
export function rankApplicantGuards(job: SecurityRequest, guards: SecurityGuard[]): SecurityGuard[] {
  const applicants = guards.filter((g) => guardHasApplied(job, g.id));
  return [...applicants].sort((a, b) => {
    const aMeets = guardMeetsJobRequirements(a, job) ? 1 : 0;
    const bMeets = guardMeetsJobRequirements(b, job) ? 1 : 0;
    if (bMeets !== aMeets) return bMeets - aMeets;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.jobsCompleted - a.jobsCompleted;
  });
}
