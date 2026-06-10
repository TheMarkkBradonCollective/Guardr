import React from 'react';
import { SecurityRequest } from '../../types';
import {
  hasAnySelfAuditPhoto,
  isNoSelfAuditFlagged,
  shouldShowJobSelfAuditPhotos,
} from '../../lib/selfAuditPhotos';
import { NoSelfAuditBadge } from './NoSelfAuditBadge';
import { SelfAuditPhotoGallery } from './SelfAuditPhotoGallery';
import { Camera } from 'lucide-react';

interface JobSelfAuditPhotosSectionProps {
  request: Pick<SecurityRequest, 'checkInAudit'>;
  /** Hide staff upload attribution (guard-facing views) */
  hideStaffAttribution?: boolean;
}

export function JobSelfAuditPhotosSection({
  request,
  hideStaffAttribution = false,
}: JobSelfAuditPhotosSectionProps) {
  const audit = request.checkInAudit;
  if (!shouldShowJobSelfAuditPhotos(request)) return null;

  const flagged = isNoSelfAuditFlagged(request as SecurityRequest);
  const hasPhotos = hasAnySelfAuditPhoto(audit);

  return (
    <div className="pt-2 border-t border-brand-border space-y-3">
      <div className="flex items-start gap-2">
        <Camera className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">Self-audit photos</p>
            {flagged && <NoSelfAuditBadge />}
          </div>
          {audit?.checkedAt && (
            <p className="text-xs text-brand-text-muted mt-1">Checked in {audit.checkedAt}</p>
          )}
          {flagged && !hasPhotos && (
            <p className="text-xs text-amber-400/90 mt-1">No photos yet — self-audit was skipped at clock-in.</p>
          )}
          {!hideStaffAttribution && audit?.staffUploadedBy && (
            <p className="text-xs text-brand-text-muted mt-1">
              Photos uploaded by staff ({audit.staffUploadedBy})
              {audit.staffUploadedAt ? ` · ${new Date(audit.staffUploadedAt).toLocaleString()}` : ''}
            </p>
          )}
          {audit?.clientConfirmedAt && (
            <p className="text-xs text-emerald-400/90 mt-1">
              Client confirmed {new Date(audit.clientConfirmedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
      {hasPhotos && <SelfAuditPhotoGallery audit={audit} />}
    </div>
  );
}
