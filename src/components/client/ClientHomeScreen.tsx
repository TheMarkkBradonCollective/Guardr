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
} from 'lucide-react';

export type ClientHomeAction = 'request' | 'schedule' | 'recurring' | 'reports' | 'coverage' | 'requests' | 'guards';

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
  { id: 'recurring', icon: Building2, label: 'Recurring sites', sub: 'Weekly / monthly' },
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

  return (
    <AppScreen>
      <AppDashboardHero kicker="Client workspace" title={companyName} />

      {accountPending && (
        <AppStatusBanner
          icon={<Clock className="w-5 h-5 text-amber-400" />}
          title="Account pending approval"
          action={
            onOpenProfile ? (
              <button type="button" onClick={onOpenProfile} className="app-button-outline !w-auto !h-9 !px-4 !text-xs">
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
          <button type="button" onClick={() => onAction('requests')} className="app-item-card flex-col items-stretch !flex !flex-col gap-2 text-left !p-4">
            <ClipboardList className="w-5 h-5 text-brand-primary" />
            <p className="font-semibold text-sm">Open jobs</p>
            <p className="text-2xl font-bold tracking-tight">{openRequestCount}</p>
          </button>
          <button type="button" onClick={() => onAction('schedule')} className="app-item-card flex-col items-stretch !flex !flex-col gap-2 text-left !p-4">
            <Calendar className="w-5 h-5 text-brand-primary" />
            <p className="font-semibold text-sm">Upcoming</p>
            <p className="text-2xl font-bold tracking-tight">{upcoming.length}</p>
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
