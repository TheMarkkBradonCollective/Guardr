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
      panelClassName="rounded-t-2xl"
    >
      <div className="flex flex-col max-h-[85dvh]">
        <div className="shrink-0 flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-brand-border">
          <div className="min-w-0 pr-2">
            <h2 id="app-form-sheet-title" className="text-lg font-bold tracking-tight text-brand-text">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-brand-text-muted mt-1 leading-relaxed">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 -mr-2 rounded-full text-brand-text-muted hover:text-brand-text hover:bg-brand-surface transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 pb-8">
          {children}
        </div>
      </div>
    </AppOverlaySheet>
  );
}
