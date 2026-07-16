import React from 'react';
import type { PerformanceTierPercentBar } from '../../../lib/staffStats';
import type { OverviewVisualTone } from '../../../lib/overviewVisuals';
import { OverviewPieChart, OverviewSegmentBar } from './OverviewCharts';

const TIER_TONE: Record<string, OverviewVisualTone> = {
  starting: 'muted',
  rising: 'info',
  professional: 'primary',
  elite: 'success',
};

interface PerformanceTierProgressBarsProps {
  bars: PerformanceTierPercentBar[];
  totalGuards: number;
  showStackedBar?: boolean;
  showPie?: boolean;
}

export function PerformanceTierProgressBars({
  bars,
  totalGuards,
  showStackedBar = true,
  showPie = false,
}: PerformanceTierProgressBarsProps) {
  if (totalGuards === 0) {
    return <p className="text-sm text-brand-text-muted py-4 text-center">No field guards to chart yet.</p>;
  }

  const activeBars = bars.filter((bar) => bar.count > 0);
  const pieSegments = activeBars.map((bar) => ({
    label: bar.tierName,
    value: bar.count,
    tone: TIER_TONE[bar.tierId] ?? 'muted',
  }));

  return (
    <div className="overview-tier-progress">
      {showPie && activeBars.length > 0 ? (
        <div className="overview-tier-progress-pie">
          <OverviewPieChart
            segments={pieSegments}
            centerLabel={String(totalGuards)}
            centerSub="guards"
            size="sm"
          />
        </div>
      ) : null}

      <ul className="overview-tier-progress-list">
        {bars.map((bar) => (
          <li key={bar.tierId} className="overview-tier-progress-row">
            <div className="overview-tier-progress-head">
              <span className={`overview-tier-progress-label overview-tier-progress-label--${bar.tierId}`}>
                {bar.tierName}
              </span>
              <span className="overview-tier-progress-meta">
                {bar.count} guard{bar.count === 1 ? '' : 's'} · <strong>{bar.pct}%</strong>
              </span>
            </div>
            <div className="overview-tier-progress-track" role="progressbar" aria-valuenow={bar.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${bar.tierName} guards`}>
              <div
                className={`overview-tier-progress-fill overview-tier-progress-fill--${bar.tierId}`}
                style={{ width: `${Math.max(bar.pct > 0 ? 4 : 0, bar.pct)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      {showStackedBar && activeBars.length > 0 ? (
        <div className="overview-tier-progress-stack">
          <p className="overview-tier-progress-stack-title">Mix across all guards</p>
          <OverviewSegmentBar segments={pieSegments} />
        </div>
      ) : null}
    </div>
  );
}
