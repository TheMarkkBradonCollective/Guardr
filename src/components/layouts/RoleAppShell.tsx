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
  const isDark = variant === 'dark';

  return (
    <div
      className={`role-app-shell fixed inset-0 flex flex-col h-dvh max-h-dvh overflow-hidden ${
        isDark ? 'bg-black text-white' : 'bg-brand-bg text-brand-text'
      }`}
    >
      <header
        className={`shrink-0 h-14 px-4 flex items-center justify-between gap-3 border-b ${
          isDark ? 'border-white/10 bg-black/90' : 'border-brand-border bg-brand-bg-sec'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Logo size={22} />
          <div className="min-w-0">
            <p className={`text-[8px] font-mono uppercase leading-none ${isDark ? 'text-white/40' : 'text-brand-text-muted'}`}>
              Guardr
            </p>
            <p className="text-sm font-black truncate leading-tight">{title}</p>
          </div>
        </div>
        {subtitle && (
          <p className={`hidden sm:block text-[10px] font-mono uppercase truncate ${isDark ? 'text-white/50' : 'text-brand-text-muted'}`}>
            {subtitle}
          </p>
        )}
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </header>

      <main className="flex-1 min-h-0 overflow-hidden relative">{children}</main>

      {!hideBottomNav && (
        <AppBottomNav
          items={navItems}
          activeId={activeNavId}
          onNavigate={onNavigate}
          className={isDark ? 'bg-black/95 border-white/10' : ''}
        />
      )}
    </div>
  );
}
