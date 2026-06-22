import React, { useEffect, useState } from 'react';
import { SessionUser, StaffMessage } from '../../types';
import { StaffJobChatsPanel } from './StaffJobChatsPanel';
import { StaffMessengerPanel } from './StaffMessengerPanel';
import {
  JobChatMessage,
  JobChatThread,
  SecurityGuard,
  SecurityRequest,
} from '../../types';

interface StaffMessagesHubProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  jobChatThreads: JobChatThread[];
  jobChatMessages: JobChatMessage[];
  staffMessages: StaffMessage[];
  currentUser: SessionUser;
  onSendStaffMessage: (body: string) => void | Promise<void>;
  onRefreshStaffMessages?: () => void | Promise<void>;
  onSendJobChat: (requestId: string, body: string) => void | Promise<void>;
  initialTab?: 'team' | 'jobs';
  onTabChange?: (tab: 'team' | 'jobs') => void;
  selectedJobChatRequestId?: string | null;
  onSelectedJobChatRequestIdChange?: (requestId: string | null) => void;
}

export function StaffMessagesHub({
  requests,
  guards,
  jobChatThreads,
  jobChatMessages,
  staffMessages,
  currentUser,
  onSendStaffMessage,
  onRefreshStaffMessages,
  onSendJobChat,
  initialTab = 'team',
  onTabChange,
  selectedJobChatRequestId,
  onSelectedJobChatRequestIdChange,
}: StaffMessagesHubProps) {
  const [tab, setTab] = useState<'team' | 'jobs'>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const changeTab = (next: 'team' | 'jobs') => {
    setTab(next);
    onTabChange?.(next);
    if (next === 'team') {
      onSelectedJobChatRequestIdChange?.(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 flex uber-tab-bar border-b border-brand-border">
        {(['team', 'jobs'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => changeTab(id)}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === id
                ? 'border-brand-primary text-brand-text bg-brand-bg'
                : 'border-transparent text-brand-text-muted hover:text-brand-text hover:bg-brand-bg-sec'
            }`}
          >
            {id === 'team' ? 'Staff team chat' : 'Job chats'}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0">
        {tab === 'team' ? (
          <StaffMessengerPanel
            messages={staffMessages}
            currentUser={currentUser}
            onSend={onSendStaffMessage}
            onRefresh={onRefreshStaffMessages}
          />
        ) : (
          <StaffJobChatsPanel
            requests={requests}
            guards={guards}
            threads={jobChatThreads}
            messages={jobChatMessages}
            currentUser={currentUser}
            onSendJobChat={onSendJobChat}
            selectedRequestId={selectedJobChatRequestId}
            onSelectedRequestIdChange={onSelectedJobChatRequestIdChange}
            initialSelectedRequestId={selectedJobChatRequestId}
          />
        )}
      </div>
    </div>
  );
}
