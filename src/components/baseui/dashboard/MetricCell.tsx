import React from 'react';
import { useStyletron } from 'baseui';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type MetricTrend = 'up' | 'down' | 'neutral';

/**
 * Horizontal stat row strip — like Uber's "3 active · 7 on duty" bar.
 */
export function MetricStrip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`app-metric-strip ${className}`.trim()}>
      {children}
    </div>
  );
}

/**
 * Individual stat cell inside MetricStrip — Uber stat cell style.
 */
export function MetricCell({
  label,
  value,
  sub,
  trend,
  onClick,
  highlight = false,
  accent,
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
  const isHighlighted = highlight || accent;

  const trendEl =
    trend === 'up'      ? <TrendingUp  size={12} color={theme.colors.positive} /> :
    trend === 'down'    ? <TrendingDown size={12} color={theme.colors.negative} /> :
    trend === 'neutral' ? <Minus size={12} color={theme.colors.contentSecondary} /> :
    null;

  const inner = (
    <div className="app-metric-cell" style={{ padding: '16px 12px', textAlign: 'center' }}>
      <p style={{
        fontFamily: '"Uber Move", "Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: '22px',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: isHighlighted ? theme.colors.contentPrimary : theme.colors.contentPrimary,
        margin: 0,
        lineHeight: 1.1,
      }}>
        {value}
      </p>
      <p style={{
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: theme.colors.contentSecondary,
        margin: '4px 0 0',
      }}>
        {label}
      </p>
      {sub || trendEl ? (
        <p style={{
          fontSize: '11px',
          color: theme.colors.contentSecondary,
          margin: '2px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
        }}>
          {trendEl}
          {sub}
        </p>
      ) : null}
    </div>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`${label}: ${String(value)}`}
        style={{
          all: 'unset',
          display: 'block',
          cursor: 'pointer',
          transition: 'background-color 100ms ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--uber-surface, #f6f6f6)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = ''; }}
      >
        {inner}
      </button>
    );
  }

  return inner;
}
