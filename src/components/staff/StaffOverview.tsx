import React, { useEffect, useState } from 'react';
import { OpsActivityItem, PlatformStats } from '../../lib/staffOps';
import { WfMetricTile } from '../ui/wireframe';

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

  const statusItems = [
    {
      emoji: stats.platformHealthy ? '🟢' : '🟡',
      label: stats.platformHealthy ? 'Platform Healthy' : 'Attention Needed',
      sub: stats.platformHealthy ? 'All systems nominal' : 'Review pending items',
    },
    { emoji: '🟡', label: `Pending: ${stats.pendingReviews}`, sub: 'Credentials & job queue' },
    { emoji: '📋', label: `Incidents: ${stats.activeIncidents}`, sub: 'Client view only' },
    { emoji: '⚠️', label: `Holds: ${stats.paymentHolds}`, sub: 'Pending release' },
  ];

  const snapshot = [
    { label: 'Active Jobs', value: stats.activeJobs },
    { label: 'On-Duty Guards', value: stats.onDutyGuards },
    { label: 'Clients Active', value: stats.activeClients },
    { label: 'To verify', value: stats.pendingApprovals },
    { label: 'Shifts today', value: stats.completedShiftsToday },
  ];

  return (
    <div className="staff-overview h-full min-h-0 flex flex-col overflow-hidden">
      <div className="staff-status-strip shrink-0">
        {statusItems.map((item) => (
          <div key={item.label} className="staff-status-item">
            <p className="text-lg leading-none">{item.emoji}</p>
            <p className="font-semibold text-xs sm:text-sm mt-1.5 leading-tight">{item.label}</p>
            <p className="text-[10px] sm:text-xs text-brand-text-muted mt-0.5 line-clamp-2">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="staff-overview-body flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 overflow-hidden">
        <section className="staff-feed-panel lg:col-span-3 flex flex-col min-h-0 overflow-hidden">
          <div className="staff-feed-header shrink-0">
            <h2 className="text-sm font-semibold">Live Activity Feed</h2>
            <span className="text-xs text-brand-primary animate-pulse">● Live</span>
          </div>
          <div className="staff-feed-list flex-1 min-h-0 overflow-hidden">
            {feed.map((item) => (
              <div key={item.id} className="staff-feed-row">
                <span className="text-brand-primary shrink-0">•</span>
                <div className="min-w-0">
                  <p className="text-sm leading-snug line-clamp-2">{item.message}</p>
                  <p className="text-xs text-brand-text-muted mt-0.5">
                    {new Date(item.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="staff-snapshot-panel lg:col-span-2 flex flex-col min-h-0 overflow-hidden border-t lg:border-t-0 lg:border-l border-brand-border">
          <div className="staff-feed-header shrink-0">
            <h2 className="text-sm font-semibold">Today Snapshot</h2>
          </div>
          <div className="staff-snapshot-grid flex-1 min-h-0">
            {snapshot.map(({ label, value }) => (
              <div key={label} className="staff-snapshot-cell">
                <WfMetricTile label={label} value={value} accent className="!p-0 !bg-transparent !border-0 !shadow-none" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
