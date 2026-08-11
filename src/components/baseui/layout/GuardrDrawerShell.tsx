import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Block } from 'baseui/block';
import { HeadingXSmall, LabelSmall, ParagraphMedium } from 'baseui/typography';
import { ChevronRight, Menu } from 'lucide-react';
import { useStyletron } from 'baseui';
import { Logo } from '../../Logo';
import { GuardrSideNav } from './GuardrSideNav';
import { GuardrBottomNav } from './GuardrBottomNav';
import { GuardrIconRail } from './GuardrIconRail';
import { DirectTopHeader } from './DirectTopHeader';
import { resolveMobilityChrome, type MobilityLayout } from './mobilityChrome';
import type { GuardrNavGroup, GuardrNavItem } from './types';
import { useDevice } from '../../../lib/platform';
import type { ViewSurface } from '../../../lib/platform/viewSurface';
import { prefersReducedMotion } from '../../../theme/motionTokens';
import { MoreMenuSheet } from '../../layouts/MoreMenuSheet';
import type { BottomNavItem } from '../../layouts/BottomNavBar';
import { FONT_DISPLAY } from '../../../theme/typography';

/** desktop workspace's rail tops out around a dozen icons before it needs scrolling. */
const RAIL_MAX_ITEMS = 12;

export interface SidebarPrimaryAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export interface GuardrDrawerShellProps {
  workspaceLabel: string;
  title: string;
  navGroups: GuardrNavGroup[];
  activeNavId: string;
  onNavigate: (id: string) => void;
  accountMenu: React.ReactNode;
  notifications?: React.ReactNode;
  sidebarBrandExtra?: React.ReactNode;
  sidebarPrimaryAction?: SidebarPrimaryAction;
  /** When set, renders stacked sidebar CTAs (e.g. Applications: add guard + add client). */
  sidebarPrimaryActions?: SidebarPrimaryAction[];
  sidebarFooter?: React.ReactNode;
  /** Guardr-style mobile drawer header — avatar + name instead of logo. */
  sidebarIdentity?: React.ReactNode;
  hideHeader?: boolean;
  headerOverride?: React.ReactNode;
  headerExtension?: React.ReactNode;
  bleed?: boolean;
  variant?: 'default' | 'dark';
  children: React.ReactNode;
  ariaLabel?: string;
  /** Force the desktop workspace page title band on surfaces that opt out by default. */
  showTitleBand?: boolean;
  /** Breadcrumb parent rendered before the page title, e.g. "Jobs". */
  pageBreadcrumb?: string;
  /** Actions rendered on the right of the page title band. */
  pageActions?: React.ReactNode;
  /** Primary tabs for Guardr-style bottom nav on mobile/PWA/APK. */
  mobileBottomNavItems?: GuardrNavItem[];
  mobileBottomNavOverflow?: GuardrNavItem[];
  /** Org/location selector shown in desktop page header (Guardr Direct). */
  headerContext?: React.ReactNode;
  /**
   * Pin chrome to one layout regardless of viewport form factor.
   * Used when the three-surface router loads this shell for mobile only
   * (`?ui=mobile` on a wide display still needs the phone drawer + footer).
   */
  forceLayout?: MobilityLayout;
}

export function GuardrDrawerShell({
  workspaceLabel,
  title,
  navGroups,
  activeNavId,
  onNavigate,
  accountMenu,
  notifications,
  sidebarBrandExtra,
  sidebarPrimaryAction,
  sidebarPrimaryActions,
  sidebarFooter,
  sidebarIdentity,
  hideHeader = false,
  headerOverride,
  headerExtension,
  bleed = false,
  variant = 'default',
  children,
  ariaLabel = 'Main navigation',
  showTitleBand,
  pageBreadcrumb,
  pageActions,
  mobileBottomNavItems,
  mobileBottomNavOverflow = [],
  headerContext,
  forceLayout,
}: GuardrDrawerShellProps) {
  const [, theme] = useStyletron();
  const { viewSurface, experienceTier } = useDevice();
  const chrome = useMemo(() => {
    if (!forceLayout) return resolveMobilityChrome(viewSurface, experienceTier);
    const [shellKind] = viewSurface.split('-');
    const forcedSurface = `${shellKind}-${forceLayout}` as ViewSurface;
    return resolveMobilityChrome(forcedSurface, experienceTier);
  }, [viewSurface, experienceTier, forceLayout]);
  const isMobile = chrome.layout === 'mobile';
  const isDesktopWorkspace = chrome.layout === 'desktop';
  const isFlowSidebar = !isMobile;
  const isMapMode = variant === 'dark';
  const useBottomNav = chrome.layout === 'mobile' && !!mobileBottomNavItems?.length;
  const showChromeHeader = !hideHeader && !isDesktopWorkspace;
  const showPageTitleBand =
    (showTitleBand ?? chrome.showPageTitleBand) && !hideHeader && !headerOverride && !bleed;
  const [sidebarOpen, setSidebarOpen] = useState(chrome.defaultSidebarOpen);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(chrome.defaultSidebarOpen);
  }, [chrome.defaultSidebarOpen, viewSurface]);

  useEffect(() => {
    setMoreOpen(false);
  }, [viewSurface, activeNavId]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((open) => !open), []);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  const openMore = useCallback(() => setMoreOpen(true), []);

  const handleNavigate = (id: string) => {
    onNavigate(id);
    if (isMobile) closeSidebar();
    setMoreOpen(false);
  };

  // The rail is navigation, not chrome: it stays put on full-bleed map and
  // active-shift screens that suppress the page header.
  // Desktop: icon rail only when the labelled panel is collapsed (desktop ops workspace).
  const showIconRail = chrome.showIconRail && (!isDesktopWorkspace || !sidebarOpen);
  const showHeaderSidebarToggle = isDesktopWorkspace && chrome.collapsibleSidebar && sidebarOpen;

  // desktop ops workspace puts every workspace destination on the rail, so it stays
  // usable with the labelled panel collapsed. Taking only the first nav group
  // left the rail with two icons beside a full-width text drawer.
  const railItems = useMemo(() => {
    const seen = new Set<string>();
    return navGroups
      .flatMap((group) => group.items)
      .filter((item) => {
        if (!item.icon || item.disabled || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .slice(0, RAIL_MAX_ITEMS);
  }, [navGroups]);

  const overflowItems = mobileBottomNavOverflow ?? [];
  const showMoreTab = useBottomNav && overflowItems.length > 0;
  const moreActive = showMoreTab && overflowItems.some((item) => item.id === activeNavId);
  const moreBadge = overflowItems.reduce((sum, item) => sum + (item.badge && item.badge > 0 ? item.badge : 0), 0);
  const moreSheetItems = overflowItems as BottomNavItem[];

  const sidebarVisible = sidebarOpen;
  const isMobileDrawer = isMobile;
  const sidebarCtaActions =
    sidebarPrimaryActions ?? (sidebarPrimaryAction ? [sidebarPrimaryAction] : []);

  const resolvedPageActions = useMemo(() => {
    if (pageActions) return pageActions;
    if (!isDesktopWorkspace || bleed || hideHeader) return undefined;
    const action = sidebarPrimaryAction ?? sidebarPrimaryActions?.[0];
    if (!action) return undefined;
    return (
      <button type="button" className="uber-direct-page-cta" onClick={action.onClick}>
        {action.icon}
        <span>{action.label}</span>
      </button>
    );
  }, [
    pageActions,
    isDesktopWorkspace,
    bleed,
    hideHeader,
    sidebarPrimaryAction,
    sidebarPrimaryActions,
  ]);
  const showDrawerBackdrop = sidebarVisible && isMobileDrawer;
  const flowSidebarWidth = sidebarVisible ? chrome.sidebarWidth : '0px';
  const drawerPanelWidth = chrome.drawerWidth;
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    if (!sidebarOpen || !isMobile) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSidebar();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen, isMobile, closeSidebar]);

  const iconSize = chrome.touchTargetPx;

  const iconBtnStyle = {
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    minWidth: `${iconSize}px`,
    minHeight: `${iconSize}px`,
    borderRadius: chrome.nativeChrome || chrome.premiumChrome ? '12px' : '10px',
    // Base Web app headers use a ghost icon button; the outlined chip only
    // appears when the header floats over a map.
    border: isMapMode ? `1px solid ${theme.colors.borderOpaque}` : 'none',
    backgroundColor: isMapMode ? theme.colors.backgroundPrimary : 'transparent',
    color: theme.colors.contentPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    transition: reducedMotion ? 'none' : 'background-color 150ms ease, transform 150ms ease',
    ':hover': {
      backgroundColor: theme.colors.backgroundSecondary,
    },
    ':active': {
      transform: reducedMotion ? 'none' : 'scale(0.96)',
    },
  } as const;

  const contentPadding = bleed
    ? '0'
    : chrome.layout === 'mobile'
      ? 'scale500'
      : chrome.layout === 'tablet'
        ? 'scale600'
        : 'scale800';

  const sidebarNode = (
    <Block
      as="aside"
      className={`${isDesktopWorkspace ? 'uber-direct-sidebar' : 'mobility-drawer mobility-drawer--uber-menu'}${useBottomNav ? ' mobility-drawer--bottom-nav' : ''}${sidebarVisible ? ' mobility-drawer--open' : ''}`.trim()}
      aria-label={ariaLabel}
      aria-hidden={!sidebarVisible}
      display="flex"
      flexDirection="column"
      width={isFlowSidebar ? flowSidebarWidth : drawerPanelWidth}
      backgroundColor="backgroundPrimary"
      overrides={{
        Block: {
          style: {
            flexShrink: 0,
            borderRight: sidebarVisible ? `1px solid ${theme.colors.borderOpaque}` : 'none',
            overflow: 'hidden',
            // A zero-width panel still holds its links in the tab order;
            // visibility takes them out without breaking the width transition.
            visibility: sidebarVisible ? 'visible' : 'hidden',
            transition: reducedMotion
              ? 'none'
              : isFlowSidebar
                ? 'width 220ms cubic-bezier(0.16, 1, 0.3, 1)'
                : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
            ...(isFlowSidebar
              ? {
                  position: 'relative',
                  height: '100%',
                  // Shell owns the top inset for flow rails so brand + main header share one band.
                  paddingTop: 0,
                  paddingBottom: 'max(0px, var(--gr-safe-area-bottom, env(safe-area-inset-bottom, 0px)))',
                }
              : {
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: drawerPanelWidth,
                  zIndex: 130,
                  pointerEvents: sidebarVisible ? 'auto' : 'none',
                  transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
                  boxShadow: sidebarVisible ? '8px 0 32px rgba(0, 0, 0, 0.12)' : 'none',
                  paddingTop: 'max(0px, var(--gr-safe-area-top, env(safe-area-inset-top, 0px)))',
                  paddingBottom: 'max(0px, var(--gr-safe-area-bottom, env(safe-area-inset-bottom, 0px)))',
                  // Keep brand header fixed — nav + footer scroll together.
                  overflow: 'hidden',
                }),
          },
        },
      }}
    >
      {/* Sidebar brand — hidden on Guardr Direct desktop (logo lives in global top bar) */}
      {!isDesktopWorkspace ? (
      <Block
        className={isDesktopWorkspace ? 'uber-direct-sidebar-brand' : 'mobility-drawer-brand'}
        display="flex"
        alignItems="center"
        gridGap="scale400"
        paddingLeft="scale500"
        paddingRight="scale500"
        backgroundColor="backgroundPrimary"
        overrides={{
          Block: {
            style: {
              borderBottom: isDesktopWorkspace
                ? 'none'
                : sidebarIdentity
                  ? 'none'
                  : `1px solid ${theme.colors.borderOpaque}`,
              minWidth: isFlowSidebar ? chrome.sidebarWidth : drawerPanelWidth,
              flexShrink: 0,
              boxSizing: 'border-box',
              ...(sidebarIdentity
                ? {
                    height: 'auto',
                    minHeight: 'auto',
                    maxHeight: 'none',
                    paddingTop: '20px',
                    paddingBottom: '12px',
                  }
                : {
                    height: 'var(--mobility-header-h, 56px)',
                    minHeight: 'var(--mobility-header-h, 56px)',
                    maxHeight: 'var(--mobility-header-h, 56px)',
                    paddingTop: 0,
                    paddingBottom: 0,
                  }),
            },
          },
        }}
      >
        {sidebarIdentity ?? (
          <>
        <Logo
          size={chrome.layout === 'mobile' ? 32 : 30}
          className="shrink-0"
        />
        <Block flex="1" minWidth="0">
          <ParagraphMedium
            margin={0}
            className={isDesktopWorkspace ? 'uber-direct-wordmark' : undefined}
            $style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              fontSize: '18px',
              color: theme.colors.contentPrimary,
            }}
          >
            Guardr
          </ParagraphMedium>
          {!isDesktopWorkspace ? (
            <LabelSmall
              margin={0}
              $style={{
                color: theme.colors.contentSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontSize: '9px',
                lineHeight: 1.2,
              }}
            >
              {workspaceLabel}
            </LabelSmall>
          ) : null}
        </Block>
          </>
        )}
        {isFlowSidebar ? sidebarBrandExtra : null}
      </Block>
      ) : null}

      {isDesktopWorkspace && sidebarCtaActions.length > 0 ? (
        <div className="uber-direct-sidebar-cta-wrap">
          {sidebarCtaActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="uber-direct-sidebar-cta"
              onClick={action.onClick}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      ) : null}

      <Block
        flex="1"
        minHeight={0}
        display="flex"
        flexDirection="column"
        minWidth={isFlowSidebar ? chrome.sidebarWidth : drawerPanelWidth}
        backgroundColor="backgroundPrimary"
      >
        <Block
          className={isDesktopWorkspace ? 'uber-direct-sidebar-nav' : 'mobility-drawer-scroll'}
          flex="1"
          minHeight={0}
          overflow="auto"
          paddingTop="scale300"
          paddingBottom="scale300"
          backgroundColor="backgroundPrimary"
          overrides={{
            Block: {
              style: {
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
              },
            },
          }}
        >
          <GuardrSideNav
            groups={navGroups}
            activeId={activeNavId}
            onSelect={handleNavigate}
            ariaLabel={ariaLabel}
            hideIcons={!isDesktopWorkspace}
            hideGroupHeaders={!isDesktopWorkspace}
          />
        </Block>
        {sidebarFooter ? (
          <Block
            className={isDesktopWorkspace ? 'uber-direct-sidebar-footer' : 'mobility-drawer-footer'}
            paddingLeft="scale400"
            paddingRight="scale400"
            paddingTop="scale200"
            paddingBottom="scale200"
            minWidth={isDesktopWorkspace ? chrome.sidebarWidth : undefined}
            overrides={{
              Block: {
                style: {
                  flexShrink: 0,
                },
              },
            }}
          >
            {sidebarFooter}
          </Block>
        ) : null}
      </Block>
    </Block>
  );

  const workspaceBody = (
    <>
      {!isMobileDrawer ? sidebarNode : null}

      <Block
        flex="1"
        display="flex"
        flexDirection="column"
        minWidth={0}
        minHeight={0}
        className={`mobility-content-pane${showDrawerBackdrop ? ' mobility-content-pane--drawer-open' : ''}`}
      >
      {showChromeHeader ? (
        <Block
          className={`mobility-header${chrome.headerGlass ? ' mobility-header--glass' : ''}${chrome.nativeChrome ? ' mobility-header--native' : ''}`}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gridGap="scale400"
          paddingLeft="scale500"
          paddingRight="scale500"
          backgroundColor="backgroundPrimary"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          overrides={{
            Block: {
              style: {
                borderBottom: `1px solid ${theme.colors.borderOpaque}`,
                flexShrink: 0,
                boxSizing: 'border-box',
                // Same chrome band as .mobility-drawer-brand (safe-area lives on the shell / drawer).
                height: 'var(--mobility-header-h, 56px)',
                minHeight: 'var(--mobility-header-h, 56px)',
                maxHeight: 'var(--mobility-header-h, 56px)',
                paddingTop: 0,
                paddingBottom: 0,
              },
            },
          }}
        >
          <Block display="flex" alignItems="center" gridGap="scale400" minWidth={0} flex="1">
            <Block
              as="button"
              type="button"
              className="mobility-icon-btn"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={sidebarOpen}
              overrides={{
                Block: {
                  style: iconBtnStyle,
                },
              }}
            >
              <Menu size={18} />
            </Block>
            <Block minWidth={0}>
              <HeadingXSmall
                margin={0}
                $style={{
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: theme.colors.contentPrimary,
                }}
                className="truncate"
              >
                {title}
              </HeadingXSmall>
              {chrome.layout !== 'mobile' ? (
                <LabelSmall
                  margin={0}
                  $style={{ color: theme.colors.contentSecondary }}
                  className="truncate"
                >
                  {workspaceLabel}
                </LabelSmall>
              ) : null}
            </Block>
          </Block>

          <Block display="flex" alignItems="center" gridGap="scale300" overrides={{ Block: { style: { flexShrink: 0 } } }}>
            {notifications}
            {accountMenu}
          </Block>
        </Block>
        ) : null}

        {!hideHeader && headerOverride ? (
          <Block
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            overrides={{
              Block: {
                style: {
                  flexShrink: 0,
                  borderBottom: `1px solid ${theme.colors.borderOpaque}`,
                },
              },
            }}
          >
            {headerOverride}
          </Block>
        ) : null}

        {showPageTitleBand ? (
          <div className="uber-page-band" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="uber-page-band-main">
              <h1 className="uber-page-band-title">
                {pageBreadcrumb ? (
                  <>
                    <span className="uber-page-band-crumb">{pageBreadcrumb}</span>
                    <ChevronRight size={22} aria-hidden className="uber-page-band-crumb-sep" />
                  </>
                ) : null}
                <span className="uber-page-band-current">{title}</span>
              </h1>
              {headerContext ? (
                <div className="uber-page-band-context">{headerContext}</div>
              ) : null}
            </div>
            {resolvedPageActions ? <div className="uber-page-band-actions">{resolvedPageActions}</div> : null}
          </div>
        ) : null}

        {headerExtension ? (
          <Block onClick={(e: React.MouseEvent) => e.stopPropagation()} overrides={{ Block: { style: { flexShrink: 0 } } }}>
            {headerExtension}
          </Block>
        ) : null}

        <Block
          as="main"
          flex="1"
          minHeight={0}
          minWidth={0}
          overflow="hidden"
          backgroundColor="backgroundPrimary"
          className="uber-shell-content"
          data-page-band={showPageTitleBand ? 'true' : undefined}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          overrides={{
            Block: {
              style: {
                position: 'relative',
                zIndex: 2,
              },
            },
          }}
        >
          <Block
            className={`mobility-content-inner${isDesktopWorkspace ? ` uber-direct-content-inner${bleed ? ' uber-direct-content-inner--bleed' : ''}` : ''}`}
            height="100%"
            maxWidth={chrome.contentMaxWidth ?? '100%'}
            minWidth={0}
            marginLeft="auto"
            marginRight="auto"
            overflow={bleed ? 'hidden' : 'auto'}
            padding={contentPadding}
            overrides={{
              Block: {
                style: {
                  overscrollBehavior: 'contain',
                },
              },
            }}
          >
            {children}
          </Block>
        </Block>

        {useBottomNav && mobileBottomNavItems ? (
          <Block onClick={(e: React.MouseEvent) => e.stopPropagation()} overrides={{ Block: { style: { flexShrink: 0 } } }}>
            <GuardrBottomNav
              items={mobileBottomNavItems}
              activeId={activeNavId}
              onNavigate={handleNavigate}
              showMore={showMoreTab}
              moreActive={moreActive}
              moreBadge={moreBadge}
              onMoreClick={openMore}
            />
          </Block>
        ) : null}

        {showMoreTab ? (
          <MoreMenuSheet
            open={moreOpen}
            items={moreSheetItems}
            activeId={activeNavId}
            onNavigate={handleNavigate}
            onClose={closeMore}
          />
        ) : null}
      </Block>
    </>
  );

  return (
    <Block
      className={`uber-app-shell mobility-shell mobility-shell--${chrome.shellKind} page-shell`}
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      display="flex"
      flexDirection="row"
      height="100dvh"
      maxHeight="100dvh"
      overflow="hidden"
      backgroundColor="backgroundPrimary"
      color="contentPrimary"
      data-uber-shell=""
      data-mobility-layout={chrome.layout}
      data-sidebar-open={sidebarOpen ? 'true' : 'false'}
      data-view-surface={forceLayout ? (`${viewSurface.split('-')[0]}-${forceLayout}` as ViewSurface) : viewSurface}
      data-uber-direct={isDesktopWorkspace ? 'true' : undefined}
      data-icon-rail={showIconRail ? 'true' : undefined}
    >
      {showIconRail ? (
        <GuardrIconRail
          items={railItems}
          activeId={activeNavId}
          onSelect={handleNavigate}
          onToggleSidebar={chrome.collapsibleSidebar ? toggleSidebar : undefined}
          sidebarOpen={sidebarOpen}
          width={chrome.iconRailWidth}
          ariaLabel="Primary navigation"
        />
      ) : null}

      <Block
        display="flex"
        flexDirection="column"
        flex="1"
        minWidth={0}
        minHeight={0}
      >
        {isDesktopWorkspace ? (
          <DirectTopHeader
            contextLabel={workspaceLabel}
            leading={
              showHeaderSidebarToggle ? (
                <button
                  type="button"
                  className="uber-direct-sidebar-toggle"
                  onClick={toggleSidebar}
                  aria-expanded={sidebarOpen}
                  aria-label={sidebarOpen ? 'Collapse navigation' : 'Expand navigation'}
                >
                  <Menu size={20} strokeWidth={2} aria-hidden />
                </button>
              ) : undefined
            }
            trailing={
              <Block display="flex" alignItems="center" gridGap="scale300">
                {notifications}
                {accountMenu}
              </Block>
            }
          />
        ) : null}

        <Block
          display="flex"
          flexDirection="row"
          flex="1"
          minHeight={0}
          minWidth={0}
          className={isDesktopWorkspace ? 'uber-direct-workspace-body' : undefined}
        >
          {workspaceBody}
        </Block>
      </Block>

      {isMobileDrawer && showDrawerBackdrop ? (
        <Block
          className="mobility-drawer-backdrop"
          role="presentation"
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          onClick={closeSidebar}
          overrides={{
            Block: {
              style: {
                zIndex: 120,
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                pointerEvents: 'auto',
                cursor: 'default',
              },
            },
          }}
        />
      ) : null}

      {isMobileDrawer ? sidebarNode : null}
    </Block>
  );
}
