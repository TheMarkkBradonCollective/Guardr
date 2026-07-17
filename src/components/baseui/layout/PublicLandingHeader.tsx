import React from 'react';
import { Block } from 'baseui/block';
import { useStyletron } from 'baseui';
import { BookOpen, Smartphone } from 'lucide-react';
import type { ThemeMode } from '../../../lib/platform/theme';
import { PublicPageChrome } from './PublicPageChrome';
import { AppButton } from '../../ui/AppButton';

export function PublicLandingHeader({
  themeMode,
  onChangeTheme,
  onNavigateToAuth,
  onOpenGuide,
  showGuideLink = true,
  showRoleLinks = true,
}: {
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  onOpenGuide?: () => void;
  showGuideLink?: boolean;
  showRoleLinks?: boolean;
}) {
  const [, theme] = useStyletron();

  return (
    <PublicPageChrome themeMode={themeMode} onChangeTheme={onChangeTheme}>
      {showGuideLink && onOpenGuide ? (
        <AppButton
          variant="ghost"
          size="sm"
          onClick={onOpenGuide}
          aria-label="Open guide"
          className="hidden sm:inline-flex"
        >
          <BookOpen className="w-4 h-4" />
          Guide
        </AppButton>
      ) : null}
      {showGuideLink && onOpenGuide ? (
        <AppButton
          variant="ghost"
          size="sm"
          onClick={onOpenGuide}
          aria-label="Open guide"
          className="sm:hidden !min-w-0 !px-2"
        >
          <BookOpen className="w-4 h-4" />
        </AppButton>
      ) : null}
      <Block
        as="a"
        href="#get-app"
        display="inline-flex"
        alignItems="center"
        gridGap="scale200"
        $style={{
          color: theme.colors.contentSecondary,
          fontSize: '14px',
          fontWeight: 600,
          textDecoration: 'none',
          ':hover': { color: theme.colors.contentPrimary },
        }}
        aria-label="Get app"
      >
        <Smartphone size={14} />
        <Block as="span" display={['none', 'none', 'inline', 'inline']}>
          Get app
        </Block>
      </Block>
      {showRoleLinks ? (
        <>
          <AppButton variant="ghost" size="sm" onClick={() => onNavigateToAuth('client', 'sign-in')} className="hidden md:inline-flex">
            Client
          </AppButton>
          <AppButton variant="ghost" size="sm" onClick={() => onNavigateToAuth('guard', 'sign-in')} className="hidden md:inline-flex">
            Guard
          </AppButton>
        </>
      ) : null}
      <AppButton variant="primary" size="sm" onClick={() => onNavigateToAuth(undefined, 'sign-in')}>
        Sign in
      </AppButton>
    </PublicPageChrome>
  );
}
