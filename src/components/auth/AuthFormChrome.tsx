import React from 'react';
import { Block } from 'baseui/block';
import { HeadingLarge, LabelSmall, ParagraphMedium } from 'baseui/typography';
import { useStyletron } from 'baseui';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { LandingBadge } from '../landing/LandingPrimitives';
import type { ClientType } from '../../types';
import { triggerHaptic } from '../../lib/platform/nativeHaptics';

/** Phone-only auth chrome: back + wordmark + optional 44px utilities. */
export function AuthMobileTopBar({
  onBack,
  backAriaLabel,
  trailing,
}: {
  onBack: () => void;
  backAriaLabel: string;
  trailing?: React.ReactNode;
}) {
  return (
    <header className="sfm-auth-nav">
      <button
        type="button"
        className="sfm-auth-nav-back"
        onClick={() => {
          void triggerHaptic('light');
          onBack();
        }}
        aria-label={backAriaLabel}
      >
        <ArrowLeft className="w-5 h-5" aria-hidden />
        <span>Back</span>
      </button>
      <p className="sfm-auth-nav-wordmark">Guardr</p>
      <div className="sfm-auth-nav-actions">{trailing}</div>
    </header>
  );
}

export function AuthFormHeader({
  role,
  isSignUp,
  compact = false,
  hideBadge = false,
  center = false,
  variant = 'page',
  clientKind,
}: {
  role: 'guard' | 'client' | 'staff';
  isSignUp: boolean;
  compact?: boolean;
  hideBadge?: boolean;
  center?: boolean;
  variant?: 'page' | 'sheet' | 'desktop' | 'role-choice';
  clientKind?: ClientType;
}) {
  const isPersonalClient = role === 'client' && clientKind === 'personal';
  const isBusinessClient = role === 'client' && clientKind === 'business';
  const isSecurityCompanyClient = role === 'client' && clientKind === 'security-company';
  const sheetTitle = isSignUp ? 'Create account' : 'Sign in';
  const pageTitle = isSignUp
    ? role === 'guard'
      ? 'Create your guard account'
      : role === 'staff'
        ? 'Create your staff account'
        : isPersonalClient
          ? 'Create your personal account'
          : isSecurityCompanyClient
            ? 'Create your security company account'
            : isBusinessClient
              ? 'Create your business account'
              : 'Create your account'
    : role === 'guard'
      ? 'Guard app sign in'
      : role === 'staff'
        ? 'Staff sign in'
        : isPersonalClient
          ? 'Personal sign in'
          : isSecurityCompanyClient
            ? 'Security company sign in'
            : isBusinessClient
              ? 'Business sign in'
              : 'Customer app sign in';

  const title = variant === 'sheet' ? sheetTitle : pageTitle;

  const workspaceLabel =
    role === 'guard'
      ? 'Guard'
      : role === 'staff'
        ? 'Staff'
        : isPersonalClient
          ? 'Customer · Personal'
          : isSecurityCompanyClient
            ? 'Customer · Security company'
            : isBusinessClient
              ? 'Customer · Business'
              : 'Customer';

  const clientSignupSubtitle = isPersonalClient
    ? 'You hire and pay as an individual. Request coverage once or as often as you need — including recurring services.'
    : isSecurityCompanyClient
      ? 'Your licensed PPO hires independent contractor guards through Guardr — upload your PPO license after sign-up.'
      : isBusinessClient
        ? 'Your organization hires and pays, with extra tools for sites, staffing, and team access.'
        : 'Post coverage after staff approves you — sign up and activation stay on this website.';

  const subtitle =
    variant === 'sheet'
      ? isSignUp
        ? role === 'guard'
          ? 'Finish application and activation on this website. After that you need the Guard app to take shifts.'
          : role === 'staff'
            ? 'Apply to work at Guardr — sign in anytime to finish ID and Stripe setup while a Director reviews. Staff runs in the browser; the Staff app is optional.'
            : clientSignupSubtitle
        : role === 'guard'
          ? 'After activation, shifts live in the Guard app. This website stays for your account.'
          : role === 'staff'
            ? 'Welcome back. Sign in with the Staff app, or continue here in the browser.'
            : 'After approval, coverage lives in the Customer app. This website stays for your account.'
      : center && hideBadge
        ? isSignUp
          ? role === 'guard'
            ? 'Finish application and activation on this website. After that you need the Guard app to take shifts.'
            : role === 'staff'
              ? 'Apply to work at Guardr — sign in anytime to finish ID and Stripe setup while a Director reviews. Staff runs in the browser; the Staff app is optional.'
              : 'Sign up and complete activation on this website. After approval you need the Customer app to post coverage.'
          : role === 'guard'
            ? 'After activation, shifts live in the Guard app. This website stays for your account.'
            : role === 'staff'
              ? 'Sign in with the Staff app, or enter your email and password here in the browser.'
              : 'After approval, coverage lives in the Customer app. This website stays for your account.'
        : isSignUp
        ? role === 'guard'
          ? 'Finish application and activation on this website. After that you need the Guard app to take shifts.'
          : role === 'staff'
            ? 'Apply to work at Guardr — sign in anytime to finish ID and Stripe setup while a Director reviews. Staff runs in the browser; the Staff app is optional.'
            : clientSignupSubtitle
        : role === 'guard'
          ? 'After activation, shifts live in the Guard app. This website stays for your account.'
          : role === 'staff'
            ? 'Welcome back. Sign in with the Staff app, or continue here in the browser.'
            : 'After approval, coverage lives in the Customer app. This website stays for your account.'

  if (variant === 'sheet') {
    return (
      <header className="auth-sheet-form-header">
        {!hideBadge ? (
          <p className="auth-sheet-eyebrow">{workspaceLabel}</p>
        ) : null}
        <h2 className="auth-sheet-title">{title}</h2>
        <p className="auth-sheet-subtitle">{subtitle}</p>
      </header>
    );
  }

  if (variant === 'role-choice') {
    return (
      <header className="auth-form-page-header">
        <h1 className="auth-form-page-title">{title}</h1>
        <p className="auth-form-page-subtitle">{subtitle}</p>
      </header>
    );
  }

  return (
    <Block marginBottom={compact ? 'scale600' : 'scale800'} $style={center ? { textAlign: 'center' } : undefined}>
      {hideBadge ? null : (
        <LandingBadge center={center}>{workspaceLabel}</LandingBadge>
      )}
      <HeadingLarge
        marginTop={hideBadge ? '0' : 'scale200'}
        marginBottom="scale300"
        overrides={{
          Block: {
            style: {
              fontWeight: center ? 700 : 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              fontSize: compact ? '24px' : center ? '30px' : undefined,
            },
          },
        }}
      >
        {title}
      </HeadingLarge>
      <ParagraphMedium marginTop="0" marginBottom="0" color="contentSecondary">
        {subtitle}
      </ParagraphMedium>
    </Block>
  );
}

export function AuthRolePicker({
  roles,
  value,
  onChange,
  showDescription = false,
  variant = 'default',
}: {
  roles: { id: 'guard' | 'client'; label: string; desc?: string; icon: LucideIcon }[];
  value: 'guard' | 'client';
  onChange: (id: 'guard' | 'client') => void;
  showDescription?: boolean;
  variant?: 'default' | 'sheet';
}) {
  if (variant === 'sheet') {
    return (
      <div>
        <p className="auth-sheet-role-label">Account type</p>
        <div className="auth-sheet-role-row" role="group" aria-label="Account type">
          {roles.map(({ id, label, icon: Icon }) => {
            const selected = value === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(id)}
                className="auth-sheet-role-btn"
                data-active={selected ? 'true' : undefined}
              >
                <Icon size={16} strokeWidth={1.75} aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Block marginBottom="scale600">
      <LabelSmall marginBottom="scale300" color="contentSecondary">
        Account type
      </LabelSmall>
      <div className="app-welcome-role-row">
        {roles.map(({ id, label, icon: Icon }) => {
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(id)}
              className="app-welcome-role-seg"
              data-active={selected ? 'true' : undefined}
            >
              <Icon size={16} strokeWidth={1.75} aria-hidden />
              {label}
              {showDescription && !selected ? null : null}
            </button>
          );
        })}
      </div>
    </Block>
  );
}
