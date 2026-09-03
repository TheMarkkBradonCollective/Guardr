import type { LegalPageId } from '../../lib/legalContent';

interface LegalFooterLinksProps {
  onOpenLegal: (page: LegalPageId) => void;
  className?: string;
}

export const LEGAL_LINK_ORDER: LegalPageId[] = [
  'terms',
  'privacy',
  'ica',
  'client-agreement',
  'guard-conduct',
];

export function legalLinkLabel(page: LegalPageId): string {
  if (page === 'ica') return 'Independent Contractor Agreement';
  if (page === 'client-agreement') return 'Client Agreement';
  if (page === 'guard-conduct') return 'Guard Code of Conduct';
  if (page === 'terms') return 'Terms of Service';
  return 'Privacy Policy';
}

export function LegalFooterLinks({ onOpenLegal, className = '' }: LegalFooterLinksProps) {
  return (
    <div className={`legal-footer-links flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs ${className}`}>
      {LEGAL_LINK_ORDER.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onOpenLegal(page)}
          className="legal-footer-link font-semibold"
        >
          {legalLinkLabel(page)}
        </button>
      ))}
    </div>
  );
}
