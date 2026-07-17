import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Block } from 'baseui/block';
import { Button, KIND, SIZE } from 'baseui/button';
import { ButtonGroup } from 'baseui/button-group';
import { Navigation } from 'baseui/side-navigation';
import { HeadingXSmall, LabelSmall, ParagraphMedium } from 'baseui/typography';
import { PREVIEW_PAGES, type PreviewPage, type PreviewRole } from './pages';
import { AppShell, type FrameSize } from './AppShell';

type RoleFilter = PreviewRole | 'all';

const ROLE_OPTIONS: { id: RoleFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'public', label: 'Public' },
  { id: 'client', label: 'Client' },
  { id: 'guard', label: 'Guard' },
  { id: 'staff', label: 'Staff' },
];

const FRAME_OPTIONS: { id: FrameSize; label: string }[] = [
  { id: 'desktop', label: 'Desktop' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'mobile', label: 'Mobile' },
];

const MAX_WIDTH: Record<FrameSize, string> = {
  desktop: '1100px',
  tablet: '820px',
  mobile: '390px',
};

function groupPages(pages: PreviewPage[]) {
  const roles: PreviewRole[] = ['public', 'client', 'guard', 'staff'];
  return roles
    .map((role) => ({
      role,
      pages: pages.filter((p) => p.role === role),
    }))
    .filter((g) => g.pages.length > 0);
}

export function DesignPreviewApp() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [frameSize, setFrameSize] = useState<FrameSize>('desktop');
  const [activeId, setActiveId] = useState(PREVIEW_PAGES[0]?.id ?? '');
  const scrollRef = useRef<HTMLDivElement>(null);

  const visiblePages = useMemo(
    () => (roleFilter === 'all' ? PREVIEW_PAGES : PREVIEW_PAGES.filter((p) => p.role === roleFilter)),
    [roleFilter],
  );

  const indexItems = useMemo(() => {
    type IndexItem =
      | { title: string; itemId: string; subtitle: string; disabled?: false }
      | { title: string; itemId: string; disabled: true; subtitle?: undefined };
    const items: IndexItem[] = [];
    groupPages(visiblePages).forEach(({ role, pages }) => {
      items.push({ title: role.toUpperCase(), itemId: `__role_${role}`, disabled: true });
      pages.forEach((p) => items.push({ title: p.title, itemId: p.id, subtitle: p.path }));
    });
    return items;
  }, [visiblePages]);

  const scrollToPage = useCallback((id: string) => {
    document.getElementById(`preview-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const blocks = root.querySelectorAll('[data-preview-id]');
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveId(e.target.getAttribute('data-preview-id') ?? '');
        });
      },
      { root: null, rootMargin: '-25% 0px -60% 0px', threshold: 0 },
    );
    blocks.forEach((b) => obs.observe(b));
    return () => obs.disconnect();
  }, [visiblePages, frameSize]);

  return (
    <Block height="100vh" display="flex" flexDirection="column" backgroundColor="backgroundPrimary">
      <Block
        paddingTop="scale400"
        paddingBottom="scale400"
        paddingLeft="scale600"
        paddingRight="scale600"
        display="flex"
        flexWrap
        alignItems="center"
        justifyContent="space-between"
        gridGap="scale400"
        backgroundColor="backgroundPrimary"
        overrides={{ Block: { style: { borderBottom: '1px solid', borderColor: 'borderOpaque', position: 'sticky', top: 0, zIndex: 10 } } }}
      >
        <Block>
          <HeadingXSmall margin="0">Guardr × Base Web</HeadingXSmall>
          <LabelSmall $style={{ color: 'contentSecondary' }}>Uber design system preview · baseweb</LabelSmall>
        </Block>
        <Block display="flex" flexWrap gridGap="scale400" alignItems="center">
          <ButtonGroup>
            {ROLE_OPTIONS.map((opt) => (
              <Button
                key={opt.id}
                size={SIZE.compact}
                kind={roleFilter === opt.id ? KIND.primary : KIND.secondary}
                onClick={() => setRoleFilter(opt.id)}
              >
                {opt.label}
              </Button>
            ))}
          </ButtonGroup>
          <ButtonGroup>
            {FRAME_OPTIONS.map((opt) => (
              <Button
                key={opt.id}
                size={SIZE.compact}
                kind={frameSize === opt.id ? KIND.primary : KIND.secondary}
                onClick={() => setFrameSize(opt.id)}
              >
                {opt.label}
              </Button>
            ))}
          </ButtonGroup>
        </Block>
      </Block>

      <Block display="flex" flex="1" minHeight="0">
        <Block
          overrides={{
            Block: {
              style: {
                width: '272px',
                flexShrink: 0,
                borderRight: '1px solid',
                borderColor: 'borderOpaque',
                overflow: 'auto',
              },
            },
          }}
          backgroundColor="backgroundPrimary"
        >
          <Block padding="scale600" display="flex" alignItems="center" gridGap="scale400" overrides={{ Block: { style: { borderBottom: '1px solid', borderColor: 'borderOpaque' } } }}>
            <Block
              width="32px"
              height="32px"
              backgroundColor="accent"
              display="flex"
              alignItems="center"
              justifyContent="center"
              overrides={{ Block: { style: { borderRadius: '8px', color: '#fff', fontWeight: 800 } } }}
            >
              G
            </Block>
            <Block>
              <ParagraphMedium $style={{ fontWeight: 800, margin: 0 }}>Page index</ParagraphMedium>
              <LabelSmall $style={{ color: 'contentSecondary' }}>{visiblePages.length} screens</LabelSmall>
            </Block>
          </Block>
          <Navigation
            items={indexItems.map((item) => ({
              title: item.subtitle ? (
                <Block>
                  <ParagraphMedium $style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>{item.title}</ParagraphMedium>
                  <LabelSmall $style={{ color: 'contentSecondary' }}>{item.subtitle}</LabelSmall>
                </Block>
              ) : (
                item.title
              ),
              itemId: item.itemId,
              disabled: item.disabled,
            }))}
            activeItemId={activeId}
            onChange={({ event, item }) => {
              event.preventDefault();
              if (!String(item.itemId).startsWith('__')) scrollToPage(String(item.itemId));
            }}
          />
        </Block>

        <Block ref={scrollRef} flex="1" overflow="auto" padding="scale800">
          {visiblePages.map((page) => (
            <Block
              key={page.id}
              id={`preview-${page.id}`}
              data-preview-id={page.id}
              marginBottom="scale1000"
              overrides={{ Block: { style: { scrollMarginTop: '80px' } } }}
            >
              <Block display="flex" alignItems="baseline" gridGap="scale400" marginBottom="scale500" flexWrap>
                <HeadingXSmall margin="0">{page.title}</HeadingXSmall>
                <LabelSmall $style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{page.role}</LabelSmall>
                <LabelSmall $style={{ color: 'accent' }}>{page.path}</LabelSmall>
              </Block>
              <Block
                margin="0 auto"
                maxWidth={MAX_WIDTH[frameSize]}
                backgroundColor="backgroundPrimary"
                overrides={{
                  Block: {
                    style: {
                      borderRadius: frameSize === 'mobile' ? '28px' : '14px',
                      border: '1px solid',
                      borderColor: 'borderOpaque',
                      overflow: 'hidden',
                      boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
                    },
                  },
                }}
              >
                <AppShell page={page} frameSize={frameSize} />
              </Block>
            </Block>
          ))}
        </Block>
      </Block>
    </Block>
  );
}
