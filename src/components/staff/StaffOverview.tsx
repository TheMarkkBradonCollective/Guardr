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
    { emoji: '🟡', label: `Pending Reviews: ${stats.pendingReviews}`, sub: 'Credential verification & legacy job queue' },
    { emoji: '📋', label: `Client incidents: ${stats.activeIncidents}`, sub: 'Filed to clients — view only' },
    { emoji: '⚠️', label: `Payment Holds: ${stats.paymentHolds}`, sub: 'Pending release' },
  ];

  const snapshot = [
    { label: 'Active Jobs', value: stats.activeJobs },
    { label: 'On-Duty Guards', value: stats.onDutyGuards },
    { label: 'Clients Active', value: stats.activeClients },
    { label: 'Credentials to verify', value: stats.pendingApprovals },
    { label: 'Completed Shifts', value: stats.completedShiftsToday },
  ];

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-5">
      <div className="staff-status-strip">
        {statusItems.map((item) => (
          <div key={item.label} className="staff-status-item">
            <p className="text-xl leading-none">{item.emoji}</p>
            <p className="font-semibold text-sm mt-2">{item.label}</p>
            <p className="text-xs text-brand-text-muted mt-1">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
        <div className="lg:col-span-3 staff-feed-panel">
          <div className="staff-feed-header">
            <h2 className="text-sm font-semibold">Live Activity Feed</h2>
            <span className="text-xs text-brand-primary animate-pulse">● Live</span>
          </div>
          <div className="staff-feed-list">
            {feed.map((item) => (
              <div key={item.id} className="staff-feed-row">
                <span className="text-brand-primary shrink-0">•</span>
                <div className="min-w-0">
                  <p>{item.message}</p>
                  <p className="text-xs text-brand-text-muted mt-0.5">
                    {new Date(item.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 border-t lg:border-t-0 lg:border-l border-brand-border">
          <div className="staff-feed-header">
            <h2 className="text-sm font-semibold">Today Snapshot</h2>
          </div>
          <div className="staff-snapshot-grid">
            {snapshot.map(({ label, value }) => (
              <div key={label} className="staff-snapshot-cell">
                <WfMetricTile label={label} value={value} accent />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
