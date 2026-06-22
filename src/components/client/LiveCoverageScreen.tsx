import React, { useState, useEffect } from 'react';
import { JobChatMessage, JobChatThread, SecurityGuard, SecurityRequest, SessionUser } from '../../types';
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
import { ClientSelfAuditConfirm } from './ClientSelfAuditConfirm';
import { ClientSpotCheckConfirm } from './ClientSpotCheckConfirm';
import { JobChatPanel } from '../messaging/JobChatPanel';
import { isJobChatEligible, threadForRequest } from '../../lib/jobChat';
import { hasSpotChecksForClientReview } from '../../lib/spotChecks';
import { ArrowLeft } from 'lucide-react';

interface LiveCoverageScreenProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  onConfirmSelfAudit?: (requestId: string) => void | Promise<void>;
  onConfirmSpotCheck?: (requestId: string, spotCheckId: string) => void | Promise<void>;
  onBack: () => void;
  currentUser?: SessionUser;
  jobChatThreads?: JobChatThread[];
  jobChatMessages?: JobChatMessage[];
  onSendJobChatMessage?: (requestId: string, body: string) => void | Promise<void>;
  initialChatRequestId?: string | null;
  initialChatOpen?: boolean;
  onChatRequestIdChange?: (requestId: string | null) => void;
  onChatOpenChange?: (open: boolean) => void;
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
  onBack,
  currentUser,
  jobChatThreads = [],
  jobChatMessages = [],
  onSendJobChatMessage,
  initialChatRequestId = null,
  initialChatOpen = false,
  onChatRequestIdChange,
  onChatOpenChange,
}: LiveCoverageScreenProps) {
  const [chatRequestId, setChatRequestId] = useState<string | null>(initialChatRequestId);
  const liveRequests = requests.filter((r) => r.status === 'in-progress' || r.status === 'accepted');
  const guardRows = buildGuardRows(liveRequests, guards);
  const feed = buildActivityFeed(liveRequests, guards);
  const siteStatus = computeSiteStatus(requests);
  const statusCfg = SITE_STATUS_CONFIG[siteStatus];

  const chatRequest = chatRequestId ? liveRequests.find((r) => r.id === chatRequestId) ?? null : null;

  useEffect(() => {
    if (!initialChatRequestId) return;
    setChatRequestId(initialChatRequestId);
  }, [initialChatRequestId]);

  useEffect(() => {
    if (initialChatOpen && initialChatRequestId) {
      setChatRequestId(initialChatRequestId);
    }
  }, [initialChatOpen, initialChatRequestId]);

  const openChat = (requestId: string) => {
    setChatRequestId(requestId);
    onChatRequestIdChange?.(requestId);
    onChatOpenChange?.(true);
  };

  const closeChat = () => {
    setChatRequestId(null);
    onChatRequestIdChange?.(null);
    onChatOpenChange?.(false);
  };

  if (chatRequest && currentUser && onSendJobChatMessage) {
    return (
      <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] animate-fade-in pb-8">
        <JobChatPanel
          request={chatRequest}
          thread={threadForRequest(jobChatThreads, chatRequest.id) ?? null}
          messages={jobChatMessages}
          currentUser={currentUser}
          onSend={(body) => onSendJobChatMessage(chatRequest.id, body)}
          onBack={() => closeChat()}
        />
      </div>
    );
  }

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
                    {onSendJobChatMessage && currentUser && (isJobChatEligible(request) || threadForRequest(jobChatThreads, request.id)) && (
                      <button
                        type="button"
                        onClick={() => openChat(request.id)}
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
        <section>
          <WfSectionHeader title="Self-audit review" />
          <div className="space-y-4">
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
        <section>
          <WfSectionHeader title="Spot check review" />
          <div className="space-y-4">
            {liveRequests.filter((r) => hasSpotChecksForClientReview(r)).map((req) => (
              <div key={req.id} className="staff-detail-pane">
                <p className="text-sm font-semibold mb-2">{req.title}</p>
                <ClientSpotCheckConfirm request={req} onConfirm={onConfirmSpotCheck} />
              </div>
            ))}
          </div>
        </section>
      )}

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
