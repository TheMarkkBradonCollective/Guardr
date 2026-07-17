/**
 * Guardr Base Web Theme — real Uber app visual language.
 *
 * Black primary actions on white/light-gray surfaces.
 * Matches the actual Uber mobile product aesthetic from the UI kit:
 *   - Black (#000) CTAs, nav, map pins
 *   - White (#FFF) cards, sheets, backgrounds
 *   - #F6F6F6 secondary surfaces and inputs
 *   - #767676 muted text, captions
 *   - No colored accent — everything is black / white / gray
 */

import { createLightTheme, createDarkTheme, LightTheme, DarkTheme } from 'baseui';
import type { Theme } from 'baseui';
import type { ThemeMode } from '../lib/platform/theme';

// ─── Guardr / Uber accent ramps ─────────────────────────────────────────────
// Using near-black charcoal as the "accent" so Base Web accent slots
// render with the same Uber look instead of blue.
export const GUARDR_ACCENT_LIGHT = {
  accent:   '#000000',   // primary CTAs, active states, links
  accent50: '#F6F6F6',   // very light tinted background
  accent100: '#EEEEEE',
  accent200: '#CCCCCC',
  accent300: '#9E9E9E',
  accent400: '#6B6B6B',
  accent500: '#545454',
  accent600: '#333333',
  accent700: '#1A1A1A',
} as const;

export const GUARDR_ACCENT_DARK = {
  accent:   '#FFFFFF',
  accent50: '#1A1A1A',
  accent100: '#2B2B2B',
  accent200: '#3D3D3D',
  accent300: '#545454',
  accent400: '#767676',
  accent500: '#9E9E9E',
  accent600: '#CCCCCC',
  accent700: '#E2E2E2',
} as const;

const FONT_FAMILY = '"Uber Move Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

// ─── Light theme ──────────────────────────────────────────────────────────────
export const guardrLightTheme: Theme = createLightTheme({
  primaryFontFamily: FONT_FAMILY,
  colors: {
    ...GUARDR_ACCENT_LIGHT,
    // Primary button: solid black → white text
    buttonPrimaryFill:   '#000000',
    buttonPrimaryText:   '#FFFFFF',
    buttonPrimaryHover:  '#333333',
    buttonPrimaryActive: '#1A1A1A',
    // Links: black underline
    linkText:    '#000000',
    linkVisited: '#333333',
    linkHover:   '#000000',
    linkActive:  '#000000',
  },
});

// ─── Dark theme ───────────────────────────────────────────────────────────────
export const guardrDarkTheme: Theme = createDarkTheme({
  primaryFontFamily: FONT_FAMILY,
  colors: {
    ...GUARDR_ACCENT_DARK,
    buttonPrimaryFill:   '#FFFFFF',
    buttonPrimaryText:   '#000000',
    buttonPrimaryHover:  '#E2E2E2',
    buttonPrimaryActive: '#CCCCCC',
    linkText:    '#FFFFFF',
    linkVisited: '#CCCCCC',
    linkHover:   '#FFFFFF',
    linkActive:  '#FFFFFF',
  },
});

export function guardrThemeForMode(mode: ThemeMode): Theme {
  return mode === 'dark' ? guardrDarkTheme : guardrLightTheme;
}

// Backward compat
export const uberLightTheme  = guardrLightTheme;
export const uberDarkTheme   = guardrDarkTheme;
export const uberThemeForMode = guardrThemeForMode;
