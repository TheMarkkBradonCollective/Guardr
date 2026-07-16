import React, { useMemo } from 'react';
import { Star } from 'lucide-react';
import type { JobType, SecurityGuard, SecurityRequest } from '../../types';
import {
  buildJobTypePerformanceFactors,
  computeClientReviewStatsForJobType,
  computeGuardPerformanceForJobType,
  formatReviewCount,
  formatShiftSampleCount,
  type GuardSkillRating,
} from '../../lib/guardPerformance';
import { jobTypePreferenceLabel } from '../../lib/guardJobPreferences';
import { FactorCard } from './GuardRatingSection';
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
  const factors = useMemo(
    () => buildJobTypePerformanceFactors(guard.id, jobType, requests),
    [guard.id, jobType, requests]
  );

  const averageRating = skillRating?.rating ?? clientReviews.average;
  const reviewCount = skillRating?.reviewCount ?? clientReviews.count;
  const hasShiftHistory = metrics.jobsSampled > 0 || reviewCount > 0;

  const heroBlock = (
    <div className="guard-jobtype-hero">
      <div className="guard-jobtype-hero-glow" aria-hidden />
      <div className="guard-jobtype-hero-icon-wrap" aria-hidden>
        <Icon className="guard-jobtype-hero-icon" />
      </div>
      <h2 className="guard-jobtype-hero-name">{label}</h2>
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
          : metrics.jobsSampled > 0
            ? formatShiftSampleCount(metrics.jobsSampled)
            : `Building your ${label.toLowerCase()} profile`}
      </p>
    </div>
  );

  const bodyBlock = (
    <div className="guard-rating-body">
      <section className="guard-factors-section">
        <div className="guard-factors-header">
          <h3 className="guard-factors-heading">{label} ratings</h3>
          <p className="guard-factors-subheading">
            {hasShiftHistory
              ? 'Performance for this job type'
              : 'Points earned from recent shift behavior'}
          </p>
        </div>
        <div className="guard-factors-grid">
          {factors.map((factor) => (
            <FactorCard key={factor.id} factor={factor} />
          ))}
        </div>
      </section>
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
