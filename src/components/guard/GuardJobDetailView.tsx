import React from 'react';
import { JobChatThread, SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import type { ScheduleJob } from '../../lib/guardSchedule';
import { GuardJobCard } from './GuardJobCard';
import { GuardMyJobDetail } from './GuardMyJobDetail';

export interface GuardJobDetailViewProps {
  job: GuardJobView;
  guard: SecurityGuard;
  jobChatThreads?: JobChatThread[];
  coworkerGuards?: SecurityGuard[];
  scheduleRequests?: ScheduleJob[];
  onAccept?: () => void;
  onDeclineDirectJob?: () => void | Promise<void>;
  onApplyAsLead?: () => void | Promise<void>;
  onInviteGuard?: (guardId: string) => void | Promise<void>;
  onSuggestGuard?: (guardId: string) => void | Promise<void>;
  onRemoveGuard?: (guardId: string) => void | Promise<void>;
  onUpdateCrewProfile?: (patch: {
    crewName: string;
    crewDescription: string;
  }) => void | Promise<void>;
  onAcceptInvite?: () => void | Promise<void>;
  onDeclineInvite?: () => void | Promise<void>;
  onOpenMessages?: (jobId: string) => void;
  onApproveOvertime?: (requestId: string) => void | Promise<void>;
  onClose?: () => void;
  feeConfig?: import('../../lib/payments').PlatformFeeConfig;
  onSubmitPriceOffer?: (input: {
    hourlyRate: number;
    agreementFeeConfig?: import('../../types').AgreementPlatformFeeConfig;
    message?: string;
  }) => void | Promise<void>;
  onAcceptPriceOffer?: (offerId: string) => void | Promise<void>;
  onViewBriefing?: (jobId: string) => void;
}

/** One job detail surface — Jobs list and map card share this. */
export function GuardJobDetailView({
  job,
  guard,
  jobChatThreads = [],
  coworkerGuards,
  scheduleRequests,
  onAccept,
  onDeclineDirectJob,
  onApplyAsLead,
  onInviteGuard,
  onSuggestGuard,
  onRemoveGuard,
  onUpdateCrewProfile,
  onAcceptInvite,
  onDeclineInvite,
  onOpenMessages,
  onApproveOvertime,
  onClose,
  feeConfig,
  onSubmitPriceOffer,
  onAcceptPriceOffer,
  onViewBriefing,
}: GuardJobDetailViewProps) {
  if (job.status === 'open') {
    return (
      <div className="px-5 pb-8">
        <GuardJobCard
          job={job}
          guard={guard}
          coworkerGuards={coworkerGuards}
          scheduleRequests={scheduleRequests}
          onAccept={onAccept}
          onDeclineDirectJob={onDeclineDirectJob}
          onApplyAsLead={onApplyAsLead}
          onInviteGuard={onInviteGuard}
          onSuggestGuard={onSuggestGuard}
          onRemoveGuard={onRemoveGuard}
          onUpdateCrewProfile={onUpdateCrewProfile}
          onAcceptInvite={onAcceptInvite}
          onDeclineInvite={onDeclineInvite}
          onClose={onClose}
          feeConfig={feeConfig}
          onSubmitPriceOffer={onSubmitPriceOffer}
          onAcceptPriceOffer={onAcceptPriceOffer}
        />
      </div>
    );
  }

  return (
    <GuardMyJobDetail
      job={job}
      guard={guard}
      jobChatThreads={jobChatThreads}
      coworkerGuards={coworkerGuards}
      scheduleRequests={scheduleRequests}
      onOpenMessages={onOpenMessages}
      onApproveOvertime={onApproveOvertime}
      onApplyAsLead={onApplyAsLead ? () => void onApplyAsLead() : undefined}
      onInviteGuard={
        onInviteGuard ? (_jobId, guardId) => void onInviteGuard(guardId) : undefined
      }
      onRemoveGuard={
        onRemoveGuard ? (_jobId, guardId) => void onRemoveGuard(guardId) : undefined
      }
      onUpdateCrewProfile={
        onUpdateCrewProfile ? (_jobId, patch) => void onUpdateCrewProfile(patch) : undefined
      }
      onAcceptInvite={onAcceptInvite ? () => void onAcceptInvite() : undefined}
      onDeclineInvite={onDeclineInvite ? () => void onDeclineInvite() : undefined}
      onViewBriefing={onViewBriefing}
    />
  );
}
