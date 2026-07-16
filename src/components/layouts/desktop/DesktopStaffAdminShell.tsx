import React from 'react';
import { Search, Settings } from 'lucide-react';
import { SessionUser } from '../../../types';
import { ROLE_LABELS } from '../../../lib/permissions';
import { isStaffOpsMapSection, isStaffMessagesSection, StaffSection } from '../../../lib/staffOps';
import { getStaffNavAccessNotice } from '../../../lib/staffNavAccess';
import type { LegalPageId } from '../../../lib/legalContent';
import { Logo } from '../../Logo';
import { AccountMenu } from '../AccountMenu';
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
  onOpenLegal?: (page: LegalPageId) => void;
  hideHeader?: boolean;
  headerActions?: React.ReactNode;
  headerExtension?: React.ReactNode;
  headerOverride?: React.ReactNode;
}

const MENU_GROUPS: { label: string; ids: StaffSection[] }[] = [
  { label: 'Command', ids: ['overview', 'map', 'analytics'] },
  {
    label: 'Operations',
    ids: ['jobs', 'applications', 'credentials', 'guards', 'crews', 'clients', 'team', 'messages'],
  },
  { label: 'Finance', ids: ['payments', 'payment-settings', 'agreements', 'audit-log'] },
  { label: 'Risk', ids: ['incidents', 'disputes'] },
  { label: 'Platform', ids: ['settings', 'guide', 'dev-updates'] },
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
  onOpenLegal,
  hideHeader = false,
  headerActions,
  headerExtension,
  headerOverride,
}: DesktopStaffAdminShellProps) {
  const accessFlags = { showFinance, showSettings, showDisputes };
  const isMap = isStaffOpsMapSection(activeSection);
  const bleed = isMap || isStaffMessagesSection(activeSection);

  const visible = (item: StaffNavItem) => {
    if (item.financeOnly && !showFinance) return false;
    if (item.settingsOnly && !showSettings) return false;
    if (item.disputesOnly && !showDisputes) return false;
    return true;
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
    <div className={`adm-app adm-app--staff page-shell fixed inset-0 flex h-dvh max-h-dvh overflow-hidden ${isMap ? 'adm-app--map' : ''}`}>
      <aside className="adm-sidebar adm-sidebar--staff" aria-label="Staff navigation">
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

      <div className="adm-main">
        <header className="adm-header">
          <label className="adm-search">
            <Search className="adm-search-icon" />
            <input type="search" placeholder="Search guards, clients, jobs…" className="adm-search-input" />
          </label>
          <div className="adm-header-actions">
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
