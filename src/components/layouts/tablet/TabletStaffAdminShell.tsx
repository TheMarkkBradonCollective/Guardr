import React, { useMemo } from 'react';
import { Logo } from '../../Logo';
import { AccountMenu, type AccountMenuNotificationProps } from '../AccountMenu';
import { DesktopCommandBar } from '../desktop/DesktopCommandBar';
import { StaffNavItem } from '../../staff/StaffSidebarNav';
import { SessionUser } from '../../../types';
import { ROLE_LABELS } from '../../../lib/permissions';
import { StaffSection } from '../../../lib/staffOps';
import { getStaffNavAccessNotice, isStaffNavItemVisible } from '../../../lib/staffNavAccess';
import { showAppAlert } from '../../ui/AppConfirm';

interface TabletStaffAdminShellProps {
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
  showCities: boolean;
  hideHeader?: boolean;
  accountNotifications?: AccountMenuNotificationProps;
  headerExtension?: React.ReactNode;
  headerOverride?: React.ReactNode;
}

/**
 * Staff tablet merge shell — compact ops rail + command bar + touch-friendly main pane.
 */
export function TabletStaffAdminShell({
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
  showCities,
  hideHeader = false,
  accountNotifications,
  headerExtension,
  headerOverride,
}: TabletStaffAdminShellProps) {
  const accessFlags = { showFinance, showSettings, showPermissions, showDisputes, showCities };

  const visibleItems = useMemo(
    () => navItems.filter((item) => isStaffNavItemVisible(item, accessFlags)),
    [navItems, accessFlags],
  );

  const accountMenu = {
    userName: currentUser.name,
    userSubtitle: ROLE_LABELS[currentUser.role],
    avatarUrl: currentUser.avatar,
    onOpenProfile: () => onNavigate('profile'),
    onOpenSettings: () => onNavigate('preferences'),
    onSignOut,
    active: activeSection === 'profile' || activeSection === 'preferences',
    ...accountNotifications,
  };

  const handleNav = (id: StaffSection) => {
    const notice = getStaffNavAccessNotice(id, accessFlags);
    if (notice) {
      void showAppAlert({ title: notice.title, message: notice.message, tone: 'warning' });
      return;
    }
    onNavigate(id);
  };

  return (
    <div className="tablet-admin-shell tablet-admin-shell--staff page-shell fixed inset-0 flex h-dvh max-h-dvh overflow-hidden bg-brand-bg text-brand-text">
      <aside className="tablet-admin-rail tablet-admin-rail--staff" aria-label="Staff navigation">
        <div className="tablet-admin-rail-brand">
          <Logo size={22} className="text-brand-primary shrink-0" />
          <span className="tablet-admin-rail-label">Ops</span>
          {isDbConnected ? (
            <span className="tablet-admin-rail-live" aria-label="Connected" />
          ) : null}
        </div>
        <nav className="tablet-admin-rail-nav tablet-admin-rail-nav--scroll" role="navigation">
          {visibleItems.map(({ id, label, icon: Icon, badge }) => {
            const active = navHighlight === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleNav(id)}
                className={`tablet-admin-rail-item${active ? ' tablet-admin-rail-item--active' : ''}`}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                title={label}
              >
                <Icon className="tablet-admin-rail-item-icon" strokeWidth={active ? 2.5 : 2} />
                {badge != null && badge > 0 ? (
                  <span className="tablet-admin-rail-item-badge">{badge > 99 ? '99+' : badge}</span>
                ) : null}
              </button>
            );
          })}
        </nav>
        <div className="tablet-admin-rail-footer">
          <AccountMenu {...accountMenu} />
        </div>
      </aside>

      <div className="tablet-admin-main flex-1 flex flex-col min-w-0 min-h-0">
        {headerOverride ? (
          <div className="tablet-admin-header-slot shrink-0">{headerOverride}</div>
        ) : !hideHeader ? (
          <DesktopCommandBar
            title={screenTitle}
            breadcrumb="Operations"
            extension={headerExtension}
            accountMenu={accountMenu}
            showLiveStatus={isDbConnected}
            variant={activeSection === 'map' ? 'map' : 'default'}
          />
        ) : null}

        <main className="tablet-admin-content flex-1 min-h-0 min-w-0 overflow-hidden">
          <div className="h-full max-w-full min-w-0 overflow-hidden">{children}</div>
        </main>
      </div>
    </div>
  );
}
