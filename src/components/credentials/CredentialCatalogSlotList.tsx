import React from 'react';
import type { Certification, SecurityGuard } from '../../types';
import type { CredentialCatalogSlot } from '../../lib/guardCredentialCatalog';
import { CertItemCard } from './CertItemCard';
import { CredentialRowAction, CredentialRowHeader } from './CredentialStatusLabels';
import { findRejectedCertForCatalog, guardHasRejectedCertForCatalog } from '../../lib/certResubmit';

export interface CredentialCatalogSlotView extends CredentialCatalogSlot {
  alternateUpload?: {
    catalogId: string;
    label: string;
    showWhen: boolean;
  };
}

interface CredentialCatalogSlotListProps {
  guard: SecurityGuard;
  slots: CredentialCatalogSlotView[];
  staffMode?: boolean;
  canUpload?: boolean;
  editing?: boolean;
  compact?: boolean;
  onAdd?: (catalogId: string) => void;
  onEditCert?: (cert: Certification) => void;
  renderCertRow?: (cert: Certification) => React.ReactNode;
  certCardProps?: (cert: Certification) => Record<string, unknown>;
}

export function CredentialCatalogSlotList({
  guard,
  slots,
  staffMode = false,
  canUpload = false,
  editing = false,
  compact = false,
  onAdd,
  onEditCert,
  renderCertRow,
  certCardProps,
}: CredentialCatalogSlotListProps) {
  const defaultRenderCertRow = (cert: Certification) => (
    <div key={cert.id} className="space-y-2">
      <CertItemCard
        cert={cert}
        editing={editing}
        compact={compact}
        showCategory={false}
        {...(certCardProps?.(cert) ?? {})}
      />
    </div>
  );

  const renderRow = renderCertRow ?? defaultRenderCertRow;

  return (
    <div className="app-list-subrows">
      {slots.map((slot) => (
        <div key={slot.catalogId} className="app-list-subrow space-y-2">
          <CredentialRowHeader
            title={slot.entry.name}
            subtitle={slot.entry.description}
            titleMuted={slot.certs.length === 0}
            action={
              <CredentialRowAction
                staffMode={staffMode}
                uploadStatus={slot.uploadStatus}
                canUpload={canUpload}
                editMode={guardHasRejectedCertForCatalog(guard, slot.catalogId)}
                onEdit={() => {
                  const rejected = findRejectedCertForCatalog(guard, slot.catalogId);
                  if (rejected && onEditCert) onEditCert(rejected);
                }}
                onAdd={() => onAdd?.(slot.catalogId)}
              />
            }
          />

          {slot.certs.length > 0 && (
            <div className="app-cert-item-stack !pt-0">
              {slot.certs.map((cert) => renderRow(cert))}
            </div>
          )}

          {canUpload && slot.alternateUpload?.showWhen && (
            <button
              type="button"
              onClick={() => onAdd?.(slot.alternateUpload!.catalogId)}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-text-muted hover:text-brand-text"
            >
              {slot.alternateUpload.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
