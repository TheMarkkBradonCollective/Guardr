import React from 'react';
import { SessionUser, GuardMessage } from '../../types';
import { sortedGuardMessages } from '../../lib/guardMessenger';
import { ChatThreadPanel } from '../messaging/ChatThreadPanel';

interface GuardMessengerPanelProps {
  messages: GuardMessage[];
  currentUser: SessionUser;
  onSend: (body: string) => void | Promise<void>;
  onRefresh?: () => void | Promise<void>;
}

export function GuardMessengerPanel({
  messages,
  currentUser,
  onSend,
}: GuardMessengerPanelProps) {
  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex-1 min-h-0">
        <ChatThreadPanel
          messages={sortedGuardMessages(messages)}
          currentUserId={currentUser.id}
          viewerRole={currentUser.role}
          onSend={onSend}
          placeholder="Message other guards…"
          teamChat
          guardChatLabels
        />
      </div>
    </div>
  );
}
