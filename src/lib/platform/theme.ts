import { applyThemeBranding } from './themeBranding';
import { applyNativeThemeChrome } from './nativeThemeChrome';

export type ThemeMode = 'dark' | 'light' | 'grey';

export {
  THEME_ICON_BACKGROUNDS,
  THEME_BROWSER_COLORS,
  applyThemeBranding,
  themeIconAssetPath,
} from './themeBranding';

export const THEME_MODES: ThemeMode[] = ['dark', 'light', 'grey'];

export const THEME_LABELS: Record<ThemeMode, string> = {
  dark: 'Dark',
  light: 'Light',
  grey: 'Shade',
};

/** Default — light matches the white app icon background and field-readable UI. */
export const DEFAULT_THEME: ThemeMode = 'light';

const LEGACY_STORAGE_KEY = 'guardr_theme_mode';

function userThemeKey(userId: string): string {
  return `${LEGACY_STORAGE_KEY}_${userId}`;
}

export function hasPerUserThemePreference(userId: string): boolean {
  return isThemeMode(localStorage.getItem(userThemeKey(userId)));
}

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === 'dark' || value === 'light' || value === 'grey';
}

export function loadTheme(userId?: string | null): ThemeMode {
  if (userId) {
    const perUser = localStorage.getItem(userThemeKey(userId));
    if (isThemeMode(perUser)) return perUser;
  }
  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (isThemeMode(legacy)) return legacy;
  return DEFAULT_THEME;
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
  html.classList.add(`theme-${mode}`);
  html.dataset.theme = mode;
  html.style.colorScheme = mode === 'light' || mode === 'grey' ? 'light' : 'dark';
  applyThemeBranding(mode);
  void applyNativeThemeChrome(mode);
}

/** Read active theme from the document root (for maps, etc.) */
export function readThemeFromDocument(): ThemeMode {
  if (typeof document === 'undefined') return DEFAULT_THEME;
  const fromDataset = document.documentElement.dataset.theme;
  if (isThemeMode(fromDataset)) return fromDataset;
  for (const m of THEME_MODES) {
    if (document.documentElement.classList.contains(`theme-${m}`)) return m;
  }
  return DEFAULT_THEME;
}
