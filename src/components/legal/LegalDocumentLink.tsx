import React from 'react';
import type { LegalPageId } from '../../lib/legalContent';

interface LegalDocumentLinkProps {
  page: LegalPageId;
  children: React.ReactNode;
  onOpenLegal?: (page: LegalPageId) => void;
  className?: string;
}

/**
 * Legal doc link for acceptance rows. Opens in a new tab so signup forms stay intact.
 * Stops event bubbling so nested interactive content does not fight the checkbox row.
 */
export function LegalDocumentLink({
  page,
  children,
  onOpenLegal,
  className = 'font-semibold text-brand-primary hover:underline',
}: LegalDocumentLinkProps) {
  return (
    <a
      href={`/legal/${page}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        if (onOpenLegal) {
          e.preventDefault();
          onOpenLegal(page);
        }
      }}
    >
      {children}
    </a>
  );
}
