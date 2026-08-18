import type React from 'react';
import type { SurfaceCommand, SurfaceDestination } from './surfaceNavigation';

/**
 * The role's single most important action — create a job, post a shift.
 *
 * Each surface promotes it differently: the mobile app as a sticky bottom CTA or
 * floating button, the tablet inline beside the page title, the desktop as a
 * sidebar button plus a command palette entry.
 */
export interface SurfacePrimaryAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

/**
 * The contract every surface shell implements.
 *
 * This is deliberately a description of *content and destinations*, not of
 * layout. It says "here is the page, here is where the user can go, here is who
 * is signed in" and leaves each shell free to arrange that however its surface
 * demands — bottom tabs, a touch rail, or a sidebar with a command palette.
 *
 * Nothing here mentions sidebars, sheets, drawers, or headers by position, which
 * is what lets the three shells stay structurally independent.
 */
export interface SurfaceShellProps {
  /** Page title for the active destination. */
  title: string;
  /** Workspace/role label, e.g. "Guard workspace". */
  workspaceLabel?: string;
  /** Every destination this role can reach, in canonical order. */
  destinations: SurfaceDestination[];
  activeId: string;
  onNavigate: (id: string) => void;
  children: React.ReactNode;

  /** Notification affordance rendered into whichever chrome the surface owns. */
  notifications?: React.ReactNode;
  /** Account menu content. Each surface presents it differently. */
  accountMenu?: React.ReactNode;
  /** Signed-in identity block (avatar + name). */
  identity?: React.ReactNode;
  /** Links rendered at the foot of persistent navigation, where one exists. */
  navFooter?: React.ReactNode;

  /** Replaces the surface's own header for immersive screens (map, active shift). */
  headerOverride?: React.ReactNode;
  /** Extra band under the header, e.g. a filter row owned by the page. */
  headerExtension?: React.ReactNode;
  /** Breadcrumb parent for surfaces that show one. */
  breadcrumb?: string;
  /** Page-level actions for surfaces that have a place to put them. */
  pageActions?: React.ReactNode;
  /** Primary call to action, promoted differently per surface. */
  primaryAction?: SurfacePrimaryAction;

  /** Hides all chrome — used by full-screen flows. */
  hideChrome?: boolean;
  /** Hides primary navigation while keeping the header (e.g. an active trip). */
  hidePrimaryNav?: boolean;
  /** Content owns the full canvas with no padding (maps, media). */
  bleed?: boolean;
  /** Back affordance for pushed screens. */
  onBack?: () => void;

  /** Extra command palette actions. Desktop only; ignored elsewhere. */
  commands?: SurfaceCommand[];

  /**
   * Mobile primary navigation model. Guards/clients use thumb tabs; staff uses a
   * hamburger drawer because the ops catalog is too large for a bottom bar.
   */
  mobilePrimaryNav?: 'tabs' | 'drawer';
}
