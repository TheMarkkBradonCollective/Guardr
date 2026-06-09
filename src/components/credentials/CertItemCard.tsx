import React from 'react';
import { Trash2 } from 'lucide-react';
import { Certification } from '../../types';
import { getCertCatalogEntry } from '../../lib/certCatalog';
import { isCertExpired } from '../../lib/certStatus';
import { formatStateName } from '../../lib/states';
import { CredentialStatusBadges } from '../guard/CredentialStatusBadge';

interface CertItemCardProps {
  cert: Certification;
  editing?: boolean;
  onDelete?: () => void;
  showUploadBadge?: boolean;
  compact?: boolean;
}

/** Individual license or certificate — the only UI element that uses a card surface. */
export function CertItemCard({
  cert,
  editing = false,
  onDelete,
  showUploadBadge = true,
  compact = false,
}: CertItemCardProps) {
  const entry = cert.catalogId ? getCertCatalogEntry(cert.catalogId) : undefined;

  return (
    <div className={`app-cert-item ${compact ? 'app-cert-item-compact' : ''}`}>
      <div className="min-w-0 flex gap-3 flex-1">
        {cert.imageUrl && !compact && (
          <img
            src={cert.imageUrl}
            alt={`${cert.name} document`}
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
        )}
        <div className="min-w-0">
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
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <CredentialStatusBadges cert={cert} showUpload={showUploadBadge} />
        {editing && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-red-500 flex items-center gap-1 hover:underline"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
