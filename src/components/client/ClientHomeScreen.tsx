import React from 'react';
import { SecurityRequest } from '../../types';
import {
  ClientReportCard,
  CoverageSummary,
  formatCoverageDateLabel,
  formatShiftTimeRange,
  getUpcomingCoverage,
} from '../../lib/clientCoverage';
import { ChevronRight, Shield } from 'lucide-react';

export type ClientHomeAction = 'request' | 'schedule' | 'recurring' | 'reports' | 'coverage';

interface ClientHomeScreenProps {
  companyName: string;
  coverage: CoverageSummary;
  requests: SecurityRequest[];
  recentReports: ClientReportCard[];
  isClientApproved: boolean;
  onAction: (action: ClientHomeAction) => void;
}

const QUICK_ACTIONS: { id: ClientHomeAction; emoji: string; label: string; sub: string }[] = [
  { id: 'request', emoji: '🛡️', label: 'Request Security', sub: 'On-demand coverage' },
  { id: 'schedule', emoji: '📅', label: 'Schedule Future Coverage', sub: 'Plan ahead' },
  { id: 'recurring', emoji: '🏢', label: 'Recurring Site Coverage', sub: 'Weekly / monthly' },
  { id: 'reports', emoji: '📋', label: 'View Reports', sub: 'Activity & incidents' },
];

const REPORT_TYPE_LABEL: Record<ClientReportCard['type'], string> = {
  incident: 'Incident Report',
  activity: 'Activity Report',
  property: 'Property Report',
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
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-8">
      {/* Header */}
      <div>
        <p className="text-sm text-brand-text-muted font-mono">👋 Welcome Back</p>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">{companyName}</h1>
      </div>

      {!isClientApproved && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4 text-sm text-brand-text-muted">
          Your company account is pending staff approval. You can explore the dashboard, but posting requests is disabled until approved.
        </div>
      )}

      {/* Active Security Coverage hero */}
      <section className="rounded-2xl bg-gradient-to-br from-brand-primary/20 via-brand-primary/10 to-transparent border border-brand-primary/25 p-6 sm:p-8">
        <p className="text-[10px] font-mono uppercase tracking-widest text-brand-primary mb-4">Active Security Coverage</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-3xl sm:text-4xl font-black">{coverage.activeAssignments}</p>
            <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase tracking-wide">Active Assignments</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black">{coverage.guardsOnDuty}</p>
            <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase tracking-wide">Guards On Duty</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black">{coverage.guardsArriving}</p>
            <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase tracking-wide">
              {coverage.guardsArriving > 0 && coverage.arrivingTimeLabel
                ? `Guard Arriving at ${coverage.arrivingTimeLabel}`
                : 'Guards Arriving'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onAction('coverage')}
          className="uber-button-sage w-full sm:w-auto h-12 px-8 text-sm font-black uppercase tracking-wide"
        >
          View Live Coverage
        </button>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-widest text-brand-text-muted mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={!isClientApproved && action.id !== 'reports'}
              onClick={() => onAction(action.id)}
              className="client-action-card text-left disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="text-2xl">{action.emoji}</span>
              <div className="mt-3">
                <p className="font-black text-sm">{action.label}</p>
                <p className="text-[11px] font-mono text-brand-text-muted mt-0.5">{action.sub}</p>
              </div>
              <ChevronRight className="absolute top-5 right-4 w-4 h-4 text-brand-text-muted" />
            </button>
          ))}
        </div>
      </section>

      {/* Upcoming Coverage carousel */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-widest text-brand-text-muted mb-3">Upcoming Coverage</h2>
        {upcoming.length === 0 ? (
          <div className="uber-card-flat rounded-2xl p-8 text-center text-sm text-brand-text-muted font-mono">
            No upcoming coverage scheduled. Tap Request Security to get started.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {upcoming.map((req) => (
              <div
                key={req.id}
                className="client-coverage-card snap-start shrink-0 w-[min(100%,280px)]"
              >
                <div className="flex items-start gap-2 mb-3">
                  <Shield className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                  <p className="font-black text-sm leading-snug">{req.title}</p>
                </div>
                <p className="text-[11px] font-mono text-brand-primary uppercase tracking-wide">
                  {formatCoverageDateLabel(req.startDate)}
                </p>
                <p className="text-xs font-mono text-brand-text-muted mt-1">
                  {formatShiftTimeRange(req.startDate, req.endDate)}
                </p>
                <p className="text-xs font-mono text-brand-text mt-3 pt-3 border-t border-brand-border">
                  {req.guardsNeeded ?? 1} Guard{(req.guardsNeeded ?? 1) !== 1 ? 's' : ''} Assigned
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Reports */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono uppercase tracking-widest text-brand-text-muted">Recent Reports</h2>
          {recentReports.length > 0 && (
            <button
              type="button"
              onClick={() => onAction('reports')}
              className="text-[10px] font-mono font-bold uppercase text-brand-primary hover:underline"
            >
              View all
            </button>
          )}
        </div>
        {recentReports.length === 0 ? (
          <div className="uber-card-flat rounded-2xl p-6 text-sm text-brand-text-muted font-mono">
            Reports from completed shifts will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {recentReports.slice(0, 4).map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => onAction('reports')}
                className="w-full uber-card-flat rounded-xl p-4 text-left hover:border-brand-primary/40 transition-colors"
              >
                <p className="text-[10px] font-mono uppercase text-brand-primary tracking-wide">
                  {REPORT_TYPE_LABEL[report.type]}
                </p>
                <p className="font-bold text-sm mt-1">{report.title}</p>
                <p className="text-xs text-brand-text-muted mt-1 line-clamp-2">{report.summary}</p>
                <p className="text-[10px] font-mono text-brand-text-muted mt-2">{report.siteName}</p>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
