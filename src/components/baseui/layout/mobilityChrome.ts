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
      drawerWidth: liteChrome ? 'min(280px, 86vw)' : 'min(300px, 88vw)',
      defaultSidebarOpen: false,
      collapsibleSidebar: true,
      headerGlass,
      nativeChrome,
      premiumChrome,
      liteChrome,
      touchTargetPx: nativeChrome || premiumChrome ? 48 : 44,
      contentDensity: liteChrome ? 'compact' : 'comfortable',
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
    };
  }

  return {
    layout,
    shellKind,
    viewSurface,
    experienceTier: tier,
    sidebarWidth: premiumChrome ? '288px' : shellKind === 'browser' ? '280px' : '272px',
    drawerWidth: premiumChrome ? '288px' : shellKind === 'browser' ? '280px' : '272px',
    defaultSidebarOpen: true,
    collapsibleSidebar: true,
    headerGlass: false,
    nativeChrome,
    premiumChrome,
    liteChrome,
    touchTargetPx: nativeChrome ? 48 : 40,
    contentMaxWidth: shellKind === 'browser' ? '1600px' : '100%',
    contentDensity: shellKind === 'browser' ? 'spacious' : 'comfortable',
  };
}
