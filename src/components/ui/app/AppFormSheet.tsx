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
      panelClassName="rounded-t-[1.75rem]"
    >
      <div className="flex flex-col max-h-[90dvh]">
        {/* Drag handle */}
        <div className="shrink-0 flex justify-center pt-3 pb-1" aria-hidden>
          <div className="w-10 h-[3px] rounded-full bg-brand-border opacity-60" />
        </div>

        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-3 px-5 pt-3 pb-4 border-b border-brand-border">
          <div className="min-w-0 flex-1">
            <h2 id="app-form-sheet-title" className="text-2xl font-black tracking-[-0.04em] leading-tight text-brand-text">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-brand-text-muted mt-1.5 leading-relaxed font-medium">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center text-brand-text-muted hover:text-brand-text hover:bg-brand-bg-sec transition-colors rounded-lg -mr-1 mt-0.5"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5 pb-10">
          {children}
        </div>
      </div>
    </AppOverlaySheet>
  );
}
