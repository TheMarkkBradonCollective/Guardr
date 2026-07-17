import React, { useState } from 'react';
import { Block } from 'baseui/block';
import { HeadingSmall, LabelSmall, ParagraphMedium } from 'baseui/typography';
import { Briefcase, Map, MessageSquare, Plus } from 'lucide-react';
import {
  GuardrButton,
  GuardrCard,
  GuardrInput,
  GuardrSkeleton,
  GuardrTag,
  AppCarousel,
  GuardrModal,
  DashboardZone,
  MetricCell,
  MetricStrip,
  QuickActionTile,
} from '..';
import { showAppToast } from '../../ui/AppToast';

function ShowcaseSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Block as="section" marginBottom="scale1000">
      <HeadingSmall marginTop={0} marginBottom="scale500">
        {title}
      </HeadingSmall>
      {children}
    </Block>
  );
}

export function ComponentShowcase({ compact = false }: { compact?: boolean }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Block padding={compact ? 'scale600' : 'scale800'}>
      {!compact ? (
        <Block marginBottom="scale800">
          <HeadingSmall marginTop={0} marginBottom="scale300">
            Uber Base Web component showcase
          </HeadingSmall>
          <ParagraphMedium color="contentSecondary" marginTop={0} marginBottom="scale400">
            Production adapters from <code>src/components/baseui/*</code> — stock Light/Dark themes, shared motion,
            overlays, and dashboard kit.
          </ParagraphMedium>
          <Block display="flex" flexWrap gridGap="scale300">
            <a href="/design-preview.html" target="_blank" rel="noopener noreferrer" className="uber-text-accent">
              Open full design preview →
            </a>
          </Block>
        </Block>
      ) : null}

      <ShowcaseSection title="Buttons">
        <Block display="flex" flexWrap gridGap="scale300">
          <GuardrButton kind="primary">Primary</GuardrButton>
          <GuardrButton kind="secondary">Secondary</GuardrButton>
          <GuardrButton kind="tertiary">Tertiary</GuardrButton>
          <GuardrButton kind="danger">Danger</GuardrButton>
          <GuardrButton kind="primary" size="compact">
            Compact
          </GuardrButton>
        </Block>
      </ShowcaseSection>

      <ShowcaseSection title="Tags & inputs">
        <Block display="flex" flexWrap gridGap="scale300" marginBottom="scale500">
          <GuardrTag kind="accent" closeable={false}>
            Accent
          </GuardrTag>
          <GuardrTag kind="neutral" closeable={false}>
            Neutral
          </GuardrTag>
          <GuardrTag kind="success" closeable={false}>
            Positive
          </GuardrTag>
          <GuardrTag kind="warning" closeable={false}>
            Warning
          </GuardrTag>
        </Block>
        <Block maxWidth="320px">
          <GuardrInput placeholder="GuardrInput — email" />
        </Block>
      </ShowcaseSection>

      <ShowcaseSection title="Cards & skeleton">
        <Block display="grid" gridTemplateColumns="repeat(auto-fit, minmax(180px, 1fr))" gridGap="scale400">
          <GuardrCard>
            <LabelSmall color="contentSecondary">GUARDR CARD</LabelSmall>
            <ParagraphMedium $style={{ fontWeight: 700, marginTop: '4px' }}>Border, no shadow</ParagraphMedium>
          </GuardrCard>
          <Block>
            <GuardrSkeleton height="14px" width="80%" />
            <Block height="scale300" />
            <GuardrSkeleton height="14px" width="55%" />
            <Block height="scale300" />
            <GuardrSkeleton height="40px" width="40px" circle />
          </Block>
        </Block>
      </ShowcaseSection>

      <ShowcaseSection title="Dashboard kit">
        <DashboardZone title="At a glance" actionLabel="View all" onAction={() => undefined}>
          <MetricStrip>
            <MetricCell label="Active" value="12" sub="jobs today" accent />
            <MetricCell label="Rating" value="4.9" />
            <MetricCell label="Earnings" value="$1,240" sub="this week" />
          </MetricStrip>
        </DashboardZone>
        <Block
          display="grid"
          gridTemplateColumns="repeat(auto-fit, minmax(140px, 1fr))"
          gridGap="scale400"
        >
          <QuickActionTile icon={Plus} label="Post job" sub="New request" primary onClick={() => undefined} />
          <QuickActionTile icon={Map} label="Map" sub="Live ops" onClick={() => undefined} />
          <QuickActionTile icon={MessageSquare} label="Messages" sub="3 unread" onClick={() => undefined} />
          <QuickActionTile icon={Briefcase} label="Jobs" sub="Open offers" onClick={() => undefined} />
        </Block>
      </ShowcaseSection>

      <ShowcaseSection title="Carousel">
        <AppCarousel showDots edgeFade gap={16} label="Featured">
          {['Staples Center', 'Retail patrol', 'Event security'].map((title) => (
            <GuardrCard key={title} overrides={{ Root: { style: { minWidth: '180px' } } }}>
              <LabelSmall color="contentSecondary">UPCOMING</LabelSmall>
              <ParagraphMedium $style={{ fontWeight: 700, marginTop: '4px' }}>{title}</ParagraphMedium>
            </GuardrCard>
          ))}
        </AppCarousel>
      </ShowcaseSection>

      <ShowcaseSection title="Overlays">
        <Block display="flex" flexWrap gridGap="scale300">
          <GuardrButton kind="secondary" onClick={() => setModalOpen(true)}>
            Open modal
          </GuardrButton>
          <GuardrButton
            kind="secondary"
            onClick={() => showAppToast('Saved', { body: 'Changes synced to the server.', tone: 'success' })}
          >
            Show toast
          </GuardrButton>
          <GuardrButton
            kind="secondary"
            onClick={() => showAppToast('Heads up', { body: 'Network latency is elevated.', tone: 'info' })}
          >
            Info toast
          </GuardrButton>
        </Block>
        <GuardrModal open={modalOpen} onClose={() => setModalOpen(false)} align="center" ariaLabelledBy="showcase-modal-title">
          <Block padding="scale800">
            <HeadingSmall id="showcase-modal-title" marginTop={0}>
              GuardrModal
            </HeadingSmall>
            <ParagraphMedium color="contentSecondary">
              Center-aligned modal using production overlay stack — Escape, focus trap, and backdrop dismiss.
            </ParagraphMedium>
            <Block marginTop="scale600">
              <GuardrButton onClick={() => setModalOpen(false)}>Close</GuardrButton>
            </Block>
          </Block>
        </GuardrModal>
      </ShowcaseSection>
    </Block>
  );
}
