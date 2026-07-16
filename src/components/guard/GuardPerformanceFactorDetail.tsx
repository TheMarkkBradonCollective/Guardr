import React, { useMemo } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Flame,
  Info,
  TrendingUp,
  X,
} from 'lucide-react';
import type { SecurityRequest } from '../../types';
import type { PerformanceFactor } from '../../lib/guardPerformance';
import {
  FACTOR_DETAIL_COPY,
  FACTOR_POINT_SCALES,
  buildFactorHistory,
  computeFactorActivityBreakdown,
  computeFactorRollingWindow,
  computeFactorStreak,
  computeFactorWeekDelta,
  factorPointsMarkerPercent,
  formatFactorStreak,
  type PerformanceFactorId,
} from '../../lib/guardPerformanceFactorDetail';
import { AppSubScreenHeader } from '../ui/app/AppPrimitives';

interface GuardPerformanceFactorDetailProps {
  factor: PerformanceFactor;
  factorId: PerformanceFactorId;
  guardId: string;
  requests: SecurityRequest[];
  onBack: () => void;
  onOpenHistoryItem?: (jobId: string) => void;
  showHistory?: boolean;
}

function StatusBadge({ status, label }: { status: PerformanceFactor['status']; label: string }) {
  return (
    <span className={`guard-factor-detail-status guard-factor-status-${status}`}>
      <span className="guard-factor-status-dot" />
      {label}
    </span>
  );
}

function PointsScaleLegend({ factorId }: { factorId: PerformanceFactorId }) {
  const bands = FACTOR_POINT_SCALES[factorId];
  return (
    <ul className="guard-factor-detail-scale-list">
      {bands.map((band) => (
        <li key={band.status} className={`guard-factor-detail-scale-item guard-factor-detail-scale-${band.status}`}>
          <span className="guard-factor-detail-scale-swatch" />
          <span className="guard-factor-detail-scale-copy">
            <strong>{band.statusLabel}</strong>
            <span className="guard-factor-detail-scale-range"> ({band.rangeLabel})</span>
            <span className="guard-factor-detail-scale-points">
              {' '}
              · {band.pointsMin === band.pointsMax ? `${band.pointsMax} pts` : `${band.pointsMin} – ${band.pointsMax} pts`}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function RollingGrid({
  cells,
  droppedCells,
  rateDisplay,
}: {
  cells: Array<'positive' | 'negative' | 'neutral' | 'empty'>;
  droppedCells: Array<'positive' | 'negative' | 'neutral' | 'empty'>;
  rateDisplay: string;
}) {
  return (
    <div className="guard-factor-detail-grid-card">
      <div className="guard-factor-detail-grid-header">
        <span>Example rolling window</span>
        <strong>{rateDisplay}</strong>
      </div>
      <div className="guard-factor-detail-grid" aria-hidden>
        {cells.map((cell, index) => (
          <span key={`cell-${index}`} className={`guard-factor-detail-grid-cell guard-factor-detail-grid-cell-${cell}`}>
            {cell === 'negative' ? <X className="w-2.5 h-2.5" /> : null}
          </span>
        ))}
      </div>
      {droppedCells.length > 0 && (
        <div className="guard-factor-detail-grid-dropped">
          <span className="guard-factor-detail-grid-dropped-label">No longer in calculation</span>
          <div className="guard-factor-detail-grid-dropped-row">
            {droppedCells.map((cell, index) => (
              <span
                key={`dropped-${index}`}
                className={`guard-factor-detail-grid-cell guard-factor-detail-grid-cell-${cell}`}
              >
                {cell === 'negative' ? <X className="w-2.5 h-2.5" /> : null}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function GuardPerformanceFactorDetail({
  factor,
  factorId,
  guardId,
  requests,
  onBack,
  onOpenHistoryItem,
  showHistory = false,
}: GuardPerformanceFactorDetailProps) {
  const copy = FACTOR_DETAIL_COPY[factorId];
  const activity = useMemo(
    () => computeFactorActivityBreakdown(guardId, factorId, requests),
    [guardId, factorId, requests]
  );
  const rolling = useMemo(
    () => computeFactorRollingWindow(guardId, factorId, requests),
    [guardId, factorId, requests]
  );
  const streak = useMemo(
    () => computeFactorStreak(guardId, factorId, requests),
    [guardId, factorId, requests]
  );
  const weekDelta = useMemo(
    () => computeFactorWeekDelta(guardId, factorId, requests),
    [guardId, factorId, requests]
  );
  const history = useMemo(
    () => (showHistory ? buildFactorHistory(guardId, factorId, requests) : []),
    [showHistory, guardId, factorId, requests]
  );
  const markerPercent = factorPointsMarkerPercent(factor);

  return (
    <div className="guard-factor-detail-screen">
      <AppSubScreenHeader title={factor.label} onBack={onBack} backLabel="" />

      <div className="guard-factor-detail-scroll">
        <section className="guard-factor-detail-hero">
          <p className="guard-factor-detail-rate">{factor.rateDisplay}</p>
          <StatusBadge status={factor.status} label={factor.statusLabel} />
        </section>

        <section className="guard-factor-detail-card">
          <div className="guard-factor-detail-card-head">
            <h2>Points toward your overall rating</h2>
            <p>
              {factor.pointsEarned} of {factor.pointsMax} points
            </p>
          </div>
          <div className="guard-factor-detail-points-track" role="presentation">
            <div className="guard-factor-detail-points-segments" aria-hidden>
              <span className="guard-factor-detail-seg very-low" />
              <span className="guard-factor-detail-seg low" />
              <span className="guard-factor-detail-seg moderate" />
              <span className="guard-factor-detail-seg high" />
              <span className="guard-factor-detail-seg very-high" />
            </div>
            <span
              className="guard-factor-detail-points-marker"
              style={{ left: `${markerPercent}%` }}
              aria-hidden
            />
          </div>
          <PointsScaleLegend factorId={factorId} />
          {copy.thresholdWarning ? (
            <p className="guard-factor-detail-warning">
              {copy.thresholdWarning}
            </p>
          ) : null}
        </section>

        <section className="guard-factor-detail-quick-stats">
          <div className="guard-factor-detail-quick-stat">
            <TrendingUp className="guard-factor-detail-quick-icon" aria-hidden />
            <span>
              {weekDelta > 0 ? '+' : ''}
              {weekDelta}% this week
            </span>
          </div>
          <div className="guard-factor-detail-quick-divider" aria-hidden />
          <div className="guard-factor-detail-quick-stat">
            <Flame className="guard-factor-detail-quick-icon" aria-hidden />
            <span>{formatFactorStreak(streak, factorId)}</span>
          </div>
        </section>

        <section className="guard-factor-detail-card">
          <h2 className="guard-factor-detail-section-title">{copy.activityHeading}</h2>
          {activity.rows.map((row) => {
            const fill = row.total > 0 ? Math.round((row.count / row.total) * 100) : 0;
            return (
              <button
                key={row.id}
                type="button"
                className="guard-factor-detail-activity-row"
                onClick={() => undefined}
              >
                <div className="guard-factor-detail-activity-copy">
                  <span>{row.label}</span>
                  <strong>{row.count}</strong>
                </div>
                <div className={`guard-factor-detail-activity-bar guard-factor-detail-activity-bar-${row.tone}`}>
                  <div style={{ width: `${fill}%` }} />
                </div>
                <ChevronRight className="guard-factor-detail-activity-chevron" aria-hidden />
              </button>
            );
          })}
          <p className="guard-factor-detail-excluded">
            <Info className="w-3.5 h-3.5" aria-hidden />
            {activity.excludedCount} {copy.excludedLabel}
          </p>
          <button type="button" className="guard-factor-detail-view-all">
            {copy.viewAllLabel}
          </button>
        </section>

        <section className="guard-factor-detail-card">
          <h2 className="guard-factor-detail-section-title">{copy.aboutTitle}</h2>
          <p className="guard-factor-detail-about">{copy.aboutBody}</p>
          <RollingGrid cells={rolling.cells} droppedCells={rolling.droppedCells} rateDisplay={factor.rateDisplay} />
        </section>

        <section className="guard-factor-detail-card">
          <h2 className="guard-factor-detail-section-title">Tips to increase your rating</h2>
          <ul className="guard-factor-detail-tips">
            {copy.tips.map((tip) => (
              <li key={tip}>
                <Check className="guard-factor-detail-tip-icon" aria-hidden />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {showHistory && history.length > 0 && (
          <section className="guard-factor-detail-card">
            <h2 className="guard-factor-detail-section-title">Recent activity</h2>
            <ul className="guard-factor-detail-history">
              {history.slice(0, 25).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="guard-factor-detail-history-row"
                    onClick={() => onOpenHistoryItem?.(item.id)}
                    disabled={!onOpenHistoryItem}
                  >
                    <div className="guard-factor-detail-history-copy">
                      <strong>{item.title}</strong>
                      <span>{item.subtitle}</span>
                      <span className="guard-factor-detail-history-date">
                        {new Date(item.date).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <span className={`guard-factor-detail-history-outcome guard-factor-detail-history-outcome-${item.outcome}`}>
                      {item.outcomeLabel}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
