import React, { useMemo } from 'react';
import { AlertTriangle, Award, ChevronRight, Info, Shield } from 'lucide-react';
import type { SecurityGuard, SecurityRequest } from '../../types';
import {
  buildPerformanceBreakdown,
  computeClientReviewStats,
  computeGuardPerformanceRating,
  formatOverallRating,
  formatPerformanceScore,
  formatReviewCount,
  formatShiftSampleCount,
  formatViolationSummary,
  PERFORMANCE_TIERS,
  type GuardPerformanceMetrics,
  type GuardSkillRating,
  type PerformanceFactor,
  type PerformanceTier,
} from '../../lib/guardPerformance';

export interface GuardRatingSectionProps {
  guard: SecurityGuard;
  requests: SecurityRequest[];
  performance: GuardPerformanceMetrics;
  skillRatings: GuardSkillRating[];
  /** full = guard performance screen; compact = live shift card */
  variant?: 'full' | 'compact';
  className?: string;
}

function displayOverallScore(performance: GuardPerformanceMetrics, guard: SecurityGuard): number {
  if (performance.overallScore > 0) return performance.overallScore;
  if (guard.rating > 0) return guard.rating;
  return 0;
}

function TierBadgeIcon({ tier, size = 'md' }: { tier: PerformanceTier; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-12 h-12';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  const tierClass =
    tier.level >= 3
      ? 'guard-tier-badge-elite'
      : tier.level >= 2
        ? 'guard-tier-badge-professional'
        : tier.level >= 1
          ? 'guard-tier-badge-rising'
          : 'guard-tier-badge-starting';

  return (
    <div className={`guard-tier-badge ${sizeClass} ${tierClass}`} aria-hidden>
      {tier.level >= 3 ? (
        <Shield className={iconSize} />
      ) : tier.level >= 2 ? (
        <Award className={iconSize} />
      ) : (
        <Shield className={iconSize} />
      )}
    </div>
  );
}

function TierProgressBar({
  overallRating,
  tier,
  nextTier,
}: {
  overallRating: number;
  tier: PerformanceTier;
  nextTier: PerformanceTier | null;
}) {
  const maxScale = 100;
  const fillPercent = Math.min(100, (overallRating / maxScale) * 100);

  return (
    <div className="guard-tier-progress">
      <div className="guard-tier-progress-track" role="presentation">
        <div className="guard-tier-progress-fill" style={{ width: `${fillPercent}%` }} />
        {PERFORMANCE_TIERS.map((t) => {
          const position = (t.threshold / maxScale) * 100;
          const isActive = overallRating >= t.threshold;
          const isCurrent = tier.id === t.id;
          return (
            <div
              key={t.id}
              className={`guard-tier-progress-marker ${isActive ? 'guard-tier-progress-marker-active' : ''} ${isCurrent ? 'guard-tier-progress-marker-current' : ''}`}
              style={{ left: `${position}%` }}
            >
              <TierBadgeIcon tier={t} size="sm" />
              <span className="guard-tier-progress-marker-label">{t.threshold}</span>
            </div>
          );
        })}
      </div>
      {nextTier && (
        <p className="guard-tier-progress-hint">
          {nextTier.threshold - overallRating} points to {nextTier.name}
        </p>
      )}
    </div>
  );
}

function FactorRow({ factor }: { factor: PerformanceFactor }) {
  const percent =
    factor.pointsMax > 0 ? Math.round((factor.pointsEarned / factor.pointsMax) * 100) : 0;

  return (
    <div className="guard-factor-row">
      <div className="guard-factor-row-head">
        <span className="guard-factor-row-label">{factor.label}</span>
        <span className="guard-factor-row-rate">{factor.rateDisplay}</span>
      </div>
      <div className="guard-factor-row-meta">
        <span className="guard-factor-row-points">
          {factor.pointsEarned} of {factor.pointsMax} points
        </span>
        <span className={`guard-factor-row-status guard-factor-status-${factor.status}`}>
          <span className="guard-factor-status-dot" aria-hidden />
          {factor.statusLabel}
        </span>
      </div>
      <div className="guard-rating-bar-track" role="presentation">
        <div className="guard-rating-bar-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function RatingBarRow({
  label,
  score,
  percent,
  reviewCount,
  compact,
}: {
  label: string;
  score: number;
  percent: number;
  reviewCount?: number;
  compact?: boolean;
}) {
  return (
    <div className={`guard-rating-bar-row ${compact ? 'guard-rating-bar-row-compact' : ''}`}>
      <div className="guard-rating-bar-label-row">
        <span className="guard-rating-bar-label">{label}</span>
        <span className="guard-rating-bar-score">
          {score.toFixed(1)}
          {reviewCount != null && reviewCount > 0 && (
            <span className="guard-rating-bar-count"> ({reviewCount})</span>
          )}
        </span>
      </div>
      <div className="guard-rating-bar-track" role="presentation">
        <div className="guard-rating-bar-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function GuardRatingSection({
  guard,
  requests,
  performance,
  skillRatings,
  variant = 'full',
  className = '',
}: GuardRatingSectionProps) {
  const clientReviews = useMemo(
    () => computeClientReviewStats(guard.id, requests),
    [guard.id, requests]
  );

  const rating = useMemo(
    () => computeGuardPerformanceRating(guard, requests),
    [guard, requests]
  );

  const overall = displayOverallScore(performance, guard);
  const breakdown = buildPerformanceBreakdown(performance, clientReviews);
  const hasSkills = skillRatings.length > 0;
  const hasBreakdown = breakdown.length > 0;
  const isCompact = variant === 'compact';
  const violationSummary = formatViolationSummary(rating.violations);
  const hasRatingData = rating.overallRating > 0 || performance.jobsSampled > 0;

  if (!hasRatingData && !hasBreakdown && !hasSkills) {
    return (
      <section className={`guard-rating-section guard-rating-section-empty ${className}`}>
        <p className="text-sm text-brand-text-muted text-center py-3">
          Ratings will appear after completed shifts and client reviews.
        </p>
      </section>
    );
  }

  if (isCompact) {
    return (
      <section className={`guard-rating-section guard-rating-section-compact ${className}`}>
        <div className="guard-rating-hero">
          <TierBadgeIcon tier={rating.tier} size="sm" />
          <div className="guard-rating-hero-meta">
            <p className="guard-rating-hero-title">{rating.tier.name}</p>
            <p className="guard-rating-hero-subtitle">
              Overall rating {formatOverallRating(rating.overallRating)}
              {overall > 0 && ` · Security score ${formatPerformanceScore(overall)}`}
            </p>
          </div>
        </div>
        {rating.factors.length > 0 && (
          <div className="guard-factors-list">
            {rating.factors.slice(0, 3).map((factor) => (
              <FactorRow key={factor.id} factor={factor} />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className={`guard-rating-section guard-rating-section-tiered ${className}`}>
      <div className="guard-tier-hero">
        <TierBadgeIcon tier={rating.tier} />
        <h2 className="guard-tier-hero-name">{rating.tier.name}</h2>
        <p className="guard-tier-hero-score">
          Overall rating {formatOverallRating(rating.overallRating)}
          <Info className="guard-tier-hero-info" aria-hidden />
        </p>
        <TierProgressBar
          overallRating={rating.overallRating}
          tier={rating.tier}
          nextTier={rating.nextTier}
        />
        {clientReviews.count > 0 ? (
          <p className="guard-tier-hero-subtitle">{formatReviewCount(clientReviews.count)}</p>
        ) : performance.jobsSampled > 0 ? (
          <p className="guard-tier-hero-subtitle">{formatShiftSampleCount(performance.jobsSampled)}</p>
        ) : null}
      </div>

      {violationSummary && (
        <button type="button" className="guard-violations-banner">
          <AlertTriangle className="guard-violations-icon" aria-hidden />
          <span className="guard-violations-text">{violationSummary}</span>
          <ChevronRight className="guard-violations-chevron" aria-hidden />
        </button>
      )}

      {rating.factors.length > 0 && (
        <div className="guard-factors-section">
          <p className="guard-rating-group-label">Your rating factors</p>
          <div className="guard-factors-list">
            {rating.factors.map((factor) => (
              <FactorRow key={factor.id} factor={factor} />
            ))}
          </div>
        </div>
      )}

      {hasSkills && (
        <div className="guard-rating-breakdown">
          <p className="guard-rating-group-label">Skills</p>
          {skillRatings.slice(0, 6).map((skill) => (
            <RatingBarRow
              key={skill.skill}
              label={skill.skill}
              score={skill.rating}
              percent={rateToBarPercent(skill.rating)}
              reviewCount={skill.reviewCount}
            />
          ))}
        </div>
      )}

      <div className="guard-performance-stats" aria-label="Performance summary">
        <div className="guard-performance-stat">
          <p className="guard-performance-stat-label">Overall rating</p>
          <p className="guard-performance-stat-value">
            {rating.overallRating > 0 ? formatOverallRating(rating.overallRating) : '—'}
          </p>
        </div>
        <div className="guard-performance-stat">
          <p className="guard-performance-stat-label">Security score</p>
          <p className="guard-performance-stat-value">
            {overall > 0 ? formatPerformanceScore(overall) : '—'}
          </p>
        </div>
        <div className="guard-performance-stat">
          <p className="guard-performance-stat-label">Shifts completed</p>
          <p className="guard-performance-stat-value">{guard.jobsCompleted}</p>
        </div>
        <div className="guard-performance-stat">
          <p className="guard-performance-stat-label">Experience</p>
          <p className="guard-performance-stat-value">
            {guard.yearsExperience != null && guard.yearsExperience > 0
              ? `${guard.yearsExperience}+ yrs`
              : '—'}
          </p>
        </div>
      </div>
    </section>
  );
}

function rateToBarPercent(score: number): number {
  return Math.round(Math.min(100, Math.max(0, (score / 5) * 100)));
}
