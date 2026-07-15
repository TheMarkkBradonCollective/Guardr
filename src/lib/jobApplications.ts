import { SecurityGuard, SecurityRequest } from '../types';
import { guardCanApplyToJob } from './guardJobs';
import { toGuardJobView } from './guardJobView';
import { rankGuardsForJob } from './guardQualificationMatching';

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

/** Open jobs no longer require staff to pick applicants — client or first-to-accept handles placement. */
export function jobNeedsStaffApplicationReview(_request: SecurityRequest): boolean {
  return false;
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

/** Sort applicants by smart qualification match score (rule-based, no AI). */
export function rankApplicantGuards(job: SecurityRequest, guards: SecurityGuard[]): SecurityGuard[] {
  return rankGuardsForJob(job, guards, { applicantsOnly: true }).map((s) => s.guard);
}
