import type { FormFactor } from '../../../lib/platform/device';
import type { ShellKind } from '../../../lib/platform/shellKind';
import type { ViewSurface } from '../../../lib/platform/viewSurface';
import type { ExperienceTier } from '../../../lib/platform/experienceTier';
import {
  experienceAllowsGlassChrome,
  isLiteExperience,
  isPremiumExperience,
  resolveExperienceTier,
} from '../../../lib/platform/experienceTier';

export type MobilityLayout = 'mobile' | 'tablet' | 'desktop';

export interface MobilityChromeConfig {
  layout: MobilityLayout;
  shellKind: ShellKind;
  viewSurface: ViewSurface;
  experienceTier: ExperienceTier;
  sidebarWidth: string;
  drawerWidth: string;
  defaultSidebarOpen: boolean;
  collapsibleSidebar: boolean;
  /** PWA Full glass blur — off for Lite */
  headerGlass: boolean;
  nativeChrome: boolean;
  /** APK Premium: richer motion + 48px targets everywhere */
  premiumChrome: boolean;
  /** PWA Lite: reduced decorative chrome */
  liteChrome: boolean;
  /** Minimum touch target (px) */
  touchTargetPx: number;
  contentMaxWidth?: string;
  contentDensity: 'compact' | 'comfortable' | 'spacious';
  /** Uber Freight TMS black icon rail — desktop workspaces only. */
  showIconRail: boolean;
  iconRailWidth: string;
  /** Uber Freight TMS page title band (breadcrumb + large title + actions). */
  showPageTitleBand: boolean;
}

/** Per-platform Uber mobility chrome — independent layouts, not scaled desktop. */
export function resolveMobilityChrome(
  viewSurface: ViewSurface,
  experienceTier?: ExperienceTier,
): MobilityChromeConfig {
  const [shellKind, formFactor] = viewSurface.split('-') as [ShellKind, FormFactor];
  const tier = experienceTier ?? resolveExperienceTier(shellKind, formFactor);
  const layout: MobilityLayout = formFactor;
  const liteChrome = isLiteExperience(tier);
  const premiumChrome = isPremiumExperience(tier);
  const headerGlass = experienceAllowsGlassChrome(tier);
  const nativeChrome = shellKind === 'native';

  if (layout === 'mobile') {
    return {
      layout,
      shellKind,
      viewSurface,
      experienceTier: tier,
      sidebarWidth: '0px',
      drawerWidth: liteChrome ? 'min(300px, 72vw)' : 'min(320px, 72vw)',
      defaultSidebarOpen: false,
      collapsibleSidebar: true,
      headerGlass,
      nativeChrome,
      premiumChrome,
      liteChrome,
      touchTargetPx: nativeChrome || premiumChrome ? 48 : 44,
      contentDensity: liteChrome ? 'compact' : 'comfortable',
      showIconRail: false,
      iconRailWidth: '0px',
      showPageTitleBand: false,
    };
  }

  if (layout === 'tablet') {
    const sidebarWidth =
      premiumChrome ? '260px' : nativeChrome ? '232px' : liteChrome ? '200px' : '220px';
    return {
      layout,
      shellKind,
      viewSurface,
      experienceTier: tier,
      sidebarWidth,
      drawerWidth: sidebarWidth,
      defaultSidebarOpen: true,
      collapsibleSidebar: true,
      headerGlass,
      nativeChrome,
      premiumChrome,
      liteChrome,
      touchTargetPx: nativeChrome || premiumChrome ? 48 : 44,
      contentMaxWidth: '100%',
      contentDensity: premiumChrome ? 'spacious' : 'comfortable',
      // Tablets keep the labelled sidebar and the compact header title; an
      // icon rail would cost a second tap-target column on a touch-first
      // surface, and the title band would duplicate the header title.
      showIconRail: false,
      iconRailWidth: '0px',
      showPageTitleBand: false,
    };
  }

  return {
    layout,
    shellKind,
    viewSurface,
    experienceTier: tier,
    sidebarWidth: premiumChrome ? '288px' : shellKind === 'browser' ? '280px' : '272px',
    drawerWidth: premiumChrome ? '288px' : shellKind === 'browser' ? '280px' : '272px',
    // Uber Freight TMS: labelled panel open by default; icon rail appears when collapsed.
    defaultSidebarOpen: true,
    collapsibleSidebar: true,
    headerGlass: false,
    nativeChrome,
    premiumChrome,
    liteChrome,
    touchTargetPx: nativeChrome ? 48 : 40,
    contentMaxWidth: shellKind === 'browser' ? '1600px' : '100%',
    contentDensity: shellKind === 'browser' ? 'spacious' : 'comfortable',
    showIconRail: true,
    iconRailWidth: premiumChrome || nativeChrome ? '64px' : '56px',
    showPageTitleBand: true,
  };
}
