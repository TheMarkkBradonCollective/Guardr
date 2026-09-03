import React from 'react';
import { Modal, Drawer } from '../baseuiShims';
import { modalOverrides, sheetOverrides } from './overlayStyles';
import { useOverlayCloseGate, useReturnFocusOnClose } from './overlayStack';
import { prefersMobileGestureUi, useDevice } from '../../../lib/platform';
import { useSurfaceKind } from '../../../surfaces/SurfaceProvider';

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
  /** When false, backdrop tap, Escape, and system back do not close. */
  dismissable?: boolean;
  /** Keep `align` even on the mobile surface (image lightbox, etc.). */
  lockAlign?: boolean;
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
  dismissable = true,
  lockAlign = false,
}: GuardrModalProps) {
  const { viewSurface } = useDevice();
  const surface = useSurfaceKind();
  const gestureUi = prefersMobileGestureUi(viewSurface);
  const gatedClose = useOverlayCloseGate(open, onClose, dismissable);
  useReturnFocusOnClose(open);

  const mobileSurface = surface === 'mobile';
  const resolvedAlign = mobileSurface && !lockAlign ? 'bottom' : align;
  // The mobile application always presents as a sheet — including a letterboxed
  // `?ui=mobile` preview on a desktop pointer, where gestureUi would otherwise
  // stay false and keep a centered website dialog.
  const useBottomSheet = resolvedAlign === 'bottom' && (gestureUi || mobileSurface);

  if (useBottomSheet) {
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
        <div className={className} role="dialog" aria-labelledby={ariaLabelledBy}>
          {children}
        </div>
      </Drawer>
    );
  }

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
      aria-label={ariaLabelledBy ? undefined : 'Dialog'}
      overrides={modalOverrides({ zIndex, panelClassName, centered: true })}
    >
      <div className={className} aria-labelledby={ariaLabelledBy}>
        {children}
      </div>
    </Modal>
  );
}
