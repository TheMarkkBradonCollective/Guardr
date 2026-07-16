import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, LogOut, LucideIcon, Settings, User } from 'lucide-react';
import type { UserNotification } from '../../types';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { useFloatingPanelPosition } from '../../lib/ui/useFloatingPanelPosition';
import {
  NotificationInboxSection,
  accountMenuUnreadCount,
} from '../notifications/NotificationInboxSection';

export type AccountMenuNotificationProps = Pick<
  AccountMenuProps,
  'notifications' | 'onNotificationClick' | 'onMarkAllNotificationsRead'
>;

export interface AccountMenuLink {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
}

export interface AccountMenuProps {
  userName: string;
  userSubtitle?: string;
  avatarUrl?: string;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  /** Hide profile link (e.g. guard activation screen handles uploads inline). */
  hideProfile?: boolean;
  /** Highlight avatar when profile or settings is the active screen */
  active?: boolean;
  extraLinks?: AccountMenuLink[];
  footer?: React.ReactNode;
  notifications?: UserNotification[];
  onNotificationClick?: (notification: UserNotification) => void | Promise<void>;
  onMarkAllNotificationsRead?: () => void | Promise<void>;
}

export function AccountMenu({
  userName,
  userSubtitle,
  avatarUrl,
  onOpenProfile,
  onOpenSettings,
  onSignOut,
  hideProfile = false,
  active = false,
  extraLinks = [],
  footer,
  notifications,
  onNotificationClick,
  onMarkAllNotificationsRead,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const panelWidth = notifications && onNotificationClick && onMarkAllNotificationsRead ? 352 : 288;
  const position = useFloatingPanelPosition(open, triggerRef, 'right', panelWidth);
  const unread = accountMenuUnreadCount(notifications);
  const showNotifications =
    !!notifications && !!onNotificationClick && !!onMarkAllNotificationsRead;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  const handleProfile = () => {
    onOpenProfile();
    close();
  };

  const handleSettings = () => {
    onOpenSettings();
    close();
  };

  const handleSignOut = () => {
    close();
    onSignOut();
  };

  const menuPanel = open ? (
    <div
      ref={menuRef}
      id={menuId}
      role="menu"
      className="account-menu-panel fixed z-[3000] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-[var(--shadow-float)]"
      style={{ top: position.top, left: position.left, right: position.right }}
    >
      <div className="px-4 py-3 border-b border-brand-border bg-brand-bg-sec/60">
        <p className="font-bold text-sm truncate tracking-tight">{userName}</p>
        {userSubtitle && <p className="text-xs text-brand-text-muted truncate mt-0.5">{userSubtitle}</p>}
      </div>

      {showNotifications ? (
        <NotificationInboxSection
          notifications={notifications}
          onMarkAllRead={onMarkAllNotificationsRead}
          onNotificationClick={onNotificationClick}
          onNavigate={close}
        />
      ) : null}

      <div className="p-2 border-b border-brand-border space-y-0.5">
        {!hideProfile && (
          <button
            type="button"
            role="menuitem"
            onClick={handleProfile}
            className="account-menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-brand-text hover:bg-brand-bg-sec transition-colors"
          >
            <User className="w-4 h-4 shrink-0 text-brand-primary" strokeWidth={1.75} />
            Profile
          </button>
        )}
        <button
          type="button"
          role="menuitem"
          onClick={handleSettings}
          className="account-menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-brand-text hover:bg-brand-bg-sec transition-colors"
        >
          <Settings className="w-4 h-4 shrink-0 text-brand-primary" strokeWidth={1.75} />
          Settings
        </button>
      </div>

      {extraLinks.length > 0 && (
        <div className="p-2 border-b border-brand-border">
          {extraLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              role="menuitem"
              onClick={() => {
                link.onClick();
                close();
              }}
              className={`account-menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors ${
                link.active
                  ? 'text-brand-primary bg-brand-primary/10'
                  : 'text-brand-text hover:bg-brand-bg-sec'
              }`}
            >
              <link.icon className="w-4 h-4 shrink-0 text-brand-primary" strokeWidth={1.75} />
              {link.label}
            </button>
          ))}
        </div>
      )}

      <div className="p-2">
        <button
          type="button"
          role="menuitem"
          onClick={handleSignOut}
          className="account-menu-item account-menu-signout w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          Sign out
        </button>
      </div>

      {footer ? (
        <div className="px-4 py-3 border-t border-brand-border bg-brand-bg-sec/40">{footer}</div>
      ) : null}
    </div>
  ) : null;

  return (
    <div className="account-menu relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`account-menu-trigger app-header-account-trigger inline-flex items-center gap-1 rounded-full pl-0.5 pr-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
          active ? 'bg-brand-primary/10 ring-1 ring-brand-primary/30' : 'hover:bg-brand-border/20'
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={
          unread > 0 ? `Account menu, ${unread} unread notifications` : 'Account menu'
        }
      >
        <span className="relative shrink-0">
          <ProfileAvatar src={avatarUrl} name={userName} size="sm" />
          {unread > 0 && (
            <span className="notification-bell-badge absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-brand-primary text-[10px] font-black text-white flex items-center justify-center leading-none border-2 border-brand-surface">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-brand-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      {typeof document !== 'undefined' && menuPanel ? createPortal(menuPanel, document.body) : null}
    </div>
  );
}
