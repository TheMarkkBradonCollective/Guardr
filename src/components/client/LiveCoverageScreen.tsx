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
import { AppList, AppListRow, AppScreen } from '../ui/app/AppPrimitives';
import { WfBadge, WfMetricTile, WfSectionHeader } from '../ui/wireframe';
import { ClientSelfAuditConfirm } from './ClientSelfAuditConfirm';
import { ClientSpotCheckConfirm } from './ClientSpotCheckConfirm';
import { isJobChatEligible, threadForRequest } from '../../lib/jobChat';
import { JobChatThread } from '../../types';
import { hasSpotChecksForClientReview } from '../../lib/spotChecks';

interface LiveCoverageScreenProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  onConfirmSelfAudit?: (requestId: string) => void | Promise<void>;
  onConfirmSpotCheck?: (requestId: string, spotCheckId: string) => void | Promise<void>;
  jobChatThreads?: JobChatThread[];
  onOpenJobChat?: (requestId: string) => void;
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

export function LiveCoverageScreen({
  requests,
  guards,
  onConfirmSelfAudit,
  onConfirmSpotCheck,
  jobChatThreads = [],
  onOpenJobChat,
}: LiveCoverageScreenProps) {
  const liveRequests = requests.filter((r) => r.status === 'in-progress' || r.status === 'accepted');
  const guardRows = buildGuardRows(liveRequests, guards);
  const feed = buildActivityFeed(liveRequests, guards);
  const siteStatus = computeSiteStatus(requests);
  const statusCfg = SITE_STATUS_CONFIG[siteStatus];

  return (
    <AppScreen className="pb-8">
      <div className={`mx-5 mt-2 rounded-2xl border p-6 text-center ${statusCfg.className}`}>
        <p className="text-4xl mb-2">{statusCfg.emoji}</p>
        <WfBadge tone={statusCfg.tone} className="!text-base !px-4 !py-1.5">{statusCfg.label}</WfBadge>
      </div>

      <div className="grid grid-cols-2 gap-2 px-5 mt-6">
        <WfMetricTile label="Active guards" value={guardRows.length} accent />
        <WfMetricTile label="Activity events" value={feed.length} />
      </div>

      <section className="mt-8">
        <WfSectionHeader title="Active Guards" count={guardRows.length} />
        {guardRows.length === 0 ? (
          <p className="app-empty-state text-sm">
            No guards currently on active coverage.
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
                    {onOpenJobChat && (isJobChatEligible(request) || threadForRequest(jobChatThreads, request.id)) && (
                      <button
                        type="button"
                        onClick={() => onOpenJobChat(request.id)}
                        className="text-xs font-medium text-brand-primary mt-2"
                      >
                        {isJobChatEligible(request) ? 'Message guard' : 'View job chat'}
                      </button>
                    )}
                  </div>
                </div>
              </AppListRow>
            ))}
          </AppList>
        )}
      </section>

      {onConfirmSelfAudit && liveRequests.some((r) => r.checkInAudit) && (
        <section className="mt-8">
          <WfSectionHeader title="Self-audit review" />
          <div className="space-y-4 px-5">
            {liveRequests.filter((r) => r.checkInAudit).map((req) => (
              <div key={req.id} className="staff-detail-pane">
                <p className="text-sm font-semibold mb-2">{req.title}</p>
                <ClientSelfAuditConfirm request={req} onConfirm={onConfirmSelfAudit} />
              </div>
            ))}
          </div>
        </section>
      )}

      {onConfirmSpotCheck && liveRequests.some((r) => hasSpotChecksForClientReview(r)) && (
        <section className="mt-8">
          <WfSectionHeader title="Spot check review" />
          <div className="space-y-4 px-5">
            {liveRequests.filter((r) => hasSpotChecksForClientReview(r)).map((req) => (
              <div key={req.id} className="staff-detail-pane">
                <p className="text-sm font-semibold mb-2">{req.title}</p>
                <ClientSpotCheckConfirm request={req} onConfirm={onConfirmSpotCheck} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
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
    </AppScreen>
  );
}
