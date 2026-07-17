import React from 'react';
import { Block } from 'baseui/block';
import { Logo } from '../../Logo';
import { ThemeToggle } from '../../ui/ThemeToggle';
import type { ThemeMode } from '../../../lib/platform/theme';

export function PublicPageChrome({
  themeMode,
  onChangeTheme,
  trailing,
  children,
  sticky = true,
}: {
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
  sticky?: boolean;
}) {
  return (
    <Block
      as="header"
      backgroundColor="backgroundPrimary"
      overrides={{
        Block: {
          style: {
            position: sticky ? 'sticky' : 'relative',
            top: 0,
            zIndex: 50,
            borderBottom: '1px solid',
            borderColor: 'borderOpaque',
            backdropFilter: 'blur(20px) saturate(150%)',
            backgroundColor: 'color-mix(in srgb, var(--brand-surface) 94%, transparent)',
            paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
          },
        },
      }}
    >
      <Block
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gridGap="scale400"
        paddingTop="scale400"
        paddingBottom="scale400"
        paddingLeft="scale600"
        paddingRight="scale600"
        maxWidth="1280px"
        margin="0 auto"
        width="100%"
      >
        <Block display="flex" alignItems="center" gridGap="scale400">
          <Logo size={28} className="text-brand-primary shrink-0" />
          <Block
            overrides={{
              Block: {
                style: {
                  fontWeight: 800,
                  fontSize: '18px',
                  letterSpacing: '-0.02em',
                },
              },
            }}
          >
            Guard<span style={{ color: 'var(--brand-primary)' }}>r</span>
          </Block>
        </Block>

        <Block display="flex" alignItems="center" gridGap="scale400">
          {children}
          {trailing}
          <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" />
        </Block>
      </Block>
    </Block>
  );
}
