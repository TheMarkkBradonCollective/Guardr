import React from 'react';
import type { LegalPageId } from '../../lib/legalContent';

interface LegalFooterLinksProps {
  onOpenLegal: (page: LegalPageId) => void;
  className?: string;
}

export function LegalFooterLinks({ onOpenLegal, className = '' }: LegalFooterLinksProps) {
  return (
    <div className={`flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs ${className}`}>
      <button
        type="button"
        onClick={() => onOpenLegal('terms')}
        className="font-semibold text-brand-text-muted hover:text-brand-primary transition-colors"
      >
        Terms of Service
      </button>
      <button
        type="button"
        onClick={() => onOpenLegal('privacy')}
        className="font-semibold text-brand-text-muted hover:text-brand-primary transition-colors"
      >
        Privacy Policy
      </button>
    </div>
  );
}
