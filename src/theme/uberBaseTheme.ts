import { DarkTheme, LightTheme } from 'baseui';
import type { Theme } from 'baseui';
import type { ThemeMode } from '../lib/platform/theme';

/** Stock Uber Base Web themes — no custom brand overrides during /uberit migration. */
export const uberLightTheme: Theme = LightTheme;
export const uberDarkTheme: Theme = DarkTheme;

export function uberThemeForMode(mode: ThemeMode): Theme {
  return mode === 'light' ? uberLightTheme : uberDarkTheme;
}
