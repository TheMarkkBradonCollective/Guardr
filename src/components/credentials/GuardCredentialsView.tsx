import React from 'react';
import { Certification, SecurityGuard } from '../../types';
import { getGuardCredentialViewSections } from '../../lib/guardCredentialSections';
import { CertItemCard } from './CertItemCard';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import { AppDashboardZone, AppItemCardStack } from '../ui/app/AppPrimitives';

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
}: GuardCredentialsViewProps) {
  const sections = getGuardCredentialViewSections(guard, { hideEmpty, excludeRejected }).map((section) => ({
    ...section,
    certs: verifiedOnly ? section.certs.filter((cert) => cert.status === 'verified') : section.certs,
  })).filter((section) => !hideEmpty || section.certs.length > 0);
  const displayName = guardName ?? guard.name;

  if (sections.length === 0) {
    return <p className="text-sm text-brand-text-muted px-5">No credentials on file.</p>;
  }

  return (
    <div className={`guard-credentials-view space-y-2 ${className}`.trim()}>
      {sections.map((section) => (
        <AppDashboardZone
          key={section.id}
          title={section.certs.length > 0 ? `${section.title} (${section.certs.length})` : section.title}
        >
          {section.subtitle && (
            <p className="text-xs text-brand-text-muted mb-3 leading-relaxed -mt-1">{section.subtitle}</p>
          )}
          <AppItemCardStack className="app-cert-item-stack !gap-0 !pt-0">
            {section.certs.length > 0 ? (
              section.certs.map((cert) => (
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
              ))
            ) : (
              <p className="text-xs text-brand-text-muted py-2">Nothing on file yet.</p>
            )}
          </AppItemCardStack>
        </AppDashboardZone>
      ))}
    </div>
  );
}
