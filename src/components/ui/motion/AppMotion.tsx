import React from 'react';
import { MotionConfig, AnimatePresence, motion, type Transition, type Variants } from 'motion/react';
import { GuardrModal } from '../../baseui/overlays/GuardrModal';
import { GuardrSheet } from '../../baseui/overlays/GuardrSheet';
import { GuardrDrawer } from '../../baseui/overlays/GuardrDrawer';
import { useDevice } from '../../../lib/platform';
import { experienceMotionScale, isLiteExperience } from '../../../lib/platform/experienceTier';
export { closeTopmostDialog } from '../../baseui/overlays/overlayStack';

/**
 * Root motion config — all children respect prefers-reduced-motion.
 * Wrap the entire app in this provider (done in main.tsx).
 */
export function AppMotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Guardr-style snappy decelerate easing — confident, not bouncy */
export const APP_MOTION_EASE = [0.16, 1, 0.3, 1] as const;
export const APP_MOTION_EASE_EXIT = [0.4, 0, 1, 1] as const;

export const APP_MOTION_DURATION = {
  instant: 0.10,
  fast:    0.18,
  page:    0.26,
  modal:   0.28,
  sheet:   0.32,
} as const;

// ─── Page transition — tab/section/route cross-fade + slide ──────────────────

const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

const litePageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
};

interface AppPageTransitionProps {
  motionKey: string;
  children: React.ReactNode;
  className?: string;
}

/** Cross-fade + slide for tab / section / route changes — lite skips spatial motion */
export function AppPageTransition({ motionKey, children, className = '' }: AppPageTransitionProps) {
  const { experienceTier } = useDevice();
  const lite = isLiteExperience(experienceTier);
  const scale = experienceMotionScale(experienceTier);
  const transition: Transition = {
    duration: APP_MOTION_DURATION.page * scale,
    ease: APP_MOTION_EASE,
  };

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={motionKey}
        initial={false}
        animate="animate"
        exit="exit"
        variants={lite ? litePageVariants : pageVariants}
        transition={transition}
        className={`app-page-transition ${className}`.trim()}
        style={{ minHeight: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Card entrance — staggered list items ────────────────────────────────────

export const cardVariants: Variants = {
  hidden:  { opacity: 0, y: 8, scale: 0.99 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export const cardListVariants: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

interface AnimatedCardListProps {
  children: React.ReactNode;
  className?: string;
}

/** Staggered entrance for lists of cards/rows */
export function AnimatedCardList({ children, className = '' }: AnimatedCardListProps) {
  return (
    <motion.div
      variants={cardListVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Individual card that enters with a fade-up inside AnimatedCardList */
export function AnimatedCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={cardVariants}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Press feedback — scale-down on tap ──────────────────────────────────────

export const pressFeedback = {
  whileTap: { scale: 0.96 } as const,
  transition: { duration: 0.12 } as const,
};

// ─── Overlay components ───────────────────────────────────────────────────────

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
  lockAlign?: boolean;
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
