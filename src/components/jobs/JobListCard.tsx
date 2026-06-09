import React from 'react';
import { SecurityRequest } from '../../types';
import { formatShiftRange } from '../../lib/dates';
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
import { WfBadge, WfListCard } from '../ui/wireframe';
import { Briefcase } from 'lucide-react';

interface JobListCardProps {
  job: SecurityRequest;
  subtitle?: string;
  meta?: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  showStatus?: boolean;
}

export function JobListCard({
  job,
  subtitle,
  meta,
  onClick,
  selected = false,
  showStatus = true,
}: JobListCardProps) {
  return (
    <WfListCard
      avatar={
        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-brand-primary" />
        </div>
      }
      title={job.title}
      subtitle={subtitle ?? `${job.clientName} · ${job.location}`}
      meta={
        meta ?? (
          <div className="flex flex-wrap items-center gap-1.5">
            {showStatus && <WfBadge>{JOB_STATUS_LABELS[job.status]}</WfBadge>}
            <span>{formatShiftRange(job.startDate, job.endDate)}</span>
          </div>
        )
      }
      onClick={onClick}
      className={selected ? 'app-item-card-selected' : ''}
    />
  );
}
