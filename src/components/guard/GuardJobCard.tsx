import React from 'react';
import { Block } from 'baseui/block';
import { HeadingXSmall, LabelSmall, LabelXSmall, ParagraphXSmall } from 'baseui/typography';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import {
  formatJobDate,
  formatJobTimeRange,
  getEstimatedGuardEarnings,
  getGuardHourlyPay,
  getJobDistance,
  JOB_TYPE_LABELS,
} from '../../lib/guardJobs';
import { formatDuration } from '../../lib/dates';
import { GuardJobDetailContent } from './GuardJobDetailContent';
import { WfBadge } from '../ui/wireframe';
import { GuardrCard } from '../baseui/GuardrCard';
import { MapPin } from 'lucide-react';

interface GuardJobCardProps {
  job: GuardJobView;
  guard: SecurityGuard;
  coworkerGuards?: SecurityGuard[];
  onAccept?: () => void;
  onDeclineDirectJob?: () => void;
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
  scheduleRequests?: import('../../lib/guardSchedule').ScheduleJob[];
  onSelect?: () => void;
  onClose?: () => void;
  compact?: boolean;
  feeConfig?: import('../../lib/payments').PlatformFeeConfig;
  onSubmitPriceOffer?: (input: {
    hourlyRate: number;
    agreementFeeConfig?: import('../../types').AgreementPlatformFeeConfig;
    message?: string;
  }) => void | Promise<void>;
  onAcceptPriceOffer?: (offerId: string) => void | Promise<void>;
}

export function GuardJobCard({
  job,
  guard,
  coworkerGuards,
  onAccept,
  onDeclineDirectJob,
  onApplyAsLead,
  onInviteGuard,
  onSuggestGuard,
  onRemoveGuard,
  onUpdateCrewProfile,
  onAcceptInvite,
  onDeclineInvite,
  scheduleRequests,
  onSelect,
  onClose,
  compact = false,
  feeConfig,
  onSubmitPriceOffer,
  onAcceptPriceOffer,
}: GuardJobCardProps) {
  const hourlyPay = getGuardHourlyPay(job);
  const estimated = getEstimatedGuardEarnings(job);

  if (compact) {
    const distance = getJobDistance(job);
    return (
      <Block
        as="button"
        type="button"
        onClick={onSelect}
        width="100%"
        $style={{ textAlign: 'left', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
      >
        <GuardrCard interactive>
          <Block display="flex" justifyContent="space-between" alignItems="flex-start" gridGap="scale400">
            <Block minWidth={0} flex="1">
              <Block display="flex" gridGap="scale200" marginBottom="scale200" $style={{ flexWrap: 'wrap' }}>
                <WfBadge tone="default">{JOB_TYPE_LABELS[job.type]}</WfBadge>
                {job.armedRequired && <WfBadge tone="warning">Armed</WfBadge>}
                {job.requestType === 'direct' && <WfBadge tone="primary">Direct</WfBadge>}
              </Block>
              <HeadingXSmall margin={0} $style={{ fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                {job.title}
              </HeadingXSmall>
              <LabelSmall color="contentSecondary" marginTop="scale100" margin={0}>
                {job.clientName}
              </LabelSmall>
              <Block display="flex" alignItems="center" gridGap="scale100" marginTop="scale100" color="contentSecondary">
                <MapPin size={12} style={{ flexShrink: 0 }} />
                <LabelXSmall color="contentSecondary" margin={0}>
                  {job.siteName || job.location}
                  {distance != null ? ` · ${distance} mi` : ''}
                </LabelXSmall>
              </Block>
              <LabelXSmall color="contentSecondary" marginTop="scale100">
                {formatJobDate(job)} · {formatJobTimeRange(job)} · {formatDuration(job.durationHours)}
              </LabelXSmall>
            </Block>
            <Block $style={{ textAlign: 'right', flexShrink: 0 }}>
              <HeadingXSmall margin={0} color="accent" $style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
                ${hourlyPay}/hr
              </HeadingXSmall>
              <ParagraphXSmall margin={0} color="contentSecondary">
                ${estimated} est.
              </ParagraphXSmall>
            </Block>
          </Block>
        </GuardrCard>
      </Block>
    );
  }

  return (
    <GuardJobDetailContent
      job={job}
      guard={guard}
      coworkerGuards={coworkerGuards}
      onAccept={onAccept}
      onDeclineDirectJob={onDeclineDirectJob}
      onApplyAsLead={onApplyAsLead}
      onInviteGuard={onInviteGuard}
      onSuggestGuard={onSuggestGuard}
      onRemoveGuard={onRemoveGuard}
      onUpdateCrewProfile={onUpdateCrewProfile}
      onAcceptInvite={onAcceptInvite}
      onDeclineInvite={onDeclineInvite}
      scheduleRequests={scheduleRequests}
      onClose={onClose}
      feeConfig={feeConfig}
      onSubmitPriceOffer={onSubmitPriceOffer}
      onAcceptPriceOffer={onAcceptPriceOffer}
    />
  );
}
