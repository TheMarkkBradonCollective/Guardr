import React from 'react';
import { Block } from 'baseui/block';
import { HeadingLarge, ParagraphMedium } from 'baseui/typography';
import { useStyletron } from 'baseui';
import { Building2, Shield, ArrowRight, MapPin, Radio } from 'lucide-react';
import type { ViewSurface } from '../../lib/platform/viewSurface';
import type { ShellKind } from '../../lib/platform/shellKind';
import type { ExperienceTier } from '../../lib/platform/experienceTier';
import { AppButton } from '../ui/AppButton';
import { GuardrTag } from '../baseui/GuardrTag';
import { LandingBadge } from '../landing/LandingUberPrimitives';
import { LegalFooterLinks } from '../legal/LegalFooterLinks';
import type { LegalPageId } from '../../lib/legalContent';

export function AppWelcomeBackdrop() {
  const [, theme] = useStyletron();
  return (
    <Block
      position="absolute"
      aria-hidden
      overrides={{
        Block: {
          style: {
            inset: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
          },
        },
      }}
    >
      <Block
        position="absolute"
        overrides={{
          Block: {
            style: {
              inset: 0,
              opacity: 0.35,
              backgroundImage:
                'linear-gradient(var(--uber-border, #e2e2e2) 1px, transparent 1px), linear-gradient(90deg, var(--uber-border, #e2e2e2) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            },
          },
        }}
      />
      <Block
        position="absolute"
        top="-20%"
        right="-10%"
        width="60%"
        height="50%"
        overrides={{
          Block: {
            style: {
              borderRadius: '50%',
              background: `radial-gradient(circle, color-mix(in srgb, ${theme.colors.accent} 22%, transparent) 0%, transparent 70%)`,
            },
          },
        }}
      />
      <Block position="absolute" top="18%" left="12%" color="accent" overrides={{ Block: { style: { opacity: 0.5 } } }}>
        <MapPin size={14} />
      </Block>
      <Block position="absolute" top="32%" right="18%" color="accent" overrides={{ Block: { style: { opacity: 0.35 } } }}>
        <Radio size={12} />
      </Block>
      <Block position="absolute" bottom="28%" left="22%" color="accent" overrides={{ Block: { style: { opacity: 0.4 } } }}>
        <Shield size={14} />
      </Block>
    </Block>
  );
}

const HERO_COPY: Record<ShellKind, { eyebrow: string; headline: string; accent: string; sub: string }> = {
  browser: {
    eyebrow: 'Independent security marketplace',
    headline: 'Post coverage. Get qualified. Work securely.',
    accent: 'Clients and guards, one platform.',
    sub: 'Post jobs, browse open shifts, and track live operations. Map-first. Direct pay.',
  },
  pwa: {
    eyebrow: 'Guardr · Installed',
    headline: 'Your security workspace, anywhere.',
    accent: 'Ready on your home screen.',
    sub: 'Post coverage, pick up shifts, and manage live operations from your installed app. Works offline.',
  },
  native: {
    eyebrow: 'Guardr for Android',
    headline: 'Field-ready security operations.',
    accent: 'Built for mobile crews.',
    sub: 'Map-first jobs, shift tools, messaging, and direct pay — native Android optimized.',
  },
};

const TIER_HERO_COPY: Partial<Record<string, { eyebrow: string; headline: string; accent: string; sub: string }>> = {
  'pwa-lite': {
    eyebrow: 'Guardr · Lite',
    headline: 'Fast. Focused. Ready offline.',
    accent: 'Lightweight installed app.',
    sub: 'Same features, lower data and battery use — ideal on cellular or low-power devices.',
  },
  'pwa-full': {
    eyebrow: 'Guardr · Installed',
    headline: 'Your security workspace, anywhere.',
    accent: 'Full installed experience.',
    sub: 'Post coverage, pick up shifts, and manage live operations with glass chrome and offline support.',
  },
  'apk-full': {
    eyebrow: 'Guardr for Android',
    headline: 'Field-ready security operations.',
    accent: 'Built for mobile crews.',
    sub: 'GPS, camera, push alerts, and shift tools — optimized for phones in the field.',
  },
  'apk-premium': {
    eyebrow: 'Guardr Premium',
    headline: 'Native security operations.',
    accent: 'Polished for Android.',
    sub: 'Richer motion, haptic feedback, and premium chrome — map-first jobs with native polish.',
  },
};

function resolveWelcomeCopy(shellKind: ShellKind, experienceTier?: ExperienceTier) {
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
}: {
  shellKind: ShellKind;
  isTablet: boolean;
  experienceTier?: ExperienceTier;
}) {
  const copy = resolveWelcomeCopy(shellKind, experienceTier);
  const isLite = experienceTier?.shell === 'pwa' && experienceTier.mode === 'lite';
  const isPremium = experienceTier?.shell === 'native' && experienceTier.mode === 'premium';

  return (
    <Block className={isTablet ? 'app-welcome-hero app-welcome-hero--tablet' : 'app-welcome-hero pt-2 sm:pt-6'}>
      <LandingBadge>{copy.eyebrow}</LandingBadge>
      <HeadingLarge
        marginTop="scale300"
        marginBottom="scale300"
        overrides={{
          Block: {
            style: {
              fontWeight: 900,
              letterSpacing: shellKind === 'native' && !isTablet ? '-0.03em' : '-0.04em',
              lineHeight: 1.05,
              fontSize: isTablet ? 'clamp(1.75rem, 3vw, 2.5rem)' : undefined,
            },
          },
        }}
      >
        {copy.headline}
        <Block as="span" display="block" color="accent">
          {copy.accent}
        </Block>
      </HeadingLarge>
      <ParagraphMedium marginTop="0" marginBottom="0" color="contentSecondary" maxWidth="24rem">
        {copy.sub}
      </ParagraphMedium>
      {shellKind === 'pwa' ? (
        <Block marginTop="scale500" display="flex" gridGap="scale300" flexWrap>
          <GuardrTag kind="accent">{isLite ? 'Lite · low data' : 'Offline-ready shell'}</GuardrTag>
          {isLite ? <GuardrTag kind="neutral">Reduced motion</GuardrTag> : null}
        </Block>
      ) : null}
      {shellKind === 'native' ? (
        <Block marginTop="scale500" display="flex" gridGap="scale300" flexWrap>
          <GuardrTag kind="neutral">{isPremium ? 'Premium · haptics' : 'Push · GPS · Camera'}</GuardrTag>
          {isPremium ? <GuardrTag kind="accent">Native polish</GuardrTag> : null}
        </Block>
      ) : null}
    </Block>
  );
}

export function AppWelcomeSignInDock({
  signInRole,
  setSignInRole,
  onNavigateToAuth,
  onOpenLegal,
  viewSurface,
}: {
  signInRole: 'guard' | 'client';
  setSignInRole: (role: 'guard' | 'client') => void;
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  onOpenLegal: (page: LegalPageId) => void;
  viewSurface: ViewSurface;
}) {
  const roles = [
    { id: 'guard' as const, label: 'Guard', icon: Shield },
    { id: 'client' as const, label: 'Client', icon: Building2 },
  ];

  return (
    <div
      className="app-welcome-dock shrink-0"
      style={{
        paddingTop: '1.25rem',
        paddingLeft: '1.25rem',
        paddingRight: '1.25rem',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
      data-view-surface={viewSurface}
    >
      {/* Role toggle — single segmented row */}
      <div className="app-welcome-role-row">
        {roles.map(({ id, label, icon: Icon }) => {
          const selected = signInRole === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              onClick={() => setSignInRole(id)}
              className="app-welcome-role-seg"
              data-active={selected ? 'true' : undefined}
            >
              <Icon size={16} strokeWidth={1.75} aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      <AppButton
        fullWidth
        className="app-welcome-signin-btn mt-4"
        onClick={() => onNavigateToAuth(signInRole, 'sign-in')}
      >
        Sign in
        <ArrowRight className="w-4 h-4" />
      </AppButton>

      <div className="flex justify-center items-center gap-1 mt-3">
        <span className="text-xs" style={{ color: 'var(--uber-text-muted)' }}>New here?</span>
        <AppButton variant="ghost" size="inline" onClick={() => onNavigateToAuth(signInRole, 'sign-up')}>
          Create {signInRole === 'guard' ? 'guard' : 'client'} account
        </AppButton>
      </div>

      <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--uber-border)' }}>
        <LegalFooterLinks onOpenLegal={onOpenLegal} className="justify-center" />
      </div>
    </div>
  );
}

export function AppWelcomeShellBadge({
  shellKind,
  experienceTier,
}: {
  shellKind: ShellKind;
  experienceTier?: ExperienceTier;
}) {
  if (shellKind === 'native') {
    const premium = experienceTier?.shell === 'native' && experienceTier.mode === 'premium';
    return (
      <GuardrTag kind="accent" closeable={false} overrides={{ Root: { props: { className: 'app-welcome-shell-badge app-welcome-shell-badge--native' } } }}>
        {premium ? 'Premium' : 'App'}
      </GuardrTag>
    );
  }
  if (shellKind === 'pwa') {
    const lite = experienceTier?.shell === 'pwa' && experienceTier.mode === 'lite';
    return (
      <GuardrTag kind="neutral" closeable={false} overrides={{ Root: { props: { className: 'app-welcome-shell-badge app-welcome-shell-badge--pwa' } } }}>
        {lite ? 'Lite' : 'Installed'}
      </GuardrTag>
    );
  }
  return null;
}
