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

  const chatJobs = useMemo(() => {
    const active = activeJobs.map((job) => ({ job, archived: false }));
    const archived = archivedJobs.map((job) => ({ job, archived: true }));
    return [...active, ...archived];
  }, [activeJobs, archivedJobs]);

  const selectedRequest = chatJobs.find((entry) => entry.job.id === selectedRequestId)?.job ?? null;

  const selectedThread = selectedRequest
    ? threadForRequest(threads, selectedRequest.id) ?? null
    : null;


  const renderJobRow = ({ job, archived }: { job: SecurityRequest; archived: boolean }) => {
    const guard = guards.find((g) => g.id === job.assignedGuardId);
    const thread = threadForRequest(threads, job.id);
    const count = thread ? messagesForThread(messages, thread.id).length : 0;
    return (
      <AppInboxRow
        key={job.id}
        title={job.title}
        preview={`${job.clientName} ↔ ${guard?.name ?? 'Guard'}`}
        meta={count > 0 ? `${count} msg${count === 1 ? '' : 's'}` : archived ? 'Archived' : 'Live'}
        selected={selectedRequestId === job.id}
        badges={<WfBadge tone={archived ? 'default' : 'primary'}>{archived ? 'Archived' : 'Live'}</WfBadge>}
        onClick={() => setSelectedRequestId(job.id)}
      />
    );
  };

  const listView = (
    <div className="staff-split-pane-list flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {chatJobs.length === 0 ? (
          <div className="app-empty-state">
            <div className="app-empty-state-icon"><MessageCircle className="w-5 h-5" /></div>
            <p className="app-empty-state-title">No job chats yet</p>
            <p className="app-empty-state-body">Job chats will appear here as guards and clients message during active shifts.</p>
          </div>
        ) : (
          <AppInboxList>{chatJobs.map(renderJobRow)}</AppInboxList>
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
    <div className="app-empty-state">
      <div className="app-empty-state-icon"><MessageCircle className="w-5 h-5" /></div>
      <p className="app-empty-state-title">No chat selected</p>
      <p className="app-empty-state-body">Select a job chat from the list to monitor or reply.</p>
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
