import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  ChevronRight,
  Crown,
  Info,
  Medal,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';
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
  type PerformanceViolation,
} from '../../lib/guardPerformance';

export interface GuardRatingSectionProps {
  guard: SecurityGuard;
  requests: SecurityRequest[];
  performance: GuardPerformanceMetrics;
  skillRatings: GuardSkillRating[];
  /** full = guard performance screen; compact = live shift card */
  variant?: 'full' | 'compact';
  /** Pin tier hero; scroll body content underneath */
  pinnedLayout?: boolean;
  /** Show every job type in specialty ratings (zeros for no history) */
  includeAllJobTypes?: boolean;
  /** Reorder factor cards by id */
  factorOrder?: string[];
  /** Navigate to factor detail when a card is tapped */
  onFactorSelect?: (factor: PerformanceFactor) => void;
  className?: string;
}

function displayOverallScore(performance: GuardPerformanceMetrics, guard: SecurityGuard): number {
  if (performance.overallScore > 0) return performance.overallScore;
  if (guard.rating > 0) return guard.rating;
  return 0;
}

function tierHeroClass(tier: PerformanceTier): string {
  return `guard-performance-hero-${tier.id}`;
}

function TierMedal({ tier, size = 'md' }: { tier: PerformanceTier; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass =
    size === 'lg' ? 'guard-tier-medal-lg' : size === 'sm' ? 'guard-tier-medal-sm' : 'guard-tier-medal-md';
  const tierClass =
    tier.level >= 3
      ? 'guard-tier-medal-elite'
      : tier.level >= 2
        ? 'guard-tier-medal-professional'
        : tier.level >= 1
          ? 'guard-tier-medal-rising'
          : 'guard-tier-medal-starting';
  const Icon = tier.level >= 3 ? Crown : tier.level >= 2 ? Award : tier.level >= 1 ? Medal : Shield;

  return (
    <div className={`guard-tier-medal ${sizeClass} ${tierClass}`} aria-hidden>
      <div className="guard-tier-medal-ring">
        <Icon className="guard-tier-medal-icon" />
      </div>
      <div className="guard-tier-medal-ribbon" />
    </div>
  );
}

function TierProgressBar({
  overallRating,
  tier,
  nextTier,
  compact = false,
}: {
  overallRating: number;
  tier: PerformanceTier;
  nextTier: PerformanceTier | null;
  compact?: boolean;
}) {
  const fillPercent = Math.min(100, overallRating);

  return (
    <div className={`guard-tier-progress ${compact ? 'guard-tier-progress-compact' : ''}`}>
      <div className="guard-tier-progress-markers" aria-hidden>
        {PERFORMANCE_TIERS.map((t) => {
          const isActive = overallRating >= t.threshold;
          const isCurrent = tier.id === t.id;
          return (
            <div
              key={t.id}
              className={`guard-tier-progress-node ${isActive ? 'guard-tier-progress-node-active' : ''} ${isCurrent ? 'guard-tier-progress-node-current' : ''}`}
              style={{ left: `${t.threshold}%` }}
            >
              <div className="guard-tier-progress-node-icon">
                {t.level >= 3 ? <Crown className="w-3 h-3" /> : t.level >= 2 ? <Award className="w-3 h-3" /> : <Medal className="w-3 h-3" />}
              </div>
              <span className="guard-tier-progress-node-label">{t.threshold}</span>
            </div>
          );
        })}
      </div>
      <div className="guard-tier-progress-track" role="presentation">
        <div className="guard-tier-progress-fill" style={{ width: `${fillPercent}%` }} />
      </div>
      {nextTier ? (
        <p className="guard-tier-progress-hint">
          <TrendingUp className="guard-tier-progress-hint-icon" aria-hidden />
          <span>
            <strong>{nextTier.threshold - overallRating}</strong> points to {nextTier.name}
          </span>
        </p>
      ) : (
        <p className="guard-tier-progress-hint guard-tier-progress-hint-max">
          <Sparkles className="guard-tier-progress-hint-icon" aria-hidden />
          <span>Top tier reached</span>
        </p>
      )}
    </div>
  );
}

function FactorCard({
  factor,
  onSelect,
}: {
  factor: PerformanceFactor;
  onSelect?: (factor: PerformanceFactor) => void;
}) {
  const fillPercent = factor.pointsMax > 0 ? Math.round((factor.pointsEarned / factor.pointsMax) * 100) : 0;
  const interactive = !!onSelect;

  const content = (
    <>
      <p className="guard-factor-card-label">{factor.label}</p>
      <p className="guard-factor-card-rate">{factor.rateDisplay}</p>
      <div className="guard-factor-card-bar" role="presentation" aria-hidden>
        <div className="guard-factor-card-bar-fill" style={{ width: `${fillPercent}%` }} />
      </div>
      <div className="guard-factor-card-footer">
        <span className="guard-factor-card-points">
          {factor.pointsEarned}
          <span className="guard-factor-card-points-max"> / {factor.pointsMax} pts</span>
        </span>
        <span className={`guard-factor-card-status guard-factor-status-${factor.status}`}>
          <span className="guard-factor-status-dot" />
          {factor.statusLabel}
        </span>
      </div>
      {interactive ? <ChevronRight className="guard-factor-card-chevron" aria-hidden /> : null}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        className={`guard-factor-card guard-factor-card-interactive guard-factor-card-${factor.status}`}
        onClick={() => onSelect?.(factor)}
      >
        {content}
      </button>
    );
  }

  return (
    <article className={`guard-factor-card guard-factor-card-${factor.status}`}>
      {content}
    </article>
  );
}

function ViolationsCard({
  violations,
  summary,
}: {
  violations: PerformanceViolation[];
  summary: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="guard-violations-wrap">
      <button
        type="button"
        className="guard-violations-card"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
      >
        <div className="guard-violations-card-icon-wrap">
          <AlertTriangle className="guard-violations-card-icon" aria-hidden />
        </div>
        <div className="guard-violations-card-copy">
          <p className="guard-violations-card-title">{summary}</p>
          <p className="guard-violations-card-subtitle">
            Client reports and policy issues affect your tier progress
          </p>
        </div>
        <ChevronRight className={`guard-violations-card-chevron ${expanded ? 'guard-violations-card-chevron-open' : ''}`} aria-hidden />
      </button>
      {expanded && (
        <ul className="guard-violations-list">
          {violations.map((violation) => (
            <li key={violation.id} className="guard-violations-list-item">
              <span className="guard-violations-list-count">{violation.count}</span>
              <span className="guard-violations-list-label">{violation.label}</span>
            </li>
          ))}
        </ul>
      )}
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
          {reviewCount != null && reviewCount <= 0 ? (
            '—'
          ) : (
            <>
              {score.toFixed(1)}
              {reviewCount != null && reviewCount > 0 && (
                <span className="guard-rating-bar-count"> ({reviewCount})</span>
              )}
            </>
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
  pinnedLayout = false,
  includeAllJobTypes = false,
  factorOrder,
  onFactorSelect,
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

  const orderedFactors = useMemo(() => {
    if (!factorOrder?.length) return rating.factors;
    const byId = new Map(rating.factors.map((f) => [f.id, f]));
    const ordered = factorOrder.map((id) => byId.get(id)).filter((f): f is PerformanceFactor => !!f);
    const remaining = rating.factors.filter((f) => !factorOrder.includes(f.id));
    return [...ordered, ...remaining];
  }, [rating.factors, factorOrder]);

  const displayedSkills = includeAllJobTypes ? skillRatings : skillRatings.slice(0, 6);

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
        <div className="guard-rating-empty-state">
          <div className="guard-rating-empty-icon">
            <Star className="w-6 h-6" />
          </div>
          <p className="guard-rating-empty-title">No performance data yet</p>
          <p className="guard-rating-empty-body">
            Complete shifts and earn client reviews to unlock your tier and rating factors.
          </p>
        </div>
      </section>
    );
  }

  if (isCompact) {
    return (
      <section className={`guard-rating-section guard-rating-section-compact ${className}`}>
        <div className="guard-rating-compact-hero">
          <TierMedal tier={rating.tier} size="sm" />
          <div className="guard-rating-compact-copy">
            <p className="guard-rating-compact-tier">{rating.tier.name}</p>
            <p className="guard-rating-compact-score">
              <span className="guard-rating-compact-score-value">{formatOverallRating(rating.overallRating)}</span>
              <span className="guard-rating-compact-score-label">overall</span>
            </p>
          </div>
        </div>
        {rating.factors.length > 0 && (
          <div className="guard-factors-grid guard-factors-grid-compact">
            {orderedFactors.slice(0, 3).map((factor) => (
              <FactorCard key={factor.id} factor={factor} onSelect={onFactorSelect} />
            ))}
          </div>
        )}
      </section>
    );
  }

  const heroBlock = (
    <div className={`guard-tier-hero guard-tier-hero-dense ${tierHeroClass(rating.tier)}`}>
      <div className="guard-tier-hero-glow" aria-hidden />
      <TierMedal tier={rating.tier} size="lg" />
      <p className="guard-tier-hero-eyebrow">Current level</p>
      <h2 className="guard-tier-hero-name">{rating.tier.name}</h2>
      <div className="guard-tier-hero-score-row">
        <span className="guard-tier-hero-score-label">Overall rating</span>
        <span className="guard-tier-hero-score-value">{formatOverallRating(rating.overallRating)}</span>
        <Info className="guard-tier-hero-info" aria-label="Overall rating is the sum of your factor points out of 100" />
      </div>
      <TierProgressBar
        overallRating={rating.overallRating}
        tier={rating.tier}
        nextTier={rating.nextTier}
        compact
      />
      <p className="guard-tier-hero-subtitle">
        {clientReviews.count > 0
          ? formatReviewCount(clientReviews.count)
          : performance.jobsSampled > 0
            ? formatShiftSampleCount(performance.jobsSampled)
            : 'Building your performance profile'}
      </p>
    </div>
  );

  const bodyBlock = (
    <div className="guard-rating-body">
      {violationSummary && (
        <ViolationsCard violations={rating.violations} summary={violationSummary} />
      )}

      {orderedFactors.length > 0 && (
        <section className="guard-factors-section">
          <div className="guard-factors-header">
            <h3 className="guard-factors-heading">Your rating factors</h3>
            <p className="guard-factors-subheading">Points earned from recent shift behavior</p>
          </div>
          <div className="guard-factors-grid">
            {orderedFactors.map((factor) => (
              <FactorCard key={factor.id} factor={factor} onSelect={onFactorSelect} />
            ))}
          </div>
        </section>
      )}

      {displayedSkills.length > 0 && (
        <section className="guard-skills-section">
          <div className="guard-factors-header">
            <h3 className="guard-factors-heading">Specialty ratings</h3>
            <p className="guard-factors-subheading">Average scores by job type</p>
          </div>
          <div className="guard-skills-list">
            {displayedSkills.map((skill) => (
              <RatingBarRow
                key={skill.jobType ?? skill.skill}
                label={skill.skill}
                score={skill.rating}
                percent={skill.reviewCount > 0 ? rateToBarPercent(skill.rating) : 0}
                reviewCount={skill.reviewCount}
              />
            ))}
          </div>
        </section>
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
    </div>
  );

  if (pinnedLayout) {
    return (
      <>
        <div className="guard-tiered-screen-pinned">
          <section className={`guard-rating-section guard-rating-section-tiered guard-tier-hero-card ${className}`}>
            {heroBlock}
          </section>
        </div>
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

function rateToBarPercent(score: number): number {
  return Math.round(Math.min(100, Math.max(0, (score / 5) * 100)));
}
