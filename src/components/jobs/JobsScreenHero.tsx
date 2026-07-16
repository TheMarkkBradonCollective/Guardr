import React from 'react';
import { JobsShiftPieChart, type JobsPieSegment } from './JobsShiftPieChart';

export const JOBS_PIE_COLORS = {
  available: '#6ee7a8',
  open: '#6ee7a8',
  scheduled: '#7ec8ff',
  completed: '#f5e6a8',
  missed: '#ffb38a',
} as const;

export function jobsHeroTierClass(scheduledCount: number, openCount: number): string {
  if (scheduledCount >= 3) return 'guard-tier-hero-professional';
  if (scheduledCount > 0 || openCount >= 2) return 'guard-tier-hero-rising';
  if (openCount > 0) return 'guard-tier-hero-rising';
  return 'guard-tier-hero-starting';
}

interface JobsScreenHeroProps<T extends string> {
  eyebrow: string;
  title: string;
  subtitle: string;
  segments: JobsPieSegment[];
  activeId: T;
  heroClass: string;
  onSegmentSelect?: (id: T) => void;
  totalLabel?: string;
}

export function JobsScreenHero<T extends string>({
  eyebrow,
  title,
  subtitle,
  segments,
  activeId,
  heroClass,
  onSegmentSelect,
  totalLabel = 'shifts',
}: JobsScreenHeroProps<T>) {
  return (
    <section className="guard-rating-section guard-rating-section-tiered guard-tier-hero-card">
      <div className={`guard-tier-hero guard-jobs-tier-hero guard-tier-hero-dense ${heroClass}`}>
        <div className="guard-tier-hero-glow" aria-hidden />
        <div className="guard-jobs-hero-main">
          <JobsShiftPieChart segments={segments} activeId={activeId} totalLabel={totalLabel} />
          <div className="guard-jobs-hero-copy">
            <p className="guard-tier-hero-eyebrow">{eyebrow}</p>
            <h2 className="guard-tier-hero-name guard-jobs-hero-name">{title}</h2>
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
        </div>
        <p className="guard-tier-hero-subtitle guard-jobs-hero-subtitle">{subtitle}</p>
      </div>
    </section>
  );
}
