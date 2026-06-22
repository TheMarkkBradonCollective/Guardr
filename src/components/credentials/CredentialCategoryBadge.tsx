import React from 'react';
import { Certification } from '../../types';
import { certCategoryLabel, certViewSectionLabel, resolveCertCategory } from '../../lib/guardCredentialSections';

interface CredentialCategoryBadgeProps {
  cert: Certification;
  /** Show subsection title (e.g. PTA/UOF) instead of top-level category */
  variant?: 'section' | 'category';
  className?: string;
}

export function CredentialCategoryBadge({
  cert,
  variant = 'section',
  className = '',
}: CredentialCategoryBadgeProps) {
  const label = variant === 'category' ? certCategoryLabel(cert) : certViewSectionLabel(cert);
  const category = resolveCertCategory(cert);

  return (
    <span
      className={`credential-category-badge inline-flex items-center max-w-full text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border credential-category-${category} ${className}`.trim()}
      title={certCategoryLabel(cert)}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}
