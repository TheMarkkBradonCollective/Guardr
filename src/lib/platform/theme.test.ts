import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_THEME, hasPerUserThemePreference, loadTheme, saveTheme } from './theme.ts';
import { THEME_ICON_BACKGROUNDS, themeIconAssetPath } from './themeBranding.ts';

describe('theme', () => {
  it('defaults to light (white icon background)', () => {
    assert.equal(DEFAULT_THEME, 'light');
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
      saveTheme('grey', 'user-1');
      assert.equal(loadTheme('user-1'), 'grey');
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
    assert.equal(THEME_ICON_BACKGROUNDS.light, '#FFFFFF');
    assert.equal(THEME_ICON_BACKGROUNDS.dark, '#000000');
  });
});
