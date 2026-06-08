import React from 'react';
import { StaffSection } from '../../lib/staffOps';
import { X } from 'lucide-react';

interface MoreNavItem {
  id: StaffSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface StaffMoreMenuProps {
  items: MoreNavItem[];
  activeSection: StaffSection;
  onNavigate: (section: StaffSection) => void;
  onClose: () => void;
}

export function StaffMoreMenu({ items, activeSection, onNavigate, onClose }: StaffMoreMenuProps) {
  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 modal-overlay"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t border-brand-border bg-brand-bg-sec shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-brand-text-muted">Operations Menu</p>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-brand-border text-brand-text-muted hover:text-brand-text"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-3 gap-2">
            {items.map(({ id, label, icon: Icon, badge }) => {
              const active = activeSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onNavigate(id);
                    onClose();
                  }}
                  className={`relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border min-h-[88px] transition-colors ${
                    active
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-brand-border bg-brand-surface text-brand-text-muted hover:text-brand-text hover:border-brand-primary/40'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-[9px] font-mono font-bold uppercase text-center leading-tight">{label}</span>
                  {badge != null && badge > 0 && (
                    <span className="absolute top-2 right-2 min-w-[1rem] h-4 px-1 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
