import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_STAFF_NATIVE_THEME,
  DEFAULT_THEME,
  defaultThemeForPlatform,
  hasPerUserThemePreference,
  loadTheme,
  normalizeThemeMode,
  saveTheme,
} from './theme.ts';
import { THEME_ICON_BACKGROUNDS, themeChromeColor, themeIconAssetPath } from './themeBranding.ts';

describe('theme', () => {
  it('defaults to light (white icon background)', () => {
    assert.equal(DEFAULT_THEME, 'light');
  });

  it('defaults Staff APK to light with no saved preference', () => {
    const previous = globalThis.window;
    globalThis.window = { __GUARDR_NATIVE_PRODUCT_APP__: 'staff' } as Window & typeof globalThis;
    try {
      assert.equal(DEFAULT_STAFF_NATIVE_THEME, 'light');
      assert.equal(defaultThemeForPlatform(), 'light');
    } finally {
      globalThis.window = previous;
    }
  });

  it('keeps website / unlabeled defaults light when Staff is not baked in', () => {
    const previous = globalThis.window;
    globalThis.window = {} as Window & typeof globalThis;
    try {
      assert.equal(defaultThemeForPlatform(), 'light');
    } finally {
      globalThis.window = previous;
    }
  });

  it('migrates legacy grey/shade preference to light', () => {
    assert.equal(normalizeThemeMode('grey'), 'light');
    assert.equal(normalizeThemeMode('dark'), 'dark');
    assert.equal(normalizeThemeMode('light'), 'light');
    assert.equal(normalizeThemeMode('shade'), null);
  });

  it('persists theme choice locally', () => {
    const storage = new Map<string, string>();
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
      },
    });
    try {
      saveTheme('dark', 'user-1');
      assert.equal(loadTheme('user-1'), 'dark');
      storage.set('guardr_theme_mode_user-1', 'grey');
      assert.equal(loadTheme('user-1'), 'light');
      assert.equal(hasPerUserThemePreference('user-1'), true);
      assert.equal(hasPerUserThemePreference('user-2'), false);
    } finally {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: original,
      });
    }
  });
});

describe('themeBranding', () => {
  it('maps theme modes to icon asset paths', () => {
    assert.equal(themeIconAssetPath('light', 'favicon'), '/icons/favicon-light.png');
    assert.equal(themeIconAssetPath('dark', 'apple-touch-icon'), '/icons/apple-touch-icon-dark.png');
    assert.equal(THEME_ICON_BACKGROUNDS.light, '#000000');
    assert.equal(THEME_ICON_BACKGROUNDS.dark, '#000000');
    assert.equal(themeChromeColor('light', 'staff'), '#FFFFFF');
    assert.equal(themeChromeColor('light', 'guard'), '#FFFFFF');
    assert.equal(themeChromeColor('dark', 'staff'), '#000000');
    assert.equal(themeChromeColor('light', 'client'), '#000000');
  });
});
