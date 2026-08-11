import React from 'react';
import { Block } from 'baseui/block';
import { HeadingMedium, LabelSmall, ParagraphMedium } from 'baseui/typography';
import { useStyletron } from 'baseui';
import { GuardrCard } from '../baseui/GuardrCard';
import { GuardrTag } from '../baseui/GuardrTag';
import { AccentIcon } from '../baseui/dashboard';
import type { LucideIcon } from 'lucide-react';

export function LandingBadge({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  const [, theme] = useStyletron();
  return (
    <LabelSmall
      overrides={{
        Block: {
          style: {
            color: theme.colors.accent,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 700,
            fontSize: '11px',
            textAlign: center ? 'center' : 'left',
            marginBottom: '0.75rem',
          },
        },
      }}
    >
      {children}
    </LabelSmall>
  );
}

export function LandingSectionHead({
  badge,
  title,
  lead,
  center = false,
}: {
  badge?: string;
  title: string;
  lead?: string;
  center?: boolean;
}) {
  return (
    <Block marginBottom="scale1000" $style={{ textAlign: center ? 'center' : 'left' }}>
      {badge ? <LandingBadge center={center}>{badge}</LandingBadge> : null}
      <HeadingMedium
        marginTop="0"
        marginBottom="scale400"
        overrides={{
          Block: {
            style: {
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
            },
          },
        }}
      >
        {title}
      </HeadingMedium>
      {lead ? (
        <ParagraphMedium marginTop="0" marginBottom="0" color="contentSecondary">
          {lead}
        </ParagraphMedium>
      ) : null}
    </Block>
  );
}

export function LandingHowCard({
  step,
  icon,
  title,
  body,
}: {
  step: string;
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  const [, theme] = useStyletron();
  return (
    <GuardrCard>
      <Block display="flex" alignItems="center" justifyContent="space-between" marginBottom="scale500">
        <LabelSmall
          overrides={{
            Block: {
              style: {
                color: theme.colors.accent,
                fontWeight: 800,
                fontSize: '12px',
                letterSpacing: '0.08em',
              },
            },
          }}
        >
          {step}
        </LabelSmall>
        <Block
          display="flex"
          alignItems="center"
          justifyContent="center"
          width="40px"
          height="40px"
          backgroundColor="accent50"
          $style={{ borderRadius: '12px' }}
        >
          <AccentIcon icon={icon} size={20} strokeWidth={1.75} />
        </Block>
      </Block>
      <Block as="h3" margin="0 0 8px" $style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em' }}>
        {title}
      </Block>
      <ParagraphMedium marginTop="0" marginBottom="0" color="contentSecondary">
        {body}
      </ParagraphMedium>
    </GuardrCard>
  );
}

export function LandingHighlightCard({
  icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <GuardrCard interactive>
      <Block display="flex" gridGap="scale500" alignItems="flex-start">
        <Block
          display="flex"
          alignItems="center"
          justifyContent="center"
          width="40px"
          height="40px"
          backgroundColor="accent50"
          flex="0 0 auto"
          $style={{ borderRadius: '12px' }}
        >
          <AccentIcon icon={icon} size={20} strokeWidth={1.75} />
        </Block>
        <Block>
          <Block as="p" margin="0 0 4px" $style={{ fontWeight: 700, fontSize: '15px' }}>
            {title}
          </Block>
          <ParagraphMedium marginTop="0" marginBottom="0" color="contentSecondary">
            {body}
          </ParagraphMedium>
        </Block>
      </Block>
    </GuardrCard>
  );
}

export function LandingCoverageTags({ tags }: { tags: string[] }) {
  return (
    <Block display="flex" flexWrap gridGap="scale300" justifyContent="center">
      {tags.map((tag) => (
        <GuardrTag key={tag} kind="neutral">
          {tag}
        </GuardrTag>
      ))}
    </Block>
  );
}
