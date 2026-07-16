import React, { useMemo } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import {
  ClientReportCard,
  formatCoverageDateLabel,
  formatShiftTimeRange,
  getUpcomingCoverage,
} from '../../lib/clientCoverage';
import { getClientLiveJobs, inferClientShiftPhase, CLIENT_SHIFT_PHASE_LABELS } from '../../lib/clientShift';
import { canClientApproveStaffScheduleChange } from '../../lib/jobScheduleChange';
import { canClientApproveOvertime } from '../../lib/shiftBilling';
import { canClientConfirmSelfAudit, hasSelfAuditPhotosToReview, isSelfAuditClientConfirmed } from '../../lib/selfAuditPhotos';
import { buildJobPipelineSegments, computeWeeklyJobSeries } from '../../lib/overviewVisuals';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { OverviewSegmentBar, OverviewWeekChart } from '../staff/overview/OverviewCharts';
import {
  ArrowUpRight,
  Briefcase,
  Calendar,
  FileText,
  Map,
  MapPin,
  Plus,
  Radio,
  Shield,
  Star,
  Users,
} from 'lucide-react';
import type { ClientHomeAction } from './ClientHomeScreen';

interface ClientHomeDesktopProps {
  companyName: string;
  coverage: import('../../lib/clientCoverage').CoverageSummary;
  requests: SecurityRequest[];
  recentReports: ClientReportCard[];
  accountPending?: boolean;
  onOpenProfile?: () => void;
  onAction: (action: ClientHomeAction) => void;
  recentGuards?: SecurityGuard[];
  onHireGuard?: (guard: SecurityGuard) => void;
  onViewGuard?: (guard: SecurityGuard) => void;
}

const REPORT_TYPE_LABEL: Record<ClientReportCard['type'], string> = {
  incident: 'Incident report',
  activity: 'Activity report',
  property: 'Property report',
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function clientActionCount(requests: SecurityRequest[]): number {
  let count = 0;
  for (const req of requests) {
    if (canClientApproveOvertime(req)) count += 1;
    if (canClientApproveStaffScheduleChange(req)) count += 1;
    if (
      hasSelfAuditPhotosToReview(req) &&
      req.checkInAudit &&
      !isSelfAuditClientConfirmed(req.checkInAudit) &&
      canClientConfirmSelfAudit(req)
    ) {
      count += 1;
    }
  }
  return count;
}

export function ClientHomeDesktop({
  companyName,
  coverage,
  requests,
  recentReports,
  accountPending = false,
  onOpenProfile,
  onAction,
  recentGuards = [],
  onHireGuard,
  onViewGuard,
}: ClientHomeDesktopProps) {
  const upcoming = getUpcomingCoverage(requests);
  const liveJobs = useMemo(() => getClientLiveJobs(requests), [requests]);
  const openCount = requests.filter(
    (r) => r.status === 'open' || r.status === 'accepted' || r.status === 'pending-review',
  ).length;
  const completedCount = requests.filter((r) => r.status === 'completed' || r.status === 'closed').length;
  const pendingActions = useMemo(() => clientActionCount(requests), [requests]);
  const jobPipelineSegments = useMemo(() => buildJobPipelineSegments(requests), [requests]);
  const weeklySeries = useMemo(() => computeWeeklyJobSeries(requests), [requests]);
  const hasLiveCoverage = coverage.activeAssignments > 0;

  const run = (action: ClientHomeAction) => {
    if (accountPending && action !== 'messages') {
      onOpenProfile?.();
      return;
    }
    onAction(action);
  };

  const livePct = coverage.activeAssignments > 0 ? Math.min(100, coverage.activeAssignments * 20) : 0;
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const statusItems = [
    { label: 'Live assignments', value: coverage.activeAssignments },
    { label: 'Guards on duty', value: coverage.guardsOnDuty },
    { label: 'Arriving soon', value: coverage.guardsArriving },
    { label: 'Open jobs', value: openCount },
  ];

  return (
    <div className="adm-dashboard">
      {accountPending ? (
        <div className="adm-alert adm-alert--warn">
          <strong>Account pending approval.</strong> Complete your profile before posting jobs.
          {onOpenProfile ? (
            <button type="button" className="adm-btn adm-btn--sm adm-btn--outline" onClick={onOpenProfile}>
              Review profile
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="adm-dashboard-grid">
        {/* Welcome */}
        <article className="adm-card adm-card--welcome adm-span-8">
          <div>
            <p className="adm-card-eyebrow">{todayLabel} · {companyName}</p>
            <h2 className="adm-card-title">{greeting()}</h2>
            <p className="adm-card-body">Manage coverage, review guards, and monitor live operations from your console.</p>
            <button type="button" className="adm-btn adm-btn--sand" onClick={() => run('request')}>
              Post job
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="adm-welcome-art" aria-hidden>
            <Shield className="w-16 h-16 opacity-20" />
          </div>
        </article>

        {/* Whole coverage status */}
        <article
          className={`adm-card adm-card--status adm-span-4 ${
            hasLiveCoverage ? 'adm-card--status-ok' : 'adm-card--status-muted'
          }`}
        >
          <div className="adm-status-head">
            <span
              className={`adm-status-dot ${hasLiveCoverage ? 'adm-status-dot--ok' : 'adm-status-dot--muted'}`}
              aria-hidden
            />
            <div>
              <p className="adm-card-eyebrow">Coverage status</p>
              <h3 className="adm-status-title">{hasLiveCoverage ? 'Live coverage active' : 'No guards on site'}</h3>
            </div>
          </div>
          <p className="adm-status-summary">
            {hasLiveCoverage
              ? `${coverage.guardsOnDuty} guard${coverage.guardsOnDuty === 1 ? '' : 's'} on duty across ${coverage.activeAssignments} assignment${coverage.activeAssignments === 1 ? '' : 's'}.`
              : 'Post a job or open the map to track coverage when shifts go live.'}
          </p>
          {pendingActions > 0 ? (
            <p className="adm-status-alert">
              {pendingActions} item{pendingActions === 1 ? '' : 's'} need your approval on the map
            </p>
          ) : null}
          <ul className="adm-status-grid">
            {statusItems.map((item) => (
              <li key={item.label}>
                <p className="adm-status-grid-value">{item.value}</p>
                <p className="adm-status-grid-label">{item.label}</p>
              </li>
            ))}
          </ul>
        </article>

        {/* Key metrics */}
        <article className="adm-card adm-card--stat adm-span-3">
          <p className="adm-card-eyebrow">Live coverage</p>
          <div className="adm-stat-row">
            <div>
              <p className="adm-stat-value">{coverage.activeAssignments}</p>
              <p className="adm-stat-label">Active assignments</p>
              <p className="adm-stat-delta">+ {coverage.guardsOnDuty} on duty now</p>
            </div>
            <div className="adm-progress-ring" style={{ '--adm-progress': `${livePct}%` } as React.CSSProperties}>
              <span>{livePct}%</span>
            </div>
          </div>
          <button type="button" className="adm-btn adm-btn--sm adm-btn--outline adm-mt" onClick={() => run('map')}>
            View map
          </button>
        </article>

        <article className="adm-card adm-card--stat adm-span-3">
          <p className="adm-card-eyebrow">Open jobs</p>
          <p className="adm-stat-value">{openCount}</p>
          <p className="adm-stat-label">Active requests</p>
          <p className="adm-stat-delta">{upcoming.length} scheduled upcoming</p>
          <button type="button" className="adm-btn adm-btn--sm adm-btn--outline adm-mt" onClick={() => run('requests')}>
            View jobs
          </button>
        </article>

        <article className="adm-card adm-card--stat adm-span-3">
          <p className="adm-card-eyebrow">Completed</p>
          <p className="adm-stat-value">{completedCount}</p>
          <p className="adm-stat-label">Finished jobs</p>
          <p className="adm-stat-delta">{recentReports.length} recent reports</p>
          <button type="button" className="adm-btn adm-btn--sm adm-btn--outline adm-mt" onClick={() => run('reports')}>
            View reports
          </button>
        </article>

        <article className="adm-card adm-card--stat adm-span-3">
          <p className="adm-card-eyebrow">Scheduled</p>
          <p className="adm-stat-value">{upcoming.length}</p>
          <p className="adm-stat-label">Upcoming shifts</p>
          <p className="adm-stat-delta">
            {coverage.guardsArriving > 0 && coverage.arrivingTimeLabel
              ? `Next at ${coverage.arrivingTimeLabel}`
              : 'No arrivals queued'}
          </p>
          <button type="button" className="adm-btn adm-btn--sm adm-btn--outline adm-mt" onClick={() => run('schedule')}>
            Schedule
          </button>
        </article>

        {/* Charts row */}
        <article className="adm-card adm-span-6">
          <p className="adm-card-heading">Job pipeline breakdown</p>
          {jobPipelineSegments.length > 0 ? (
            <OverviewSegmentBar segments={jobPipelineSegments} />
          ) : (
            <p className="adm-card-body">No jobs in the pipeline yet. Post a job to get started.</p>
          )}
        </article>

        <article className="adm-card adm-span-6">
          <p className="adm-card-heading">Completed jobs this week</p>
          <OverviewWeekChart series={weeklySeries} />
        </article>

        {/* Operations status list */}
        <article className="adm-card adm-span-4">
          <p className="adm-card-eyebrow">Operations status</p>
          <h3 className="adm-card-heading">At a glance</h3>
          <ul className="adm-metric-list">
            <li>
              <span className="adm-metric-icon"><Radio className="w-4 h-4" /></span>
              <div>
                <p className="adm-metric-label">Live assignments</p>
                <p className="adm-metric-value">{coverage.activeAssignments}</p>
              </div>
            </li>
            <li>
              <span className="adm-metric-icon"><Users className="w-4 h-4" /></span>
              <div>
                <p className="adm-metric-label">Guards on duty</p>
                <p className="adm-metric-value">{coverage.guardsOnDuty}</p>
              </div>
            </li>
            <li>
              <span className="adm-metric-icon"><Briefcase className="w-4 h-4" /></span>
              <div>
                <p className="adm-metric-label">Open jobs</p>
                <p className="adm-metric-value">{openCount}</p>
              </div>
            </li>
            <li>
              <span className="adm-metric-icon"><FileText className="w-4 h-4" /></span>
              <div>
                <p className="adm-metric-label">Recent reports</p>
                <p className="adm-metric-value">{recentReports.length}</p>
              </div>
            </li>
          </ul>
        </article>

        {/* Live jobs table */}
        <article className="adm-card adm-span-8">
          <div className="adm-card-head">
            <div>
              <p className="adm-card-eyebrow">Live operations</p>
              <h3 className="adm-card-heading">Field status</h3>
            </div>
            <button type="button" className="adm-btn adm-btn--sm adm-btn--sand" onClick={() => run('map')}>
              Open map
            </button>
          </div>
          {liveJobs.length > 0 ? (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Phase</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {liveJobs.slice(0, 5).map((job) => (
                  <tr key={job.id} onClick={() => run('map')} className="adm-table-row--click">
                    <td className="adm-table-strong">{job.title}</td>
                    <td>{CLIENT_SHIFT_PHASE_LABELS[inferClientShiftPhase(job)]}</td>
                    <td><span className="adm-badge adm-badge--live">Live</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="adm-empty">
              <Map className="w-8 h-8" />
              <p>No guards on site right now</p>
            </div>
          )}
        </article>

        {/* Quick actions */}
        <article className="adm-card adm-span-4">
          <p className="adm-card-eyebrow">Shortcuts</p>
          <h3 className="adm-card-heading">Quick actions</h3>
          <div className="adm-shortcut-grid">
            {[
              { id: 'request' as const, label: 'Post job', icon: Plus },
              { id: 'guards' as const, label: 'Browse guards', icon: Users },
              { id: 'map' as const, label: 'Map', icon: Map },
              { id: 'locations' as const, label: 'Locations', icon: MapPin },
              { id: 'schedule' as const, label: 'Schedule', icon: Calendar },
              { id: 'reports' as const, label: 'Reports', icon: FileText },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" className="adm-shortcut" onClick={() => run(id)}>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </article>

        {/* Scheduled jobs table */}
        <article className="adm-card adm-span-8">
          <div className="adm-card-head">
            <h3 className="adm-card-heading">Latest scheduled jobs</h3>
            <button type="button" className="adm-link-btn" onClick={() => run('requests')}>View all</button>
          </div>
          {upcoming.length > 0 ? (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.slice(0, 5).map((req) => (
                  <tr key={req.id} onClick={() => run('requests')} className="adm-table-row--click">
                    <td className="adm-table-strong">{req.title}</td>
                    <td>{formatCoverageDateLabel(req.startDate)}</td>
                    <td className="adm-table-muted">{formatShiftTimeRange(req.startDate, req.endDate)}</td>
                    <td><span className="adm-badge adm-badge--pending">Scheduled</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="adm-empty adm-empty--compact"><p>No scheduled coverage yet</p></div>
          )}
        </article>

        {/* Recent reports */}
        <article className="adm-card adm-span-4">
          <div className="adm-card-head">
            <h3 className="adm-card-heading">Recent reports</h3>
            {recentReports.length > 0 ? (
              <button type="button" className="adm-link-btn" onClick={() => run('reports')}>View all</button>
            ) : null}
          </div>
          {recentReports.length === 0 ? (
            <div className="adm-empty adm-empty--compact"><p>No reports yet</p></div>
          ) : (
            <ul className="adm-activity-list">
              {recentReports.slice(0, 4).map((report) => (
                <li key={report.id}>
                  <button type="button" className="adm-activity-row" onClick={() => run('reports')}>
                    <FileText className="adm-metric-icon w-4 h-4" />
                    <span>
                      <p className="adm-activity-name">{report.title}</p>
                      <p className="adm-activity-meta">{REPORT_TYPE_LABEL[report.type]}</p>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        {/* Guards */}
        <article className="adm-card adm-span-4">
          <div className="adm-card-head">
            <h3 className="adm-card-heading">Your guards</h3>
            <button type="button" className="adm-link-btn" onClick={() => run('guards')}>Browse</button>
          </div>
          {recentGuards.length === 0 ? (
            <div className="adm-empty adm-empty--compact"><p>No guards yet</p></div>
          ) : (
            <ul className="adm-activity-list">
              {recentGuards.slice(0, 4).map((guard) => (
                <li key={guard.id}>
                  <button type="button" className="adm-activity-row" onClick={() => onViewGuard?.(guard)}>
                    <ProfileAvatar src={guard.avatar} name={guard.name} size="sm" rounded="full" className="w-9 h-9" />
                    <div className="min-w-0">
                      <p className="adm-activity-name">{guard.name}</p>
                      <p className="adm-activity-meta">
                        <Star className="w-3 h-3 inline" /> {guard.rating.toFixed(1)}
                      </p>
                    </div>
                  </button>
                  {onHireGuard ? (
                    <button type="button" className="adm-btn adm-btn--xs adm-btn--soft" onClick={() => onHireGuard(guard)}>
                      Hire
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </div>
  );
}
