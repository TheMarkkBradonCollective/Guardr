import React from 'react';
import { useStyletron } from 'baseui';
import { Block } from 'baseui/block';
import { SecurityRequest } from '../../types';
import { formatShiftRange } from '../../lib/dates';
import { WfListCard } from '../ui/wireframe';
import { JobStatusBadge } from './JobStatusBadge';
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
  const [, theme] = useStyletron();
  return (
    <WfListCard
      avatar={
        <Block
          width="40px"
          height="40px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          backgroundColor="accent50"
          color="accent"
          $style={{ borderRadius: '12px' }}
        >
          <Briefcase size={20} style={{ color: theme.colors.accent }} />
        </Block>
      }
      title={job.title}
      subtitle={subtitle ?? `${job.clientName} · ${job.location}`}
      meta={
        meta ?? (
          <Block display="flex" alignItems="center" gridGap="scale200" $style={{ flexWrap: 'wrap' }}>
            {showStatus && <JobStatusBadge job={job} />}
            <Block as="span" font="font100" color="contentSecondary">
              {formatShiftRange(job.startDate, job.endDate)}
            </Block>
          </Block>
        )
      }
      onClick={onClick}
      className={selected ? 'app-item-card-selected' : ''}
    />
  );
}
