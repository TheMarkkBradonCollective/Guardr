import React, { useState } from 'react';
import { ChevronRight, IdCard } from 'lucide-react';
import { SecurityGuard } from '../../types';
import {
  formatIdSummaryLine,
  getGovernmentIdUploadStatus,
  getGovernmentIdUploadStatusSummary,
  guardHasGovernmentIdOnFile,
  guardIdVerificationPhotosComplete,
  ID_VERIFICATION_POLICY_HINT,
  isIdExpired,
} from '../../lib/guardIdentityVerification';
import { CredentialListStatusBadge, CredentialSectionStatusBadge } from '../credentials/CredentialStatusLabels';
import { staffCredentialUploadLabel } from '../../lib/guardCredentialUpload';
import { IdCredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { GuardIdDetailModal } from './GuardIdDetailModal';
import type {
  GuardIdentityVerificationPayload,
  IdentityVerificationSubmitResult,
} from './GuardIdentityVerificationPanel';

interface GuardIdItemCardProps {
  guard: SecurityGuard;
  canEdit?: boolean;
  staffMode?: boolean;
  guardName?: string;
  /** Section layout matching PTA/UOF and 32-hour blocks. */
  asCredentialSection?: boolean;
  onSubmit?: (payload: GuardIdentityVerificationPayload) => Promise<IdentityVerificationSubmitResult>;
}

/** Government ID — tap to view details; edit from the detail modal. */
export function GuardIdItemCard({
  guard,
  canEdit = false,
  staffMode = false,
  guardName,
  asCredentialSection = false,
  onSubmit,
}: GuardIdItemCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const hasOnFile = guardHasGovernmentIdOnFile(guard);
  const expired = isIdExpired(guard);
  const uploadStatus = getGovernmentIdUploadStatus(guard);
  const openInEditMode = canEdit && !hasOnFile;

  const detailModal =
    showDetail && onSubmit ? (
      <GuardIdDetailModal
        guard={guard}
        guardName={guardName}
        canEdit={canEdit}
        staffMode={staffMode}
        initialEditMode={openInEditMode}
        onSubmit={onSubmit}
        onClose={() => setShowDetail(false)}
      />
    ) : null;

  const cardBody = hasOnFile ? (
    <div className="app-cert-item">
      <button
        type="button"
        onClick={() => setShowDetail(true)}
        className={`app-cert-item-interactive app-cert-item-body min-w-0 flex-1 text-left${guard.idFrontUrl ? ' flex gap-3' : ''}`}
      >
        {guard.idFrontUrl && (
          <img
            src={guard.idFrontUrl}
            alt=""
            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-brand-border"
          />
        )}
        <div className="min-w-0 flex-1">
          {!asCredentialSection && (
            <p className="font-semibold text-sm leading-snug">Government ID</p>
          )}
          <p className={`text-xs ${asCredentialSection ? '' : 'mt-1'} ${expired ? 'text-amber-600' : 'text-brand-text-muted'}`}>
            {formatIdSummaryLine(guard)}
          </p>
          <p className="text-[10px] text-brand-primary mt-1">Tap to view details</p>
          {guard.idVerificationRejectionReason && (
            <p className="text-xs text-amber-500 mt-1.5 leading-snug line-clamp-2">
              {guard.idVerificationRejectionReason}
            </p>
          )}
        </div>
      </button>
      <div className="app-cert-item-meta">
        <IdCredentialStatusBadges guard={guard} />
        {!guardIdVerificationPhotosComplete(guard) && (
          <span className="text-[10px] text-brand-text-muted">Photos incomplete</span>
        )}
        <button
          type="button"
          onClick={() => setShowDetail(true)}
          className="p-1 text-brand-text-muted hover:text-brand-text"
          aria-label="View government ID details"
        >
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </div>
  ) : null;

  if (asCredentialSection) {
    return (
      <section className="app-form-section space-y-3">
        <div>
          <p className="uber-label flex items-center gap-2 flex-wrap">
            <IdCard className="w-4 h-4 text-brand-primary" />
            Government ID
            {staffMode && uploadStatus === 'missing' &&
              (canEdit ? (
                <button type="button" onClick={() => setShowDetail(true)} className="inline-flex">
                  <CredentialSectionStatusBadge label="Missing" />
                </button>
              ) : (
                <CredentialSectionStatusBadge label="Missing" />
              ))}
          </p>
          <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
            Required before profile approval. {ID_VERIFICATION_POLICY_HINT}
          </p>
          <p
            className={`text-xs font-semibold mt-2 ${
              uploadStatus === 'on-file' ? 'text-brand-primary' : 'text-brand-text-muted'
            }`}
          >
            {getGovernmentIdUploadStatusSummary(guard)}
          </p>
        </div>

        {hasOnFile ? (
          <div className="app-cert-item-stack border-t border-brand-border">{cardBody}</div>
        ) : (
          <>
            <p className="text-xs text-brand-text-muted py-3 border-t border-brand-border">
              No government ID on file.
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => setShowDetail(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-text hover:underline"
              >
                {staffCredentialUploadLabel(staffMode, 'government ID')}
              </button>
            )}
          </>
        )}

        {guard.idVerificationRejectionReason && !hasOnFile && (
          <p className="text-xs text-amber-500 leading-snug">{guard.idVerificationRejectionReason}</p>
        )}

        {detailModal}
      </section>
    );
  }

  if (!hasOnFile) {
    return (
      <>
        <div className="app-list-subrow">
          <button
            type="button"
            onClick={() => setShowDetail(true)}
            className="flex items-start justify-between gap-3 w-full text-left"
          >
            <p className="text-sm font-semibold text-brand-text-muted">Government ID</p>
            <CredentialListStatusBadge status={uploadStatus} />
          </button>
        </div>
        {detailModal}
      </>
    );
  }

  return (
    <>
      {cardBody}
      {detailModal}
    </>
  );
}
