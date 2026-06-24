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
import { hasUnconfirmedSpotChecks } from '../../lib/spotChecks';
import {
  AppDashboardZone,
  AppItemCard,
  AppScreen,
  AppStatusBanner,
} from '../ui/app/AppPrimitives';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import {
  Shield,
  Calendar,
  Building2,
  FileText,
  Plus,
  ClipboardList,
  Users,
  Clock,
  Map,
  Star,
  ChevronRight,
  Radio,
} from 'lucide-react';

export type ClientHomeAction = 'request' | 'schedule' | 'recurring' | 'reports' | 'requests' | 'guards' | 'messages' | 'map';

interface ClientHomeScreenProps {
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

const QUICK_ACTIONS: { id: ClientHomeAction; icon: typeof Shield; label: string; sub: string }[] = [
  { id: 'request', icon: Plus, label: 'Post job', sub: 'Open to guards' },
  { id: 'guards', icon: Users, label: 'Browse guards', sub: 'Resumes & licenses' },
  { id: 'schedule', icon: Calendar, label: 'Schedule', sub: 'Plan ahead' },
  { id: 'recurring', icon: Building2, label: 'Multi-guard site', sub: 'Construction & events' },
  { id: 'reports', icon: FileText, label: 'Reports', sub: 'Activity & incidents' },
];

const REPORT_TYPE_LABEL: Record<ClientReportCard['type'], string> = {
  incident: 'Incident report',
  activity: 'Activity report',
  property: 'Property report',
};

function timeGreeting(): string {
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
    if (hasUnconfirmedSpotChecks(req)) count += 1;
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

export function ClientHomeScreen({
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
}: ClientHomeScreenProps) {
  const upcoming = getUpcomingCoverage(requests);
  const liveJobs = useMemo(() => getClientLiveJobs(requests), [requests]);
  const openRequestCount = requests.filter(
    (r) => r.status === 'open' || r.status === 'accepted' || r.status === 'pending-review'
  ).length;
  const hasLiveCoverage = coverage.activeAssignments > 0;
  const pendingActions = useMemo(() => clientActionCount(requests), [requests]);

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <AppScreen className="client-home-screen">
      <header className="client-home-header px-5 pt-4 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-text-muted">{todayLabel}</p>
        <h1 className="text-2xl sm:text-3xl font-black tracking-[-0.04em] leading-tight mt-1">
          {timeGreeting()}
        </h1>
        <p className="text-sm text-brand-text-muted mt-1">{companyName}</p>
      </header>

      {accountPending && (
        <div className="px-5 pb-4">
          <AppStatusBanner
            icon={<Clock className="w-5 h-5 text-amber-400" />}
            title="Account pending approval"
            action={
              onOpenProfile ? (
                <button type="button" onClick={onOpenProfile} className="app-button-outline app-btn-sm">
                  Review profile
                </button>
              ) : undefined
            }
          />
        </div>
      )}

      <div className="px-5 pb-2">
        {hasLiveCoverage ? (
          <button
            type="button"
            onClick={() => onAction('map')}
            className="client-home-live-card w-full text-left"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-primary flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  Live now
                </p>
              </div>
              <span className="client-home-live-map-pill">
                <Map className="w-3.5 h-3.5" />
                Map
                <ChevronRight className="w-3.5 h-3.5 opacity-70" />
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="client-home-stat-pill">
                <p className="client-home-stat-value">{coverage.activeAssignments}</p>
                <p className="client-home-stat-label">Active</p>
              </div>
              <div className="client-home-stat-pill">
                <p className="client-home-stat-value">{coverage.guardsOnDuty}</p>
                <p className="client-home-stat-label">On duty</p>
              </div>
              <div className="client-home-stat-pill">
                <p className="client-home-stat-value">{coverage.guardsArriving}</p>
                <p className="client-home-stat-label">
                  {coverage.guardsArriving > 0 && coverage.arrivingTimeLabel
                    ? `Next ${coverage.arrivingTimeLabel}`
                    : 'Arriving'}
                </p>
              </div>
            </div>

            {liveJobs.length > 0 && (
              <ul className="space-y-2 mb-3">
                {liveJobs.slice(0, 3).map((job) => (
                  <li key={job.id} className="client-home-live-job-row">
                    <Shield className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                    <span className="font-medium text-sm truncate flex-1">{job.title}</span>
                    <span className="text-[11px] text-brand-text-muted shrink-0">
                      {CLIENT_SHIFT_PHASE_LABELS[inferClientShiftPhase(job)]}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {pendingActions > 0 && (
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                {pendingActions} item{pendingActions === 1 ? '' : 's'} need your approval on the map
              </p>
            )}
          </button>
        ) : (
          <div className="client-home-empty-live">
            <div className="flex items-start gap-3">
              <div className="client-home-empty-live-icon">
                <Map className="w-5 h-5 text-brand-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-base">No guards on site right now</p>
                <p className="text-sm text-brand-text-muted mt-1 leading-relaxed">
                  Post a job offer or open the map to track coverage when shifts go live.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button type="button" onClick={() => onAction('request')} className="app-button-primary app-btn-sm flex-1">
                Post job offer
              </button>
              <button type="button" onClick={() => onAction('map')} className="app-button-outline app-btn-sm flex-1 gap-1.5">
                <Map className="w-3.5 h-3.5" />
                Open map
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onAction('requests')}
            className="client-home-glance-tile"
          >
            <ClipboardList className="w-5 h-5 text-brand-primary" />
            <p className="client-home-glance-value">{openRequestCount}</p>
            <p className="client-home-glance-label">Open jobs</p>
          </button>
          <button
            type="button"
            onClick={() => onAction('requests')}
            className="client-home-glance-tile"
          >
            <Calendar className="w-5 h-5 text-brand-primary" />
            <p className="client-home-glance-value">{upcoming.length}</p>
            <p className="client-home-glance-label">Upcoming shifts</p>
          </button>
        </div>
      </div>

      <AppDashboardZone title="Quick actions">
        <div className="client-home-quick-grid px-5 pb-1">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            const isPrimary = action.id === 'request';
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onAction(action.id)}
                className={`client-home-quick-tile ${isPrimary ? 'client-home-quick-tile-primary' : ''}`}
              >
                <span className={`client-home-quick-icon ${isPrimary ? 'client-home-quick-icon-primary' : ''}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="client-home-quick-label">{action.label}</span>
                <span className="client-home-quick-sub">{action.sub}</span>
              </button>
            );
          })}
        </div>
      </AppDashboardZone>

      {recentGuards.length > 0 && onHireGuard && (
        <AppDashboardZone title="Your guards" actionLabel="Browse all" onAction={() => onAction('guards')}>
          <div className="app-scroll-row scrollbar-hide -mx-5 px-5 pb-1">
            {recentGuards.map((guard) => (
              <div
                key={guard.id}
                className="shrink-0 snap-start w-36 app-item-card flex-col items-center gap-2 !p-3 text-center !border !border-brand-border"
              >
                <button
                  type="button"
                  onClick={() => onViewGuard?.(guard)}
                  className="flex flex-col items-center gap-2 w-full"
                >
                  <ProfileAvatar src={guard.avatar} name={guard.name} size="lg" rounded="xl" className="w-12 h-12 text-sm" />
                  <div>
                    <p className="font-semibold text-xs leading-snug line-clamp-2">{guard.name}</p>
                    <p className="text-[10px] text-brand-text-muted flex items-center justify-center gap-0.5 mt-0.5">
                      <Star className="w-2.5 h-2.5 fill-brand-primary text-brand-primary" />
                      {guard.rating.toFixed(1)}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onHireGuard(guard)}
                  className="w-full py-1 text-[10px] font-semibold bg-brand-primary/10 text-brand-primary rounded-lg hover:bg-brand-primary/20 transition-colors"
                >
                  Hire again
                </button>
              </div>
            ))}
          </div>
        </AppDashboardZone>
      )}

      <AppDashboardZone
        title="Upcoming coverage"
        actionLabel={upcoming.length > 0 ? 'All jobs' : undefined}
        onAction={upcoming.length > 0 ? () => onAction('requests') : undefined}
      >
        {upcoming.length === 0 ? (
          <p className="app-empty-state px-5">No upcoming coverage. Post a job offer to get started.</p>
        ) : (
          <div className="flex flex-col gap-2 px-5">
            {upcoming.slice(0, 4).map((req) => (
              <AppItemCard
                key={req.id}
                onClick={() => onAction('requests')}
                className="flex-col !items-stretch gap-2 !border !border-brand-border w-full"
              >
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                  <p className="font-semibold text-sm leading-snug">{req.title}</p>
                </div>
                <p className="text-sm font-medium text-brand-primary">{formatCoverageDateLabel(req.startDate)}</p>
                <p className="text-xs text-brand-text-muted">{formatShiftTimeRange(req.startDate, req.endDate)}</p>
              </AppItemCard>
            ))}
          </div>
        )}
      </AppDashboardZone>

      <AppDashboardZone
        title="Recent reports"
        actionLabel={recentReports.length > 0 ? 'View all' : undefined}
        onAction={recentReports.length > 0 ? () => onAction('reports') : undefined}
      >
        {recentReports.length === 0 ? (
          <p className="app-empty-state px-5">Reports from completed jobs will appear here.</p>
        ) : (
          <div className="app-item-card-stack px-5">
            {recentReports.slice(0, 3).map((report) => (
              <AppItemCard key={report.id} onClick={() => onAction('reports')} className="flex-col !items-stretch gap-1">
                <p className="text-xs font-medium text-brand-primary">{REPORT_TYPE_LABEL[report.type]}</p>
                <p className="font-semibold">{report.title}</p>
                <p className="text-sm text-brand-text-muted line-clamp-2">{report.summary}</p>
              </AppItemCard>
            ))}
          </div>
        )}
      </AppDashboardZone>
    </AppScreen>
  );
}
