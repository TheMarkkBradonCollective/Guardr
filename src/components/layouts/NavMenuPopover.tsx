import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LucideIcon, Menu } from 'lucide-react';
import { useFloatingPanelPosition } from '../../lib/ui/useFloatingPanelPosition';

export interface NavMenuPopoverItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  locked?: boolean;
}

interface NavMenuPopoverProps {
  items: NavMenuPopoverItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  className?: string;
}

export function NavMenuPopover({
  items,
  activeId,
  onNavigate,
  className = '',
}: NavMenuPopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const position = useFloatingPanelPosition(open, triggerRef, 'right', 288);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  const panel = open ? (
    <div
      ref={panelRef}
      id={menuId}
      role="menu"
      className="nav-menu-panel fixed z-[3000] w-[min(18rem,calc(100vw-2rem))] max-h-[min(32rem,70dvh)] overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-[var(--shadow-float)] flex flex-col"
      style={{
        top: position.top,
        left: position.left,
        right: position.right,
      }}
    >
      <div className="px-4 py-3 border-b border-brand-border bg-brand-bg-sec/60 shrink-0">
        <p className="font-bold text-sm tracking-tight">Menu</p>
      </div>
      <div className="p-2 overflow-y-auto overscroll-contain">
        {items.map(({ id, label, icon: Icon, badge, locked }) => {
          const active = activeId === id;
          return (
            <button
              key={id}
              type="button"
              role="menuitem"
              onClick={() => {
                if (locked) return;
                onNavigate(id);
                setOpen(false);
              }}
              className={`nav-menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors ${
                active
                  ? 'text-brand-primary bg-brand-primary/10'
                  : locked
                    ? 'text-brand-text-muted opacity-60 cursor-not-allowed'
                    : 'text-brand-text hover:bg-brand-bg-sec'
              }`}
              aria-current={active ? 'page' : undefined}
              disabled={locked}
            >
              <Icon className="w-4 h-4 shrink-0 text-brand-primary" strokeWidth={active ? 2.25 : 1.75} />
              <span className="flex-1 truncate">{label}</span>
              {badge != null && badge > 0 ? (
                <span className="inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-status-danger text-[10px] font-black text-white leading-none">
                  {badge > 9 ? '9+' : badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <div className={`relative shrink-0 ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="app-chrome-btn text-brand-text shrink-0"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {typeof document !== 'undefined' && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
