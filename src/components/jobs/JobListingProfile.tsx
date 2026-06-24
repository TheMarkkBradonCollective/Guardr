import React from 'react';
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
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
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

function DetailField({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  if (!children || (typeof children === 'string' && !children.trim())) return null;
  return (
    <div className="detail-field">
      <p className="detail-field-label">
        {icon}
        {title}
      </p>
      <div className="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">{children}</div>
    </div>
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
  const credentialLabels = getJobRequiredCredentialLabels(job);
  const typeLabel = JOB_TYPE_LABELS[job.type] || jobTypeLabel(job);

  return (
    <div className="staff-detail-pane space-y-4">
      {showClientHeader && (
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 bg-brand-primary/12 border border-brand-primary/22 flex items-center justify-center shrink-0 rounded-xl">
            <span className="text-sm font-black text-brand-primary tracking-tight">{job.clientLogo || job.clientName.slice(0, 2).toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-brand-primary mb-1">Client offer</p>
            <h3 className="text-2xl font-black tracking-[-0.04em] leading-tight">{job.title}</h3>
            <p className="text-sm text-brand-text-muted mt-1.5 font-medium">{job.clientName}</p>
            {job.clientRating != null && (
              <p className="text-xs text-brand-text-muted flex items-center gap-1 mt-1 font-medium">
                <Star className="w-3.5 h-3.5 fill-brand-primary text-brand-primary" />
                {job.clientRating.toFixed(1)} client rating
              </p>
            )}
          </div>
        </div>
      )}

      {showBadges && (
        <div className="flex flex-wrap gap-2">
          {job.status && <WfBadge>{JOB_STATUS_LABELS[job.status]}</WfBadge>}
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
        </div>
      )}

      {job.description?.trim() && (
        <p className="text-sm text-brand-text leading-relaxed border-l-2 border-brand-primary pl-3">
          {job.description}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        <div className="detail-field !border-t-0 !pt-0">
          <p className="detail-field-label">
            <MapPin className="w-3.5 h-3.5 text-brand-primary" />
            Location
          </p>
          {job.siteName && <p className="text-sm font-medium">{job.siteName}</p>}
          {job.address && <p className="text-sm">{job.address}</p>}
          {job.state && (
            <p className="text-xs text-brand-text-muted">
              {formatCityLabel(job.state)}
              {distanceMiles != null ? ` · ${distanceMiles} mi away` : ''}
            </p>
          )}
        </div>

        <div className="detail-field !border-t-0 !pt-0 sm:border-t-0">
          <p className="detail-field-label">
            <Clock className="w-3.5 h-3.5 text-brand-primary" />
            Schedule
          </p>
          <p className="text-sm font-medium">{formatShiftRange(job.startDate, job.endDate)}</p>
          <p className="text-xs text-brand-text-muted">{formatDuration(job.durationHours)} coverage</p>
          {(job.breakMinutes ?? 0) > 0 && (
            <p className="text-xs text-brand-text-muted flex items-center gap-1 mt-1">
              <Coffee className="w-3.5 h-3.5 text-brand-primary" />
              {job.breakMinutes} min {(job as { breakPaid?: boolean }).breakPaid === false ? 'unpaid' : 'paid'} break
            </p>
          )}
        </div>
      </div>

      {payLine && <div className="detail-pay-block">{payLine}</div>}

      <div className="detail-field">
        <p className="detail-field-label">
          <Shield className="w-3.5 h-3.5 text-brand-primary" />
          Guard requirements
        </p>
        <p className="text-sm">
          Minimum status: <span className="font-medium">{guardJobMinQualificationLabel(job.minGuardQualification)}</span>
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {credentialLabels.map((label) => (
            <span key={label} className="chip chip-inactive text-xs">
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-0">
        <p className="detail-field-label mb-2">
          <Briefcase className="w-3.5 h-3.5" />
          Post orders & professional standards
        </p>

        <DetailField icon={<Shirt className="w-3.5 h-3.5" />} title="Dress code & uniform">
          {job.uniformRequirements}
        </DetailField>

        <DetailField icon={<Wrench className="w-3.5 h-3.5" />} title="Equipment">
          {job.equipmentRequirements}
        </DetailField>

        <DetailField icon={<FileText className="w-3.5 h-3.5" />} title="Site instructions">
          {!operationalBriefingLocked ? job.siteInstructions : null}
        </DetailField>

        <DetailField icon={<Car className="w-3.5 h-3.5" />} title="Parking & arrival">
          {!operationalBriefingLocked ? job.parkingInstructions : null}
        </DetailField>

        <DetailField icon={<DoorOpen className="w-3.5 h-3.5" />} title="Access & check-in">
          {!operationalBriefingLocked ? job.accessInstructions : null}
        </DetailField>

        {!operationalBriefingLocked && (job.contactName || job.contactPhone) && (
          <DetailField icon={<User className="w-3.5 h-3.5" />} title="On-site contact">
            <>
              {job.contactName}
              {job.contactPhone && (
                <p className="flex items-center gap-1.5 mt-1 text-brand-text-muted">
                  <Phone className="w-3.5 h-3.5" />
                  {job.contactPhone}
                </p>
              )}
            </>
          </DetailField>
        )}
      </div>

      <JobOperationalBriefingProfile
        details={operationalDetails}
        locked={operationalBriefingLocked}
        jobStatus={jobStatus ?? job.status}
      />

      {footer}
    </div>
  );
}
