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
}: GuardrSheetProps) {
  const gatedClose = useOverlayCloseGate(open, onClose);
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
      onClose={() => gatedClose()}
      onBackdropClick={() => gatedClose()}
      onEscapeKeyDown={(e) => {
        e.preventDefault();
        gatedClose();
      }}
      overrides={sheetOverrides({ zIndex, panelClassName })}
    >
      <div className={className} role="dialog" aria-label={ariaLabel}>{children}</div>
    </Drawer>
  );
}
