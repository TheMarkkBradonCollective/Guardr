import React from 'react';
import { MotionConfig, AnimatePresence, motion, type Transition, type Variants } from 'motion/react';
import { GuardrModal } from '../../baseui/overlays/GuardrModal';
import { GuardrSheet } from '../../baseui/overlays/GuardrSheet';
import { GuardrDrawer } from '../../baseui/overlays/GuardrDrawer';
export { closeTopmostDialog } from '../../baseui/overlays/overlayStack';

/** Wrap app shells to respect prefers-reduced-motion */
export function AppMotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
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
  align?: 'center' | 'bottom';
  className?: string;
  panelClassName?: string;
  zIndex?: number;
  ariaLabelledBy?: string;
  position?: 'fixed' | 'absolute';
  dismissable?: boolean;
}

/** Base Web modal / bottom sheet with overlay stack integration */
export function AppModal(props: AppModalProps) {
  return <GuardrModal {...props} />;
}

interface AppOverlaySheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  panelClassName?: string;
  zIndex?: number;
  ariaLabel?: string;
  dismissable?: boolean;
}

/** Base Web bottom sheet */
export function AppOverlaySheet(props: AppOverlaySheetProps) {
  return <GuardrSheet {...props} />;
}

interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Base Web left drawer */
export function AppDrawer(props: AppDrawerProps) {
  return <GuardrDrawer {...props} />;
}
