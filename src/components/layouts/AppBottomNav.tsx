import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface AppBottomNavProps {
  items: BottomNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  className?: string;
}

export function AppBottomNav({ items, activeId, onNavigate, className = '' }: AppBottomNavProps) {
  return (
    <nav
      className={`app-bottom-nav shrink-0 z-50 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${className}`}
      aria-label="Main navigation"
    >
      <div className="app-bottom-nav-pill max-w-lg mx-auto flex gap-1 p-1.5">
        {items.map(({ id, label, icon: Icon, badge }) => {
          const active = activeId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`app-bottom-nav-item relative flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[52px] ${
                active ? 'app-bottom-nav-item--active' : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.25 : 2} />
              <span>{label}</span>
              {badge != null && badge > 0 && (
                <span className="absolute top-1 right-2 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
