import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Block } from 'baseui/block';
import { HeadingXSmall, LabelSmall, ParagraphMedium } from 'baseui/typography';
import { Menu } from 'lucide-react';
import { useStyletron } from 'baseui';
import { Logo } from '../../Logo';
import { GuardrSideNav } from './GuardrSideNav';
import { GuardrBottomNav } from './GuardrBottomNav';
import { UberDirectTopHeader } from './UberDirectTopHeader';
import { resolveMobilityChrome } from './mobilityChrome';
import type { GuardrNavGroup, GuardrNavItem } from './types';
import { useDevice } from '../../../lib/platform';
import { prefersReducedMotion } from '../../../theme/motionTokens';

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
  hideHeader?: boolean;
  headerOverride?: React.ReactNode;
  headerExtension?: React.ReactNode;
  bleed?: boolean;
  variant?: 'default' | 'dark';
  children: React.ReactNode;
  ariaLabel?: string;
  showTitleBand?: boolean;
  /** Primary tabs for Uber-style bottom nav on mobile/PWA/APK. */
  mobileBottomNavItems?: GuardrNavItem[];
  mobileBottomNavOverflow?: GuardrNavItem[];
  /** Org/location selector shown in desktop page header (Uber Direct). */
  headerContext?: React.ReactNode;
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
  hideHeader = false,
  headerOverride,
  headerExtension,
  bleed = false,
  variant = 'default',
  children,
  ariaLabel = 'Main navigation',
  showTitleBand = false,
  mobileBottomNavItems,
  mobileBottomNavOverflow = [],
  headerContext,
}: GuardrDrawerShellProps) {
  const [, theme] = useStyletron();
  const { viewSurface, experienceTier } = useDevice();
  const chrome = useMemo(
    () => resolveMobilityChrome(viewSurface, experienceTier),
    [viewSurface, experienceTier],
  );
  const isMobile = chrome.layout === 'mobile';
  const isDesktopWorkspace = chrome.layout === 'desktop';
  const isFlowSidebar = !isMobile;
  const isMapMode = variant === 'dark';
  const useBottomNav = chrome.layout !== 'desktop' && !!mobileBottomNavItems?.length;
  const showChromeHeader = !hideHeader && !isDesktopWorkspace;
  const showPageTitleBand = showTitleBand && !hideHeader && !headerOverride;
  const [sidebarOpen, setSidebarOpen] = useState(chrome.defaultSidebarOpen);

  useEffect(() => {
    setSidebarOpen(chrome.defaultSidebarOpen);
  }, [chrome.defaultSidebarOpen, viewSurface]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((open) => !open), []);

  const handleNavigate = (id: string) => {
    onNavigate(id);
    if (isMobile) closeSidebar();
  };

  const sidebarVisible = sidebarOpen;
  const isMobileDrawer = isMobile;
  const sidebarCtaActions =
    sidebarPrimaryActions ?? (sidebarPrimaryAction ? [sidebarPrimaryAction] : []);
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
    border: `1px solid ${theme.colors.borderOpaque}`,
    backgroundColor: theme.colors.backgroundPrimary,
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
      className={`${isDesktopWorkspace ? 'uber-direct-sidebar' : 'mobility-drawer'}${useBottomNav ? ' mobility-drawer--bottom-nav' : ''}${sidebarVisible ? ' mobility-drawer--open' : ''}`.trim()}
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
            overflow: isMobileDrawer ? 'hidden' : 'hidden',
            transition: reducedMotion
              ? 'none'
              : isFlowSidebar
                ? 'width 220ms cubic-bezier(0.16, 1, 0.3, 1)'
                : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
            ...(isFlowSidebar
              ? {
                  position: 'relative',
                  height: '100%',
                  paddingTop: 'max(0px, env(safe-area-inset-top))',
                  paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
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
                  paddingTop: 'max(0px, env(safe-area-inset-top))',
                  paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  overscrollBehavior: 'contain',
                  WebkitOverflowScrolling: 'touch',
                }),
          },
        },
      }}
    >
      {/* Sidebar brand — hidden on Uber Direct desktop (logo lives in global top bar) */}
      {!isDesktopWorkspace ? (
      <Block
        className={isDesktopWorkspace ? 'uber-direct-sidebar-brand' : 'mobility-drawer-brand'}
        display="flex"
        alignItems="center"
        gridGap="scale400"
        paddingTop={chrome.layout === 'desktop' ? 'scale600' : 'scale600'}
        paddingBottom={chrome.layout === 'desktop' ? 'scale500' : 'scale500'}
        paddingLeft="scale600"
        paddingRight="scale600"
        backgroundColor="backgroundPrimary"
        overrides={{
          Block: {
            style: {
              borderBottom: isDesktopWorkspace
                ? 'none'
                : `1px solid ${theme.colors.borderOpaque}`,
              minWidth: isFlowSidebar ? chrome.sidebarWidth : drawerPanelWidth,
              flexShrink: 0,
            },
          },
        }}
      >
        <Logo
          size={chrome.layout === 'mobile' ? 26 : 24}
          className="shrink-0"
        />
        <Block flex="1" minWidth="0">
          <ParagraphMedium
            margin={0}
            className={isDesktopWorkspace ? 'uber-direct-wordmark' : undefined}
            $style={{
              fontFamily: '"Uber Move", "Helvetica Neue", Helvetica, Arial, sans-serif',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
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
                fontSize: '10px',
              }}
            >
              {workspaceLabel}
            </LabelSmall>
          ) : null}
        </Block>
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
        className={isDesktopWorkspace ? 'uber-direct-sidebar-nav' : 'mobility-drawer-scroll'}
        flex={isMobileDrawer ? undefined : '1'}
        minHeight={isMobileDrawer ? undefined : 0}
        overflow={isMobileDrawer ? 'visible' : 'auto'}
        paddingTop="scale300"
        paddingBottom="scale300"
        minWidth={isFlowSidebar ? chrome.sidebarWidth : drawerPanelWidth}
        backgroundColor="backgroundPrimary"
      >
        <GuardrSideNav groups={navGroups} activeId={activeNavId} onSelect={handleNavigate} ariaLabel={ariaLabel} />
      </Block>

      {sidebarFooter ? (
        <Block
          className={isDesktopWorkspace ? 'uber-direct-sidebar-footer' : undefined}
          paddingLeft="scale500"
          paddingRight="scale500"
          paddingBottom="scale400"
          minWidth={isFlowSidebar ? chrome.sidebarWidth : drawerPanelWidth}
        >
          {sidebarFooter}
        </Block>
      ) : null}
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
          paddingBottom="scale400"
          paddingLeft="scale500"
          paddingRight="scale500"
          backgroundColor="backgroundPrimary"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          overrides={{
            Block: {
              style: {
                borderBottom: `1px solid ${theme.colors.borderOpaque}`,
                flexShrink: 0,
                paddingTop: 'max(10px, env(safe-area-inset-top))',
                minHeight: 'var(--mobility-header-h, 56px)',
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

        {!hideHeader && !headerOverride && showPageTitleBand ? (
          <Block
            className={isDesktopWorkspace ? 'uber-direct-page-header' : undefined}
            paddingTop={isDesktopWorkspace ? 'scale800' : 'scale600'}
            paddingBottom={isDesktopWorkspace ? 'scale600' : 'scale600'}
            paddingLeft="scale800"
            paddingRight="scale800"
            backgroundColor="backgroundPrimary"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            overrides={{
              Block: {
                style: {
                  flexShrink: 0,
                  borderBottom: isDesktopWorkspace
                    ? `1px solid ${theme.colors.borderOpaque}`
                    : `1px solid ${theme.colors.borderOpaque}`,
                },
              },
            }}
          >
            <Block
              display="flex"
              alignItems="flex-start"
              justifyContent="space-between"
              gridGap="scale600"
            >
              <Block minWidth={0} flex="1">
                <ParagraphMedium
                  margin={0}
                  className={isDesktopWorkspace ? 'uber-direct-page-title' : undefined}
                  $style={{
                    fontFamily: '"Uber Move", "Helvetica Neue", Helvetica, Arial, sans-serif',
                    fontSize: isDesktopWorkspace ? '32px' : '28px',
                    fontWeight: 700,
                    lineHeight: 1.15,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {title}
                </ParagraphMedium>
                {!isDesktopWorkspace ? (
                  <LabelSmall marginTop="scale200" $style={{ color: 'contentSecondary' }}>
                    {workspaceLabel}
                  </LabelSmall>
                ) : null}
              </Block>
              {isDesktopWorkspace ? (
                <Block display="flex" alignItems="center" gridGap="scale400" overrides={{ Block: { style: { flexShrink: 0 } } }}>
                  {headerContext}
                  {notifications}
                </Block>
              ) : null}
            </Block>
          </Block>
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
            />
          </Block>
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
      flexDirection={isDesktopWorkspace ? 'column' : 'row'}
      height="100dvh"
      maxHeight="100dvh"
      overflow="hidden"
      backgroundColor="backgroundPrimary"
      color="contentPrimary"
      data-uber-shell=""
      data-mobility-layout={chrome.layout}
      data-sidebar-open={sidebarOpen ? 'true' : 'false'}
      data-view-surface={viewSurface}
      data-uber-direct={isDesktopWorkspace ? 'true' : undefined}
    >
      {isDesktopWorkspace ? (
        <UberDirectTopHeader
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
