import React from 'react';
import { SecurityRequest } from '../../types';
import {
  ClientReportCard,
  CoverageSummary,
  formatCoverageDateLabel,
  formatShiftTimeRange,
  getUpcomingCoverage,
} from '../../lib/clientCoverage';
import {
  ChevronRight,
  Shield,
  Calendar,
  Building2,
  FileText,
  Radio,
  Plus,
  ClipboardList,
} from 'lucide-react';

export type ClientHomeAction = 'request' | 'schedule' | 'recurring' | 'reports' | 'coverage' | 'requests';

interface ClientHomeScreenProps {
  companyName: string;
  coverage: CoverageSummary;
  requests: SecurityRequest[];
  recentReports: ClientReportCard[];
  isClientApproved: boolean;
  onAction: (action: ClientHomeAction) => void;
}

const QUICK_ACTIONS: { id: ClientHomeAction; icon: typeof Shield; label: string; sub: string; accent?: boolean }[] = [
  { id: 'request', icon: Plus, label: 'Request security', sub: 'On-demand coverage', accent: true },
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
  isClientApproved,
  onAction,
}: ClientHomeScreenProps) {
  const upcoming = getUpcomingCoverage(requests);

  return (
    <div className="h-full overflow-y-auto overscroll-contain">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-8">
        {/* Greeting */}
        <div>
          <p className="text-sm text-brand-text-muted">Welcome back</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">{companyName}</h1>
        </div>

        {!isClientApproved && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4 text-sm text-brand-text-muted">
            Your account is pending approval. You can explore the dashboard, but posting requests is disabled until approved.
          </div>
        )}

        {/* Coverage hero card */}
        <section className="app-card overflow-hidden p-0">
          <div className="p-6 bg-gradient-to-br from-brand-primary/20 via-brand-primary/8 to-transparent">
            <div className="flex items-center gap-2 mb-5">
              <Radio className="w-5 h-5 text-brand-primary" />
              <p className="text-sm font-semibold text-brand-primary">Active coverage</p>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-3xl font-bold">{coverage.activeAssignments}</p>
                <p className="text-xs text-brand-text-muted mt-1">Active</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{coverage.guardsOnDuty}</p>
                <p className="text-xs text-brand-text-muted mt-1">On duty</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{coverage.guardsArriving}</p>
                <p className="text-xs text-brand-text-muted mt-1">
                  {coverage.guardsArriving > 0 && coverage.arrivingTimeLabel
                    ? `Arriving ${coverage.arrivingTimeLabel}`
                    : 'Arriving'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onAction('coverage')}
              className="uber-button-sage w-full sm:w-auto"
            >
              View live coverage
            </button>
          </div>
        </section>

        {/* Coverage overview cards */}
        <section>
          <h2 className="text-sm font-semibold text-brand-text-muted mb-3">Your coverage</h2>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => onAction('coverage')} className="app-card text-left p-5 hover:border-brand-primary/30">
              <Radio className="w-5 h-5 text-brand-primary mb-3" />
              <p className="font-semibold">Active coverage</p>
              <p className="text-2xl font-bold mt-1">{coverage.guardsOnDuty}</p>
              <p className="text-xs text-brand-text-muted">guards on duty</p>
            </button>
            <button type="button" onClick={() => onAction('schedule')} className="app-card text-left p-5 hover:border-brand-primary/30">
              <Calendar className="w-5 h-5 text-brand-primary mb-3" />
              <p className="font-semibold">Upcoming</p>
              <p className="text-2xl font-bold mt-1">{upcoming.length}</p>
              <p className="text-xs text-brand-text-muted">scheduled shifts</p>
            </button>
            <button type="button" onClick={() => onAction('reports')} className="app-card text-left p-5 hover:border-brand-primary/30">
              <FileText className="w-5 h-5 text-brand-primary mb-3" />
              <p className="font-semibold">Recent reports</p>
              <p className="text-2xl font-bold mt-1">{recentReports.length}</p>
              <p className="text-xs text-brand-text-muted">this month</p>
            </button>
            <button type="button" onClick={() => onAction('requests')} className="app-card text-left p-5 hover:border-brand-primary/30">
              <ClipboardList className="w-5 h-5 text-brand-primary mb-3" />
              <p className="font-semibold">Open requests</p>
              <p className="text-2xl font-bold mt-1">{requests.filter((r) => r.status === 'open' || r.status === 'accepted' || r.status === 'pending-review').length}</p>
              <p className="text-xs text-brand-text-muted">pending</p>
            </button>
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="text-sm font-semibold text-brand-text-muted mb-3">Quick actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  disabled={!isClientApproved && action.id !== 'reports'}
                  onClick={() => onAction(action.id)}
                  className={`client-action-card text-left disabled:opacity-40 disabled:cursor-not-allowed ${
                    action.accent ? 'border-brand-primary/30' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                    action.accent ? 'bg-brand-primary text-brand-accent-text' : 'bg-brand-primary/10 text-brand-primary'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="font-semibold">{action.label}</p>
                  <p className="text-sm text-brand-text-muted mt-0.5">{action.sub}</p>
                  <ChevronRight className="absolute top-5 right-4 w-5 h-5 text-brand-text-muted" />
                </button>
              );
            })}
          </div>
        </section>

        {/* Upcoming */}
        <section>
          <h2 className="text-sm font-semibold text-brand-text-muted mb-3">Upcoming coverage</h2>
          {upcoming.length === 0 ? (
            <div className="app-card text-center py-10 text-sm text-brand-text-muted">
              No upcoming coverage. Tap Request security to get started.
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
              {upcoming.map((req) => (
                <div key={req.id} className="client-coverage-card snap-start shrink-0 w-[min(100%,260px)]">
                  <div className="flex items-start gap-2 mb-3">
                    <Shield className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                    <p className="font-semibold text-sm leading-snug">{req.title}</p>
                  </div>
                  <p className="text-sm font-medium text-brand-primary">
                    {formatCoverageDateLabel(req.startDate)}
                  </p>
                  <p className="text-xs text-brand-text-muted mt-1">
                    {formatShiftTimeRange(req.startDate, req.endDate)}
                  </p>
                  <p className="text-xs text-brand-text mt-3 pt-3 border-t border-brand-border">
                    {req.guardsNeeded ?? 1} guard{(req.guardsNeeded ?? 1) !== 1 ? 's' : ''} assigned
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Reports */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-brand-text-muted">Recent reports</h2>
            {recentReports.length > 0 && (
              <button
                type="button"
                onClick={() => onAction('reports')}
                className="text-sm font-semibold text-brand-primary hover:underline"
              >
                View all
              </button>
            )}
          </div>
          {recentReports.length === 0 ? (
            <div className="app-card py-8 text-center text-sm text-brand-text-muted">
              Reports from completed shifts will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.slice(0, 4).map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => onAction('reports')}
                  className="w-full app-card text-left hover:border-brand-primary/30 transition-colors"
                >
                  <p className="text-xs font-medium text-brand-primary">
                    {REPORT_TYPE_LABEL[report.type]}
                  </p>
                  <p className="font-semibold mt-1">{report.title}</p>
                  <p className="text-sm text-brand-text-muted mt-1 line-clamp-2">{report.summary}</p>
                  <p className="text-xs text-brand-text-muted mt-2">{report.siteName}</p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
