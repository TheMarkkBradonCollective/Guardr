import React from 'react';
import { JobChatMessage, JobChatThread, SecurityRequest, SessionUser } from '../../types';
import {
  canParticipateInJobChat,
  isJobChatReadOnly,
  messagesForThread,
} from '../../lib/jobChat';
import { ChatThreadPanel } from './ChatThreadPanel';
import { ArrowLeft } from 'lucide-react';

interface JobChatPanelProps {
  request: Pick<SecurityRequest, 'id' | 'status' | 'clientId' | 'assignedGuardId' | 'title' | 'siteName' | 'location'>;
  thread: JobChatThread | null;
  messages: JobChatMessage[];
  currentUser: SessionUser;
  onSend: (body: string) => void | Promise<void>;
  onBack?: () => void;
  compact?: boolean;
}

export function JobChatPanel({
  request,
  thread,
  messages,
  currentUser,
  onSend,
  onBack,
  compact = false,
}: JobChatPanelProps) {
  const canChat = canParticipateInJobChat(currentUser, request);
  const readOnly = isJobChatReadOnly(request) || thread?.status === 'archived';
  const threadMessages = thread ? messagesForThread(messages, thread.id) : [];

  if (!canChat && !readOnly) {
    return (
      <p className="text-sm text-brand-text-muted text-center py-8 px-4">
        Job chat opens once a guard is assigned and the job is active.
      </p>
    );
  }

  const headerNote = readOnly
    ? 'This job is complete — chat history is archived for your records.'
    : 'Staff may monitor this chat and chime in if needed.';

  return (
    <div className={`flex flex-col ${compact ? 'h-[420px]' : 'h-full'} min-h-0 bg-brand-bg`}>
      {!compact && onBack && (
        <div className="shrink-0 flex items-center gap-2 px-3 pt-2 pb-3 border-b border-brand-border">
          <button type="button" onClick={onBack} className="p-2 -ml-2 text-brand-text" aria-label="Back">
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">Job chat — {request.title}</p>
            <p className="text-xs text-brand-text-muted truncate">{request.location}</p>
          </div>
        </div>
      )}
      <ChatThreadPanel
        messages={threadMessages}
        currentUserId={currentUser.id}
        onSend={onSend}
        placeholder="Message about this job…"
        readOnly={readOnly || !canChat}
        readOnlyMessage="Job chat is closed. Contact support if you need help."
        headerNote={headerNote}
      />
    </div>
  );
}
