import React from 'react';
import { Block } from 'baseui/block';
import { ArrowRight } from 'lucide-react';
import type { ViewSurface } from '../../lib/platform/viewSurface';
import type { ShellKind } from '../../lib/platform/shellKind';
import type { ExperienceTier } from '../../lib/platform/experienceTier';
import { AppButton } from '../ui/AppButton';
import { LegalFooterLinks } from '../legal/LegalFooterLinks';
import { EqualOpportunityNotice } from '../legal/EqualOpportunityNotice';
import type { LegalPageId } from '../../lib/legalContent';
import type { ProductApp } from '../../lib/productApps';

/** Soft full-bleed wash — no grid, icons, or glow blobs. */
export function AppWelcomeBackdrop() {
  return (
    <div className="app-welcome-backdrop" aria-hidden>
      <div className="app-welcome-backdrop-plane" />
      <div className="app-welcome-backdrop-band" />
    </div>
  );
}

const HERO_COPY: Record<ShellKind, { headline: string; sub: string }> = {
  browser: {
    headline: 'Post coverage. Get qualified. Work securely.',
    sub: 'Clients and guards on one map-first marketplace — with direct pay.',
  },
  pwa: {
    headline: 'Your security workspace, anywhere.',
    sub: 'Post coverage, pick up shifts, and manage live operations from your phone.',
  },
  native: {
    headline: 'Field-ready security operations.',
    sub: 'Map-first jobs, shift tools, messaging, and direct pay — built for mobile crews.',
  },
};

const TIER_HERO_COPY: Partial<Record<string, { headline: string; sub: string }>> = {
  'pwa-lite': {
    headline: 'Fast. Focused. Ready offline.',
    sub: 'Same Guardr features with lower data and battery use on cellular.',
  },
  'pwa-full': {
    headline: 'Your security workspace, anywhere.',
    sub: 'Post coverage, pick up shifts, and manage live operations from your installed app.',
  },
  'apk-full': {
    headline: 'Field-ready security operations.',
    sub: 'GPS, camera, push alerts, and shift tools — optimized for phones in the field.',
  },
  'apk-premium': {
    headline: 'Native security operations.',
    sub: 'Richer motion and native polish — map-first jobs for Android crews.',
  },
};

const PRODUCT_APP_HERO_COPY: Partial<Record<ProductApp, { headline: string; sub: string }>> = {
  client: {
    headline: 'Hire coverage when you need it.',
    sub: 'Post jobs, track guards on the map, and pay from your phone.',
  },
  guard: {
    headline: 'Field-ready security operations.',
    sub: 'GPS, camera, push alerts, and shift tools — built for phones in the field.',
  },
  staff: {
    headline: 'Operations in your pocket.',
    sub: 'Jobs, people, and support — the Guardr control centre on your phone.',
  },
};

function resolveWelcomeCopy(
  shellKind: ShellKind,
  experienceTier?: ExperienceTier,
  productApp?: ProductApp,
) {
  if (productApp && productApp !== 'website' && PRODUCT_APP_HERO_COPY[productApp]) {
    return PRODUCT_APP_HERO_COPY[productApp]!;
  }
  if (experienceTier?.shell === 'pwa') {
    return TIER_HERO_COPY[`pwa-${experienceTier.mode}`] ?? HERO_COPY.pwa;
  }
  if (experienceTier?.shell === 'native') {
    return TIER_HERO_COPY[`apk-${experienceTier.mode}`] ?? HERO_COPY.native;
  }
  return HERO_COPY[shellKind];
}

export function AppWelcomeHero({
  shellKind,
  isTablet,
  experienceTier,
  productApp,
}: {
  shellKind: ShellKind;
  isTablet: boolean;
  experienceTier?: ExperienceTier;
  productApp?: ProductApp;
}) {
  const copy = resolveWelcomeCopy(shellKind, experienceTier, productApp);

  return (
    <Block
      className={`app-welcome-hero${isTablet ? ' app-welcome-hero--tablet' : ''}`}
      display="flex"
      flexDirection="column"
      justifyContent="flex-start"
      flex="1"
      minHeight="0"
      overflow="auto"
    >
      <p className="app-welcome-brand">Guardr</p>
      <h1 className="app-welcome-headline">{copy.headline}</h1>
      <p className="app-welcome-sub">{copy.sub}</p>
    </Block>
  );
}

export function AppWelcomeSignInDock({
  onNavigateToAuth,
  onOpenLegal,
  viewSurface,
}: {
  onNavigateToAuth: (role?: 'guard' | 'client' | 'staff', mode?: 'sign-in' | 'sign-up') => void;
  onOpenLegal: (page: LegalPageId) => void;
  viewSurface: ViewSurface;
}) {
  return (
    <div className="app-welcome-dock" data-view-surface={viewSurface}>
      <AppButton
        fullWidth
        className="app-welcome-signin-btn"
        onClick={() => onNavigateToAuth(undefined, 'sign-in')}
      >
        Sign in
        <ArrowRight className="w-4 h-4" aria-hidden />
      </AppButton>

      <AppButton
        fullWidth
        variant="outline"
        className="app-welcome-signup-btn"
        onClick={() => onNavigateToAuth(undefined, 'sign-up')}
      >
        Sign up
      </AppButton>

      <div className="app-welcome-legal">
        <LegalFooterLinks onOpenLegal={onOpenLegal} className="justify-center" />
        <EqualOpportunityNotice onOpenLegal={onOpenLegal} compact align="center" className="mt-3" />
      </div>
    </div>
  );
}

/** Compact status chip for the header — no accent glow. */
export function AppWelcomeShellBadge({
  shellKind,
  experienceTier,
}: {
  shellKind: ShellKind;
  experienceTier?: ExperienceTier;
}) {
  if (shellKind === 'native') {
    const premium = experienceTier?.shell === 'native' && experienceTier.mode === 'premium';
    return <span className="app-welcome-shell-status">{premium ? 'Premium' : 'App'}</span>;
  }
  if (shellKind === 'pwa') {
    const lite = experienceTier?.shell === 'pwa' && experienceTier.mode === 'lite';
    return <span className="app-welcome-shell-status">{lite ? 'Lite' : 'Installed'}</span>;
  }
  return null;
}
