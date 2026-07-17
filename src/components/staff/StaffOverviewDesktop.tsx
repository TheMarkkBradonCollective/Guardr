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
  buildOperationsSnapshotCards,
  buildPlatformHealthPieSegments,
  buildPlatformPulseCards,
  buildPeopleSegments,
  buildQueuePieSegments,
  computeWeeklyJobSeries,
} from '../../lib/overviewVisuals';
import {
  filterOverviewActionItems,
  filterOverviewMetrics,
  getStaffOverviewConfig,
} from '../../lib/staffOverviewConfig';
import { buildPerformanceTierPercentBars, buildStaffGuardStatRows } from '../../lib/staffStats';
import { PlatformRole, Client, SecurityGuard, SecurityRequest } from '../../types';
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
  FileText,
  LayoutDashboard,
  LifeBuoy,
  KeyRound,
  MapPin,
  MessagesSquare,
  Settings,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react';
import { StaffSummaryCell } from './StaffSummaryCell';
import {
  OverviewDonutGrid,
  OverviewLineChart,
  OverviewPieChart,
  OverviewSegmentBar,
  OverviewVisualCardBody,
  OverviewVisualGrid,
  OverviewWeekChart,
} from './overview/OverviewCharts';
import { PerformanceTierProgressBars } from './overview/PerformanceTierProgressBars';
import { clampPct, DesktopStatusPanel } from '../ui/desktop/DesktopStatusPanel';

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
  canUpdateJobs?: boolean;
  staffName: string;
  staffRole: PlatformRole;
}

const ACTION_ICONS: Partial<Record<OverviewActionItem['id'], React.ReactNode>> = {
  'pending-jobs': <Briefcase className="w-4 h-4" />,
  'pending-schedule-changes': <Briefcase className="w-4 h-4" />,
  'pending-certs': <ClipboardCheck className="w-4 h-4" />,
  'account-applications': <UserCheck className="w-4 h-4" />,
  'open-marketplace': <Briefcase className="w-4 h-4" />,
  'active-guard-jobs': <Briefcase className="w-4 h-4" />,
  incidents: <AlertTriangle className="w-4 h-4" />,
  payments: <Shield className="w-4 h-4" />,
  support: <LifeBuoy className="w-4 h-4" />,
  'live-jobs': <MapPin className="w-4 h-4" />,
  'pending-staff-accounts': <Shield className="w-4 h-4" />,
  'jobs-missing-coords': <MapPin className="w-4 h-4" />,
};

const QUICK_LINK_META: Record<
  StaffSection,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  overview: { label: 'Overview', icon: LayoutDashboard },
  map: { label: 'Map', icon: MapPin },
  applications: { label: 'Applications', icon: UserCheck },
  credentials: { label: 'Credentials', icon: ClipboardCheck },
  jobs: { label: 'Jobs', icon: Briefcase },
  guards: { label: 'Guards', icon: Shield },
  team: { label: 'Staff', icon: Users },
  clients: { label: 'Clients', icon: Building2 },
  crews: { label: 'Crews', icon: Users },
  incidents: { label: 'Incidents', icon: AlertTriangle },
  violations: { label: 'Violations', icon: AlertTriangle },
  stats: { label: 'Stats', icon: BarChart3 },
  messages: { label: 'Messages', icon: MessagesSquare },
  support: { label: 'Messages', icon: MessagesSquare },
  'team-chat': { label: 'Messages', icon: MessagesSquare },
  'job-chats': { label: 'Messages', icon: MessagesSquare },
  payments: { label: 'Payments', icon: DollarSign },
  'payment-settings': { label: 'Payment settings', icon: DollarSign },
  agreements: { label: 'Agreements', icon: FileText },
  'audit-log': { label: 'Audit log', icon: FileText },
  disputes: { label: 'Disputes', icon: AlertTriangle },
  analytics: { label: 'Analytics', icon: BarChart3 },
  settings: { label: 'Public Information', icon: Settings },
  permissions: { label: 'Permissions', icon: KeyRound },
  integrations: { label: 'Integrations', icon: Settings },
  cities: { label: 'Operations', icon: MapPin },
  guide: { label: 'Guide', icon: LayoutDashboard },
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

function RoleBadge({ role }: { role: PlatformRole }) {
  const config = getStaffOverviewConfig(role);
  const Icon =
    role === 'owner' ? Crown : role === 'director' ? Shield : role === 'administrator' ? Briefcase : UserCheck;

  return (
    <span className={`adm-role-badge adm-role-badge--${role}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
      {config.roleLabel}
    </span>
  );
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
  canUpdateJobs = false,
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
  const operationsSnapshotCards = useMemo(
    () => buildOperationsSnapshotCards(stats, financials, guards, clients, requests),
    [stats, financials, guards, clients, requests],
  );
  const platformPulseCards = useMemo(
    () => buildPlatformPulseCards(stats, requests, guards, clients, config.pulseFullDetail),
    [stats, requests, guards, clients, config.pulseFullDetail],
  );
  const weeklySeries = useMemo(() => computeWeeklyJobSeries(requests), [requests]);
  const jobPipelineSegments = useMemo(() => buildJobPipelineSegments(requests), [requests]);
  const queuePieSegments = useMemo(() => buildQueuePieSegments(stats), [stats]);
  const healthPieSegments = useMemo(() => buildPlatformHealthPieSegments(stats), [stats]);
  const peopleSegments = useMemo(() => buildPeopleSegments(guards, clients), [guards, clients]);
  const guardStatRows = useMemo(() => buildStaffGuardStatRows(guards, requests), [guards, requests]);
  const tierPercentBars = useMemo(() => buildPerformanceTierPercentBars(guardStatRows), [guardStatRows]);

  const queueBreakdown = [
    {
      id: 'jobs',
      label: 'Job offers',
      value: stats.pendingJobApprovals,
      detail: 'Awaiting approval',
      tone: stats.pendingJobApprovals > 0 ? ('warn' as const) : ('ok' as const),
      onClick: () => onNavigate('applications'),
    },
    {
      id: 'schedule',
      label: 'Schedule changes',
      value: stats.pendingScheduleChanges,
      detail: 'Client or staff edits',
      tone: stats.pendingScheduleChanges > 0 ? ('warn' as const) : ('ok' as const),
      onClick: () => onNavigate('applications'),
    },
    {
      id: 'certs',
      label: 'Credentials',
      value: stats.pendingCertApprovals,
      detail: 'Guard uploads',
      tone: stats.pendingCertApprovals > 0 ? ('warn' as const) : ('ok' as const),
      onClick: () => onNavigate('credentials'),
    },
    {
      id: 'accounts',
      label: 'Account applications',
      value: stats.pendingAccountApplications,
      detail: `${stats.pendingClientAccounts} client · guard signups`,
      tone: stats.pendingAccountApplications > 0 ? ('warn' as const) : ('ok' as const),
      onClick: () => onNavigate('applications'),
    },
    {
      id: 'payments',
      label: 'Payments',
      value: stats.paymentsNeedingAction,
      detail: 'Deposits or payouts',
      tone: stats.paymentsNeedingAction > 0 ? ('warn' as const) : ('ok' as const),
      onClick: () => onNavigate('payments'),
    },
  ];

  return (
    <div className="adm-dashboard" data-tour="staff-overview">
      <div className="adm-dashboard-grid">
        {/* Welcome */}
        <article className="adm-card adm-card--welcome adm-span-4">
          <div>
            <p className="adm-card-eyebrow">
              {config.workspaceKicker} · {formatOverviewDate()}
            </p>
            <h2 className="adm-card-title">Hello, {staffName.split(' ')[0]}</h2>
            <div className="adm-overview-meta">
              <RoleBadge role={staffRole} />
              <p className="adm-overview-focus">{config.focusLine}</p>
            </div>
          </div>
          <div className="adm-welcome-art" aria-hidden>
            <Shield className="w-12 h-12 opacity-30" />
          </div>
        </article>

        {/* Whole platform status */}
        <DesktopStatusPanel
          className="adm-span-8"
          eyebrow="Platform status"
          title={stats.platformHealthy ? 'All clear' : 'Needs review'}
          summary={
            stats.platformHealthy
              ? 'Operations are running smoothly across the platform.'
              : `${stats.pendingReviews} item${stats.pendingReviews === 1 ? '' : 's'} waiting in the review queue.`
          }
          variant={stats.platformHealthy ? 'ok' : 'warn'}
          alert={
            filteredActions.length > 0
              ? `${filteredActions.length} action item${filteredActions.length === 1 ? '' : 's'} need follow-up today`
              : undefined
          }
          metrics={[
            {
              id: 'on-site',
              label: 'On site now',
              value: stats.onDutyGuards,
              tone: stats.onDutyGuards > 0 ? 'ok' : 'default',
              onClick: () => onNavigate('map'),
            },
            {
              id: 'live-jobs',
              label: 'Live jobs',
              value: liveJobs.length,
              tone: liveJobs.length > 0 ? 'ok' : 'default',
              onClick: () => onNavigate('jobs'),
            },
            {
              id: 'active-jobs',
              label: 'Active jobs',
              value: stats.activeJobs,
              onClick: () => onNavigate('jobs'),
            },
            {
              id: 'queue',
              label: 'Review queue',
              value: stats.pendingReviews,
              tone: stats.pendingReviews > 0 ? 'warn' : 'ok',
              onClick: () => onNavigate('applications'),
            },
            {
              id: 'incidents',
              label: 'Open incidents',
              value: stats.activeIncidents,
              tone: stats.activeIncidents > 0 ? 'warn' : 'ok',
              onClick: () => onNavigate('incidents'),
            },
            {
              id: 'clients',
              label: 'Active clients',
              value: stats.activeClients,
              onClick: () => onNavigate('clients'),
            },
            {
              id: 'guards',
              label: 'Active guards',
              value: stats.activeGuards,
              onClick: () => onNavigate('guards'),
            },
            {
              id: 'completed',
              label: 'Completed jobs',
              value: stats.completedJobs,
              onClick: () => onNavigate('analytics'),
            },
          ]}
          meters={[
            {
              id: 'approvals',
              label: 'Approvals backlog',
              value: String(stats.pendingApprovals),
              pct: clampPct(stats.pendingApprovals, 20),
              sub: stats.pendingApprovals === 0 ? 'Queue clear' : 'Items waiting for review',
              tone: stats.pendingApprovals > 5 ? 'warning' : stats.pendingApprovals > 0 ? 'primary' : 'success',
              onClick: () => onNavigate('applications'),
            },
            {
              id: 'coverage',
              label: 'Field coverage',
              value: `${stats.onDutyGuards}/${Math.max(stats.activeGuards, 1)}`,
              pct: clampPct(stats.onDutyGuards, Math.max(stats.activeGuards, 1)),
              sub: `${stats.assignedGuardsOnJobs} assigned to active jobs`,
              tone: 'primary',
              onClick: () => onNavigate('map'),
            },
            {
              id: 'payments',
              label: 'Payments needing action',
              value: String(stats.paymentsNeedingAction),
              pct: clampPct(stats.paymentsNeedingAction, 15),
              sub: stats.paymentsNeedingAction > 0 ? 'Client, guard, or Stripe follow-up' : 'All payments current',
              tone: stats.paymentsNeedingAction > 0 ? 'warning' : 'success',
              onClick: () => onNavigate('payments'),
            },
          ]}
          breakdown={queueBreakdown}
          pipelineSegments={jobPipelineSegments}
          queuePieSegments={queuePieSegments}
          actions={[
            { id: 'map', label: 'Open map', onClick: () => onNavigate('map'), variant: 'sand' },
            { id: 'queue', label: 'Review queue', onClick: () => onNavigate('applications'), variant: 'outline' },
            { id: 'stats', label: 'Stats', onClick: () => onNavigate('stats'), variant: 'soft' },
          ]}
        />

        {/* Quick links */}
        <nav className="adm-card adm-span-12 adm-quick-links" aria-label="Quick navigation">
          {config.quickLinkSections.map((section) => {
            const meta = QUICK_LINK_META[section];
            const Icon = meta.icon;
            return (
              <button key={section} type="button" className="adm-quick-link" onClick={() => onNavigate(section)}>
                <Icon className="w-4 h-4 shrink-0" aria-hidden />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Charts dashboard */}
        <section className="adm-span-12 adm-charts-section">
          <p className="adm-section-eyebrow">Charts & graphs</p>
          <div className="adm-dashboard-grid adm-charts-grid">
            <article className="adm-card adm-span-3">
              <p className="adm-card-heading">Job pipeline pie</p>
              <OverviewPieChart
                segments={jobPipelineSegments}
                centerLabel={String(jobPipelineSegments.reduce((sum, s) => sum + s.value, 0))}
                centerSub="jobs"
              />
            </article>

            <article className="adm-card adm-span-3">
              <p className="adm-card-heading">Review queue pie</p>
              <OverviewPieChart
                segments={queuePieSegments}
                centerLabel={String(stats.pendingReviews)}
                centerSub="in queue"
              />
            </article>

            <article className="adm-card adm-span-3">
              <p className="adm-card-heading">Platform health</p>
              <OverviewPieChart
                segments={healthPieSegments}
                centerLabel={stats.platformHealthy ? 'OK' : 'Review'}
                centerSub="status"
                size="sm"
              />
            </article>

            <article className="adm-card adm-span-3">
              <p className="adm-card-heading">People mix</p>
              <OverviewPieChart segments={peopleSegments} centerLabel={String(clients.length + guards.length)} centerSub="accounts" size="sm" />
            </article>

            <article className="adm-card adm-span-6">
              <p className="adm-card-heading">Completed jobs trend</p>
              <OverviewLineChart series={weeklySeries} />
            </article>

            <article className="adm-card adm-span-6">
              <p className="adm-card-heading">Weekly bar chart</p>
              <OverviewWeekChart series={weeklySeries} />
            </article>

            <article className="adm-card adm-span-4">
              <p className="adm-card-heading">Pipeline bars</p>
              {jobPipelineSegments.length > 0 ? (
                <OverviewSegmentBar segments={jobPipelineSegments} />
              ) : (
                <p className="adm-card-body">No jobs in the pipeline yet.</p>
              )}
            </article>

            <article className="adm-card adm-span-4">
              <p className="adm-card-heading">Guard performance levels</p>
              <p className="adm-card-body adm-card-body--tight">
                Share of field guards at each tier — Starting, Rising, Professional, and Elite.
              </p>
              <PerformanceTierProgressBars
                bars={tierPercentBars}
                totalGuards={guardStatRows.length}
                showPie
              />
            </article>

            <article className="adm-card adm-span-4">
              <p className="adm-card-heading">Field & queue gauges</p>
              <OverviewDonutGrid
                items={[
                  {
                    id: 'coverage',
                    label: 'Field coverage',
                    value: `${stats.onDutyGuards}`,
                    pct: clampPct(stats.onDutyGuards, Math.max(stats.activeGuards, 1)),
                    tone: 'primary',
                  },
                  {
                    id: 'approvals',
                    label: 'Approvals',
                    value: String(stats.pendingApprovals),
                    pct: clampPct(stats.pendingApprovals, 20),
                    tone: stats.pendingApprovals > 5 ? 'warning' : 'success',
                  },
                  {
                    id: 'payments',
                    label: 'Payments',
                    value: String(stats.paymentsNeedingAction),
                    pct: clampPct(stats.paymentsNeedingAction, 15),
                    tone: stats.paymentsNeedingAction > 0 ? 'warning' : 'success',
                  },
                  {
                    id: 'incidents',
                    label: 'Incidents',
                    value: String(stats.activeIncidents),
                    pct: clampPct(stats.activeIncidents, 10),
                    tone: stats.activeIncidents > 0 ? 'warning' : 'success',
                  },
                  {
                    id: 'live',
                    label: 'Live jobs',
                    value: String(liveJobs.length),
                    pct: clampPct(liveJobs.length, Math.max(stats.activeJobs, 1)),
                    tone: 'info',
                  },
                  {
                    id: 'completed',
                    label: 'Completed',
                    value: String(stats.completedJobs),
                    pct: clampPct(stats.completedJobs, Math.max(requests.length, 1)),
                    tone: 'muted',
                  },
                ]}
              />
            </article>
          </div>
        </section>

        {/* All metrics */}
        <section className="adm-span-12">
          <p className="adm-section-eyebrow">At a glance</p>
          <div className="adm-dashboard-grid adm-dashboard-grid--metrics">
            {metrics.map((metric) => (
              <article key={metric.label} className="adm-card adm-card--metric">
                <p className="adm-metric-label">{metric.label}</p>
                <p className={`adm-stat-value ${metric.accent ? 'adm-stat-value--accent' : ''}`}>{metric.value}</p>
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
          </div>
        </section>

        {/* Needs attention */}
        <article className="adm-card adm-span-6">
          <div className="adm-card-head">
            <p className="adm-card-heading">Needs your attention</p>
            <span className="adm-pill adm-pill--warn">{filteredActions.length}</span>
          </div>
          {filteredActions.length === 0 ? (
            <div className="adm-empty adm-empty--compact">
              <CheckCircle2 className="w-5 h-5" />
              <p>You&apos;re caught up — {config.emptyAttentionCopy}</p>
            </div>
          ) : (
            <table className="adm-table">
              <tbody>
                {filteredActions.slice(0, 8).map((item) => (
                  <tr
                    key={item.id}
                    className="adm-table-row--click"
                    onClick={() =>
                      onNavigate(item.section, resolveOverviewActionSelection(item, { requests, guards, clients }))
                    }
                  >
                    <td>
                      <div className="adm-table-with-icon">
                        <span className={`adm-action-icon ${item.tone === 'urgent' ? 'adm-action-icon--urgent' : ''}`}>
                          {ACTION_ICONS[item.id] ?? <ArrowRight className="w-4 h-4" />}
                        </span>
                        <div>
                          <p className="adm-table-primary">{item.title}</p>
                          <p className="adm-table-secondary">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="adm-stat-value adm-stat-value--sm">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        {/* Live on site */}
        <article className="adm-card adm-span-6">
          <div className="adm-card-head">
            <p className="adm-card-heading">Live on site</p>
            {liveJobs.length > 0 ? (
              <button type="button" className="adm-link-btn" onClick={() => onNavigate('map')}>
                Open map
              </button>
            ) : null}
          </div>
          {liveJobs.length === 0 ? (
            <div className="adm-empty adm-empty--compact">
              <MapPin className="w-5 h-5" />
              <p>No guards on site right now.</p>
            </div>
          ) : (
            <ul className="adm-activity-list">
              {liveJobs.slice(0, 6).map((job) => {
                const statusCfg = LIVE_JOB_STATUS_LABEL[job.status];
                return (
                  <li key={job.id}>
                    <button
                      type="button"
                      className="adm-activity-row"
                      onClick={() => (onOpenJob ? onOpenJob(job.id) : onNavigate('jobs'))}
                    >
                      <MapPin className="adm-metric-icon w-4 h-4" />
                      <span className="min-w-0 flex-1">
                        <div className="adm-live-job-head">
                          <p className="adm-activity-name">{job.title}</p>
                          <span className={`adm-badge ${job.status === 'in-progress' ? 'adm-badge--live' : 'adm-badge--pending'}`}>
                            {statusCfg.emoji} {statusCfg.label}
                          </span>
                        </div>
                        <p className="adm-activity-meta">
                          {job.guardName} · {job.clientName}
                        </p>
                        <p className="adm-activity-meta">{job.site}</p>
                        {canUpdateJobs && onOpenJob ? (
                          <button
                            type="button"
                            className="adm-btn adm-btn--xs adm-btn--soft adm-mt-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenJob(job.id);
                            }}
                          >
                            Edit job
                          </button>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        {/* Platform pulse */}
        {config.showPlatformPulse ? (
          <article className="adm-card adm-span-12">
            <div className="adm-card-head">
              <p className="adm-card-heading">Platform pulse</p>
              {config.showDirectorFinancials ? (
                <button type="button" className="adm-link-btn" onClick={() => onNavigate('analytics')}>
                  Analytics
                </button>
              ) : null}
            </div>
            <OverviewVisualGrid
              cards={platformPulseCards}
              columns={config.layout === 'compact' ? 2 : 3}
              variant="full"
            />
          </article>
        ) : null}

        {/* Director financials */}
        {config.showDirectorFinancials ? (
          <article className="adm-card adm-span-12">
            <div className="adm-card-head">
              <p className="adm-card-heading">Company financials</p>
              <button type="button" className="adm-link-btn" onClick={() => onNavigate('payments')}>
                Payments
              </button>
            </div>
            <div className="adm-financial-grid">
              {directorFinancialCells.map(({ label, value, sub, accent }) => (
                <StaffSummaryCell key={label} label={label} value={value} sub={sub} accent={accent} className="adm-financial-cell" />
              ))}
            </div>
          </article>
        ) : null}

        {/* Operations snapshot */}
        {config.showOperationsSnapshot ? (
          <article className="adm-card adm-span-12">
            <div className="adm-card-head">
              <p className="adm-card-heading">Operations snapshot</p>
              <button type="button" className="adm-link-btn" onClick={() => onNavigate('payments')}>
                Payments
              </button>
            </div>
            <OverviewVisualGrid cards={operationsSnapshotCards} columns={3} variant="full" />
          </article>
        ) : null}

        {/* Insights row */}
        {config.showWeeklyInsight ? (
          <article className="adm-card adm-span-4">
            <p className="adm-card-heading">Completed jobs this week</p>
            <OverviewWeekChart series={weeklySeries} />
          </article>
        ) : null}

        {config.showPipelineInsight ? (
          <article className="adm-card adm-span-4">
            <p className="adm-card-heading">Job pipeline mix</p>
            {jobPipelineSegments.length > 0 ? (
              <OverviewSegmentBar segments={jobPipelineSegments} />
            ) : (
              <p className="adm-card-body">No jobs in the pipeline yet.</p>
            )}
          </article>
        ) : null}

        {config.showActivityFeed ? (
          <article className="adm-card adm-span-4">
            <p className="adm-card-heading">Recent activity</p>
            {activityFeed.length === 0 ? (
              <p className="adm-card-body">Activity will appear here as shifts run.</p>
            ) : (
              <ul className="adm-activity-list">
                {activityFeed.slice(0, 10).map((item) => (
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
        ) : null}
      </div>
    </div>
  );
}
