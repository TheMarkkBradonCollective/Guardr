import React, { useEffect, useState } from 'react';
import { Clock, Users, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { computeSlaMetrics, formatSlaHours } from '../../lib/slaMetrics';
import type { SecurityRequest, SecurityGuard, Client, SupportTicket } from '../../types';
import { useDevice } from '../../lib/platform';
import {
  WorkbenchGrid,
  WorkbenchGridCell,
  WorkbenchPage,
  WorkbenchToolbar,
} from '../baseui/layout/WorkbenchLayout';

interface StaffSlaDashboardProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  clients: Client[];
  tickets?: SupportTicket[];
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'default',
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'warning' | 'success';
}) {
  const toneClass =
    tone === 'warning' ? 'text-amber-500' : tone === 'success' ? 'text-emerald-500' : 'text-brand-primary';
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${toneClass}`} />
        <span className="text-xs font-medium text-brand-text-muted uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-brand-text">{value}</p>
      {sub && <p className="text-xs text-brand-text-muted mt-1">{sub}</p>}
    </div>
  );
}

export function StaffSlaDashboard({ requests, guards, clients, tickets = [] }: StaffSlaDashboardProps) {
  const { formFactor } = useDevice();
  const [metrics, setMetrics] = useState(() => computeSlaMetrics(requests, guards, clients, tickets));

  useEffect(() => {
    setMetrics(computeSlaMetrics(requests, guards, clients, tickets));
  }, [requests, guards, clients, tickets]);

  const metricItems: {
    key: string;
    icon: typeof Clock;
    label: string;
    value: string;
    sub?: string;
    tone?: 'default' | 'warning' | 'success';
  }[] = [
    {
      key: 'approval',
      icon: Clock,
      label: 'Avg approval time',
      value: formatSlaHours(metrics.avgTimeToApproveHours),
      sub: 'Job posting → live',
    },
    {
      key: 'fill',
      icon: TrendingUp,
      label: 'Avg fill time',
      value: formatSlaHours(metrics.avgTimeToFillHours),
      sub: 'Live → accepted',
    },
    {
      key: 'noshow',
      icon: AlertTriangle,
      label: 'No-show rate',
      value: `${(metrics.guardNoShowRate * 100).toFixed(1)}%`,
      tone: metrics.guardNoShowRate > 0.05 ? 'warning' : 'success',
    },
    {
      key: 'completed',
      icon: CheckCircle,
      label: 'Completed this week',
      value: String(metrics.jobsCompletedThisWeek),
    },
    { key: 'guards', icon: Users, label: 'Active guards', value: String(metrics.activeGuardsCount) },
    { key: 'clients', icon: Users, label: 'Active clients', value: String(metrics.activeClientsCount) },
    {
      key: 'pending',
      icon: AlertTriangle,
      label: 'Pending approvals',
      value: String(metrics.pendingApprovalsCount),
      tone: metrics.pendingApprovalsCount > 5 ? 'warning' : 'default',
    },
    { key: 'open', icon: TrendingUp, label: 'Open jobs', value: String(metrics.openJobsCount) },
  ];

  const cards = metricItems.map((item) => (
    <MetricCard
      key={item.key}
      icon={item.icon}
      label={item.label}
      value={item.value}
      sub={item.sub}
      tone={item.tone}
    />
  ));

  if (formFactor === 'desktop') {
    return (
      <WorkbenchPage className="adm-sla-dashboard">
        <WorkbenchToolbar eyebrow="Operations" subtitle="SLA & operations" />
        <WorkbenchGrid>
          {metricItems.map((item) => (
            <WorkbenchGridCell key={item.key} span={3}>
              <MetricCard
                icon={item.icon}
                label={item.label}
                value={item.value}
                sub={item.sub}
                tone={item.tone}
              />
            </WorkbenchGridCell>
          ))}
        </WorkbenchGrid>
      </WorkbenchPage>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-brand-text mb-1">SLA & Operations</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards}
      </div>
    </div>
  );
}
