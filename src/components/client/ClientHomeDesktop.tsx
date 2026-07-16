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
  Building2,
  Calendar,
  ChevronRight,
  FileText,
  Map,
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

const ACTIONS: { id: ClientHomeAction; label: string; sub: string; icon: typeof Plus }[] = [
  { id: 'request', label: 'Post job', sub: 'Open to guards', icon: Plus },
  { id: 'guards', label: 'Browse guards', sub: 'Resumes & licenses', icon: Users },
  { id: 'map', label: 'Operations map', sub: 'Live field view', icon: Map },
  { id: 'locations', label: 'Locations', sub: 'Saved sites', icon: Building2 },
  { id: 'schedule', label: 'Schedule', sub: 'Plan ahead', icon: Calendar },
  { id: 'reports', label: 'Reports', sub: 'Activity log', icon: FileText },
];

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

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="dsk-command-center dsk-command-center--client">
      <header className="dsk-command-header">
        <div>
          <p className="dsk-command-kicker">{today} · {companyName}</p>
          <h2 className="dsk-command-title">{greeting()}</h2>
        </div>
        <div className="dsk-command-header-actions">
          <button type="button" className="dsk-btn dsk-btn--primary" onClick={() => run('request')}>
            <Plus className="w-4 h-4" />
            Post job
          </button>
          <button type="button" className="dsk-btn dsk-btn--ghost" onClick={() => run('map')}>
            <Map className="w-4 h-4" />
            Open map
          </button>
        </div>
      </header>

      {accountPending ? (
        <div className="dsk-banner dsk-banner--warn">
          <strong>Account pending approval.</strong> Complete your profile before posting jobs or opening operations.
          {onOpenProfile ? (
            <button type="button" className="dsk-btn dsk-btn--sm dsk-btn--ghost" onClick={onOpenProfile}>
              Review profile
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="dsk-kpi-row">
        <button type="button" className="dsk-kpi-tile" onClick={() => run('map')}>
          <span className="dsk-kpi-label">Live assignments</span>
          <span className="dsk-kpi-value">{coverage.activeAssignments}</span>
          <span className="dsk-kpi-sub">{coverage.guardsOnDuty} on duty now</span>
        </button>
        <button type="button" className="dsk-kpi-tile" onClick={() => run('requests')}>
          <span className="dsk-kpi-label">Open jobs</span>
          <span className="dsk-kpi-value">{openCount}</span>
          <span className="dsk-kpi-sub">Active requests</span>
        </button>
        <button type="button" className="dsk-kpi-tile" onClick={() => run('requests')}>
          <span className="dsk-kpi-label">Scheduled</span>
          <span className="dsk-kpi-value">{upcoming.length}</span>
          <span className="dsk-kpi-sub">Upcoming shifts</span>
        </button>
        <button type="button" className="dsk-kpi-tile" onClick={() => run('reports')}>
          <span className="dsk-kpi-label">Reports</span>
          <span className="dsk-kpi-value">{recentReports.length}</span>
          <span className="dsk-kpi-sub">Recent activity</span>
        </button>
      </div>

      <div className="dsk-command-grid">
        <section className="dsk-panel dsk-panel--span-8">
          <div className="dsk-panel-head">
            <div>
              <p className="dsk-panel-eyebrow">
                <Radio className="w-3.5 h-3.5" />
                Live operations
              </p>
              <h3 className="dsk-panel-title">Field status</h3>
            </div>
            <button type="button" className="dsk-link-btn" onClick={() => run('map')}>
              Full map
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {liveJobs.length > 0 ? (
            <table className="dsk-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Phase</th>
                  <th>Guards</th>
                </tr>
              </thead>
              <tbody>
                {liveJobs.slice(0, 6).map((job) => (
                  <tr key={job.id} onClick={() => run('map')} className="dsk-table-row--clickable">
                    <td>
                      <span className="dsk-table-primary">{job.title}</span>
                    </td>
                    <td>{CLIENT_SHIFT_PHASE_LABELS[inferClientShiftPhase(job)]}</td>
                    <td>{job.assignedGuardId ? 1 : 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="dsk-panel-empty">
              <Map className="w-8 h-8 text-brand-primary opacity-80" />
              <p className="dsk-panel-empty-title">No guards on site</p>
              <p className="dsk-panel-empty-body">Post a job or open the map when shifts go live.</p>
            </div>
          )}
        </section>

        <section className="dsk-panel dsk-panel--span-4">
          <div className="dsk-panel-head">
            <h3 className="dsk-panel-title">Quick actions</h3>
          </div>
          <div className="dsk-action-list">
            {ACTIONS.map(({ id, label, sub, icon: Icon }) => (
              <button key={id} type="button" className="dsk-action-row" onClick={() => run(id)}>
                <span className="dsk-action-row-icon">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="dsk-action-row-copy">
                  <span className="dsk-action-row-label">{label}</span>
                  <span className="dsk-action-row-sub">{sub}</span>
                </span>
                <ChevronRight className="w-4 h-4 opacity-40" />
              </button>
            ))}
          </div>
        </section>

        <section className="dsk-panel dsk-panel--span-6">
          <div className="dsk-panel-head">
            <h3 className="dsk-panel-title">Scheduled coverage</h3>
            {upcoming.length > 0 ? (
              <button type="button" className="dsk-link-btn" onClick={() => run('requests')}>
                All jobs
              </button>
            ) : null}
          </div>
          {upcoming.length === 0 ? (
            <div className="dsk-panel-empty dsk-panel-empty--compact">
              <p className="dsk-panel-empty-body">No scheduled coverage yet.</p>
            </div>
          ) : (
            <table className="dsk-table dsk-table--compact">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Date</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.slice(0, 5).map((req) => (
                  <tr key={req.id} onClick={() => run('requests')} className="dsk-table-row--clickable">
                    <td className="dsk-table-primary">{req.title}</td>
                    <td>{formatCoverageDateLabel(req.startDate)}</td>
                    <td className="dsk-table-muted">{formatShiftTimeRange(req.startDate, req.endDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="dsk-panel dsk-panel--span-6">
          <div className="dsk-panel-head">
            <h3 className="dsk-panel-title">Your guards</h3>
            <button type="button" className="dsk-link-btn" onClick={() => run('guards')}>
              Browse all
            </button>
          </div>
          {recentGuards.length === 0 ? (
            <div className="dsk-panel-empty dsk-panel-empty--compact">
              <p className="dsk-panel-empty-body">Guards you hire will appear here.</p>
            </div>
          ) : (
            <div className="dsk-guard-grid">
              {recentGuards.slice(0, 4).map((guard) => (
                <div key={guard.id} className="dsk-guard-card">
                  <button type="button" className="dsk-guard-card-main" onClick={() => onViewGuard?.(guard)}>
                    <ProfileAvatar src={guard.avatar} name={guard.name} size="lg" rounded="lg" className="w-11 h-11" />
                    <div className="min-w-0">
                      <p className="dsk-guard-card-name">{guard.name}</p>
                      <p className="dsk-guard-card-rating">
                        <Star className="w-3 h-3 fill-brand-primary text-brand-primary" />
                        {guard.rating.toFixed(1)}
                      </p>
                    </div>
                  </button>
                  {onHireGuard ? (
                    <button type="button" className="dsk-btn dsk-btn--sm dsk-btn--soft" onClick={() => onHireGuard(guard)}>
                      Hire again
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
