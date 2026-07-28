import React from 'react';
import type { Certification, SecurityGuard } from '../../types';
import type { CertCategory } from '../../lib/certCatalog';
import {
  buildCredentialCatalogSlots,
  catalogIdsForCredentialSection,
  shouldShowCredentialSectionInPanel,
} from '../../lib/guardCredentialCatalog';
import type { CredentialViewSectionId } from '../../lib/guardCredentialSections';
import { getCredentialSectionMeta } from '../../lib/guardCredentialSections';
import { CredentialCatalogSlotList } from './CredentialCatalogSlotList';
import { CredentialRowAction, CredentialRowHeader } from './CredentialStatusLabels';
import { getCourseUploadStatus } from '../../lib/certStatus';
import { Award, BookOpen, Shield } from 'lucide-react';

const SECTION_ICONS: Partial<Record<CredentialViewSectionId, typeof Shield>> = {
  'bsis-refresher': BookOpen,
  'bsis-other-training': BookOpen,
  medical: Award,
  fema: Award,
  'security-advanced': Award,
  industry: Award,
};

interface GuardCredentialCatalogSectionBlockProps {
  sectionId: CredentialViewSectionId;
  guard: SecurityGuard;
  search?: string;
  staffMode?: boolean;
  canUpload?: boolean;
  editing?: boolean;
  verifiedOnly?: boolean;
  showFullCatalog?: boolean;
  onAdd?: (catalogId: string, sectionId: CredentialViewSectionId) => void;
  onEditCert?: (cert: Certification) => void;
  renderCertRow?: (cert: Certification) => React.ReactNode;
  certCardProps?: (cert: Certification) => Record<string, unknown>;
  groupedCerts?: Partial<Record<CertCategory, Certification[]>>;
}

export function GuardCredentialCatalogSectionBlock({
  sectionId,
  guard,
  search = '',
  staffMode = false,
  canUpload = false,
  editing = false,
  verifiedOnly = false,
  showFullCatalog = true,
  onAdd,
  onEditCert,
  renderCertRow,
  certCardProps,
  groupedCerts,
}: GuardCredentialCatalogSectionBlockProps) {
  const meta = getCredentialSectionMeta(sectionId);
  const catalogIds = catalogIdsForCredentialSection(sectionId);
  const slots = buildCredentialCatalogSlots(guard, catalogIds, {
    search,
    verifiedOnly,
    excludeRejected: true,
  });
  const searchActive = Boolean(search.trim());

  if (
    !shouldShowCredentialSectionInPanel(sectionId, {
      searchActive,
      matchingSlotCount: slots.length,
      showFullCatalog,
    })
  ) {
    return null;
  }

  const Icon = SECTION_ICONS[sectionId] ?? Award;
  const sectionCerts = groupedCerts?.[meta.category] ?? [];
  const firstCatalogId = catalogIds[0] ?? '';

  return (
    <section className="app-form-section space-y-3 pb-4 border-b border-brand-border">
      <CredentialRowHeader
        rawTitle
        title={
          <p className="uber-label flex items-center gap-2 flex-wrap">
            <Icon className="w-4 h-4 text-brand-primary shrink-0" />
            {meta.title}
          </p>
        }
        subtitle={
          meta.subtitle ? (
            <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">{meta.subtitle}</p>
          ) : undefined
        }
        action={
          canUpload && catalogIds.length > 0 ? (
            <CredentialRowAction
              staffMode={staffMode}
              uploadStatus={
                sectionCerts.length > 0 ? 'on-file' : getCourseUploadStatus(guard, firstCatalogId)
              }
              canUpload={canUpload}
              onAdd={() => onAdd?.(firstCatalogId, sectionId)}
            />
          ) : undefined
        }
      />

      <div className="border-t border-brand-border pt-3">
        <CredentialCatalogSlotList
          guard={guard}
          slots={slots}
          staffMode={staffMode}
          canUpload={canUpload}
          editing={editing}
          onAdd={(catalogId) => onAdd?.(catalogId, sectionId)}
          onEditCert={onEditCert}
          renderCertRow={renderCertRow}
          certCardProps={certCardProps}
        />
      </div>
    </section>
  );
}
