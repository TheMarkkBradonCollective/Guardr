import React from 'react';
import { OverviewSegment } from '../../../lib/overviewVisuals';
import { OverviewSegmentBar } from '../../staff/overview/OverviewCharts';

export type DesktopStatusVariant = 'ok' | 'warn' | 'muted';

export interface DesktopStatusMetric {
  id: string;
  label: string;
  value: string | number;
  tone?: 'default' | 'ok' | 'warn' | 'accent';
  onClick?: () => void;
}

export interface DesktopStatusMeter {
  id: string;
  label: string;
  value: string;
  pct: number;
  sub?: string;
  tone?: 'primary' | 'success' | 'warning' | 'muted';
  onClick?: () => void;
}

export interface DesktopStatusAction {
  id: string;
  label: string;
  onClick: () => void;
  variant?: 'sand' | 'outline' | 'soft';
}

export interface DesktopStatusBreakdownRow {
  id: string;
  label: string;
  value: string | number;
  detail?: string;
  tone?: 'default' | 'warn' | 'ok';
  onClick?: () => void;
}

interface DesktopStatusPanelProps {
  eyebrow: string;
  title: string;
  summary: string;
  variant: DesktopStatusVariant;
  alert?: string;
  metrics?: DesktopStatusMetric[];
  meters?: DesktopStatusMeter[];
  breakdown?: DesktopStatusBreakdownRow[];
  breakdownTitle?: string;
  pipelineSegments?: OverviewSegment[];
  actions?: DesktopStatusAction[];
  className?: string;
}

const METER_TONE_CLASS: Record<NonNullable<DesktopStatusMeter['tone']>, string> = {
  primary: 'adm-status-meter-fill--primary',
  success: 'adm-status-meter-fill--success',
  warning: 'adm-status-meter-fill--warning',
  muted: 'adm-status-meter-fill--muted',
};

const METRIC_TONE_CLASS: Record<NonNullable<DesktopStatusMetric['tone']>, string> = {
  default: '',
  ok: 'adm-status-grid-value--ok',
  warn: 'adm-status-grid-value--warn',
  accent: 'adm-status-grid-value--accent',
};

export function DesktopStatusPanel({
  eyebrow,
  title,
  summary,
  variant,
  alert,
  metrics = [],
  meters = [],
  breakdown = [],
  breakdownTitle = 'Queue breakdown',
  pipelineSegments,
  actions = [],
  className = '',
}: DesktopStatusPanelProps) {
  return (
    <article className={`adm-card adm-card--status adm-card--status-rich ${className} adm-card--status-${variant}`}>
      <div className="adm-status-rich-head">
        <div className="adm-status-head">
          <span className={`adm-status-dot adm-status-dot--${variant}`} aria-hidden />
          <div>
            <p className="adm-card-eyebrow">{eyebrow}</p>
            <h3 className="adm-status-title">{title}</h3>
          </div>
        </div>
        {actions.length > 0 ? (
          <div className="adm-status-actions">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                className={`adm-btn adm-btn--sm adm-btn--${action.variant ?? 'outline'}`}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <p className="adm-status-summary">{summary}</p>
      {alert ? <p className="adm-status-alert">{alert}</p> : null}

      {metrics.length > 0 ? (
        <ul className="adm-status-grid adm-status-grid--rich">
          {metrics.map((metric) => {
            const Tag = metric.onClick ? 'button' : 'li';
            return (
              <Tag
                key={metric.id}
                type={metric.onClick ? 'button' : undefined}
                className={`adm-status-metric${metric.onClick ? ' adm-status-metric--click' : ''}`}
                onClick={metric.onClick}
              >
                <p className={`adm-status-grid-value ${METRIC_TONE_CLASS[metric.tone ?? 'default']}`}>
                  {metric.value}
                </p>
                <p className="adm-status-grid-label">{metric.label}</p>
              </Tag>
            );
          })}
        </ul>
      ) : null}

      {meters.length > 0 ? (
        <div className="adm-status-meters">
          {meters.map((meter) => {
            const Tag = meter.onClick ? 'button' : 'div';
            return (
              <Tag
                key={meter.id}
                type={meter.onClick ? 'button' : undefined}
                className={`adm-status-meter${meter.onClick ? ' adm-status-meter--click' : ''}`}
                onClick={meter.onClick}
              >
                <div className="adm-status-meter-head">
                  <p className="adm-status-meter-label">{meter.label}</p>
                  <p className="adm-status-meter-value">{meter.value}</p>
                </div>
                <div className="adm-status-meter-track">
                  <div
                    className={`adm-status-meter-fill ${METER_TONE_CLASS[meter.tone ?? 'primary']}`}
                    style={{ width: `${Math.max(0, Math.min(100, meter.pct))}%` }}
                  />
                </div>
                {meter.sub ? <p className="adm-status-meter-sub">{meter.sub}</p> : null}
              </Tag>
            );
          })}
        </div>
      ) : null}

      {breakdown.length > 0 ? (
        <div className="adm-status-breakdown">
          <p className="adm-status-breakdown-title">{breakdownTitle}</p>
          <ul className="adm-status-breakdown-list">
            {breakdown.map((row) => {
              const Tag = row.onClick ? 'button' : 'li';
              return (
                <Tag
                  key={row.id}
                  type={row.onClick ? 'button' : undefined}
                  className={`adm-status-breakdown-row${row.onClick ? ' adm-status-breakdown-row--click' : ''}`}
                  onClick={row.onClick}
                >
                  <span className="adm-status-breakdown-label">{row.label}</span>
                  <span className={`adm-status-breakdown-value adm-status-breakdown-value--${row.tone ?? 'default'}`}>
                    {row.value}
                  </span>
                  {row.detail ? <span className="adm-status-breakdown-detail">{row.detail}</span> : null}
                </Tag>
              );
            })}
          </ul>
        </div>
      ) : null}

      {pipelineSegments && pipelineSegments.length > 0 ? (
        <div className="adm-status-pipeline">
          <p className="adm-status-breakdown-title">Pipeline mix</p>
          <OverviewSegmentBar segments={pipelineSegments} />
        </div>
      ) : null}
    </article>
  );
}

function clampPct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

export { clampPct };
