import React from 'react';
import { FileText } from 'lucide-react';
import { AppModal } from '../ui/motion/AppMotion';
import { SlideToConfirm } from '../ui/SlideToConfirm';
import type { GuardJobView } from '../../lib/guardJobView';
import { JobListingProfile } from '../jobs/JobListingProfile';

interface GuardBriefingAckGateProps {
  open: boolean;
  job: GuardJobView;
  onAcknowledge: () => void | Promise<void>;
}

export function GuardBriefingAckGate({ open, job, onAcknowledge }: GuardBriefingAckGateProps) {
  return (
    <AppModal open={open} position="absolute" zIndex={1004} ariaLabelledBy="briefing-ack-gate-title">
      <div className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div>
          <p id="briefing-ack-gate-title" className="font-semibold text-brand-primary flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Complete briefing before clock-in
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 leading-relaxed">
            You arrived without reviewing the pre-shift briefing. The client was not notified you were fully prepared.
            Read the briefing now before starting paid coverage.
          </p>
        </div>

        <div className="border border-brand-border rounded-2xl p-4 bg-brand-bg max-h-64 overflow-y-auto">
          <JobListingProfile
            job={job}
            showClientHeader={false}
            showBadges={false}
            operationalDetails={job.operationalDetails}
            operationalBriefingLocked={job.operationalBriefingLocked}
            jobStatus={job.status}
          />
        </div>

        <SlideToConfirm
          label="I have read the site briefing"
          confirmedLabel="Acknowledged"
          onConfirm={() => void onAcknowledge()}
        />
      </div>
    </AppModal>
  );
}
