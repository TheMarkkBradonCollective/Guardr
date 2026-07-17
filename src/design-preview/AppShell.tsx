import React from 'react';
import { Block } from 'baseui/block';
import { Navigation } from 'baseui/side-navigation';
import { ParagraphMedium, LabelSmall } from 'baseui/typography';
import type { PreviewPage } from './pages';
import { BRAND_LABEL, navForLayout, STAFF_GROUPS, STAFF_NAV } from './nav';
import { PageContent } from './PageContent';
import { Tag } from './baseuiShims';

export type FrameSize = 'desktop' | 'tablet' | 'mobile';

function buildNavItems(layout: string, activeNav?: string) {
  if (layout === 'staff') {
    return STAFF_GROUPS.flatMap((group) => {
      const items = group.ids
        .map((id) => STAFF_NAV.find((n) => n.id === id))
        .filter(Boolean)
        .map((n) => ({
          title: n!.label,
          itemId: n!.id,
        }));
      if (!items.length) return [];
      return [{ title: group.title, itemId: `__group_${group.title}`, disabled: true }, ...items];
    });
  }
  return navForLayout(layout).map((n) => ({ title: n.label, itemId: n.id }));
}

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
      <Tag closeable={false} kind="neutral">Los Angeles</Tag>
      <Block flex="1" overflow="hidden" $style={{ fontSize: '12px', color: 'contentSecondary' }}>
        <strong style={{ color: '#F5A623' }}>Surge</strong> — Downtown demand active
      </Block>
      <Tag closeable={false} kind="accent" overrides={{ Root: { style: { minWidth: '20px' } } }}>3</Tag>
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

export function AppShell({
  page,
  frameSize,
}: {
  page: PreviewPage;
  frameSize: FrameSize;
}) {
  const isMap = page.type.startsWith('map-');
  const navItems = buildNavItems(page.layout, page.nav);
  const activeId = page.nav ?? '';

  if (page.layout === 'public') {
    return (
      <Block minHeight="560px" backgroundColor="backgroundPrimary">
        <Block padding="scale500" overrides={{ Block: { style: { borderBottom: '1px solid', borderColor: 'borderOpaque' } } }}>
          <ParagraphMedium $style={{ fontWeight: 700 }}>Guardr</ParagraphMedium>
        </Block>
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
        <Block
          display="flex"
          justifyContent="space-around"
          paddingTop="scale300"
          paddingBottom="scale500"
          backgroundColor="backgroundPrimary"
          overrides={{ Block: { style: { borderTop: '1px solid', borderColor: 'borderOpaque' } } }}
        >
          {navForLayout(page.layout).slice(0, 4).map((n) => (
            <Block key={n.id} overrides={{ Block: { style: { textAlign: 'center', padding: '8px' } } }}>
              <LabelSmall $style={{ color: n.id === activeId ? 'accent' : 'contentSecondary' }}>{n.label}</LabelSmall>
            </Block>
          ))}
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
              width: frameSize === 'tablet' ? '72px' : '228px',
              flexShrink: 0,
              backgroundColor: 'inherit',
              borderRight: '1px solid',
              borderColor: 'borderOpaque',
            },
          },
        }}
      >
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
          {frameSize !== 'tablet' && (
            <ParagraphMedium $style={{ fontWeight: 800 }}>{BRAND_LABEL[page.layout]}</ParagraphMedium>
          )}
        </Block>
        <Navigation
          items={navItems}
          activeItemId={activeId}
          onChange={() => undefined}
        />
        {page.layout === 'guard' && frameSize === 'desktop' && (
          <Block margin="scale400" padding="scale500" backgroundColor="backgroundSecondary" overrides={{ Block: { style: { borderRadius: '12px', marginLeft: '12px', marginRight: '12px' } } }}>
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
              <Block key={tab} padding="scale500" overrides={{ Block: { style: { borderBottom: i === 0 ? '2px solid' : 'none', borderColor: 'accent', color: i === 0 ? 'inherit' : undefined } } }}>
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
