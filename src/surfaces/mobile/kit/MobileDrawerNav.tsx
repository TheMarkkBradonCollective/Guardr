import React, { useEffect } from 'react';
import { ChevronRight, Circle, type LucideIcon } from 'lucide-react';
import type { SurfaceDestination } from '../../surfaceNavigation';

export interface MobileDrawerNavProps {
  open: boolean;
  onClose: () => void;
  sections: { title: string; items: SurfaceDestination[] }[];
  activeId: string;
  onNavigate: (id: string) => void;
  workspaceLabel?: string;
  footer?: React.ReactNode;
  primaryAction?: React.ReactNode;
}

/**
 * Left slide-in navigation for mobile roles with a large destination catalog (staff).
 * Replaces the bottom tab bar — every section is reachable from one hamburger menu.
 */
export function MobileDrawerNav({
  open,
  onClose,
  sections,
  activeId,
  onNavigate,
  workspaceLabel,
  footer,
  primaryAction,
}: MobileDrawerNavProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <div
        className="sfm-drawer-backdrop"
        data-open={open ? 'true' : undefined}
        aria-hidden={!open}
        onClick={onClose}
      />
      <aside
        className="sfm-drawer"
        data-open={open ? 'true' : undefined}
        aria-label="Staff navigation"
        aria-hidden={!open}
      >
        <div className="sfm-drawer-head">
          {workspaceLabel ? <p className="sfm-drawer-workspace">{workspaceLabel}</p> : null}
          {primaryAction ? <div className="sfm-drawer-primary">{primaryAction}</div> : null}
        </div>

        <nav className="sfm-drawer-nav">
          {sections.map((group) => (
            <section className="sfm-drawer-group" key={group.title}>
              <h3 className="sfm-drawer-group-title">{group.title}</h3>
              <div className="sfm-drawer-list">
                {group.items.map((item) => (
                  <DrawerRow
                    key={item.id}
                    item={item}
                    active={item.id === activeId}
                    onSelect={() => onNavigate(item.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </nav>

        {footer ? <div className="sfm-drawer-footer">{footer}</div> : null}
      </aside>
    </>
  );
}

function DrawerRow({
  item,
  active,
  onSelect,
}: {
  item: SurfaceDestination;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon: LucideIcon = item.icon ?? Circle;
  return (
    <button
      type="button"
      className="sfm-drawer-row"
      data-active={active ? 'true' : undefined}
      onClick={onSelect}
    >
      <span className="sfm-drawer-row-icon">
        <Icon size={20} strokeWidth={2} aria-hidden />
      </span>
      <span className="sfm-drawer-row-label">{item.label}</span>
      {item.badge != null && item.badge > 0 ? (
        <span className="sfm-drawer-row-badge">{item.badge > 9 ? '9+' : item.badge}</span>
      ) : null}
      <ChevronRight size={16} strokeWidth={2} className="sfm-drawer-row-chevron" aria-hidden />
    </button>
  );
}
