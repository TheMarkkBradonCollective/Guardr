export type InboxPersistInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  url?: string;
  requestId?: string;
  guardId?: string;
  ticketId?: string;
};

let inboxPersistHandler: ((input: InboxPersistInput) => void) | null = null;

export function registerInboxPersistHandler(
  handler: ((input: InboxPersistInput) => void) | null
): void {
  inboxPersistHandler = handler;
}

export function persistInboxNotification(input: InboxPersistInput): void {
  inboxPersistHandler?.(input);
}

function defaultTitleForType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function inboxPayloadFromPushEvent(event: {
  type: string;
  title?: string;
  body?: string;
  recipientUserId?: string;
  guardId?: string;
  requestId?: string;
  ticketId?: string;
  url?: string;
}): InboxPersistInput | null {
  const userId = event.recipientUserId ?? event.guardId;
  if (!userId) return null;
  const body = event.body?.trim();
  if (!body) return null;
  return {
    userId,
    type: event.type,
    title: event.title?.trim() || defaultTitleForType(event.type),
    body,
    url: event.url,
    requestId: event.requestId,
    guardId: event.guardId,
    ticketId: event.ticketId,
  };
}
