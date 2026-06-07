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
      className={`shrink-0 z-50 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-brand-bg border-t border-brand-border ${className}`}
      aria-label="Main navigation"
    >
      <div className="max-w-lg mx-auto flex gap-1 bg-brand-bg-sec border border-brand-border rounded-2xl p-1">
        {items.map(({ id, label, icon: Icon, badge }) => {
          const active = activeId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wide transition-colors min-h-[52px] ${
                active ? 'bg-brand-primary text-black' : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
              {badge != null && badge > 0 && (
                <span className="absolute top-1 right-2 min-w-[1rem] h-4 px-1 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center">
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
