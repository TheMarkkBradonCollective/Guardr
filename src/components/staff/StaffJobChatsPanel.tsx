import React, { useEffect, useMemo, useState } from 'react';
import {
  JobChatMessage,
  JobChatThread,
  SecurityGuard,
  SecurityRequest,
  SessionUser,
} from '../../types';
import { messagesForThread, threadForRequest } from '../../lib/jobChat';
import { JobChatPanel } from '../messaging/JobChatPanel';
import { AppItemCard, AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfBadge } from '../ui/wireframe';
import { MessageCircle } from 'lucide-react';

interface StaffJobChatsPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  threads: JobChatThread[];
  messages: JobChatMessage[];
  currentUser: SessionUser;
  onSendJobChat: (requestId: string, body: string) => void | Promise<void>;
  selectedRequestId?: string | null;
  onSelectedRequestIdChange?: (requestId: string | null) => void;
  initialSelectedRequestId?: string | null;
}

export function StaffJobChatsPanel({
  requests,
  guards,
  threads,
  messages,
  currentUser,
  onSendJobChat,
  selectedRequestId: controlledSelectedId,
  onSelectedRequestIdChange,
  initialSelectedRequestId = null,
}: StaffJobChatsPanelProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(initialSelectedRequestId);
  const selectedRequestId = controlledSelectedId ?? internalSelectedId;

  const setSelectedRequestId = (requestId: string | null) => {
    if (controlledSelectedId === undefined) setInternalSelectedId(requestId);
    onSelectedRequestIdChange?.(requestId);
  };

  useEffect(() => {
    if (initialSelectedRequestId) {
      setSelectedRequestId(initialSelectedRequestId);
    }
  }, [initialSelectedRequestId]);

  const activeJobs = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.assignedGuardId &&
          (r.status === 'accepted' || r.status === 'in-progress')
      ),
    [requests]
  );

  const archivedJobs = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.assignedGuardId &&
          (r.status === 'completed' || r.status === 'closed') &&
          threadForRequest(threads, r.id)
      ),
    [requests, threads]
  );

  const selectedRequest = activeJobs.find((r) => r.id === selectedRequestId)
    ?? archivedJobs.find((r) => r.id === selectedRequestId)
    ?? null;

  const selectedThread = selectedRequest
    ? threadForRequest(threads, selectedRequest.id) ?? null
    : null;


  const renderJobCard = (job: SecurityRequest) => {
    const guard = guards.find((g) => g.id === job.assignedGuardId);
    const thread = threadForRequest(threads, job.id);
    const count = thread ? messagesForThread(messages, thread.id).length : 0;
    const active = job.status === 'accepted' || job.status === 'in-progress';
    return (
      <AppItemCard
        key={job.id}
        selected={selectedRequestId === job.id}
        onClick={() => setSelectedRequestId(job.id)}
        className="flex-col !items-stretch gap-1"
      >
        <p className="font-semibold text-sm truncate">{job.title}</p>
        <p className="text-xs text-brand-text-muted truncate">
          {job.clientName} ↔ {guard?.name ?? 'Guard'}
        </p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          <WfBadge tone={active ? 'primary' : 'default'}>
            {active ? 'Live' : 'Archived'}
          </WfBadge>
          {count > 0 && <WfBadge tone="default">{count} msg{count === 1 ? '' : 's'}</WfBadge>}
        </div>
      </AppItemCard>
    );
  };

  const listView = (
    <div className="staff-split-pane-list">
      <div className="staff-pane-header">
        <h2 className="font-bold text-sm">Job chats</h2>
        <p className="text-xs text-brand-text-muted mt-1">
          Each job has its own conversation. Select one to monitor or reply.
        </p>
      </div>
      <div className="staff-pane-body p-3">
        {activeJobs.length === 0 && archivedJobs.length === 0 ? (
          <p className="staff-empty-state">No job chats yet.</p>
        ) : (
          <div className="space-y-4">
            {activeJobs.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted mb-2 px-1">
                  Active jobs
                </p>
                <AppItemCardStack>{activeJobs.map(renderJobCard)}</AppItemCardStack>
              </div>
            )}
            {archivedJobs.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted mb-2 px-1">
                  Archived
                </p>
                <AppItemCardStack>{archivedJobs.map(renderJobCard)}</AppItemCardStack>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const detailView = selectedRequest ? (
    <JobChatPanel
      request={selectedRequest}
      thread={selectedThread}
      messages={messages}
      currentUser={currentUser}
      onSend={(body) => onSendJobChat(selectedRequest.id, body)}
      onBack={() => setSelectedRequestId(null)}
    />
  ) : (
    <div className="staff-empty-state flex-1 flex items-center justify-center">
      <div>
        <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
        Select a job chat to monitor or reply.
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden h-full flex flex-col min-h-0">
        {selectedRequest ? detailView : listView}
      </div>

      <div className="hidden lg:flex staff-split-pane h-full">
        {listView}
        <div className="staff-split-pane-detail flex flex-col min-h-0">{detailView}</div>
      </div>
    </>
  );
}
