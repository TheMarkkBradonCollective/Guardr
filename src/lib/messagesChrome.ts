import type React from 'react';

export type MessagesChrome = {
  /** Inbox tabs rendered below the screen title in the app header. */
  extension: React.ReactNode | null;
  /** Full header replacement for mobile thread view (back + title). */
  override: React.ReactNode | null;
};

export const EMPTY_MESSAGES_CHROME: MessagesChrome = {
  extension: null,
  override: null,
};
