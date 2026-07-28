import React, { useMemo, useState } from 'react';
import { Certification, SecurityGuard } from '../../types';
import {
  CATALOG_SECTIONS_AFTER_WEAPONS,
  CATALOG_SECTIONS_BEFORE_WEAPONS,
  type CredentialViewSectionId,
  getCredentialSectionMeta,
  getGuardCredentialViewSections,
} from '../../lib/guardCredentialSections';
import { catalogIdsForCredentialSection } from '../../lib/guardCredentialCatalog';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import { credentialMatchesSearch } from '../../lib/credentialSearch';
import { WEAPON_GEAR_CREDENTIAL_SECTION_ORDER } from '../../lib/guardWeaponGear';
import { WfSearchBar } from '../ui/wireframe';
import { GuardCredentialCatalogSectionBlock } from './GuardCredentialCatalogSectionBlock';
import {
  GuardWeaponGearCredentialSection,
} from './GuardWeaponGearCredentialSection';
import { AppDashboardZone, AppItemCardStack } from '../ui/app/AppPrimitives';
import { CertItemCard } from './CertItemCard';

interface GuardCredentialsViewProps {
  guard: SecurityGuard;
  guardName?: string;
  hideEmpty?: boolean;
  excludeRejected?: boolean;
  verifiedOnly?: boolean;
  showCategoryOnCards?: boolean;
  compact?: boolean;
  editing?: boolean;
  onDeleteCertification?: (certId: string) => void;
  onAttachCertificationImage?: (certId: string, imageUrl: string) => Promise<CertImageMutationResult>;
  renderCertActions?: (cert: Certification) => React.ReactNode;
  className?: string;
  showSearch?: boolean;
  showFullCatalog?: boolean;
}

const CORE_READ_SECTION_IDS: CredentialViewSectionId[] = [
  'guard-card',
  'bsis-pta-uof',
  'bsis-32-hour',
];

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

  const renderCertRow = (cert: Certification) => (
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
  );

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
        .filter((section) => !hideEmpty || showFullCatalog || section.certs.length > 0),
    [guard, excludeRejected, verifiedOnly, search, hideEmpty, showFullCatalog]
  );

  const catalogBeforeWeapons = useMemo(() => {
    if (!hideEmpty || showFullCatalog) return CATALOG_SECTIONS_BEFORE_WEAPONS;
    return CATALOG_SECTIONS_BEFORE_WEAPONS.filter((sectionId) =>
      getGuardCredentialViewSections(guard, { hideEmpty: false, excludeRejected })
        .find((section) => section.id === sectionId)
        ?.certs.some((cert) => !verifiedOnly || cert.status === 'verified')
    );
  }, [guard, hideEmpty, showFullCatalog, excludeRejected, verifiedOnly]);

  const catalogAfterWeapons = useMemo(() => {
    if (!hideEmpty || showFullCatalog) return CATALOG_SECTIONS_AFTER_WEAPONS;
    return CATALOG_SECTIONS_AFTER_WEAPONS.filter((sectionId) =>
      getGuardCredentialViewSections(guard, { hideEmpty: false, excludeRejected })
        .find((section) => section.id === sectionId)
        ?.certs.some((cert) => !verifiedOnly || cert.status === 'verified')
    );
  }, [guard, hideEmpty, showFullCatalog, excludeRejected, verifiedOnly]);

  const showWeapons = showFullCatalog || !hideEmpty;
  const hasCoreContent = coreSections.some((section) => section.certs.length > 0);
  const hasAnyContent =
    hasCoreContent ||
    showWeapons ||
    catalogBeforeWeapons.length > 0 ||
    catalogAfterWeapons.length > 0;

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
              renderCertRow={renderCertRow}
            />
          );
        }

        if (section.certs.length === 0) return null;
        const meta = getCredentialSectionMeta(section.id);
        return (
          <AppDashboardZone key={section.id} title={`${meta.title} (${section.certs.length})`}>
            {meta.subtitle && (
              <p className="text-xs text-brand-text-muted mb-3 leading-relaxed -mt-1">{meta.subtitle}</p>
            )}
            <AppItemCardStack className="app-cert-item-stack !gap-0 !pt-0">
              {section.certs.map((cert) => renderCertRow(cert))}
            </AppItemCardStack>
          </AppDashboardZone>
        );
      })}

      {catalogBeforeWeapons.map((sectionId) => (
        <GuardCredentialCatalogSectionBlock
          key={sectionId}
          sectionId={sectionId}
          guard={guard}
          search={search}
          editing={editing}
          verifiedOnly={verifiedOnly}
          showFullCatalog={showFullCatalog}
          renderCertRow={renderCertRow}
        />
      ))}

      {showWeapons &&
        WEAPON_GEAR_CREDENTIAL_SECTION_ORDER.map((weaponId) => (
          <GuardWeaponGearCredentialSection
            key={weaponId}
            variant="credentials"
            weaponId={weaponId}
            guard={guard}
            search={search}
            editing={editing}
            verifiedOnly={verifiedOnly}
            showFullCatalog={showFullCatalog}
            renderCertRow={renderCertRow}
          />
        ))}

      {catalogAfterWeapons.map((sectionId) => (
        <GuardCredentialCatalogSectionBlock
          key={sectionId}
          sectionId={sectionId}
          guard={guard}
          search={search}
          editing={editing}
          verifiedOnly={verifiedOnly}
          showFullCatalog={showFullCatalog}
          renderCertRow={renderCertRow}
        />
      ))}
    </div>
  );
}
