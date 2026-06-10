import React from 'react';
import {
  SIGNATURE_SECURITY_SPECIALIST_NAME,
  SIGNATURE_SECURITY_SPECIALIST_URL,
} from '../lib/siteConfig';

interface SignatureSecuritySpecialistLinkProps {
  className?: string;
  children?: React.ReactNode;
}

export function SignatureSecuritySpecialistLink({
  className = 'text-brand-primary hover:underline transition-colors',
  children,
}: SignatureSecuritySpecialistLinkProps) {
  return (
    <a
      href={SIGNATURE_SECURITY_SPECIALIST_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children ?? SIGNATURE_SECURITY_SPECIALIST_NAME}
    </a>
  );
}
