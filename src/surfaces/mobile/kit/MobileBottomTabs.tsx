import React from 'react';
import { LayoutGrid, Circle, type LucideIcon } from 'lucide-react';
import { triggerHaptic } from '../../../lib/platform/nativeHaptics';
import type { SurfaceDestination } from '../../surfaceNavigation';

export interface MobileBottomTabsProps {
  tabs: SurfaceDestination[];
  activeId: string;
  onNavigate: (id: string) => void;
  showMore: boolean;
  moreActive: boolean;
  moreBadge: number;
  onMore: () => void;
}

function Tab({
  label,
  icon: Icon = Circle,
  active,
  badge,
  onClick,
}: {
  label: string;
  icon?: LucideIcon;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="sfm-tab"
      data-active={active ? 'true' : undefined}
      aria-current={active ? 'page' : undefined}
      onClick={() => {
        if (!active) void triggerHaptic('light');
        onClick();
      }}
    >
      <span className="sfm-tab-icon">
        <Icon size={24} strokeWidth={active ? 2.4 : 1.8} aria-hidden />
        {badge != null && badge > 0 ? (
          <span className="sfm-tab-badge">{badge > 9 ? '9+' : badge}</span>
        ) : null}
      </span>
      <span className="sfm-tab-label">{label}</span>
    </button>
  );
}

/**
 * The mobile app's only navigation. Fixed to the bottom edge, inside the safe
 * area, with the fifth slot becoming "More" whenever destinations overflow.
 */
export function MobileBottomTabs({
  tabs,
  activeId,
  onNavigate,
  showMore,
  moreActive,
  moreBadge,
  onMore,
}: MobileBottomTabsProps) {
  return (
    <nav className="sfm-tabbar" aria-label="Main navigation">
      <div className="sfm-tabbar-inner">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            label={tab.label}
            icon={tab.icon}
            badge={tab.badge}
            active={activeId === tab.id}
            onClick={() => onNavigate(tab.id)}
          />
        ))}
        {showMore ? (
          <Tab label="More" icon={LayoutGrid} badge={moreBadge} active={moreActive} onClick={onMore} />
        ) : null}
      </div>
    </nav>
  );
}
