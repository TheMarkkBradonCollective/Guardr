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
import { AppList, AppListRow } from '../ui/app/AppPrimitives';
import { WfBadge, WfMetricTile, WfSectionHeader } from '../ui/wireframe';
import { ArrowLeft } from 'lucide-react';

interface LiveCoverageScreenProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  onBack: () => void;
}

const SITE_STATUS_CONFIG: Record<
  SiteStatusLevel,
  { emoji: string; label: string; className: string; tone: 'default' | 'primary' | 'success' | 'warning' | 'danger' }
> = {
  secured: { emoji: '🟢', label: 'Site Secured', className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400', tone: 'success' },
  attention: { emoji: '🟡', label: 'Attention Needed', className: 'border-amber-500/40 bg-amber-500/10 text-amber-400', tone: 'warning' },
  incident: { emoji: '🔴', label: 'Incident Reported', className: 'border-red-500/40 bg-red-500/10 text-red-400', tone: 'danger' },
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
          <h1 className="text-xl font-bold">Live Coverage</h1>
          <p className="text-sm text-brand-text-muted">Security Operations Dashboard</p>
        </div>
      </div>

      <div className={`rounded-2xl border p-6 text-center ${statusCfg.className}`}>
        <p className="text-4xl mb-2">{statusCfg.emoji}</p>
        <WfBadge tone={statusCfg.tone} className="!text-base !px-4 !py-1.5">{statusCfg.label}</WfBadge>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <WfMetricTile label="Active guards" value={guardRows.length} accent />
        <WfMetricTile label="Activity events" value={feed.length} />
      </div>

      <section>
        <WfSectionHeader title="Active Guards" count={guardRows.length} />
        {guardRows.length === 0 ? (
          <p className="app-empty-state text-sm">
            No guards currently assigned to active coverage.
          </p>
        ) : (
          <AppList>
            {guardRows.map(({ guard, request, startedAt, hoursWorkedLabel, status }) => (
              <AppListRow key={`${request.id}-${guard.id}`} className="app-list-row-align-top !items-start">
                <ProfileAvatar src={guard.avatar} name={guard.name} size="sm" className="border border-brand-border" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm">{guard.name}</p>
                  <p className="text-sm text-brand-text-muted mt-0.5">{request.title}</p>
                  <div className="space-y-1 mt-2">
                    <WfBadge tone={status === 'on-duty' ? 'success' : 'warning'}>
                      {status === 'on-duty' ? 'On duty' : 'Arriving'}
                    </WfBadge>
                    {status === 'on-duty' ? (
                      <>
                        <p className="text-xs text-brand-text-muted">Started {formatStartedTime(startedAt)}</p>
                        <p className="text-sm font-semibold text-brand-primary">Hours worked: {hoursWorkedLabel}</p>
                      </>
                    ) : (
                      <p className="text-xs text-brand-text-muted">Scheduled {formatStartedTime(request.startDate)}</p>
                    )}
                  </div>
                </div>
              </AppListRow>
            ))}
          </AppList>
        )}
      </section>

      <section>
        <WfSectionHeader title="Activity Feed" count={feed.length} />
        {feed.length === 0 ? (
          <p className="app-empty-state text-sm">
            Activity from guard check-ins, audits, and reports will stream here in real time.
          </p>
        ) : (
          <AppList>
            {feed.map((item: ActivityFeedItem) => (
              <AppListRow key={item.id} className="flex-col !items-stretch gap-0.5">
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-sm text-brand-text-muted">{formatFeedTime(item.timestamp)}</p>
              </AppListRow>
            ))}
          </AppList>
        )}
      </section>
    </div>
  );
}
