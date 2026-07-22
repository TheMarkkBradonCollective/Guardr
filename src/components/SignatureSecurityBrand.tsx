import React from 'react';
import {
  LEGAL_ENTITY_NAME,
  SIGNATURE_SECURITY_SAGE,
  SIGNATURE_SECURITY_SAGE_DARK,
  SIGNATURE_SECURITY_SPECIALIST_NAME,
} from '../lib/siteConfig';

const ENTITY_PATTERN = new RegExp(
  `${LEGAL_ENTITY_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${SIGNATURE_SECURITY_SPECIALIST_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
  'g',
);

/** Sage green styling — only for Signature Security Specialist mentions. */
export const SIGNATURE_SECURITY_BRAND_CLASS = 'signature-security-brand';

export function LegalEntityName({ className = '' }: { className?: string }) {
  return (
    <span className={[SIGNATURE_SECURITY_BRAND_CLASS, className].filter(Boolean).join(' ')}>
      {LEGAL_ENTITY_NAME}
    </span>
  );
}

/** Wrap Signature Security Specialist name(s) in sage brand styling within plain text. */
export function highlightSignatureSecurityBrand(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(ENTITY_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }
    parts.push(
      <span key={`${index}-${match[0]}`} className={SIGNATURE_SECURITY_BRAND_CLASS}>
        {match[0]}
      </span>,
    );
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 0 ? text : parts.length === 1 ? parts[0] : parts;
}

/** Inline style fallback for Base Web overrides where className is awkward. */
export function signatureSecurityBrandColor(isDark: boolean): string {
  return isDark ? SIGNATURE_SECURITY_SAGE_DARK : SIGNATURE_SECURITY_SAGE;
}
