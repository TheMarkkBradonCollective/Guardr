import React from 'react';
import { SessionUser } from '../../../types';
import { ROLE_LABELS } from '../../../lib/permissions';
import { isStaffOpsMapSection, isStaffMessagesSection, StaffSection } from '../../../lib/staffOps';
import { getStaffNavAccessNotice, isStaffNavItemVisible } from '../../../lib/staffNavAccess';
import type { LegalPageId } from '../../../lib/legalContent';
import { Logo } from '../../Logo';
import { AccountMenu } from '../AccountMenu';
import { LegalFooterLinks } from '../../legal/LegalFooterLinks';
import { StaffNavItem } from '../../staff/StaffSidebarNav';
import { showAppAlert } from '../../ui/AppConfirm';

interface DesktopStaffTopShellProps {
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
  showPermissions: boolean;
  showDisputes: boolean;
  onOpenLegal?: (page: LegalPageId) => void;
  hideHeader?: boolean;
  headerActions?: React.ReactNode;
  headerExtension?: React.ReactNode;
  headerOverride?: React.ReactNode;
}

const PRIMARY_NAV: StaffSection[] = ['map', 'overview', 'jobs', 'guards', 'clients', 'messages'];
const SECONDARY_NAV: StaffSection[] = [
  'applications',
  'credentials',
  'crews',
  'team',
  'payments',
  'incidents',
  'analytics',
  'permissions',
  'settings',
];

export function DesktopStaffTopShell({
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
  showPermissions,
  showDisputes,
  onOpenLegal,
  hideHeader = false,
  headerActions,
  headerExtension,
  headerOverride,
}: DesktopStaffTopShellProps) {
  const accessFlags = { showFinance, showSettings, showPermissions, showDisputes, showCities: false };
  const isMap = isStaffOpsMapSection(activeSection);

  const visible = (item: StaffNavItem) => isStaffNavItemVisible(item, accessFlags);

  const handleNav = (id: StaffSection) => {
    const notice = getStaffNavAccessNotice(id, accessFlags);
    if (notice) {
      void showAppAlert({ title: notice.title, message: notice.message, tone: 'warning' });
      return;
    }
    onNavigate(id);
  };

  const renderTab = (id: StaffSection) => {
    const item = navItems.find((n) => n.id === id);
    if (!item || !visible(item)) return null;
    const active = navHighlight === id;
    const Icon = item.icon;
    return (
      <button
        key={id}
        type="button"
        onClick={() => handleNav(id)}
        className={`dsk-app-topbar-tab${active ? ' dsk-app-topbar-tab--active' : ''}`}
        aria-current={active ? 'page' : undefined}
      >
        <Icon className="dsk-app-topbar-tab-icon" strokeWidth={active ? 2.25 : 1.85} />
        <span>{item.label}</span>
        {item.badge != null && item.badge > 0 ? (
          <span className="dsk-app-topbar-badge">{item.badge > 99 ? '99+' : item.badge}</span>
        ) : null}
      </button>
    );
  };

  return (
    <div className={`dsk-app dsk-app--staff page-shell fixed inset-0 flex flex-col h-dvh max-h-dvh overflow-hidden bg-[var(--dsk-bg)] text-brand-text ${isMap ? 'dsk-app--map' : ''}`}>
      <header className="dsk-app-topbar dsk-app-topbar--staff shrink-0">
        <div className="dsk-app-topbar-brand">
          <Logo size={24} className="text-brand-primary shrink-0" />
          <div>
            <span className="dsk-app-topbar-wordmark">
              Guard<span className="text-brand-primary">r</span>
            </span>
            <span className="dsk-app-topbar-suite">Operations</span>
          </div>
          {isDbConnected ? (
            <span className="dsk-app-db-pulse" aria-label="Connected" />
          ) : null}
        </div>

        <nav className="dsk-app-topbar-nav dsk-app-topbar-nav--staff" aria-label="Staff navigation">
          {PRIMARY_NAV.map(renderTab)}
          <span className="dsk-app-topbar-divider" aria-hidden />
          {SECONDARY_NAV.map(renderTab)}
        </nav>

        <div className="dsk-app-topbar-actions">
          {headerActions}
          <AccountMenu
            userName={currentUser.name}
            userSubtitle={ROLE_LABELS[currentUser.role]}
            avatarUrl={currentUser.avatar}
            onOpenProfile={() => onNavigate('profile')}
            onOpenSettings={() => onNavigate('preferences')}
            onSignOut={onSignOut}
            active={activeSection === 'profile' || activeSection === 'preferences'}
          />
        </div>
      </header>

      {!hideHeader ? (
        headerOverride ? (
          <div className="dsk-app-subheader-slot shrink-0">{headerOverride}</div>
        ) : (
          <div className="dsk-app-subheader shrink-0">
            <div className="dsk-app-subheader-main">
              <p className="dsk-app-subheader-eyebrow">Command center</p>
              <h1 className="dsk-app-subheader-title">{screenTitle}</h1>
            </div>
            <div className="dsk-app-subheader-meta">
              <span className="dsk-app-live-badge">
                <span className="dsk-app-live-dot" />
                Live ops
              </span>
            </div>
          </div>
        )
      ) : null}

      {headerExtension ? <div className="dsk-app-subheader-extension shrink-0">{headerExtension}</div> : null}

      <main
        className={`dsk-app-main flex-1 min-h-0 min-w-0 overflow-hidden ${
          isStaffMessagesSection(activeSection) || isMap ? '' : 'dsk-app-main--padded'
        }`}
      >
        <div className="dsk-app-main-inner h-full min-h-0 min-w-0 overflow-hidden">{children}</div>
      </main>

      {onOpenLegal ? (
        <footer className="dsk-app-footer shrink-0">
          <LegalFooterLinks onOpenLegal={onOpenLegal} className="justify-center" />
        </footer>
      ) : null}
    </div>
  );
}
