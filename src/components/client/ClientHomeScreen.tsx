import React from 'react';
import { SecurityRequest } from '../../types';
import {
  ClientReportCard,
  CoverageSummary,
  formatCoverageDateLabel,
  formatShiftTimeRange,
  getUpcomingCoverage,
} from '../../lib/clientCoverage';
import { WfMetricTile, WfSectionHeader } from '../ui/wireframe';
import {
  Shield,
  Calendar,
  Building2,
  FileText,
  Radio,
  Plus,
  ClipboardList,
  Users,
} from 'lucide-react';

export type ClientHomeAction = 'request' | 'schedule' | 'recurring' | 'reports' | 'coverage' | 'requests' | 'guards';

interface ClientHomeScreenProps {
  companyName: string;
  coverage: CoverageSummary;
  requests: SecurityRequest[];
  recentReports: ClientReportCard[];
  onAction: (action: ClientHomeAction) => void;
}

const QUICK_ACTIONS: { id: ClientHomeAction; icon: typeof Shield; label: string; sub: string; accent?: boolean }[] = [
  { id: 'request', icon: Plus, label: 'Request security', sub: 'Open to any guard', accent: true },
  { id: 'guards', icon: Users, label: 'Browse guards', sub: 'Resumes, licenses & certs' },
  { id: 'schedule', icon: Calendar, label: 'Schedule coverage', sub: 'Plan ahead' },
  { id: 'recurring', icon: Building2, label: 'Recurring sites', sub: 'Weekly / monthly' },
  { id: 'reports', icon: FileText, label: 'View reports', sub: 'Activity & incidents' },
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
  onAction,
}: ClientHomeScreenProps) {
  const upcoming = getUpcomingCoverage(requests);
  const openRequestCount = requests.filter((r) => r.status === 'open' || r.status === 'accepted' || r.status === 'pending-review').length;

  return (
    <div className="h-full overflow-y-auto overscroll-contain">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-8">
        <div>
          <p className="text-sm text-brand-text-muted">Welcome back</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">{companyName}</h1>
        </div>

        <section className="wf-list-card flex-col items-stretch !flex !flex-col gap-4 overflow-hidden p-0">
          <div className="p-6 bg-gradient-to-br from-brand-primary/20 via-brand-primary/8 to-transparent">
            <div className="flex items-center gap-2 mb-5">
              <Radio className="w-5 h-5 text-brand-primary" />
              <p className="text-sm font-semibold text-brand-primary">Active coverage</p>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-6">
              <WfMetricTile label="Active" value={coverage.activeAssignments} accent />
              <WfMetricTile label="On duty" value={coverage.guardsOnDuty} />
              <WfMetricTile
                label={coverage.guardsArriving > 0 && coverage.arrivingTimeLabel ? `Arriving ${coverage.arrivingTimeLabel}` : 'Arriving'}
                value={coverage.guardsArriving}
              />
            </div>
            <button
              type="button"
              onClick={() => onAction('coverage')}
              className="app-button-primary !w-full sm:!w-auto"
            >
              View live coverage
            </button>
          </div>
        </section>

        <section>
          <WfSectionHeader title="Your coverage" className="mb-3" />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onAction('coverage')} className="wf-list-card wf-list-card-interactive flex-col items-stretch !flex !flex-col gap-2 text-left">
              <Radio className="w-5 h-5 text-brand-primary" />
              <p className="font-semibold text-sm">Active coverage</p>
              <WfMetricTile label="Guards on duty" value={coverage.guardsOnDuty} accent className="!p-3" />
            </button>
            <button
              type="button"
              onClick={() => onAction('schedule')}
              className="wf-list-card wf-list-card-interactive flex-col items-stretch !flex !flex-col gap-2 text-left"
            >
              <Calendar className="w-5 h-5 text-brand-primary" />
              <p className="font-semibold text-sm">Upcoming</p>
              <WfMetricTile label="Scheduled shifts" value={upcoming.length} className="!p-3" />
            </button>
            <button type="button" onClick={() => onAction('reports')} className="wf-list-card wf-list-card-interactive flex-col items-stretch !flex !flex-col gap-2 text-left">
              <FileText className="w-5 h-5 text-brand-primary" />
              <p className="font-semibold text-sm">Recent reports</p>
              <WfMetricTile label="This month" value={recentReports.length} className="!p-3" />
            </button>
            <button type="button" onClick={() => onAction('requests')} className="wf-list-card wf-list-card-interactive flex-col items-stretch !flex !flex-col gap-2 text-left">
              <ClipboardList className="w-5 h-5 text-brand-primary" />
              <p className="font-semibold text-sm">Open requests</p>
              <WfMetricTile label="Pending" value={openRequestCount} className="!p-3" />
            </button>
          </div>
        </section>

        <section>
          <h2 className="app-section-title">Quick actions</h2>
          <div className="app-scroll-row scrollbar-hide pb-1">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => onAction(action.id)}
                  className={`w-[11.5rem] text-left rounded-2xl border p-4 min-h-[7.5rem] flex flex-col justify-between transition-all ${
                    action.accent
                      ? 'border-brand-primary bg-brand-primary/10 shadow-sm'
                      : 'border-brand-border bg-brand-surface hover:border-brand-primary/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    action.accent ? 'bg-brand-primary text-brand-accent-text' : 'bg-brand-bg-sec text-brand-primary'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{action.label}</p>
                    <p className="text-xs text-brand-text-muted mt-0.5 leading-snug">{action.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <WfSectionHeader title="Upcoming coverage" className="mb-3" />
          {upcoming.length === 0 ? (
            <div className="wf-list-card justify-center py-10 text-sm text-brand-text-muted">
              No upcoming coverage. Tap Request security to get started.
            </div>
          ) : (
            <div className="app-scroll-row scrollbar-hide pb-1">
              {upcoming.map((req) => (
                <div key={req.id} className="wf-list-card flex-col items-stretch !flex !flex-col gap-2 snap-start shrink-0 w-[min(100%,260px)]">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                    <p className="font-semibold text-sm leading-snug">{req.title}</p>
                  </div>
                  <p className="text-sm font-medium text-brand-primary">
                    {formatCoverageDateLabel(req.startDate)}
                  </p>
                  <p className="text-xs text-brand-text-muted">
                    {formatShiftTimeRange(req.startDate, req.endDate)}
                  </p>
                  <p className="text-xs text-brand-text pt-2 border-t border-brand-border">
                    {req.guardsNeeded ?? 1} guard{(req.guardsNeeded ?? 1) !== 1 ? 's' : ''} assigned
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <WfSectionHeader
            title="Recent reports"
            actionLabel={recentReports.length > 0 ? 'View all' : undefined}
            onAction={recentReports.length > 0 ? () => onAction('reports') : undefined}
            className="mb-3"
          />
          {recentReports.length === 0 ? (
            <div className="wf-list-card justify-center py-8 text-sm text-brand-text-muted">
              Reports from completed shifts will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.slice(0, 4).map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => onAction('reports')}
                  className="w-full wf-list-card wf-list-card-interactive flex-col items-stretch !flex !flex-col gap-1 text-left"
                >
                  <p className="text-xs font-medium text-brand-primary">
                    {REPORT_TYPE_LABEL[report.type]}
                  </p>
                  <p className="font-semibold">{report.title}</p>
                  <p className="text-sm text-brand-text-muted line-clamp-2">{report.summary}</p>
                  <p className="text-xs text-brand-text-muted">{report.siteName}</p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
