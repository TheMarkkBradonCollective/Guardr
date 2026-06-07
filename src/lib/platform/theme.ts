export type ThemeMode = 'dark' | 'light' | 'grey';

export const THEME_MODES: ThemeMode[] = ['dark', 'light', 'grey'];

/** Sage-green shell default — dark mode with sage accent */
export const DEFAULT_THEME: ThemeMode = 'dark';

const LEGACY_STORAGE_KEY = 'guardr_theme_mode';

function userThemeKey(userId: string): string {
  return `${LEGACY_STORAGE_KEY}_${userId}`;
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

export function applyThemeToDocument(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = mode;
}
