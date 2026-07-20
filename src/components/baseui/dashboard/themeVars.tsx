import { useEffect } from 'react';
import { useStyletron } from 'baseui';

/**
 * Syncs Guardr × Base Web theme tokens to CSS custom properties.
 * Hybrid Tailwind/CSS screens consume the same values as Base Web components.
 */
export function UberThemeVars() {
  const [, theme] = useStyletron();

  useEffect(() => {
    const root = document.documentElement;
    const { colors } = theme;

    // Accent (black in light, white in dark — real Uber)
    root.style.setProperty('--uber-accent', colors.accent);
    root.style.setProperty('--uber-accent-hover', colors.accent600 ?? colors.accent);
    root.style.setProperty('--uber-accent-50', colors.accent50);
    root.style.setProperty('--uber-accent-100', colors.accent100);
    root.style.setProperty('--uber-accent-200', colors.accent200 ?? colors.accent100);

    // Surfaces
    root.style.setProperty('--uber-bg', colors.backgroundPrimary);
    root.style.setProperty('--uber-surface', colors.backgroundSecondary);
    root.style.setProperty('--uber-elevated', colors.backgroundTertiary ?? colors.backgroundSecondary);

    // Text
    root.style.setProperty('--uber-text', colors.contentPrimary);
    root.style.setProperty('--uber-text-muted', colors.contentSecondary);

    // Borders
    root.style.setProperty('--uber-border', colors.borderOpaque);

    // Status
    root.style.setProperty('--uber-positive', colors.positive);
    root.style.setProperty('--uber-negative', colors.negative);
    root.style.setProperty('--uber-warning', colors.warning);

    // Brand bridges — keep strict black/white inversion in sync with CSS tokens
    root.style.setProperty('--brand-primary', colors.accent);
    root.style.setProperty('--brand-primary-hover', colors.accent600 ?? colors.accent);
    root.style.setProperty('--brand-accent', colors.accent);
    root.style.setProperty('--brand-accent-text', colors.buttonPrimaryText);
    root.style.setProperty('--brand-bg', colors.backgroundPrimary);
    root.style.setProperty('--brand-bg-sec', colors.backgroundSecondary);
    root.style.setProperty('--brand-surface', colors.backgroundPrimary);
    root.style.setProperty('--brand-elevated', colors.backgroundTertiary ?? colors.backgroundSecondary);
    root.style.setProperty('--brand-border', colors.borderOpaque);
    root.style.setProperty('--brand-text', colors.contentPrimary);
    root.style.setProperty('--brand-text-muted', colors.contentSecondary);
    root.style.setProperty('--brand-chrome', colors.backgroundPrimary);
    root.style.setProperty('--brand-chrome-deep', colors.backgroundSecondary);
    root.style.setProperty('--brand-chrome-text', colors.contentPrimary);
    root.style.setProperty('--brand-chrome-muted', colors.contentSecondary);
    root.style.setProperty('--brand-chrome-border', colors.borderOpaque);
  }, [theme]);

  return null;
}
