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
import { AppSegmentedControl } from '../ui/app/AppPrimitives';

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
    <div className="app-messages-hub">
      <div className="app-messages-hub-lead">
        <h1 className="text-lg font-bold tracking-tight">Messages</h1>
        <p>Team coordination and live job conversations — clear, direct, and on record.</p>
      </div>
      <AppSegmentedControl
        options={[
          { id: 'team', label: 'Staff team' },
          { id: 'jobs', label: 'Job chats' },
        ]}
        value={tab}
        onChange={changeTab}
      />
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
