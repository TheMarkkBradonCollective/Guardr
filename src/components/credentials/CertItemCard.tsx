import React, { useState } from 'react';
import { ChevronRight, Trash2 } from 'lucide-react';
import { Certification } from '../../types';
import { getCertCatalogEntry } from '../../lib/certCatalog';
import { isCertExpired } from '../../lib/certStatus';
import { formatStateName } from '../../lib/states';
import { CredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { CertDetailModal } from './CertDetailModal';

interface CertItemCardProps {
  cert: Certification;
  editing?: boolean;
  onDelete?: () => void;
  showUploadBadge?: boolean;
  compact?: boolean;
  guardName?: string;
}

/** Individual license or certificate — clickable to view full details and document photo. */
export function CertItemCard({
  cert,
  editing = false,
  onDelete,
  showUploadBadge = true,
  compact = false,
  guardName,
}: CertItemCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const entry = cert.catalogId ? getCertCatalogEntry(cert.catalogId) : undefined;

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
          </div>
        </button>
        <div className="app-cert-item-meta">
          <CredentialStatusBadges cert={cert} showUpload={showUploadBadge} />
          {editing && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-red-500 flex items-center gap-1 hover:underline"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowDetail(true)}
              className="p-1 text-brand-text-muted hover:text-brand-text"
              aria-label="View credential details"
            >
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          )}
        </div>
      </div>

      {showDetail && (
        <CertDetailModal cert={cert} guardName={guardName} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}
