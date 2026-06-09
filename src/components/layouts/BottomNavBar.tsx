import React from 'react';
import { LayoutGrid, LucideIcon } from 'lucide-react';

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
}

export function BottomNavBar({
  items,
  activeId,
  onNavigate,
  showMore = false,
  moreActive = false,
  moreBadge = 0,
  onMoreClick,
}: BottomNavBarProps) {
  const slots = showMore ? items.slice(0, 4) : items.slice(0, 5);

  return (
    <nav
      className="bottom-nav-bar shrink-0 z-[1001] border-t border-brand-border bg-brand-surface/95 backdrop-blur-xl"
      aria-label="Main navigation"
    >
      <div className="bottom-nav-inner flex items-stretch justify-around max-w-lg mx-auto">
        {slots.map(({ id, label, icon: Icon, badge }) => {
          const active = activeId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`bottom-nav-item flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[3.25rem] transition-colors ${
                active ? 'text-brand-primary' : 'text-brand-text-muted hover:text-brand-text'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="relative">
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[1rem] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span className={`text-[10px] leading-none ${active ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          );
        })}
        {showMore && (
          <button
            type="button"
            onClick={onMoreClick}
            className={`bottom-nav-item flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[3.25rem] transition-colors ${
              moreActive ? 'text-brand-primary' : 'text-brand-text-muted hover:text-brand-text'
            }`}
            aria-current={moreActive ? 'page' : undefined}
          >
            <span className="relative">
              <LayoutGrid className={`w-5 h-5 ${moreActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              {moreBadge > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[1rem] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {moreBadge > 9 ? '9+' : moreBadge}
                </span>
              )}
            </span>
            <span className={`text-[10px] leading-none ${moreActive ? 'font-semibold' : 'font-medium'}`}>
              More
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
