import { useEffect } from 'react';
import { useStyletron } from 'baseui';

/**
 * Syncs Guardr × Base Web theme tokens to CSS custom properties
 * so that hybrid Tailwind/CSS screens can consume the same values.
 */
export function UberThemeVars() {
  const [, theme] = useStyletron();

  useEffect(() => {
    const root = document.documentElement;
    const { colors } = theme;

    // Accent (sage green)
    root.style.setProperty('--uber-accent', colors.accent);
    root.style.setProperty('--uber-accent-hover', colors.accent600 ?? colors.accent);
    root.style.setProperty('--uber-accent-50', colors.accent50);
    root.style.setProperty('--uber-accent-100', colors.accent100);
    root.style.setProperty('--uber-accent-200', colors.accent200 ?? colors.accent100);

    // Backgrounds
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

    // Brand bridges
    root.style.setProperty('--brand-primary', colors.accent);
    root.style.setProperty('--brand-primary-hover', colors.accent600 ?? colors.accent);
    root.style.setProperty('--brand-accent', colors.accent);
    root.style.setProperty('--brand-bg', colors.backgroundPrimary);
    root.style.setProperty('--brand-surface', colors.backgroundPrimary);
    root.style.setProperty('--brand-elevated', colors.backgroundSecondary);
    root.style.setProperty('--brand-border', colors.borderOpaque);
    root.style.setProperty('--brand-text', colors.contentPrimary);
    root.style.setProperty('--brand-text-muted', colors.contentSecondary);
  }, [theme]);

  return null;
}
