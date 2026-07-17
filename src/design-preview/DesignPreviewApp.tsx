import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Block } from 'baseui/block';
import { HeadingXSmall, LabelSmall } from 'baseui/typography';
import { PREVIEW_PAGES, type PreviewPage, type PreviewRole } from './pages';
import { AppShell, type FrameSize } from './AppShell';
import { PreviewLayout } from './PreviewLayout';
import type { SiteMapSection } from './PreviewContext';

const ROLE_LABELS: Record<PreviewRole, string> = {
  public: 'Public',
  client: 'Client',
  guard: 'Guard Pro',
  staff: 'Staff Ops',
};

const MAX_WIDTH: Record<FrameSize, string> = {
  desktop: '1100px',
  tablet: '820px',
  mobile: '390px',
};

function buildSiteMap(pages: PreviewPage[]): SiteMapSection[] {
  const roles: PreviewRole[] = ['public', 'client', 'guard', 'staff'];
  return roles
    .map((role) => ({
      name: ROLE_LABELS[role],
      children: pages.filter((p) => p.role === role),
    }))
    .filter((section) => section.children.length > 0);
}

export function DesignPreviewApp() {
  const [roleFilter, setRoleFilter] = useState<PreviewRole | 'all'>('all');
  const [frameSize, setFrameSize] = useState<FrameSize>('desktop');
  const [activeId, setActiveId] = useState(PREVIEW_PAGES[0]?.id ?? '');
  const scrollRef = useRef<HTMLDivElement>(null);

  const visiblePages = useMemo(
    () => (roleFilter === 'all' ? PREVIEW_PAGES : PREVIEW_PAGES.filter((p) => p.role === roleFilter)),
    [roleFilter],
  );

  const siteMap = useMemo(() => buildSiteMap(visiblePages), [visiblePages]);

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

  const contextValue = useMemo(
    () => ({
      siteMap,
      activePageId: activeId,
      scrollToPage,
      openHelpModal: () => undefined,
      roleFilter,
      setRoleFilter,
      frameSize,
      setFrameSize,
    }),
    [siteMap, activeId, scrollToPage, roleFilter, frameSize],
  );

  return (
    <PreviewLayout contextValue={contextValue}>
      <Block ref={scrollRef}>
        {visiblePages.map((page) => (
          <Block
            key={page.id}
            id={`preview-${page.id}`}
            data-preview-id={page.id}
            marginBottom="scale1000"
            overrides={{ Block: { style: { scrollMarginTop: '100px' } } }}
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
    </PreviewLayout>
  );
}
