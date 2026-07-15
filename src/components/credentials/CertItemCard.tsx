import React, { useState } from 'react';
import { Lock, Trash2 } from 'lucide-react';
import { Certification } from '../../types';
import { certDisplayName } from '../../lib/certCatalog';
import { guardCanAttachCertImage, guardCanDeleteCertification, guardCertificationCanEdit } from '../../lib/certImagePolicy';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import { formatStateName } from '../../lib/states';
import { CredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { CertDetailModal, type CertUpdatePayload, type CertUpdateResult } from './CertDetailModal';
import { CertImageAttachButton } from './CertImageAttachButton';
import { CredentialCategoryBadge } from './CredentialCategoryBadge';

function certHasDetailsOnFile(cert: Certification): boolean {
  return Boolean(cert.issuer?.trim() || cert.number?.trim() || cert.imageUrl?.trim());
}

interface CertItemCardProps {
  cert: Certification;
  editing?: boolean;
  onDelete?: () => void;
  onAttachImage?: (imageUrl: string) => Promise<CertImageMutationResult> | CertImageMutationResult;
  canEdit?: boolean;
  staffMode?: boolean;
  onUpdate?: (payload: CertUpdatePayload) => Promise<CertUpdateResult>;
  showUploadBadge?: boolean;
  showCategory?: boolean;
  compact?: boolean;
  guardName?: string;
}

/** Individual license or certificate — clickable to view full details and document photo. */
export function CertItemCard({
  cert,
  editing = false,
  onDelete,
  onAttachImage,
  canEdit = false,
  staffMode = false,
  onUpdate,
  showUploadBadge = true,
  showCategory = true,
  compact = false,
  guardName,
}: CertItemCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const title = certDisplayName(cert);
  const canEditCert = canEdit || staffMode || guardCertificationCanEdit(cert);
  const useModalEdit = Boolean(onUpdate);
  const openInEditMode = useModalEdit && canEditCert && !certHasDetailsOnFile(cert);
  const canDelete = editing && onDelete && guardCanDeleteCertification(cert) && !useModalEdit;
  const canAttachImage =
    editing &&
    onAttachImage &&
    guardCanAttachCertImage(cert) &&
    (!useModalEdit || !cert.imageUrl?.trim() || cert.status === 'rejected');
  const thumbClass = compact
    ? 'w-11 h-11 rounded-lg object-cover shrink-0 border border-brand-border bg-brand-bg-sec'
    : 'w-14 h-14 rounded-xl object-cover shrink-0 border border-brand-border bg-brand-bg-sec';

  return (
    <>
      <div className={`app-cert-item ${compact ? 'app-cert-item-compact' : ''}`}>
        <button
          type="button"
          onClick={() => setShowDetail(true)}
          className={`app-cert-item-interactive app-cert-item-body min-w-0 flex-1 text-left flex items-start gap-3`}
        >
          {cert.imageUrl ? (
            <img src={cert.imageUrl} alt={`${title} credential preview`} className={thumbClass} />
          ) : (
            <div
              className={`${thumbClass} flex items-center justify-center text-brand-text-muted`}
              aria-hidden
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-60">No photo</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-semibold text-sm leading-snug break-words">{title}</p>
              <div className="shrink-0">
                <CredentialStatusBadges cert={cert} showUpload={showUploadBadge} staffMode={staffMode} />
              </div>
            </div>
            {showCategory && (
              <div className="mt-1">
                <CredentialCategoryBadge cert={cert} />
              </div>
            )}
            <p className="text-xs text-brand-text-muted mt-1 break-words line-clamp-2">
              {cert.state ? `${formatStateName(cert.state)} · ` : ''}
              {cert.issuer} · #{cert.number}
            </p>
            {cert.status === 'rejected' && cert.rejectionReason && (
              <p className="text-xs text-amber-500 mt-1.5 leading-snug">{cert.rejectionReason}</p>
            )}
          </div>
        </button>
        <div className="app-cert-item-meta">
          {canAttachImage && <CertImageAttachButton compact onAttach={onAttachImage} />}
          {cert.imageUrl && editing && !useModalEdit && cert.status !== 'rejected' && (
            <span className="inline-flex items-center gap-1 text-[10px] text-brand-text-muted" title="Photo locked">
              <Lock className="w-3 h-3" />
              Locked
            </span>
          )}
          {canDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-red-500 flex items-center gap-1 hover:underline"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          ) : null}
        </div>
      </div>

      {showDetail && (
        <CertDetailModal
          cert={cert}
          guardName={guardName}
          canEdit={canEditCert && !!onUpdate}
          staffMode={staffMode}
          initialEditMode={openInEditMode}
          onSubmit={onUpdate}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}
