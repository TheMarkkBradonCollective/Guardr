import React from 'react';
import { Logo } from '../Logo';
import { AppBottomNav, BottomNavItem } from './AppBottomNav';

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
      <header
        className={`shrink-0 h-14 px-4 flex items-center justify-between gap-3 border-b border-brand-border ${
          isMapMode ? 'bg-brand-bg/90 backdrop-blur-xl' : 'bg-brand-bg-sec'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Logo size={28} />
          <div className="min-w-0">
            {subtitle && (
              <p className="text-[11px] font-medium text-brand-text-muted leading-none mb-0.5">{subtitle}</p>
            )}
            <p className="text-base font-semibold truncate leading-tight">{title}</p>
          </div>
        </div>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </header>

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
