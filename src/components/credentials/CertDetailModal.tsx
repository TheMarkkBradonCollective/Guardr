import React from 'react';
import { X, ImageOff } from 'lucide-react';
import { Certification } from '../../types';
import { certDisplayName, getCertCatalogEntry, resolveCertCatalogId } from '../../lib/certCatalog';
import { certCategoryLabel, certViewSectionLabel } from '../../lib/guardCredentialSections';
import { isCertExpired } from '../../lib/certStatus';
import { formatStateName } from '../../lib/states';
import { CredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { AppModal } from '../ui/motion/AppMotion';
import { CredentialCategoryBadge } from './CredentialCategoryBadge';

interface CertDetailModalProps {
  cert: Certification;
  onClose: () => void;
  guardName?: string;
}

function formatDisplayDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function CertDetailModal({ cert, onClose, guardName }: CertDetailModalProps) {
  const catalogId = resolveCertCatalogId(cert);
  const entry = catalogId ? getCertCatalogEntry(catalogId) : undefined;
  const title = certDisplayName(cert);
  const sectionLabel = certViewSectionLabel(cert);
  const categoryLabel = certCategoryLabel(cert);

  return (
    <AppModal open onClose={onClose} ariaLabelledBy="cert-detail-title">
      <div className="flex items-start justify-between gap-3 p-5 border-b border-brand-border">
        <div className="min-w-0">
          {guardName && <p className="text-xs text-brand-text-muted mb-1">{guardName}</p>}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <CredentialCategoryBadge cert={cert} />
            {sectionLabel !== categoryLabel && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-brand-text-muted">
                {categoryLabel}
              </span>
            )}
          </div>
          <h2 id="cert-detail-title" className="font-bold text-lg leading-snug">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-2 rounded-lg text-brand-text-muted hover:text-brand-text hover:bg-brand-border/20"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {cert.imageUrl ? (
          <img
            src={cert.imageUrl}
            alt={`${title} document`}
            className="w-full max-h-[min(52vh,28rem)] object-contain rounded-xl border border-brand-border bg-brand-bg-sec"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-12 rounded-xl border border-dashed border-brand-border bg-brand-bg-sec text-brand-text-muted">
            <ImageOff className="w-8 h-8 opacity-50" />
            <p className="text-sm">No photo uploaded for this credential</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <CredentialStatusBadges cert={cert} />
        </div>

        {cert.status === 'rejected' && cert.rejectionReason && (
          <p className="text-sm text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2 leading-relaxed">
            {cert.rejectionReason}
          </p>
        )}

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-brand-text-muted">Category</dt>
            <dd className="font-medium mt-0.5">{sectionLabel}</dd>
          </div>
          <div>
            <dt className="text-xs text-brand-text-muted">Credential group</dt>
            <dd className="font-medium mt-0.5">{categoryLabel}</dd>
          </div>
          <div>
            <dt className="text-xs text-brand-text-muted">Issuing organization</dt>
            <dd className="font-medium mt-0.5">{cert.issuer || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-brand-text-muted">License / cert number</dt>
            <dd className="font-medium mt-0.5 font-mono text-[0.8125rem]">{cert.number || '—'}</dd>
          </div>
          {cert.state && (
            <div>
              <dt className="text-xs text-brand-text-muted">State</dt>
              <dd className="font-medium mt-0.5">{formatStateName(cert.state)}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-brand-text-muted">Expiry date</dt>
            <dd className={`font-medium mt-0.5 ${isCertExpired(cert) ? 'text-amber-500' : ''}`}>
              {cert.expiryDate ? formatDisplayDate(cert.expiryDate) : '—'}
              {isCertExpired(cert) ? ' (expired)' : ''}
            </dd>
          </div>
        </dl>

        {entry?.description && (
          <p className="text-xs text-brand-text-muted leading-relaxed border-t border-brand-border pt-4">
            {entry.description}
          </p>
        )}
      </div>
    </AppModal>
  );
}
