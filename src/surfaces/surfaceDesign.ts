/**
 * Three independent design scales.
 *
 * Each surface has its own type ramp, spacing rhythm, radii, elevation, and
 * control sizing. They are not derived from one another and there is no shared
 * "base" scale that gets multiplied — a tablet is not a big phone and a desktop
 * is not a wide tablet, so the numbers are authored per surface.
 *
 * Only the brand layer (colour, font family, status hues) is shared; that lives
 * in `src/styles/surface-foundation.css`.
 */

import type { SurfaceKind } from './surfaceKind';

export type NavigationModel =
  /** Fixed bottom tab bar + overflow sheet. Thumb reach is the constraint. */
  | 'bottom-tabs'
  /** Persistent icon+label rail with grouped sections and a detail inspector. */
  | 'side-rail'
  /** Permanent grouped sidebar plus a global top bar and command palette. */
  | 'sidebar-topbar';

export type OverlayModel =
  /** Bottom sheets with drag handles and snap points. */
  | 'sheet'
  /** Slide-in side panels docked to the split view. */
  | 'side-panel'
  /** Centred modal dialogs and docked inspector panels. */
  | 'dialog';

export type DetailModel =
  /** Detail pushes a new full screen over the list. */
  | 'push'
  /** List and detail are visible together in a split view. */
  | 'split'
  /** List, detail, and a third inspector column coexist. */
  | 'multi-panel';

export interface SurfaceTypeScale {
  display: number;
  title: number;
  heading: number;
  subheading: number;
  body: number;
  label: number;
  caption: number;
  /** Line height multiplier applied to body copy. */
  bodyLeading: number;
  /** Tracking for display/title sizes, in em. */
  displayTracking: number;
}

export interface SurfaceControlScale {
  /** Minimum hit area for any interactive element, in px. */
  minTarget: number;
  /** Default height of a primary button. */
  buttonHeight: number;
  /** Default height of a text input. */
  inputHeight: number;
  /** Default height of a list row. */
  rowHeight: number;
  /** Icon size used inside controls. */
  iconSize: number;
}

export interface SurfaceRadiusScale {
  control: number;
  card: number;
  surface: number;
  overlay: number;
  pill: number;
}

export interface SurfaceMotionProfile {
  /** Page/route transition duration, ms. */
  page: number;
  /** Overlay entrance duration, ms. */
  overlay: number;
  /** Micro-interaction duration (press, hover, toggle), ms. */
  micro: number;
  /** Stagger between list items on enter, ms. */
  stagger: number;
  /** Named easing for entrances. */
  enter: string;
  /** Named easing for exits. */
  exit: string;
  /** How a page replaces the previous one. */
  pageTransition: 'slide-over' | 'cross-fade' | 'panel-fade';
}

export interface SurfaceLayoutScale {
  /** Horizontal page gutter, px. */
  gutter: number;
  /** Vertical rhythm between stacked sections, px. */
  sectionGap: number;
  /** Gap inside grids and card groups, px. */
  gridGap: number;
  /** Height of the primary chrome band (header / top bar), px. */
  chromeHeight: number;
  /** Height of the bottom tab bar, px. 0 when the surface has none. */
  bottomBarHeight: number;
  /** Width of the persistent navigation column, px. 0 when there is none. */
  navWidth: number;
  /** Collapsed navigation width, px. 0 when navigation cannot collapse. */
  navCollapsedWidth: number;
  /** Width of the detail/inspector column, px. 0 when there is none. */
  inspectorWidth: number;
  /** Maximum width of the reading column, or null for full bleed. */
  contentMaxWidth: number | null;
  /** Preferred column count for card grids. */
  gridColumns: number;
}

export interface SurfaceDesignScale {
  surface: SurfaceKind;
  navigation: NavigationModel;
  overlay: OverlayModel;
  detail: DetailModel;
  density: 'comfortable' | 'balanced' | 'compact';
  /** Content runs to the physical screen edges (no letterboxing). */
  edgeToEdge: boolean;
  /** Hover affordances are reachable and therefore allowed to carry meaning. */
  hoverCapable: boolean;
  /** Keyboard shortcuts and a command palette are offered. */
  keyboardFirst: boolean;
  /** Horizontal/vertical drag gestures drive navigation and row actions. */
  gestureNavigation: boolean;
  /** Drag-and-drop is offered for reordering and assignment. */
  dragAndDrop: boolean;
  type: SurfaceTypeScale;
  control: SurfaceControlScale;
  radius: SurfaceRadiusScale;
  layout: SurfaceLayoutScale;
  motion: SurfaceMotionProfile;
  /** Box shadows per elevation step. Desktop stays flatter and relies on borders. */
  elevation: readonly string[];
}

const MOBILE: SurfaceDesignScale = {
  surface: 'mobile',
  navigation: 'bottom-tabs',
  overlay: 'sheet',
  detail: 'push',
  density: 'comfortable',
  edgeToEdge: true,
  hoverCapable: false,
  keyboardFirst: false,
  gestureNavigation: true,
  dragAndDrop: false,
  type: {
    display: 40,
    title: 28,
    heading: 22,
    subheading: 17,
    body: 16,
    label: 14,
    caption: 12,
    bodyLeading: 1.45,
    displayTracking: -0.03,
  },
  control: {
    minTarget: 48,
    buttonHeight: 52,
    inputHeight: 52,
    rowHeight: 68,
    iconSize: 24,
  },
  radius: {
    control: 12,
    card: 16,
    surface: 20,
    overlay: 24,
    pill: 999,
  },
  layout: {
    gutter: 16,
    sectionGap: 24,
    gridGap: 12,
    chromeHeight: 56,
    bottomBarHeight: 60,
    navWidth: 0,
    navCollapsedWidth: 0,
    inspectorWidth: 0,
    contentMaxWidth: null,
    gridColumns: 1,
  },
  motion: {
    page: 300,
    overlay: 320,
    micro: 140,
    stagger: 45,
    enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    pageTransition: 'slide-over',
  },
  elevation: [
    'none',
    '0 1px 2px rgba(0, 0, 0, 0.06)',
    '0 6px 18px rgba(0, 0, 0, 0.10)',
    '0 -8px 32px rgba(0, 0, 0, 0.16)',
  ],
};

const TABLET: SurfaceDesignScale = {
  surface: 'tablet',
  navigation: 'side-rail',
  overlay: 'side-panel',
  detail: 'split',
  density: 'balanced',
  edgeToEdge: false,
  hoverCapable: false,
  keyboardFirst: false,
  gestureNavigation: true,
  dragAndDrop: false,
  type: {
    display: 30,
    title: 24,
    heading: 19,
    subheading: 16,
    body: 15,
    label: 13,
    caption: 12,
    bodyLeading: 1.5,
    displayTracking: -0.025,
  },
  control: {
    minTarget: 44,
    buttonHeight: 46,
    inputHeight: 46,
    rowHeight: 60,
    iconSize: 22,
  },
  radius: {
    control: 10,
    card: 14,
    surface: 16,
    overlay: 18,
    pill: 999,
  },
  layout: {
    gutter: 24,
    sectionGap: 20,
    gridGap: 16,
    chromeHeight: 60,
    bottomBarHeight: 0,
    navWidth: 200,
    navCollapsedWidth: 72,
    inspectorWidth: 360,
    contentMaxWidth: null,
    gridColumns: 2,
  },
  motion: {
    page: 260,
    overlay: 280,
    micro: 130,
    stagger: 35,
    enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    pageTransition: 'panel-fade',
  },
  elevation: [
    'none',
    '0 1px 2px rgba(0, 0, 0, 0.05)',
    '0 4px 14px rgba(0, 0, 0, 0.08)',
    '0 12px 36px rgba(0, 0, 0, 0.14)',
  ],
};

const DESKTOP: SurfaceDesignScale = {
  surface: 'desktop',
  navigation: 'sidebar-topbar',
  overlay: 'dialog',
  detail: 'multi-panel',
  density: 'compact',
  edgeToEdge: false,
  hoverCapable: true,
  keyboardFirst: true,
  gestureNavigation: false,
  dragAndDrop: true,
  type: {
    display: 28,
    title: 21,
    heading: 17,
    subheading: 15,
    body: 14,
    label: 12,
    caption: 11,
    bodyLeading: 1.5,
    displayTracking: -0.02,
  },
  control: {
    minTarget: 32,
    buttonHeight: 36,
    inputHeight: 36,
    rowHeight: 40,
    iconSize: 16,
  },
  radius: {
    control: 6,
    card: 8,
    surface: 10,
    overlay: 12,
    pill: 999,
  },
  layout: {
    gutter: 24,
    sectionGap: 16,
    gridGap: 16,
    chromeHeight: 52,
    bottomBarHeight: 28,
    navWidth: 248,
    navCollapsedWidth: 56,
    inspectorWidth: 400,
    contentMaxWidth: 1760,
    gridColumns: 4,
  },
  motion: {
    page: 160,
    overlay: 180,
    micro: 100,
    stagger: 18,
    enter: 'cubic-bezier(0.2, 0, 0, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    pageTransition: 'cross-fade',
  },
  elevation: [
    'none',
    '0 1px 2px rgba(0, 0, 0, 0.05)',
    '0 2px 8px rgba(0, 0, 0, 0.07)',
    '0 16px 48px rgba(0, 0, 0, 0.18)',
  ],
};

export const SURFACE_DESIGN: Record<SurfaceKind, SurfaceDesignScale> = {
  mobile: MOBILE,
  tablet: TABLET,
  desktop: DESKTOP,
};

export function surfaceDesign(surface: SurfaceKind): SurfaceDesignScale {
  return SURFACE_DESIGN[surface];
}

/**
 * CSS custom properties for a surface, written on the surface root element.
 *
 * Every surface component reads these instead of hard-coding numbers, which is
 * what keeps the three CSS layers from leaking into one another.
 */
export function surfaceCssVars(surface: SurfaceKind): Record<string, string> {
  const d = surfaceDesign(surface);
  return {
    '--sf-type-display': `${d.type.display}px`,
    '--sf-type-title': `${d.type.title}px`,
    '--sf-type-heading': `${d.type.heading}px`,
    '--sf-type-subheading': `${d.type.subheading}px`,
    '--sf-type-body': `${d.type.body}px`,
    '--sf-type-label': `${d.type.label}px`,
    '--sf-type-caption': `${d.type.caption}px`,
    '--sf-leading-body': `${d.type.bodyLeading}`,
    '--sf-tracking-display': `${d.type.displayTracking}em`,

    '--sf-target': `${d.control.minTarget}px`,
    '--sf-button-h': `${d.control.buttonHeight}px`,
    '--sf-input-h': `${d.control.inputHeight}px`,
    '--sf-row-h': `${d.control.rowHeight}px`,
    '--sf-icon': `${d.control.iconSize}px`,

    '--sf-radius-control': `${d.radius.control}px`,
    '--sf-radius-card': `${d.radius.card}px`,
    '--sf-radius-surface': `${d.radius.surface}px`,
    '--sf-radius-overlay': `${d.radius.overlay}px`,
    '--sf-radius-pill': `${d.radius.pill}px`,

    '--sf-gutter': `${d.layout.gutter}px`,
    '--sf-section-gap': `${d.layout.sectionGap}px`,
    '--sf-grid-gap': `${d.layout.gridGap}px`,
    '--sf-chrome-h': `${d.layout.chromeHeight}px`,
    '--sf-bottom-bar-h': `${d.layout.bottomBarHeight}px`,
    '--sf-nav-w': `${d.layout.navWidth}px`,
    '--sf-nav-collapsed-w': `${d.layout.navCollapsedWidth}px`,
    '--sf-inspector-w': `${d.layout.inspectorWidth}px`,
    '--sf-content-max': d.layout.contentMaxWidth ? `${d.layout.contentMaxWidth}px` : 'none',
    '--sf-grid-cols': `${d.layout.gridColumns}`,

    '--sf-dur-page': `${d.motion.page}ms`,
    '--sf-dur-overlay': `${d.motion.overlay}ms`,
    '--sf-dur-micro': `${d.motion.micro}ms`,
    '--sf-stagger': `${d.motion.stagger}ms`,
    '--sf-ease-enter': d.motion.enter,
    '--sf-ease-exit': d.motion.exit,

    '--sf-elev-0': d.elevation[0],
    '--sf-elev-1': d.elevation[1],
    '--sf-elev-2': d.elevation[2],
    '--sf-elev-3': d.elevation[3],
  };
}

/** True when the surface renders its detail view alongside the list. */
export function surfaceShowsDetailBeside(surface: SurfaceKind): boolean {
  return surfaceDesign(surface).detail !== 'push';
}

/** How many primary destinations the surface can show before overflowing. */
export function surfacePrimaryNavCapacity(surface: SurfaceKind): number {
  if (surface === 'mobile') return 5;
  if (surface === 'tablet') return 9;
  return Number.MAX_SAFE_INTEGER;
}
