import React from 'react';
import { CheckCheck } from 'lucide-react';
import type { UserNotification } from '../../types';
import {
  countUnreadNotifications,
  isNotificationUnread,
  sortNotificationsNewestFirst,
} from '../../lib/notificationInbox';

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 60_000) return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export interface NotificationInboxSectionProps {
  notifications: UserNotification[];
  onMarkAllRead: () => void | Promise<void>;
  onNotificationClick: (notification: UserNotification) => void | Promise<void>;
  onNavigate?: () => void;
  /** When true, omit outer border (used inside account menu sub-view). */
  embedded?: boolean;
}

export function NotificationInboxSection({
  notifications,
  onMarkAllRead,
  onNotificationClick,
  onNavigate,
  embedded = false,
}: NotificationInboxSectionProps) {
  const unread = countUnreadNotifications(notifications);
  const sorted = sortNotificationsNewestFirst(notifications);

  return (
    <div className={embedded ? 'account-menu-notifications' : 'account-menu-notifications border-b border-brand-border'}>
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-brand-bg-sec/40">
        <p className="text-xs font-black uppercase tracking-wide text-brand-text-muted">Notifications</p>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => void onMarkAllRead()}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-[min(20rem,50dvh)] overflow-y-auto overscroll-contain">
        {sorted.length === 0 ? (
          <p className="px-4 py-6 text-sm text-brand-text-muted text-center">No notifications yet.</p>
        ) : (
          <ul className="divide-y divide-brand-border">
            {sorted.map((n) => {
              const unreadRow = isNotificationUnread(n);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      void onNotificationClick(n);
                      onNavigate?.();
                    }}
                    className={`notification-inbox-item w-full text-left px-4 py-2.5 transition-colors hover:bg-brand-primary/6 ${
                      unreadRow ? 'notification-inbox-item--unread bg-brand-primary/10' : 'bg-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {unreadRow && (
                        <span
                          className="mt-1.5 w-2 h-2 shrink-0 rounded-full bg-brand-primary"
                          aria-hidden
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm leading-snug ${
                            unreadRow ? 'font-bold text-brand-text' : 'font-medium text-brand-text'
                          }`}
                        >
                          {n.title}
                        </p>
                        <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed line-clamp-2">
                          {n.body}
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted mt-1">
                          {formatWhen(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function accountMenuUnreadCount(notifications: UserNotification[] | undefined): number {
  return notifications ? countUnreadNotifications(notifications) : 0;
}
