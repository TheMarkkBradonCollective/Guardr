import { bakedNativeProductApp } from '../productApps';
import type { ThemeMode } from './theme';
export const THEME_ICON_BACKGROUNDS: Record<ThemeMode, string> = {
  light: '#000000',
  dark: '#000000',
};

/** Browser UI accent (status bar, theme-color meta). Hire/Work stay black. */
export const THEME_BROWSER_COLORS: Record<ThemeMode, string> = {
  light: '#000000',
  dark: '#000000',
};

/** Staff light theme uses a white status bar so it matches the white launcher. */
export function themeChromeColor(mode: ThemeMode, productApp?: string | null): string {
  if (productApp === 'staff' && mode === 'light') return '#FFFFFF';
  return THEME_BROWSER_COLORS[mode];
}

const ICON_LINK_IDS = {
  faviconPng: 'guardr-theme-favicon',
  appleTouch: 'guardr-theme-apple-touch',
  icon192: 'guardr-theme-icon-192',
} as const;

function upsertLink(id: string, rel: string, href: string, extra?: Record<string, string>): void {
  if (typeof document === 'undefined') return;
  let link = document.getElementById(id) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = id;
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      link.setAttribute(key, value);
    }
  }
}

function upsertThemeColorMeta(color: string): void {
  if (typeof document === 'undefined') return;
  const metas = document.querySelectorAll('meta[name="theme-color"]');
  if (metas.length === 0) {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.setAttribute('data-guardr-theme', 'true');
    meta.content = color;
    document.head.appendChild(meta);
    return;
  }
  metas.forEach((node) => {
    const meta = node as HTMLMetaElement;
    meta.content = color;
    meta.setAttribute('data-guardr-theme', 'true');
  });
}

/** Swap favicon + touch icons to match the active theme (saved locally via theme.ts). */
export function applyThemeBranding(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;

  upsertThemeColorMeta(themeChromeColor(mode, bakedNativeProductApp()));

  upsertLink(ICON_LINK_IDS.faviconPng, 'icon', `/icons/favicon-${mode}.png`, {
    type: 'image/png',
    sizes: '64x64',
  });
  upsertLink(ICON_LINK_IDS.appleTouch, 'apple-touch-icon', `/icons/apple-touch-icon-${mode}.png`);
  upsertLink(ICON_LINK_IDS.icon192, 'icon', `/icons/icon-${mode}-192.png`, {
    type: 'image/png',
    sizes: '192x192',
  });
}

export function themeIconAssetPath(
  mode: ThemeMode,
  kind: 'favicon' | 'apple-touch-icon' | 'icon-192' | 'icon-512' | 'maskable-512'
): string {
  switch (kind) {
    case 'favicon':
      return `/icons/favicon-${mode}.png`;
    case 'apple-touch-icon':
      return `/icons/apple-touch-icon-${mode}.png`;
    case 'icon-192':
      return `/icons/icon-${mode}-192.png`;
    case 'icon-512':
      return `/icons/icon-${mode}-512.png`;
    case 'maskable-512':
      return `/icons/maskable-${mode}-512.png`;
  }
}
