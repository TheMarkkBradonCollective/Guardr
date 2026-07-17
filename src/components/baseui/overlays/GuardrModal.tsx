import React from 'react';
import { Modal, Drawer } from '../baseuiShims';
import { modalOverrides, sheetOverrides } from './overlayStyles';
import { useOverlayCloseGate, useReturnFocusOnClose } from './overlayStack';

export interface GuardrModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  align?: 'center' | 'bottom';
  className?: string;
  panelClassName?: string;
  zIndex?: number;
  ariaLabelledBy?: string;
  position?: 'fixed' | 'absolute';
}

export function GuardrModal({
  open,
  onClose,
  children,
  align = 'bottom',
  className = '',
  panelClassName = '',
  zIndex = 1100,
  ariaLabelledBy,
}: GuardrModalProps) {
  const gatedClose = useOverlayCloseGate(open, onClose);
  useReturnFocusOnClose(open);

  if (align === 'bottom') {
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
        <div className={className} role="dialog" aria-labelledby={ariaLabelledBy}>
          {children}
        </div>
      </Drawer>
    );
  }

  return (
    <Modal
      isOpen={open}
      onClose={() => gatedClose()}
      closeable={false}
      animate
      autoFocus
      focusLock
      returnFocus
      role="dialog"
      aria-label={ariaLabelledBy ? undefined : 'Dialog'}
      overrides={modalOverrides({ zIndex, panelClassName, centered: true })}
    >
      <div className={className} aria-labelledby={ariaLabelledBy}>
        {children}
      </div>
    </Modal>
  );
}
