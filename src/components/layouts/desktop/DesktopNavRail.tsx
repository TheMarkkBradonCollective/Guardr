import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Logo } from '../../Logo';

export interface DesktopNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface DesktopNavRailProps {
  items: DesktopNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  footer?: React.ReactNode;
  primaryLabel?: string;
  secondaryItems?: DesktopNavItem[];
  secondaryLabel?: string;
}

export function DesktopNavRail({
  items,
  activeId,
  onNavigate,
  footer,
  primaryLabel = 'Workspace',
  secondaryItems = [],
  secondaryLabel = 'More',
}: DesktopNavRailProps) {
  const renderItem = ({ id, label, icon: Icon, badge }: DesktopNavItem) => {
    const active = activeId === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => onNavigate(id)}
        className={`desktop-nav-rail-item${active ? ' desktop-nav-rail-item--active' : ''}`}
        aria-current={active ? 'page' : undefined}
      >
        <span className="desktop-nav-rail-item-icon-wrap" aria-hidden>
          <Icon className="desktop-nav-rail-item-icon" strokeWidth={active ? 2.25 : 1.85} />
        </span>
        <span className="desktop-nav-rail-item-label">{label}</span>
        {badge != null && badge > 0 ? (
          <span className="desktop-nav-rail-item-badge">{badge > 99 ? '99+' : badge}</span>
        ) : null}
      </button>
    );
  };

  return (
    <aside className="desktop-nav-rail" aria-label="Main navigation">
      <div className="desktop-nav-rail-brand">
        <Logo size={22} className="text-brand-primary shrink-0" />
        <div className="desktop-nav-rail-brand-copy">
          <span className="desktop-nav-rail-brand-name">
            Guard<span className="text-brand-primary">r</span>
          </span>
          <span className="desktop-nav-rail-brand-tag">Desktop</span>
        </div>
      </div>

      <nav className="desktop-nav-rail-scroll">
        <p className="desktop-nav-rail-section-label">{primaryLabel}</p>
        <div className="desktop-nav-rail-group">{items.map(renderItem)}</div>

        {secondaryItems.length > 0 ? (
          <>
            <p className="desktop-nav-rail-section-label">{secondaryLabel}</p>
            <div className="desktop-nav-rail-group">{secondaryItems.map(renderItem)}</div>
          </>
        ) : null}
      </nav>

      {footer ? <div className="desktop-nav-rail-footer">{footer}</div> : null}
    </aside>
  );
}
