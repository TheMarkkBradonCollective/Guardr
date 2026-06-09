import React from 'react';
import { AppBottomNav, BottomNavItem } from './AppBottomNav';
import { AppScreenHeader } from './AppScreenHeader';

type ThemeMode = 'dark' | 'light' | 'grey';

interface RoleAppShellProps {
  title: string;
  subtitle?: string;
  themeMode?: ThemeMode;
  navItems: BottomNavItem[];
  activeNavId: string;
  onNavigate: (id: string) => void;
  children: React.ReactNode;
  hideBottomNav?: boolean;
  headerRight?: React.ReactNode;
  variant?: 'default' | 'dark';
}

export function RoleAppShell({
  title,
  subtitle,
  navItems,
  activeNavId,
  onNavigate,
  children,
  hideBottomNav = false,
  headerRight,
  variant = 'default',
}: RoleAppShellProps) {
  const isMapMode = variant === 'dark';

  return (
    <div
      className={`role-app-shell fixed inset-0 flex flex-col h-dvh max-h-dvh overflow-hidden bg-brand-bg text-brand-text`}
    >
      <AppScreenHeader
        title={title}
        subtitle={subtitle}
        right={headerRight}
        className={isMapMode ? 'bg-brand-bg/90 backdrop-blur-xl' : ''}
      />

      <main className="flex-1 min-h-0 overflow-hidden relative">{children}</main>

      {!hideBottomNav && (
        <AppBottomNav
          items={navItems}
          activeId={activeNavId}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}
