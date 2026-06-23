import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { SecurityGuard } from '../../types';
import {
  formatIdSummaryLine,
  guardIdVerificationPhotosComplete,
  isIdExpired,
} from '../../lib/guardIdentityVerification';
import { IdCredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { GuardIdDetailModal } from './GuardIdDetailModal';
import { WfBadge } from '../ui/wireframe';
import type {
  GuardIdentityVerificationPayload,
  IdentityVerificationSubmitResult,
} from './GuardIdentityVerificationPanel';

function guardHasIdOnFile(guard: SecurityGuard): boolean {
  return Boolean(
    guard.idState?.trim() ||
      guard.idNumber?.trim() ||
      guard.idExpiryDate?.trim() ||
      guard.idFrontUrl?.trim() ||
      guard.idBackUrl?.trim() ||
      guard.idSelfieUrl?.trim()
  );
}

interface GuardIdItemCardProps {
  guard: SecurityGuard;
  canEdit?: boolean;
  staffMode?: boolean;
  guardName?: string;
  onSubmit?: (payload: GuardIdentityVerificationPayload) => Promise<IdentityVerificationSubmitResult>;
}

/** Government ID — credential-style card. Tap to view details; edit from the detail modal. */
export function GuardIdItemCard({
  guard,
  canEdit = false,
  staffMode = false,
  guardName,
  onSubmit,
}: GuardIdItemCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const hasOnFile = guardHasIdOnFile(guard);
  const expired = isIdExpired(guard);
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

  if (!hasOnFile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowDetail(true)}
          className="flex items-center justify-between gap-2 py-2 border-b border-brand-border w-full text-left"
        >
          <p className="text-xs text-brand-text-muted">Government ID</p>
          {staffMode || !canEdit ? (
            <WfBadge tone="warning" className="!text-[10px]">
              Missing
            </WfBadge>
          ) : (
            <span className="text-[10px] font-medium text-brand-primary">Tap to add</span>
          )}
        </button>
        {guard.idVerificationRejectionReason && (
          <p className="text-xs text-amber-500 pt-1 leading-snug line-clamp-2">
            {guard.idVerificationRejectionReason}
          </p>
        )}
        {detailModal}
      </>
    );
  }

  return (
    <>
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
            <p className="font-semibold text-sm leading-snug">Government ID</p>
            <p className={`text-xs mt-1 ${expired ? 'text-amber-600' : 'text-brand-text-muted'}`}>
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
          {!guardIdVerificationPhotosComplete(guard) && hasOnFile && (
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

      {detailModal}
    </>
  );
}
