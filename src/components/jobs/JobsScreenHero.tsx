import React, { useMemo } from 'react';
import { JobsSegmentProgressBar, type JobsPieSegment } from './JobsShiftPieChart';

export const JOBS_PIE_COLORS = {
  available: '#6ee7a8',
  open: '#6ee7a8',
  scheduled: '#7ec8ff',
  completed: '#f5e6a8',
  missed: '#ffb38a',
} as const;

/** Phone jobs charts stay inside the black-and-white identity. */
export const MOBILE_JOBS_PIE_COLORS = {
  available: 'var(--sf-ink)',
  open: 'var(--sf-ink)',
  scheduled: 'var(--sf-ink-secondary)',
  completed: 'var(--sf-ink-tertiary)',
  missed: 'var(--sf-line-strong)',
} as const;

export function jobsPieColorsForSurface(isMobile: boolean) {
  return isMobile ? MOBILE_JOBS_PIE_COLORS : JOBS_PIE_COLORS;
}

export const GUARD_BRAND_HERO_CLASS = 'guard-tier-hero-brand';

interface JobsScreenHeroProps<T extends string> {
  eyebrow: string;
  title: string;
  subtitle: string;
  segments: JobsPieSegment[];
  activeId: T;
  onSegmentSelect?: (id: T) => void;
  totalLabel?: string;
}

export function JobsScreenHero<T extends string>({
  eyebrow,
  title,
  subtitle,
  segments,
  activeId,
  onSegmentSelect,
  totalLabel = 'shifts',
}: JobsScreenHeroProps<T>) {
  const total = useMemo(
    () => segments.reduce((sum, segment) => sum + segment.value, 0),
    [segments]
  );

  return (
    <section className="guard-rating-section guard-rating-section-tiered guard-tier-hero-card">
      <div className={`guard-tier-hero guard-jobs-tier-hero guard-tier-hero-dense ${GUARD_BRAND_HERO_CLASS}`}>
        <div className="guard-tier-hero-glow" aria-hidden />
        <div className="guard-jobs-hero-stack">
          <p className="guard-tier-hero-eyebrow">{eyebrow}</p>
          <h2 className="guard-tier-hero-name guard-jobs-hero-name">{title}</h2>
          <div className="guard-tier-hero-score-row">
            <span className="guard-tier-hero-score-label">Total {totalLabel}</span>
            <span className="guard-tier-hero-score-value">{total}</span>
          </div>
          <JobsSegmentProgressBar
            segments={segments}
            activeId={activeId}
            totalLabel={totalLabel}
          />
          <div className="guard-jobs-hero-legend" role="group" aria-label="Job breakdown">
            {segments.map((segment) => {
              const isActive = activeId === segment.id;
              const legendContent = (
                <>
                  <span
                    className="guard-jobs-hero-legend-dot"
                    style={{ backgroundColor: segment.color }}
                    aria-hidden
                  />
                  <span className="guard-jobs-hero-legend-label">{segment.label}</span>
                  <span className="guard-jobs-hero-legend-value">{segment.value}</span>
                </>
              );

              if (!onSegmentSelect) {
                return (
                  <div
                    key={segment.id}
                    className={`guard-jobs-hero-legend-item ${
                      isActive ? 'guard-jobs-hero-legend-item-active' : ''
                    }`}
                  >
                    {legendContent}
                  </div>
                );
              }

              return (
                <button
                  key={segment.id}
                  type="button"
                  className={`guard-jobs-hero-legend-item guard-jobs-hero-legend-button ${
                    isActive ? 'guard-jobs-hero-legend-item-active' : ''
                  }`}
                  onClick={() => onSegmentSelect(segment.id as T)}
                  aria-pressed={isActive}
                >
                  {legendContent}
                </button>
              );
            })}
          </div>
        </div>
        <p className="guard-tier-hero-subtitle guard-jobs-hero-subtitle">{subtitle}</p>
      </div>
    </section>
  );
}
