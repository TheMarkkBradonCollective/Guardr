import React from 'react';
import { SecurityRequest } from '../../types';
import {
  ClientReportCard,
  CoverageSummary,
  formatCoverageDateLabel,
  formatShiftTimeRange,
  getUpcomingCoverage,
} from '../../lib/clientCoverage';
import { WfMetricTile } from '../ui/wireframe';
import {
  AppDashboardHero,
  AppDashboardZone,
  AppHeroBand,
  AppItemCard,
  AppScreen,
  AppStatusBanner,
} from '../ui/app/AppPrimitives';
import {
  Shield,
  Calendar,
  Building2,
  FileText,
  Radio,
  Plus,
  ClipboardList,
  Users,
  Clock,
  Map,
  MessagesSquare,
} from 'lucide-react';
import { getClientLiveJobs } from '../../lib/clientShift';

export type ClientHomeAction = 'request' | 'schedule' | 'recurring' | 'reports' | 'coverage' | 'requests' | 'guards' | 'messages' | 'map';

interface ClientHomeScreenProps {
  companyName: string;
  coverage: CoverageSummary;
  requests: SecurityRequest[];
  recentReports: ClientReportCard[];
  accountPending?: boolean;
  onOpenProfile?: () => void;
  onAction: (action: ClientHomeAction) => void;
}

const QUICK_ACTIONS: { id: ClientHomeAction; icon: typeof Shield; label: string; sub: string; accent?: boolean }[] = [
  { id: 'request', icon: Plus, label: 'Post job offer', sub: 'Open to any guard', accent: true },
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

export function ClientHomeScreen({
  companyName,
  coverage,
  requests,
  recentReports,
  accountPending = false,
  onOpenProfile,
  onAction,
}: ClientHomeScreenProps) {
  const upcoming = getUpcomingCoverage(requests);
  const openRequestCount = requests.filter((r) => r.status === 'open' || r.status === 'accepted' || r.status === 'pending-review').length;
  const liveJobs = getClientLiveJobs(requests);

  return (
    <AppScreen>
      <AppDashboardHero kicker="Client workspace" title={companyName} />

      {liveJobs.length > 0 && (
        <AppHeroBand
          label="Live shift dashboard"
          icon={<Map className="w-4 h-4" />}
          footer={
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={() => onAction('map')} className="app-button-primary !w-full sm:!w-auto">
                Open shift map
              </button>
              <button type="button" onClick={() => onAction('messages')} className="app-button-outline !w-full sm:!w-auto gap-2">
                <MessagesSquare className="w-4 h-4" />
                Message guards
              </button>
            </div>
          }
        >
          <div className="app-metric-grid-3">
            <WfMetricTile label="Active sites" value={liveJobs.length} accent />
            <WfMetricTile label="On duty" value={liveJobs.filter((j) => j.status === 'in-progress').length} />
            <WfMetricTile label="Arriving" value={liveJobs.filter((j) => j.status === 'accepted').length} />
          </div>
        </AppHeroBand>
      )}

      {accountPending && (
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
        >
          <p className="text-xs text-brand-text-muted leading-relaxed">
            You can review your workspace here, but posting jobs and hiring guards unlocks after Guardr staff
            approves your account.
          </p>
        </AppStatusBanner>
      )}

      <AppHeroBand
        label="Active coverage"
        icon={<Radio className="w-4 h-4" />}
        footer={
          <button type="button" onClick={() => onAction('coverage')} className="app-button-primary !w-full sm:!w-auto">
            View live coverage
          </button>
        }
      >
        <div className="app-metric-grid-3">
          <WfMetricTile label="Active" value={coverage.activeAssignments} accent />
          <WfMetricTile label="On duty" value={coverage.guardsOnDuty} />
          <WfMetricTile
            label={coverage.guardsArriving > 0 && coverage.arrivingTimeLabel ? `Arriving ${coverage.arrivingTimeLabel}` : 'Arriving'}
            value={coverage.guardsArriving}
          />
        </div>
      </AppHeroBand>

      <AppDashboardZone title="At a glance">
        <div className="app-tile-grid-2">
          <button type="button" onClick={() => onAction('requests')} className="app-item-card flex-col items-stretch !flex !flex-col gap-2.5 text-left !p-5">
            <ClipboardList className="w-5 h-5 text-brand-primary" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-brand-text-muted">Open jobs</p>
              <p className="text-4xl font-black tracking-[-0.05em] leading-none mt-1">{openRequestCount}</p>
            </div>
          </button>
          <button type="button" onClick={() => onAction('schedule')} className="app-item-card flex-col items-stretch !flex !flex-col gap-2.5 text-left !p-5">
            <Calendar className="w-5 h-5 text-brand-primary" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-brand-text-muted">Upcoming</p>
              <p className="text-4xl font-black tracking-[-0.05em] leading-none mt-1">{upcoming.length}</p>
            </div>
          </button>
        </div>
      </AppDashboardZone>

      <AppDashboardZone title="Quick actions">
        <div className="app-section-body-bleed">
          <div className="app-quick-action-row">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onAction(action.id)}
                className={`app-quick-action-tile ${action.accent ? 'app-quick-action-tile-accent' : ''}`}
              >
                <div className={`app-quick-action-icon ${action.accent ? '' : ''}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="app-quick-action-label">{action.label}</p>
                  <p className="app-quick-action-sub">{action.sub}</p>
                </div>
              </button>
            );
          })}
          </div>
        </div>
      </AppDashboardZone>

      <AppDashboardZone
        title="Upcoming coverage"
        actionLabel={upcoming.length > 0 ? 'All jobs' : undefined}
        onAction={upcoming.length > 0 ? () => onAction('requests') : undefined}
      >
        {upcoming.length === 0 ? (
          <p className="app-empty-state">No upcoming coverage. Post a job offer to get started.</p>
        ) : (
          <div className="app-scroll-row scrollbar-hide -mx-5 px-5 pb-1">
            {upcoming.map((req) => (
              <AppItemCard
                key={req.id}
                onClick={() => onAction('requests')}
                className="flex-col !items-stretch gap-2 snap-start shrink-0 w-[min(100%,260px)] !border !border-brand-border"
              >
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                  <p className="font-semibold text-sm leading-snug">{req.title}</p>
                </div>
                <p className="text-sm font-medium text-brand-primary">{formatCoverageDateLabel(req.startDate)}</p>
                <p className="text-xs text-brand-text-muted">{formatShiftTimeRange(req.startDate, req.endDate)}</p>
                <p className="text-xs text-brand-text pt-2 border-t border-brand-border">
                  {req.guardsNeeded ?? 1} guard{(req.guardsNeeded ?? 1) !== 1 ? 's' : ''} needed
                </p>
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
          <p className="app-empty-state">Reports from completed jobs will appear here.</p>
        ) : (
          <div className="app-item-card-stack">
            {recentReports.slice(0, 4).map((report) => (
              <AppItemCard key={report.id} onClick={() => onAction('reports')} className="flex-col !items-stretch gap-1">
                <p className="text-xs font-medium text-brand-primary">{REPORT_TYPE_LABEL[report.type]}</p>
                <p className="font-semibold">{report.title}</p>
                <p className="text-sm text-brand-text-muted line-clamp-2">{report.summary}</p>
                <p className="text-xs text-brand-text-muted">{report.siteName}</p>
              </AppItemCard>
            ))}
          </div>
        )}
      </AppDashboardZone>
    </AppScreen>
  );
}
