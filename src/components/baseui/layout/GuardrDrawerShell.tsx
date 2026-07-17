import React, { useCallback, useEffect, useState } from 'react';
import { Block } from 'baseui/block';
import { HeadingXSmall, LabelSmall, ParagraphMedium } from 'baseui/typography';
import { Menu, Settings } from 'lucide-react';
import { useStyletron } from 'baseui';
import { Logo } from '../../Logo';
import { GuardrSideNav } from './GuardrSideNav';
import type { GuardrNavGroup } from './types';
import { useDevice } from '../../../lib/platform';
import { prefersReducedMotion } from '../../../theme/motionTokens';

const SIDEBAR_WIDTH = '260px';
const SIDEBAR_COLLAPSED = '0px';

export interface GuardrDrawerShellProps {
  workspaceLabel: string;
  title: string;
  navGroups: GuardrNavGroup[];
  activeNavId: string;
  onNavigate: (id: string) => void;
  accountMenu: React.ReactNode;
  notifications?: React.ReactNode;
  sidebarBrandExtra?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  hideHeader?: boolean;
  headerOverride?: React.ReactNode;
  headerExtension?: React.ReactNode;
  bleed?: boolean;
  variant?: 'default' | 'dark';
  onSettingsClick?: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
  /** Large title band below the top bar (off by default — Uber-style compact chrome). */
  showTitleBand?: boolean;
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
  sidebarFooter,
  hideHeader = false,
  headerOverride,
  headerExtension,
  bleed = false,
  variant = 'default',
  onSettingsClick,
  children,
  ariaLabel = 'Main navigation',
  showTitleBand = false,
}: GuardrDrawerShellProps) {
  const [, theme] = useStyletron();
  const { formFactor } = useDevice();
  const isDesktop = formFactor === 'desktop';
  const isMapMode = variant === 'dark';
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop);

  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((open) => !open), []);

  const handleNavigate = (id: string) => {
    onNavigate(id);
    if (!isDesktop) closeSidebar();
  };

  const showDrawerBackdrop = sidebarOpen && !isDesktop;
  const sidebarVisible = sidebarOpen;
  const sidebarWidth = sidebarVisible ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED;

  useEffect(() => {
    if (!sidebarOpen || isDesktop) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSidebar();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen, isDesktop, closeSidebar]);

  const reducedMotion = prefersReducedMotion();

  const iconBtnStyle = {
    width: '40px',
    height: '40px',
    minWidth: '40px',
    minHeight: '40px',
    borderRadius: '10px',
    border: `1px solid ${theme.colors.borderOpaque}`,
    backgroundColor: theme.colors.backgroundPrimary,
    color: theme.colors.contentPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    transition: 'background-color 150ms ease, transform 150ms ease',
    ':hover': {
      backgroundColor: theme.colors.backgroundSecondary,
    },
    ':active': {
      transform: 'scale(0.96)',
    },
  } as const;

  const sidebarNode = (
    <Block
      as="aside"
      aria-label={ariaLabel}
      aria-hidden={!sidebarVisible}
      display="flex"
      flexDirection="column"
      width={isDesktop ? sidebarWidth : '0px'}
      backgroundColor="backgroundPrimary"
      overrides={{
        Block: {
          style: {
            flexShrink: 0,
            borderRight: sidebarVisible ? `1px solid ${theme.colors.borderOpaque}` : 'none',
            overflow: 'hidden',
            transition: reducedMotion
              ? 'none'
              : isDesktop
                ? 'width 220ms cubic-bezier(0.16, 1, 0.3, 1)'
                : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
            ...(isDesktop
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
                  zIndex: 50,
                  transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
                  boxShadow: sidebarVisible ? '8px 0 32px rgba(0, 0, 0, 0.12)' : 'none',
                  paddingTop: 'max(0px, env(safe-area-inset-top))',
                  paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
                }),
          },
        },
      }}
    >
      <Block
        display="flex"
        alignItems="center"
        gridGap="scale400"
        paddingTop="scale600"
        paddingBottom="scale500"
        paddingLeft="scale600"
        paddingRight="scale600"
        overrides={{
          Block: {
            style: {
              borderBottom: `1px solid ${theme.colors.borderOpaque}`,
              minWidth: SIDEBAR_WIDTH,
            },
          },
        }}
      >
        <Logo size={28} className="shrink-0" />
        <Block flex="1" minWidth="0">
          <ParagraphMedium margin={0} $style={{ fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            Guard<span className="uber-text-accent">r</span>
          </ParagraphMedium>
          <LabelSmall margin={0} $style={{ color: 'contentSecondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {workspaceLabel}
          </LabelSmall>
        </Block>
        {sidebarBrandExtra}
      </Block>

      <Block flex="1" minHeight={0} overflow="auto" paddingTop="scale300" paddingBottom="scale300" minWidth={SIDEBAR_WIDTH}>
        <GuardrSideNav groups={navGroups} activeId={activeNavId} onSelect={handleNavigate} ariaLabel={ariaLabel} />
      </Block>

      {sidebarFooter ? (
        <Block paddingLeft="scale500" paddingRight="scale500" paddingBottom="scale400" minWidth={SIDEBAR_WIDTH}>
          {sidebarFooter}
        </Block>
      ) : null}
    </Block>
  );

  return (
    <Block
      className="uber-app-shell page-shell"
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
      data-sidebar-open={sidebarOpen ? 'true' : 'false'}
      data-form-factor-shell={formFactor}
    >
      {showDrawerBackdrop ? (
        <Block
          as="button"
          type="button"
          onClick={closeSidebar}
          aria-label="Close navigation"
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="rgba(0, 0, 0, 0.35)"
          overrides={{
            Block: {
              style: {
                zIndex: 40,
                border: 'none',
                padding: 0,
                margin: 0,
                cursor: 'default',
              },
            },
          }}
        />
      ) : null}

      {sidebarNode}

      <Block
        flex="1"
        display="flex"
        flexDirection="column"
        minWidth={0}
        minHeight={0}
        onClick={showDrawerBackdrop ? closeSidebar : undefined}
      >

        <Block
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
                minHeight: '56px',
              },
            },
          }}
        >
          <Block display="flex" alignItems="center" gridGap="scale400" minWidth={0} flex="1">
            <Block
              as="button"
              type="button"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={sidebarOpen}
              overrides={{ Block: { style: iconBtnStyle } }}
            >
              <Menu size={18} />
            </Block>
            <Block minWidth={0}>
              <HeadingXSmall margin={0} $style={{ fontWeight: 700, lineHeight: 1.2 }} className="truncate">
                {title}
              </HeadingXSmall>
              <LabelSmall margin={0} $style={{ color: 'contentSecondary' }} className="truncate">
                {workspaceLabel}
              </LabelSmall>
            </Block>
          </Block>

          <Block display="flex" alignItems="center" gridGap="scale300" overrides={{ Block: { style: { flexShrink: 0 } } }}>
            {notifications}
            {accountMenu}
            {onSettingsClick ? (
              <Block
                as="button"
                type="button"
                onClick={onSettingsClick}
                aria-label="Settings"
                overrides={{ Block: { style: iconBtnStyle } }}
              >
                <Settings size={16} />
              </Block>
            ) : null}
          </Block>
        </Block>

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

        {!hideHeader && !headerOverride && showTitleBand ? (
          <Block
            paddingTop="scale600"
            paddingBottom="scale600"
            paddingLeft="scale600"
            paddingRight="scale600"
            backgroundColor="backgroundSecondary"
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
            <ParagraphMedium margin={0} $style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1.15 }}>
              {title}
            </ParagraphMedium>
            <LabelSmall marginTop="scale200" $style={{ color: 'contentSecondary' }}>
              {workspaceLabel}
            </LabelSmall>
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
          backgroundColor={isMapMode ? 'backgroundPrimary' : 'backgroundSecondary'}
          className="uber-shell-content"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <Block
            height="100%"
            maxWidth="100%"
            minWidth={0}
            overflow={bleed ? 'hidden' : 'auto'}
            padding={bleed ? '0' : ['scale500', 'scale600', 'scale700', 'scale800']}
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
      </Block>
    </Block>
  );
}
