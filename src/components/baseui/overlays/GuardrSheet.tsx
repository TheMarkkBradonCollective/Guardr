import React from 'react';
import { Drawer, Modal } from '../baseuiShims';
import { modalOverrides, sheetOverrides } from './overlayStyles';
import { useOverlayCloseGate, useReturnFocusOnClose } from './overlayStack';
import { prefersMobileGestureUi, useDevice } from '../../../lib/platform';

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

/**
 * Bottom sheet overlay — More menu, mobile drawers.
 * Website desktop (`browser-desktop`) uses a centered modal instead of a slide-up sheet.
 * Mobile browser, PWA, and APK keep the bottom Drawer.
 */
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
  const { viewSurface } = useDevice();
  const gestureUi = prefersMobileGestureUi(viewSurface);
  const gatedClose = useOverlayCloseGate(open, onClose, dismissable);
  useReturnFocusOnClose(open);

  if (!gestureUi) {
    return (
      <Modal
        isOpen={open}
        onClose={dismissable ? () => gatedClose() : () => {}}
        closeable={false}
        animate
        autoFocus
        focusLock
        returnFocus
        role="dialog"
        aria-label={ariaLabel}
        overrides={modalOverrides({ zIndex, panelClassName, centered: true })}
      >
        <div className={`guardr-sheet-root${className ? ` ${className}` : ''}`} aria-label={ariaLabel}>
          {children}
        </div>
      </Modal>
    );
  }

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
      <div className={`guardr-sheet-root${className ? ` ${className}` : ''}`} role="dialog" aria-label={ariaLabel}>
        {children}
      </div>
    </Drawer>
  );
}
