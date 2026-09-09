import { Capacitor } from '@capacitor/core';
import { bakedNativeProductApp } from '../productApps';
import { applyThemeBranding } from './themeBranding';
import { applyNativeThemeChrome } from './nativeThemeChrome';

export type ThemeMode = 'dark' | 'light';

export {
  THEME_ICON_BACKGROUNDS,
  THEME_BROWSER_COLORS,
  applyThemeBranding,
  themeChromeColor,
  themeIconAssetPath,
} from './themeBranding';

export const THEME_MODES: ThemeMode[] = ['dark', 'light'];

export const THEME_LABELS: Record<ThemeMode, string> = {
  dark: 'Dark',
  light: 'Light',
};

/** Default for the website — field-readable light UI. */
export const DEFAULT_THEME: ThemeMode = 'light';

/** Hire / Work APKs default to dark to match the black launcher. */
export const DEFAULT_NATIVE_THEME: ThemeMode = 'dark';

/** Staff APK is a white app with a black logo, so it opens in light theme. */
export const DEFAULT_STAFF_NATIVE_THEME: ThemeMode = 'light';

export function defaultThemeForPlatform(): ThemeMode {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  if (bakedNativeProductApp() === 'staff') return DEFAULT_STAFF_NATIVE_THEME;
  if (Capacitor.isNativePlatform()) return DEFAULT_NATIVE_THEME;
  return DEFAULT_THEME;
}

const LEGACY_STORAGE_KEY = 'guardr_theme_mode';

/** Legacy shade theme — migrated to light on read. */
const LEGACY_THEME_ALIASES: Record<string, ThemeMode> = {
  grey: 'light',
};

function userThemeKey(userId: string): string {
  return `${LEGACY_STORAGE_KEY}_${userId}`;
}

export function normalizeThemeMode(value: string | null | undefined): ThemeMode | null {
  if (!value) return null;
  if (value in LEGACY_THEME_ALIASES) return LEGACY_THEME_ALIASES[value];
  if (value === 'dark' || value === 'light') return value;
  return null;
}

export function hasPerUserThemePreference(userId: string): boolean {
  return normalizeThemeMode(localStorage.getItem(userThemeKey(userId))) !== null;
}

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === 'dark' || value === 'light';
}

export function loadTheme(userId?: string | null): ThemeMode {
  if (userId) {
    const perUser = normalizeThemeMode(localStorage.getItem(userThemeKey(userId)));
    if (perUser) return perUser;
  }
  const legacy = normalizeThemeMode(localStorage.getItem(LEGACY_STORAGE_KEY));
  if (legacy) return legacy;
  return defaultThemeForPlatform();
}

export function saveTheme(mode: ThemeMode, userId?: string | null): void {
  localStorage.setItem(LEGACY_STORAGE_KEY, mode);
  if (userId) localStorage.setItem(userThemeKey(userId), mode);
}

/** Apply theme class to <html> so every screen inherits background, text, and surfaces */
export function applyThemeToDocument(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  for (const m of THEME_MODES) {
    html.classList.remove(`theme-${m}`);
  }
  html.classList.remove('theme-grey');
  html.classList.add(`theme-${mode}`);
  html.dataset.theme = mode;
  html.style.colorScheme = mode === 'light' ? 'light' : 'dark';
  applyThemeBranding(mode);
  void applyNativeThemeChrome(mode);
}

/** Read active theme from the document root (for maps, etc.) */
export function readThemeFromDocument(): ThemeMode {
  if (typeof document === 'undefined') return DEFAULT_THEME;
  const fromDataset = normalizeThemeMode(document.documentElement.dataset.theme);
  if (fromDataset) return fromDataset;
  for (const m of THEME_MODES) {
    if (document.documentElement.classList.contains(`theme-${m}`)) return m;
  }
  return defaultThemeForPlatform();
}
