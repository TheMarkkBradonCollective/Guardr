import React, { useMemo, useState } from 'react';
import { JobChatMessage, JobChatThread, SecurityGuard, SecurityRequest, SessionUser } from '../../types';
import { isJobChatEligible, isJobChatReadOnly, threadForRequest, threadsForClient } from '../../lib/jobChat';
import { guardForRequest } from '../../lib/clientShift';
import { JobChatPanel } from '../messaging/JobChatPanel';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { AppItemCard, AppItemCardStack, AppPageLead, AppScreen, AppSection } from '../ui/app/AppPrimitives';
import { WfBadge } from '../ui/wireframe';
import { MessageCircle } from 'lucide-react';

interface ClientMessagesPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  currentUser: SessionUser;
  jobChatThreads: JobChatThread[];
  jobChatMessages: JobChatMessage[];
  onSendJobChatMessage: (requestId: string, body: string) => void | Promise<void>;
  initialChatRequestId?: string | null;
  initialChatOpen?: boolean;
  onChatRequestIdChange?: (requestId: string | null) => void;
  onChatOpenChange?: (open: boolean) => void;
}

export function ClientMessagesPanel({
  requests,
  guards,
  currentUser,
  jobChatThreads,
  jobChatMessages,
  onSendJobChatMessage,
  initialChatRequestId = null,
  initialChatOpen = false,
  onChatRequestIdChange,
  onChatOpenChange,
}: ClientMessagesPanelProps) {
  const [chatRequestId, setChatRequestId] = useState<string | null>(initialChatRequestId);
  const [chatOpen, setChatOpen] = useState(initialChatOpen);

  const clientThreads = useMemo(
    () => threadsForClient(jobChatThreads, currentUser.id),
    [jobChatThreads, currentUser.id]
  );

  const activeThreads = useMemo(
    () => clientThreads.filter((t) => t.status === 'active'),
    [clientThreads]
  );

  const archivedThreads = useMemo(
    () => clientThreads.filter((t) => t.status === 'archived'),
    [clientThreads]
  );

  const requestById = useMemo(() => new Map(requests.map((r) => [r.id, r])), [requests]);

  const openChat = (requestId: string) => {
    setChatRequestId(requestId);
    setChatOpen(true);
    onChatRequestIdChange?.(requestId);
    onChatOpenChange?.(true);
  };

  const closeChat = () => {
    setChatOpen(false);
    setChatRequestId(null);
    onChatRequestIdChange?.(null);
    onChatOpenChange?.(false);
  };

  const chatRequest = chatRequestId ? requestById.get(chatRequestId) ?? null : null;

  if (chatOpen && chatRequest) {
    return (
      <div className="h-full flex flex-col min-h-0">
        <JobChatPanel
          request={chatRequest}
          thread={threadForRequest(jobChatThreads, chatRequest.id) ?? null}
          messages={jobChatMessages}
          currentUser={currentUser}
          onSend={(body) => onSendJobChatMessage(chatRequest.id, body)}
          onBack={closeChat}
        />
      </div>
    );
  }

  const renderThreadRow = (thread: JobChatThread) => {
    const req = requestById.get(thread.requestId);
    if (!req) return null;
    const guard = guardForRequest(guards, req);
    const eligible = isJobChatEligible(req);
    const readOnly = isJobChatReadOnly(req) || thread.status === 'archived';
    const lastMessage = [...jobChatMessages]
      .filter((m) => m.threadId === thread.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    return (
      <AppItemCard key={thread.id} onClick={() => openChat(req.id)} className="!items-start gap-3">
        <ProfileAvatar
          src={guard?.avatar}
          name={guard?.name ?? 'Guard'}
          size="md"
          className="shrink-0"
        />
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold truncate">{req.title}</p>
            <WfBadge tone={eligible ? 'primary' : readOnly ? 'default' : 'success'}>
              {eligible ? 'Live' : readOnly ? 'Archived' : 'Active'}
            </WfBadge>
          </div>
          <p className="text-sm text-brand-text-muted mt-0.5 truncate">
            {guard?.name ?? 'Assigned guard'} · {req.siteName || req.location}
          </p>
          {lastMessage ? (
            <p className="text-xs text-brand-text-muted mt-2 line-clamp-2">{lastMessage.body}</p>
          ) : (
            <p className="text-xs text-brand-primary mt-2">Open conversation</p>
          )}
        </div>
        <MessageCircle className="w-4 h-4 shrink-0 text-brand-text-muted" />
      </AppItemCard>
    );
  };

  const eligibleWithoutThread = requests.filter(
    (r) =>
      r.clientId === currentUser.id &&
      isJobChatEligible(r) &&
      !threadForRequest(jobChatThreads, r.id)
  );

  return (
    <AppScreen>
      <AppPageLead
        kicker="Job messaging"
        subtitle="Chat with guards on active shifts"
        title="Messages"
      />

      {eligibleWithoutThread.length > 0 && (
        <AppSection title="Ready to message">
          <AppItemCardStack>
            {eligibleWithoutThread.map((req) => {
              const guard = guardForRequest(guards, req);
              return (
                <AppItemCard key={req.id} onClick={() => openChat(req.id)} className="!items-start gap-3">
                  <ProfileAvatar src={guard?.avatar} name={guard?.name ?? 'Guard'} size="md" className="shrink-0" />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-semibold truncate">{req.title}</p>
                    <p className="text-sm text-brand-text-muted mt-0.5">{guard?.name ?? 'Your guard'} is assigned</p>
                    <p className="text-xs text-brand-primary mt-2">Start conversation</p>
                  </div>
                </AppItemCard>
              );
            })}
          </AppItemCardStack>
        </AppSection>
      )}

      <AppSection title="Active conversations">
        {activeThreads.length === 0 ? (
          <p className="app-empty-state">
            When a guard is assigned and your shift is live, conversations appear here.
          </p>
        ) : (
          <AppItemCardStack>{activeThreads.map(renderThreadRow)}</AppItemCardStack>
        )}
      </AppSection>

      {archivedThreads.length > 0 && (
        <AppSection title="Past job chats">
          <AppItemCardStack>{archivedThreads.map(renderThreadRow)}</AppItemCardStack>
        </AppSection>
      )}
    </AppScreen>
  );
}
