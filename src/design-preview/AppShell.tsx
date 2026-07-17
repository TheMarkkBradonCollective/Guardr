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
  GuardrDrawerShell,
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

function PreviewDrawerShell({
  page,
  frameSize,
  navItems,
  activeId,
}: {
  page: PreviewPage;
  frameSize: FrameSize;
  navItems: ReturnType<typeof toGuardrNavItems>;
  activeId: string;
}) {
  const isMap = page.type.startsWith('map-');
  const noop = () => undefined;

  return (
    <Block minHeight={frameSize === 'mobile' ? '720px' : '680px'} position="relative">
      <GuardrDrawerShell
        workspaceLabel={BRAND_LABEL[page.layout]}
        title={page.title}
        navGroups={
          page.layout === 'staff'
            ? staffNavGroups()
            : [{ title: 'Menu', items: navItems }]
        }
        activeNavId={activeId}
        onNavigate={noop}
        accountMenu={
          <ParagraphMedium $style={{ fontWeight: 600, fontSize: '14px' }}>Hello Alex</ParagraphMedium>
        }
        bleed={isMap}
        hideHeader={isMap}
      >
        <PageContent page={page} frameSize={frameSize} />
      </GuardrDrawerShell>
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
  const navItems = toGuardrNavItems(navForLayout(page.layout));
  const activeId = page.nav ?? '';

  if (page.layout === 'public' && page.type !== 'app-welcome' && page.type !== 'auth-sheet') {
    return (
      <Block minHeight="560px" backgroundColor="backgroundPrimary">
        <PublicPageChrome themeMode={themeMode} onChangeTheme={saveTheme} sticky={false} />
        <Block padding="scale600">
          <PageContent page={page} frameSize={frameSize} />
        </Block>
      </Block>
    );
  }

  if (page.type === 'app-welcome' || page.type === 'auth-sheet') {
    return (
      <Block minHeight="680px" backgroundColor="backgroundPrimary" overflow="hidden">
        <PageContent page={page} frameSize={frameSize} />
      </Block>
    );
  }

  return <PreviewDrawerShell page={page} frameSize={frameSize} navItems={navItems} activeId={activeId} />;
}
