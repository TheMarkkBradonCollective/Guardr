import React, { isValidElement, cloneElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, ChevronLeft, ChevronRight, Circle, Menu, type LucideIcon } from 'lucide-react';
import { buildMobileNavigation, groupDestinationsBySection, type SurfaceDestination } from '../surfaceNavigation';
import { MobileBottomTabs } from './kit/MobileBottomTabs';
import { MobileDrawerNav } from './kit/MobileDrawerNav';
import { MobileSheet } from './kit/MobileSheet';
import type { SurfaceShellProps } from '../surfaceShellTypes';
import type { AccountMenuProps } from '../../components/layouts/AccountMenu';
import { accountMenuUnreadCount } from '../../components/notifications/NotificationInboxSection';

type MobileAppShellProps = SurfaceShellProps;

function readAccountMenuProps(accountMenu: SurfaceShellProps['accountMenu']): AccountMenuProps | undefined {
  if (!accountMenu || !isValidElement(accountMenu)) return undefined;
  return accountMenu.props as AccountMenuProps;
}

/**
 * The mobile application shell.
 *
 * Default: 56px header, scrolling canvas, fixed bottom tabs + More sheet.
 * Drawer mode (`mobilePrimaryNav="drawer"`): hamburger opens a left sidebar with
 * every destination grouped by section — used for staff ops where the catalog
 * is too large for a bottom bar.
 */
export function MobileAppShell({
  title,
  workspaceLabel,
  destinations,
  activeId,
  onNavigate,
  children,
  notifications,
  accountMenu,
  identity,
  navFooter,
  headerOverride,
  headerExtension,
  hideChrome = false,
  hidePrimaryNav = false,
  bleed = false,
  onBack,
  mobilePrimaryNav = 'tabs',
  primaryAction,
}: MobileAppShellProps) {
  const useDrawerNav = mobilePrimaryNav === 'drawer';
  const [moreOpen, setMoreOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountSheetView, setAccountSheetView] = useState<'main' | 'notifications'>('main');

  const accountMenuProps = readAccountMenuProps(accountMenu);
  const showNotificationBell =
    accountMenuProps?.notifications &&
    accountMenuProps.onNotificationClick &&
    accountMenuProps.onMarkAllNotificationsRead;
  const notificationUnread = accountMenuUnreadCount(accountMenuProps?.notifications);

  const navigation = useMemo(
    () => (useDrawerNav ? null : buildMobileNavigation(destinations)),
    [destinations, useDrawerNav],
  );
  const drawerSections = useMemo(
    () =>
      groupDestinationsBySection(destinations.filter((item) => !item.disabled)),
    [destinations],
  );

  const moreActive =
    navigation?.overflow.some((group) => group.items.some((item) => item.id === activeId)) ?? false;

  useEffect(() => {
    setMoreOpen(false);
    setDrawerOpen(false);
    setAccountOpen(false);
  }, [activeId]);

  const handleNavigate = useCallback(
    (id: string) => {
      setMoreOpen(false);
      setDrawerOpen(false);
      setAccountOpen(false);
      onNavigate(id);
    },
    [onNavigate],
  );

  const showTabs = !hidePrimaryNav && !useDrawerNav && navigation && navigation.tabs.length > 0;
  const showDrawer = !hidePrimaryNav && useDrawerNav;

  const openAccountSheet = useCallback((view: 'main' | 'notifications') => {
    setAccountSheetView(view);
    setAccountOpen(true);
  }, []);

  const accountSheet = isValidElement(accountMenu)
    ? cloneElement(accountMenu as React.ReactElement<AccountMenuProps>, {
        presentation: 'sheet',
        sheetView: accountSheetView,
        onDismiss: () => setAccountOpen(false),
      })
    : accountMenu;

  const drawerPrimaryAction = primaryAction ? (
    <button type="button" className="sfm-drawer-cta" onClick={primaryAction.onClick}>
      {primaryAction.icon}
      <span>{primaryAction.label}</span>
    </button>
  ) : null;

  return (
    <div
      className="sf-shell sfm-shell"
      data-surface="mobile"
      data-nav={useDrawerNav ? 'drawer' : 'tabs'}
      data-tabs={showTabs ? 'true' : undefined}
      data-bleed={bleed ? 'true' : undefined}
    >
      {!hideChrome ? (
        headerOverride ? (
          <div className="sfm-shell-header sfm-shell-header--custom">{headerOverride}</div>
        ) : (
          <header className="sfm-shell-header">
            {onBack ? (
              <button type="button" className="sfm-icon-btn" onClick={onBack} aria-label="Back">
                <ChevronLeft size={24} strokeWidth={2.25} aria-hidden />
              </button>
            ) : showDrawer ? (
              <button
                type="button"
                className="sfm-icon-btn"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                aria-expanded={drawerOpen}
              >
                <Menu size={22} strokeWidth={2.25} aria-hidden />
              </button>
            ) : (
              <span className="sfm-shell-head-spacer" aria-hidden />
            )}

            <h1 className="sfm-shell-title">{title}</h1>

            <div className="sfm-shell-actions">
              {notifications}
              {showNotificationBell ? (
                <button
                  type="button"
                  className="sfm-icon-btn sfm-noti-btn"
                  onClick={() => openAccountSheet('notifications')}
                  aria-label={
                    notificationUnread > 0
                      ? `Notifications, ${notificationUnread} unread`
                      : 'Notifications'
                  }
                >
                  <Bell size={20} strokeWidth={2.25} aria-hidden />
                  {notificationUnread > 0 ? (
                    <span className="sfm-noti-badge">
                      {notificationUnread > 9 ? '9+' : notificationUnread}
                    </span>
                  ) : null}
                </button>
              ) : null}
              {identity && accountMenu ? (
                <button
                  type="button"
                  className="sfm-shell-identity sfm-shell-identity--header"
                  onClick={() => openAccountSheet('main')}
                  aria-label="Account"
                >
                  {identity}
                </button>
              ) : accountMenu ? (
                <button
                  type="button"
                  className="sfm-icon-btn"
                  onClick={() => openAccountSheet('main')}
                  aria-label="Account menu"
                >
                  <Bell size={20} strokeWidth={2.25} aria-hidden />
                </button>
              ) : null}
            </div>
          </header>
        )
      ) : null}

      {headerExtension && !hideChrome ? (
        <div className="sfm-shell-extension">{headerExtension}</div>
      ) : null}

      <main className="sfm-shell-canvas" data-bleed={bleed ? 'true' : undefined}>
        {children}
      </main>

      {showTabs && navigation ? (
        <MobileBottomTabs
          tabs={navigation.tabs}
          activeId={activeId}
          onNavigate={handleNavigate}
          showMore={navigation.hasOverflow}
          moreActive={moreActive}
          moreBadge={navigation.overflowBadge}
          onMore={() => setMoreOpen(true)}
        />
      ) : null}

      {showDrawer ? (
        <MobileDrawerNav
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sections={drawerSections}
          activeId={activeId}
          onNavigate={handleNavigate}
          workspaceLabel={workspaceLabel}
          footer={navFooter}
          primaryAction={drawerPrimaryAction}
        />
      ) : null}

      {!useDrawerNav ? (
        <MobileSheet
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          title="More"
          snapPoints={['half', 'full']}
        >
          <div className="sfm-more">
            {(navigation && navigation.overflow.length > 0
              ? navigation.overflow
              : [{ title: 'Destinations', items: navigation?.tabs ?? [] }]).map((group) => (
              <section className="sfm-more-group" key={group.title}>
                <h3 className="sfm-more-group-title">{group.title}</h3>
                <div className="sfm-more-list">
                  {group.items.map((item) => (
                    <MoreRow
                      key={item.id}
                      item={item}
                      active={item.id === activeId}
                      onSelect={() => handleNavigate(item.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
            {navFooter ? <div className="sfm-more-footer">{navFooter}</div> : null}
          </div>
        </MobileSheet>
      ) : null}

      <MobileSheet
        open={accountOpen}
        onClose={() => {
          setAccountOpen(false);
          setAccountSheetView('main');
        }}
        title={accountSheetView === 'notifications' ? 'Notifications' : 'Account'}
        snapPoints={['half', 'full']}
      >
        <div className="sfm-account-sheet">{accountSheet}</div>
      </MobileSheet>
    </div>
  );
}

function MoreRow({
  item,
  active,
  onSelect,
}: {
  item: SurfaceDestination;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon: LucideIcon = item.icon ?? Circle;
  return (
    <button
      type="button"
      className="sfm-more-row"
      data-active={active ? 'true' : undefined}
      onClick={onSelect}
    >
      <span className="sfm-more-row-icon">
        <Icon size={22} strokeWidth={2} aria-hidden />
      </span>
      <span className="sfm-more-row-label">{item.label}</span>
      {item.badge != null && item.badge > 0 ? (
        <span className="sfm-more-row-badge">{item.badge > 9 ? '9+' : item.badge}</span>
      ) : null}
      <ChevronRight size={18} strokeWidth={2} className="sfm-more-row-chevron" aria-hidden />
    </button>
  );
}
