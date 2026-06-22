import React, { useMemo } from 'react';
import {
  buildOverviewMetricCells,
  LIVE_JOB_STATUS_LABEL,
  OpsActivityItem,
  OverviewActionItem,
  OverviewLiveJob,
  PlatformStats,
  StaffSection,
} from '../../lib/staffOps';
import {
  buildDirectorFinancialCells,
  computeOperationalFinancials,
} from '../../lib/operationalFinancials';
import {
  buildJobPipelineSegments,
  buildOperationsSnapshotCards,
  buildPlatformPulseCards,
  computeWeeklyJobSeries,
} from '../../lib/overviewVisuals';
import { Client, SecurityGuard, SecurityRequest } from '../../types';
import type { ApprovalQueueId } from '../../lib/staffOps';
import {
  AppDashboardHero,
  AppDashboardZone,
  AppItemCard,
  AppItemCardStack,
  AppMetricCell,
  AppMetricStrip,
} from '../ui/app/AppPrimitives';
import { WfBadge } from '../ui/wireframe';
import { StaffSummaryCell } from './StaffSummaryCell';
import {
  OverviewSegmentBar,
  OverviewVisualCardBody,
  OverviewWeekChart,
} from './overview/OverviewCharts';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  LifeBuoy,
  MapPin,
  Shield,
  UserCheck,
} from 'lucide-react';

interface StaffOverviewProps {
  stats: PlatformStats;
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  clients: Client[];
  activityFeed: OpsActivityItem[];
  actionItems: OverviewActionItem[];
  liveJobs: OverviewLiveJob[];
  weeklyTrend: number[];
  onNavigate: (section: StaffSection) => void;
  onNavigateApprovals?: (queue?: ApprovalQueueId) => void;
  onOpenJob?: (jobId: string) => void;
  canUpdateJobs?: boolean;
  staffName: string;
  showDirectorFinancials?: boolean;
}

const ACTION_ICONS: Partial<Record<OverviewActionItem['id'], React.ReactNode>> = {
  'pending-jobs': <Briefcase className="w-4 h-4" />,
  'pending-certs': <ClipboardCheck className="w-4 h-4" />,
  'guard-applications': <UserCheck className="w-4 h-4" />,
  'open-marketplace': <Briefcase className="w-4 h-4" />,
  'active-guard-jobs': <Briefcase className="w-4 h-4" />,
  incidents: <AlertTriangle className="w-4 h-4" />,
  payments: <Shield className="w-4 h-4" />,
  support: <LifeBuoy className="w-4 h-4" />,
  'live-jobs': <MapPin className="w-4 h-4" />,
  'pending-identity': <Shield className="w-4 h-4" />,
  'pending-accounts': <UserCheck className="w-4 h-4" />,
};

function formatOverviewDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatActivityTime(timestamp: string): string {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function StaffOverview({
  stats,
  requests,
  guards,
  clients,
  activityFeed,
  actionItems,
  liveJobs,
  onNavigate,
  onNavigateApprovals,
  onOpenJob,
  canUpdateJobs = false,
  staffName,
  showDirectorFinancials = false,
}: StaffOverviewProps) {
  const metrics = buildOverviewMetricCells(stats, requests);
  const financials = useMemo(() => computeOperationalFinancials(requests), [requests]);
  const directorFinancialCells = useMemo(
    () => buildDirectorFinancialCells(financials),
    [financials]
  );
  const operationsSnapshotCards = useMemo(
    () => buildOperationsSnapshotCards(stats, financials, guards, clients, requests),
    [stats, financials, guards, clients, requests]
  );
  const platformPulseCards = useMemo(
    () => buildPlatformPulseCards(stats, requests, guards, clients, showDirectorFinancials),
    [stats, requests, guards, clients, showDirectorFinancials]
  );
  const weeklySeries = useMemo(() => computeWeeklyJobSeries(requests), [requests]);
  const jobPipelineSegments = useMemo(() => buildJobPipelineSegments(requests), [requests]);

  const healthStatus = (
    <div
      className={`staff-overview-health shrink-0 ${
        stats.platformHealthy ? 'staff-overview-health-ok' : 'staff-overview-health-warn'
      }`}
    >
      <span className="staff-overview-health-dot" aria-hidden />
      <div>
        <p className="text-sm font-semibold leading-tight">
          {stats.platformHealthy ? 'All clear' : 'Needs review'}
        </p>
        <p className="text-xs text-brand-text-muted mt-0.5">{stats.pendingReviews} in queue</p>
      </div>
    </div>
  );

  return (
    <div className="staff-overview animate-fade-in pb-8">
      <AppDashboardHero
        kicker={formatOverviewDate()}
        title={`Hello, ${staffName.split(' ')[0]}`}
        status={healthStatus}
      />

      <AppDashboardZone title="At a glance" className="!mb-4">
        <AppMetricStrip className="app-metric-strip--staff">
          {metrics.map(({ label, value, sub, accent, navigateTo }) => {
            const handleMetricClick = () => {
              if (label === 'To verify' && onNavigateApprovals && stats.pendingApprovals > 0) {
                onNavigateApprovals();
                return;
              }
              if (navigateTo) onNavigate(navigateTo);
            };

            const isClickable =
              (label === 'To verify' && onNavigateApprovals && stats.pendingApprovals > 0) ||
              (navigateTo && navigateTo !== 'approvals');

            if (isClickable) {
              return (
                <AppMetricCell
                  key={label}
                  label={label}
                  value={value}
                  sub={sub}
                  accent={accent}
                  onClick={handleMetricClick}
                />
              );
            }
            return (
              <AppMetricCell key={label} label={label} value={value} sub={sub} accent={accent} />
            );
          })}
        </AppMetricStrip>
      </AppDashboardZone>

      <div className="app-dashboard-split px-0">
        <div className="space-y-6 min-w-0">
          <AppDashboardZone
            title="Needs your attention"
            actionLabel={actionItems.length > 0 ? 'Approvals' : undefined}
            onAction={actionItems.length > 0 ? () => onNavigate('approvals') : undefined}
          >
            {actionItems.length === 0 ? (
              <div className="staff-overview-empty-card">
                <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold">You&apos;re caught up</p>
                  <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">
                    No approvals, incidents, or payouts waiting. Open the map to monitor live jobs.
                  </p>
                </div>
              </div>
            ) : (
              <AppItemCardStack>
                {actionItems.map((item) => (
                  <AppItemCard
                    key={item.id}
                    onClick={() =>
                      item.section === 'approvals' && item.approvalQueue && onNavigateApprovals
                        ? onNavigateApprovals(item.approvalQueue)
                        : onNavigate(item.section)
                    }
                  >
                    <div className="flex items-start gap-3 w-full text-left">
                      <span
                        className={`staff-overview-action-icon ${
                          item.tone === 'urgent' ? 'staff-overview-action-icon-urgent' : ''
                        }`}
                      >
                        {ACTION_ICONS[item.id] ?? <ArrowRight className="w-4 h-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{item.title}</p>
                          <WfBadge tone={item.tone === 'urgent' ? 'warning' : 'default'}>{item.count}</WfBadge>
                        </div>
                        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">{item.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 shrink-0 text-brand-text-muted mt-0.5" />
                    </div>
                  </AppItemCard>
                ))}
              </AppItemCardStack>
            )}
          </AppDashboardZone>

          <AppDashboardZone
            title="Live on site"
            actionLabel={liveJobs.length > 0 ? 'Open map' : undefined}
            onAction={liveJobs.length > 0 ? () => onNavigate('map') : undefined}
          >
            {liveJobs.length === 0 ? (
              <div className="staff-overview-empty-card">
                <MapPin className="w-5 h-5 text-brand-text-muted shrink-0" />
                <div>
                  <p className="text-sm font-semibold">No guards on site</p>
                  <p className="text-xs text-brand-text-muted mt-0.5">
                    Picked-up and in-progress jobs appear here when work is underway.
                  </p>
                </div>
              </div>
            ) : (
              <AppItemCardStack>
                {liveJobs.map((job) => {
                  const statusCfg = LIVE_JOB_STATUS_LABEL[job.status];
                  return (
                    <AppItemCard
                      key={job.id}
                      onClick={() => (onOpenJob ? onOpenJob(job.id) : onNavigate('jobs'))}
                    >
                      <div className="flex items-start justify-between gap-3 w-full text-left">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold truncate">{job.title}</p>
                            <WfBadge tone={job.status === 'in-progress' ? 'success' : 'primary'}>
                              {statusCfg.emoji} {statusCfg.label}
                            </WfBadge>
                          </div>
                          <p className="text-xs text-brand-text-muted mt-1">
                            {job.guardName} · {job.clientName}
                          </p>
                          <p className="text-xs text-brand-text-muted mt-0.5 truncate">{job.site}</p>
                          {canUpdateJobs && onOpenJob && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenJob(job.id);
                              }}
                              className="mt-2 app-button-outline !w-auto !h-8 !px-3 !text-xs"
                            >
                              Edit / update job
                            </button>
                          )}
                        </div>
                        {job.startedAt && (
                          <p className="text-[11px] text-brand-text-muted shrink-0">
                            {formatActivityTime(job.startedAt)}
                          </p>
                        )}
                      </div>
                    </AppItemCard>
                  );
                })}
              </AppItemCardStack>
            )}
          </AppDashboardZone>
        </div>

        <div className="space-y-6 min-w-0">
          <AppDashboardZone
            title="Platform pulse"
            actionLabel={showDirectorFinancials ? 'Analytics' : undefined}
            onAction={showDirectorFinancials ? () => onNavigate('analytics') : undefined}
          >
            <div className="staff-overview-pulse-grid">
              {platformPulseCards.map((card) => (
                <section key={card.id} className="staff-overview-chart-card">
                  <p className="overview-visual-title">{card.title}</p>
                  <OverviewVisualCardBody card={card} />
                </section>
              ))}
            </div>
          </AppDashboardZone>

          {showDirectorFinancials && (
            <>
              <AppDashboardZone title="Company financials" actionLabel="Payments" onAction={() => onNavigate('payments')}>
                <div className="staff-payment-summary-grid">
                  {directorFinancialCells.map(({ label, value, sub, accent }) => (
                    <StaffSummaryCell key={label} label={label} value={value} sub={sub} accent={accent} />
                  ))}
                </div>
              </AppDashboardZone>

              <AppDashboardZone title="Operations snapshot" actionLabel="Payments" onAction={() => onNavigate('payments')}>
                <div className="staff-overview-pulse-grid">
                  {operationsSnapshotCards.map((card) => (
                    <section key={card.id} className="staff-overview-chart-card">
                      <p className="overview-visual-title">{card.title}</p>
                      <OverviewVisualCardBody card={card} />
                    </section>
                  ))}
                </div>
              </AppDashboardZone>
            </>
          )}
        </div>
      </div>

      <AppDashboardZone title="Insights" className="mt-2">
        <div className="staff-overview-insights">
          <section className="staff-overview-chart-card">
            <p className="overview-visual-title">Completed jobs this week</p>
            <OverviewWeekChart series={weeklySeries} />
          </section>

          <section className="staff-overview-chart-card">
            <p className="overview-visual-title">Job pipeline mix</p>
            {jobPipelineSegments.length > 0 ? (
              <div className="mt-3">
                <OverviewSegmentBar segments={jobPipelineSegments} />
              </div>
            ) : (
              <p className="text-sm text-brand-text-muted py-6 text-center">No jobs in the pipeline yet.</p>
            )}
          </section>

          <section className="staff-overview-feed-card">
            <p className="overview-visual-title">Recent activity</p>
            {activityFeed.length === 0 ? (
              <p className="text-sm text-brand-text-muted py-6 text-center">
                Check-ins, patrol reports, and new jobs will show here as they happen.
              </p>
            ) : (
              <ul className="staff-overview-feed-list">
                {activityFeed.slice(0, 12).map((item) => (
                  <li key={item.id} className="staff-overview-feed-item">
                    <span className="staff-overview-feed-dot" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm leading-snug">{item.message}</p>
                      <p className="text-[11px] text-brand-text-muted mt-0.5">{formatActivityTime(item.timestamp)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </AppDashboardZone>
    </div>
  );
}
