import React, { useMemo } from 'react';
import {
  buildDirectorFinancialCells,
  buildDirectorOperationsLines,
  computeOperationalFinancials,
  formatOperationalMoney,
} from '../../lib/operationalFinancials';
import { computeAnalytics, computePlatformStats, computeWeeklyCompletedJobs } from '../../lib/staffOps';
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
  const financials = useMemo(() => computeOperationalFinancials(requests), [requests]);
  const weeklyTrend = computeWeeklyCompletedJobs(requests);
  const hasWeeklyData = weeklyTrend.some((h) => h > 0);
  const stats = useMemo(() => computePlatformStats(guards, clients, requests), [guards, clients, requests]);
  const operationsLines = useMemo(
    () => buildDirectorOperationsLines(stats, financials, guards, clients, requests),
    [stats, financials, guards, clients, requests]
  );

  const metrics = [
    ...(showFinancials
      ? [
          { label: 'Gross Income', value: formatOperationalMoney(financials.grossIncome), pct: null },
          { label: 'Company Payout', value: formatOperationalMoney(financials.platformFeesCollected), pct: null },
          { label: 'Guard Payouts', value: formatOperationalMoney(financials.guardPayoutsPaid), pct: null },
          { label: 'Outstanding', value: formatOperationalMoney(financials.clientOwed + financials.guardPayoutsDue + financials.stripeDepositPending), pct: null },
        ]
      : []),
    { label: 'Active Guards', value: String(data.activeGuards), pct: null },
    { label: 'Registered Clients', value: String(data.clientGrowth), pct: null },
    { label: 'Repeat Clients', value: String(data.repeatClients), pct: null },
    { label: 'Job Completion Rate', value: `${data.jobCompletionRate}%`, pct: data.jobCompletionRate },
    { label: 'Client incident rate', value: `${data.incidentRate}%`, pct: data.incidentRate },
    ...(showFinancials
      ? [{ label: 'Avg Guard Earnings / Job', value: formatOperationalMoney(data.avgGuardEarnings), pct: null }]
      : []),
  ];

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-5">
      {showFinancials && (
        <div className="px-4 sm:px-5 pb-5 border-b border-brand-border space-y-4">
          <WfSectionHeader title="Financial breakdown" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {buildDirectorFinancialCells(financials).map(({ label, value, sub }) => (
              <div key={label} className="staff-summary-cell">
                <p className="text-[11px] font-medium uppercase tracking-wide text-brand-text-muted">{label}</p>
                <p className="text-lg font-bold mt-1">{value}</p>
                <p className="text-xs text-brand-text-muted mt-0.5 leading-snug">{sub}</p>
              </div>
            ))}
          </div>
          <div className="staff-overview-empty-card !items-start mt-2">
            <ul className="space-y-2 w-full">
              {operationsLines.map((line) => (
                <li key={line.label} className="flex flex-col sm:flex-row sm:gap-4 text-sm">
                  <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-brand-text-muted sm:w-36">
                    {line.label}
                  </span>
                  <span className="leading-snug">{line.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-brand-border">
        {metrics.map(({ label, value, pct }) => (
          <div key={label} className="p-4 border-b border-r border-brand-border">
            <WfMetricTile label={label} value={value} accent={pct != null} />
            {pct != null && (
              <div className="mt-2 h-1.5 rounded-full bg-brand-border overflow-hidden">
                <div className="h-full bg-brand-primary rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="staff-analytics-chart">
        <h2 className="text-sm font-semibold mb-4">Completed Jobs Trend</h2>
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
