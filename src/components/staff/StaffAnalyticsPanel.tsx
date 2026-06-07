import React from 'react';
import { computeAnalytics } from '../../lib/staffOps';
import { Client, SecurityGuard, SecurityRequest } from '../../types';

interface StaffAnalyticsPanelProps {
  guards: SecurityGuard[];
  clients: Client[];
  requests: SecurityRequest[];
  showFinancials: boolean;
}

export function StaffAnalyticsPanel({ guards, clients, requests, showFinancials }: StaffAnalyticsPanelProps) {
  const data = computeAnalytics(guards, clients, requests);

  const metrics = [
    ...(showFinancials ? [{ label: 'Total Platform Revenue', value: `$${data.totalRevenue.toLocaleString()}`, pct: null }] : []),
    { label: 'Active Guards', value: String(data.activeGuards), pct: null },
    { label: 'Registered Clients', value: String(data.clientGrowth), pct: null },
    { label: 'Repeat Clients', value: String(data.repeatClients), pct: null },
    { label: 'Job Completion Rate', value: `${data.jobCompletionRate}%`, pct: data.jobCompletionRate },
    { label: 'Incident Rate', value: `${data.incidentRate}%`, pct: data.incidentRate },
    ...(showFinancials ? [{ label: 'Avg Guard Earnings', value: `$${data.avgGuardEarnings}`, pct: null }] : []),
  ];

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Analytics</h1>
        <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase">Platform insights and trends</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map(({ label, value, pct }) => (
          <div key={label} className="staff-ops-card">
            <p className="text-[10px] font-mono uppercase text-brand-text-muted tracking-wide">{label}</p>
            <p className="text-2xl font-black font-mono mt-2 text-brand-primary">{value}</p>
            {pct != null && (
              <div className="mt-3 h-1.5 rounded-full bg-brand-border overflow-hidden">
                <div className="h-full bg-brand-primary rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="staff-ops-card">
        <h3 className="text-xs font-mono uppercase text-brand-text-muted mb-4">Completed Jobs Trend</h3>
        <div className="flex items-end gap-2 h-32">
          {[40, 55, 48, 67, 52, 71, data.completedJobs || 45].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-brand-primary/80 rounded-t" style={{ height: `${Math.min(100, h)}%` }} />
              <span className="text-[8px] font-mono text-brand-text-muted">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
