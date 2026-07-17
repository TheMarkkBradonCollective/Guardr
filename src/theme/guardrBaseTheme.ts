/**
 * Guardr Base Web Theme — Uber Base Design System with Guardr brand accent.
 *
 * Uses stock Uber Base Web light/dark themes as foundation and applies
 * Guardr's sage-green accent palette as the primary brand colour.
 *
 * Component token reference:
 *   https://github.com/uber/baseweb/blob/master/src/themes/creator.ts
 */

import { createLightTheme, createDarkTheme, LightTheme, DarkTheme } from 'baseui';
import type { Theme } from 'baseui';
import type { ThemeMode } from '../lib/platform/theme';

// ─── Guardr accent palette ────────────────────────────────────────────────────
export const GUARDR_ACCENT_LIGHT = {
  accent: '#4A6B4E',
  accent50: '#F2F5F2',
  accent100: '#E2E8E2',
  accent200: '#C5D4C6',
  accent300: '#9DB3A0',
  accent400: '#7A947D',
  accent500: '#5E7B61',
  accent600: '#4A6B4E',
  accent700: '#3A5540',
} as const;

export const GUARDR_ACCENT_DARK = {
  accent: '#7AAE7F',
  accent50: '#1A241B',
  accent100: '#243328',
  accent200: '#354D38',
  accent300: '#4A6B4E',
  accent400: '#6B8F6E',
  accent500: '#7AAE7F',
  accent600: '#5A7A5D',
  accent700: '#4A6B4E',
} as const;

const FONT_FAMILY = '"Uber Move Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

// ─── Light theme ──────────────────────────────────────────────────────────────
export const guardrLightTheme: Theme = createLightTheme({
  primaryFontFamily: FONT_FAMILY,
  colors: {
    ...GUARDR_ACCENT_LIGHT,
    // Primary buttons: Uber black CTA pattern
    buttonPrimaryFill: LightTheme.colors.contentPrimary,
    buttonPrimaryText: LightTheme.colors.contentInversePrimary,
    buttonPrimaryHover: '#222222',
    buttonPrimaryActive: '#333333',
    // Links
    linkText: GUARDR_ACCENT_LIGHT.accent,
    linkVisited: GUARDR_ACCENT_LIGHT.accent600,
    linkHover: GUARDR_ACCENT_LIGHT.accent700,
    linkActive: GUARDR_ACCENT_LIGHT.accent700,
  },
});

// ─── Dark theme ───────────────────────────────────────────────────────────────
export const guardrDarkTheme: Theme = createDarkTheme({
  primaryFontFamily: FONT_FAMILY,
  colors: {
    ...GUARDR_ACCENT_DARK,
    buttonPrimaryFill: DarkTheme.colors.contentPrimary,
    buttonPrimaryText: DarkTheme.colors.contentInversePrimary,
    buttonPrimaryHover: '#E2E2E2',
    buttonPrimaryActive: '#C4C4C4',
    linkText: GUARDR_ACCENT_DARK.accent,
    linkVisited: GUARDR_ACCENT_DARK.accent400,
    linkHover: GUARDR_ACCENT_DARK.accent500,
    linkActive: GUARDR_ACCENT_DARK.accent500,
  },
});

/** Return the appropriate Guardr theme for the current mode. */
export function guardrThemeForMode(mode: ThemeMode): Theme {
  return mode === 'dark' ? guardrDarkTheme : guardrLightTheme;
}

// ─── Legacy alias (keep existing imports working) ─────────────────────────────
/** @deprecated use guardrThemeForMode */
export const uberLightTheme = guardrLightTheme;
/** @deprecated use guardrThemeForMode */
export const uberDarkTheme = guardrDarkTheme;
/** @deprecated use guardrThemeForMode */
export const uberThemeForMode = guardrThemeForMode;
