import React from 'react';
import { LayoutGrid, LucideIcon, Map } from 'lucide-react';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface BottomNavBarProps {
  items: BottomNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  showMore?: boolean;
  moreActive?: boolean;
  moreBadge?: number;
  onMoreClick?: () => void;
  flat?: boolean;
  /** Renders this tab as a raised center map button (Sacramento Buy Nothing-style). */
  centerItemId?: string;
}

export function BottomNavBar({
  items,
  activeId,
  onNavigate,
  showMore = false,
  moreActive = false,
  moreBadge = 0,
  onMoreClick,
  flat = false,
  centerItemId = 'map',
}: BottomNavBarProps) {
  const primarySlots = showMore ? items.slice(0, 4) : items.slice(0, 5);
  const centerIndex = primarySlots.findIndex((item) => item.id === centerItemId);
  const hasCenter = centerIndex >= 0;
  const leftItems = hasCenter ? primarySlots.slice(0, centerIndex) : primarySlots;
  const centerItem = hasCenter ? primarySlots[centerIndex] : null;
  const rightItems = hasCenter ? primarySlots.slice(centerIndex + 1) : [];

  const renderItem = ({ id, label, icon: Icon, badge }: BottomNavItem) => {
    const active = activeId === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => onNavigate(id)}
        className={`bottom-nav-item flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[3.25rem] transition-colors relative ${
          active ? 'text-brand-primary' : 'text-brand-text-muted hover:text-brand-text'
        }`}
        aria-current={active ? 'page' : undefined}
      >
        {active && (
          <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-brand-primary" aria-hidden="true" />
        )}
        <span className="relative">
          <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
          {badge != null && badge > 0 && (
            <span className="nav-badge absolute -top-1.5 -right-2">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </span>
        <span className={`text-[10px] leading-none ${active ? 'font-bold' : 'font-medium'}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <nav
      className={`bottom-nav-bar shrink-0 z-[1001] border-t border-brand-border ${
        flat ? 'bg-brand-bg' : 'bg-brand-surface/95 backdrop-blur-xl'
      }`}
      aria-label="Main navigation"
    >
      <div className="bottom-nav-inner flex items-end justify-around w-full">
        {leftItems.map(renderItem)}

        {centerItem && (
          <button
            type="button"
            onClick={() => onNavigate(centerItem.id)}
            className={`bottom-nav-center-map ${activeId === centerItem.id ? 'bottom-nav-center-map-active' : ''}`}
            aria-current={activeId === centerItem.id ? 'page' : undefined}
            aria-label={centerItem.label}
          >
            <span className="bottom-nav-center-map-icon">
              <Map className="w-6 h-6" strokeWidth={activeId === centerItem.id ? 2.5 : 2} />
            </span>
            <span className="bottom-nav-center-map-label">{centerItem.label}</span>
          </button>
        )}

        {rightItems.map(renderItem)}

        {showMore && (
          <button
            type="button"
            onClick={onMoreClick}
            className={`bottom-nav-item flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[3.25rem] transition-colors relative ${
              moreActive ? 'text-brand-primary' : 'text-brand-text-muted hover:text-brand-text'
            }`}
            aria-current={moreActive ? 'page' : undefined}
          >
            {moreActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-brand-primary" aria-hidden="true" />
            )}
            <span className="relative">
              <LayoutGrid className={`w-5 h-5 ${moreActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              {moreBadge > 0 && (
                <span className="nav-badge absolute -top-1.5 -right-2">
                  {moreBadge > 9 ? '9+' : moreBadge}
                </span>
              )}
            </span>
            <span className={`text-[10px] leading-none ${moreActive ? 'font-bold' : 'font-medium'}`}>
              More
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
