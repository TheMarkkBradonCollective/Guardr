import React, { useMemo, useState } from 'react';
import { Certification, SecurityGuard } from '../../types';
import { getGuardCredentialViewSections } from '../../lib/guardCredentialSections';
import { CertItemCard } from './CertItemCard';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import { credentialMatchesSearch } from '../../lib/credentialSearch';
import { AppDashboardZone, AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfSearchBar } from '../ui/wireframe';

interface GuardCredentialsViewProps {
  guard: SecurityGuard;
  guardName?: string;
  hideEmpty?: boolean;
  excludeRejected?: boolean;
  /** Client profile — only Guardr-verified credentials. */
  verifiedOnly?: boolean;
  showCategoryOnCards?: boolean;
  compact?: boolean;
  editing?: boolean;
  onDeleteCertification?: (certId: string) => void;
  onAttachCertificationImage?: (certId: string, imageUrl: string) => Promise<CertImageMutationResult>;
  renderCertActions?: (cert: Certification) => React.ReactNode;
  className?: string;
  showSearch?: boolean;
}

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
}: GuardCredentialsViewProps) {
  const [search, setSearch] = useState('');

  const sections = useMemo(
    () =>
      getGuardCredentialViewSections(guard, { hideEmpty, excludeRejected })
        .map((section) => ({
          ...section,
          certs: (verifiedOnly ? section.certs.filter((cert) => cert.status === 'verified') : section.certs).filter(
            (cert) => credentialMatchesSearch(cert, search)
          ),
        }))
        .filter((section) => !hideEmpty || section.certs.length > 0),
    [guard, hideEmpty, excludeRejected, verifiedOnly, search]
  );

  const displayName = guardName ?? guard.name;
  const totalCerts = useMemo(
    () =>
      getGuardCredentialViewSections(guard, { hideEmpty, excludeRejected }).reduce(
        (count, section) =>
          count +
          (verifiedOnly ? section.certs.filter((cert) => cert.status === 'verified') : section.certs).length,
        0
      ),
    [guard, hideEmpty, excludeRejected, verifiedOnly]
  );

  if (totalCerts === 0) {
    return <p className="text-sm text-brand-text-muted px-5">No credentials on file.</p>;
  }

  return (
    <div className={`guard-credentials-view space-y-2 ${className}`.trim()}>
      {showSearch && totalCerts > 0 && (
        <WfSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search credentials..."
          className="max-w-md mx-5"
        />
      )}

      {sections.length === 0 ? (
        <p className="text-sm text-brand-text-muted px-5">No credentials match your search.</p>
      ) : (
        sections.map((section) => (
          <AppDashboardZone
            key={section.id}
            title={section.certs.length > 0 ? `${section.title} (${section.certs.length})` : section.title}
          >
            {section.subtitle && (
              <p className="text-xs text-brand-text-muted mb-3 leading-relaxed -mt-1">{section.subtitle}</p>
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
        ))
      )}
    </div>
  );
}
