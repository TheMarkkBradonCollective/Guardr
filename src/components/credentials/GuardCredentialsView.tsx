import React from 'react';
import { Certification, SecurityGuard } from '../../types';
import { getGuardCredentialViewSections } from '../../lib/guardCredentialSections';
import { CertItemCard } from './CertItemCard';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import { Award, BookOpen, Shield } from 'lucide-react';

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

function sectionIcon(sectionId: string) {
  if (sectionId === 'guard-card') return Shield;
  if (sectionId.startsWith('bsis-')) return BookOpen;
  return Award;
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
    return <p className="text-sm text-brand-text-muted">No credentials on file.</p>;
  }

  return (
    <div className={`guard-credentials-view ${className}`.trim()}>
      {sections.map((section) => {
        const Icon = sectionIcon(section.id);
        return (
          <section key={section.id} className="credential-view-section">
            <div className="credential-view-section-header">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand-primary" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <h3>{section.title}</h3>
                  {section.subtitle && (
                    <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">{section.subtitle}</p>
                  )}
                </div>
              </div>
              <span className="credential-view-section-count">{section.certs.length}</span>
            </div>
            <div className="app-cert-item-stack !pt-0 !gap-2">
              {section.certs.length > 0 ? (
                section.certs.map((cert) => (
                  <div key={cert.id} className="space-y-2">
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
            </div>
          </section>
        );
      })}
    </div>
  );
}
