/**
 * Unified motion language for /uberit redesign.
 * Aligns with Uber Base motion principles and guardedesign.md §6.
 */

export const MOTION_DURATION = {
  instant: 100,
  fast: 150,
  normal: 200,
  moderate: 250,
  slow: 300,
  sheet: 320,
  chart: 600,
} as const;

export const MOTION_EASING = {
  /** Quintic-style decelerate — enter */
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** Accelerate — exit */
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Standard UI */
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  /** Spring-like for emphasis */
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const MOTION_DISTANCE = {
  sm: 8,
  md: 16,
  lg: 24,
  sheet: '100%',
} as const;

/** CSS transition shorthand helpers */
export function motionTransition(
  properties: string[] = ['opacity', 'transform'],
  duration: number = MOTION_DURATION.normal,
  easing: string = MOTION_EASING.standard,
): string {
  return properties.map((p) => `${p} ${duration}ms ${easing}`).join(', ');
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function motionDuration(preferred: number, reduced = MOTION_DURATION.instant): number {
  return prefersReducedMotion() ? reduced : preferred;
}

/** Framer Motion / motion library spring config */
export const MOTION_SPRING = {
  snappy: { type: 'spring' as const, stiffness: 420, damping: 32 },
  gentle: { type: 'spring' as const, stiffness: 280, damping: 28 },
  sheet: { type: 'spring' as const, stiffness: 320, damping: 34 },
};
