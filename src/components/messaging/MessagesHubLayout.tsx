import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useDevice } from '../../lib/platform';

interface MessagesHubLayoutProps {
  header?: React.ReactNode;
  list: React.ReactNode;
  detail: React.ReactNode;
  hasSelection: boolean;
  emptyDetailTitle?: string;
  emptyDetailHint?: string;
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

export function MessagesHubLayout({
  header,
  list,
  detail,
  hasSelection,
  emptyDetailTitle = 'Select a conversation',
  emptyDetailHint = 'Choose a chat from your inbox to view messages',
}: MessagesHubLayoutProps) {
  const { formFactor } = useDevice();
  const splitView = formFactor === 'tablet' || formFactor === 'desktop';

  const emptyDetail = (
    <MessagesHubEmptyDetail
      emptyDetailTitle={emptyDetailTitle}
      emptyDetailHint={emptyDetailHint}
    />
  );

  if (splitView) {
    return (
      <div className="app-messages-split h-full min-h-0">
        <div className="app-messages-split-list flex flex-col min-h-0">
          <div className="flex-shrink-0">{header}</div>
          <div className="flex-1 min-h-0 overflow-y-auto">{list}</div>
        </div>
        <div className="app-messages-split-detail flex flex-col min-h-0">
          {hasSelection ? detail : emptyDetail}
        </div>
      </div>
    );
  }

  if (hasSelection) {
    return <div className="h-full flex flex-col min-h-0">{detail}</div>;
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-shrink-0">{header}</div>
      <div className="flex-1 min-h-0 overflow-y-auto">{list}</div>
    </div>
  );
}
