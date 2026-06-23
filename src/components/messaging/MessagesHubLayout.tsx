import React from 'react';
import { MessageCircle } from 'lucide-react';

interface MessagesHubLayoutProps {
  header?: React.ReactNode;
  list: React.ReactNode;
  detail: React.ReactNode;
  hasSelection: boolean;
  emptyDetailTitle?: string;
  emptyDetailHint?: string;
}

export function MessagesHubLayout({
  header,
  list,
  detail,
  hasSelection,
  emptyDetailTitle = 'Select a conversation',
  emptyDetailHint = 'Choose a chat from your inbox to view messages',
}: MessagesHubLayoutProps) {
  if (hasSelection) {
    return <div className="h-full flex flex-col min-h-0">{detail}</div>;
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {header}
      {list}
    </div>
  );
}

export function MessagesHubEmptyDetail({
  emptyDetailTitle = 'Select a conversation',
  emptyDetailHint = 'Choose a chat from your inbox to view messages',
}: {
  emptyDetailTitle?: string;
  emptyDetailHint?: string;
}) {
  return (
    <div className="app-messages-empty-detail">
      <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-35" strokeWidth={1.5} />
      <p className="text-sm font-semibold">{emptyDetailTitle}</p>
      <p className="text-xs text-brand-text-muted mt-1 max-w-[16rem] mx-auto leading-relaxed">
        {emptyDetailHint}
      </p>
    </div>
  );
}
