import React from 'react';
import { Block } from 'baseui/block';
import { LabelSmall, HeadingMedium, ParagraphSmall } from 'baseui/typography';
import { useStyletron } from 'baseui';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { GuardrCard } from '../GuardrCard';

export type MetricTrend = 'up' | 'down' | 'neutral';

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
  trend,
  onClick,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  trend?: MetricTrend;
  onClick?: () => void;
  highlight?: boolean;
  /** @deprecated use highlight */
  accent?: boolean;
}) {
  const [, theme] = useStyletron();
  const interactive = typeof onClick === 'function';

  const trendIcon =
    trend === 'up'      ? <TrendingUp  size={13} color={theme.colors.positive} /> :
    trend === 'down'    ? <TrendingDown size={13} color={theme.colors.negative} /> :
    trend === 'neutral' ? <Minus size={13} color={theme.colors.contentSecondary} /> :
    null;

  const body = (
    <GuardrCard
      interactive={interactive}
      noBorder={false}
      variant={highlight ? 'service' : 'default'}
      overrides={{
        Root: {
          style: {
            width: '100%',
            textAlign: 'left',
            minHeight: '90px',
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
      <HeadingMedium marginTop={0} marginBottom={sub || trendIcon ? 'scale100' : 0}>
        {value}
      </HeadingMedium>
      {sub || trendIcon ? (
        <Block display="flex" alignItems="center" gridGap="scale100">
          {trendIcon}
          {sub ? (
            <ParagraphSmall marginTop={0} marginBottom={0} color="contentSecondary">
              {sub}
            </ParagraphSmall>
          ) : null}
        </Block>
      ) : null}
    </GuardrCard>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="app-metric-cell app-metric-cell-clickable w-full text-left"
        aria-label={`${label}: ${String(value)}`}
      >
        {body}
      </button>
    );
  }

  return <Block className="app-metric-cell">{body}</Block>;
}
