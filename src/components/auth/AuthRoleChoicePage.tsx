import React from 'react';
import { Block } from 'baseui/block';
import { useStyletron } from 'baseui';
import { ArrowRight, Briefcase, Building2, Shield, User } from 'lucide-react';
import type { ThemeMode } from '../../lib/platform/theme';
import { useDevice } from '../../lib/platform';
import type { AuthViewRole } from '../../lib/appNavigation';
import { DirectTopHeader } from '../baseui/layout/DirectTopHeader';
import { AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { FONT_DISPLAY } from '../../theme/typography';

const HEADING_FONT = FONT_DISPLAY;

export type AuthRoleChoiceMode = 'sign-in' | 'sign-up';

interface RoleOption {
  role: AuthViewRole;
  icon: typeof Shield;
  title: string;
  description: string;
}

const SIGN_IN_OPTIONS: RoleOption[] = [
  {
    role: 'guard',
    icon: Shield,
    title: 'Log in as guard',
    description: 'Independent contractor — your marketplace jobs and earnings.',
  },
  {
    role: 'client',
    icon: User,
    title: 'Log in as client',
    description: 'Business account — post coverage and manage sites.',
  },
  {
    role: 'staff',
    icon: Briefcase,
    title: 'Log in as staff',
    description: 'Guardr platform team — operations and support workspace.',
  },
];

const MARKETPLACE_SIGNUP_OPTIONS: RoleOption[] = [
  {
    role: 'client',
    icon: Building2,
    title: 'I need security for my site',
    description:
      'Business or property — post jobs and hire licensed guards on the marketplace. Not a job application to Guardr.',
  },
  {
    role: 'guard',
    icon: Shield,
    title: 'I\'m a licensed guard (contractor)',
    description:
      'Browse shifts on the map and work as an independent contractor. Guardr does not employ guards through this signup.',
  },
];

const STAFF_SIGNUP_OPTION: RoleOption = {
  role: 'staff',
  icon: Briefcase,
  title: 'Apply to work at Guardr',
  description:
    'Platform operations role (Support to start). Government ID, Stripe payout setup, and Director review — not guard or client signup.',
};

const COPY: Record<AuthRoleChoiceMode, { heading: string; subheading: string; ariaLabel: string }> = {
  'sign-in': {
    heading: 'Log in to your account',
    subheading: 'Choose the workspace that matches how you use Guardr.',
    ariaLabel: 'Choose how to log in',
  },
  'sign-up': {
    heading: 'Create an account',
    subheading:
      'Guard and client are marketplace accounts. To work for Guardr as staff, use Apply to work at Guardr — we do not hire through guard or client signup.',
    ariaLabel: 'Choose how to sign up',
  },
};

/** Flat vector illustration — guard + client marketplace (not staff). */
function AuthChoiceHeroVisual() {
  return (
    <div className="auth-role-choice-visual" aria-hidden>
      <svg viewBox="0 0 420 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="130" cy="78" r="34" fill="#111" />
        <rect x="96" y="118" width="68" height="92" rx="18" fill="#276EF1" />
        <rect x="108" y="210" width="22" height="52" rx="10" fill="#111" />
        <rect x="130" y="210" width="22" height="52" rx="10" fill="#111" />
        <rect x="118" y="138" width="24" height="10" rx="5" fill="#fff" opacity="0.9" />
        <path d="M150 96 L168 112 L150 128 Z" fill="#fff" opacity="0.85" />
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

function RoleChoiceRow({
  option,
  onSelect,
  emphasized = false,
}: {
  option: RoleOption;
  onSelect: (role: AuthViewRole) => void;
  emphasized?: boolean;
}) {
  const [, theme] = useStyletron();
  const { role, icon: Icon, title, description } = option;

  return (
    <Block
      as="button"
      type="button"
      className={`auth-role-choice-option${emphasized ? ' auth-role-choice-option--staff' : ''}`}
      onClick={() => onSelect(role)}
    >
      <Block display="flex" alignItems="center" gridGap="scale400" marginBottom="scale400">
        <Icon size={24} color={theme.colors.contentPrimary} strokeWidth={1.75} aria-hidden />
        {emphasized ? (
          <Block
            as="span"
            $style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: theme.colors.accent,
            }}
          >
            Guardr employment
          </Block>
        ) : null}
      </Block>
      <Block
        display="flex"
        alignItems="flex-start"
        justifyContent="space-between"
        gridGap="scale400"
        paddingBottom="scale500"
        $style={{ borderBottom: `1px solid ${theme.colors.borderOpaque}` }}
      >
        <Block minWidth={0} flex="1" overrides={{ Block: { style: { flex: 1, minWidth: 0 } } }}>
          <Block
            as="span"
            display="block"
            $style={{
              fontFamily: HEADING_FONT,
              fontWeight: 700,
              fontSize: 'clamp(20px, 4vw, 28px)',
              letterSpacing: '-0.02em',
              color: theme.colors.contentPrimary,
              marginBottom: '8px',
            }}
          >
            {title}
          </Block>
          <Block
            as="p"
            margin={0}
            $style={{
              fontSize: '14px',
              lineHeight: 1.45,
              color: theme.colors.contentSecondary,
            }}
          >
            {description}
          </Block>
        </Block>
        <ArrowRight size={22} color={theme.colors.contentPrimary} style={{ flexShrink: 0, marginTop: 4 }} />
      </Block>
    </Block>
  );
}

interface AuthRoleChoicePageProps {
  mode: AuthRoleChoiceMode;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onNavigateToAuth: (role?: AuthViewRole, mode?: 'sign-in' | 'sign-up') => void;
  onSelectRole: (role: AuthViewRole) => void;
  onOpenGuide?: () => void;
  onBack?: () => void;
}

/**
 * Full-screen Guard / Client / Staff picker — separates marketplace signup from Guardr staff hiring.
 */
export function AuthRoleChoicePage({
  mode,
  themeMode,
  onChangeTheme,
  onNavigateToAuth,
  onSelectRole,
  onOpenGuide,
  onBack,
}: AuthRoleChoicePageProps) {
  const [, theme] = useStyletron();
  const { formFactor } = useDevice();
  const factor = formFactor === 'tablet' ? 'tablet' : formFactor === 'desktop' ? 'desktop' : 'mobile';
  const isMobile = factor === 'mobile';
  const copy = COPY[mode];

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
      <DirectTopHeader onBrandClick={onBack} />
      {onBack ? <AppSubScreenHeader title="" hideTitle onBack={onBack} backLabel="Home" /> : null}

      <Block as="main" className="auth-role-choice-main">
        <Block as="section" aria-label={copy.ariaLabel} className="auth-role-choice-hero">
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
            <Block>
              <Block
                as="h1"
                margin={0}
                marginBottom="scale400"
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
              <Block
                as="p"
                margin={0}
                $style={{
                  fontSize: '15px',
                  lineHeight: 1.5,
                  color: theme.colors.contentSecondary,
                  maxWidth: '36rem',
                }}
              >
                {copy.subheading}
              </Block>
            </Block>

            {!isMobile && mode === 'sign-in' ? <AuthChoiceHeroVisual /> : null}
          </Block>
        </Block>

        <Block as="section" className="auth-role-choice-options" backgroundColor="backgroundPrimary">
          <Block
            className="auth-role-choice-options-grid"
            maxWidth="1280px"
            margin="0 auto"
            width="100%"
            display="grid"
            gridTemplateColumns="1fr"
            gridGap={isMobile ? 'scale600' : 'scale800'}
          >
            {mode === 'sign-in' ? (
              SIGN_IN_OPTIONS.map((option) => (
                <RoleChoiceRow key={option.role} option={option} onSelect={onSelectRole} />
              ))
            ) : (
              <>
                <Block as="p" margin={0} $style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.colors.contentSecondary }}>
                  Marketplace — not Guardr employment
                </Block>
                {MARKETPLACE_SIGNUP_OPTIONS.map((option) => (
                  <RoleChoiceRow key={option.role} option={option} onSelect={onSelectRole} />
                ))}
                <Block marginTop="scale400" marginBottom="scale200">
                  <Block
                    as="p"
                    margin={0}
                    $style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.colors.contentSecondary }}
                  >
                    Work at Guardr
                  </Block>
                </Block>
                <RoleChoiceRow option={STAFF_SIGNUP_OPTION} onSelect={onSelectRole} emphasized />
              </>
            )}
          </Block>
        </Block>
      </Block>
    </Block>
  );
}
