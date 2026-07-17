import { useEffect } from 'react';
import { useStyletron } from 'baseui';

/** Sync Base Web theme tokens to CSS custom properties for hybrid Tailwind screens. */
export function UberThemeVars() {
  const [, theme] = useStyletron();

  useEffect(() => {
    const root = document.documentElement;
    const { colors } = theme;
    root.style.setProperty('--uber-accent', colors.accent);
    root.style.setProperty('--uber-accent-50', colors.accent50);
    root.style.setProperty('--uber-accent-100', colors.accent100);
    root.style.setProperty('--uber-bg', colors.backgroundPrimary);
    root.style.setProperty('--uber-surface', colors.backgroundSecondary);
    root.style.setProperty('--uber-text', colors.contentPrimary);
    root.style.setProperty('--uber-text-muted', colors.contentSecondary);
    root.style.setProperty('--uber-border', colors.borderOpaque);
    root.style.setProperty('--uber-positive', colors.positive);
    root.style.setProperty('--uber-negative', colors.negative);
    root.style.setProperty('--uber-warning', colors.warning);
  }, [theme]);

  return null;
}
