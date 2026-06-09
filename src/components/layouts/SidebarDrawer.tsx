import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SidebarDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function SidebarDrawer({ open, onClose, title, subtitle, children, footer }: SidebarDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sidebar-drawer-root fixed inset-0 z-[2100]" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 modal-overlay"
        onClick={onClose}
      />
      <aside className="sidebar-drawer-panel absolute inset-y-0 left-0 w-72 max-w-[88vw] flex flex-col border-r border-brand-border bg-brand-bg-sec shadow-2xl">
        <div className="shrink-0 flex items-start justify-between gap-3 p-4 border-b border-brand-border">
          <div className="min-w-0">
            {subtitle && (
              <p className="text-[9px] font-mono uppercase tracking-widest text-brand-text-muted">{subtitle}</p>
            )}
            <p className="font-black text-sm uppercase tracking-tight">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-brand-border text-brand-text-muted hover:text-brand-text shrink-0"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2">{children}</div>
        {footer && <div className="shrink-0 p-3 border-t border-brand-border space-y-2">{footer}</div>}
      </aside>
    </div>
  );
}
