import React from 'react';
import { Block } from 'baseui/block';
import { ParagraphMedium, LabelSmall } from 'baseui/typography';
import type { PreviewPage } from './pages';
import { BRAND_LABEL, navForLayout } from './nav';
import { staffNavGroups, toGuardrNavItems } from './previewNavIcons';
import { PageContent } from './PageContent';
import {
  GuardrTag,
  GuardrSideNav,
  GuardrIconRail,
  GuardrBottomNav,
  PublicPageChrome,
} from '../components/baseui';
import { useThemeMode } from '../lib/platform/useThemeMode';
import { saveTheme } from '../lib/platform/theme';

export type FrameSize = 'desktop' | 'tablet' | 'mobile';

function UberTopbar({ title }: { title: string }) {
  return (
    <Block
      display="flex"
      alignItems="center"
      gridGap="scale500"
      paddingTop="scale400"
      paddingBottom="scale400"
      paddingLeft="scale600"
      paddingRight="scale600"
      backgroundColor="backgroundPrimary"
      overrides={{ Block: { style: { borderBottom: '1px solid', borderColor: 'borderOpaque' } } }}
    >
      <GuardrTag kind="neutral" closeable={false}>
        Los Angeles
      </GuardrTag>
      <Block flex="1" overflow="hidden" $style={{ fontSize: '12px', color: 'contentSecondary' }}>
        <strong className="uber-text-accent">Surge</strong> — Downtown demand active
      </Block>
      <GuardrTag kind="accent" closeable={false} overrides={{ Root: { style: { minWidth: '20px' } } }}>
        3
      </GuardrTag>
      <ParagraphMedium $style={{ fontWeight: 600 }}>Hello Alex</ParagraphMedium>
      <Block
        width="34px"
        height="34px"
        backgroundColor="backgroundSecondary"
        overrides={{ Block: { style: { borderRadius: '50%', border: '2px solid', borderColor: 'accent' } } }}
      />
    </Block>
  );
}

function BrandMark({ layout, compact }: { layout: string; compact?: boolean }) {
  return (
    <Block padding="scale600" paddingBottom="scale500" display="flex" alignItems="center" gridGap="scale400">
      <Block
        width="32px"
        height="32px"
        backgroundColor="accent"
        display="flex"
        alignItems="center"
        justifyContent="center"
        overrides={{ Block: { style: { borderRadius: '8px', color: '#fff', fontWeight: 800, fontSize: '13px' } } }}
      >
        G
      </Block>
      {!compact ? <ParagraphMedium $style={{ fontWeight: 800 }}>{BRAND_LABEL[layout]}</ParagraphMedium> : null}
    </Block>
  );
}

export function AppShell({
  page,
  frameSize,
}: {
  page: PreviewPage;
  frameSize: FrameSize;
}) {
  const themeMode = useThemeMode();
  const isMap = page.type.startsWith('map-');
  const navItems = toGuardrNavItems(navForLayout(page.layout));
  const activeId = page.nav ?? '';
  const noop = () => undefined;

  if (page.layout === 'public') {
    return (
      <Block minHeight="560px" backgroundColor="backgroundPrimary">
        <PublicPageChrome themeMode={themeMode} onChangeTheme={saveTheme} sticky={false} />
        <Block padding="scale600">
          <PageContent page={page} />
        </Block>
      </Block>
    );
  }

  if (frameSize === 'mobile') {
    return (
      <Block display="flex" flexDirection="column" minHeight="720px" backgroundColor="backgroundPrimary">
        <UberTopbar title={page.title} />
        <Block flex="1" overflow="hidden" padding={isMap ? '0' : 'scale500'}>
          <PageContent page={page} />
        </Block>
        <GuardrBottomNav
          items={navItems.slice(0, 4)}
          activeId={activeId}
          onNavigate={noop}
          flat
        />
      </Block>
    );
  }

  if (frameSize === 'tablet') {
    return (
      <Block display="flex" minHeight="680px" backgroundColor="backgroundPrimary">
        <GuardrIconRail
          items={navItems}
          activeId={activeId}
          onSelect={noop}
          brand={<BrandMark layout={page.layout} compact />}
        />
        <Block flex="1" display="flex" flexDirection="column" minWidth="0">
          <UberTopbar title={page.title} />
          <Block flex="1" overflow="hidden" padding={isMap ? '0' : 'scale600'}>
            <PageContent page={page} />
          </Block>
        </Block>
      </Block>
    );
  }

  return (
    <Block display="flex" minHeight="680px" backgroundColor="backgroundPrimary">
      <Block
        overrides={{
          Block: {
            style: {
              width: '228px',
              flexShrink: 0,
              backgroundColor: 'inherit',
              borderRight: '1px solid',
              borderColor: 'borderOpaque',
            },
          },
        }}
      >
        <BrandMark layout={page.layout} />
        {page.layout === 'staff' ? (
          <GuardrSideNav groups={staffNavGroups()} activeId={activeId} onSelect={noop} />
        ) : (
          <GuardrSideNav items={navItems} activeId={activeId} onSelect={noop} />
        )}
        {page.layout === 'guard' && (
          <Block
            margin="scale400"
            padding="scale500"
            backgroundColor="backgroundSecondary"
            overrides={{ Block: { style: { borderRadius: '12px', marginLeft: '12px', marginRight: '12px' } } }}
          >
            <LabelSmall $style={{ color: 'contentSecondary' }}>STATUS</LabelSmall>
            <ParagraphMedium $style={{ fontWeight: 700, marginTop: '4px' }}>Online · accepting</ParagraphMedium>
          </Block>
        )}
      </Block>
      <Block flex="1" display="flex" flexDirection="column" minWidth="0">
        <UberTopbar title={page.title} />
        {!isMap && ['dashboard', 'earnings', 'list'].includes(page.type) && (
          <Block display="flex" paddingLeft="scale600" overrides={{ Block: { style: { borderBottom: '1px solid', borderColor: 'borderOpaque' } } }}>
            {['Overview', 'Details', 'Activity'].map((tab, i) => (
              <Block
                key={tab}
                padding="scale500"
                overrides={{
                  Block: {
                    style: {
                      borderBottom: i === 0 ? '2px solid' : 'none',
                      borderColor: 'accent',
                      color: i === 0 ? 'inherit' : undefined,
                    },
                  },
                }}
              >
                <LabelSmall>{tab}</LabelSmall>
              </Block>
            ))}
          </Block>
        )}
        <Block flex="1" overflow="hidden" padding={isMap ? '0' : 'scale600'}>
          <PageContent page={page} />
        </Block>
      </Block>
    </Block>
  );
}
