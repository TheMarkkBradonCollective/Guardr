import type { JobStatus } from '../types';
import type { StatusTone } from '../components/baseui/StatusChip';

/**
 * Base Web operations surfaces tint a row's state by what it means for the work:
 * live work reads as info, finished work as positive, anything waiting on a
 * person as warning, and a failed booking as negative.
 */
export function jobStatusTone(status: JobStatus): StatusTone {
  switch (status) {
    case 'accepted':
    case 'in-progress':
      return 'info';
    case 'completed':
      return 'positive';
    case 'pending-review':
    case 'open':
      return 'warning';
    case 'cancelled':
      return 'negative';
    case 'draft':
    case 'closed':
    default:
      return 'neutral';
  }
}

const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: 'Draft',
  'pending-review': 'Pending review',
  open: 'Open',
  accepted: 'Accepted',
  'in-progress': 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  closed: 'Closed',
};

/** Sentence-case label — Base Web never shows a raw slug like `in-progress`. */
export function jobStatusLabel(status: JobStatus): string {
  return JOB_STATUS_LABELS[status] ?? status;
}
