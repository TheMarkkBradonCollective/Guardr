import React from 'react';
import { Block } from 'baseui/block';
import { HeadingLarge, LabelSmall, ParagraphMedium } from 'baseui/typography';
import { useStyletron } from 'baseui';
import { Building2, Shield, ArrowRight, MapPin, Radio } from 'lucide-react';
import type { ViewSurface } from '../../lib/platform/viewSurface';
import type { ShellKind } from '../../lib/platform/shellKind';
import { AppButton } from '../ui/AppButton';
import { GuardrCard } from '../baseui/GuardrCard';
import { GuardrTag } from '../baseui/GuardrTag';
import { AccentIcon } from '../baseui/dashboard';
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

export function AppWelcomeHero({
  shellKind,
  isTablet,
}: {
  shellKind: ShellKind;
  isTablet: boolean;
}) {
  const copy = HERO_COPY[shellKind];

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
        <Block marginTop="scale500">
          <GuardrTag kind="accent">Offline-ready shell</GuardrTag>
        </Block>
      ) : null}
      {shellKind === 'native' ? (
        <Block marginTop="scale500">
          <GuardrTag kind="neutral">Push · GPS · Camera</GuardrTag>
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
    <Block
      className="app-welcome-dock shrink-0"
      paddingTop="scale600"
      paddingLeft="scale600"
      paddingRight="scale600"
      $style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      data-view-surface={viewSurface}
    >
      <LabelSmall marginBottom="scale400" color="contentSecondary">
        Sign in as
      </LabelSmall>
      <Block display="grid" gridTemplateColumns="1fr 1fr" gridGap="scale300" className="app-welcome-role-toggle">
        {roles.map(({ id, label, icon }) => {
          const selected = signInRole === id;
          return (
            <GuardrCard
              key={id}
              interactive
              onClick={() => setSignInRole(id)}
              className="app-welcome-role-btn"
              overrides={{
                Root: {
                  props: { 'aria-pressed': selected },
                  style: {
                    cursor: 'pointer',
                    borderColor: selected ? 'accent' : 'borderOpaque',
                    backgroundColor: selected ? 'accent50' : 'backgroundPrimary',
                  },
                },
              }}
            >
              <Block display="flex" alignItems="center" justifyContent="center" gridGap="scale300">
                <AccentIcon icon={icon} size={18} strokeWidth={1.75} />
                <Block as="span" $style={{ fontWeight: 700, fontSize: '14px' }}>
                  {label}
                </Block>
              </Block>
            </GuardrCard>
          );
        })}
      </Block>

      <AppButton
        fullWidth
        className="app-welcome-signin-btn mt-4"
        onClick={() => onNavigateToAuth(signInRole, 'sign-in')}
      >
        Sign in
        <ArrowRight className="w-4 h-4" />
      </AppButton>

      <Block display="flex" justifyContent="center" alignItems="center" marginTop="scale400" gridGap="scale200">
        <ParagraphMedium marginTop="0" marginBottom="0" color="contentSecondary" $style={{ fontSize: '12px' }}>
          New here?
        </ParagraphMedium>
        <AppButton variant="ghost" size="inline" onClick={() => onNavigateToAuth(signInRole, 'sign-up')}>
          Create {signInRole === 'guard' ? 'guard' : 'client'} account
        </AppButton>
      </Block>

      <Block marginTop="scale500" paddingTop="scale400" overrides={{ Block: { style: { borderTop: '1px solid var(--uber-border)' } } }}>
        <LegalFooterLinks onOpenLegal={onOpenLegal} className="justify-center" />
      </Block>
    </Block>
  );
}

export function AppWelcomeShellBadge({ shellKind }: { shellKind: ShellKind }) {
  if (shellKind === 'native') {
    return (
      <GuardrTag kind="accent" closeable={false} overrides={{ Root: { props: { className: 'app-welcome-shell-badge app-welcome-shell-badge--native' } } }}>
        App
      </GuardrTag>
    );
  }
  if (shellKind === 'pwa') {
    return (
      <GuardrTag kind="neutral" closeable={false} overrides={{ Root: { props: { className: 'app-welcome-shell-badge app-welcome-shell-badge--pwa' } } }}>
        Installed
      </GuardrTag>
    );
  }
  return null;
}
