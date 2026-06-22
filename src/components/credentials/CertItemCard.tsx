import React, { useState } from 'react';
import { Award, ChevronRight, Lock, Trash2 } from 'lucide-react';
import { Certification } from '../../types';
import { certDisplayName } from '../../lib/certCatalog';
import { guardCanAttachCertImage, guardCanDeleteCertification } from '../../lib/certImagePolicy';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import { isCertExpired } from '../../lib/certStatus';
import { formatStateName } from '../../lib/states';
import { CredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { CertDetailModal } from './CertDetailModal';
import { CertImageAttachButton } from './CertImageAttachButton';
import { CredentialCategoryBadge } from './CredentialCategoryBadge';

interface CertItemCardProps {
  cert: Certification;
  editing?: boolean;
  onDelete?: () => void;
  onAttachImage?: (imageUrl: string) => Promise<CertImageMutationResult> | CertImageMutationResult;
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
  showUploadBadge = true,
  showCategory = true,
  compact = false,
  guardName,
}: CertItemCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const title = certDisplayName(cert);
  const canDelete = editing && onDelete && guardCanDeleteCertification(cert);
  const canAttachImage = editing && onAttachImage && guardCanAttachCertImage(cert);
  const thumbClass = compact
    ? 'w-12 h-12 rounded-xl object-cover shrink-0 border border-brand-border'
    : 'w-14 h-14 rounded-xl object-cover shrink-0 border border-brand-border';
  const placeholderClass = compact
    ? 'w-12 h-12 rounded-xl border border-dashed border-brand-border bg-brand-bg-sec flex items-center justify-center shrink-0'
    : 'w-14 h-14 rounded-xl border border-dashed border-brand-border bg-brand-bg-sec flex items-center justify-center shrink-0';

  return (
    <>
      <div className={`app-cert-item ${compact ? 'app-cert-item-compact' : ''}`}>
        <button
          type="button"
          onClick={() => setShowDetail(true)}
          className="app-cert-item-interactive app-cert-item-body min-w-0 flex gap-3 flex-1 text-left"
        >
          {cert.imageUrl ? (
            <img src={cert.imageUrl} alt="" className={thumbClass} />
          ) : (
            <div className={placeholderClass} aria-hidden>
              <Award className="w-5 h-5 text-brand-text-muted" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            {showCategory && (
              <div className="mb-1.5">
                <CredentialCategoryBadge cert={cert} />
              </div>
            )}
            <p className="font-semibold text-sm leading-snug">{title}</p>
            <p className="text-xs text-brand-text-muted mt-1">
              {cert.state ? `${formatStateName(cert.state)} · ` : ''}
              {cert.issuer} · #{cert.number}
            </p>
            {cert.expiryDate && (
              <p className={`text-xs mt-0.5 ${isCertExpired(cert) ? 'text-amber-600' : 'text-brand-text-muted'}`}>
                {isCertExpired(cert) ? `Expired ${cert.expiryDate}` : `Expires ${cert.expiryDate}`}
              </p>
            )}
            {cert.status === 'rejected' && cert.rejectionReason && (
              <p className="text-xs text-amber-500 mt-1.5 leading-snug">{cert.rejectionReason}</p>
            )}
            <p className="text-[10px] text-brand-primary mt-1">
              {cert.imageUrl ? 'Tap to view details' : editing ? 'Tap to view · add photo' : 'Tap to view details'}
            </p>
          </div>
        </button>
        <div className="app-cert-item-meta">
          {canAttachImage && <CertImageAttachButton compact onAttach={onAttachImage} />}
          <CredentialStatusBadges cert={cert} showUpload={showUploadBadge} />
          {cert.imageUrl && editing && (
            <span className="inline-flex items-center gap-1 text-[10px] text-brand-text-muted" title="Photo locked">
              <Lock className="w-3 h-3" />
              Photo locked
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
          ) : !editing ? (
            <button
              type="button"
              onClick={() => setShowDetail(true)}
              className="p-1 text-brand-text-muted hover:text-brand-text"
              aria-label="View credential details"
            >
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          ) : null}
        </div>
      </div>

      {showDetail && (
        <CertDetailModal cert={cert} guardName={guardName} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}
