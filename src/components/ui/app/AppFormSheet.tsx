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

/** Bottom sheet for forms — same interaction model as credential view/edit. */
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
      <div className="flex flex-col max-h-[90dvh]">
        <div className="shrink-0 flex justify-center pt-3 pb-1" aria-hidden>
          <div className="app-form-sheet-handle" />
        </div>

        <div className="app-form-sheet-header">
          <div className="min-w-0 flex-1">
            <h2 id="app-form-sheet-title" className="app-form-sheet-title">
              {title}
            </h2>
            {subtitle && <p className="app-form-sheet-subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="app-chrome-btn app-form-sheet-close -mr-1 mt-0.5"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="app-form-sheet-body">{children}</div>
      </div>
    </AppOverlaySheet>
  );
}
