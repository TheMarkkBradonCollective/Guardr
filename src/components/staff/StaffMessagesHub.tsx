import React, { useState } from 'react';
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
  onSendJobChat: (requestId: string, body: string) => void | Promise<void>;
}

export function StaffMessagesHub({
  requests,
  guards,
  jobChatThreads,
  jobChatMessages,
  staffMessages,
  currentUser,
  onSendStaffMessage,
  onSendJobChat,
}: StaffMessagesHubProps) {
  const [tab, setTab] = useState<'team' | 'jobs'>('team');

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 flex gap-1 p-3 border-b border-brand-border">
        {(['team', 'jobs'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 py-2 text-sm font-medium rounded-full border transition-colors ${
              tab === id
                ? 'bg-brand-primary text-brand-accent-text border-brand-primary'
                : 'border-brand-border text-brand-text-muted'
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
          />
        ) : (
          <StaffJobChatsPanel
            requests={requests}
            guards={guards}
            threads={jobChatThreads}
            messages={jobChatMessages}
            currentUser={currentUser}
            onSendJobChat={onSendJobChat}
          />
        )}
      </div>
    </div>
  );
}
