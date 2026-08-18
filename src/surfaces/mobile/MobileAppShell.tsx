import React, { isValidElement, cloneElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, ChevronLeft, ChevronRight, Circle, type LucideIcon } from 'lucide-react';
import { buildMobileNavigation, type SurfaceDestination } from '../surfaceNavigation';
import { MobileBottomTabs } from './kit/MobileBottomTabs';
import { MobileSheet } from './kit/MobileSheet';
import type { SurfaceShellProps } from '../surfaceShellTypes';
import type { AccountMenuProps } from '../../components/layouts/AccountMenu';

/**
 * The mobile application shell.
 *
 * Structure: a 56px header band, an edge-to-edge scrolling canvas, and a fixed
 * bottom tab bar inside the safe area. Overflow destinations live in a bottom
 * sheet from the "More" tab. Account is a sheet opened from the avatar. There
 * is no sidebar, no hamburger of primary destinations, and no shell FAB —
 * primary actions stay on the page so they never cover a scrolling list.
 *
 * This shell shares nothing structural with the tablet or desktop shells.
 */
export function MobileAppShell({
  title,
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
}: SurfaceShellProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const navigation = useMemo(() => buildMobileNavigation(destinations), [destinations]);
  const moreActive = navigation.overflow.some((group) =>
    group.items.some((item) => item.id === activeId),
  );

  useEffect(() => {
    setMoreOpen(false);
    setAccountOpen(false);
  }, [activeId]);

  const handleNavigate = useCallback(
    (id: string) => {
      setMoreOpen(false);
      setAccountOpen(false);
      onNavigate(id);
    },
    [onNavigate],
  );

  const showTabs = !hidePrimaryNav && navigation.tabs.length > 0;
  // Primary actions belong on the page (sticky bar, list CTA, map card). A
  // shell FAB covers lists and duplicates those in-page controls.

  const accountSheet = isValidElement(accountMenu)
    ? cloneElement(accountMenu as React.ReactElement<AccountMenuProps>, {
        presentation: 'sheet',
        onDismiss: () => setAccountOpen(false),
      })
    : accountMenu;

  return (
    <div
      className="sf-shell sfm-shell"
      data-surface="mobile"
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
            ) : identity && accountMenu ? (
              <button
                type="button"
                className="sfm-shell-identity"
                onClick={() => setAccountOpen(true)}
                aria-label="Account"
              >
                {identity}
              </button>
            ) : (
              <span className="sfm-shell-head-spacer" aria-hidden />
            )}

            <h1 className="sfm-shell-title">{title}</h1>

            <div className="sfm-shell-actions">
              {notifications}
              {accountMenu && !identity ? (
                <button
                  type="button"
                  className="sfm-icon-btn"
                  onClick={() => setAccountOpen(true)}
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

      {showTabs ? (
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

      <MobileSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="More"
        snapPoints={['half', 'full']}
      >
        <div className="sfm-more">
          {(navigation.overflow.length > 0 ? navigation.overflow : [{ title: 'Destinations', items: navigation.tabs }]).map(
            (group) => (
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
            ),
          )}
          {navFooter ? <div className="sfm-more-footer">{navFooter}</div> : null}
        </div>
      </MobileSheet>

      <MobileSheet
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        title="Account"
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
