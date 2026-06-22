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
import { AppInboxList, AppInboxRow } from '../ui/app/AppPrimitives';
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


  const renderJobRow = (job: SecurityRequest) => {
    const guard = guards.find((g) => g.id === job.assignedGuardId);
    const thread = threadForRequest(threads, job.id);
    const count = thread ? messagesForThread(messages, thread.id).length : 0;
    const active = job.status === 'accepted' || job.status === 'in-progress';
    return (
      <AppInboxRow
        key={job.id}
        title={job.title}
        preview={`${job.clientName} ↔ ${guard?.name ?? 'Guard'}`}
        meta={count > 0 ? `${count} msg${count === 1 ? '' : 's'}` : active ? 'Live' : 'Archived'}
        selected={selectedRequestId === job.id}
        badges={
          <>
            <WfBadge tone={active ? 'primary' : 'default'}>{active ? 'Live' : 'Archived'}</WfBadge>
            {count > 0 && <WfBadge tone="default">{count} messages</WfBadge>}
          </>
        }
        onClick={() => setSelectedRequestId(job.id)}
      />
    );
  };

  const listView = (
    <div className="staff-split-pane-list flex flex-col min-h-0">
      <div className="app-messages-hub-lead">
        <h2 className="text-base font-bold tracking-tight">Job chats</h2>
        <p>Each active job has its own thread. Monitor or reply in real time.</p>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeJobs.length === 0 && archivedJobs.length === 0 ? (
          <p className="staff-empty-state">No job chats yet.</p>
        ) : (
          <div className="space-y-4">
            {activeJobs.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-brand-text-muted px-4 py-2">
                  Active jobs
                </p>
                <AppInboxList>{activeJobs.map(renderJobRow)}</AppInboxList>
              </div>
            )}
            {archivedJobs.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-brand-text-muted px-4 py-2">
                  Archived
                </p>
                <AppInboxList>{archivedJobs.map(renderJobRow)}</AppInboxList>
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
