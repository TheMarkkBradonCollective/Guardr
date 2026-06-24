import type { SecurityRequest } from '../types';

export type JobStatusBadgeTone = 'default' | 'primary' | 'success' | 'warning' | 'danger';

export function jobStatusBadgeTone(status: SecurityRequest['status']): JobStatusBadgeTone {
  switch (status) {
    case 'open':
    case 'accepted':
      return 'primary';
    case 'pending-review':
      return 'warning';
    case 'in-progress':
      return 'success';
    case 'completed':
      return 'success';
    case 'closed':
      return 'default';
    default:
      return 'default';
  }
}
