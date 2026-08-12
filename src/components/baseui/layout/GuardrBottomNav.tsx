import React from 'react';
import { LayoutGrid, Map, type LucideIcon } from 'lucide-react';
import type { StaffNavNotificationKind } from '../../../lib/staffOpsNavNotifications';
import type { GuardrNavItem } from './types';

export type GuardrBottomNavItem = GuardrNavItem;

interface GuardrBottomNavProps {
  items: GuardrBottomNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  showMore?: boolean;
  moreActive?: boolean;
  moreBadge?: number;
  moreNotification?: StaffNavNotificationKind;
  onMoreClick?: () => void;
  flat?: boolean;
  centerItemId?: string;
}

/** Individual tab — exact guard field app/rider tab bar */
function BottomNavTab({
  label,
  icon: Icon,
  active,
  badge,
  notification,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  badge?: number;
  notification?: StaffNavNotificationKind;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className="uber-tab-btn"
      data-active={active ? 'true' : undefined}
    >
      <span className="uber-tab-icon-wrap">
        <Icon size={24} strokeWidth={active ? 2.25 : 1.75} className="uber-tab-icon" />
        {notification ? (
          <span className={`staff-nav-notify-dot staff-nav-notify-dot--${notification} staff-nav-notify-dot--tab`} aria-hidden />
        ) : badge != null && badge > 0 ? (
          <span className="uber-tab-badge">{badge > 9 ? '9+' : badge}</span>
        ) : null}
      </span>
      <span className="uber-tab-label">{label}</span>
      {active && <span className="uber-tab-active-dot" aria-hidden />}
    </button>
  );
}

/** Guardr bottom navigation — exact bottom tab bar */
export function GuardrBottomNav({
  items,
  activeId,
  onNavigate,
  showMore = false,
  moreActive = false,
  moreBadge = 0,
  moreNotification,
  onMoreClick,
  flat = false,
  centerItemId = 'map',
}: GuardrBottomNavProps) {
  const allTabs = showMore ? items.slice(0, 4) : items.slice(0, 5);

  return (
    <nav aria-label="Main navigation" className="uber-bottom-nav">
      <div className="uber-bottom-nav-inner">
        {allTabs.map((item) => (
          <BottomNavTab
            key={item.id}
            label={item.label}
            icon={item.icon ?? Map}
            active={activeId === item.id}
            badge={item.badge}
            notification={item.notification}
            onClick={() => onNavigate(item.id)}
          />
        ))}
        {showMore ? (
          <BottomNavTab
            label="More"
            icon={LayoutGrid}
            active={moreActive}
            badge={moreNotification ? undefined : moreBadge}
            notification={moreNotification}
            onClick={() => onMoreClick?.()}
          />
        ) : null}
      </div>
    </nav>
  );
}
