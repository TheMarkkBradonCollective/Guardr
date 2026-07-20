import React from 'react';
import { X } from 'lucide-react';
import { BottomNavItem } from './BottomNavBar';
import { AppOverlaySheet } from '../ui/motion/AppMotion';

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
  return (
    <AppOverlaySheet open={open} onClose={onClose} ariaLabel={title} panelClassName="more-menu-panel">
      <div className="more-menu-sheet-shell">
      <div className="more-menu-sheet-header flex items-center justify-between px-5 py-4 border-b border-brand-border">
        <p className="text-base font-black tracking-[-0.03em]">{title}</p>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full border border-brand-border bg-brand-bg-sec text-brand-text-muted hover:text-brand-text transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="more-menu-sheet-scroll overflow-y-auto overscroll-contain">
        <div className="divide-y divide-brand-border border-b border-brand-border">
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
                className={`relative w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${
                  active
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-brand-text hover:bg-brand-bg-sec'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-bold flex-1 tracking-tight">{label}</span>
                {badge != null && badge > 0 && (
                  <span className="nav-badge !min-w-[1.25rem] !h-5 !text-[10px]">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
                {active && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-primary" />}
              </button>
            );
          })}
        </div>
      </div>
      {footer && <div className="more-menu-sheet-footer shrink-0 px-4 py-3 border-t border-brand-border">{footer}</div>}
      </div>
    </AppOverlaySheet>
  );
}
