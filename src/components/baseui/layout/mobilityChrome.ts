import type { FormFactor } from '../../../lib/platform/device';
import type { ShellKind } from '../../../lib/platform/shellKind';
import type { ViewSurface } from '../../../lib/platform/viewSurface';

export type MobilityLayout = 'mobile' | 'tablet' | 'desktop';

export interface MobilityChromeConfig {
  layout: MobilityLayout;
  shellKind: ShellKind;
  viewSurface: ViewSurface;
  sidebarWidth: string;
  drawerWidth: string;
  defaultSidebarOpen: boolean;
  collapsibleSidebar: boolean;
  headerGlass: boolean;
  nativeChrome: boolean;
  contentMaxWidth?: string;
}

/** Per-platform Uber mobility chrome — independent layouts, not scaled desktop. */
export function resolveMobilityChrome(viewSurface: ViewSurface): MobilityChromeConfig {
  const [shellKind, formFactor] = viewSurface.split('-') as [ShellKind, FormFactor];

  const layout: MobilityLayout = formFactor;

  if (layout === 'mobile') {
    return {
      layout,
      shellKind,
      viewSurface,
      sidebarWidth: '0px',
      drawerWidth: 'min(300px, 88vw)',
      defaultSidebarOpen: false,
      collapsibleSidebar: true,
      headerGlass: shellKind === 'pwa',
      nativeChrome: shellKind === 'native',
    };
  }

  if (layout === 'tablet') {
    return {
      layout,
      shellKind,
      viewSurface,
      sidebarWidth: shellKind === 'native' ? '232px' : '220px',
      drawerWidth: '220px',
      defaultSidebarOpen: true,
      collapsibleSidebar: true,
      headerGlass: shellKind === 'pwa',
      nativeChrome: shellKind === 'native',
      contentMaxWidth: '100%',
    };
  }

  return {
    layout,
    shellKind,
    viewSurface,
    sidebarWidth: '272px',
    drawerWidth: '272px',
    defaultSidebarOpen: true,
    collapsibleSidebar: true,
    headerGlass: false,
    nativeChrome: shellKind === 'native',
    contentMaxWidth: shellKind === 'browser' ? '1600px' : '100%',
  };
}
