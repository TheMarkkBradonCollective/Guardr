import React from 'react';
import { Mail } from 'lucide-react';

export interface StaffDetailMetric {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  /** Span the full metric row (e.g. service areas). */
  wide?: boolean;
}

interface StaffDetailProfileHeaderProps {
  avatar: React.ReactNode;
  name: React.ReactNode;
  email?: string;
  emailPrefix?: string;
  contact?: React.ReactNode;
  metrics?: StaffDetailMetric[];
  badges?: React.ReactNode;
  className?: string;
}

/** Identity + metrics + badges — shared by guard, staff, client, and application detail. */
export function StaffDetailProfileHeader({
  avatar,
  name,
  email,
  emailPrefix,
  contact,
  metrics,
  badges,
  className = '',
}: StaffDetailProfileHeaderProps) {
  const regularCount = metrics?.filter((metric) => !metric.wide).length ?? 0;
  const metricMod =
    regularCount >= 3 ? 'staff-detail-metrics--3' : regularCount === 2 ? 'staff-detail-metrics--2' : '';

  return (
    <div className={`staff-detail-header ${className}`.trim()}>
      <div className="relative shrink-0">{avatar}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {typeof name === 'string' ? <h2 className="font-bold text-lg">{name}</h2> : name}
        </div>
        {email ? (
          <p className="staff-detail-header-email">
            <Mail className="w-4 h-4 shrink-0" aria-hidden />
            <span className="truncate">
              {emailPrefix ? <span className="text-brand-text-muted">{emailPrefix}</span> : null}
              {email}
            </span>
          </p>
        ) : null}
        {contact}
        {metrics && metrics.length > 0 ? (
          <div className={`staff-detail-metrics ${metricMod}`.trim()}>
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className={`staff-detail-metric${metric.wide ? ' staff-detail-metric--wide' : ''}`}
              >
                <p className="wf-metric-label">{metric.label}</p>
                <p className={`wf-metric-value${metric.accent ? ' text-brand-primary' : ''}`}>
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}
        {badges ? <div className="staff-detail-header-badges">{badges}</div> : null}
      </div>
    </div>
  );
}
