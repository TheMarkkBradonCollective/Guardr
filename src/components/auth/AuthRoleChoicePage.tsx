import React from 'react';
import { Block } from 'baseui/block';
import { useStyletron } from 'baseui';
import { ArrowRight, Shield, User } from 'lucide-react';
import type { ThemeMode } from '../../lib/platform/theme';
import { useDevice } from '../../lib/platform';
import { UberDirectTopHeader } from '../baseui/layout/UberDirectTopHeader';

const HEADING_FONT = '"Uber Move", "Helvetica Neue", Helvetica, Arial, sans-serif';

export type AuthRoleChoiceMode = 'sign-in' | 'sign-up';

interface RoleOption {
  role: 'guard' | 'client';
  icon: typeof Shield;
  title: string;
}

const ROLE_OPTIONS: Record<AuthRoleChoiceMode, RoleOption[]> = {
  'sign-in': [
    { role: 'guard', icon: Shield, title: 'Log in as guard' },
    { role: 'client', icon: User, title: 'Log in as client' },
  ],
  'sign-up': [
    { role: 'guard', icon: Shield, title: 'Sign up as guard' },
    { role: 'client', icon: User, title: 'Sign up as client' },
  ],
};

const COPY: Record<AuthRoleChoiceMode, { heading: string; ariaLabel: string }> = {
  'sign-in': {
    heading: 'Log in to access your account',
    ariaLabel: 'Choose how to log in',
  },
  'sign-up': {
    heading: 'Sign up to access your account',
    ariaLabel: 'Choose how to sign up',
  },
};

/** Flat vector illustration — guard + client, mirroring Uber's login hero art. */
function AuthChoiceHeroVisual() {
  return (
    <div className="auth-role-choice-visual" aria-hidden>
      <svg viewBox="0 0 420 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Guard figure */}
        <circle cx="130" cy="78" r="34" fill="#111" />
        <rect x="96" y="118" width="68" height="92" rx="18" fill="#276EF1" />
        <rect x="108" y="210" width="22" height="52" rx="10" fill="#111" />
        <rect x="130" y="210" width="22" height="52" rx="10" fill="#111" />
        <rect x="118" y="138" width="24" height="10" rx="5" fill="#fff" opacity="0.9" />
        <path d="M150 96 L168 112 L150 128 Z" fill="#fff" opacity="0.85" />

        {/* Client figure */}
        <circle cx="290" cy="72" r="32" fill="#111" />
        <rect x="258" y="110" width="64" height="88" rx="16" fill="#E2E2E2" />
        <rect x="268" y="198" width="20" height="50" rx="9" fill="#111" />
        <rect x="292" y="198" width="20" height="50" rx="9" fill="#111" />
        <rect x="248" y="128" width="84" height="14" rx="7" fill="#CBCBCB" />
        <circle cx="318" cy="86" r="14" fill="none" stroke="#fff" strokeWidth="3" />
        <line x1="324" y1="92" x2="334" y2="102" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

interface AuthRoleChoicePageProps {
  mode: AuthRoleChoiceMode;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  onSelectRole: (role: 'guard' | 'client') => void;
  onOpenGuide?: () => void;
}

/**
 * Full-screen Guard/Client picker — mirrors Uber's "Log in to access your account"
 * layout with hero band + large role rows.
 */
export function AuthRoleChoicePage({
  mode,
  themeMode,
  onChangeTheme,
  onNavigateToAuth,
  onSelectRole,
  onOpenGuide,
}: AuthRoleChoicePageProps) {
  const [, theme] = useStyletron();
  const { formFactor } = useDevice();
  const factor = formFactor === 'tablet' ? 'tablet' : formFactor === 'desktop' ? 'desktop' : 'mobile';
  const isMobile = factor === 'mobile';
  const copy = COPY[mode];
  const options = ROLE_OPTIONS[mode];

  return (
    <Block
      minHeight="100dvh"
      height="100dvh"
      className="auth-role-choice-page"
      data-landing-factor={formFactor}
      backgroundColor="backgroundPrimary"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      <UberDirectTopHeader />

      <Block as="main" className="auth-role-choice-main">
        {/* Hero band — pale gray with headline + illustration */}
        <Block
          as="section"
          aria-label={copy.ariaLabel}
          className="auth-role-choice-hero"
        >
          <Block
            className="auth-role-choice-hero-inner"
            maxWidth="1280px"
            margin="0 auto"
            width="100%"
            display="grid"
            gridTemplateColumns={isMobile ? '1fr' : ['1fr', '1fr', '1fr 1fr']}
            gridGap="scale1000"
            alignItems="center"
          >
            <Block
              as="h1"
              margin={0}
              $style={{
                fontFamily: HEADING_FONT,
                fontWeight: 700,
                fontSize: isMobile ? 'clamp(2rem, 7vw, 2.5rem)' : 'clamp(2.5rem, 4vw, 3.25rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                color: theme.colors.contentPrimary,
              }}
            >
              {copy.heading}
            </Block>

            {!isMobile ? <AuthChoiceHeroVisual /> : null}
          </Block>
        </Block>

        {/* Role picker — white band with large tappable rows */}
        <Block
          as="section"
          className="auth-role-choice-options"
          backgroundColor="backgroundPrimary"
        >
          <Block
            className="auth-role-choice-options-grid"
            maxWidth="1280px"
            margin="0 auto"
            width="100%"
            display="grid"
            gridTemplateColumns={isMobile ? '1fr' : '1fr 1fr'}
            gridGap={isMobile ? 'scale600' : 'scale1200'}
          >
            {options.map(({ role, icon: Icon, title }) => (
              <Block
                key={role}
                as="button"
                type="button"
                className="auth-role-choice-option"
                onClick={() => onSelectRole(role)}
              >
                <Block display="flex" alignItems="center" gridGap="scale400" marginBottom="scale500">
                  <Icon size={24} color={theme.colors.contentPrimary} strokeWidth={1.75} aria-hidden />
                </Block>

                <Block
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gridGap="scale400"
                  paddingBottom="scale500"
                  $style={{ borderBottom: `1px solid ${theme.colors.borderOpaque}` }}
                >
                  <Block
                    as="span"
                    $style={{
                      fontFamily: HEADING_FONT,
                      fontWeight: 700,
                      fontSize: isMobile ? '22px' : '28px',
                      letterSpacing: '-0.02em',
                      color: theme.colors.contentPrimary,
                    }}
                  >
                    {title}
                  </Block>
                  <ArrowRight size={22} color={theme.colors.contentPrimary} style={{ flexShrink: 0 }} />
                </Block>
              </Block>
            ))}
          </Block>
        </Block>
      </Block>
    </Block>
  );
}
