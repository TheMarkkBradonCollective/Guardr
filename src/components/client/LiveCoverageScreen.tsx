import React from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import {
  ActivityFeedItem,
  buildActivityFeed,
  buildGuardRows,
  computeSiteStatus,
  SiteStatusLevel,
} from '../../lib/clientCoverage';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { ArrowLeft } from 'lucide-react';

interface LiveCoverageScreenProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  onBack: () => void;
}

const SITE_STATUS_CONFIG: Record<
  SiteStatusLevel,
  { emoji: string; label: string; className: string }
> = {
  secured: { emoji: '🟢', label: 'Site Secured', className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  attention: { emoji: '🟡', label: 'Attention Needed', className: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
  incident: { emoji: '🔴', label: 'Incident Reported', className: 'border-red-500/40 bg-red-500/10 text-red-400' },
};

function formatFeedTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatStartedTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function LiveCoverageScreen({ requests, guards, onBack }: LiveCoverageScreenProps) {
  const liveRequests = requests.filter((r) => r.status === 'in-progress' || r.status === 'accepted');
  const guardRows = buildGuardRows(liveRequests, guards);
  const feed = buildActivityFeed(liveRequests, guards);
  const siteStatus = computeSiteStatus(requests);
  const statusCfg = SITE_STATUS_CONFIG[siteStatus];

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-8">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-brand-surface" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black">Live Coverage</h1>
          <p className="text-xs font-mono text-brand-text-muted uppercase tracking-wide">Security Operations Dashboard</p>
        </div>
      </div>

      {/* Site Status */}
      <div className={`rounded-2xl border p-6 text-center ${statusCfg.className}`}>
        <p className="text-4xl mb-2">{statusCfg.emoji}</p>
        <p className="text-lg font-black uppercase tracking-wide">{statusCfg.label}</p>
      </div>

      {/* Active Guards */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-widest text-brand-text-muted mb-3">Active Guards</h2>
        {guardRows.length === 0 ? (
          <div className="uber-card-flat rounded-2xl p-8 text-center text-sm text-brand-text-muted font-mono">
            No guards currently assigned to active coverage.
          </div>
        ) : (
          <div className="space-y-3">
            {guardRows.map(({ guard, request, startedAt, hoursWorkedLabel, status }) => (
              <div key={`${request.id}-${guard.id}`} className="uber-card-flat rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <ProfileAvatar src={guard.avatar} name={guard.name} size="sm" className="border border-brand-border" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono">{status === 'on-duty' ? '🟢 On Duty' : '🟡 Arriving'}</span>
                      <span className="font-black text-sm">{guard.name}</span>
                    </div>
                    <p className="text-xs text-brand-text-muted font-mono mt-1 truncate">{request.title}</p>
                    {status === 'on-duty' ? (
                      <>
                        <p className="text-[11px] font-mono text-brand-text-muted mt-2">
                          Started {formatStartedTime(startedAt)}
                        </p>
                        <p className="text-sm font-black text-brand-primary mt-0.5">
                          Hours worked: {hoursWorkedLabel}
                        </p>
                      </>
                    ) : (
                      <p className="text-[11px] font-mono text-brand-text-muted mt-2">
                        Scheduled {formatStartedTime(request.startDate)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Activity Feed */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-widest text-brand-text-muted mb-3">Activity Feed</h2>
        {feed.length === 0 ? (
          <div className="uber-card-flat rounded-2xl p-6 text-sm text-brand-text-muted font-mono">
            Activity from guard check-ins, audits, and reports will stream here in real time.
          </div>
        ) : (
          <div className="space-y-0 border border-brand-border rounded-xl overflow-hidden divide-y divide-brand-border">
            {feed.map((item: ActivityFeedItem) => (
              <div key={item.id} className="flex items-start gap-3 p-4 bg-brand-surface/50">
                <span className="text-brand-primary font-bold text-sm shrink-0">✓</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-[10px] font-mono text-brand-text-muted mt-0.5">{formatFeedTime(item.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
