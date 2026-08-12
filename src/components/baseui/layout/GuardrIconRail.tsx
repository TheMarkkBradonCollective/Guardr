import React from 'react';
import { Menu, type LucideIcon } from 'lucide-react';
import type { StaffNavNotificationKind } from '../../../lib/staffOpsNavNotifications';
import type { GuardrNavItem } from './types';

export interface GuardrIconRailProps {
  items: GuardrNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Hamburger at the top of the rail — toggles the secondary nav panel. */
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  footer?: React.ReactNode;
  ariaLabel?: string;
  width?: string;
}

function RailButton({
  icon: Icon,
  label,
  active,
  badge,
  notification,
  onClick,
  ...rest
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  badge?: number;
  notification?: StaffNavNotificationKind;
  onClick: () => void;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) {
  return (
    <button
      type="button"
      className="uber-rail-btn"
      data-active={active ? 'true' : undefined}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
      // Native fallback for the short-viewport case where the hover label clips.
      title={label}
      onClick={onClick}
      {...rest}
    >
      <Icon size={20} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
      {notification ? (
        <span className={`staff-nav-notify-dot staff-nav-notify-dot--${notification} staff-nav-notify-dot--rail`} aria-hidden />
      ) : badge != null && badge > 0 ? (
        <span className="uber-rail-badge">{badge > 9 ? '9+' : badge}</span>
      ) : null}
      <span className="uber-rail-tip" role="tooltip">
        {label}
      </span>
    </button>
  );
}

/**
 * desktop ops workspace icon rail — the black column pinned to the left edge of the
 * desktop workspace. Holds the app menu toggle plus primary destinations; the
 * labelled secondary nav lives in the white panel beside it.
 */
export function GuardrIconRail({
  items,
  activeId,
  onSelect,
  onToggleSidebar,
  sidebarOpen = true,
  footer,
  ariaLabel = 'Primary navigation',
  width = '56px',
}: GuardrIconRailProps) {
  return (
    <nav
      className="uber-rail"
      aria-label={ariaLabel}
      style={{ width, minWidth: width }}
      data-sidebar-open={sidebarOpen ? 'true' : 'false'}
    >
      {onToggleSidebar ? (
        <div className="uber-rail-top">
          <RailButton
            icon={Menu}
            label={sidebarOpen ? 'Collapse navigation' : 'Expand navigation'}
            onClick={onToggleSidebar}
            aria-expanded={sidebarOpen}
          />
        </div>
      ) : null}

      <div className="uber-rail-items">
        {items.map((item) =>
          item.icon ? (
            <RailButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeId === item.id}
              badge={item.badge}
              notification={item.notification}
              onClick={() => onSelect(item.id)}
            />
          ) : null,
        )}
      </div>

      {footer ? <div className="uber-rail-footer">{footer}</div> : null}
    </nav>
  );
}
