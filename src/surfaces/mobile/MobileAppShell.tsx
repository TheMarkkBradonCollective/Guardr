import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, ChevronLeft, Circle, Menu } from 'lucide-react';
import { buildMobileNavigation, type SurfaceDestination } from '../surfaceNavigation';
import { MobileBottomTabs } from './kit/MobileBottomTabs';
import { MobileSheet } from './kit/MobileSheet';
import type { SurfaceShellProps } from '../surfaceShellTypes';

/**
 * The mobile application shell.
 *
 * Structure: a 56px header band, an edge-to-edge scrolling canvas, and a fixed
 * bottom tab bar inside the safe area. There is no sidebar, no drawer of primary
 * destinations, and no page title band — overflow destinations live in a bottom
 * sheet reachable from the "More" tab, and the account menu is a sheet too.
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

  // Navigating always closes the sheets, otherwise the overlay would sit on top
  // of the screen the user just asked for.
  useEffect(() => {
    setMoreOpen(false);
    setAccountOpen(false);
  }, [activeId]);

  const handleNavigate = useCallback(
    (id: string) => {
      setMoreOpen(false);
      onNavigate(id);
    },
    [onNavigate],
  );

  const showTabs = !hidePrimaryNav && navigation.tabs.length > 0;

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
            ) : identity ? (
              <button
                type="button"
                className="sfm-shell-identity"
                onClick={() => setAccountOpen(true)}
                aria-label="Account"
              >
                {identity}
              </button>
            ) : (
              <button
                type="button"
                className="sfm-icon-btn"
                onClick={() => setMoreOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={22} strokeWidth={2.25} aria-hidden />
              </button>
            )}

            <h1 className="sfm-shell-title">{title}</h1>

            <div className="sfm-shell-actions">
              {notifications}
              {accountMenu ? (
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
        title="All destinations"
        snapPoints={['half', 'full']}
      >
        <div className="sfm-more">
          {navigation.overflow.map((group) => (
            <section className="sfm-more-group" key={group.title}>
              <h3 className="sfm-more-group-title">{group.title}</h3>
              <div className="sfm-more-grid">
                {group.items.map((item) => (
                  <MoreTile
                    key={item.id}
                    item={item}
                    active={item.id === activeId}
                    onSelect={() => handleNavigate(item.id)}
                  />
                ))}
              </div>
            </section>
          ))}
          {navigation.overflow.length === 0 ? (
            <section className="sfm-more-group">
              <h3 className="sfm-more-group-title">Destinations</h3>
              <div className="sfm-more-grid">
                {navigation.tabs.map((item) => (
                  <MoreTile
                    key={item.id}
                    item={item}
                    active={item.id === activeId}
                    onSelect={() => handleNavigate(item.id)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </MobileSheet>

      <MobileSheet
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        title="Account"
        snapPoints={['peek', 'half']}
      >
        <div className="sfm-account-sheet">{accountMenu}</div>
      </MobileSheet>
    </div>
  );
}

function MoreTile({
  item,
  active,
  onSelect,
}: {
  item: SurfaceDestination;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = item.icon ?? Circle;
  return (
    <button
      type="button"
      className="sfm-more-tile"
      data-active={active ? 'true' : undefined}
      onClick={onSelect}
    >
      <span className="sfm-more-tile-icon">
        <Icon size={22} strokeWidth={2} aria-hidden />
        {item.badge != null && item.badge > 0 ? (
          <span className="sfm-more-tile-badge">{item.badge > 9 ? '9+' : item.badge}</span>
        ) : null}
      </span>
      <span className="sfm-more-tile-label">{item.label}</span>
    </button>
  );
}
