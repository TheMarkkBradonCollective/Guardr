import React from 'react';
import { Drawer } from '../baseuiShims';
import { X } from 'lucide-react';
import { drawerOverrides } from './overlayStyles';
import { useOverlayCloseGate, useReturnFocusOnClose } from './overlayStack';

export interface GuardrDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Left sidebar drawer with slide-in */
export function GuardrDrawer({ open, onClose, title, subtitle, children, footer }: GuardrDrawerProps) {
  const gatedClose = useOverlayCloseGate(open, onClose);
  useReturnFocusOnClose(open);

  return (
    <Drawer
      isOpen={open}
      anchor="left"
      size="auto"
      animate
      autoFocus
      closeable={false}
      showBackdrop
      onClose={() => gatedClose()}
      onBackdropClick={() => gatedClose()}
      onEscapeKeyDown={(e) => {
        e.preventDefault();
        gatedClose();
      }}
      overrides={drawerOverrides({ zIndex: 2100 })}
    >
      <div className="sidebar-drawer-panel flex flex-col h-full" role="dialog" aria-label={title}>
        <div
          className="shrink-0 flex items-center justify-between gap-3 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 border-b border-brand-border bg-brand-chrome text-brand-chrome-text"
        >
          <div className="min-w-0">
            {subtitle ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand-text-muted mb-1">
                {subtitle}
              </p>
            ) : null}
            <p className="font-black text-xl tracking-[-0.04em] leading-tight">{title}</p>
          </div>
          <button
            type="button"
            onClick={gatedClose}
            className="app-chrome-btn shrink-0"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 pb-6">{children}</div>
        {footer ? <div className="shrink-0 p-4 space-y-2 border-t border-brand-border">{footer}</div> : null}
      </div>
    </Drawer>
  );
}
