import React from 'react';
import { X } from 'lucide-react';
import { BottomNavItem } from './BottomNavBar';

interface MoreMenuSheetProps {
  open: boolean;
  title?: string;
  items: BottomNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  onClose: () => void;
  footer?: React.ReactNode;
}

export function MoreMenuSheet({
  open,
  title = 'More',
  items,
  activeId,
  onNavigate,
  onClose,
  footer,
}: MoreMenuSheetProps) {
  if (!open) return null;

  return (
    <div className="more-menu-sheet fixed inset-0 z-[2100]" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 modal-overlay"
        onClick={onClose}
      />
      <div className="more-menu-panel absolute inset-x-0 bottom-0 max-h-[85dvh] rounded-t-[1.25rem] border-t border-brand-border bg-brand-surface shadow-[var(--shadow-float)] animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <p className="text-base font-semibold">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-brand-bg-sec text-brand-text-muted hover:text-brand-text transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain p-4">
          <div className="grid grid-cols-3 gap-3">
            {items.map(({ id, label, icon: Icon, badge }) => {
              const active = activeId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onNavigate(id);
                    onClose();
                  }}
                  className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border min-h-[5.5rem] transition-all ${
                    active
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary shadow-sm'
                      : 'border-brand-border bg-brand-bg-sec text-brand-text-muted hover:text-brand-text hover:border-brand-primary/30'
                  }`}
                >
                  <Icon className="w-6 h-6 shrink-0" />
                  <span className="text-[11px] font-medium text-center leading-tight">{label}</span>
                  {badge != null && badge > 0 && (
                    <span className="absolute top-2 right-2 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {footer && (
          <div className="shrink-0 px-4 pt-2 border-t border-brand-border">{footer}</div>
        )}
      </div>
    </div>
  );
}
