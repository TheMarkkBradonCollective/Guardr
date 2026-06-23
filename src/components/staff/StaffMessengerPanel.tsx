import React, { useEffect } from 'react';
import { SessionUser, StaffMessage } from '../../types';
import { sortedStaffMessages } from '../../lib/staffMessenger';
import { ChatThreadPanel } from '../messaging/ChatThreadPanel';

interface StaffMessengerPanelProps {
  messages: StaffMessage[];
  currentUser: SessionUser;
  onSend: (body: string) => void | Promise<void>;
  onRefresh?: () => void | Promise<void>;
}

export function StaffMessengerPanel({
  messages,
  currentUser,
  onSend,
  onRefresh,
}: StaffMessengerPanelProps) {
  useEffect(() => {
    if (!onRefresh) return;
    void onRefresh();
    const interval = setInterval(() => {
      void onRefresh();
    }, 3000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  return (
    <div className="staff-split-pane-detail flex flex-col min-h-[420px] h-full">
      <div className="flex-1 min-h-0">
        <ChatThreadPanel
          messages={sortedStaffMessages(messages)}
          currentUserId={currentUser.id}
          onSend={onSend}
          placeholder="Message the Guardr team…"
          staffChatLabels
        />
      </div>
    </div>
  );
}
