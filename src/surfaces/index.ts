/**
 * Guardr surfaces — three independent applications.
 *
 * Guardr does not ship one responsive interface. It ships a mobile app, a tablet
 * app, and a desktop operations centre that share branding, domain logic, and
 * data but no layouts, navigation, page structures, or component arrangements.
 *
 * Entry points:
 *   `SurfaceProvider`  resolves which application to load and publishes it
 *   `SurfaceAppShell`  lazily mounts that application's shell
 *   `SurfacePage` etc. per-surface page composition for feature screens
 *
 * Architecture notes live in `docs/SURFACES.md`.
 */

export {
  currentSurfaceOverride,
  detectCoarsePointer,
  isSurfaceKind,
  readStoredSurfaceOverride,
  readSurfaceOverrideFromQuery,
  resolveSurfaceKind,
  setSurfaceOverride,
  surfaceDataset,
  surfaceLabel,
  SURFACE_BOUNDS,
  SURFACE_KINDS,
  type SurfaceKind,
  type SurfaceResolutionInput,
} from './surfaceKind';

export {
  surfaceCssVars,
  surfaceDesign,
  surfacePrimaryNavCapacity,
  surfaceShowsDetailBeside,
  SURFACE_DESIGN,
  type DetailModel,
  type NavigationModel,
  type OverlayModel,
  type SurfaceControlScale,
  type SurfaceDesignScale,
  type SurfaceLayoutScale,
  type SurfaceMotionProfile,
  type SurfaceRadiusScale,
  type SurfaceTypeScale,
} from './surfaceDesign';

export {
  buildDesktopNavigation,
  buildMobileNavigation,
  buildSurfaceNavigation,
  buildTabletNavigation,
  desktopShortcutMap,
  navigationDestinationIds,
  type DesktopSidebarNavigation,
  type MobileTabsNavigation,
  type SurfaceCommand,
  type SurfaceDestination,
  type SurfaceNavigation,
  type TabletRailNavigation,
} from './surfaceNavigation';

export {
  OnDesktop,
  OnMobile,
  OnTablet,
  SurfaceProvider,
  SurfaceSwitch,
  useLayoutFormFactor,
  useSurface,
  useSurfaceDesign,
  useSurfaceKind,
} from './SurfaceProvider';

export { preloadSurface, SurfaceAppShell } from './SurfaceAppShell';
export type { SurfaceShellProps } from './surfaceShellTypes';

export {
  SurfaceListDetail,
  SurfaceOverlay,
  SurfacePage,
  SurfaceSkeleton,
  SurfaceTabs,
  type SurfaceListDetailProps,
  type SurfaceOverlayProps,
  type SurfacePageProps,
} from './SurfacePage';
