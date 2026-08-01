import React, { useMemo } from 'react';
import {
  OverviewMeter,
  OverviewRingStat,
  OverviewSegment,
  OverviewVisualCard,
  OverviewVisualTone,
  WeeklyJobPoint,
} from '../../../lib/overviewVisuals';

const TONE_SEGMENT: Record<OverviewVisualTone, string> = {
  primary: 'overview-segment-primary',
  success: 'overview-segment-success',
  warning: 'overview-segment-warning',
  info: 'overview-segment-info',
  muted: 'overview-segment-muted',
};

const TONE_METER: Record<OverviewVisualTone, string> = {
  primary: 'overview-meter-fill-primary',
  success: 'overview-meter-fill-success',
  warning: 'overview-meter-fill-warning',
  info: 'overview-meter-fill-info',
  muted: 'overview-meter-fill-muted',
};

const PIE_TONE_COLOR: Record<OverviewVisualTone, string> = {
  primary: 'var(--brand-primary)',
  success: '#34d399',
  warning: '#f59e0b',
  info: '#60a5fa',
  muted: 'color-mix(in srgb, var(--brand-text-muted) 55%, var(--brand-border))',
};

function formatSegmentLegend(segment: OverviewSegment, total: number): string {
  if (segment.label === 'No jobs yet' || segment.label === 'No accounts') return segment.label;
  if (total <= 0) return `${segment.label} · ${segment.value}`;
  const isMoney =
    segment.label.toLowerCase().includes('cash') || segment.label.toLowerCase().includes('card');
  const valueLabel = isMoney
    ? `$${segment.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : String(segment.value);
  if (isMoney) return `${segment.label} · ${valueLabel}`;
  const pct = Math.round((segment.value / total) * 100);
  return `${segment.label} · ${valueLabel} (${pct}%)`;
}

function buildPieGradient(segments: OverviewSegment[]): string {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  if (total <= 0) return `${PIE_TONE_COLOR.muted} 0deg 360deg`;

  let cursor = 0;
  const stops: string[] = [];
  for (const segment of segments) {
    const start = (cursor / total) * 360;
    cursor += segment.value;
    const end = (cursor / total) * 360;
    stops.push(`${PIE_TONE_COLOR[segment.tone]} ${start}deg ${end}deg`);
  }
  return stops.join(', ');
}

export function OverviewPieChart({
  segments,
  centerLabel,
  centerSub,
  size = 'md',
}: {
  segments: OverviewSegment[];
  centerLabel?: string;
  centerSub?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const gradient = useMemo(() => buildPieGradient(segments), [segments]);

  if (total <= 0) {
    return <p className="text-sm text-brand-text-muted py-6 text-center">No data to chart yet.</p>;
  }

  return (
    <div className={`overview-pie-layout overview-pie-layout--${size}`}>
      <div
        className="overview-pie"
        style={{ background: `conic-gradient(${gradient})` }}
        role="img"
        aria-label="Pie chart breakdown"
      >
        <div className="overview-pie-hole">
          {centerLabel ? <span className="overview-pie-center-value">{centerLabel}</span> : null}
          {centerSub ? <span className="overview-pie-center-sub">{centerSub}</span> : null}
        </div>
      </div>
      <div className="overview-segment-legend overview-pie-legend">
        {segments.map((segment) => (
          <span key={segment.label} className="overview-segment-legend-item">
            <span className={`overview-segment-swatch ${TONE_SEGMENT[segment.tone]}`} aria-hidden />
            {formatSegmentLegend(segment, total)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function OverviewLineChart({ series }: { series: WeeklyJobPoint[] }) {
  const hasData = series.some((point) => point.count > 0);
  if (!hasData) {
    return <p className="text-sm text-brand-text-muted py-6 text-center">No trend data yet.</p>;
  }

  const max = Math.max(...series.map((point) => point.count), 1);
  const width = 280;
  const height = 120;
  const padding = 8;
  const step = (width - padding * 2) / Math.max(series.length - 1, 1);

  const points = series.map((point, index) => {
    const x = padding + index * step;
    const y = height - padding - (point.count / max) * (height - padding * 2);
    return { x, y, point };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${padding},${height - padding} ${polyline} ${width - padding},${height - padding}`;

  return (
    <div className="overview-line-chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="overview-line-chart" role="img" aria-label="Trend line chart">
        <defs>
          <linearGradient id="overview-line-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#overview-line-fill)" />
        <polyline points={polyline} fill="none" stroke="var(--brand-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map(({ x, y, point }) => (
          <g key={point.label}>
            <circle cx={x} cy={y} r="3.5" fill="var(--brand-surface)" stroke="var(--brand-primary)" strokeWidth="2" />
          </g>
        ))}
      </svg>
      <div className="overview-line-chart-labels">
        {series.map((point) => (
          <span key={point.label} className="overview-week-day">
            {point.label}
            {point.count > 0 ? <strong className="overview-line-chart-count">{point.count}</strong> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

export function OverviewDonutGrid({
  items,
}: {
  items: { id: string; label: string; value: string; pct: number; tone?: OverviewVisualTone }[];
}) {
  return (
    <div className="overview-donut-grid">
      {items.map((item) => (
        <div key={item.id} className="overview-donut-grid-item">
          <div
            className="overview-ring overview-ring--sm"
            style={{
              ['--overview-ring-pct' as string]: String(item.pct),
              ['--overview-ring-color' as string]: item.tone ? PIE_TONE_COLOR[item.tone] : PIE_TONE_COLOR.primary,
            }}
          >
            <span className="overview-ring-value">{item.value}</span>
          </div>
          <p className="overview-donut-grid-label">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

export function OverviewSegmentBar({ segments }: { segments: OverviewSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const safeTotal = total > 0 ? total : 1;

  return (
    <div>
      <div className="overview-segment-bar" role="img" aria-label="Segment breakdown">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className={`overview-segment-bar-segment ${TONE_SEGMENT[segment.tone]}`}
            style={{ width: `${Math.max((segment.value / safeTotal) * 100, segment.value > 0 ? 4 : 0)}%` }}
          />
        ))}
      </div>
      <div className="overview-segment-legend">
        {segments.map((segment) => (
          <span key={segment.label} className="overview-segment-legend-item">
            <span className={`overview-segment-swatch ${TONE_SEGMENT[segment.tone]}`} aria-hidden />
            {formatSegmentLegend(segment, total)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function OverviewMeterBar({ meter }: { meter: OverviewMeter }) {
  const tone = meter.tone ?? 'primary';
  return (
    <div className="overview-meter">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium text-brand-text min-w-0 truncate" title={meter.label}>
          {meter.label}
        </p>
        <p className="text-xs font-bold shrink-0">{meter.value}</p>
      </div>
      <div className="overview-meter-track">
        <div
          className={`overview-meter-fill ${TONE_METER[tone]}`}
          style={{ width: `${Math.max(0, Math.min(100, meter.pct))}%` }}
        />
      </div>
      {meter.sub ? <p className="text-[11px] text-brand-text-muted leading-snug">{meter.sub}</p> : null}
    </div>
  );
}

export function OverviewRingGauge({ ring }: { ring: OverviewRingStat }) {
  return (
    <div className="overview-ring-layout">
      <div className="overview-ring" style={{ ['--overview-ring-pct' as string]: String(ring.pct) }}>
        <span className="overview-ring-value">{ring.value}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{ring.label}</p>
        {ring.sub ? <p className="text-xs text-brand-text-muted mt-1 leading-snug">{ring.sub}</p> : null}
      </div>
    </div>
  );
}

export function OverviewWeekChart({ series }: { series: WeeklyJobPoint[] }) {
  const hasData = series.some((point) => point.count > 0);
  if (!hasData) {
    return <p className="text-sm text-brand-text-muted py-6 text-center">No completed jobs this week yet.</p>;
  }

  return (
    <div className="overview-week-chart">
      {series.map((point) => (
        <div key={point.label} className="overview-week-bar-col">
          <span className="overview-week-count">{point.count > 0 ? point.count : ''}</span>
          <div className="overview-week-bar" style={{ height: `${point.heightPct}%` }} />
          <span className="overview-week-day">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

export function OverviewVisualCardBody({ card }: { card: OverviewVisualCard }) {
  return (
    <>
      <div className="mt-3">
        {card.kind === 'segments' && card.segments ? <OverviewSegmentBar segments={card.segments} /> : null}
        {card.kind === 'meters' && card.meters
          ? card.meters.map((meter) => <OverviewMeterBar key={meter.label} meter={meter} />)
          : null}
        {card.kind === 'ring' && card.ring ? <OverviewRingGauge ring={card.ring} /> : null}
        {card.kind === 'rings' && card.rings ? (
          <div className="space-y-4">
            {card.rings.map((ring) => (
              <OverviewRingGauge key={ring.label} ring={ring} />
            ))}
          </div>
        ) : null}
      </div>
      {card.footnote ? (
        <p className="text-[11px] text-brand-text-muted mt-3 leading-snug border-t border-brand-border pt-3">
          {card.footnote}
        </p>
      ) : null}
    </>
  );
}

export function OverviewVisualCardView({ card }: { card: OverviewVisualCard }) {
  return (
    <article className="staff-overview-visual-card">
      <p className="overview-visual-title">{card.title}</p>
      <OverviewVisualCardBody card={card} />
    </article>
  );
}

export function OverviewVisualGrid({
  cards,
  columns = 2,
  variant = 'full',
}: {
  cards: OverviewVisualCard[];
  columns?: 2 | 3;
  /** Sidebar column in split dashboards — always stacks cards in one column. */
  variant?: 'full' | 'sidebar';
}) {
  const columnClass =
    variant === 'sidebar'
      ? ' staff-overview-visual-grid--sidebar'
      : columns === 3
        ? ' staff-overview-visual-grid--3'
        : '';

  return (
    <div className={`staff-overview-visual-grid${columnClass}`}>
      {cards.map((card) => (
        <OverviewVisualCardView key={card.id} card={card} />
      ))}
    </div>
  );
}
