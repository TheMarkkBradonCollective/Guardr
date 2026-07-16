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
  buildPlatformPulseCards,
  computeWeeklyJobSeries,
} from '../../lib/overviewVisuals';
import {
  filterOverviewActionItems,
  filterOverviewMetrics,
  getStaffOverviewConfig,
} from '../../lib/staffOverviewConfig';
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
  MapPin,
  MessagesSquare,
  Settings,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react';
import { StaffSummaryCell } from './StaffSummaryCell';
import {
  OverviewSegmentBar,
  OverviewVisualCardBody,
  OverviewVisualGrid,
  OverviewWeekChart,
} from './overview/OverviewCharts';

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

  const statusItems = [
    { label: 'On site now', value: stats.onDutyGuards },
    { label: 'Active jobs', value: stats.activeJobs },
    { label: 'In review queue', value: stats.pendingReviews },
    { label: 'Open incidents', value: stats.activeIncidents },
  ];

  return (
    <div className="adm-dashboard" data-tour="staff-overview">
      <div className="adm-dashboard-grid">
        {/* Welcome */}
        <article className="adm-card adm-card--welcome adm-span-8">
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
        <article
          className={`adm-card adm-card--status adm-span-4 ${
            stats.platformHealthy ? 'adm-card--status-ok' : 'adm-card--status-warn'
          }`}
        >
          <div className="adm-status-head">
            <span className={`adm-status-dot ${stats.platformHealthy ? 'adm-status-dot--ok' : 'adm-status-dot--warn'}`} aria-hidden />
            <div>
              <p className="adm-card-eyebrow">Platform status</p>
              <h3 className="adm-status-title">{stats.platformHealthy ? 'All clear' : 'Needs review'}</h3>
            </div>
          </div>
          <p className="adm-status-summary">
            {stats.platformHealthy
              ? 'Operations are running smoothly across the platform.'
              : `${stats.pendingReviews} item${stats.pendingReviews === 1 ? '' : 's'} waiting in the review queue.`}
          </p>
          <ul className="adm-status-grid">
            {statusItems.map((item) => (
              <li key={item.label}>
                <p className="adm-status-grid-value">{item.value}</p>
                <p className="adm-status-grid-label">{item.label}</p>
              </li>
            ))}
          </ul>
        </article>

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
