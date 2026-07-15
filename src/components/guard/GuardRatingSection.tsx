import React, { useMemo } from 'react';
import type { SecurityGuard, SecurityRequest } from '../../types';
import {
  buildPerformanceBreakdown,
  computeClientReviewStats,
  formatPerformanceScore,
  formatReviewCount,
  formatShiftSampleCount,
  type GuardPerformanceMetrics,
  type GuardSkillRating,
} from '../../lib/guardPerformance';
import { Star } from 'lucide-react';

export interface GuardRatingSectionProps {
  guard: SecurityGuard;
  requests: SecurityRequest[];
  performance: GuardPerformanceMetrics;
  skillRatings: GuardSkillRating[];
  /** full = guard profile; compact = live shift card */
  variant?: 'full' | 'compact';
  className?: string;
}

function displayOverallScore(performance: GuardPerformanceMetrics, guard: SecurityGuard): number {
  if (performance.overallScore > 0) return performance.overallScore;
  if (guard.rating > 0) return guard.rating;
  return 0;
}

function StarRow({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const starClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  const filled = Math.round(Math.min(5, Math.max(0, score)));
  return (
    <div className="guard-rating-stars flex items-center" aria-hidden>
      {[1, 2, 3, 4, 5].map((step) => (
        <Star
          key={step}
          className={`${starClass} ${
            step <= filled ? 'fill-brand-primary text-brand-primary' : 'text-brand-border'
          }`}
        />
      ))}
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

  const overall = displayOverallScore(performance, guard);
  const breakdown = buildPerformanceBreakdown(performance, clientReviews);
  const hasSkills = skillRatings.length > 0;
  const hasBreakdown = breakdown.length > 0;
  const isCompact = variant === 'compact';

  if (overall <= 0 && !hasBreakdown && !hasSkills) {
    return (
      <section className={`guard-rating-section guard-rating-section-empty ${className}`}>
        <p className="text-sm text-brand-text-muted text-center py-3">
          Ratings will appear after completed shifts and client reviews.
        </p>
      </section>
    );
  }

  return (
    <section className={`guard-rating-section ${isCompact ? 'guard-rating-section-compact' : ''} ${className}`}>
      <div className="guard-rating-hero">
        <div className="guard-rating-hero-score">
          <span className="guard-rating-hero-number">{overall > 0 ? formatPerformanceScore(overall) : '—'}</span>
          {overall > 0 && <StarRow score={overall} size={isCompact ? 'sm' : 'md'} />}
        </div>
        <div className="guard-rating-hero-meta">
          <p className="guard-rating-hero-title">Security rating</p>
          {clientReviews.count > 0 ? (
            <p className="guard-rating-hero-subtitle">{formatReviewCount(clientReviews.count)}</p>
          ) : performance.jobsSampled > 0 ? (
            <p className="guard-rating-hero-subtitle">{formatShiftSampleCount(performance.jobsSampled)}</p>
          ) : guard.rating > 0 ? (
            <p className="guard-rating-hero-subtitle">Overall client rating {guard.rating.toFixed(1)}/5</p>
          ) : null}
        </div>
      </div>

      {hasBreakdown && (
        <div className="guard-rating-breakdown">
          {!isCompact && <p className="guard-rating-group-label">Performance</p>}
          {breakdown.map((row) => (
            <RatingBarRow
              key={row.id}
              label={row.label}
              score={row.score}
              percent={row.percent}
              compact={isCompact}
            />
          ))}
        </div>
      )}

      {hasSkills && (
        <div className="guard-rating-breakdown">
          {!isCompact && <p className="guard-rating-group-label">Skills</p>}
          {skillRatings.slice(0, isCompact ? 3 : 6).map((skill) => (
            <RatingBarRow
              key={skill.skill}
              label={skill.skill}
              score={skill.rating}
              percent={rateToBarPercent(skill.rating)}
              reviewCount={skill.reviewCount}
              compact={isCompact}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function rateToBarPercent(score: number): number {
  return Math.round(Math.min(100, Math.max(0, (score / 5) * 100)));
}
