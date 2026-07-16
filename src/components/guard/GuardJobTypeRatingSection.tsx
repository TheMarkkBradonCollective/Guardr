import React, { useMemo, useState } from 'react';
import { Check, ChevronRight, Info, Star } from 'lucide-react';
import type { JobType, SecurityGuard, SecurityRequest } from '../../types';
import {
  computeClientReviewStatsForJobType,
  computeGuardPerformanceForJobType,
  formatReviewCount,
  formatShiftSampleCount,
  type GuardSkillRating,
} from '../../lib/guardPerformance';
import {
  buildJobTypeRatingCards,
  jobTypeRatingDisplayName,
  type JobTypeMetricId,
  type JobTypeRatingCard,
} from '../../lib/guardJobTypeRatingMetrics';
import { buildJobTypePremiumPriorityProgress } from '../../lib/guardPremiumJobPriority';
import { JOB_TYPE_ICONS } from './guardJobTypeIcons';
import { JobTypePremiumPriorityInfoSheet } from './JobTypePremiumPriorityInfoSheet';

export interface GuardJobTypeRatingSectionProps {
  guard: SecurityGuard;
  requests: SecurityRequest[];
  jobType: JobType;
  skillRating?: GuardSkillRating;
  pinnedLayout?: boolean;
  toolbar?: React.ReactNode;
  onMetricSelect?: (metricId: JobTypeMetricId, card: JobTypeRatingCard) => void;
  className?: string;
}

function PremiumPriorityChecks({
  targets,
}: {
  targets: Array<{ id: string; met: boolean }>;
}) {
  return (
    <div className="guard-premium-priority-checks" aria-label="Premium priority requirements">
      {targets.map((target) => (
        <span
          key={target.id}
          className={`guard-premium-priority-check ${target.met ? 'guard-premium-priority-check-met' : ''}`}
          aria-hidden
        >
          {target.met ? <Check className="guard-premium-priority-check-icon" /> : null}
        </span>
      ))}
    </div>
  );
}

function JobTypeMetricCard({
  card,
  onSelect,
}: {
  card: JobTypeRatingCard;
  onSelect?: (metricId: JobTypeMetricId, card: JobTypeRatingCard) => void;
}) {
  const interactive = !!onSelect;

  const content = (
    <>
      <p className="guard-jobtype-metric-label">{card.label}</p>
      <div className="guard-jobtype-metric-value-row">
        <p className="guard-jobtype-metric-value">{card.valueDisplay}</p>
        <span
          className={`guard-jobtype-metric-check ${card.meetsTarget ? 'guard-jobtype-metric-check-ok' : 'guard-jobtype-metric-check-muted'}`}
          aria-hidden
        >
          <Check className="guard-jobtype-metric-check-icon" />
        </span>
      </div>
      <p className="guard-jobtype-metric-target">{card.targetLabel}</p>
      <span className={`guard-factor-card-status guard-factor-status-${card.status}`}>
        <span className="guard-factor-status-dot" />
        {card.statusLabel}
      </span>
      {interactive ? <ChevronRight className="guard-factor-card-chevron" aria-hidden /> : null}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        className={`guard-jobtype-metric-card guard-jobtype-metric-card-interactive guard-factor-card-${card.status}`}
        onClick={() => onSelect?.(card.id, card)}
      >
        {content}
      </button>
    );
  }

  return (
    <article className={`guard-jobtype-metric-card guard-factor-card-${card.status}`}>
      {content}
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
  onMetricSelect,
  className = '',
}: GuardJobTypeRatingSectionProps) {
  const [priorityInfoOpen, setPriorityInfoOpen] = useState(false);
  const displayName = jobTypeRatingDisplayName(jobType);
  const Icon = JOB_TYPE_ICONS[jobType];

  const metrics = useMemo(
    () => computeGuardPerformanceForJobType(guard.id, requests, jobType),
    [guard.id, requests, jobType]
  );
  const clientReviews = useMemo(
    () => computeClientReviewStatsForJobType(guard.id, requests, jobType),
    [guard.id, requests, jobType]
  );
  const cards = useMemo(
    () => buildJobTypeRatingCards(guard.id, jobType, requests),
    [guard.id, jobType, requests]
  );
  const premiumProgress = useMemo(
    () => buildJobTypePremiumPriorityProgress(jobType, cards),
    [jobType, cards]
  );

  const averageRating = skillRating?.rating ?? clientReviews.average;
  const reviewCount = skillRating?.reviewCount ?? clientReviews.count;

  const heroBlock = (
    <div className="guard-jobtype-hero guard-jobtype-hero-premium">
      <div className="guard-jobtype-hero-glow" aria-hidden />
      <div className="guard-jobtype-hero-icon-wrap" aria-hidden>
        <Icon className="guard-jobtype-hero-icon" />
      </div>
      <h2 className="guard-jobtype-hero-name">{displayName}</h2>

      <div className="guard-premium-priority-progress-row">
        <p className="guard-premium-priority-progress-label">
          {premiumProgress.isQualified ? premiumProgress.qualifiedLabel : premiumProgress.progressLabel}
        </p>
        <button
          type="button"
          className="guard-premium-priority-info-btn"
          aria-label={`How premium priority works for ${displayName}`}
          onClick={() => setPriorityInfoOpen(true)}
        >
          <Info className="guard-premium-priority-info-icon" aria-hidden />
        </button>
      </div>

      <PremiumPriorityChecks targets={premiumProgress.targets} />

      <button
        type="button"
        className="guard-premium-priority-rewards-btn"
        onClick={() => setPriorityInfoOpen(true)}
      >
        View premium job priority
      </button>

      <div className="guard-jobtype-hero-score-row guard-jobtype-hero-score-row-compact">
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
            : `Building your ${displayName.toLowerCase()} profile`}
      </p>

      <JobTypePremiumPriorityInfoSheet
        jobType={jobType}
        totalTargets={premiumProgress.totalCount}
        open={priorityInfoOpen}
        onClose={() => setPriorityInfoOpen(false)}
      />
    </div>
  );

  const bodyBlock = (
    <div className="guard-rating-body">
      <section className="guard-jobtype-metrics-section">
        <div className="guard-factors-header">
          <h3 className="guard-factors-heading">{displayName} ratings</h3>
          <p className="guard-factors-subheading">Performance metrics for this job type</p>
        </div>
        <div className="guard-jobtype-metrics-grid">
          {cards.map((card) => (
            <JobTypeMetricCard key={card.id} card={card} onSelect={onMetricSelect} />
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
