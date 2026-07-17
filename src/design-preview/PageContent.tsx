import React from 'react';
import { Block } from 'baseui/block';
import { Card, StyledBody } from 'baseui/card';
import { Button } from 'baseui/button';
import { Tag } from './baseuiShims';
import { Grid, Cell } from 'baseui/layout-grid';
import { Input } from 'baseui/input';
import { ParagraphMedium, HeadingMedium, HeadingLarge, LabelSmall } from 'baseui/typography';
import type { PreviewPage } from './pages';

function Skeleton({ height = '12px', width = '100%' }: { height?: string; width?: string }) {
  return (
    <Block
      height={height}
      width={width}
      backgroundColor="backgroundSecondary"
      overrides={{ Block: { style: { borderRadius: '6px' } } }}
    />
  );
}

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
          <Block
            width="40px"
            height="40px"
            backgroundColor="backgroundSecondary"
            overrides={{ Block: { style: { borderRadius: '50%' } } }}
          />
          <Block flex="1">
            <Skeleton width="70%" />
            <Block height="scale200" />
            <Skeleton width="45%" />
          </Block>
        </Block>
      ))}
    </Block>
  );
}

function DashboardWidgets() {
  return (
    <Block>
      <Block display="flex" gridGap="scale400" overflow="auto" paddingBottom="scale400">
        {['Staples Center', 'Retail patrol', 'Event security'].map((title, i) => (
          <Card key={title} overrides={{ Root: { style: { minWidth: '200px', flex: '0 0 auto' } } }}>
            <StyledBody>
              <LabelSmall $style={{ color: 'contentSecondary' }}>UPCOMING</LabelSmall>
              <ParagraphMedium $style={{ fontWeight: 700, marginTop: '4px' }}>{title}</ParagraphMedium>
              <HeadingMedium $style={{ marginTop: '12px' }}>${[42, 28, 35][i]}/hr</HeadingMedium>
              {i === 0 && (
                <Tag closeable={false} kind="accent" overrides={{ Root: { style: { marginTop: '8px' } } }}>
                  Surge 1.8×
                </Tag>
              )}
            </StyledBody>
          </Card>
        ))}
      </Block>
      <Grid gridGutters={16} gridMargins={0} gridMaxWidth={1200}>
        {['Active', 'Rating', 'Earnings', 'On-time'].map((label) => (
          <Cell key={label} span={[4, 3, 3]}>
            <Card>
              <StyledBody>
                <LabelSmall $style={{ color: 'contentSecondary' }}>{label.toUpperCase()}</LabelSmall>
                <HeadingLarge $style={{ marginTop: '8px' }}>—</HeadingLarge>
              </StyledBody>
            </Card>
          </Cell>
        ))}
        <Cell span={[8, 8, 8]}>
          <Card>
            <StyledBody>
              <LabelSmall $style={{ color: 'contentSecondary' }}>TREND</LabelSmall>
              <Block height="140px" marginTop="scale400" backgroundColor="backgroundSecondary" overrides={{ Block: { style: { borderRadius: '8px' } } }} />
            </StyledBody>
          </Card>
        </Cell>
        <Cell span={[4, 4, 4]}>
          <Card>
            <StyledBody>
              <LabelSmall $style={{ color: 'contentSecondary' }}>ACTIVITY</LabelSmall>
              <Block marginTop="scale400"><Skeleton /><Block height="8px" /><Skeleton width="80%" /></Block>
            </StyledBody>
          </Card>
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
          <Tag key={chip} closeable={false} kind={i === 0 ? 'accent' : 'neutral'}>
            {chip}
          </Tag>
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
            <Button size="compact" overrides={{ BaseButton: { style: { flex: 1 } } }}>Approve</Button>
            <Button size="compact" kind="secondary" overrides={{ BaseButton: { style: { flex: 1 } } }}>Deny</Button>
          </Block>
        </Block>
      ) : (
        <Block position="absolute" bottom="0" left="0" right="0" padding="scale400" display="flex" gridGap="scale400" overflow="auto">
          <Card overrides={{ Root: { style: { minWidth: '220px', flex: '0 0 auto' } } }}>
            <StyledBody>
              <ParagraphMedium $style={{ fontWeight: 700 }}>
                {variant === 'client' ? 'Live shift · Guard en route' : 'Event security · Downtown'}
              </ParagraphMedium>
              <ParagraphMedium $style={{ color: 'contentSecondary', marginTop: '4px' }}>
                {variant === 'client' ? 'Staples Center · ETA 8 min' : 'Tonight 6:00 PM · Surge 1.8×'}
              </ParagraphMedium>
              <Block display="flex" justifyContent="space-between" alignItems="center" marginTop="scale500">
                <HeadingMedium>{variant === 'client' ? 'Track →' : '$42/hr'}</HeadingMedium>
                <Button size="compact">{variant === 'client' ? 'Chat' : 'Apply'}</Button>
              </Block>
            </StyledBody>
          </Card>
        </Block>
      )}
      {variant === 'guard' && (
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
      )}
    </Block>
  );
}

export function PageContent({ page }: { page: PreviewPage }) {
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
    case 'landing':
      return (
        <Block padding="scale1000" overrides={{ Block: { style: { textAlign: 'center' } } }}>
          <HeadingLarge>Security, on demand</HeadingLarge>
          <ParagraphMedium $style={{ color: 'contentSecondary', marginTop: '8px' }}>
            Licensed guards for events, retail, corporate, and more.
          </ParagraphMedium>
          <Block marginTop="scale800" display="flex" justifyContent="center" gridGap="scale400">
            <Button>Get started</Button>
            <Button kind="secondary">Sign in</Button>
          </Block>
        </Block>
      );
    case 'auth':
    case 'auth-signup':
      return (
        <Block maxWidth="400px" margin="scale1000 auto" padding="scale600">
          <HeadingMedium>{page.type === 'auth-signup' ? 'Create account' : 'Welcome back'}</HeadingMedium>
          <Block marginTop="scale600" display="flex" flexDirection="column" gridGap="scale500">
            <Input placeholder="Email" />
            <Input placeholder="Password" type="password" />
            <Button>{page.type === 'auth-signup' ? 'Sign up' : 'Sign in'}</Button>
          </Block>
        </Block>
      );
    case 'form':
      return (
        <Block maxWidth="420px">
          {['Title', 'Location', 'Date', 'Notes'].map((f) => (
            <Block key={f} marginBottom="scale500">
              <LabelSmall $style={{ marginBottom: '6px' }}>{f}</LabelSmall>
              <Input placeholder={f} />
            </Block>
          ))}
          <Button>Continue</Button>
        </Block>
      );
    case 'messages':
      return (
        <Grid gridGutters={16} gridMargins={0}>
          <Cell span={[4, 4, 4]}>
            <Card><StyledBody><PlaceholderList /></StyledBody></Card>
          </Cell>
          <Cell span={[8, 8, 8]}>
            <Card overrides={{ Root: { style: { minHeight: '400px' } } }}>
              <StyledBody>
                <Block marginTop="auto" paddingTop="scale800">
                  <Skeleton width="55%" />
                  <Block height="scale400" />
                  <Input placeholder="Message…" />
                </Block>
              </StyledBody>
            </Card>
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
          <Block marginTop="scale800" overrides={{ Block: { style: { textAlign: 'left' } } }}><PlaceholderList /></Block>
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
              <Card><StyledBody><Skeleton height="48px" width="48px" /><Block height="8px" /><Skeleton /></StyledBody></Card>
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
          <Skeleton height="80px" />
          <Block height="scale600" />
          <PlaceholderList />
        </Block>
      );
  }
}
