import React from 'react';
import { SessionUser } from '../../../types';
import { canAccessFinancialControls, canAccessStaffSettings, canHandleDisputes, ROLE_LABELS } from '../../../lib/permissions';
import { isStaffOpsMapSection, isStaffMessagesSection, StaffSection } from '../../../lib/staffOps';
import { LegalFooterLinks } from '../../legal/LegalFooterLinks';
import type { LegalPageId } from '../../../lib/legalContent';
import { AccountMenu } from '../AccountMenu';
import { DesktopCommandBar } from './DesktopCommandBar';
import { StaffDesktopNav } from './StaffDesktopNav';
import { StaffNavItem } from '../../staff/StaffSidebarNav';

type ThemeMode = 'dark' | 'light' | 'grey';

interface StaffDesktopShellProps {
  children: React.ReactNode;
  currentUser: SessionUser;
  activeSection: StaffSection;
  onNavigate: (section: StaffSection) => void;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onSignOut: () => void;
  /** Passed through for API parity with StaffOpsLayout; theme switching lives in settings. */
  isDbConnected: boolean;
  navItems: StaffNavItem[];
  screenTitle: string;
  navHighlight: StaffSection;
  showFinance: boolean;
  showSettings: boolean;
  showDisputes: boolean;
  bleed: boolean;
  onOpenLegal?: (page: LegalPageId) => void;
  hideHeader?: boolean;
  headerActions?: React.ReactNode;
  headerExtension?: React.ReactNode;
  headerOverride?: React.ReactNode;
}

export function StaffDesktopShell({
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
  bleed,
  onOpenLegal,
  hideHeader = false,
  headerActions,
  headerExtension,
  headerOverride,
}: StaffDesktopShellProps) {
  const accountMenu = {
    userName: currentUser.name,
    userSubtitle: ROLE_LABELS[currentUser.role],
    avatarUrl: currentUser.avatar,
    onOpenProfile: () => onNavigate('profile'),
    onOpenSettings: () => onNavigate('preferences'),
    onSignOut,
    active: activeSection === 'profile' || activeSection === 'preferences',
  };

  const brandingTrailing = isDbConnected ? (
    <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse shrink-0" aria-label="Connected" />
  ) : null;

  const railFooter = (
    <>
      <div className="desktop-nav-rail-account">
        <AccountMenu {...accountMenu} />
      </div>
      {onOpenLegal ? (
        <LegalFooterLinks onOpenLegal={onOpenLegal} className="justify-center mt-3" />
      ) : null}
    </>
  );

  const isMap = isStaffOpsMapSection(activeSection);
  const isMessages = isStaffMessagesSection(activeSection);

  return (
    <div className="desktop-workspace desktop-workspace--staff page-shell fixed inset-0 h-dvh max-h-dvh overflow-hidden bg-brand-bg text-brand-text">
      <StaffDesktopNav
        items={navItems}
        activeSection={navHighlight}
        onNavigate={onNavigate}
        showFinance={showFinance}
        showSettings={showSettings}
        showDisputes={showDisputes}
        footer={railFooter}
        brandingTrailing={brandingTrailing}
      />

      <div className="desktop-workspace-main">
        {!hideHeader ? (
          headerOverride ? (
            <div className="desktop-command-bar-slot shrink-0">{headerOverride}</div>
          ) : (
            <DesktopCommandBar
              title={screenTitle}
              subtitle="Staff operations console"
              notifications={headerActions}
              extension={headerExtension}
              showAccountMenu={false}
              variant={isMap ? 'map' : 'default'}
            />
          )
        ) : null}

        <main
          className={`desktop-workspace-canvas${
            bleed || isMap || isMessages ? ' desktop-workspace-canvas--bleed' : ''
          }`}
        >
          <div
            className={`desktop-workspace-canvas-inner h-full min-h-0 min-w-0 ${
              bleed || isMap || isMessages ? 'overflow-hidden' : 'overflow-x-hidden overflow-y-auto overscroll-contain'
            }`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
