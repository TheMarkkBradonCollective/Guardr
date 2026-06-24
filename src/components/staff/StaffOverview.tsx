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
import {
  filterOverviewActionItems,
  filterOverviewMetrics,
  getStaffOverviewConfig,
} from '../../lib/staffOverviewConfig';
import { PlatformRole } from '../../types';
import type { ApprovalQueueId } from '../../lib/staffOps';
import { Client, SecurityGuard, SecurityRequest } from '../../types';
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
  OverviewVisualGrid,
  OverviewWeekChart,
} from './overview/OverviewCharts';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Crown,
  DollarSign,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  MessagesSquare,
  Settings,
  Shield,
  UserCheck,
  Users,
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
  staffRole: PlatformRole;
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
  'pending-accounts': <UserCheck className="w-4 h-4" />,
  'jobs-missing-coords': <MapPin className="w-4 h-4" />,
};

const QUICK_LINK_META: Record<
  StaffSection,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  overview: { label: 'Overview', icon: LayoutDashboard },
  map: { label: 'Map', icon: MapPin },
  approvals: { label: 'Approvals', icon: ClipboardCheck },
  jobs: { label: 'Jobs', icon: Briefcase },
  guards: { label: 'Guards', icon: Shield },
  team: { label: 'Staff', icon: Users },
  crews: { label: 'Crews', icon: Users },
  clients: { label: 'Clients', icon: Building2 },
  incidents: { label: 'Incidents', icon: AlertTriangle },
  messages: { label: 'Messages', icon: MessagesSquare },
  support: { label: 'Messages', icon: MessagesSquare },
  'team-chat': { label: 'Messages', icon: MessagesSquare },
  'job-chats': { label: 'Messages', icon: MessagesSquare },
  payments: { label: 'Payments', icon: DollarSign },
  disputes: { label: 'Disputes', icon: AlertTriangle },
  analytics: { label: 'Analytics', icon: BarChart3 },
  settings: { label: 'Settings', icon: Settings },
  guide: { label: 'General guide', icon: LayoutDashboard },
  'dev-updates': { label: 'Dev notes', icon: LayoutDashboard },
  profile: { label: 'Profile', icon: UserCheck },
  preferences: { label: 'Preferences', icon: Settings },
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

function RoleBadge({ role }: { role: PlatformRole }) {
  const config = getStaffOverviewConfig(role);
  const Icon =
    role === 'owner' ? Crown : role === 'director' ? Shield : role === 'administrator' ? Briefcase : UserCheck;

  return (
    <span className={`staff-overview-role-badge staff-overview-role-badge--${role}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
      {config.roleLabel}
    </span>
  );
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
  staffRole,
}: StaffOverviewProps) {
  const config = getStaffOverviewConfig(staffRole);

  const metrics = useMemo(
    () => filterOverviewMetrics(buildOverviewMetricCells(stats, requests), staffRole),
    [stats, requests, staffRole]
  );

  const filteredActions = useMemo(
    () => filterOverviewActionItems(actionItems, staffRole),
    [actionItems, staffRole]
  );

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
    () =>
      buildPlatformPulseCards(stats, requests, guards, clients, config.pulseFullDetail),
    [stats, requests, guards, clients, config.pulseFullDetail]
  );
  const weeklySeries = useMemo(() => computeWeeklyJobSeries(requests), [requests]);
  const jobPipelineSegments = useMemo(() => buildJobPipelineSegments(requests), [requests]);

  const insightCount =
    Number(config.showWeeklyInsight) + Number(config.showPipelineInsight) + Number(config.showActivityFeed);

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

  const renderMetricCell = ({ label, value, sub, accent, navigateTo }: (typeof metrics)[number]) => {
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
    return <AppMetricCell key={label} label={label} value={value} sub={sub} accent={accent} />;
  };

  const attentionZone = (
    <AppDashboardZone
      title="Needs your attention"
      actionLabel={filteredActions.length > 0 ? 'Approvals' : undefined}
      onAction={filteredActions.length > 0 ? () => onNavigate('approvals') : undefined}
    >
      {filteredActions.length === 0 ? (
        <div className="staff-overview-empty-card">
          <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold">You&apos;re caught up</p>
            <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">{config.emptyAttentionCopy}</p>
          </div>
        </div>
      ) : (
        <AppItemCardStack>
          {filteredActions.map((item) => (
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
  );

  const liveJobsZone = (
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
                        className="mt-2 app-button-outline app-btn-sm"
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
  );

  const pulseZone = config.showPlatformPulse ? (
    <AppDashboardZone
      title="Platform pulse"
      actionLabel={config.showDirectorFinancials ? 'Analytics' : undefined}
      onAction={config.showDirectorFinancials ? () => onNavigate('analytics') : undefined}
    >
      <OverviewVisualGrid cards={platformPulseCards} columns={config.layout === 'compact' ? 2 : 3} />
    </AppDashboardZone>
  ) : null;

  const financialZones =
    config.showDirectorFinancials ? (
      <>
        <AppDashboardZone title="Company financials" actionLabel="Payments" onAction={() => onNavigate('payments')}>
          <div className="staff-payment-summary-grid">
            {directorFinancialCells.map(({ label, value, sub, accent }) => (
              <StaffSummaryCell key={label} label={label} value={value} sub={sub} accent={accent} />
            ))}
          </div>
        </AppDashboardZone>

        {config.showOperationsSnapshot && (
          <AppDashboardZone title="Operations snapshot" actionLabel="Payments" onAction={() => onNavigate('payments')}>
            <OverviewVisualGrid cards={operationsSnapshotCards} columns={3} />
          </AppDashboardZone>
        )}
      </>
    ) : null;

  const insightsZone =
    insightCount > 0 ? (
      <AppDashboardZone title="Insights" className="mt-2">
        <div
          className={`staff-overview-insights staff-overview-insights--${config.layout}${
            insightCount === 2 ? ' staff-overview-insights--2' : ''
          }`}
        >
          {config.showWeeklyInsight && (
            <section className="staff-overview-chart-card">
              <p className="overview-visual-title">Completed jobs this week</p>
              <OverviewWeekChart series={weeklySeries} />
            </section>
          )}

          {config.showPipelineInsight && (
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
          )}

          {config.showActivityFeed && (
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
          )}
        </div>
      </AppDashboardZone>
    ) : null;

  return (
    <div
      className={`staff-overview staff-overview--${staffRole} staff-overview--${config.layout} animate-fade-in pb-8`}
    >
      <AppDashboardHero
        kicker={`${config.workspaceKicker} · ${formatOverviewDate()}`}
        title={`Hello, ${staffName.split(' ')[0]}`}
        status={healthStatus}
      />

      <div className="staff-overview-focus-band">
        <RoleBadge role={staffRole} />
        <p className="staff-overview-focus-line">{config.focusLine}</p>
      </div>

      <nav className="staff-overview-quick-links" aria-label="Quick navigation">
        {config.quickLinkSections.map((section) => {
          const meta = QUICK_LINK_META[section];
          const Icon = meta.icon;
          return (
            <button
              key={section}
              type="button"
              className="staff-overview-quick-link"
              onClick={() => onNavigate(section)}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </nav>

      <AppDashboardZone title="At a glance" className="!mb-4">
        <AppMetricStrip className={`app-metric-strip--staff app-metric-strip--count-${metrics.length}`}>
          {metrics.map(renderMetricCell)}
        </AppMetricStrip>
      </AppDashboardZone>

      {config.layout === 'compact' ? (
        <div className="staff-overview-stack space-y-6">
          {attentionZone}
          {liveJobsZone}
          {pulseZone}
          {insightsZone}
        </div>
      ) : (
        <>
          <div className="app-dashboard-split px-0">
            <div className="space-y-6 min-w-0">
              {attentionZone}
              {liveJobsZone}
            </div>
            <div className="space-y-6 min-w-0">
              {pulseZone}
              {financialZones}
            </div>
          </div>
          {insightsZone}
        </>
      )}
    </div>
  );
}
