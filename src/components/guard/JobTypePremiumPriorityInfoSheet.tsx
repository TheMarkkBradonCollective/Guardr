import React from 'react';
import { AppModal } from '../ui/motion/AppMotion';
import { premiumPriorityInfoCopy } from '../../lib/guardPremiumJobPriority';
import { JOB_TYPE_ICONS } from './guardJobTypeIcons';
import type { JobType } from '../../types';
import { jobTypeRatingDisplayName } from '../../lib/guardJobTypeRatingMetrics';

interface JobTypePremiumPriorityInfoSheetProps {
  jobType: JobType;
  totalTargets: number;
  open: boolean;
  onClose: () => void;
}

export function JobTypePremiumPriorityInfoSheet({
  jobType,
  totalTargets,
  open,
  onClose,
}: JobTypePremiumPriorityInfoSheetProps) {
  const displayName = jobTypeRatingDisplayName(jobType);
  const Icon = JOB_TYPE_ICONS[jobType];
  const copy = premiumPriorityInfoCopy(displayName, totalTargets);

  return (
    <AppModal open={open} position="absolute" zIndex={1004} onClose={onClose} ariaLabelledBy="premium-priority-info-title">
      <div className="guard-premium-priority-sheet">
        <div className="guard-premium-priority-sheet-icon-wrap" aria-hidden>
          <Icon className="guard-premium-priority-sheet-icon" />
        </div>
        <h2 id="premium-priority-info-title" className="guard-premium-priority-sheet-title">
          {copy.title}
        </h2>
        <p className="guard-premium-priority-sheet-body">{copy.body}</p>
        <button type="button" className="guard-premium-priority-sheet-cta" onClick={onClose}>
          {copy.ctaLabel}
        </button>
      </div>
    </AppModal>
  );
}
