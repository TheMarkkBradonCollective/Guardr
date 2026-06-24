import { SecurityRequest } from '../../types';
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
import { jobStatusBadgeTone } from '../../lib/jobStatusBadges';
import { getLiveJobStatus, LIVE_JOB_STATUS_LABEL } from '../../lib/staffOps';
import { WfBadge } from '../ui/wireframe';

interface JobStatusBadgeProps {
  job: Pick<SecurityRequest, 'status'>;
  /** Staff ops view may surface live incident state instead of workflow status */
  variant?: 'default' | 'staff';
}

/** Single canonical lifecycle status chip — one per job card or detail header */
export function JobStatusBadge({ job, variant = 'default' }: JobStatusBadgeProps) {
  if (variant === 'staff') {
    const live = getLiveJobStatus(job as SecurityRequest);
    if (live === 'incident-flagged') {
      const cfg = LIVE_JOB_STATUS_LABEL[live];
      return (
        <WfBadge tone="warning">
          {cfg.emoji} {cfg.label}
        </WfBadge>
      );
    }
  }

  return (
    <WfBadge tone={jobStatusBadgeTone(job.status)}>{JOB_STATUS_LABELS[job.status]}</WfBadge>
  );
}
