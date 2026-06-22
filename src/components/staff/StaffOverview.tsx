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
  buildDirectorOperationsLines,
  computeOperationalFinancials,
} from '../../lib/operationalFinancials';
import { Client, SecurityGuard, SecurityRequest } from '../../types';
import type { ApprovalQueueId } from '../../lib/staffOps';
import { AppItemCard, AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfBadge, WfSectionHeader } from '../ui/wireframe';
import { StaffSummaryCell } from './StaffSummaryCell';
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
  weeklyTrend,
  onNavigate,
  onNavigateApprovals,
  onOpenJob,
  canUpdateJobs = false,
  staffName,
  showDirectorFinancials = false,
}: StaffOverviewProps) {
  const hasWeeklyData = weeklyTrend.some((h) => h > 0);
  const metrics = buildOverviewMetricCells(stats, requests);
  const financials = useMemo(() => computeOperationalFinancials(requests), [requests]);
  const directorFinancialCells = useMemo(
    () => buildDirectorFinancialCells(financials),
    [financials]
  );
  const directorOperationsLines = useMemo(
    () => buildDirectorOperationsLines(stats, financials, guards, clients, requests),
    [stats, financials, guards, clients, requests]
  );

  return (
    <div className="staff-overview animate-fade-in space-y-6 pb-6">
      <header className="staff-overview-hero">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-text-muted">{formatOverviewDate()}</p>
          <h2 className="text-xl sm:text-2xl font-semibold mt-1 truncate">Hello, {staffName.split(' ')[0]}</h2>
        </div>
        <div
          className={`staff-overview-health shrink-0 ${
            stats.platformHealthy ? 'staff-overview-health-ok' : 'staff-overview-health-warn'
          }`}
        >
          <span className="staff-overview-health-dot" aria-hidden />
          <div>
            <p className="text-sm font-medium leading-tight text-brand-text-muted">
              {stats.platformHealthy ? 'All clear' : 'Needs review'}
            </p>
            <p className="text-xs text-brand-text-muted/80 mt-0.5">
              {stats.pendingReviews} in queue
            </p>
          </div>
        </div>
      </header>

      {showDirectorFinancials && (
        <>
          <section>
            <WfSectionHeader
              title="Company financials"
              actionLabel="Payments"
              onAction={() => onNavigate('payments')}
            />
            <div className="staff-payment-summary-grid">
              {directorFinancialCells.map(({ label, value, sub, accent }) => (
                <StaffSummaryCell key={label} label={label} value={value} sub={sub} accent={accent} />
              ))}
            </div>
          </section>

          <section className="staff-overview-empty-card !items-start">
            <div className="w-full">
              <WfSectionHeader title="Operations snapshot" />
              <ul className="space-y-2.5">
                {directorOperationsLines.map((line) => (
                  <li key={line.label} className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-4 text-sm">
                    <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-brand-text-muted sm:w-36">
                      {line.label}
                    </span>
                    <span className="text-brand-text leading-snug">{line.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}

      <section>
        {showDirectorFinancials ? (
          <WfSectionHeader title="Live operations" />
        ) : null}
        <div className="staff-overview-metrics">
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
                <button
                  key={label}
                  type="button"
                  onClick={handleMetricClick}
                  className={`staff-summary-cell text-left ${accent ? 'staff-summary-cell-accent' : ''}`}
                >
                  <p className="text-[11px] font-medium uppercase tracking-wide text-brand-text-muted">{label}</p>
                  <p className="text-lg font-bold mt-1">{value}</p>
                  <p className="text-xs text-brand-text-muted mt-0.5 leading-snug">{sub}</p>
                </button>
              );
            }
            return <StaffSummaryCell key={label} label={label} value={value} sub={sub} accent={accent} />;
          })}
        </div>
      </section>

      <section>
        <WfSectionHeader title="Needs your attention" count={actionItems.length || undefined} />
        {actionItems.length === 0 ? (
          <div className="staff-overview-empty-card">
            <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
            <div>
              <p className="text-sm font-medium">You&apos;re caught up</p>
              <p className="text-xs text-brand-text-muted mt-0.5">
                No approvals, incidents, or payouts waiting. Browse jobs or open the map to monitor jobs.
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
      </section>

      <section>
        <WfSectionHeader
          title="Live jobs"
          count={liveJobs.length || undefined}
          actionLabel={liveJobs.length > 0 ? 'Open map' : undefined}
          onAction={liveJobs.length > 0 ? () => onNavigate('map') : undefined}
        />
        {liveJobs.length === 0 ? (
          <div className="staff-overview-empty-card">
            <MapPin className="w-5 h-5 text-brand-text-muted shrink-0" />
            <div>
              <p className="text-sm font-medium">No guards on site</p>
              <p className="text-xs text-brand-text-muted mt-0.5">
                Picked-up and in-progress jobs show up here when work is underway on site.
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
      </section>

      <div className="staff-overview-lower grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="staff-overview-chart-card">
          <WfSectionHeader title="Completed jobs this week" />
          {hasWeeklyData ? (
            <div className="flex items-end gap-2 h-28 px-1">
              {weeklyTrend.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div
                    className="w-full bg-brand-primary/80 rounded-t min-h-[4px] transition-all"
                    style={{ height: `${Math.max(8, Math.min(100, h))}%` }}
                  />
                  <span className="text-[10px] text-brand-text-muted">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-brand-text-muted py-6 text-center">No completed jobs this week yet.</p>
          )}
        </section>

        <section className="staff-overview-feed-card">
          <WfSectionHeader title="Recent activity" count={activityFeed.length || undefined} />
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
    </div>
  );
}
