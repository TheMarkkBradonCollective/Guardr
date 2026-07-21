import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import type { GuardInsurancePolicy, SecurityGuard } from '../../types';
import { getCoiSectionStatus } from '../../lib/credentialSectionStatus';
import {
  formatCoiSummaryLine,
  getCoiUploadStatus,
  guardCoiCanGuardEdit,
  guardCoiOnFile,
  resolveInsuranceStatus,
} from '../../lib/guardInsurance';
import {
  CredentialRowAction,
  CredentialRowHeader,
} from '../credentials/CredentialStatusLabels';
import { CoiCredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { GuardCoiDetailModal } from './GuardCoiDetailModal';
import { GuardCoiUploadSheet } from './GuardCoiUploadSheet';

interface GuardCoiItemCardProps {
  guard: SecurityGuard;
  editing?: boolean;
  staffMode?: boolean;
  onSave?: (policy: Partial<GuardInsurancePolicy> & { guardId: string }) => Promise<void>;
  onReview?: (status: 'verified' | 'rejected', rejectionReason?: string) => Promise<void>;
  onViewFull?: () => void;
  viewFullLabel?: string;
  onEditFullPage?: () => void;
}

export function GuardCoiItemCard({
  guard,
  editing = false,
  staffMode = false,
  onSave,
  onReview,
  onViewFull,
  viewFullLabel,
  onEditFullPage,
}: GuardCoiItemCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const hasOnFile = guardCoiOnFile(guard);
  const uploadStatus = getCoiUploadStatus(guard);
  const sectionStatus = getCoiSectionStatus(guard, staffMode);
  const coiEditable = guardCoiCanGuardEdit(guard);
  const canEdit = editing && !staffMode && !!onSave && coiEditable;
  const policy = guard.insurancePolicy;
  const docUrl = policy?.documentUrl?.trim();
  const title = policy?.carrier?.trim() || 'Certificate of Insurance (COI)';
  const subtitle = policy?.policyNumber?.trim()
    ? `#${policy.policyNumber.trim()}`
    : formatCoiSummaryLine(policy);

  const openDetail = () => {
    if (!hasOnFile && onEditFullPage) {
      onEditFullPage();
      return;
    }
    setShowDetail(true);
  };

  const openAdd = () => {
    if (onEditFullPage) {
      onEditFullPage();
      return;
    }
    if (hasOnFile) {
      openDetail();
      return;
    }
    setShowUpload(true);
  };

  const cardBody = hasOnFile ? (
    <div className="app-cert-item">
      <button
        type="button"
        onClick={openDetail}
        className={`app-cert-item-interactive app-cert-item-body min-w-0 flex-1 text-left${docUrl ? ' flex gap-3' : ''}`}
      >
        {docUrl && (
          <img
            src={docUrl}
            alt={`${guard.name} COI preview`}
            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-brand-border"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-snug break-words">{title}</p>
          <p className="text-xs text-brand-text-muted mt-1 break-words">{subtitle}</p>
          {policy?.rejectionReason && resolveInsuranceStatus(policy) === 'rejected' && (
            <p className="text-xs text-amber-500 mt-1.5 leading-snug">{policy.rejectionReason}</p>
          )}
          <p className="text-[10px] text-brand-primary mt-1">Tap to view details</p>
          {policy?.updateRequestNote && resolveInsuranceStatus(policy) === 'verified' && (
            <p className="text-xs text-amber-500 mt-1.5 leading-snug line-clamp-3">
              {policy.updateRequestNote}
            </p>
          )}
        </div>
      </button>
      <div className="app-cert-item-meta">
        <CoiCredentialStatusBadges guard={guard} />
      </div>
    </div>
  ) : null;

  const detailModal =
    showDetail && (onSave || onReview || staffMode || hasOnFile) ? (
      <GuardCoiDetailModal
        guard={guard}
        guardName={guard.name}
        canEdit={canEdit || staffMode}
        staffMode={staffMode}
        onSave={onSave}
        onReview={onReview}
        onViewFull={onViewFull}
        viewFullLabel={viewFullLabel}
        onEditFullPage={onEditFullPage}
        onClose={() => setShowDetail(false)}
      />
    ) : null;

  const uploadSheet =
    showUpload && onSave ? (
      <GuardCoiUploadSheet
        guard={guard}
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onSave={onSave}
        title={hasOnFile ? 'Update Certificate of Insurance' : 'Add Certificate of Insurance'}
      />
    ) : null;

  return (
    <section className="app-form-section space-y-3">
      <CredentialRowHeader
        rawTitle
        title={
          <p className="uber-label flex items-center gap-2 flex-wrap">
            <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0" />
            Certificate of Insurance (COI)
          </p>
        }
        subtitle={undefined}
        action={
          canEdit || staffMode ? (
            <CredentialRowAction
              staffMode={staffMode}
              uploadStatus={uploadStatus}
              sectionStatus={sectionStatus}
              canUpload={canEdit}
              onAdd={openAdd}
            />
          ) : undefined
        }
      />

      {hasOnFile ? (
        <div className="app-cert-item-stack border-t border-brand-border">{cardBody}</div>
      ) : (
        <p className="text-xs text-brand-text-muted py-3 border-t border-brand-border">
          No Certificate of Insurance on file.
        </p>
      )}

      {detailModal}
      {uploadSheet}
    </section>
  );
}
