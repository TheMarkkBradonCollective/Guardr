import { createDarkTheme, createLightTheme } from 'baseui';
import type { Theme } from 'baseui';
import type { ThemeMode } from '../lib/platform/theme';
import { GUARDR_ACCENT_DARK, GUARDR_ACCENT_LIGHT } from './guardrAccentPalette';

const LIGHT_SURFACES = {
  primaryA: '#000000',
  primaryB: '#FFFFFF',
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F2F4F2',
  backgroundTertiary: '#F7F9F7',
  backgroundInverse: '#000000',
  contentPrimary: '#000000',
  contentSecondary: '#3D3D3D',
  contentTertiary: '#6B6B6B',
  contentInverse: '#FFFFFF',
  borderOpaque: '#E2E8E2',
  borderTransparent: 'rgba(0, 0, 0, 0.08)',
  borderSelected: '#5E7B61',
};

const DARK_SURFACES = {
  primaryA: '#F5F5F5',
  primaryB: '#000000',
  backgroundPrimary: '#000000',
  backgroundSecondary: '#111111',
  backgroundTertiary: '#1A1A1A',
  backgroundInverse: '#FFFFFF',
  contentPrimary: '#F5F5F5',
  contentSecondary: '#9CA3AF',
  contentTertiary: '#6B6B6B',
  contentInverse: '#000000',
  borderOpaque: '#242424',
  borderTransparent: 'rgba(255, 255, 255, 0.12)',
  borderSelected: '#6B8F6E',
};

const STATUS_LIGHT = {
  positive: '#3F7D4F',
  positive400: '#3F7D4F',
  negative: '#DC2626',
  negative400: '#DC2626',
  warning: '#946219',
  warning400: '#946219',
};

const STATUS_DARK = {
  positive: '#7DBB82',
  positive400: '#7DBB82',
  negative: '#F87171',
  negative400: '#F87171',
  warning: '#FBBF24',
  warning400: '#FBBF24',
};

const RADIUS_OVERRIDES = {
  borders: {
    radius100: '4px',
    radius200: '8px',
    radius300: '12px',
    radius400: '14px',
    radius500: '18px',
  },
};

export const guardrLightTheme: Theme = createLightTheme({
  colors: {
    ...GUARDR_ACCENT_LIGHT,
    ...LIGHT_SURFACES,
    ...STATUS_LIGHT,
    buttonPrimaryFill: GUARDR_ACCENT_LIGHT.accent,
    buttonPrimaryText: '#FFFFFF',
    buttonPrimaryHover: GUARDR_ACCENT_LIGHT.accent600,
    buttonPrimaryActive: GUARDR_ACCENT_LIGHT.accent700,
    buttonSecondaryFill: '#FFFFFF',
    buttonSecondaryText: '#000000',
    buttonSecondaryHover: '#F2F4F2',
    buttonSecondaryActive: '#E2E8E2',
    tickFillSelected: GUARDR_ACCENT_LIGHT.accent,
    tickFillSelectedHover: GUARDR_ACCENT_LIGHT.accent600,
    tickMarkFill: '#FFFFFF',
    inputBorder: '#E2E8E2',
    inputFill: '#FFFFFF',
    inputFillActive: '#FFFFFF',
    inputFillPositive: '#F2F5F2',
    inputFillNegative: '#FEF2F2',
    inputTextDisabled: '#9CA3AF',
    linkText: GUARDR_ACCENT_LIGHT.accent600,
    linkVisited: GUARDR_ACCENT_LIGHT.accent700,
  },
  ...RADIUS_OVERRIDES,
});

export const guardrDarkTheme: Theme = createDarkTheme({
  colors: {
    ...GUARDR_ACCENT_DARK,
    ...DARK_SURFACES,
    ...STATUS_DARK,
    buttonPrimaryFill: GUARDR_ACCENT_DARK.accent,
    buttonPrimaryText: '#FFFFFF',
    buttonPrimaryHover: GUARDR_ACCENT_DARK.accent500,
    buttonPrimaryActive: GUARDR_ACCENT_DARK.accent600,
    buttonSecondaryFill: '#111111',
    buttonSecondaryText: '#F5F5F5',
    buttonSecondaryHover: '#1A1A1A',
    buttonSecondaryActive: '#242424',
    tickFillSelected: GUARDR_ACCENT_DARK.accent,
    tickFillSelectedHover: GUARDR_ACCENT_DARK.accent500,
    tickMarkFill: '#FFFFFF',
    inputBorder: '#242424',
    inputFill: '#111111',
    inputFillActive: '#111111',
    inputFillPositive: '#1A241B',
    inputFillNegative: '#2A1515',
    inputTextDisabled: '#6B6B6B',
    linkText: GUARDR_ACCENT_DARK.accent,
    linkVisited: GUARDR_ACCENT_DARK.accent500,
  },
  ...RADIUS_OVERRIDES,
});

export function guardrThemeForMode(mode: ThemeMode): Theme {
  return mode === 'light' ? guardrLightTheme : guardrDarkTheme;
}
