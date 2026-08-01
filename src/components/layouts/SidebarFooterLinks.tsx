import type { LegalPageId } from '../../lib/legalContent';
import { LEGAL_LINK_ORDER, legalLinkLabel } from '../legal/LegalFooterLinks';

interface SidebarFooterLinksProps {
  onOpenSettings?: () => void;
  onOpenLegal?: (page: LegalPageId) => void;
}

/** Short sidebar labels; full titles are in the `title` tooltip. */
function sidebarLegalLabel(page: LegalPageId): string {
  if (page === 'terms') return 'Terms';
  if (page === 'privacy') return 'Privacy';
  if (page === 'ica') return 'ICA';
  if (page === 'client-agreement') return 'Client Agmt';
  return 'Conduct';
}

/** Pinned sidebar footer: account settings plus legal documents. */
export function SidebarFooterLinks({ onOpenSettings, onOpenLegal }: SidebarFooterLinksProps) {
  if (!onOpenSettings && !onOpenLegal) return null;

  return (
    <div className="uber-direct-sidebar-footer-links">
      {onOpenSettings ? (
        <button type="button" className="uber-direct-sidebar-footer-link uber-direct-sidebar-footer-link--primary" onClick={onOpenSettings}>
          Account settings
        </button>
      ) : null}
      {onOpenLegal ? (
        <div className="uber-direct-sidebar-footer-legal-wrap" role="group" aria-label="Legal documents">
          {LEGAL_LINK_ORDER.map((page) => (
            <button
              key={page}
              type="button"
              className="uber-direct-sidebar-footer-link"
              onClick={() => onOpenLegal(page)}
              title={legalLinkLabel(page)}
            >
              {sidebarLegalLabel(page)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
