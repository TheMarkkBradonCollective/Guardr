/**
 * Guardr unified motion language — Base Web motion principles.
 * §6 of guardedesign.md: purposeful, 150–300ms, respects prefers-reduced-motion.
 * PWA Lite shortens motion; APK Premium allows slightly richer springs.
 */

import {
  experienceMotionScale,
  isLiteExperience,
  resolveExperienceTier,
  type ExperienceTier,
} from '../lib/platform/experienceTier';
import { getShellKind } from '../lib/platform/shellKind';
import { getViewportWidth, resolveFormFactor } from '../lib/platform/device';

// ─── Duration ─────────────────────────────────────────────────────────────────
export const MOTION_DURATION = {
  /** Instant micro-feedback (ripples, icon swaps) */
  instant: 100,
  /** Fast UI transitions (button presses, chip toggles) */
  fast: 150,
  /** Standard transitions (fade, hover, colour) */
  normal: 200,
  /** Moderate (panel reveals, tab switches) */
  moderate: 250,
  /** Slow deliberate motion (page enter, status changes) */
  slow: 300,
  /** Sheet / drawer entrance */
  sheet: 320,
  /** Chart / data animation */
  chart: 600,
} as const;

// ─── Easing ───────────────────────────────────────────────────────────────────
export const MOTION_EASING = {
  /** Quintic decelerate — element entering the screen */
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** Accelerate — element leaving the screen */
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Standard UI (most state changes) */
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  /** Spring-like bounce for emphasis (badges, counters) */
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  /** Linear — colour/opacity only, no spatial movement */
  linear: 'linear',
} as const;

// ─── Spatial distance ─────────────────────────────────────────────────────────
export const MOTION_DISTANCE = {
  /** Subtle shift for small elements */
  sm: 6,
  /** Standard entry for panels and cards */
  md: 14,
  /** Full panel slide */
  lg: 24,
  /** Full-screen sheet */
  sheet: '100%',
} as const;

// ─── Spring configs (motion/framer-motion) ────────────────────────────────────
export const MOTION_SPRING = {
  snappy: { type: 'spring' as const, stiffness: 420, damping: 32 },
  gentle: { type: 'spring' as const, stiffness: 280, damping: 28 },
  sheet:  { type: 'spring' as const, stiffness: 320, damping: 34 },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** CSS transition shorthand for multiple properties. */
export function motionTransition(
  properties: string[] = ['opacity', 'transform'],
  duration: number = MOTION_DURATION.normal,
  easing: string = MOTION_EASING.standard,
): string {
  return properties.map((p) => `${p} ${duration}ms ${easing}`).join(', ');
}

/** Returns true if the user prefers reduced motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function currentExperienceTier(override?: ExperienceTier): ExperienceTier {
  if (override) return override;
  if (typeof window === 'undefined') return { shell: 'browser', mode: 'standard' };
  return resolveExperienceTier(getShellKind(), resolveFormFactor(getViewportWidth()));
}

/**
 * Returns `preferred` duration unless user prefers reduced motion,
 * in which case `reduced` is returned (default: instant).
 * PWA Lite scales durations down; Premium APK scales slightly up.
 */
export function motionDuration(
  preferred: number,
  reduced = MOTION_DURATION.instant,
  tier?: ExperienceTier,
): number {
  if (prefersReducedMotion()) return reduced;
  const experience = currentExperienceTier(tier);
  if (isLiteExperience(experience)) {
    return Math.max(MOTION_DURATION.instant, Math.round(preferred * experienceMotionScale(experience)));
  }
  return Math.round(preferred * experienceMotionScale(experience));
}

/** True when charts/counter animations should be skipped (PWA Lite or reduced motion). */
export function shouldReduceDecorativeMotion(tier?: ExperienceTier): boolean {
  if (prefersReducedMotion()) return true;
  return isLiteExperience(currentExperienceTier(tier));
}

// ─── Framer Motion variants ───────────────────────────────────────────────────

/** Fade + subtle slide-up — for page/section enters. */
export const fadeUpVariants = {
  hidden:  { opacity: 0, y: MOTION_DISTANCE.sm },
  visible: { opacity: 1, y: 0, transition: { duration: MOTION_DURATION.slow / 1000, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -MOTION_DISTANCE.sm / 2, transition: { duration: MOTION_DURATION.fast / 1000, ease: [0.4, 0, 1, 1] } },
};

/** Staggered list — wrap children in this container. */
export const staggerContainerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

/** Individual staggered item. */
export const staggerItemVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
};

/** Sheet enter from bottom. */
export const sheetVariants = {
  hidden:  { y: '100%', opacity: 0 },
  visible: { y: 0, opacity: 1, transition: MOTION_SPRING.sheet },
  exit:    { y: '100%', opacity: 0, transition: { duration: MOTION_DURATION.normal / 1000, ease: [0.4, 0, 1, 1] } },
};

/** Sidebar drawer from left. */
export const drawerVariants = {
  hidden:  { x: '-100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: MOTION_SPRING.sheet },
  exit:    { x: '-100%', opacity: 0, transition: { duration: MOTION_DURATION.normal / 1000, ease: [0.4, 0, 1, 1] } },
};
