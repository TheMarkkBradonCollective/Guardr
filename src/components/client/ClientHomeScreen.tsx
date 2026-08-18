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
import {
  AppDashboardHero,
  AppDashboardZone,
  AppEmptyState,
  AppItemCard,
  AppMetricCell,
  AppMetricStrip,
  AppScreen,
  AppStatusBanner,
} from '../ui/app/AppPrimitives';
import { AppButton } from '../ui/AppButton';
import { AccentIcon, MutedIcon, QuickActionTile } from '../baseui/dashboard';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { useClientCapabilities } from './ClientCapabilitiesContext';
import {
  Shield,
  Calendar,
  Building2,
  FileText,
  Plus,
  Users,
  Clock,
  Map,
  Star,
  ChevronRight,
  Radio,
} from 'lucide-react';
import type { ClientHomeQuickActionId } from '../../lib/clientCapabilities';

export type ClientHomeAction = 'request' | 'schedule' | 'recurring' | 'reports' | 'requests' | 'guards' | 'messages' | 'map' | 'locations' | 'invoices';

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

const QUICK_ACTION_ICONS: Record<ClientHomeQuickActionId, typeof Shield> = {
  request: Plus,
  guards: Users,
  locations: Map,
  schedule: Calendar,
  recurring: Building2,
  reports: FileText,
};

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
  const caps = useClientCapabilities();
  const quickActions = caps.homeQuickActions;
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
  const protectedActionClass = accountPending ? 'client-home-action-muted' : '';
  const runAction = (action: ClientHomeAction) => {
    if (accountPending && action !== 'messages') {
      onOpenProfile?.();
      return;
    }
    onAction(action);
  };
  const runProtectedCallback = (callback?: () => void) => {
    if (accountPending) {
      onOpenProfile?.();
      return;
    }
    callback?.();
  };

  const liveStatus = hasLiveCoverage ? (
    <button
      type="button"
      onClick={() => runAction('map')}
      className={`app-live-pill ${protectedActionClass}`}
      aria-disabled={accountPending}
    >
      <Radio className="w-3.5 h-3.5" />
      {coverage.activeAssignments} live
    </button>
  ) : undefined;

  return (
    <AppScreen className="client-home-screen">
      <AppDashboardHero
        kicker={`${todayLabel} · ${companyName}`}
        title={timeGreeting()}
        status={liveStatus}
      />

      {accountPending && (
        <div className="px-5 pb-4">
          <AppStatusBanner
            icon={<Clock className="w-5 h-5 text-amber-400" />}
            title="Account pending approval"
            action={
              onOpenProfile ? (
                <AppButton type="button" variant="outline" size="sm" onClick={onOpenProfile}>
                  Review profile
                </AppButton>
              ) : undefined
            }
          >
            <p className="text-sm uber-text-muted leading-relaxed">
              Finish your profile review before posting jobs, browsing guards, or opening live operations.
            </p>
          </AppStatusBanner>
        </div>
      )}

      <div className="px-5 pb-2">
        {hasLiveCoverage ? (
          <button
            type="button"
            onClick={() => runAction('map')}
            className={`client-home-live-card w-full text-left ${protectedActionClass}`}
            aria-disabled={accountPending}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] uber-text-accent flex items-center gap-1.5">
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
                    <AccentIcon icon={Shield} size={14} className="shrink-0" />
                    <span className="font-medium text-sm truncate flex-1">{job.title}</span>
                    <span className="text-[11px] uber-text-muted shrink-0">
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
                <AccentIcon icon={Map} size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-base">No guards on site right now</p>
                <p className="text-sm uber-text-muted mt-1 leading-relaxed">
                  Post a job offer or open the map to track coverage when shifts go live.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <AppButton type="button" variant="primary" size="sm" fullWidth onClick={() => runAction('request')}>
                {caps.isPersonal ? 'Request security' : 'Post job offer'}
              </AppButton>
              <AppButton type="button" variant="outline" size="sm" fullWidth onClick={() => runAction('map')}>
                <span className="inline-flex items-center justify-center gap-1.5">
                  <Map className="w-3.5 h-3.5" />
                  Open map
                </span>
              </AppButton>
            </div>
          </div>
        )}
      </div>

      <AppDashboardZone title="At a glance" className="!mb-4">
        <AppMetricStrip className={`app-metric-strip--count-${caps.has('staffing-coverage') ? '3' : '2'}`}>
          <AppMetricCell
            label="Open jobs"
            value={openRequestCount}
            sub="Active requests"
            onClick={() => runAction('requests')}
            accent={openRequestCount > 0}
          />
          <AppMetricCell
            label="Scheduled"
            value={upcoming.length}
            sub="Upcoming shifts"
            onClick={() => runAction('requests')}
          />
          {caps.has('staffing-coverage') ? (
            <AppMetricCell
              label="Coverage"
              value={coverage.activeAssignments}
              sub="Guards on duty"
              onClick={() => runAction('map')}
              accent={coverage.activeAssignments > 0}
            />
          ) : null}
        </AppMetricStrip>
      </AppDashboardZone>

      <AppDashboardZone title="Quick actions">
        <div className="client-home-quick-grid px-5 pb-1">
          {quickActions.map((action) => (
            <QuickActionTile
              key={action.id}
              icon={QUICK_ACTION_ICONS[action.id]}
              label={action.label}
              sub={action.sub}
              primary={action.id === 'request'}
              disabled={accountPending}
              onClick={() => runAction(action.id)}
            />
          ))}
        </div>
      </AppDashboardZone>

      {recentGuards.length > 0 && onHireGuard && (
        <AppDashboardZone title={caps.isPersonal ? 'Your guards' : 'Your guards'} actionLabel={caps.isPersonal ? 'View all' : 'Browse all'} onAction={() => runAction('guards')}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-5 pb-1">
            {recentGuards.slice(0, 6).map((guard) => (
              <div
                key={guard.id}
                className="app-item-card flex-col items-center gap-2 !p-3 text-center !border uber-border min-w-0"
              >
                <button
                  type="button"
                  onClick={() => runProtectedCallback(() => onViewGuard?.(guard))}
                  className={`flex flex-col items-center gap-2 w-full min-w-0 ${protectedActionClass}`}
                  aria-disabled={accountPending}
                >
                  <ProfileAvatar src={guard.avatar} name={guard.name} size="lg" rounded="xl" className="w-12 h-12 text-sm" />
                  <div className="w-full min-w-0">
                    <p className="font-semibold text-xs leading-snug line-clamp-2 truncate">{guard.name}</p>
                    <p className="text-[10px] uber-text-muted flex items-center justify-center gap-0.5 mt-0.5">
                      <Star className="w-2.5 h-2.5 uber-fill-accent uber-text-accent" />
                      {guard.rating.toFixed(1)}
                    </p>
                  </div>
                </button>
                <AppButton
                  type="button"
                  variant="ghost"
                  size="inline"
                  fullWidth
                  onClick={() => runProtectedCallback(() => onHireGuard(guard))}
                  disabled={accountPending}
                  className="!text-[10px] uber-bg-accent-soft uber-text-accent"
                >
                  Hire again
                </AppButton>
              </div>
            ))}
          </div>
        </AppDashboardZone>
      )}

      <AppDashboardZone
        title="Scheduled coverage"
        actionLabel={upcoming.length > 0 ? 'All jobs' : undefined}
        onAction={upcoming.length > 0 ? () => runAction('requests') : undefined}
      >
        {upcoming.length === 0 ? (
          <AppEmptyState icon={<Calendar className="w-5 h-5" />} title="No scheduled coverage">
            Post a job to get matched with licensed guards.
          </AppEmptyState>
        ) : (
          <div className="flex flex-col gap-2 px-5">
            {upcoming.slice(0, 4).map((req) => (
              <AppItemCard
                key={req.id}
                onClick={() => runAction('requests')}
                className="flex-col !items-stretch gap-2 !border uber-border w-full"
              >
                <div className="flex items-start gap-2">
                  <AccentIcon icon={Shield} size={16} className="mt-0.5 shrink-0" />
                  <p className="font-semibold text-sm leading-snug">{req.title}</p>
                </div>
                <p className="text-sm font-medium uber-text-accent">{formatCoverageDateLabel(req.startDate)}</p>
                <p className="text-xs uber-text-muted">{formatShiftTimeRange(req.startDate, req.endDate)}</p>
              </AppItemCard>
            ))}
          </div>
        )}
      </AppDashboardZone>

      {caps.has('reporting') ? (
      <AppDashboardZone
        title="Recent reports"
        actionLabel={recentReports.length > 0 ? 'View all' : undefined}
        onAction={recentReports.length > 0 ? () => runAction('reports') : undefined}
      >
        {recentReports.length === 0 ? (
          <AppEmptyState icon={<FileText className="w-5 h-5" />} title="No reports yet">
            Activity and incident reports from completed jobs will appear here.
          </AppEmptyState>
        ) : (
          <div className="app-item-card-stack px-5">
            {recentReports.slice(0, 3).map((report) => (
              <AppItemCard key={report.id} onClick={() => runAction('reports')} className="flex-col !items-stretch gap-1">
                <p className="text-xs font-medium uber-text-accent">{REPORT_TYPE_LABEL[report.type]}</p>
                <p className="font-semibold">{report.title}</p>
                <p className="text-sm uber-text-muted line-clamp-2">{report.summary}</p>
              </AppItemCard>
            ))}
          </div>
        )}
      </AppDashboardZone>
      ) : null}
    </AppScreen>
  );
}
