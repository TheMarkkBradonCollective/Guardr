import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCheck } from 'lucide-react';
import type { UserNotification } from '../../types';
import {
  countUnreadNotifications,
  isNotificationUnread,
  sortNotificationsNewestFirst,
} from '../../lib/notificationInbox';
import { useFloatingPanelPosition } from '../../lib/ui/useFloatingPanelPosition';

interface NotificationBellMenuProps {
  notifications: UserNotification[];
  onMarkAllRead: () => void | Promise<void>;
  onNotificationClick: (notification: UserNotification) => void | Promise<void>;
  className?: string;
}

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

export function NotificationBellMenu({
  notifications,
  onMarkAllRead,
  onNotificationClick,
  className = '',
}: NotificationBellMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const position = useFloatingPanelPosition(open, triggerRef, 'right', 352);
  const unread = countUnreadNotifications(notifications);
  const sorted = sortNotificationsNewestFirst(notifications);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const panel = open ? (
    <div
      ref={panelRef}
      className="notification-inbox-panel fixed z-[3000] w-[min(22rem,calc(100vw-2rem))] max-h-[min(28rem,70dvh)] flex flex-col rounded-lg border border-brand-border bg-brand-bg shadow-lg overflow-hidden"
      style={{ top: position.top, left: position.left, right: position.right }}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-brand-border bg-brand-surface">
        <p className="text-sm font-black tracking-[-0.02em]">Notifications</p>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => void onMarkAllRead()}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {sorted.length === 0 ? (
          <p className="px-4 py-8 text-sm text-brand-text-muted text-center">No notifications yet.</p>
        ) : (
          <ul className="divide-y divide-brand-border">
            {sorted.map((n) => {
              const unreadRow = isNotificationUnread(n);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      void onNotificationClick(n);
                      setOpen(false);
                    }}
                    className={`notification-inbox-item w-full text-left px-4 py-3 transition-colors hover:bg-brand-primary/6 ${
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
                        <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed line-clamp-3">
                          {n.body}
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted mt-1.5">
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
  ) : null;

  return (
    <div className={`relative shrink-0 ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="notification-bell-btn relative flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-text transition-colors hover:border-brand-primary/40 hover:bg-brand-primary/8"
        aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
        aria-expanded={open}
      >
        <Bell className="w-[1.125rem] h-[1.125rem]" strokeWidth={2} />
        {unread > 0 && (
          <span className="notification-bell-badge absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-brand-primary text-[10px] font-black text-white flex items-center justify-center leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {typeof document !== 'undefined' && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
