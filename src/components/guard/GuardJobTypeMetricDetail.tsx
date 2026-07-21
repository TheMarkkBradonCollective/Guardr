import React, { useMemo } from 'react';
import { Check, ChevronRight, Info } from 'lucide-react';
import type { JobType, SecurityRequest } from '../../types';
import {
  buildJobTypeMetricDetailCopy,
  computeJobTypeMetricBreakdown,
  type JobTypeMetricId,
  type JobTypeRatingCard,
} from '../../lib/guardJobTypeRatingMetrics';
import { AppSubScreenHeader } from '../ui/app/AppPrimitives';

interface GuardJobTypeMetricDetailProps {
  card: JobTypeRatingCard;
  metricId: JobTypeMetricId;
  jobType: JobType;
  guardId: string;
  requests: SecurityRequest[];
  onBack: () => void;
}

function StatusBadge({ status, label }: { status: JobTypeRatingCard['status']; label: string }) {
  return (
    <span className={`guard-factor-detail-status guard-factor-status-${status}`}>
      <span className="guard-factor-status-dot" />
      {label}
    </span>
  );
}

export function GuardJobTypeMetricDetail({
  card,
  metricId,
  jobType,
  guardId,
  requests,
  onBack,
}: GuardJobTypeMetricDetailProps) {
  const copy = useMemo(
    () => buildJobTypeMetricDetailCopy(guardId, jobType, metricId, card, requests),
    [guardId, jobType, metricId, card, requests]
  );
  const breakdown = useMemo(
    () => computeJobTypeMetricBreakdown(guardId, jobType, metricId, requests),
    [guardId, jobType, metricId, requests]
  );
  const fillPercent = Math.round(Math.min(100, Math.max(0, card.rate * 100)));
  const targetPercent =
    metricId === 'lifetime-shifts'
      ? 100
      : metricId === 'client-rating'
        ? 90
        : metricId === 'on-time'
          ? 90
          : 95;

  return (
    <div className="guard-factor-detail-screen">
      <AppSubScreenHeader title={card.label} onBack={onBack} backLabel="Performance" />

      <div className="guard-factor-detail-scroll">
        <section className="guard-factor-detail-card guard-jobtype-metric-detail-card">
          <p className="guard-jobtype-metric-detail-window">{copy.windowLabel}</p>
          <h2 className="guard-jobtype-metric-detail-title">{card.label}</h2>
          <p className="guard-jobtype-metric-detail-rate">{card.valueDisplay}</p>

          <div className="guard-jobtype-metric-detail-track-wrap">
            <div className="guard-jobtype-metric-detail-track" role="presentation">
              <div
                className="guard-jobtype-metric-detail-fill"
                style={{ width: `${fillPercent}%` }}
              />
              <span
                className="guard-jobtype-metric-detail-marker"
                style={{ left: `${targetPercent}%` }}
                aria-hidden
              />
            </div>
            <div className="guard-jobtype-metric-detail-track-labels">
              <StatusBadge status={card.status} label={card.statusLabel} />
              <span className="guard-jobtype-metric-detail-target">{copy.targetLevelLabel}</span>
            </div>
          </div>

          <p className="guard-factor-detail-about">{copy.aboutBody}</p>
        </section>

        <section className="guard-factor-detail-card">
          <h2 className="guard-factor-detail-section-title">
            Shifts below target ({breakdown.negativeCount})
          </h2>
          {breakdown.negativeCount > 0 ? (
            <button type="button" className="guard-factor-detail-activity-row">
              <div className="guard-factor-detail-activity-copy">
                <span>Recent shifts needing improvement</span>
                <strong>{breakdown.negativeCount}</strong>
              </div>
              <ChevronRight className="guard-factor-detail-activity-chevron" aria-hidden />
            </button>
          ) : (
            <p className="guard-factor-detail-about">No recent shifts are below the target for this metric.</p>
          )}
          {breakdown.excludedCount > 0 ? (
            <p className="guard-factor-detail-excluded">
              <Info className="w-3.5 h-3.5" aria-hidden />
              {breakdown.excludedCount} {copy.excludedLabel}
            </p>
          ) : null}
          <p className="guard-factor-detail-excluded">
            <Info className="w-3.5 h-3.5" aria-hidden />
            {card.targetLabel}
          </p>
        </section>

        <section className="guard-factor-detail-card">
          <h2 className="guard-factor-detail-section-title">Tips to improve this rating</h2>
          <ul className="guard-factor-detail-tips">
            {copy.tips.map((tip) => (
              <li key={tip}>
                <Check className="guard-factor-detail-tip-icon" aria-hidden />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
