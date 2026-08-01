import type { LegalPageId } from '../../lib/legalContent';
import { LEGAL_LINK_ORDER, legalLinkLabel } from '../legal/LegalFooterLinks';

interface SidebarFooterLinksProps {
  onOpenSettings?: () => void;
  onOpenLegal?: (page: LegalPageId) => void;
}

/** Pinned sidebar footer: account settings plus legal documents. */
export function SidebarFooterLinks({ onOpenSettings, onOpenLegal }: SidebarFooterLinksProps) {
  if (!onOpenSettings && !onOpenLegal) return null;

  return (
    <div className="uber-direct-sidebar-footer-links">
      {onOpenSettings ? (
        <button type="button" className="uber-direct-sidebar-footer-link" onClick={onOpenSettings}>
          Account settings
        </button>
      ) : null}
      {onOpenLegal
        ? LEGAL_LINK_ORDER.map((page) => (
            <button
              key={page}
              type="button"
              className="uber-direct-sidebar-footer-link"
              onClick={() => onOpenLegal(page)}
            >
              {legalLinkLabel(page)}
            </button>
          ))
        : null}
    </div>
  );
}
