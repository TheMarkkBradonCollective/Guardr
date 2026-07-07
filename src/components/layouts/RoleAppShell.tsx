import React, { useState } from 'react';
import { AppScreenHeader } from './AppScreenHeader';
import { BottomNavBar, BottomNavItem } from './BottomNavBar';
import { MoreMenuSheet } from './MoreMenuSheet';
import { AccountMenu, type AccountMenuProps } from './AccountMenu';
import { Logo } from '../Logo';

interface RoleAppShellProps {
  title: string;
  subtitle?: string;
  locationLabel?: string;
  accountMenu: AccountMenuProps;
  navItems: BottomNavItem[];
  overflowNavItems?: BottomNavItem[];
  activeNavId: string;
  onNavigate: (id: string) => void;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  moreMenuFooter?: React.ReactNode;
  moreMenuTitle?: string;
  fullBleed?: boolean;
  hideHeader?: boolean;
  flatNav?: boolean;
  variant?: 'default' | 'dark';
  experience?: 'client' | 'guard';
  centerNavId?: string;
}

export function RoleAppShell({
  title,
  subtitle,
  locationLabel,
  accountMenu,
  navItems,
  overflowNavItems = [],
  activeNavId,
  onNavigate,
  children,
  headerRight,
  moreMenuFooter,
  moreMenuTitle = 'More',
  fullBleed = false,
  hideHeader = false,
  flatNav = false,
  variant = 'default',
  experience,
  centerNavId = 'map',
}: RoleAppShellProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const isMapMode = variant === 'dark';
  const hasOverflow = overflowNavItems.length > 0;
  const moreActive = hasOverflow && overflowNavItems.some((i) => i.id === activeNavId);
  const moreBadge = overflowNavItems.reduce((sum, i) => sum + (i.badge ?? 0), 0);

  const navigate = (id: string) => {
    onNavigate(id);
    setMoreOpen(false);
  };

  // All nav items for the desktop sidebar (primary + overflow combined)
  const allSideNavItems = [...navItems, ...overflowNavItems];

  return (
    <div
      className={`role-app-shell page-shell fixed inset-0 flex flex-col h-dvh max-h-dvh overflow-hidden bg-brand-bg text-brand-text${
        experience ? ` role-experience-${experience}` : ''
      }`}
    >
      {/* ── Desktop sidebar nav (hidden on mobile/tablet via CSS) ── */}
      <aside className="role-side-nav" aria-label="Main navigation">
        <div className="role-side-nav-brand">
          <Logo size={26} className="text-brand-primary shrink-0" />
          <span className="role-side-nav-brand-name">
            Guard<span className="role-side-nav-brand-accent">r</span>
          </span>
        </div>

        <nav className="role-side-nav-items" role="navigation">
          {allSideNavItems.map(({ id, label, icon: Icon, badge }) => {
            const active = activeNavId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                className={`role-side-nav-item${active ? ' role-side-nav-item-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  className="role-side-nav-item-icon"
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="role-side-nav-item-label">{label}</span>
                {badge != null && badge > 0 && (
                  <span className="role-side-nav-item-badge">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="role-side-nav-footer">
          <AccountMenu {...accountMenu} />
        </div>
      </aside>

      {/* ── Header (all sizes; hidden on desktop when sidebar is active) ── */}
      {!hideHeader ? (
        <AppScreenHeader
          title={title}
          subtitle={subtitle}
          locationLabel={locationLabel}
          accountMenu={accountMenu}
          right={headerRight}
          className={`${isMapMode ? 'app-screen-header--map bg-brand-bg/90 backdrop-blur-xl' : ''}${
            experience ? ` role-header-${experience}` : ''
          }`}
        />
      ) : (
        <header className="app-screen-header app-screen-header--compact shrink-0 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2.5 flex items-center justify-end gap-2 border-b border-brand-border bg-brand-bg/95 backdrop-blur-xl z-[1200]">
          {headerRight}
          <AccountMenu {...accountMenu} />
        </header>
      )}

      <main className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <div className="h-full max-w-full min-w-0 overflow-hidden">
          {children}
        </div>
      </main>

      <BottomNavBar
        items={navItems}
        activeId={activeNavId}
        onNavigate={navigate}
        showMore={hasOverflow}
        moreActive={moreActive}
        moreBadge={moreBadge}
        onMoreClick={() => setMoreOpen(true)}
        flat={flatNav}
        centerItemId={centerNavId}
      />

      {hasOverflow && (
        <MoreMenuSheet
          open={moreOpen}
          title={moreMenuTitle}
          items={overflowNavItems}
          activeId={activeNavId}
          onNavigate={navigate}
          onClose={() => setMoreOpen(false)}
          footer={moreMenuFooter}
        />
      )}
    </div>
  );
}

export type { BottomNavItem };
