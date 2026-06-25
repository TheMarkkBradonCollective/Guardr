import type { LegalPageId } from '../../lib/legalContent';

interface LegalFooterLinksProps {
  onOpenLegal: (page: LegalPageId) => void;
  className?: string;
}

const LEGAL_LINK_ORDER: LegalPageId[] = [
  'terms',
  'privacy',
  'ica',
  'client-agreement',
  'guard-conduct',
];

export function LegalFooterLinks({ onOpenLegal, className = '' }: LegalFooterLinksProps) {
  return (
    <div className={`flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs ${className}`}>
      {LEGAL_LINK_ORDER.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onOpenLegal(page)}
          className="font-semibold text-brand-text-muted hover:text-brand-primary transition-colors"
        >
          {page === 'ica'
            ? 'Independent Contractor Agreement'
            : page === 'client-agreement'
              ? 'Client Agreement'
              : page === 'guard-conduct'
                ? 'Guard Code of Conduct'
                : page === 'terms'
                  ? 'Terms of Service'
                  : 'Privacy Policy'}
        </button>
      ))}
    </div>
  );
}
