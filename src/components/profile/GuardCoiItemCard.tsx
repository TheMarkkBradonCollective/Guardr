import React, { useState } from 'react';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import type { GuardInsurancePolicy, SecurityGuard } from '../../types';
import { getCoiSectionStatus } from '../../lib/credentialSectionStatus';
import {
  formatCoiSummaryLine,
  getCoiUploadStatus,
  guardCoiOnFile,
} from '../../lib/guardInsurance';
import {
  CredentialRowAction,
  CredentialRowHeader,
  CredentialSectionStatusDisplay,
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
}

export function GuardCoiItemCard({
  guard,
  editing = false,
  staffMode = false,
  onSave,
  onReview,
}: GuardCoiItemCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const hasOnFile = guardCoiOnFile(guard);
  const uploadStatus = getCoiUploadStatus(guard);
  const sectionStatus = getCoiSectionStatus(guard, staffMode);
  const canEdit = editing && !staffMode && !!onSave;
  const policy = guard.insurancePolicy;
  const docUrl = policy?.documentUrl?.trim();
  const docIsImage = docUrl && /\.(jpe?g|png|gif|webp)(\?|$)/i.test(docUrl);

  const cardBody = hasOnFile ? (
    <div className="app-cert-item">
      <button
        type="button"
        onClick={() => setShowDetail(true)}
        className={`app-cert-item-interactive app-cert-item-body min-w-0 flex-1 text-left${docUrl && docIsImage ? ' flex gap-3' : ''}`}
      >
        {docUrl && docIsImage && (
          <img
            src={docUrl}
            alt={`${guard.name} COI preview`}
            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-brand-border"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-brand-text-muted leading-snug">{formatCoiSummaryLine(policy)}</p>
          <p className="text-[10px] text-brand-primary mt-1">Tap to view details</p>
        </div>
      </button>
      <div className="app-cert-item-meta">
        <CoiCredentialStatusBadges guard={guard} />
        <button
          type="button"
          onClick={() => setShowDetail(true)}
          className="p-1 text-brand-text-muted hover:text-brand-text"
          aria-label="View COI details"
        >
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </div>
  ) : null;

  const detailModal =
    showDetail && (onSave || onReview || staffMode || hasOnFile) ? (
      <GuardCoiDetailModal
        guard={guard}
        canEdit={canEdit || staffMode}
        staffMode={staffMode}
        onSave={onSave}
        onReview={onReview}
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
        subtitle={
          <div className="mt-2">
            <CredentialSectionStatusDisplay status={sectionStatus} />
          </div>
        }
        action={
          canEdit || staffMode ? (
            <CredentialRowAction
              staffMode={staffMode}
              uploadStatus={uploadStatus}
              canUpload={canEdit}
              onAdd={() => (hasOnFile ? setShowDetail(true) : setShowUpload(true))}
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
