import React, { useState } from 'react';
import { AppScreenHeader } from './AppScreenHeader';
import { BottomNavBar, BottomNavItem } from './BottomNavBar';
import { MoreMenuSheet } from './MoreMenuSheet';
import type { AccountMenuProps } from './AccountMenu';

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

  return (
    <div
      className={`role-app-shell page-shell fixed inset-0 flex flex-col h-dvh max-h-dvh overflow-hidden bg-brand-bg text-brand-text${
        experience ? ` role-experience-${experience}` : ''
      }`}
    >
      {!hideHeader && (
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
      )}

      <main className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <div className={`h-full max-w-full min-w-0 ${fullBleed ? 'overflow-hidden' : 'overflow-hidden'}`}>
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
