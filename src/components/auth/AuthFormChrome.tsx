import React from 'react';
import { Block } from 'baseui/block';
import { HeadingLarge, LabelSmall, ParagraphMedium } from 'baseui/typography';
import { useStyletron } from 'baseui';
import type { LucideIcon } from 'lucide-react';
import { AppSegmentedControl } from '../ui/app/AppPrimitives';
import { LandingBadge } from '../landing/LandingUberPrimitives';

export function AuthFormHeader({
  role,
  isSignUp,
  compact = false,
  hideBadge = false,
  center = false,
}: {
  role: 'guard' | 'client';
  isSignUp: boolean;
  compact?: boolean;
  hideBadge?: boolean;
  center?: boolean;
}) {
  const title = isSignUp
    ? role === 'guard'
      ? 'Create your guard account'
      : 'Create your client account'
    : 'Sign in';

  const subtitle = isSignUp
    ? role === 'guard'
      ? 'Independent contractors manage credentials, jobs, and pay here.'
      : 'Post jobs, browse guards, and manage site coverage from your dashboard.'
    : role === 'guard'
      ? 'Welcome back — your jobs and earnings are ready.'
      : 'Welcome back — your requests and coverage are ready.';

  return (
    <Block marginBottom={compact ? 'scale600' : 'scale800'} $style={center ? { textAlign: 'center' } : undefined}>
      {hideBadge ? null : (
        <LandingBadge center={center}>{role === 'guard' ? 'Guard workspace' : 'Client workspace'}</LandingBadge>
      )}
      <HeadingLarge
        marginTop={hideBadge ? '0' : 'scale200'}
        marginBottom="scale300"
        overrides={{
          Block: {
            style: {
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              fontSize: compact ? '24px' : undefined,
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

export function AuthModeToggle({
  isSignUp,
  onSignIn,
  onSignUp,
}: {
  isSignUp: boolean;
  onSignIn: () => void;
  onSignUp: () => void;
}) {
  return (
    <Block marginBottom="scale700">
      <AppSegmentedControl
        options={[
          { id: 'sign-in' as const, label: 'Sign in' },
          { id: 'sign-up' as const, label: 'Sign up' },
        ]}
        value={isSignUp ? 'sign-up' : 'sign-in'}
        onChange={(id) => (id === 'sign-up' ? onSignUp() : onSignIn())}
      />
    </Block>
  );
}

export function AuthRolePicker({
  roles,
  value,
  onChange,
  showDescription = false,
}: {
  roles: { id: 'guard' | 'client'; label: string; desc?: string; icon: LucideIcon }[];
  value: 'guard' | 'client';
  onChange: (id: 'guard' | 'client') => void;
  showDescription?: boolean;
}) {
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
