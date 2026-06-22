import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface AppSidebarNavProps {
  items: SidebarNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
}

export function AppSidebarNav({ items, activeId, onNavigate }: AppSidebarNavProps) {
  return (
    <nav aria-label="Main navigation" className="uber-side-nav divide-y divide-brand-border border-y border-brand-border">
      {items.map(({ id, label, icon: Icon, badge }) => {
        const active = activeId === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            className={`uber-side-nav-item w-full flex items-center gap-2 px-3 py-3 text-left text-sm font-medium transition-colors ${
              active
                ? 'uber-side-nav-item-active bg-brand-primary text-brand-accent-text'
                : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-surface'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {badge != null && badge > 0 && (
              <span
                className={`text-xs font-bold px-1.5 py-0.5 min-w-[1.25rem] text-center ${
                  active
                    ? 'bg-brand-accent-text/20 text-brand-accent-text'
                    : 'bg-brand-primary/15 text-brand-primary'
                }`}
              >
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
