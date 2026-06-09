import React, { useState } from 'react';
import { AppScreenHeader } from './AppScreenHeader';
import { BottomNavBar, BottomNavItem } from './BottomNavBar';
import { MoreMenuSheet } from './MoreMenuSheet';

interface RoleAppShellProps {
  title: string;
  subtitle?: string;
  locationLabel?: string;
  avatarUrl?: string;
  avatarName?: string;
  onAvatarClick?: () => void;
  navItems: BottomNavItem[];
  overflowNavItems?: BottomNavItem[];
  activeNavId: string;
  onNavigate: (id: string) => void;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  moreMenuFooter?: React.ReactNode;
  moreMenuTitle?: string;
  fullBleed?: boolean;
  variant?: 'default' | 'dark';
}

export function RoleAppShell({
  title,
  subtitle,
  locationLabel,
  avatarUrl,
  avatarName,
  onAvatarClick,
  navItems,
  overflowNavItems = [],
  activeNavId,
  onNavigate,
  children,
  headerRight,
  moreMenuFooter,
  moreMenuTitle = 'More',
  fullBleed = false,
  variant = 'default',
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
    <div className="role-app-shell page-shell fixed inset-0 flex flex-col h-dvh max-h-dvh overflow-hidden bg-brand-bg text-brand-text">
      <AppScreenHeader
        title={title}
        subtitle={subtitle}
        locationLabel={locationLabel}
        avatarUrl={avatarUrl}
        avatarName={avatarName}
        onAvatarClick={onAvatarClick}
        right={headerRight}
        className={isMapMode ? 'bg-brand-bg/90 backdrop-blur-xl' : ''}
      />

      <main
        className={`flex-1 min-h-0 min-w-0 overflow-hidden ${fullBleed ? '' : 'px-4 py-4 sm:px-5 sm:py-5'}`}
      >
        <div className={`h-full ${fullBleed ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain'}`}>
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
