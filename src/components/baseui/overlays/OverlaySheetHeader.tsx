import React from 'react';
import { X } from 'lucide-react';
import { GuardrButton } from '../GuardrButton';

/** Sticky header for bottom-sheet overlays (shift packages, field modals). */
export function OverlaySheetHeader({
  title,
  titleId,
  subtitle,
  onClose,
}: {
  title: string;
  titleId?: string;
  subtitle?: string;
  onClose?: () => void;
}) {
  return (
    <div className="uber-overlay-sheet-header">
      <div className="min-w-0 flex-1">
        <p id={titleId} className="uber-overlay-sheet-title">
          {title}
        </p>
        {subtitle ? <p className="uber-text-muted text-xs mt-1 leading-relaxed">{subtitle}</p> : null}
      </div>
      {onClose ? (
        <GuardrButton kind="tertiary" size="compact" onClick={onClose} aria-label="Close">
          <X className="w-4 h-4" />
        </GuardrButton>
      ) : null}
    </div>
  );
}
