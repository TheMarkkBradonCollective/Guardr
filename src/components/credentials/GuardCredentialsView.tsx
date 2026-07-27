import React, { useMemo, useState } from 'react';
import { Certification, SecurityGuard } from '../../types';
import {
  CATALOG_CREDENTIAL_SECTION_IDS,
  CREDENTIAL_SECTION_ORDER,
  getCredentialSectionMeta,
  getGuardCredentialViewSections,
} from '../../lib/guardCredentialSections';
import { catalogIdsForCredentialSection } from '../../lib/guardCredentialCatalog';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import { credentialMatchesSearch } from '../../lib/credentialSearch';
import { getEligibleWeaponGear } from '../../lib/guardWeaponGear';
import { getClientVisibleListedEquipmentGear } from '../../lib/guardEquipmentGear';
import { WfSearchBar } from '../ui/wireframe';
import { GuardCredentialCatalogSectionBlock } from './GuardCredentialCatalogSectionBlock';
import { AppDashboardZone, AppItemCardStack } from '../ui/app/AppPrimitives';

interface GuardCredentialsViewProps {
  guard: SecurityGuard;
  guardName?: string;
  hideEmpty?: boolean;
  excludeRejected?: boolean;
  /** Client profile — only Guardr-verified credentials on file cards. */
  verifiedOnly?: boolean;
  showCategoryOnCards?: boolean;
  compact?: boolean;
  editing?: boolean;
  onDeleteCertification?: (certId: string) => void;
  onAttachCertificationImage?: (certId: string, imageUrl: string) => Promise<CertImageMutationResult>;
  renderCertActions?: (cert: Certification) => React.ReactNode;
  className?: string;
  showSearch?: boolean;
  /** Show every catalog slot with status — not only uploads on file. */
  showFullCatalog?: boolean;
}

function guardHasClientVisibleCarryGear(guard: SecurityGuard): boolean {
  const eligibleIds = new Set(getEligibleWeaponGear(guard).map((rule) => rule.id));
  const hasListedWeapon = (guard.listedWeaponGear ?? []).some((id) => eligibleIds.has(id));
  return hasListedWeapon || getClientVisibleListedEquipmentGear(guard).length > 0;
}

const CORE_READ_SECTION_IDS = CREDENTIAL_SECTION_ORDER.filter(
  (id) => id === 'guard-card' || id === 'bsis-pta-uof' || id === 'bsis-32-hour'
);

export function GuardCredentialsView({
  guard,
  guardName,
  hideEmpty = true,
  excludeRejected = true,
  verifiedOnly = false,
  showCategoryOnCards = false,
  compact = false,
  editing = false,
  onDeleteCertification,
  onAttachCertificationImage,
  renderCertActions,
  className = '',
  showSearch = true,
  showFullCatalog = true,
}: GuardCredentialsViewProps) {
  const [search, setSearch] = useState('');
  const displayName = guardName ?? guard.name;

  const coreSections = useMemo(
    () =>
      getGuardCredentialViewSections(guard, { hideEmpty: false, excludeRejected })
        .filter((section) => CORE_READ_SECTION_IDS.includes(section.id))
        .map((section) => ({
          ...section,
          certs: (verifiedOnly ? section.certs.filter((cert) => cert.status === 'verified') : section.certs).filter(
            (cert) => credentialMatchesSearch(cert, search)
          ),
        }))
        .filter((section) => {
          if (!hideEmpty || showFullCatalog) return true;
          return section.certs.length > 0;
        }),
    [guard, excludeRejected, verifiedOnly, search, hideEmpty, showFullCatalog]
  );

  const catalogSectionIds = useMemo(() => {
    return CATALOG_CREDENTIAL_SECTION_IDS.filter((sectionId) => {
      if (!hideEmpty || showFullCatalog) return true;
      const hasCerts = getGuardCredentialViewSections(guard, { hideEmpty: false, excludeRejected })
        .find((section) => section.id === sectionId)
        ?.certs.some((cert) => !verifiedOnly || cert.status === 'verified');
      if (hasCerts) return true;
      if (sectionId === 'bsis-permit' && guardHasClientVisibleCarryGear(guard)) return true;
      return false;
    });
  }, [guard, hideEmpty, showFullCatalog, excludeRejected, verifiedOnly]);

  const hasCatalogContent = catalogSectionIds.length > 0;
  const hasCoreContent = coreSections.some((section) => section.certs.length > 0);
  const hasAnyContent = hasCatalogContent || hasCoreContent || guardHasClientVisibleCarryGear(guard);

  if (!hasAnyContent && hideEmpty && !showFullCatalog) {
    return <p className="text-sm text-brand-text-muted px-5">No credentials on file.</p>;
  }

  return (
    <div className={`guard-credentials-view space-y-2 ${className}`.trim()}>
      {showSearch && (
        <WfSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search credentials..."
          className="max-w-md mx-5"
        />
      )}

      {coreSections.map((section) => {
        const catalogIds = catalogIdsForCredentialSection(section.id);
        if (showFullCatalog && catalogIds.length > 0) {
          return (
            <GuardCredentialCatalogSectionBlock
              key={section.id}
              sectionId={section.id}
              guard={guard}
              search={search}
              editing={editing}
              verifiedOnly={verifiedOnly}
              showFullCatalog
              showFullGearCatalog={false}
              renderCertRow={(cert) => (
                <div key={cert.id} className="app-cert-item-wrap">
                  <CertItemCard
                    cert={cert}
                    guardName={displayName}
                    compact={compact}
                    editing={editing}
                    showCategory={showCategoryOnCards}
                    onDelete={onDeleteCertification ? () => onDeleteCertification(cert.id) : undefined}
                    onAttachImage={
                      onAttachCertificationImage
                        ? (imageUrl) => onAttachCertificationImage(cert.id, imageUrl)
                        : undefined
                    }
                  />
                  {renderCertActions?.(cert)}
                </div>
              )}
            />
          );
        }

        if (section.certs.length === 0) return null;
        const meta = getCredentialSectionMeta(section.id);
        return (
          <AppDashboardZone
            key={section.id}
            title={`${meta.title} (${section.certs.length})`}
          >
            {meta.subtitle && (
              <p className="text-xs text-brand-text-muted mb-3 leading-relaxed -mt-1">{meta.subtitle}</p>
            )}
            <AppItemCardStack className="app-cert-item-stack !gap-0 !pt-0">
              {section.certs.map((cert) => (
                <div key={cert.id} className="app-cert-item-wrap">
                  <CertItemCard
                    cert={cert}
                    guardName={displayName}
                    compact={compact}
                    editing={editing}
                    showCategory={showCategoryOnCards}
                    onDelete={onDeleteCertification ? () => onDeleteCertification(cert.id) : undefined}
                    onAttachImage={
                      onAttachCertificationImage
                        ? (imageUrl) => onAttachCertificationImage(cert.id, imageUrl)
                        : undefined
                    }
                  />
                  {renderCertActions?.(cert)}
                </div>
              ))}
            </AppItemCardStack>
          </AppDashboardZone>
        );
      })}

      {catalogSectionIds.map((sectionId) => (
        <GuardCredentialCatalogSectionBlock
          key={sectionId}
          sectionId={sectionId}
          guard={guard}
          search={search}
          editing={editing}
          verifiedOnly={verifiedOnly}
          showFullCatalog={showFullCatalog}
          showFullGearCatalog
          renderCertRow={(cert) => (
            <div key={cert.id} className="app-cert-item-wrap">
              <CertItemCard
                cert={cert}
                guardName={displayName}
                compact={compact}
                editing={editing}
                showCategory={showCategoryOnCards}
                onDelete={onDeleteCertification ? () => onDeleteCertification(cert.id) : undefined}
                onAttachImage={
                  onAttachCertificationImage
                    ? (imageUrl) => onAttachCertificationImage(cert.id, imageUrl)
                    : undefined
                }
              />
              {renderCertActions?.(cert)}
            </div>
          )}
        />
      ))}

      {!hasCatalogContent && !hasCoreContent && showFullCatalog && (
        <p className="text-sm text-brand-text-muted px-5">No credentials match your search.</p>
      )}
    </div>
  );
}
