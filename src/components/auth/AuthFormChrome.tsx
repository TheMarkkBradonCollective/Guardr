import React from 'react';
import { Block } from 'baseui/block';
import { HeadingLarge, LabelSmall, ParagraphMedium } from 'baseui/typography';
import { useStyletron } from 'baseui';
import type { LucideIcon } from 'lucide-react';
import { GuardrCard } from '../baseui/GuardrCard';
import { AccentIcon } from '../baseui/dashboard';
import { AppSegmentedControl } from '../ui/app/AppPrimitives';
import { LandingBadge } from '../landing/LandingUberPrimitives';

export function AuthFormHeader({
  role,
  isSignUp,
  compact = false,
}: {
  role: 'guard' | 'client';
  isSignUp: boolean;
  compact?: boolean;
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
    <Block marginBottom={compact ? 'scale600' : 'scale800'}>
      <LandingBadge>{role === 'guard' ? 'Guard workspace' : 'Client workspace'}</LandingBadge>
      <HeadingLarge
        marginTop="scale200"
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
  const [, theme] = useStyletron();

  return (
    <Block marginBottom="scale700">
      <LabelSmall marginBottom="scale400" color="contentSecondary">
        Account type
      </LabelSmall>
      <Block display="grid" gridTemplateColumns="1fr 1fr" gridGap="scale400">
        {roles.map(({ id, label, desc, icon: Icon }) => {
          const selected = value === id;
          return (
            <GuardrCard
              key={id}
              interactive
              onClick={() => onChange(id)}
              overrides={{
                Root: {
                  style: {
                    cursor: 'pointer',
                    borderColor: selected ? 'accent' : 'borderOpaque',
                    backgroundColor: selected ? 'accent50' : 'backgroundPrimary',
                  },
                },
              }}
            >
              <Block marginBottom="scale300">
                <AccentIcon icon={Icon} size={20} strokeWidth={1.75} />
              </Block>
              <Block
                as="p"
                margin="0"
                $style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: selected ? theme.colors.accent : theme.colors.contentPrimary,
                }}
              >
                {label}
              </Block>
              {showDescription && desc ? (
                <ParagraphMedium marginTop="scale200" marginBottom="0" color="contentSecondary">
                  {desc}
                </ParagraphMedium>
              ) : null}
            </GuardrCard>
          );
        })}
      </Block>
    </Block>
  );
}
