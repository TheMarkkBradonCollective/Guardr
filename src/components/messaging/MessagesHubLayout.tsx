import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useDevice } from '../../lib/platform';
import { AppEmptyState } from '../ui/app/AppPrimitives';

interface MessagesHubLayoutProps {
  header?: React.ReactNode;
  list: React.ReactNode;
  detail: React.ReactNode;
  hasSelection: boolean;
  emptyDetailTitle?: string;
  emptyDetailHint?: string;
  /** When true, inbox tabs are rendered in the app shell header instead. */
  shellInboxHeader?: boolean;
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
      <AppEmptyState dashed icon={<MessageCircle className="w-5 h-5" />} title={emptyDetailTitle}>
        {emptyDetailHint}
      </AppEmptyState>
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
  shellInboxHeader = false,
}: MessagesHubLayoutProps) {
  const { formFactor } = useDevice();
  const splitView = formFactor === 'tablet';
  const desktopView = formFactor === 'desktop';
  const inboxHeader = shellInboxHeader ? null : header;

  const emptyDetail = (
    <MessagesHubEmptyDetail
      emptyDetailTitle={emptyDetailTitle}
      emptyDetailHint={emptyDetailHint}
    />
  );

  if (desktopView) {
    return (
      <div className="desktop-messages-workbench h-full min-h-0">
        <div className="desktop-messages-inbox">
          {inboxHeader ? <div className="flex-shrink-0">{inboxHeader}</div> : null}
          <div className="desktop-messages-inbox-body">{list}</div>
        </div>
        <div className="desktop-messages-thread">
          {hasSelection ? detail : (
            <div className="desktop-messages-empty">
              <MessagesHubEmptyDetail
                emptyDetailTitle={emptyDetailTitle}
                emptyDetailHint={emptyDetailHint}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (splitView) {
    return (
      <div className="app-messages-split h-full min-h-0">
        <div className="app-messages-split-list flex flex-col min-h-0">
          {inboxHeader ? <div className="flex-shrink-0">{inboxHeader}</div> : null}
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
      {inboxHeader ? <div className="flex-shrink-0">{inboxHeader}</div> : null}
      <div className="flex-1 min-h-0 overflow-y-auto">{list}</div>
    </div>
  );
}
