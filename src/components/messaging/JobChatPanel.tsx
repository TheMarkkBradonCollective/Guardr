import React from 'react';
import { JobChatMessage, JobChatThread, SecurityRequest, SessionUser } from '../../types';
import {
  canParticipateInJobChat,
  isJobChatReadOnly,
  messagesForThread,
} from '../../lib/jobChat';
import { ChatThreadPanel } from './ChatThreadPanel';
import { AppChatHeader } from '../ui/app/AppPrimitives';

interface JobChatPanelProps {
  request: Pick<SecurityRequest, 'id' | 'status' | 'clientId' | 'assignedGuardId' | 'title' | 'siteName' | 'location'>;
  thread: JobChatThread | null;
  messages: JobChatMessage[];
  currentUser: SessionUser;
  onSend: (body: string) => void | Promise<void>;
  onBack?: () => void;
  compact?: boolean;
  hideBackOnDesktop?: boolean;
}

export function JobChatPanel({
  request,
  thread,
  messages,
  currentUser,
  onSend,
  onBack,
  compact = false,
  hideBackOnDesktop = false,
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

  const headerSubtitle = readOnly
    ? 'Archived — chat history only'
    : [request.location, 'Staff may monitor or reply'].filter(Boolean).join(' · ');

  return (
    <div className={`flex flex-col ${compact ? 'h-[420px]' : 'h-full'} min-h-0 bg-brand-bg`}>
      {!compact && onBack && (
        <AppChatHeader
          title={request.title}
          subtitle={headerSubtitle}
          onBack={onBack}
          hideBackOnDesktop={hideBackOnDesktop}
        />
      )}
      <ChatThreadPanel
        messages={threadMessages}
        currentUserId={currentUser.id}
        onSend={onSend}
        placeholder="Message about this job…"
        readOnly={readOnly || !canChat}
        readOnlyMessage="Job chat is closed. Contact support if you need help."
      />
    </div>
  );
}
