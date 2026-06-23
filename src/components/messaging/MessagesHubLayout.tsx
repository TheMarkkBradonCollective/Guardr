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
  const emptyDetail = (
    <div className="app-messages-empty-detail">
      <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-35" strokeWidth={1.5} />
      <p className="text-sm font-semibold">{emptyDetailTitle}</p>
      <p className="text-xs text-brand-text-muted mt-1 max-w-[16rem] mx-auto leading-relaxed">
        {emptyDetailHint}
      </p>
    </div>
  );

  return (
    <>
      <div className="lg:hidden h-full flex flex-col min-h-0">
        {hasSelection ? (
          detail
        ) : (
          <>
            {header}
            {list}
          </>
        )}
      </div>

      <div className="hidden lg:flex app-messages-split h-full min-h-0">
        <div className="app-messages-split-list flex flex-col min-h-0">
          {header}
          <div className="flex-1 min-h-0 overflow-y-auto">{list}</div>
        </div>
        <div className="app-messages-split-detail flex flex-col min-h-0">
          {hasSelection ? detail : emptyDetail}
        </div>
      </div>
    </>
  );
}
