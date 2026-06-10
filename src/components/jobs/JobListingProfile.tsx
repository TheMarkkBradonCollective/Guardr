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
  DoorOpen,
  FileText,
} from 'lucide-react';
import { formatDuration, formatShiftRange } from '../../lib/dates';
import { formatStateName } from '../../lib/states';
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
import {
  getJobRequiredCredentialLabels,
  guardJobMinQualificationLabel,
  JOB_TYPE_LABELS,
} from '../../lib/guardJobs';
import { JobListingLike, jobTypeLabel } from '../../lib/jobListing';
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
}

export function JobListingProfile({
  job,
  showClientHeader = true,
  showBadges = true,
  distanceMiles,
  payLine,
  footer,
}: JobListingProfileProps) {
  const credentialLabels = getJobRequiredCredentialLabels(job);
  const typeLabel = JOB_TYPE_LABELS[job.type] || jobTypeLabel(job);

  return (
    <div className="staff-detail-pane space-y-4">
      {showClientHeader && (
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/15 border border-brand-primary/25 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-brand-primary">{job.clientLogo || job.clientName.slice(0, 2).toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-brand-primary uppercase tracking-wide">Client offer</p>
            <h3 className="text-xl font-bold tracking-tight leading-tight mt-0.5">{job.title}</h3>
            <p className="text-sm text-brand-text-muted mt-1">{job.clientName}</p>
            {job.clientRating != null && (
              <p className="text-xs text-brand-text-muted flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 fill-brand-primary text-brand-primary" />
                Client rating {job.clientRating.toFixed(1)}
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
            <WfBadge>{job.guardsNeeded} guards needed</WfBadge>
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
              {formatStateName(job.state)}
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
          {job.siteInstructions}
        </DetailField>

        <DetailField icon={<Car className="w-3.5 h-3.5" />} title="Parking & arrival">
          {job.parkingInstructions}
        </DetailField>

        <DetailField icon={<DoorOpen className="w-3.5 h-3.5" />} title="Access & check-in">
          {job.accessInstructions}
        </DetailField>

        {(job.contactName || job.contactPhone) && (
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

      {footer}
    </div>
  );
}
