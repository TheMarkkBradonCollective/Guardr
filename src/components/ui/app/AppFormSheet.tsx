import React from 'react';
import { X } from 'lucide-react';
import { AppOverlaySheet } from '../motion/AppMotion';

interface AppFormSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}

/** Bottom sheet for forms — white slide-up card over a dimmed page. */
export function AppFormSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  ariaLabel,
}: AppFormSheetProps) {
  return (
    <AppOverlaySheet
      open={open}
      onClose={onClose}
      ariaLabel={ariaLabel ?? title}
      panelClassName="app-form-sheet-panel"
    >
      <div className="app-form-sheet-shell">
        <div className="app-form-sheet-handle" aria-hidden />

        <header className="app-form-sheet-header">
          <div className="min-w-0 flex-1">
            <h2 id="app-form-sheet-title" className="app-form-sheet-title">
              {title}
            </h2>
            {subtitle ? <p className="app-form-sheet-subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="app-form-sheet-close" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="app-form-sheet-body">{children}</div>
      </div>
    </AppOverlaySheet>
  );
}
