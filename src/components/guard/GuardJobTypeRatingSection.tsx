import React, { useMemo } from 'react';
import { Check, ChevronRight, Star } from 'lucide-react';
import type { JobType, SecurityGuard, SecurityRequest } from '../../types';
import {
  buildJobTypeRatingMetrics,
  computeClientReviewStatsForJobType,
  computeGuardPerformanceForJobType,
  formatReviewCount,
  formatShiftSampleCount,
  type GuardSkillRating,
  type JobTypeRatingMetric,
} from '../../lib/guardPerformance';
import { jobTypePreferenceLabel } from '../../lib/guardJobPreferences';
import { JOB_TYPE_ICONS } from './guardJobTypeIcons';

export interface GuardJobTypeRatingSectionProps {
  guard: SecurityGuard;
  requests: SecurityRequest[];
  jobType: JobType;
  skillRating?: GuardSkillRating;
  pinnedLayout?: boolean;
  toolbar?: React.ReactNode;
  className?: string;
}

function JobTypeMetricCard({ metric }: { metric: JobTypeRatingMetric }) {
  const meetsTarget =
    metric.status === 'very-high' || metric.status === 'high' || metric.id === 'lifetime-shifts';

  return (
    <article className={`guard-jobtype-metric-card guard-factor-card-${metric.status}`}>
      <p className="guard-jobtype-metric-label">{metric.label}</p>
      <div className="guard-jobtype-metric-value-row">
        <p className="guard-jobtype-metric-value">{metric.valueDisplay}</p>
        <span
          className={`guard-jobtype-metric-check ${meetsTarget ? 'guard-jobtype-metric-check-ok' : 'guard-jobtype-metric-check-muted'}`}
          aria-hidden
        >
          <Check className="guard-jobtype-metric-check-icon" />
        </span>
      </div>
      <p className="guard-jobtype-metric-target">{metric.targetLabel}</p>
      <span className={`guard-factor-card-status guard-factor-status-${metric.status}`}>
        <span className="guard-factor-status-dot" />
        {metric.statusLabel}
      </span>
      <ChevronRight className="guard-factor-card-chevron" aria-hidden />
    </article>
  );
}

export function GuardJobTypeRatingSection({
  guard,
  requests,
  jobType,
  skillRating,
  pinnedLayout = false,
  toolbar,
  className = '',
}: GuardJobTypeRatingSectionProps) {
  const label = jobTypePreferenceLabel(jobType);
  const Icon = JOB_TYPE_ICONS[jobType];

  const metrics = useMemo(
    () => computeGuardPerformanceForJobType(guard.id, requests, jobType),
    [guard.id, requests, jobType]
  );
  const clientReviews = useMemo(
    () => computeClientReviewStatsForJobType(guard.id, requests, jobType),
    [guard.id, requests, jobType]
  );
  const ratingMetrics = useMemo(
    () => buildJobTypeRatingMetrics(metrics, clientReviews),
    [metrics, clientReviews]
  );

  const averageRating = skillRating?.rating ?? clientReviews.average;
  const reviewCount = skillRating?.reviewCount ?? clientReviews.count;
  const hasData = metrics.jobsSampled > 0 || reviewCount > 0;

  const heroBlock = (
    <div className="guard-jobtype-hero">
      <div className="guard-jobtype-hero-glow" aria-hidden />
      <div className="guard-jobtype-hero-icon-wrap" aria-hidden>
        <Icon className="guard-jobtype-hero-icon" />
      </div>
      <h2 className="guard-jobtype-hero-name">{label}</h2>
      {hasData ? (
        <>
          <div className="guard-jobtype-hero-score-row">
            <Star className="guard-jobtype-hero-star" aria-hidden />
            <span className="guard-jobtype-hero-score">
              {averageRating > 0 ? averageRating.toFixed(1) : '—'}
            </span>
            <span className="guard-jobtype-hero-score-label">average rating</span>
          </div>
          <p className="guard-jobtype-hero-subtitle">
            {reviewCount > 0
              ? formatReviewCount(reviewCount)
              : formatShiftSampleCount(metrics.jobsSampled)}
          </p>
        </>
      ) : (
        <p className="guard-jobtype-hero-subtitle">
          Complete shifts in this category to build your specialty rating.
        </p>
      )}
    </div>
  );

  const bodyBlock = (
    <div className="guard-rating-body">
      {hasData ? (
        <section className="guard-jobtype-metrics-section">
          <div className="guard-factors-header">
            <h3 className="guard-factors-heading">{label} ratings</h3>
            <p className="guard-factors-subheading">Performance for this job type</p>
          </div>
          <div className="guard-jobtype-metrics-grid">
            {ratingMetrics.map((metric) => (
              <JobTypeMetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </section>
      ) : (
        <div className="guard-rating-empty-state guard-jobtype-empty-state">
          <div className="guard-rating-empty-icon">
            <Icon className="w-6 h-6" />
          </div>
          <p className="guard-rating-empty-title">No {label.toLowerCase()} shifts yet</p>
          <p className="guard-rating-empty-body">
            Your specialty rating appears here after you complete shifts in this category and receive
            client reviews.
          </p>
        </div>
      )}
    </div>
  );

  if (pinnedLayout) {
    return (
      <>
        <div className="guard-tiered-screen-pinned">
          <section className={`guard-rating-section guard-rating-section-tiered guard-jobtype-hero-card ${className}`}>
            {heroBlock}
          </section>
        </div>
        {toolbar}
        <div className="guard-tiered-screen-scroll">{bodyBlock}</div>
      </>
    );
  }

  return (
    <section className={`guard-rating-section guard-rating-section-tiered ${className}`}>
      {heroBlock}
      {bodyBlock}
    </section>
  );
}
