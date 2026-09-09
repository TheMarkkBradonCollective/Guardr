import { Capacitor } from '@capacitor/core';
import { bakedNativeProductApp } from '../productApps';
import { themeChromeColor } from './themeBranding';
import type { ThemeMode } from './theme';

/** Sync Android status bar (and related native chrome) with the active theme. */
export async function applyNativeThemeChrome(mode: ThemeMode): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    const color = themeChromeColor(mode, bakedNativeProductApp());
    const darkIcons = color.toUpperCase() === '#FFFFFF';
    await StatusBar.setStyle({ style: darkIcons ? Style.Light : Style.Dark });
    await StatusBar.setBackgroundColor({ color });
  } catch (error) {
    console.warn('[native] theme chrome update failed:', error);
  }
}
