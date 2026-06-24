import type { ClientJobActionsPanelProps } from './ClientJobActionsPanel';

/** Handlers and context shared by map, jobs list, and live shift overlay. */
export type ClientJobActionsBindings = Omit<
  ClientJobActionsPanelProps,
  'request' | 'context' | 'hideMessaging'
>;
