import React, { useCallback, useState } from 'react';
import { PanelLeft, Settings } from 'lucide-react';
import { SessionUser } from '../../../types';
import { ROLE_LABELS } from '../../../lib/permissions';
import { isStaffOpsMapSection, isStaffMessagesSection, StaffSection } from '../../../lib/staffOps';
import { getStaffNavAccessNotice, isStaffNavItemVisible } from '../../../lib/staffNavAccess';
import type { LegalPageId } from '../../../lib/legalContent';
import { Logo } from '../../Logo';
import { AccountMenu, type AccountMenuNotificationProps } from '../AccountMenu';
import { LegalFooterLinks } from '../../legal/LegalFooterLinks';
import { StaffNavItem } from '../../staff/StaffSidebarNav';
import { showAppAlert } from '../../ui/AppConfirm';

interface DesktopStaffAdminShellProps {
  children: React.ReactNode;
  currentUser: SessionUser;
  activeSection: StaffSection;
  onNavigate: (section: StaffSection) => void;
  onSignOut: () => void;
  isDbConnected: boolean;
  navItems: StaffNavItem[];
  screenTitle: string;
  navHighlight: StaffSection;
  showFinance: boolean;
  showSettings: boolean;
  showDisputes: boolean;
  showCities: boolean;
  onOpenLegal?: (page: LegalPageId) => void;
  hideHeader?: boolean;
  accountNotifications?: AccountMenuNotificationProps;
  headerExtension?: React.ReactNode;
  headerOverride?: React.ReactNode;
}

const MENU_GROUPS: { label: string; ids: StaffSection[] }[] = [
  { label: 'Command', ids: ['overview', 'map'] },
  {
    label: 'Operations',
    ids: ['jobs', 'applications', 'credentials', 'guards', 'crews', 'clients', 'team', 'messages'],
  },
  { label: 'Finance', ids: ['payments', 'payment-settings', 'agreements', 'audit-log'] },
  { label: 'Support & insights', ids: ['incidents', 'violations', 'stats', 'disputes', 'analytics'] },
  { label: 'Platform', ids: ['cities', 'settings', 'integrations', 'guide', 'dev-updates'] },
];

export function DesktopStaffAdminShell({
  children,
  currentUser,
  activeSection,
  onNavigate,
  onSignOut,
  isDbConnected,
  navItems,
  screenTitle,
  navHighlight,
  showFinance,
  showSettings,
  showDisputes,
  showCities,
  onOpenLegal,
  hideHeader = false,
  accountNotifications,
  headerExtension,
  headerOverride,
}: DesktopStaffAdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const accessFlags = { showFinance, showSettings, showDisputes, showCities };
  const isMap = isStaffOpsMapSection(activeSection);
  const bleed = isMap || isStaffMessagesSection(activeSection);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((open) => !open), []);

  const visible = (item: StaffNavItem) => isStaffNavItemVisible(item, accessFlags);

  const handleNav = (id: StaffSection) => {
    const notice = getStaffNavAccessNotice(id, accessFlags);
    if (notice) {
      void showAppAlert({ title: notice.title, message: notice.message, tone: 'warning' });
      return;
    }
    onNavigate(id);
    closeSidebar();
  };

  return (
    <div
      className={`adm-app adm-app--staff page-shell fixed inset-0 flex h-dvh max-h-dvh overflow-hidden ${isMap ? 'adm-app--map' : ''}${sidebarOpen ? ' adm-app--sidebar-open' : ''}`}
    >
      {sidebarOpen ? (
        <button
          type="button"
          className="adm-sidebar-backdrop"
          onClick={closeSidebar}
          aria-label="Close navigation"
        />
      ) : null}

      <aside
        className={`adm-sidebar adm-sidebar--staff adm-sidebar--drawer${sidebarOpen ? ' adm-sidebar--open' : ''}`}
        aria-label="Staff navigation"
        aria-hidden={!sidebarOpen}
      >
        <div className="adm-sidebar-brand">
          <Logo size={26} className="adm-logo shrink-0" />
          <div>
            <span className="adm-sidebar-wordmark">
              Guard<span className="adm-accent-text">r</span>
            </span>
            <span className="adm-sidebar-suite">Operations</span>
          </div>
          {isDbConnected ? <span className="adm-db-dot" aria-label="Connected" /> : null}
        </div>

        {MENU_GROUPS.map((group) => {
          const items = group.ids
            .map((id) => navItems.find((n) => n.id === id))
            .filter((item): item is StaffNavItem => !!item && visible(item));
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="adm-sidebar-section">{group.label}</p>
              <nav className="adm-sidebar-nav">
                {items.map(({ id, label, icon: Icon, badge }) => {
                  const active = navHighlight === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleNav(id)}
                      className={`adm-sidebar-item${active ? ' adm-sidebar-item--active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className="adm-sidebar-item-icon" strokeWidth={active ? 2.25 : 1.85} />
                      <span className="adm-sidebar-item-label">{label}</span>
                      {badge != null && badge > 0 ? (
                        <span className="adm-sidebar-badge">{badge > 99 ? '99+' : badge}</span>
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            </div>
          );
        })}

        {onOpenLegal ? (
          <div className="adm-sidebar-legal">
            <LegalFooterLinks onOpenLegal={onOpenLegal} className="justify-center" />
          </div>
        ) : null}
      </aside>

      <div className="adm-main" onClick={sidebarOpen ? closeSidebar : undefined}>
        <header className="adm-header" onClick={(e) => e.stopPropagation()}>
          <div className="adm-header-brand">
            <button
              type="button"
              className="adm-header-icon-btn"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={sidebarOpen}
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <Logo size={24} className="adm-logo shrink-0" />
            <div className="adm-header-brand-text">
              <span className="adm-header-wordmark">
                Guard<span className="adm-accent-text">r</span>
              </span>
              <span className="adm-header-suite">Operations</span>
            </div>
          </div>
          <div className="adm-header-actions">
            <AccountMenu
              userName={currentUser.name}
              userSubtitle={ROLE_LABELS[currentUser.role]}
              avatarUrl={currentUser.avatar}
              onOpenProfile={() => onNavigate('profile')}
              onOpenSettings={() => onNavigate('preferences')}
              onSignOut={onSignOut}
              active={activeSection === 'profile' || activeSection === 'preferences'}
              {...accountNotifications}
            />
            <button
              type="button"
              className="adm-header-icon-btn"
              onClick={() => onNavigate('settings')}
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {!hideHeader ? (
          headerOverride ? (
            <div className="adm-hero-slot">{headerOverride}</div>
          ) : (
            <div className="adm-hero">
              <div>
                <h1 className="adm-hero-title">{screenTitle}</h1>
                <p className="adm-hero-sub">Welcome to Guardr staff console</p>
              </div>
            </div>
          )
        ) : null}

        {headerExtension ? <div className="adm-hero-extension">{headerExtension}</div> : null}

        <main className={`adm-content${bleed ? ' adm-content--bleed' : ''}`}>
          <div className="adm-content-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
