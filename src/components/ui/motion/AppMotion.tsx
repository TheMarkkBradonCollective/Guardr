import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { AnimatePresence, motion, MotionConfig, type Transition, type Variants } from 'motion/react';

/** Wrap app shells to respect prefers-reduced-motion */
export function AppMotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/**
 * Shared open-dialog stack so Escape only closes the topmost overlay.
 * Without this, AppModal/AppOverlaySheet/AppDrawer each register their own
 * independent `window` keydown listener, so a single Escape press with two
 * dialogs stacked (e.g. a confirm prompt over a detail sheet) closes both.
 */
const openDialogStack: symbol[] = [];

/** Registers this dialog while `active`; its `onClose` only fires on Escape when it's topmost. */
function useTopmostEscapeClose(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const token = Symbol('dialog');
    openDialogStack.push(token);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openDialogStack[openDialogStack.length - 1] === token) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      const idx = openDialogStack.indexOf(token);
      if (idx !== -1) openDialogStack.splice(idx, 1);
      window.removeEventListener('keydown', onKey);
    };
  }, [active, onClose]);
}

/**
 * Returns keyboard/screen-reader focus to whatever was focused before the
 * dialog opened (e.g. the button that triggered it), once it closes. Doesn't
 * force focus *into* the dialog on open — several dialog bodies already set
 * their own `autoFocus` on a specific field, and forcing focus onto the
 * panel/first-focusable element here would fight with that intentional
 * placement (e.g. steal focus from an autofocused input to an earlier
 * Cancel button in DOM order).
 */
function useReturnFocusOnClose(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    return () => {
      if (previouslyFocused && document.contains(previouslyFocused) && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [active]);
}

/** Uber-style snappy ease — confident, not bouncy */
export const APP_MOTION_EASE = [0.16, 1, 0.3, 1] as const;

export const APP_MOTION_DURATION = {
  fast: 0.2,
  page: 0.28,
  modal: 0.32,
  sheet: 0.34,
} as const;

const pageVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const pageTransition: Transition = {
  duration: APP_MOTION_DURATION.page,
  ease: APP_MOTION_EASE,
};

interface AppPageTransitionProps {
  motionKey: string;
  children: React.ReactNode;
  className?: string;
}

/** Cross-fade + slide for tab / section / route changes */
export function AppPageTransition({ motionKey, children, className = '' }: AppPageTransitionProps) {
  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={motionKey}
        initial={false}
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
        className={`app-page-transition ${className}`.trim()}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

interface AppModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Bottom sheet on mobile, centered on larger screens */
  align?: 'center' | 'bottom';
  className?: string;
  panelClassName?: string;
  zIndex?: number;
  ariaLabelledBy?: string;
  /** Use when modal is rendered inside a positioned container (e.g. guard map stack) */
  position?: 'fixed' | 'absolute';
}

export function AppModal({
  open,
  onClose,
  children,
  align = 'bottom',
  className = '',
  panelClassName = '',
  zIndex = 1100,
  ariaLabelledBy,
  position: _position = 'fixed',
}: AppModalProps) {
  useTopmostEscapeClose(open, onClose);
  useReturnFocusOnClose(open);
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const panelInitial =
    align === 'bottom'
      ? { opacity: 0, y: 48, scale: 0.98 }
      : { opacity: 0, y: 18, scale: 0.98 };
  const panelExit =
    align === 'bottom'
      ? { opacity: 0, y: 28, scale: 0.98 }
      : { opacity: 0, y: 10, scale: 0.98 };

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 flex items-end sm:items-center justify-center p-4 ${className}`.trim()}
          style={{ zIndex }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabelledBy}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: APP_MOTION_DURATION.fast }}
        >
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: APP_MOTION_DURATION.modal }}
            onClick={onClose}
          />
          <motion.div
            className={`relative w-full max-w-lg modal-panel max-h-[90vh] overflow-y-auto ${panelClassName}`.trim()}
            initial={panelInitial}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={panelExit}
            transition={{ duration: APP_MOTION_DURATION.modal, ease: APP_MOTION_EASE }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return modal;
  return createPortal(modal, document.body);
}

interface AppOverlaySheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  panelClassName?: string;
  zIndex?: number;
  ariaLabel?: string;
}

/** Bottom sheet overlay — More menu, mobile drawers */
export function AppOverlaySheet({
  open,
  onClose,
  children,
  className = '',
  panelClassName = '',
  zIndex = 2100,
  ariaLabel,
}: AppOverlaySheetProps) {
  useTopmostEscapeClose(open, onClose);
  useReturnFocusOnClose(open);
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const sheet = (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 ${className}`.trim()}
          style={{ zIndex }}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: APP_MOTION_DURATION.fast }}
        >
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`absolute inset-x-0 bottom-0 max-h-[85dvh] border-t border-brand-border bg-brand-surface text-brand-text shadow-[var(--shadow-float)] ${panelClassName}`.trim()}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: APP_MOTION_DURATION.sheet, ease: APP_MOTION_EASE }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return sheet;
  return createPortal(sheet, document.body);
}

interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Left sidebar drawer with slide-in */
export function AppDrawer({ open, onClose, title, subtitle, children, footer }: AppDrawerProps) {
  useTopmostEscapeClose(open, onClose);
  useReturnFocusOnClose(open);
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="sidebar-drawer-root fixed inset-0 z-[2100]"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="sidebar-drawer-panel absolute inset-y-0 left-0 flex flex-col"
            style={{ width: 'min(22rem, 90vw)' }}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: APP_MOTION_DURATION.sheet, ease: APP_MOTION_EASE }}
          >
            {/* Dark Uber-style header */}
            <div
              className="shrink-0 flex items-center justify-between gap-3 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4"
              style={{ borderBottom: '1px solid #1a1a1a' }}
            >
              <div className="min-w-0">
                {subtitle && (
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-40 mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{subtitle}</p>
                )}
                <p className="font-black text-xl tracking-[-0.04em] leading-tight" style={{ color: '#ffffff' }}>{title}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center transition-colors shrink-0 rounded-lg"
                style={{ color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.08)' }}
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 pb-6">{children}</div>
            {footer && (
              <div className="shrink-0 p-4 space-y-2" style={{ borderTop: '1px solid #1a1a1a' }}>
                {footer}
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
