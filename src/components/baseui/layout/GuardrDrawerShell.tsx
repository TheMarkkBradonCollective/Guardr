import React, { useCallback, useEffect, useState } from 'react';
import { Block } from 'baseui/block';
import { ParagraphMedium, LabelSmall } from 'baseui/typography';
import { PanelLeft, Settings } from 'lucide-react';
import { useStyletron } from 'baseui';
import { Logo } from '../../Logo';
import { GuardrSideNav } from './GuardrSideNav';
import type { GuardrNavGroup } from './types';
import { useDevice } from '../../../lib/platform';

const SIDEBAR_WIDTH = '248px';

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
}: GuardrDrawerShellProps) {
  const [, theme] = useStyletron();
  const { formFactor } = useDevice();
  const isMapMode = variant === 'dark';
  const [sidebarOpen, setSidebarOpen] = useState(formFactor === 'desktop');

  useEffect(() => {
    setSidebarOpen(formFactor === 'desktop');
  }, [formFactor]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((open) => !open), []);

  const handleNavigate = (id: string) => {
    onNavigate(id);
    if (formFactor !== 'desktop') closeSidebar();
  };

  const iconBtnStyle = {
    width: '40px',
    height: '40px',
    minWidth: '40px',
    minHeight: '40px',
    borderRadius: '10px',
    border: `1px solid ${theme.colors.borderOpaque}`,
    backgroundColor: theme.colors.backgroundSecondary,
    color: theme.colors.contentPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    transition: 'background-color 150ms ease, transform 150ms ease',
    ':hover': {
      backgroundColor: theme.colors.backgroundTertiary,
    },
    ':active': {
      transform: 'scale(0.96)',
    },
  } as const;

  return (
    <Block
      className="uber-app-shell page-shell"
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      display="flex"
      height="100dvh"
      maxHeight="100dvh"
      overflow="hidden"
      backgroundColor={isMapMode ? 'backgroundPrimary' : 'backgroundPrimary'}
      color="contentPrimary"
      data-uber-shell=""
      data-sidebar-open={sidebarOpen ? 'true' : 'false'}
    >
      {sidebarOpen ? (
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

      <Block
        as="aside"
        aria-label={ariaLabel}
        aria-hidden={!sidebarOpen}
        position="fixed"
        top={0}
        left={0}
        bottom={0}
        width={SIDEBAR_WIDTH}
        display="flex"
        flexDirection="column"
        backgroundColor="backgroundPrimary"
        overrides={{
          Block: {
            style: {
              zIndex: 50,
              borderRight: `1px solid ${theme.colors.borderOpaque}`,
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: sidebarOpen ? '8px 0 32px rgba(0, 0, 0, 0.12)' : 'none',
              paddingTop: 'max(0px, env(safe-area-inset-top))',
              paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
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
              },
            },
          }}
        >
          <Logo size={26} className="shrink-0" />
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

        <Block flex="1" minHeight={0} overflow="auto" paddingTop="scale300" paddingBottom="scale300">
          <GuardrSideNav groups={navGroups} activeId={activeNavId} onSelect={handleNavigate} ariaLabel={ariaLabel} />
        </Block>

        {sidebarFooter ? (
          <Block paddingLeft="scale500" paddingRight="scale500" paddingBottom="scale400">
            {sidebarFooter}
          </Block>
        ) : null}

        <Block
          padding="scale500"
          overrides={{
            Block: {
              style: {
                borderTop: `1px solid ${theme.colors.borderOpaque}`,
              },
            },
          }}
        >
          {accountMenu}
        </Block>
      </Block>

      <Block
        flex="1"
        display="flex"
        flexDirection="column"
        minWidth={0}
        minHeight={0}
        onClick={sidebarOpen && formFactor !== 'desktop' ? closeSidebar : undefined}
      >
        <Block
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gridGap="scale400"
          paddingBottom="scale500"
          paddingLeft="scale500"
          paddingRight="scale500"
          backgroundColor="backgroundPrimary"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          overrides={{
            Block: {
              style: {
                borderBottom: `1px solid ${theme.colors.borderOpaque}`,
                flexShrink: 0,
                paddingTop: 'max(12px, env(safe-area-inset-top))',
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
              <PanelLeft size={16} />
            </Block>
            <Logo size={22} className="shrink-0" />
            <Block minWidth={0} display={['none', 'none', 'block', 'block']}>
              <ParagraphMedium margin={0} $style={{ fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                Guard<span className="uber-text-accent">r</span>
              </ParagraphMedium>
              <LabelSmall margin={0} $style={{ color: 'contentSecondary' }}>
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

        {!hideHeader ? (
          headerOverride ? (
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
          ) : (
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
                Welcome to {workspaceLabel}
              </LabelSmall>
            </Block>
          )
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
          backgroundColor={isMapMode ? 'backgroundPrimary' : 'backgroundPrimary'}
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
