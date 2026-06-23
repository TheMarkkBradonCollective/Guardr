import React, { useEffect } from 'react';
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
  onRefresh,
}: GuardMessengerPanelProps) {
  useEffect(() => {
    if (!onRefresh) return;
    void onRefresh();
    const interval = setInterval(() => {
      void onRefresh();
    }, 3000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="shrink-0 px-4 py-3 border-b border-brand-border bg-brand-surface">
        <h2 className="font-bold text-sm">Guard chat</h2>
        <p className="text-xs text-brand-text-muted mt-1">
          Community channel for all Guardr guards — not visible to clients or staff.
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <ChatThreadPanel
          messages={sortedGuardMessages(messages)}
          currentUserId={currentUser.id}
          onSend={onSend}
          placeholder="Message other guards…"
          teamChat
          guardChatLabels
        />
      </div>
    </div>
  );
}
