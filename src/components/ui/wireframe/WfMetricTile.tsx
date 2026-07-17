import React from 'react';
import { Block } from 'baseui/block';
import { LabelSmall, HeadingMedium } from 'baseui/typography';
import { GuardrCard } from '../../baseui/GuardrCard';

interface WfMetricTileProps {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  className?: string;
}

export function WfMetricTile({ label, value, accent = false, className = '' }: WfMetricTileProps) {
  return (
    <GuardrCard
      className={className}
      overrides={{
        Root: {
          style: {
            backgroundColor: accent ? 'color-mix(in srgb, var(--brand-primary) 10%, var(--brand-surface))' : undefined,
            borderColor: accent ? 'accent' : undefined,
          },
        },
      }}
    >
      <LabelSmall
        $style={{
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          fontWeight: 700,
          color: 'contentSecondary',
          margin: 0,
        }}
      >
        {label}
      </LabelSmall>
      <HeadingMedium marginTop="scale300" marginBottom="0">
        {value}
      </HeadingMedium>
    </GuardrCard>
  );
}
