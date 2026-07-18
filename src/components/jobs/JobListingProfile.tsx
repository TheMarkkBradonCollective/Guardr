import React from 'react';
import { useStyletron } from 'baseui';
import { Block } from 'baseui/block';
import { HeadingLarge, LabelXSmall, LabelSmall, ParagraphSmall } from 'baseui/typography';
import {
  Briefcase,
  Clock,
  MapPin,
  Phone,
  Shield,
  Shirt,
  Star,
  User,
  Wrench,
  Car,
  Coffee,
  DoorOpen,
  FileText,
} from 'lucide-react';
import { formatDuration, formatShiftRange } from '../../lib/dates';
import { formatCityLabel } from '../../lib/californiaCities';
import { JobStatusBadge } from './JobStatusBadge';
import { teamRosterSummary } from '../../lib/guardTeams';
import {
  getJobRequiredCredentialLabels,
  guardJobMinQualificationLabel,
  JOB_TYPE_LABELS,
} from '../../lib/guardJobs';
import { JobListingLike, jobTypeLabel } from '../../lib/jobListing';
import { JobOperationalBriefingProfile } from './JobOperationalBriefingProfile';
import { JobOperationalDetails } from '../../types';
import { SecurityRequest } from '../../types';
import { WfBadge } from '../ui/wireframe';
import { GuardrTag } from '../baseui/GuardrTag';

function FieldLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  const [, theme] = useStyletron();
  return (
    <LabelXSmall
      marginTop={0}
      marginBottom="scale200"
      display="flex"
      alignItems="center"
      gridGap="scale200"
      color="contentSecondary"
      $style={{
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        fontWeight: 700,
      }}
    >
      {icon ? (
        <Block as="span" display="flex" color={theme.colors.contentSecondary} $style={{ flexShrink: 0 }}>
          {icon}
        </Block>
      ) : null}
      {children}
    </LabelXSmall>
  );
}

function DetailField({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const [, theme] = useStyletron();
  if (!children || (typeof children === 'string' && !children.trim())) return null;
  return (
    <Block
      paddingTop="scale400"
      marginTop="scale400"
      $style={{ borderTop: `1px solid ${theme.colors.borderOpaque}` }}
    >
      <FieldLabel icon={icon}>{title}</FieldLabel>
      <ParagraphSmall margin={0} $style={{ lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
        {children}
      </ParagraphSmall>
    </Block>
  );
}

interface JobListingProfileProps {
  job: JobListingLike;
  showClientHeader?: boolean;
  showBadges?: boolean;
  distanceMiles?: number;
  payLine?: React.ReactNode;
  footer?: React.ReactNode;
  operationalDetails?: JobOperationalDetails;
  operationalBriefingLocked?: boolean;
  jobStatus?: SecurityRequest['status'];
}

export function JobListingProfile({
  job,
  showClientHeader = true,
  showBadges = true,
  distanceMiles,
  payLine,
  footer,
  operationalDetails,
  operationalBriefingLocked = false,
  jobStatus,
}: JobListingProfileProps) {
  const [, theme] = useStyletron();
  const credentialLabels = getJobRequiredCredentialLabels(job);
  const typeLabel = JOB_TYPE_LABELS[job.type] || jobTypeLabel(job);

  return (
    <Block display="flex" flexDirection="column" gridGap="scale600">
      {showClientHeader && (
        <Block display="flex" alignItems="flex-start" gridGap="scale500">
          <Block
            width="48px"
            height="48px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            backgroundColor="accent50"
            $style={{
              flexShrink: 0,
              borderRadius: '12px',
              border: `1px solid ${theme.colors.accent}`,
            }}
          >
            <LabelSmall color="accent" margin={0} $style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
              {job.clientLogo || job.clientName.slice(0, 2).toUpperCase()}
            </LabelSmall>
          </Block>
          <Block minWidth={0} flex="1">
            <LabelXSmall
              color="accent"
              marginBottom="scale100"
              $style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}
            >
              Client offer
            </LabelXSmall>
            <HeadingLarge margin={0} $style={{ fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              {job.title}
            </HeadingLarge>
            <ParagraphSmall marginTop="scale200" marginBottom={0} color="contentSecondary" $style={{ fontWeight: 500 }}>
              {job.clientName}
            </ParagraphSmall>
            {job.clientRating != null && (
              <Block
                display="flex"
                alignItems="center"
                gridGap="scale100"
                marginTop="scale100"
                color="contentSecondary"
              >
                <Star size={14} className="fill-current" style={{ color: theme.colors.accent }} />
                <LabelXSmall color="contentSecondary" margin={0} $style={{ fontWeight: 500 }}>
                  {job.clientRating.toFixed(1)} client rating
                </LabelXSmall>
              </Block>
            )}
          </Block>
        </Block>
      )}

      {showBadges && (
        <Block display="flex" gridGap="scale300" $style={{ flexWrap: 'wrap' }}>
          {job.status && <JobStatusBadge job={{ status: job.status }} />}
          <WfBadge tone="default">{typeLabel}</WfBadge>
          {job.armedRequired && <WfBadge tone="warning">Armed post</WfBadge>}
          {job.requestType === 'direct' && <WfBadge tone="primary">Direct request</WfBadge>}
          {job.guardsNeeded != null && job.guardsNeeded > 1 && (
            <WfBadge>
              {(() => {
                const summary = teamRosterSummary(job.guardSlots, job.guardsNeeded);
                return summary.filled > 0
                  ? `${summary.filled}/${summary.total} filled${summary.open > 0 ? ` · ${summary.open} open` : ''}`
                  : `${job.guardsNeeded} guards needed`;
              })()}
            </WfBadge>
          )}
        </Block>
      )}

      {job.description?.trim() && (
        <ParagraphSmall
          margin={0}
          paddingLeft="scale400"
          $style={{ lineHeight: 1.55, borderLeft: `2px solid ${theme.colors.accent}` }}
        >
          {job.description}
        </ParagraphSmall>
      )}

      <Block
        display="grid"
        gridGap="scale500"
        $style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
      >
        <Block>
          <FieldLabel icon={<MapPin size={14} style={{ color: theme.colors.accent }} />}>Location</FieldLabel>
          {job.siteName && (
            <ParagraphSmall margin={0} $style={{ fontWeight: 500 }}>
              {job.siteName}
            </ParagraphSmall>
          )}
          {job.address && <ParagraphSmall margin={0}>{job.address}</ParagraphSmall>}
          {job.state && (
            <LabelXSmall color="contentSecondary" marginTop="scale100">
              {formatCityLabel(job.state)}
              {distanceMiles != null ? ` · ${distanceMiles} mi away` : ''}
            </LabelXSmall>
          )}
        </Block>

        <Block>
          <FieldLabel icon={<Clock size={14} style={{ color: theme.colors.accent }} />}>Schedule</FieldLabel>
          <ParagraphSmall margin={0} $style={{ fontWeight: 500 }}>
            {formatShiftRange(job.startDate, job.endDate)}
          </ParagraphSmall>
          <LabelXSmall color="contentSecondary" marginTop="scale100">
            {formatDuration(job.durationHours)} coverage
          </LabelXSmall>
          {(job.breakMinutes ?? 0) > 0 && (
            <Block display="flex" alignItems="center" gridGap="scale100" marginTop="scale100" color="contentSecondary">
              <Coffee size={14} style={{ color: theme.colors.accent }} />
              <LabelXSmall color="contentSecondary" margin={0}>
                {job.breakMinutes} min {(job as { breakPaid?: boolean }).breakPaid === false ? 'unpaid' : 'paid'} break
              </LabelXSmall>
            </Block>
          )}
        </Block>
      </Block>

      {payLine && <Block className="detail-pay-block">{payLine}</Block>}

      <Block paddingTop="scale400" $style={{ borderTop: `1px solid ${theme.colors.borderOpaque}` }}>
        <FieldLabel icon={<Shield size={14} style={{ color: theme.colors.accent }} />}>Guard requirements</FieldLabel>
        <ParagraphSmall margin={0}>
          Minimum status:{' '}
          <Block as="span" $style={{ fontWeight: 600 }}>
            {guardJobMinQualificationLabel(job.minGuardQualification)}
          </Block>
        </ParagraphSmall>
        {credentialLabels.length > 0 && (
          <Block display="flex" gridGap="scale200" marginTop="scale300" $style={{ flexWrap: 'wrap' }}>
            {credentialLabels.map((label) => (
              <GuardrTag key={label} kind="neutral" closeable={false}>
                {label}
              </GuardrTag>
            ))}
          </Block>
        )}
      </Block>

      <Block>
        <FieldLabel icon={<Briefcase size={14} />}>Post orders &amp; professional standards</FieldLabel>

        <DetailField icon={<Shirt size={14} />} title="Dress code & uniform">
          {job.uniformRequirements}
        </DetailField>

        <DetailField icon={<Wrench size={14} />} title="Equipment">
          {job.equipmentRequirements}
        </DetailField>

        <DetailField icon={<FileText size={14} />} title="Site instructions">
          {!operationalBriefingLocked ? job.siteInstructions : null}
        </DetailField>

        <DetailField icon={<Car size={14} />} title="Parking & arrival">
          {!operationalBriefingLocked ? job.parkingInstructions : null}
        </DetailField>

        <DetailField icon={<DoorOpen size={14} />} title="Access & check-in">
          {!operationalBriefingLocked ? job.accessInstructions : null}
        </DetailField>

        {!operationalBriefingLocked && (job.contactName || job.contactPhone) && (
          <DetailField icon={<User size={14} />} title="On-site contact">
            <>
              {job.contactName}
              {job.contactPhone && (
                <Block display="flex" alignItems="center" gridGap="scale200" marginTop="scale100" color="contentSecondary">
                  <Phone size={14} />
                  {job.contactPhone}
                </Block>
              )}
            </>
          </DetailField>
        )}
      </Block>

      <JobOperationalBriefingProfile
        details={operationalDetails}
        locked={operationalBriefingLocked}
        jobStatus={jobStatus ?? job.status}
      />

      {footer}
    </Block>
  );
}
