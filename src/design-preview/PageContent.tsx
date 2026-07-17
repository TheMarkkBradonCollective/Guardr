import React from 'react';
import { Block } from 'baseui/block';
import { Grid, Cell } from 'baseui/layout-grid';
import { ParagraphMedium, HeadingMedium, HeadingLarge, LabelSmall } from 'baseui/typography';
import {
  GuardrTag,
  AppCarousel,
  GuardrCard,
  GuardrButton,
  GuardrInput,
  GuardrSkeleton,
  MetricCell,
  MetricStrip,
  DashboardZone,
} from '../components/baseui';
import type { PreviewPage } from './pages';
import type { FrameSize } from './AppShell';
import { AppHomeScreen } from '../components/AppHomeScreen';
import { AuthFormHeader, AuthModeToggle, AuthRolePicker } from '../components/auth/AuthFormChrome';
import { useThemeMode } from '../lib/platform/useThemeMode';
import { saveTheme } from '../lib/platform/theme';
import type { FormFactor } from '../lib/platform/device';
import { Building2, Shield } from 'lucide-react';
import { useState } from 'react';

function PlaceholderList() {
  return (
    <Block>
      {Array.from({ length: 5 }).map((_, i) => (
        <Block
          key={i}
          display="flex"
          alignItems="center"
          gridGap="scale600"
          paddingTop="scale400"
          paddingBottom="scale400"
          overrides={{ Block: { style: { borderBottom: '1px solid', borderColor: 'borderOpaque' } } }}
        >
          <GuardrSkeleton height="40px" width="40px" circle />
          <Block flex="1">
            <GuardrSkeleton width="70%" />
            <Block height="scale200" />
            <GuardrSkeleton width="45%" />
          </Block>
        </Block>
      ))}
    </Block>
  );
}

function DashboardWidgets() {
  const featured = ['Staples Center', 'Retail patrol', 'Event security'];
  return (
    <Block>
      <AppCarousel showDots edgeFade activeScale={1.02} gap={16} label="Featured jobs">
        {featured.map((title, i) => (
          <GuardrCard key={title} overrides={{ Root: { style: { minWidth: '200px' } } }}>
            <LabelSmall $style={{ color: 'contentSecondary' }}>UPCOMING</LabelSmall>
            <ParagraphMedium $style={{ fontWeight: 700, marginTop: '4px' }}>{title}</ParagraphMedium>
            <HeadingMedium $style={{ marginTop: '12px' }}>${[42, 28, 35][i]}/hr</HeadingMedium>
            {i === 0 ? (
              <GuardrTag kind="accent" closeable={false}>
                Surge 1.8×
              </GuardrTag>
            ) : null}
          </GuardrCard>
        ))}
      </AppCarousel>
      <DashboardZone title="Metrics">
        <MetricStrip>
          {['Active', 'Rating', 'Earnings', 'On-time'].map((label, i) => (
            <MetricCell key={label} label={label} value="—" accent={i === 0} />
          ))}
        </MetricStrip>
      </DashboardZone>
      <Grid gridGutters={16} gridMargins={0} gridMaxWidth={1200}>
        <Cell span={[8, 8, 8]}>
          <GuardrCard>
            <LabelSmall $style={{ color: 'contentSecondary' }}>TREND</LabelSmall>
            <Block
              height="140px"
              marginTop="scale400"
              backgroundColor="backgroundSecondary"
              overrides={{ Block: { style: { borderRadius: '8px' } } }}
            />
          </GuardrCard>
        </Cell>
        <Cell span={[4, 4, 4]}>
          <GuardrCard>
            <LabelSmall $style={{ color: 'contentSecondary' }}>ACTIVITY</LabelSmall>
            <Block marginTop="scale400">
              <GuardrSkeleton />
              <Block height="8px" />
              <GuardrSkeleton width="80%" />
            </Block>
          </GuardrCard>
        </Cell>
      </Grid>
    </Block>
  );
}

function MapMock({ variant }: { variant: 'guard' | 'client' | 'staff' }) {
  return (
    <Block position="relative" height="100%" minHeight="520px" backgroundColor="backgroundPrimary">
      <Block
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        overrides={{
          Block: {
            style: {
              background:
                'radial-gradient(ellipse 160px 100px at 55% 45%, rgba(39,110,241,0.35), transparent), radial-gradient(ellipse 90px 70px at 28% 35%, rgba(39,110,241,0.15), transparent), #000',
            },
          },
        }}
      />
      <Block position="absolute" top="scale400" left="scale400" right="scale400" display="flex" gridGap="scale300" flexWrap>
        {(variant === 'guard'
          ? ['Open', 'Applied', 'Assigned', 'Active']
          : variant === 'client'
            ? ['All', 'Live', 'Scheduled', 'Completed']
            : ['All jobs', 'Pending', 'Live', 'Needs review']
        ).map((chip, i) => (
          <GuardrTag key={chip} kind={i === 0 ? 'accent' : 'neutral'} closeable={false}>
            {chip}
          </GuardrTag>
        ))}
      </Block>
      {variant === 'staff' ? (
        <Block
          position="absolute"
          top="0"
          right="0"
          bottom="0"
          width="280px"
          padding="scale600"
          backgroundColor="backgroundSecondary"
          overrides={{ Block: { style: { borderLeft: '1px solid', borderColor: 'borderOpaque' } } }}
        >
          <LabelSmall $style={{ color: 'contentSecondary' }}>SELECTED JOB</LabelSmall>
          <ParagraphMedium $style={{ fontWeight: 700, marginTop: '8px' }}>Corporate lobby · Night shift</ParagraphMedium>
          <ParagraphMedium $style={{ color: 'contentSecondary', marginTop: '4px' }}>Client: Acme Corp · 3 applicants</ParagraphMedium>
          <Block marginTop="auto" display="flex" gridGap="scale300" paddingTop="scale800">
            <Block flex="1">
              <GuardrButton size="compact" fullWidth>
                Approve
              </GuardrButton>
            </Block>
            <Block flex="1">
              <GuardrButton size="compact" kind="secondary" fullWidth>
                Deny
              </GuardrButton>
            </Block>
          </Block>
        </Block>
      ) : (
        <Block position="absolute" bottom="0" left="0" right="0" padding="scale400" display="flex" gridGap="scale400" overflow="auto">
          <GuardrCard overrides={{ Root: { style: { minWidth: '220px', flex: '0 0 auto' } } }}>
            <ParagraphMedium $style={{ fontWeight: 700 }}>
              {variant === 'client' ? 'Live shift · Guard en route' : 'Event security · Downtown'}
            </ParagraphMedium>
            <ParagraphMedium $style={{ color: 'contentSecondary', marginTop: '4px' }}>
              {variant === 'client' ? 'Staples Center · ETA 8 min' : 'Tonight 6:00 PM · Surge 1.8×'}
            </ParagraphMedium>
            <Block display="flex" justifyContent="space-between" alignItems="center" marginTop="scale500">
              <HeadingMedium>{variant === 'client' ? 'Track →' : '$42/hr'}</HeadingMedium>
              <GuardrButton size="compact">{variant === 'client' ? 'Chat' : 'Apply'}</GuardrButton>
            </Block>
          </GuardrCard>
        </Block>
      )}
      {variant === 'guard' ? (
        <Block
          padding="scale500"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          backgroundColor="backgroundSecondary"
          overrides={{ Block: { style: { borderTop: '1px solid', borderColor: 'borderOpaque' } } }}
        >
          <Block>
            <ParagraphMedium $style={{ fontWeight: 700 }}>You're online</ParagraphMedium>
            <LabelSmall $style={{ color: 'contentSecondary' }}>Accepting jobs</LabelSmall>
          </Block>
          <Block width="48px" height="28px" backgroundColor="accent" overrides={{ Block: { style: { borderRadius: '999px' } } }} />
        </Block>
      ) : null}
    </Block>
  );
}

function previewFormFactor(frameSize: FrameSize): FormFactor {
  if (frameSize === 'mobile') return 'mobile';
  if (frameSize === 'tablet') return 'tablet';
  return 'desktop';
}

const PREVIEW_ROLES = [
  { id: 'guard' as const, label: 'Guard', icon: Shield },
  { id: 'client' as const, label: 'Client', icon: Building2 },
];

function AppWelcomePreview({ page, frameSize }: { page: PreviewPage; frameSize: FrameSize }) {
  const themeMode = useThemeMode();
  return (
    <AppHomeScreen
      themeMode={themeMode}
      onChangeTheme={saveTheme}
      onNavigateToAuth={() => undefined}
      onOpenLegal={() => undefined}
      authSheetOpen={page.type === 'auth-sheet'}
      previewOverrides={{
        shellKind: page.shellKind ?? 'pwa',
        formFactor: previewFormFactor(frameSize),
      }}
    />
  );
}

function AuthSheetMock() {
  const [role, setRole] = useState<'guard' | 'client'>('guard');
  const [isSignUp, setIsSignUp] = useState(false);
  return (
    <Block
      position="absolute"
      left={0}
      right={0}
      bottom={0}
      backgroundColor="backgroundPrimary"
      padding="scale600"
      overrides={{
        Block: {
          style: {
            borderTopLeftRadius: '1.35rem',
            borderTopRightRadius: '1.35rem',
            borderTop: '1px solid var(--uber-border)',
            maxHeight: '72%',
            overflow: 'auto',
          },
        },
      }}
    >
      <AuthFormHeader role={role} isSignUp={isSignUp} compact />
      <AuthModeToggle
        isSignUp={isSignUp}
        onSignIn={() => setIsSignUp(false)}
        onSignUp={() => setIsSignUp(true)}
      />
      <AuthRolePicker roles={PREVIEW_ROLES} value={role} onChange={setRole} />
      <GuardrButton fullWidth>{isSignUp ? 'Create account' : 'Sign in'}</GuardrButton>
    </Block>
  );
}

export function PageContent({ page, frameSize = 'desktop' }: { page: PreviewPage; frameSize?: FrameSize }) {
  switch (page.type) {
    case 'map-guard':
      return <MapMock variant="guard" />;
    case 'map-client':
      return <MapMock variant="client" />;
    case 'map-staff':
      return <MapMock variant="staff" />;
    case 'dashboard':
    case 'earnings':
      return <DashboardWidgets />;
    case 'app-welcome':
      return <AppWelcomePreview page={page} frameSize={frameSize} />;
    case 'auth-sheet':
      return (
        <Block position="relative" minHeight="680px" height="680px" overflow="hidden">
          <AppWelcomePreview page={{ ...page, type: 'app-welcome' }} frameSize={frameSize} />
          <AuthSheetMock />
        </Block>
      );
    case 'landing':
      return (
        <Block padding="scale1000" overrides={{ Block: { style: { textAlign: 'center' } } }}>
          <HeadingLarge>Security, on demand</HeadingLarge>
          <ParagraphMedium $style={{ color: 'contentSecondary', marginTop: '8px' }}>
            Licensed guards for events, retail, corporate, and more.
          </ParagraphMedium>
          <Block marginTop="scale800" display="flex" justifyContent="center" gridGap="scale400">
            <GuardrButton>Get started</GuardrButton>
            <GuardrButton kind="secondary">Sign in</GuardrButton>
          </Block>
        </Block>
      );
    case 'auth':
    case 'auth-signup':
      return (
        <Block maxWidth="400px" margin="scale1000 auto" padding="scale600">
          <HeadingMedium>{page.type === 'auth-signup' ? 'Create account' : 'Welcome back'}</HeadingMedium>
          <Block marginTop="scale600" display="flex" flexDirection="column" gridGap="scale500">
            <GuardrInput placeholder="Email" />
            <GuardrInput placeholder="Password" type="password" />
            <GuardrButton>{page.type === 'auth-signup' ? 'Sign up' : 'Sign in'}</GuardrButton>
          </Block>
        </Block>
      );
    case 'form':
      return (
        <Block maxWidth="420px">
          {['Title', 'Location', 'Date', 'Notes'].map((f) => (
            <Block key={f} marginBottom="scale500">
              <LabelSmall $style={{ marginBottom: '6px' }}>{f}</LabelSmall>
              <GuardrInput placeholder={f} />
            </Block>
          ))}
          <GuardrButton>Continue</GuardrButton>
        </Block>
      );
    case 'messages':
      return (
        <Grid gridGutters={16} gridMargins={0}>
          <Cell span={[4, 4, 4]}>
            <GuardrCard>
              <PlaceholderList />
            </GuardrCard>
          </Cell>
          <Cell span={[8, 8, 8]}>
            <GuardrCard overrides={{ Root: { style: { minHeight: '400px' } } }}>
              <Block marginTop="auto" paddingTop="scale800">
                <GuardrSkeleton width="55%" />
                <Block height="scale400" />
                <GuardrInput placeholder="Message…" />
              </Block>
            </GuardrCard>
          </Cell>
        </Grid>
      );
    case 'activation':
      return (
        <Block maxWidth="420px" margin="scale1000 auto" overrides={{ Block: { style: { textAlign: 'center' } } }}>
          <HeadingMedium>Complete activation</HeadingMedium>
          <ParagraphMedium $style={{ color: 'contentSecondary', marginTop: '8px' }}>
            Upload credentials to start accepting jobs
          </ParagraphMedium>
          <Block marginTop="scale800" overrides={{ Block: { style: { textAlign: 'left' } } }}>
            <PlaceholderList />
          </Block>
        </Block>
      );
    case 'guide':
    case 'legal':
    case 'list':
      return <PlaceholderList />;
    case 'grid':
      return (
        <Grid gridGutters={16} gridMargins={0}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Cell key={i} span={[4, 4, 4]}>
              <GuardrCard>
                <GuardrSkeleton height="48px" width="48px" />
                <Block height="8px" />
                <GuardrSkeleton />
              </GuardrCard>
            </Cell>
          ))}
        </Grid>
      );
    case 'profile':
    case 'settings':
    case 'calendar':
    default:
      return (
        <Block>
          <GuardrSkeleton height="80px" />
          <Block height="scale600" />
          <PlaceholderList />
        </Block>
      );
  }
}
