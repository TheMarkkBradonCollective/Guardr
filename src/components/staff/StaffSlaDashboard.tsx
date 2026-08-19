import React, { useEffect, useState } from 'react';
import { Clock, Users, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { computeSlaMetrics, formatSlaHours } from '../../lib/slaMetrics';
import type { SecurityRequest, SecurityGuard, Client, SupportTicket } from '../../types';

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
    tone === 'warning' ? 'text-amber-500' : tone === 'success' ? 'text-emerald-500' : 'uber-text-accent';
  return (
    <article className="staff-sla-metric-card">
      <div className="staff-sla-metric-card-head">
        <Icon className={`staff-sla-metric-card-icon ${toneClass}`} aria-hidden />
        <p className="staff-sla-metric-card-label">{label}</p>
      </div>
      <p className="staff-sla-metric-card-value">{value}</p>
      {sub ? <p className="staff-sla-metric-card-sub">{sub}</p> : null}
    </article>
  );
}

export function StaffSlaDashboard({ requests, guards, clients, tickets = [] }: StaffSlaDashboardProps) {
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
    { key: 'clients', icon: Users, label: 'Active customers', value: String(metrics.activeClientsCount) },
    {
      key: 'pending',
      icon: AlertTriangle,
      label: 'Pending approvals',
      value: String(metrics.pendingApprovalsCount),
      tone: metrics.pendingApprovalsCount > 5 ? 'warning' : 'default',
    },
    { key: 'open', icon: TrendingUp, label: 'Open jobs', value: String(metrics.openJobsCount) },
  ];

  return (
    <div className="staff-sla-dashboard">
      <div className="staff-sla-metric-grid">
        {metricItems.map((item) => (
          <MetricCard
            key={item.key}
            icon={item.icon}
            label={item.label}
            value={item.value}
            sub={item.sub}
            tone={item.tone}
          />
        ))}
      </div>
    </div>
  );
}
