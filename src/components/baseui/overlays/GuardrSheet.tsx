import React from 'react';
import { Drawer } from '../baseuiShims';
import { sheetOverrides } from './overlayStyles';
import { useOverlayCloseGate, useReturnFocusOnClose } from './overlayStack';

export interface GuardrSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  panelClassName?: string;
  zIndex?: number;
  ariaLabel?: string;
  dismissable?: boolean;
}

/** Bottom sheet overlay — More menu, mobile drawers */
export function GuardrSheet({
  open,
  onClose,
  children,
  className = '',
  panelClassName = '',
  zIndex = 2100,
  ariaLabel,
  dismissable = true,
}: GuardrSheetProps) {
  const gatedClose = useOverlayCloseGate(open, onClose, dismissable);
  useReturnFocusOnClose(open);

  return (
    <Drawer
      isOpen={open}
      anchor="bottom"
      size="auto"
      animate
      autoFocus
      closeable={false}
      showBackdrop
      onClose={dismissable ? () => gatedClose() : () => {}}
      onBackdropClick={dismissable ? () => gatedClose() : undefined}
      onEscapeKeyDown={
        dismissable
          ? (e) => {
              e.preventDefault();
              gatedClose();
            }
          : (e) => e.preventDefault()
      }
      overrides={sheetOverrides({ zIndex, panelClassName })}
    >
      <div className={className} role="dialog" aria-label={ariaLabel}>{children}</div>
    </Drawer>
  );
}
