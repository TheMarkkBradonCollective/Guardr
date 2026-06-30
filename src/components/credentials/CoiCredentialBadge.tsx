import React from 'react';
import { CERT_CATEGORY_LABELS } from '../../lib/certCatalog';
import { coiViewSectionLabel } from '../../lib/guardCredentialSections';

interface CoiCredentialBadgeProps {
  variant?: 'section' | 'category';
  className?: string;
}

/** Section badge for Certificate of Insurance — matches CredentialCategoryBadge styling. */
export function CoiCredentialBadge({ variant = 'section', className = '' }: CoiCredentialBadgeProps) {
  const label = variant === 'category' ? CERT_CATEGORY_LABELS.industry : coiViewSectionLabel();

  return (
    <span
      className={`credential-category-badge inline-flex items-center max-w-full text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border credential-category-industry ${className}`.trim()}
      title={coiViewSectionLabel()}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}
