import { Capacitor } from '@capacitor/core';
import { THEME_BROWSER_COLORS } from './themeBranding';
import type { ThemeMode } from './theme';

/** Sync Android status bar (and related native chrome) with the active theme. */
export async function applyNativeThemeChrome(mode: ThemeMode): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    const lightChrome = mode === 'light' || mode === 'grey';
    await StatusBar.setStyle({ style: lightChrome ? Style.Light : Style.Dark });
    await StatusBar.setBackgroundColor({ color: THEME_BROWSER_COLORS[mode] });
  } catch (error) {
    console.warn('[native] theme chrome update failed:', error);
  }
}
