import React, { useState } from 'react';
import { ChevronRight, IdCard } from 'lucide-react';
import { SecurityGuard } from '../../types';
import {
  formatIdSummaryLine,
  getGovernmentIdUploadStatus,
  guardHasGovernmentIdOnFile,
  guardIdVerificationPhotosComplete,
  ID_VERIFICATION_POLICY_HINT,
  isIdExpired,
} from '../../lib/guardIdentityVerification';
import { getGovernmentIdSectionStatus } from '../../lib/credentialSectionStatus';
import { CredentialListStatusBadge, CredentialRowAction, CredentialRowHeader, CredentialSectionStatusDisplay } from '../credentials/CredentialStatusLabels';
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
  onViewFull?: () => void;
  viewFullLabel?: string;
  onEditFullPage?: () => void;
}

/** Government ID — tap to view details; edit from the detail modal. */
export function GuardIdItemCard({
  guard,
  canEdit = false,
  staffMode = false,
  guardName,
  asCredentialSection = false,
  onSubmit,
  onViewFull,
  viewFullLabel,
  onEditFullPage,
}: GuardIdItemCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const hasOnFile = guardHasGovernmentIdOnFile(guard);
  const expired = isIdExpired(guard);
  const uploadStatus = getGovernmentIdUploadStatus(guard);
  const sectionStatus = getGovernmentIdSectionStatus(guard, staffMode);
  const openInEditMode = canEdit && !hasOnFile;

  const openDetail = () => {
    if (openInEditMode && onEditFullPage) {
      onEditFullPage();
      return;
    }
    setShowDetail(true);
  };

  const detailModal =
    showDetail && onSubmit ? (
      <GuardIdDetailModal
        guard={guard}
        guardName={guardName}
        canEdit={canEdit}
        staffMode={staffMode}
        initialEditMode={openInEditMode}
        onSubmit={onSubmit}
        onViewFull={onViewFull}
        viewFullLabel={viewFullLabel}
        onEditFullPage={onEditFullPage}
        onClose={() => setShowDetail(false)}
      />
    ) : null;

  const cardBody = hasOnFile ? (
    <div className="app-cert-item">
      <button
        type="button"
        onClick={openDetail}
        className={`app-cert-item-interactive app-cert-item-body min-w-0 flex-1 text-left${guard.idFrontUrl ? ' flex gap-3' : ''}`}
      >
        {guard.idFrontUrl && (
          <img
            src={guard.idFrontUrl}
            alt={`${guardName || guard.name} government ID preview`}
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
          onClick={openDetail}
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
        <CredentialRowHeader
          rawTitle
          title={
            <p className="uber-label flex items-center gap-2 flex-wrap">
              <IdCard className="w-4 h-4 text-brand-primary shrink-0" />
              Government ID
            </p>
          }
          subtitle={
            <>
              <div className="mt-2">
                <CredentialSectionStatusDisplay status={sectionStatus} />
              </div>
            </>
          }
          action={
            (canEdit || staffMode) ? (
              <CredentialRowAction
                staffMode={staffMode}
                uploadStatus={uploadStatus}
                canUpload={canEdit}
                onAdd={openDetail}
              />
            ) : undefined
          }
        />

        {hasOnFile ? (
          <div className="app-cert-item-stack border-t border-brand-border">{cardBody}</div>
        ) : (
          <p className="text-xs text-brand-text-muted py-3 border-t border-brand-border">
            No government ID on file.
          </p>
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
            onClick={openDetail}
            className="flex items-start justify-between gap-3 w-full text-left"
          >
            <p className="text-sm font-semibold text-brand-text-muted">Government ID</p>
            <CredentialListStatusBadge status={uploadStatus} staffMode={staffMode} />
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
