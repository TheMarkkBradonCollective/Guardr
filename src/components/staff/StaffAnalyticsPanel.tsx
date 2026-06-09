import React from 'react';
import { computeAnalytics, computeWeeklyCompletedJobs } from '../../lib/staffOps';
import { Client, SecurityGuard, SecurityRequest } from '../../types';
import { WfMetricTile, WfSectionHeader } from '../ui/wireframe';

interface StaffAnalyticsPanelProps {
  guards: SecurityGuard[];
  clients: Client[];
  requests: SecurityRequest[];
  showFinancials: boolean;
}

export function StaffAnalyticsPanel({ guards, clients, requests, showFinancials }: StaffAnalyticsPanelProps) {
  const data = computeAnalytics(guards, clients, requests);
  const weeklyTrend = computeWeeklyCompletedJobs(requests);
  const hasWeeklyData = weeklyTrend.some((h) => h > 0);

  const metrics = [
    ...(showFinancials ? [{ label: 'Total Platform Revenue', value: `$${data.totalRevenue.toLocaleString()}`, pct: null }] : []),
    { label: 'Active Guards', value: String(data.activeGuards), pct: null },
    { label: 'Registered Clients', value: String(data.clientGrowth), pct: null },
    { label: 'Repeat Clients', value: String(data.repeatClients), pct: null },
    { label: 'Job Completion Rate', value: `${data.jobCompletionRate}%`, pct: data.jobCompletionRate },
    { label: 'Client incident rate', value: `${data.incidentRate}%`, pct: data.incidentRate },
    ...(showFinancials ? [{ label: 'Avg Guard Earnings', value: `$${data.avgGuardEarnings}`, pct: null }] : []),
  ];

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-brand-text-muted mt-1">Platform insights and trends</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map(({ label, value, pct }) => (
          <div key={label}>
            <WfMetricTile label={label} value={value} accent={pct != null} />
            {pct != null && (
              <div className="mt-2 h-1.5 rounded-full bg-brand-border overflow-hidden">
                <div className="h-full bg-brand-primary rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="wf-list-card flex-col items-stretch !flex !flex-col">
        <WfSectionHeader title="Completed Jobs Trend" className="mb-4" />
        {hasWeeklyData ? (
          <div className="flex items-end gap-2 h-32">
            {weeklyTrend.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-brand-primary/80 rounded-t" style={{ height: `${Math.min(100, h)}%` }} />
                <span className="text-xs text-brand-text-muted">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-brand-text-muted py-8 text-center">No completed jobs this week yet.</p>
        )}
      </div>
    </div>
  );
}
