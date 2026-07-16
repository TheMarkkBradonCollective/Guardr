import React, { useMemo } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import {
  ClientReportCard,
  formatCoverageDateLabel,
  formatShiftTimeRange,
  getUpcomingCoverage,
} from '../../lib/clientCoverage';
import { getClientLiveJobs, inferClientShiftPhase, CLIENT_SHIFT_PHASE_LABELS } from '../../lib/clientShift';
import { ProfileAvatar } from '../profile/ProfileAvatar';
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

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
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

  const run = (action: ClientHomeAction) => {
    if (accountPending && action !== 'messages') {
      onOpenProfile?.();
      return;
    }
    onAction(action);
  };

  const livePct = coverage.activeAssignments > 0 ? Math.min(100, coverage.activeAssignments * 20) : 0;

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
        {/* Welcome card */}
        <article className="adm-card adm-card--welcome adm-span-4">
          <div>
            <p className="adm-card-eyebrow">Welcome back</p>
            <h2 className="adm-card-title">{greeting()}, {companyName}</h2>
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

        {/* Live coverage stat */}
        <article className="adm-card adm-card--stat adm-span-4">
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

        {/* Open jobs stat */}
        <article className="adm-card adm-card--stat adm-span-4">
          <p className="adm-card-eyebrow">Open jobs</p>
          <p className="adm-stat-value">{openCount}</p>
          <p className="adm-stat-label">Active requests</p>
          <p className="adm-stat-delta">{upcoming.length} scheduled upcoming</p>
          <button type="button" className="adm-btn adm-btn--sm adm-btn--outline adm-mt" onClick={() => run('requests')}>
            View jobs
          </button>
        </article>

        {/* Sales status style metrics */}
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
