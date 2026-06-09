import { JobStatus, RequestType } from '../types';

/** Marketplace post vs direct guard hire — user-facing labels */
export function jobPostingTypeLabel(requestType?: RequestType): string {
  return requestType === 'direct' ? 'Direct request' : 'Job offer';
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: 'Draft',
  'pending-review': 'Pending Review',
  open: 'Open',
  accepted: 'Accepted',
  'in-progress': 'In Progress',
  completed: 'Completed',
  closed: 'Closed',
};

export const JOB_STATUS_FLOW: JobStatus[] = [
  'draft',
  'pending-review',
  'open',
  'accepted',
  'in-progress',
  'completed',
  'closed',
];

/** Normalize legacy DB values to the current status union. */
export function normalizeJobStatus(status: string): JobStatus {
  switch (status) {
    case 'assigned':
      return 'accepted';
    case 'cancelled':
      return 'closed';
    default:
      return status as JobStatus;
  }
}
