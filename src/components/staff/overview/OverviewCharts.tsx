import React from 'react';
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
        <p className="text-xs font-medium text-brand-text">{meter.label}</p>
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

export function OverviewVisualCardView({ card }: { card: OverviewVisualCard }) {
  return (
    <article className="staff-overview-visual-card">
      <p className="overview-visual-title">{card.title}</p>
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
    </article>
  );
}

export function OverviewVisualGrid({
  cards,
  columns = 2,
}: {
  cards: OverviewVisualCard[];
  columns?: 2 | 3;
}) {
  return (
    <div className={`staff-overview-visual-grid${columns === 3 ? ' staff-overview-visual-grid--3' : ''}`}>
      {cards.map((card) => (
        <OverviewVisualCardView key={card.id} card={card} />
      ))}
    </div>
  );
}
