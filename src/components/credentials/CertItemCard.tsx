import React, { useState } from 'react';
import { ChevronRight, Lock, Trash2 } from 'lucide-react';
import { Certification } from '../../types';
import { getCertCatalogEntry } from '../../lib/certCatalog';
import { guardCanAttachCertImage, guardCanDeleteCertification } from '../../lib/certImagePolicy';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import { isCertExpired } from '../../lib/certStatus';
import { formatStateName } from '../../lib/states';
import { CredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { CertDetailModal } from './CertDetailModal';
import { CertImageAttachButton } from './CertImageAttachButton';

interface CertItemCardProps {
  cert: Certification;
  editing?: boolean;
  onDelete?: () => void;
  onAttachImage?: (imageUrl: string) => Promise<CertImageMutationResult> | CertImageMutationResult;
  showUploadBadge?: boolean;
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
  compact = false,
  guardName,
}: CertItemCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const entry = cert.catalogId ? getCertCatalogEntry(cert.catalogId) : undefined;
  const canDelete = editing && onDelete && guardCanDeleteCertification(cert);
  const canAttachImage = editing && onAttachImage && guardCanAttachCertImage(cert);

  return (
    <>
      <div className={`app-cert-item ${compact ? 'app-cert-item-compact' : ''}`}>
        <button
          type="button"
          onClick={() => setShowDetail(true)}
          className="app-cert-item-interactive app-cert-item-body min-w-0 flex gap-3 flex-1 text-left"
        >
          {cert.imageUrl && !compact && (
            <img
              src={cert.imageUrl}
              alt=""
              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-brand-border"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm leading-snug">{entry?.name ?? cert.name}</p>
            <p className="text-xs text-brand-text-muted mt-1">
              {cert.state ? `${formatStateName(cert.state)} · ` : ''}
              {cert.issuer} · #{cert.number}
            </p>
            {cert.expiryDate && (
              <p className={`text-xs mt-0.5 ${isCertExpired(cert) ? 'text-amber-600' : 'text-brand-text-muted'}`}>
                {isCertExpired(cert) ? `Expired ${cert.expiryDate}` : `Expires ${cert.expiryDate}`}
              </p>
            )}
            {cert.imageUrl && compact && (
              <p className="text-[10px] text-brand-primary mt-1">Tap to view photo</p>
            )}
            {!cert.imageUrl && !compact && editing && (
              <p className="text-[10px] text-brand-text-muted mt-1">No photo on file</p>
            )}
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
