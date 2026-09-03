import React from 'react';
import { Block } from 'baseui/block';
import { HeadingLarge, LabelSmall, ParagraphMedium } from 'baseui/typography';
import { useStyletron } from 'baseui';
import type { LucideIcon } from 'lucide-react';
import { LandingBadge } from '../landing/LandingPrimitives';
import type { ClientType } from '../../types';

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
      ? 'Guard sign in'
      : role === 'staff'
        ? 'Staff sign in'
        : 'Customer sign in';

  const title = variant === 'sheet' ? sheetTitle : pageTitle;

  const workspaceLabel =
    role === 'guard'
      ? 'Guard workspace'
      : role === 'staff'
        ? 'Staff workspace'
        : isPersonalClient
          ? 'Personal account'
          : isSecurityCompanyClient
            ? 'Security company account'
            : isBusinessClient
              ? 'Business account'
              : 'Customer workspace';

  const clientSignupSubtitle = isPersonalClient
    ? 'You hire and pay as an individual. Request coverage once or as often as you need — including recurring services.'
    : isSecurityCompanyClient
      ? 'Your licensed PPO hires independent contractor guards through Guardr — upload your PPO license after sign-up.'
      : isBusinessClient
        ? 'Your organization hires and pays, with extra tools for sites, staffing, and team access.'
        : 'Post jobs, browse guards, and manage coverage from your dashboard.';

  const subtitle =
    variant === 'sheet'
      ? isSignUp
        ? role === 'guard'
          ? 'Independent contractors manage credentials, jobs, and pay here.'
          : role === 'staff'
            ? 'Apply to work at Guardr — sign in anytime to finish ID and Stripe setup while a Director reviews.'
            : clientSignupSubtitle
        : role === 'guard'
          ? 'Welcome back — your jobs and earnings are ready.'
          : role === 'staff'
            ? 'Welcome back — your operations workspace is ready.'
            : 'Welcome back — your requests and coverage are ready.'
      : center && hideBadge
        ? isSignUp
          ? 'Enter your email below to create your account'
          : 'Enter your email and password to sign in'
        : isSignUp
          ? role === 'guard'
            ? 'Independent contractors manage credentials, jobs, and pay here.'
            : role === 'staff'
              ? 'Apply to work at Guardr — sign in anytime to finish ID and Stripe setup while a Director reviews.'
              : clientSignupSubtitle
          : role === 'guard'
            ? 'Welcome back — your jobs and earnings are ready.'
            : role === 'staff'
              ? 'Welcome back — your operations workspace is ready.'
              : 'Welcome back — your requests and coverage are ready.';

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
