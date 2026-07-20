import React from 'react';
import { Block } from 'baseui/block';
import type { ThemeMode } from '../lib/platform/theme';
import { useDevice } from '../lib/platform';
import type { FormFactor } from '../lib/platform/device';
import type { ShellKind } from '../lib/platform/shellKind';
import type { ViewSurface } from '../lib/platform/viewSurface';
import { resolveViewSurface } from '../lib/platform/viewSurface';
import {
  experienceAllowsDecorativeArt,
  resolveExperienceTier,
  type ExperienceTier,
} from '../lib/platform/experienceTier';
import { PublicPageChrome } from './baseui/layout/PublicPageChrome';
import type { LegalPageId } from '../lib/legalContent';
import {
  AppWelcomeBackdrop,
  AppWelcomeHero,
  AppWelcomeShellBadge,
  AppWelcomeSignInDock,
} from './app/AppWelcomeChrome';

interface AppHomeScreenProps {
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onOpenLegal: (page: LegalPageId) => void;
  authSheetOpen?: boolean;
  /** Design-preview only — simulate PWA/APK shell without changing DeviceProvider */
  previewOverrides?: {
    shellKind: ShellKind;
    formFactor: FormFactor;
    experienceTier?: ExperienceTier;
  };
}

export function AppHomeScreen({
  onNavigateToAuth,
  themeMode,
  onChangeTheme,
  onOpenLegal,
  authSheetOpen = false,
  previewOverrides,
}: AppHomeScreenProps) {
  const device = useDevice();
  const shellKind = previewOverrides?.shellKind ?? device.shellKind;
  const formFactor = previewOverrides?.formFactor ?? device.formFactor;
  const viewSurface: ViewSurface =
    previewOverrides != null
      ? resolveViewSurface(previewOverrides.shellKind, previewOverrides.formFactor)
      : device.viewSurface;
  const experienceTier: ExperienceTier =
    previewOverrides?.experienceTier ??
    (previewOverrides != null
      ? resolveExperienceTier(previewOverrides.shellKind, previewOverrides.formFactor)
      : device.experienceTier);
  const isTablet = formFactor === 'tablet';
  const showBackdrop = experienceAllowsDecorativeArt(experienceTier);

  return (
    <Block
      className={`app-welcome page-shell app-welcome--${shellKind} ${
        isTablet ? 'app-welcome--tablet' : 'app-welcome--mobile'
      } ${authSheetOpen ? 'app-welcome--dimmed' : ''}`}
      data-view-surface={viewSurface}
      data-experience-tier={
        experienceTier.shell === 'browser'
          ? 'website'
          : experienceTier.shell === 'pwa'
            ? `pwa-${experienceTier.mode}`
            : `apk-${experienceTier.mode}`
      }
      height="100dvh"
      maxHeight="100dvh"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      backgroundColor="backgroundPrimary"
      color="contentPrimary"
    >
      {showBackdrop ? <AppWelcomeBackdrop /> : null}

      <PublicPageChrome
        themeMode={themeMode}
        onChangeTheme={onChangeTheme}
        trailing={<AppWelcomeShellBadge shellKind={shellKind} experienceTier={experienceTier} />}
      />

      <Block
        as="main"
        className={`app-welcome-main relative z-[1] flex-1 min-h-0 ${
          isTablet ? 'app-welcome-main--tablet' : 'flex flex-col justify-between px-5'
        }`}
        display="flex"
        flexDirection={isTablet ? 'row' : 'column'}
        flex="1"
        minHeight="0"
        position="relative"
        overrides={{ Block: { style: { zIndex: 1 } } }}
      >
        <AppWelcomeHero shellKind={shellKind} isTablet={isTablet} experienceTier={experienceTier} />

        <AppWelcomeSignInDock
          onNavigateToAuth={onNavigateToAuth}
          onOpenLegal={onOpenLegal}
          viewSurface={viewSurface}
        />
      </Block>
    </Block>
  );
}
