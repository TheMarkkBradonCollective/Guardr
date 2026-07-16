import React, { useMemo } from 'react';
import {
  buildOverviewMetricCells,
  LIVE_JOB_STATUS_LABEL,
  OpsActivityItem,
  OverviewActionItem,
  OverviewLiveJob,
  OverviewNavigationSelection,
  PlatformStats,
  resolveOverviewActionSelection,
  StaffSection,
} from '../../lib/staffOps';
import {
  buildDirectorFinancialCells,
  computeOperationalFinancials,
} from '../../lib/operationalFinancials';
import {
  buildJobPipelineSegments,
  computeWeeklyJobSeries,
} from '../../lib/overviewVisuals';
import {
  filterOverviewActionItems,
  filterOverviewMetrics,
  getStaffOverviewConfig,
} from '../../lib/staffOverviewConfig';
import { PlatformRole, Client, SecurityGuard, SecurityRequest } from '../../types';
import { ArrowRight, CheckCircle2, MapPin } from 'lucide-react';
import { OverviewSegmentBar, OverviewWeekChart } from './overview/OverviewCharts';

interface StaffOverviewDesktopProps {
  stats: PlatformStats;
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  clients: Client[];
  activityFeed: OpsActivityItem[];
  actionItems: OverviewActionItem[];
  liveJobs: OverviewLiveJob[];
  onNavigate: (section: StaffSection, selection?: OverviewNavigationSelection) => void;
  onOpenJob?: (jobId: string) => void;
  staffName: string;
  staffRole: PlatformRole;
}

function formatActivityTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function StaffOverviewDesktop({
  stats,
  requests,
  guards,
  clients,
  activityFeed,
  actionItems,
  liveJobs,
  onNavigate,
  onOpenJob,
  staffName,
  staffRole,
}: StaffOverviewDesktopProps) {
  const config = getStaffOverviewConfig(staffRole);

  const metrics = useMemo(
    () => filterOverviewMetrics(buildOverviewMetricCells(stats, requests), staffRole),
    [stats, requests, staffRole],
  );

  const filteredActions = useMemo(
    () => filterOverviewActionItems(actionItems, staffRole),
    [actionItems, staffRole],
  );

  const financials = useMemo(() => computeOperationalFinancials(requests), [requests]);
  const directorFinancialCells = useMemo(
    () => buildDirectorFinancialCells(financials),
    [financials],
  );
  const weeklySeries = useMemo(() => computeWeeklyJobSeries(requests), [requests]);
  const jobPipelineSegments = useMemo(() => buildJobPipelineSegments(requests), [requests]);

  return (
    <div className="adm-dashboard" data-tour="staff-overview">
      <div className="adm-dashboard-grid">
        <article className="adm-card adm-card--welcome adm-span-8">
          <div>
            <p className="adm-card-eyebrow">Command center</p>
            <h2 className="adm-card-title">Welcome back, {staffName}</h2>
            <p className="adm-card-body">
              {stats.platformHealthy
                ? 'Platform is healthy. Review live jobs and action items below.'
                : `${stats.pendingReviews} item${stats.pendingReviews === 1 ? '' : 's'} need review.`}
            </p>
          </div>
          <div className="adm-welcome-art" aria-hidden>
            <CheckCircle2 className={`w-12 h-12 ${stats.platformHealthy ? 'text-green-600' : 'text-amber-600'}`} />
          </div>
        </article>

        <article className="adm-card adm-span-4">
          <p className="adm-card-heading">Live on site</p>
          {liveJobs.length === 0 ? (
            <p className="adm-card-body">No guards on site right now.</p>
          ) : (
            <ul className="adm-activity-list">
              {liveJobs.slice(0, 4).map((job) => (
                <li key={job.id}>
                  <button
                    type="button"
                    className="adm-activity-row"
                    onClick={() => (onOpenJob ? onOpenJob(job.id) : onNavigate('jobs'))}
                  >
                    <MapPin className="adm-metric-icon w-4 h-4" />
                    <span>
                      <p className="adm-activity-name">{job.title}</p>
                      <p className="adm-activity-meta">
                        {job.guardName} · {LIVE_JOB_STATUS_LABEL[job.status].label}
                      </p>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        {metrics.slice(0, 4).map((metric) => (
          <article key={metric.label} className="adm-card adm-span-3">
            <p className="adm-metric-label">{metric.label}</p>
            <p className="adm-stat-value">{metric.value}</p>
            {metric.sub ? <p className="adm-stat-delta">{metric.sub}</p> : null}
            {metric.navigateTo ? (
              <button
                type="button"
                className="adm-btn adm-btn--soft adm-btn--sm adm-mt-sm"
                onClick={() => onNavigate(metric.navigateTo!)}
              >
                Open
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : null}
          </article>
        ))}

        <article className="adm-card adm-span-6">
          <div className="adm-card-head">
            <p className="adm-card-heading">Needs attention</p>
            <span className="adm-pill adm-pill--warn">{filteredActions.length}</span>
          </div>
          {filteredActions.length === 0 ? (
            <p className="adm-card-body">You&apos;re caught up — {config.emptyAttentionCopy}</p>
          ) : (
            <table className="adm-table">
              <tbody>
                {filteredActions.slice(0, 6).map((item) => (
                  <tr
                    key={item.id}
                    className="adm-table-row--click"
                    onClick={() =>
                      onNavigate(item.section, resolveOverviewActionSelection(item, { requests, guards, clients }))
                    }
                  >
                    <td>
                      <p className="adm-table-primary">{item.title}</p>
                      <p className="adm-table-secondary">{item.description}</p>
                    </td>
                    <td className="adm-stat-value adm-stat-value--sm">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        <article className="adm-card adm-span-6">
          <p className="adm-card-heading">Recent activity</p>
          {activityFeed.length === 0 ? (
            <p className="adm-card-body">Activity will appear here as shifts run.</p>
          ) : (
            <ul className="adm-activity-list">
              {activityFeed.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <span>
                    <p className="adm-activity-name">{item.message}</p>
                    <p className="adm-activity-meta">{formatActivityTime(item.timestamp)}</p>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        {config.showWeeklyInsight ? (
          <article className="adm-card adm-span-6">
            <p className="adm-card-heading">Completed jobs this week</p>
            <OverviewWeekChart series={weeklySeries} />
          </article>
        ) : null}

        {config.showPipelineInsight ? (
          <article className="adm-card adm-span-6">
            <p className="adm-card-heading">Job pipeline</p>
            {jobPipelineSegments.length > 0 ? (
              <OverviewSegmentBar segments={jobPipelineSegments} />
            ) : (
              <p className="adm-card-body">No jobs in the pipeline yet.</p>
            )}
          </article>
        ) : null}

        {config.showDirectorFinancials
          ? directorFinancialCells.slice(0, 4).map((cell) => (
              <article key={cell.label} className="adm-card adm-span-3">
                <p className="adm-metric-label">{cell.label}</p>
                <p className="adm-stat-value">{cell.value}</p>
                {cell.sub ? <p className="adm-stat-delta">{cell.sub}</p> : null}
              </article>
            ))
          : null}
      </div>
    </div>
  );
}
