import React, { useEffect, useState } from 'react';
import { OpsActivityItem, PlatformStats } from '../../lib/staffOps';
import { WfMetricTile, WfSectionHeader } from '../ui/wireframe';

interface StaffOverviewProps {
  stats: PlatformStats;
  initialFeed: OpsActivityItem[];
}

export function StaffOverview({ stats, initialFeed }: StaffOverviewProps) {
  const [feed, setFeed] = useState(initialFeed);

  useEffect(() => {
    setFeed(initialFeed);
    const interval = setInterval(() => {
      setFeed((prev) => {
        const rotated = [...prev];
        if (rotated.length > 1) {
          const last = rotated.pop()!;
          rotated.unshift({ ...last, sortKey: Date.now(), timestamp: new Date().toISOString() });
        }
        return rotated;
      });
    }, 12000);
    return () => clearInterval(interval);
  }, [initialFeed]);

  const statusCards = [
    {
      emoji: stats.platformHealthy ? '🟢' : '🟡',
      label: stats.platformHealthy ? 'Platform Healthy' : 'Attention Needed',
      sub: stats.platformHealthy ? 'All systems nominal' : 'Review pending items',
      className: stats.platformHealthy ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5',
    },
    { emoji: '🟡', label: `Pending Reviews: ${stats.pendingReviews}`, sub: 'Credential verification & legacy job queue', className: 'border-amber-500/30 bg-amber-500/5' },
    { emoji: '📋', label: `Client incidents: ${stats.activeIncidents}`, sub: 'Filed to clients — view only', className: 'border-slate-500/30 bg-slate-500/5' },
    { emoji: '⚠️', label: `Payment Holds: ${stats.paymentHolds}`, sub: 'Pending release', className: 'border-orange-500/30 bg-orange-500/5' },
  ];

  const snapshot = [
    { label: 'Active Jobs', value: stats.activeJobs },
    { label: 'On-Duty Guards', value: stats.onDutyGuards },
    { label: 'Clients Active', value: stats.activeClients },
    { label: 'Credentials to verify', value: stats.pendingApprovals },
    { label: 'Completed Shifts', value: stats.completedShiftsToday },
  ];

  return (
    <div className="space-y-8 max-w-6xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-brand-text-muted mt-1">Real-time platform pulse</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {statusCards.map((card) => (
          <div key={card.label} className={`rounded-xl border p-4 ${card.className}`}>
            <p className="text-2xl">{card.emoji}</p>
            <p className="font-semibold text-sm mt-2">{card.label}</p>
            <p className="text-xs text-brand-text-muted mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-xl border border-brand-border bg-brand-bg-sec">
          <div className="px-4 py-3 border-b border-brand-border">
            <WfSectionHeader
              title="Live Activity Feed"
              className="mb-0"
            />
            <span className="text-xs text-brand-primary animate-pulse">● Live</span>
          </div>
          <div className="divide-y divide-brand-border max-h-80 overflow-y-auto">
            {feed.map((item) => (
              <div key={item.id} className="px-4 py-3 flex gap-3 text-sm">
                <span className="text-brand-primary shrink-0">•</span>
                <div>
                  <p>{item.message}</p>
                  <p className="text-xs text-brand-text-muted mt-0.5">
                    {new Date(item.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-brand-border bg-brand-bg-sec p-4">
          <WfSectionHeader title="Today Snapshot" className="mb-4" />
          <div className="grid grid-cols-2 gap-2">
            {snapshot.map(({ label, value }) => (
              <WfMetricTile key={label} label={label} value={value} accent />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
