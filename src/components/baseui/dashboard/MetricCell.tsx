import React from 'react';
import { Block } from 'baseui/block';
import { LabelSmall, HeadingMedium, ParagraphSmall } from 'baseui/typography';
import { GuardrCard } from '../GuardrCard';

export function MetricStrip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <Block
      className={`app-metric-strip ${className}`.trim()}
      display="grid"
      gridTemplateColumns="repeat(auto-fit, minmax(140px, 1fr))"
      gridGap="scale400"
      paddingLeft="scale800"
      paddingRight="scale800"
    >
      {children}
    </Block>
  );
}

export function MetricCell({
  label,
  value,
  sub,
  onClick,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  onClick?: () => void;
  accent?: boolean;
}) {
  const interactive = typeof onClick === 'function';

  const body = (
    <GuardrCard
      interactive={interactive}
      noBorder={false}
      overrides={{
        Root: {
          style: {
            backgroundColor: accent ? 'accent50' : 'backgroundPrimary',
            borderColor: accent ? 'accent' : 'borderOpaque',
            width: '100%',
            textAlign: 'left',
          },
        },
      }}
    >
      <LabelSmall
        marginTop={0}
        marginBottom="scale200"
        color="contentSecondary"
        $style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, fontSize: '11px' }}
      >
        {label}
      </LabelSmall>
      <HeadingMedium marginTop={0} marginBottom={sub ? 'scale100' : 0}>
        {value}
      </HeadingMedium>
      {sub ? (
        <ParagraphSmall marginTop={0} marginBottom={0} color="contentSecondary">
          {sub}
        </ParagraphSmall>
      ) : null}
    </GuardrCard>
  );

  if (interactive) {
    return (
      <button type="button" onClick={onClick} className="app-metric-cell app-metric-cell-clickable w-full text-left">
        {body}
      </button>
    );
  }

  return <Block className="app-metric-cell">{body}</Block>;
}
