import React, { useState } from 'react';
import { AppScreenHeader } from './AppScreenHeader';
import { AppSidebarNav, SidebarNavItem } from './AppSidebarNav';
import { SidebarDrawer } from './SidebarDrawer';

interface RoleAppShellProps {
  title: string;
  subtitle?: string;
  sidebarTitle?: string;
  sidebarSubtitle?: string;
  navItems: SidebarNavItem[];
  activeNavId: string;
  onNavigate: (id: string) => void;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  fullBleed?: boolean;
  variant?: 'default' | 'dark';
}

export function RoleAppShell({
  title,
  subtitle,
  sidebarTitle = 'Guardr',
  sidebarSubtitle,
  navItems,
  activeNavId,
  onNavigate,
  children,
  headerRight,
  sidebarFooter,
  fullBleed = false,
  variant = 'default',
}: RoleAppShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMapMode = variant === 'dark';

  const navigate = (id: string) => {
    onNavigate(id);
    setMobileSidebarOpen(false);
  };

  const sidebarNav = (
    <AppSidebarNav items={navItems} activeId={activeNavId} onNavigate={navigate} />
  );

  return (
    <div className="role-app-shell page-shell fixed inset-0 flex flex-col h-dvh max-h-dvh overflow-hidden bg-brand-bg text-brand-text">
      <AppScreenHeader
        title={title}
        subtitle={subtitle}
        onMenuClick={() => setMobileSidebarOpen(true)}
        menuLabel="Open menu"
        menuClassName="md:hidden"
        right={headerRight}
        className={isMapMode ? 'bg-brand-bg/90 backdrop-blur-xl' : ''}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-brand-border bg-brand-bg-sec">
          {(sidebarTitle || sidebarSubtitle) && (
            <div className="p-4 border-b border-brand-border">
              {sidebarSubtitle && (
                <p className="text-[9px] font-mono uppercase tracking-widest text-brand-text-muted">
                  {sidebarSubtitle}
                </p>
              )}
              {sidebarTitle && (
                <p className="font-black text-xs uppercase tracking-tight mt-0.5">{sidebarTitle}</p>
              )}
            </div>
          )}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2">{sidebarNav}</div>
          {sidebarFooter && (
            <div className="shrink-0 p-3 border-t border-brand-border space-y-2">{sidebarFooter}</div>
          )}
        </aside>

        <main className={`flex-1 min-w-0 min-h-0 overflow-hidden ${fullBleed ? '' : 'p-4 sm:p-6'}`}>
          <div className={`h-full ${fullBleed ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain'}`}>
            {children}
          </div>
        </main>
      </div>

      <SidebarDrawer
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        title={sidebarTitle}
        subtitle={sidebarSubtitle}
        footer={sidebarFooter}
      >
        {sidebarNav}
      </SidebarDrawer>
    </div>
  );
}
