import React from 'react';
import { SecurityRequest, SessionUser, TeamChatMessage, TeamChatThread } from '../../types';
import {
  canParticipateInTeamChat,
  isTeamChatReadOnly,
  messagesForTeamThread,
  teamChatRosterLabel,
} from '../../lib/teamChat';
import { ChatThreadPanel } from './ChatThreadPanel';
import { AppChatHeader } from '../ui/app/AppPrimitives';

interface TeamChatPanelProps {
  request: Pick<SecurityRequest, 'id' | 'status' | 'title' | 'siteName' | 'location' | 'guardSlots' | 'guardsNeeded'>;
  thread: TeamChatThread | null;
  messages: TeamChatMessage[];
  currentUser: SessionUser;
  onSend: (body: string) => void | Promise<void>;
  onBack?: () => void;
  compact?: boolean;
  hideBackOnDesktop?: boolean;
  hideShellHeader?: boolean;
}

export function TeamChatPanel({
  request,
  thread,
  messages,
  currentUser,
  onSend,
  onBack,
  compact = false,
  hideBackOnDesktop = false,
  hideShellHeader = false,
}: TeamChatPanelProps) {
  const canChat = canParticipateInTeamChat(currentUser, request);
  const readOnly = isTeamChatReadOnly(request) || thread?.status === 'archived';
  const threadMessages = thread ? messagesForTeamThread(messages, thread.id) : [];

  if (!canChat && !readOnly) {
    return (
      <p className="text-sm text-brand-text-muted text-center py-8 px-4">
        Team chat opens once you join a multi-guard crew for this job.
      </p>
    );
  }

  return (
    <div className={`flex flex-col ${compact ? 'h-[420px]' : 'h-full'} min-h-0 bg-brand-bg`}>
      {!compact && onBack && !hideShellHeader && (
        <AppChatHeader
          title={`${request.title} · Team`}
          subtitle={readOnly ? 'Archived' : teamChatRosterLabel(request)}
          onBack={onBack}
          hideBackOnDesktop={hideBackOnDesktop}
        />
      )}
      <ChatThreadPanel
        messages={threadMessages}
        currentUserId={currentUser.id}
        onSend={onSend}
        placeholder="Message your crew…"
        readOnly={readOnly || !canChat}
        readOnlyMessage="Team chat is closed for this job."
        teamChat
      />
    </div>
  );
}
