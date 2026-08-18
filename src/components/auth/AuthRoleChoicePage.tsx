import React from 'react';
import { Block } from 'baseui/block';
import { useStyletron } from 'baseui';
import { ArrowRight, Briefcase, Building2, Shield, User } from 'lucide-react';
import type { ThemeMode } from '../../lib/platform/theme';
import { useDevice } from '../../lib/platform';
import type { AuthSignupPick, AuthViewRole } from '../../lib/appNavigation';
import type { ClientType } from '../../types';
import { DirectTopHeader } from '../baseui/layout/DirectTopHeader';
import { AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { FONT_DISPLAY } from '../../theme/typography';

const HEADING_FONT = FONT_DISPLAY;

export type AuthRoleChoiceMode = 'sign-in' | 'sign-up';

interface ChoiceOption {
  id: string;
  icon: typeof Shield;
  title: string;
  description: string;
  badge?: string;
  emphasized?: boolean;
}

const SIGN_IN_OPTIONS: ChoiceOption[] = [
  {
    id: 'guard',
    icon: Shield,
    title: 'Log in as guard',
    description: 'Independent contractor — your marketplace jobs and earnings.',
  },
  {
    id: 'client',
    icon: User,
    title: 'Log in as client',
    description: 'Personal or business — whoever is hiring and paying for coverage.',
  },
  {
    id: 'staff',
    icon: Briefcase,
    title: 'Log in as staff',
    description: 'Guardr platform team — operations and support workspace.',
  },
];

const SIGNUP_PATH_OPTIONS: ChoiceOption[] = [
  {
    id: 'client',
    icon: User,
    title: 'I need security',
    description:
      'Hire licensed guards as yourself or as a company. Not a job application to Guardr.',
  },
  {
    id: 'work',
    icon: Briefcase,
    title: 'I want to work',
    description: 'Independent contractor on the marketplace, or apply for a Guardr staff role.',
  },
];

const SIGNUP_CLIENT_KIND_OPTIONS: ChoiceOption[] = [
  {
    id: 'personal',
    icon: User,
    title: 'Personal',
    description:
      'You are hiring and paying as yourself — protection, a private event, residential coverage, or help for a family member. The job can still be at a venue or business site.',
  },
  {
    id: 'business',
    icon: Building2,
    title: 'Business',
    description:
      'A company, venue, or organization is the contracting party and pays the invoice. You can still post a private event if the business is hiring.',
  },
];

const SIGNUP_WORK_OPTIONS: ChoiceOption[] = [
  {
    id: 'guard',
    icon: Shield,
    title: "I'm a licensed guard (contractor)",
    description:
      'Browse shifts on the map and work as an independent contractor. Guardr does not employ guards through this signup.',
  },
  {
    id: 'staff',
    icon: Briefcase,
    title: 'Apply to work at Guardr',
    description:
      'Platform operations role (Support to start). Government ID, Stripe payout setup, and Director review — not guard or client signup.',
    badge: 'Guardr employment',
    emphasized: true,
  },
];

const COPY: Record<
  'sign-in' | AuthSignupPick,
  { heading: string; subheading: string; ariaLabel: string; kicker?: string }
> = {
  'sign-in': {
    heading: 'Log in to your account',
    subheading: 'Choose the workspace that matches how you use Guardr.',
    ariaLabel: 'Choose how to log in',
  },
  path: {
    heading: 'Create an account',
    subheading: 'First, tell us whether you need coverage or want to work.',
    ariaLabel: 'Choose how to sign up',
    kicker: 'Create an account',
  },
  client: {
    heading: 'Who is hiring?',
    subheading:
      'This is the person or organization that contracts and pays for coverage — not the type of location.',
    ariaLabel: 'Choose personal or business',
    kicker: 'I need security',
  },
  work: {
    heading: 'How do you want to work?',
    subheading:
      'Guards are independent contractors on the marketplace. Staff apply to work at Guardr — we do not hire through guard signup.',
    ariaLabel: 'Choose how to work',
    kicker: 'I want to work',
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
}: {
  option: ChoiceOption;
  onSelect: (id: string) => void;
}) {
  const [, theme] = useStyletron();
  const { id, icon: Icon, title, description, badge, emphasized } = option;

  return (
    <Block
      as="button"
      type="button"
      className={`auth-role-choice-option${emphasized ? ' auth-role-choice-option--staff' : ''}`}
      onClick={() => onSelect(id)}
    >
      <Block display="flex" alignItems="center" gridGap="scale400" marginBottom="scale400">
        <Icon size={24} color={theme.colors.contentPrimary} strokeWidth={1.75} aria-hidden />
        {badge ? (
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
            {badge}
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
  signupStep?: AuthSignupPick;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onNavigateToAuth: (role?: AuthViewRole, mode?: 'sign-in' | 'sign-up') => void;
  onSelectRole: (role: AuthViewRole) => void;
  onSelectSignupPath?: (path: 'client' | 'work') => void;
  onSelectClientType?: (kind: ClientType) => void;
  onOpenGuide?: () => void;
  onBack?: () => void;
}

/**
 * Sign-in: Guard / Client / Staff.
 * Sign-up: three selection pages — path, then personal/business or guard/staff.
 */
export function AuthRoleChoicePage({
  mode,
  signupStep = 'path',
  themeMode: _themeMode,
  onChangeTheme: _onChangeTheme,
  onNavigateToAuth: _onNavigateToAuth,
  onSelectRole,
  onSelectSignupPath,
  onSelectClientType,
  onOpenGuide: _onOpenGuide,
  onBack,
}: AuthRoleChoicePageProps) {
  const [, theme] = useStyletron();
  const { formFactor } = useDevice();
  const factor = formFactor === 'tablet' ? 'tablet' : formFactor === 'desktop' ? 'desktop' : 'mobile';
  const isMobile = factor === 'mobile';
  const copyKey = mode === 'sign-in' ? 'sign-in' : signupStep;
  const copy = COPY[copyKey];
  const backLabel = mode === 'sign-up' && signupStep !== 'path' ? 'Back' : 'Home';
  const showHero = !isMobile && (mode === 'sign-in' || signupStep === 'path');

  const handleSelect = (id: string) => {
    if (mode === 'sign-in') {
      onSelectRole(id as AuthViewRole);
      return;
    }
    if (signupStep === 'path') {
      if (id === 'client' || id === 'work') onSelectSignupPath?.(id);
      return;
    }
    if (signupStep === 'client') {
      if (id === 'personal' || id === 'business') onSelectClientType?.(id);
      return;
    }
    if (id === 'guard' || id === 'staff') onSelectRole(id);
  };

  const options =
    mode === 'sign-in'
      ? SIGN_IN_OPTIONS
      : signupStep === 'client'
        ? SIGNUP_CLIENT_KIND_OPTIONS
        : signupStep === 'work'
          ? SIGNUP_WORK_OPTIONS
          : SIGNUP_PATH_OPTIONS;

  return (
    <Block
      minHeight="100dvh"
      height="100dvh"
      className="auth-role-choice-page"
      data-landing-factor={formFactor}
      data-signup-step={mode === 'sign-up' ? signupStep : 'sign-in'}
      backgroundColor="backgroundPrimary"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      <DirectTopHeader onBrandClick={onBack} />
      {onBack ? <AppSubScreenHeader title="" hideTitle onBack={onBack} backLabel={backLabel} /> : null}

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
              {copy.kicker ? (
                <Block
                  as="p"
                  margin={0}
                  marginBottom="scale300"
                  $style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: theme.colors.contentSecondary,
                  }}
                >
                  {copy.kicker}
                </Block>
              ) : null}
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

            {showHero ? <AuthChoiceHeroVisual /> : null}
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
            {options.map((option) => (
              <RoleChoiceRow key={option.id} option={option} onSelect={handleSelect} />
            ))}
          </Block>
        </Block>
      </Block>
    </Block>
  );
}
